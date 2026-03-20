-- Stabilize Admin Update Policies for Profiles
-- Migration: 20260320020000_admin_update_policy.sql

-- 1. Add UPDATE policy for admins on profiles table
DROP POLICY IF EXISTS "Admins update profiles in org" ON public.profiles;
CREATE POLICY "Admins update profiles in org" ON public.profiles
FOR UPDATE TO authenticated
USING (
    (org_id = (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'shepherd') LIMIT 1))
)
WITH CHECK (
    (org_id = (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'shepherd') LIMIT 1))
);

-- 2. Ensure member_milestones can be updated by admins too
DROP POLICY IF EXISTS "Admins manage member_milestones" ON public.member_milestones;
CREATE POLICY "Admins manage member_milestones" ON public.member_milestones
FOR ALL TO authenticated
USING (
    org_id = (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'shepherd') LIMIT 1)
);
