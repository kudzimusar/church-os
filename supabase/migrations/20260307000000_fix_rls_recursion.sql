-- Fix RLS Infinite Recursion on org_members
-- Use a security definer function to check roles safely

-- 1. Create a helper function to check admin status without recursion
CREATE OR REPLACE FUNCTION public.check_is_admin(p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.org_members 
    WHERE user_id = p_user_id 
    AND role IN ('admin', 'owner', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update org_members policy
DROP POLICY IF EXISTS "Admins manage org members" ON public.org_members;
CREATE POLICY "Admins manage org members" ON public.org_members FOR ALL USING (
    check_is_admin(auth.uid()) OR user_id = auth.uid()
);

-- 3. Update other policies that use org_members to check roles
-- These should also ideally use the function to be consistent and safe

DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles" ON public.profiles FOR SELECT USING (
    check_is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Admins read all stats" ON public.member_stats;
CREATE POLICY "Admins read all stats" ON public.member_stats FOR SELECT USING (
    check_is_admin(auth.uid())
);

-- Note: The original policies used a broad list of roles. 
-- Let's make sure check_is_admin covers what's needed.
-- original: ('shepherd', 'admin', 'owner', 'ministry_lead')

CREATE OR REPLACE FUNCTION public.check_is_staff(p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.org_members 
    WHERE user_id = p_user_id 
    AND role IN ('shepherd', 'admin', 'owner', 'super_admin', 'ministry_lead')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update profiles to use check_is_staff
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles" ON public.profiles FOR SELECT USING (
    check_is_staff(auth.uid())
);

NOTIFY pgrst, 'reload schema';
