-- Migration: 20260321000000_profile_schema_extension
-- Description: Add missing identity and referral columns to profiles to fix silent save failures.
-- Also add RLS for membership_requests to allow admins to manage them.

BEGIN;

-- 1. Extend Profiles table with missing identity fields
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS referral_source TEXT,
ADD COLUMN IF NOT EXISTS referral_name TEXT,
ADD COLUMN IF NOT EXISTS years_in_japan INT,
ADD COLUMN IF NOT EXISTS language_proficiency TEXT,
ADD COLUMN IF NOT EXISTS church_background TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS interests TEXT[],
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Audit RLS for membership_requests
-- Ensure only admins or the user themselves can see/manage requests

ALTER TABLE public.membership_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own membership requests" ON public.membership_requests;
CREATE POLICY "Users can view own membership requests" ON public.membership_requests
FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own membership requests" ON public.membership_requests;
CREATE POLICY "Users can insert own membership requests" ON public.membership_requests
FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all membership requests" ON public.membership_requests;
CREATE POLICY "Admins can manage all membership requests" ON public.membership_requests
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur 
        JOIN public.roles r ON ur.role_name = r.name
        WHERE ur.user_id = auth.uid() AND r.level >= 50
    )
);

-- 3. Update vw_user_identity to include new fields
DROP VIEW IF EXISTS public.vw_user_identity;
CREATE OR REPLACE VIEW public.vw_user_identity AS
SELECT 
  p.*,
  COALESCE(
    (SELECT array_agg(role_name) FROM public.user_roles WHERE user_id = p.id AND status = 'active'),
    ARRAY[]::TEXT[]
  ) as roles,
  om.discipleship_score,
  om.stage as legacy_stage,
  om.role as legacy_role,
  EXISTS (SELECT 1 FROM public.membership_requests mr WHERE mr.user_id = p.id AND mr.status = 'pending') as has_pending_request
FROM public.profiles p
LEFT JOIN public.org_members om ON p.id = om.user_id;

COMMIT;
