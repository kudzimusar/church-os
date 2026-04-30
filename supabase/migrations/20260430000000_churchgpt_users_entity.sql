-- ============================================================
-- ChurchGPT Users — Dedicated entity table
-- ============================================================
-- ChurchGPT public subscribers are NOT church members.
-- They must never appear in any org's Shepherd / member views.
-- This migration:
--   1. Creates churchgpt_users (the correct home for these users)
--   2. Fixes handle_new_user trigger so source='churchgpt_public'
--      users get org_id=NULL in profiles and an entry in churchgpt_users
--      instead of being silently assigned to JKC's org.
--   3. Backfills any existing floating ChurchGPT auth users.
-- ============================================================

-- ── 1. churchgpt_users table ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.churchgpt_users (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email               text NOT NULL,
  display_name        text,
  subscription_tier   text NOT NULL DEFAULT 'starter',
  quota_used          integer NOT NULL DEFAULT 0,
  quota_limit         integer NOT NULL DEFAULT 50,
  converted_to_org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  source              text NOT NULL DEFAULT 'churchgpt_public',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.churchgpt_users ENABLE ROW LEVEL SECURITY;

-- Users can read/update only their own row
CREATE POLICY "churchgpt_users_self_read"
  ON public.churchgpt_users FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "churchgpt_users_self_update"
  ON public.churchgpt_users FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Service role (edge functions, triggers) can do anything
CREATE POLICY "churchgpt_users_service"
  ON public.churchgpt_users FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ── 2. Fix handle_new_user trigger ───────────────────────────
-- Previously: any user without org_id in metadata was silently
-- assigned to the JKC org (fa547adf-...). This polluted JKC's
-- Shepherd dashboard with ChurchGPT public signups.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source text;
  v_org_id uuid;
  v_name   text;
BEGIN
  v_source := new.raw_user_meta_data->>'source';
  v_name   := COALESCE(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  IF v_source = 'churchgpt_public' THEN
    -- ChurchGPT public user: org_id = NULL in profiles,
    -- create a churchgpt_users record instead of an org_members row.
    INSERT INTO public.profiles (id, name, email, org_id)
    VALUES (new.id, v_name, new.email, NULL)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.churchgpt_users (user_id, email, display_name, source)
    VALUES (new.id, new.email, v_name, 'churchgpt_public')
    ON CONFLICT (user_id) DO NOTHING;

  ELSE
    -- Normal church user: use org_id from metadata.
    -- DO NOT default to any specific org — if no org_id is provided
    -- the profile row is created with org_id = NULL and the calling
    -- code (onboarding-register edge function) will set it properly.
    v_org_id := (new.raw_user_meta_data->>'org_id')::uuid;

    INSERT INTO public.profiles (id, name, email, org_id)
    VALUES (new.id, v_name, new.email, v_org_id)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate the trigger (in case it was dropped or references old function signature)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 3. Backfill existing floating ChurchGPT auth users ───────
-- These are users whose raw_user_meta_data->>'source' = 'churchgpt_public'
-- but who never got a profiles row or a churchgpt_users row because
-- the trigger assigned them to JKC (or failed silently).
-- We insert their profiles (org_id = NULL) and churchgpt_users rows now.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT
      u.id,
      u.email,
      COALESCE(
        u.raw_user_meta_data->>'full_name',
        u.raw_user_meta_data->>'name',
        split_part(u.email, '@', 1)
      ) AS display_name
    FROM auth.users u
    WHERE u.raw_user_meta_data->>'source' = 'churchgpt_public'
  LOOP
    -- Ensure profile exists with org_id = NULL
    INSERT INTO public.profiles (id, name, email, org_id)
    VALUES (r.id, r.display_name, r.email, NULL)
    ON CONFLICT (id) DO UPDATE
      SET org_id = NULL
      WHERE profiles.org_id = 'fa547adf-f820-412f-9458-d6bade11517d'::uuid;
      -- only overwrite if it was wrongly assigned to JKC

    -- Ensure churchgpt_users entry exists
    INSERT INTO public.churchgpt_users (user_id, email, display_name, source)
    VALUES (r.id, r.email, r.display_name, 'churchgpt_public')
    ON CONFLICT (user_id) DO NOTHING;
  END LOOP;
END;
$$;

-- ── 4. Remove any org_members rows that were created for ChurchGPT users ─
-- Safety: only delete if the user's source is 'churchgpt_public'.
-- This ensures JKC never sees these users in the member list.
DELETE FROM public.org_members om
WHERE EXISTS (
  SELECT 1 FROM auth.users u
  WHERE u.id = om.user_id
    AND u.raw_user_meta_data->>'source' = 'churchgpt_public'
);
