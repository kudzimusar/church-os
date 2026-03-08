-- Migration: 20260316000001_single_identity_and_directory
-- Description: Implement Single Identity Model (SIM), enforce governance rules, and fix Directory Foreign Keys

BEGIN;

-- 1. SCHEMA HARDENING: Fix Foreign Keys for Member Directory
-- These ensure that joined queries in the Admin Dashboard work correctly and performantly

ALTER TABLE public.org_members
DROP CONSTRAINT IF EXISTS fk_org_members_profiles;
ALTER TABLE public.org_members
ADD CONSTRAINT fk_org_members_profiles FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.member_milestones
DROP CONSTRAINT IF EXISTS fk_member_milestones_profiles;
ALTER TABLE public.member_milestones
ADD CONSTRAINT fk_member_milestones_profiles FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.ministry_members
DROP CONSTRAINT IF EXISTS fk_ministry_members_profiles;
ALTER TABLE public.ministry_members
ADD CONSTRAINT fk_ministry_members_profiles FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.member_skills
DROP CONSTRAINT IF EXISTS fk_member_skills_profiles;
ALTER TABLE public.member_skills
ADD CONSTRAINT fk_member_skills_profiles FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


-- 2. SINGLE IDENTITY MODEL (SIM): Authority Columns
-- Move identity state to the authoritative 'profiles' table

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS growth_stage TEXT DEFAULT 'visitor',
ADD COLUMN IF NOT EXISTS member_id TEXT;


-- 3. DATA SYNC: Unify Identity States
-- Migrate legacy stage data to the new authoritative growth_stage column

UPDATE public.profiles p
SET 
  growth_stage = COALESCE(om.stage, 'visitor'),
  org_id = COALESCE(p.org_id, om.org_id)
FROM public.org_members om
WHERE p.id = om.user_id;


-- 4. GOVERNANCE LOGIC: Automatic Membership Promotion
-- Ensures Rule: "Admin promotion must update membership state if required"

CREATE OR REPLACE FUNCTION public.fn_sync_profile_on_role_change()
RETURNS TRIGGER AS $$
DECLARE
  v_role_level INT;
BEGIN
  -- Get role level from the roles registry
  SELECT level INTO v_role_level FROM public.roles WHERE name = NEW.role_name;
  
  -- If role level is high (Leader/Admin), automatically ensure profile is 'member'
  IF v_role_level >= 50 THEN
    UPDATE public.profiles
    SET 
      membership_status = 'member',
      growth_stage = CASE 
        WHEN v_role_level >= 80 THEN 'leader'
        ELSE 'disciple'
      END
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger enforcement
DROP TRIGGER IF EXISTS tr_sync_profile_on_role_change ON public.user_roles;
CREATE TRIGGER tr_sync_profile_on_role_change
AFTER INSERT OR UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_profile_on_role_change();


-- 5. ANALYTICS VIEW: Unified Identity View
-- Single source for reporting modules (Directory, Pastor's Intel, Missions Control)

DROP VIEW IF EXISTS public.vw_user_identity;
CREATE OR REPLACE VIEW public.vw_user_identity AS
SELECT 
  p.id,
  p.name,
  p.email,
  p.phone_number,
  p.membership_status,
  p.growth_stage,
  p.avatar_url,
  p.created_at,
  p.updated_at,
  COALESCE(
    (SELECT array_agg(role_name) FROM public.user_roles WHERE user_id = p.id AND status = 'active'),
    ARRAY[]::TEXT[]
  ) as roles,
  om.discipleship_score,
  om.stage as legacy_stage,
  om.role as legacy_role
FROM public.profiles p
LEFT JOIN public.org_members om ON p.id = om.user_id;


-- 6. LEGACY COMPATIBILITY: Sync back to org_members
-- Ensures old dashboard modules still see the correct state while we transition

UPDATE public.org_members om
SET stage = p.growth_stage,
    role = CASE 
        WHEN EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role_name = 'super_admin') THEN 'super_admin'
        WHEN EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role_name = 'owner') THEN 'owner'
        ELSE om.role
    END
FROM public.profiles p
WHERE om.user_id = p.id;

-- 7. NOTIFY SCHEMA RELOAD
NOTIFY pgrst, 'reload schema';

COMMIT;
