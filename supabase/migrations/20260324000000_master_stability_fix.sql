-- CHURCH OS: ORGANIZATIONAL ALIGNMENT & DATA PIPELINE STABILIZATION
-- Ensuring a single source of truth for all multi-tenant operations.

BEGIN;

-- 1. SEED DEFAULT ORGANIZATION (Ensures 'Internal configuration error' is resolved)
-- We check for existing first to avoid unique domain constraint.
DO $$
DECLARE
    v_org_id uuid;
BEGIN
    SELECT id INTO v_org_id FROM public.organizations LIMIT 1;
    
    IF v_org_id IS NULL THEN
        INSERT INTO public.organizations (name, domain)
        VALUES ('Japan Kingdom Church', 'jkc.org')
        RETURNING id INTO v_org_id;
    END IF;

    -- 2. ALIGN EXISTING PROFILES
    -- Link all orphaned profiles to the primary organization.
    UPDATE public.profiles 
    SET org_id = v_org_id 
    WHERE org_id IS NULL;

    -- 3. ALIGN ORG_MEMBERS
    -- Ensure org_members is also linked and has at least a 'visitor' role for everyone.
    INSERT INTO public.org_members (user_id, org_id, role, stage)
    SELECT p.id, v_org_id, 'visitor', 'seeker'
    FROM public.profiles p
    WHERE NOT EXISTS (SELECT 1 FROM public.org_members om WHERE om.user_id = p.id)
    ON CONFLICT (user_id, org_id) DO NOTHING;

END $$;

-- 4. HOUSEHOLD STABILIZATION: household_members FK fix
-- Ensure household_members can be inserted even if user_id is null (for children without accounts).
ALTER TABLE public.household_members ALTER COLUMN user_id DROP NOT NULL;

-- 5. SKILLS & TALENTS RECOVERY
-- Create member_skills if it was somehow dropped (users reported errors adding skills).
CREATE TABLE IF NOT EXISTS public.member_skills (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id uuid REFERENCES public.organizations(id),
    name text NOT NULL,
    category text,
    level text,
    years_experience int,
    created_at timestamptz DEFAULT now()
);

-- 6. MINISTRY ROLES ALIGNMENT
-- Users reporting 'Error linking role' - likely missing ministry_members or ministry_roles.
CREATE TABLE IF NOT EXISTS public.ministry_roles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id uuid REFERENCES public.organizations(id),
    name text NOT NULL,
    description text,
    level int DEFAULT 10,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ministry_members (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id uuid REFERENCES public.organizations(id),
    ministry_id text, -- ID or name mapping
    role text, -- 'member', 'lead'
    status text DEFAULT 'active',
    created_at timestamptz DEFAULT now()
);

-- 7. REFRESH ANALYTICS VIEW
DROP VIEW IF EXISTS public.vw_user_identity CASCADE;
CREATE OR REPLACE VIEW public.vw_user_identity AS
SELECT 
    p.*,
    om.role as current_role,
    om.stage as current_stage,
    om.discipleship_score,
    mm.first_visit_date,
    mm.salvation_date as milestone_salvation,
    mm.baptism_date as milestone_baptism,
    mm.membership_date,
    (SELECT COUNT(*) FROM public.membership_requests WHERE user_id = p.id AND status = 'pending') > 0 as has_pending_request
FROM public.profiles p
LEFT JOIN public.org_members om ON p.id = om.user_id
LEFT JOIN public.member_milestones mm ON p.id = mm.user_id;

-- 8. RLS POLICIES FOR STABILITY
ALTER TABLE public.member_skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own skills" ON public.member_skills;
CREATE POLICY "Users manage own skills" ON public.member_skills
    FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.ministry_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own ministries" ON public.ministry_members;
CREATE POLICY "Users view own ministries" ON public.ministry_members
    FOR SELECT USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';

COMMIT;
