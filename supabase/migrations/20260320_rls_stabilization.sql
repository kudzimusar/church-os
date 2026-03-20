
-- 1. Helper Functions for RLS
CREATE OR REPLACE FUNCTION public.get_auth_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM public.org_members WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_org_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members 
    WHERE user_id = auth.uid() 
    AND role IN ('shepherd', 'admin', 'owner', 'super_admin', 'pastor')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. Enable RLS on all relevant tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministry_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchandise ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchandise_orders ENABLE ROW LEVEL SECURITY;

-- 3. Cleanup existing broken policies
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users read own membership" ON public.org_members;

-- 4. New Organizational Policies

-- Profiles: Admins see all in org, users see own
CREATE POLICY "Admins view org profiles" ON public.profiles
FOR SELECT USING (org_id = public.get_auth_org_id() AND public.is_org_admin());

CREATE POLICY "Users view own profile" ON public.profiles
FOR SELECT USING (id = auth.uid());

-- Org Members: Admins see all in org
CREATE POLICY "Admins view org members" ON public.org_members
FOR SELECT USING (org_id = public.get_auth_org_id() AND public.is_org_admin());

CREATE POLICY "Users view own membership" ON public.org_members
FOR SELECT USING (user_id = auth.uid());

-- Attendance: Admins see all in org
CREATE POLICY "Admins manage org attendance" ON public.attendance_records
FOR ALL USING (org_id = public.get_auth_org_id() AND public.is_org_admin());

-- Ministries: Admins manage all in org
CREATE POLICY "Admins manage org ministries" ON public.ministries
FOR ALL USING (org_id = public.get_auth_org_id() AND public.is_org_admin());

-- Ministry Reports: Admins manage all in org
CREATE POLICY "Admins manage org reports" ON public.ministry_reports
FOR ALL USING (org_id = public.get_auth_org_id() AND public.is_org_admin());

-- Merchandise: Admins manage all in org
CREATE POLICY "Admins manage org merchandise" ON public.merchandise
FOR ALL USING (org_id = public.get_auth_org_id() AND public.is_org_admin());

-- Merchandise Orders: Admins manage all in org
CREATE POLICY "Admins manage org orders" ON public.merchandise_orders
FOR ALL USING (org_id = public.get_auth_org_id() AND public.is_org_admin());

-- 5. Views actually inherit RLS from base tables if they aren't marked SECURITY DEFINER.
-- Most views in this project are standard, so they will now be filtered automatically by org_id.
