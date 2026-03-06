-- CHURCH OS: MINISTRY LEADER SYSTEM MIGRATION
-- Formalizes roles, ministries, and onboarding flow.

-- 1. EXTEND ROLES ENUM (Implicitly handled via text but defining standard)
-- Preferred Roles: super_admin, pastor, exco, ministry_leader, ministry_worker, member

-- 2. MINISTRIES TABLE
CREATE TABLE IF NOT EXISTS public.ministries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    category text, -- 'worship', 'operations', 'pastoral', 'outreach'
    created_at timestamptz DEFAULT now(),
    UNIQUE(org_id, name),
    UNIQUE(org_id, slug)
);

-- 3. ENHANCE ORG_MEMBERS FOR ONBOARDING
ALTER TABLE public.org_members 
ADD COLUMN IF NOT EXISTS ministry_id uuid REFERENCES public.ministries(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS invitation_status text DEFAULT 'active', -- 'pending', 'active', 'expired'
ADD COLUMN IF NOT EXISTS invitation_token text UNIQUE,
ADD COLUMN IF NOT EXISTS invitation_sent_at timestamptz;

-- 4. INITIAL MINISTRIES SEEDING
INSERT INTO public.ministries (name, slug, category) VALUES
('Ushering', 'ushering', 'operations'),
('Children''s Ministry', 'children', 'operations'),
('Evangelism', 'evangelism', 'outreach'),
('Worship Team', 'worship', 'pastoral'),
('Prayer Team', 'prayer', 'pastoral')
ON CONFLICT DO NOTHING;

-- 5. UPDATED RLS FOR MINISTRY LEADERS
-- Ministry leaders can only see their own ministry's data in specialized tables
DROP POLICY IF EXISTS "Ministry leaders view own kids registry" ON public.kids_registry;
CREATE POLICY "Ministry leaders view own kids registry" ON public.kids_registry FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.org_members 
        WHERE user_id = auth.uid() 
        AND (role IN ('admin', 'shepherd', 'owner') 
             OR (role = 'ministry_leader' AND ministry_id IN (SELECT id FROM public.ministries WHERE slug = 'children')))
    )
);

-- Apply similar logic to form submissions
DROP POLICY IF EXISTS "Ministry leaders view relevant form submissions" ON public.form_submissions;
CREATE POLICY "Ministry leaders view relevant form submissions" ON public.form_submissions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.org_members om
        JOIN public.ministries m ON om.ministry_id = m.id
        JOIN public.forms f ON f.ministry = m.slug
        WHERE om.user_id = auth.uid() 
        AND (om.role IN ('admin', 'shepherd', 'owner') OR (om.role = 'ministry_leader' AND f.id = public.form_submissions.form_id))
    )
);

-- 6. RPC TO INVITE LEADER
CREATE OR REPLACE FUNCTION public.invite_ministry_leader(
    p_user_id uuid,
    p_org_id uuid,
    p_ministry_id uuid,
    p_role text
) RETURNS uuid AS $$
DECLARE
    v_token uuid;
BEGIN
    v_token := gen_random_uuid();
    
    INSERT INTO public.org_members (user_id, org_id, role, ministry_id, invitation_status, invitation_token, invitation_sent_at)
    VALUES (p_user_id, p_org_id, p_role, p_ministry_id, 'pending', v_token::text, now())
    ON CONFLICT (user_id, org_id) DO UPDATE SET
        role = EXCLUDED.role,
        ministry_id = EXCLUDED.ministry_id,
        invitation_status = 'pending',
        invitation_token = v_token::text,
        invitation_sent_at = now();
        
    RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
