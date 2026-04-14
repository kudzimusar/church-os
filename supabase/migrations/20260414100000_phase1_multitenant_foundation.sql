-- ══════════════════════════════════════════════════════════════════════════════
-- Church OS — Phase 1: Multi-Tenancy Foundation
-- Steps 1.1 → 1.4 in one atomic migration. Rolls back entirely on any failure.
-- ══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1.1 — Add church_slug anchor to organizations
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS church_slug TEXT;

-- Backfill all 7 known orgs
UPDATE public.organizations SET church_slug = 'jkc-devotion-app'   WHERE name = 'JKC Church';
UPDATE public.organizations SET church_slug = 'test-osaka'          WHERE name = 'Test Church Osaka';
UPDATE public.organizations SET church_slug = 'test-tokyo'          WHERE name = 'Test Church Tokyo';
UPDATE public.organizations SET church_slug = 'grace-fellowship'    WHERE name = 'Grace Fellowship';
UPDATE public.organizations SET church_slug = 'grace-fellowship-ai' WHERE name = 'Grace Fellowship AI';
UPDATE public.organizations SET church_slug = 'test-church'         WHERE id   = '00000000-0000-0000-0000-000000000001';
UPDATE public.organizations SET church_slug = 'corporate'           WHERE id   = '00000000-0000-0000-0000-000000000000';

-- Guard: abort the entire migration if any org is still missing a slug
DO $$
DECLARE
  null_count INT;
  missing_names TEXT;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM public.organizations
  WHERE church_slug IS NULL;

  IF null_count > 0 THEN
    SELECT string_agg(name, ', ') INTO missing_names
    FROM public.organizations
    WHERE church_slug IS NULL;
    RAISE EXCEPTION 'church_slug backfill incomplete — % org(s) still NULL: [%]', null_count, missing_names;
  END IF;

  RAISE NOTICE 'church_slug backfill verified — all orgs populated.';
END $$;

-- Safe to enforce constraints now
ALTER TABLE public.organizations
  ALTER COLUMN church_slug SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'organizations_church_slug_key'
  ) THEN
    ALTER TABLE public.organizations
      ADD CONSTRAINT organizations_church_slug_key UNIQUE (church_slug);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1.2 — Fix public_inquiries RLS (live data leak — qual: true)
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop the two globally-readable SELECT policies
DROP POLICY IF EXISTS "connect_public_select"                           ON public.public_inquiries;
DROP POLICY IF EXISTS "Allow authenticated admins to read public_inquiries" ON public.public_inquiries;

-- Helper: returns all org_ids the current user belongs to (SECURITY DEFINER so RLS doesn't recurse)
CREATE OR REPLACE FUNCTION public.get_user_org_ids()
RETURNS SETOF UUID LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT org_id FROM public.org_members WHERE user_id = auth.uid();
$$;

-- Replacement: org-scoped read — admins see only their church's inquiries
CREATE POLICY "org_scoped_inquiry_read" ON public.public_inquiries
  FOR SELECT USING (
    org_id IN (SELECT public.get_user_org_ids())
  );

-- Note: connect_public_insert and admin_read_inquiries are intentionally kept.
-- connect_public_insert — allows anonymous visitors to submit the Kingdom Connect form
-- admin_read_inquiries  — allows service_role (edge functions) to read all inquiries

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1.3 — Consolidate attendance_records RLS (9 overlapping → 3 clean)
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins manage org attendance"              ON public.attendance_records;
DROP POLICY IF EXISTS "Admins read all attendance"                ON public.attendance_records;
DROP POLICY IF EXISTS "Allow guest inserts on attendance_records" ON public.attendance_records;
DROP POLICY IF EXISTS "Allow guest select own attendance_records" ON public.attendance_records;
DROP POLICY IF EXISTS "User-Staff Access"                         ON public.attendance_records;
DROP POLICY IF EXISTS "Users manage own attendance"               ON public.attendance_records;
DROP POLICY IF EXISTS "Users read own attendance"                 ON public.attendance_records;
DROP POLICY IF EXISTS "Users view own attendance"                 ON public.attendance_records;
DROP POLICY IF EXISTS "scoped_attendance_records_admin"           ON public.attendance_records;
DROP POLICY IF EXISTS "scoped_attendance_records_member"          ON public.attendance_records;

-- Policy 1: authenticated members see and manage their own records
CREATE POLICY "member_own_attendance" ON public.attendance_records
  FOR ALL USING (auth.uid() = user_id);

-- Policy 2: org admins manage all records within their org only
CREATE POLICY "admin_org_attendance" ON public.attendance_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.user_id  = auth.uid()
        AND om.org_id   = attendance_records.org_id
        AND om.role = ANY(ARRAY['shepherd','pastor','admin','owner','super_admin'])
    )
  );

-- Policy 3: anonymous/guest check-in inserts (kiosk mode — no user_id, device_id required)
CREATE POLICY "guest_attendance_insert" ON public.attendance_records
  FOR INSERT WITH CHECK (user_id IS NULL AND device_id IS NOT NULL);

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1.4 — Guest-to-member merge (close the confirmed data pipeline gap)
-- ─────────────────────────────────────────────────────────────────────────────

-- Add tracking column to link a converted inquiry to its profile
ALTER TABLE public.public_inquiries
  ADD COLUMN IF NOT EXISTS merged_profile_id UUID REFERENCES public.profiles(id);

-- Merge function: when a new profile is created, find any inquiry with the same
-- email + org and mark it as converted, linking the new profile ID
CREATE OR REPLACE FUNCTION public.merge_guest_to_member()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.public_inquiries
  SET
    merged_profile_id = NEW.id,
    status            = 'converted'
  WHERE email              = NEW.email
    AND org_id             = NEW.org_id
    AND merged_profile_id IS NULL;

  RETURN NEW;
END;
$$;

-- Drop and recreate to avoid duplicate trigger errors on re-runs
DROP TRIGGER IF EXISTS on_profile_created_merge_guest ON public.profiles;

CREATE TRIGGER on_profile_created_merge_guest
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.merge_guest_to_member();

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFICATION — Confirm state before committing
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  slug_count INT;
  inquiry_leak_count INT;
  attendance_policy_count INT;
BEGIN
  -- 1. All 7 orgs have slugs
  SELECT COUNT(*) INTO slug_count FROM public.organizations WHERE church_slug IS NOT NULL;
  RAISE NOTICE 'church_slug populated: % orgs', slug_count;

  -- 2. No more globally-readable inquiry policies
  SELECT COUNT(*) INTO inquiry_leak_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename  = 'public_inquiries'
    AND qual       = 'true'
    AND cmd        = 'SELECT';
  IF inquiry_leak_count > 0 THEN
    RAISE EXCEPTION 'Data leak not closed — % SELECT policies with qual=true remain on public_inquiries', inquiry_leak_count;
  END IF;
  RAISE NOTICE 'public_inquiries data leak: CLOSED';

  -- 3. Attendance policies consolidated to 3
  SELECT COUNT(*) INTO attendance_policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'attendance_records';
  RAISE NOTICE 'attendance_records policies: % (expected 3)', attendance_policy_count;
END $$;

COMMIT;
