-- Migration: 20260320000000_membership_governance
-- Description: Enforce governance rules for membership and leadership promotion.
-- Rules: 
-- 1. Only approved members can hold high-level roles (level >= 50).
-- 2. Membership status must be explicitly approved via the membership pipeline.

BEGIN;

-- 1. Create Membership Requests table for Stage 3 tracking
CREATE TABLE IF NOT EXISTS public.membership_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    notes TEXT,
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, org_id)
);

-- 2. Function to VALIDATE role assignment
-- This prevents the 'bypass' identified by the user.
CREATE OR REPLACE FUNCTION public.fn_validate_role_assignment()
RETURNS TRIGGER AS $$
DECLARE
  v_membership_status TEXT;
  v_role_level INT;
BEGIN
  -- Get membership status from profile
  SELECT membership_status INTO v_membership_status FROM public.profiles WHERE id = NEW.user_id;
  
  -- Get role level
  SELECT level INTO v_role_level FROM public.roles WHERE name = NEW.role_name;

  -- ENFORCEMENT: Block leadership roles for non-members
  IF v_role_level >= 50 AND (v_membership_status IS NULL OR v_membership_status != 'member') THEN
    RAISE EXCEPTION 'User must be an approved member before leadership promotion (Role: %, Current Status: %)', 
      NEW.role_name, COALESCE(v_membership_status, 'visitor');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for role validation
DROP TRIGGER IF EXISTS tr_validate_role_assignment ON public.user_roles;
CREATE TRIGGER tr_validate_role_assignment
BEFORE INSERT OR UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.fn_validate_role_assignment();


-- 3. Function to HANDLE membership approval
-- When a request is approved, update the profile and milestones
CREATE OR REPLACE FUNCTION public.fn_handle_membership_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    -- Update Profile
    UPDATE public.profiles
    SET 
        membership_status = 'member',
        growth_stage = 'disciple',
        updated_at = NOW()
    WHERE id = NEW.user_id;

    -- Update org_members legacy column
    UPDATE public.org_members
    SET stage = 'disciple',
        role = 'member'
    WHERE user_id = NEW.user_id;

    -- Upsert Milestone
    INSERT INTO public.member_milestones (user_id, membership_date)
    VALUES (NEW.user_id, NOW())
    ON CONFLICT (user_id) DO UPDATE 
    SET membership_date = EXCLUDED.membership_date;

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for membership approval
DROP TRIGGER IF EXISTS tr_handle_membership_approval ON public.membership_requests;
CREATE TRIGGER tr_handle_membership_approval
AFTER UPDATE ON public.membership_requests
FOR EACH ROW EXECUTE FUNCTION public.fn_handle_membership_approval();


-- 4. Correct the old sync trigger
-- The old one (tr_sync_profile_on_role_change) should now only be a fallback 
-- that ensures growth_stage = 'leader' for those who ALREADY are members.
CREATE OR REPLACE FUNCTION public.fn_sync_profile_on_role_change()
RETURNS TRIGGER AS $$
DECLARE
  v_role_level INT;
BEGIN
  SELECT level INTO v_role_level FROM public.roles WHERE name = NEW.role_name;
  
  -- If they passed validation (fn_validate_role_assignment), 
  -- we can safely set growth_stage to leader for high levels.
  IF v_role_level >= 80 THEN
    UPDATE public.profiles
    SET growth_stage = 'leader'
    WHERE id = NEW.user_id;
    
    UPDATE public.org_members
    SET stage = 'leader'
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. ANALYTICS VIEW REFRESH: Include membership requests
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
  om.role as legacy_role,
  EXISTS (SELECT 1 FROM public.membership_requests mr WHERE mr.user_id = p.id AND mr.status = 'pending') as has_pending_request
FROM public.profiles p
LEFT JOIN public.org_members om ON p.id = om.user_id;


COMMIT;
