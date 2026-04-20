
-- Migration: Support Kingdom Class as a self-standing dashboard surface
-- Mimics the Pastor's HQ structural pattern

-- 1. Update the Auth Context View to include Kingdom Class
CREATE OR REPLACE VIEW v_user_auth_contexts AS
-- 🔴 Corporate
SELECT 
  i.id as identity_id,
  'corporate'::TEXT as auth_domain,
  'console'::TEXT as auth_surface,
  ar.role,
  NULL::UUID as org_id
FROM public.identities i
JOIN public.admin_roles ar ON ar.identity_id = i.id

UNION ALL

-- 🔘 Pastor's HQ (High Elevation)
SELECT 
  identity_id,
  'tenant'::TEXT,
  'pastor-hq'::TEXT,
  role,
  org_id
FROM public.org_members
WHERE role IN ('owner', 'pastor', 'super_admin')

UNION ALL

-- 🔘 Mission Control (Standard Ops)
SELECT 
  identity_id,
  'tenant'::TEXT,
  'mission-control'::TEXT,
  role,
  org_id
FROM public.org_members

UNION ALL

-- 🔘 Kingdom Class (New Standalone Surface)
-- Target: Super Admins, Owners, and specifically Language School Leads
SELECT 
  om.identity_id,
  'tenant'::TEXT as auth_domain,
  'kingdom-class'::TEXT as auth_surface,
  om.role,
  om.org_id
FROM public.org_members om
WHERE om.role IN ('owner', 'pastor', 'super_admin')
OR EXISTS (
    SELECT 1 FROM public.ministries m 
    WHERE m.leader_id = om.identity_id 
    AND m.slug = 'language-school'
)

UNION ALL

-- 🟠 Ministry (General Sub-layer)
SELECT 
  identity_id,
  'tenant'::TEXT,
  'ministry'::TEXT,
  ministry_role,
  org_id
FROM public.ministry_members

UNION ALL

-- 🟢 Member
SELECT 
  identity_id,
  'member'::TEXT,
  'profile'::TEXT,
  'member'::TEXT,
  org_id
FROM public.member_profiles

UNION ALL

-- ⚪ Onboarding
SELECT 
  identity_id,
  'onboarding'::TEXT,
  'onboarding'::TEXT,
  status as role,
  NULL::UUID as org_id
FROM public.onboarding_sessions;
