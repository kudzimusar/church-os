-- CHURCH OS: MINISTRY LEADER SYSTEM MIGRATION
-- Formalizes roles, ministries, and onboarding flow.

-- 1. MINISTRIES TABLE
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

-- 2. ENHANCE ORG_MEMBERS FOR ONBOARDING
ALTER TABLE public.org_members 
ADD COLUMN IF NOT EXISTS ministry_id uuid REFERENCES public.ministries(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS invitation_status text DEFAULT 'active', -- 'pending', 'active', 'expired'
ADD COLUMN IF NOT EXISTS invitation_token text UNIQUE,
ADD COLUMN IF NOT EXISTS invitation_sent_at timestamptz;

-- 3. INITIAL MINISTRIES SEEDING
INSERT INTO public.ministries (name, slug, category) VALUES
('Ushering', 'ushering', 'operations'),
('Children''s Ministry', 'children', 'operations'),
('Evangelism', 'evangelism', 'outreach'),
('Worship Team', 'worship', 'pastoral'),
('Prayer Team', 'prayer', 'pastoral')
ON CONFLICT DO NOTHING;

-- 4. INITIAL FORMS SEEDING (FOR MINISTRIES)
INSERT INTO public.forms (name, description, category) 
VALUES 
('Usher Headcount Report', 'Official attendance tracking for services', 'operations'),
('Child Check-In', 'Digital registration for children services', 'children'),
('Evangelism Log', 'Capture outreach decisions and follow-up needs', 'evangelism'),
('Weekly Ministry Report', 'Generic operational feedback for departmental leads', 'operations')
ON CONFLICT (name) DO NOTHING;

-- 5. RPC TO INVITE LEADER
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

-- 6. SECURITY: RLS FOR MINISTRY LEADERS
ALTER TABLE public.kids_registry ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Ministry leaders view own kids registry" ON public.kids_registry;
CREATE POLICY "Ministry leaders view own kids registry" ON public.kids_registry FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.org_members om
        JOIN public.ministries m ON om.ministry_id = m.id
        WHERE om.user_id = auth.uid() 
        AND (om.role IN ('admin', 'shepherd', 'owner', 'pastor') 
             OR (om.role = 'ministry_leader' AND m.slug = 'children'))
    )
);

ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Ministry leaders view relevant form submissions" ON public.form_submissions;
CREATE POLICY "Ministry leaders view relevant form submissions" ON public.form_submissions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.org_members om
        JOIN public.ministries m ON om.ministry_id = m.id
        JOIN public.forms f ON f.category = m.category
        WHERE om.user_id = auth.uid() 
        AND (om.role IN ('admin', 'shepherd', 'owner', 'pastor') 
             OR (om.role = 'ministry_leader' AND public.form_submissions.form_id = f.id))
    )
);

NOTIFY pgrst, 'reload schema';
