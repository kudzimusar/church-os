-- CHURCH OS: MASTER STABILITY & PIPELINE ALIGNMENT
-- Resolving fragmented tables and ensuring unified data flow.

-- 1. HOUSEHOLD SYSTEM (Full Support)
CREATE TABLE IF NOT EXISTS public.household_members (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id uuid REFERENCES public.households(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- Optional: if member has own account
    full_name text NOT NULL,
    relationship text NOT NULL, -- Spouse, Child, Parent, Other
    created_at timestamptz DEFAULT now()
);

-- Ensure households has name and head_id (aligning with ProfileHub expectations)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'households' AND column_name = 'head_id') THEN
        ALTER TABLE public.households RENAME COLUMN head_user_id TO head_id;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'households' AND column_name = 'household_name') THEN
        ALTER TABLE public.households ADD COLUMN household_name text;
    END IF;
END;
$$;

-- 2. FELLOWSHIP CIRCLES (Schema Alignment)
-- ProfileHub uses 'fellowship_members', schema had 'fellowship_group_members'
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fellowship_group_members' AND table_schema = 'public') AND 
       NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fellowship_members' AND table_schema = 'public') THEN
        ALTER TABLE public.fellowship_group_members RENAME TO fellowship_members;
    END IF;
END;
$$;

-- 3. JUNIOR CHURCH & CHILDREN (Guardian Links Extension)
-- Ensure guardian_links matches UI expectation
ALTER TABLE public.guardian_links ADD COLUMN IF NOT EXISTS child_birthdate date;
ALTER TABLE public.guardian_links ADD COLUMN IF NOT EXISTS medical_notes text;
ALTER TABLE public.guardian_links ADD COLUMN IF NOT EXISTS allergies text;

-- 4. ATTENDANCE & ANALYTICS (Differentiating Intent vs History)
-- attendance_logs is for intent/planning
-- attendance_records is for historical data
ALTER TABLE public.attendance_logs ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);

-- 5. SKILLS & TALENTS (Consistency)
-- Ensure member_skills has org_id
ALTER TABLE public.member_skills ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);

-- 6. SECURITY & RLS POLICIES
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage household members" ON public.household_members;
CREATE POLICY "Admins manage household members" ON public.household_members
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.org_members WHERE user_id = auth.uid() AND role IN ('admin', 'shepherd', 'owner'))
    );

DROP POLICY IF EXISTS "Users view own household" ON public.household_members;
CREATE POLICY "Users view own household" ON public.household_members
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.households WHERE id = household_id AND head_id = auth.uid())
        OR user_id = auth.uid()
    );

DROP POLICY IF EXISTS "Users can insert own household members" ON public.household_members;
CREATE POLICY "Users can insert own household members" ON public.household_members
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.households WHERE id = household_id AND head_id = auth.uid())
    );

-- 6b. ATTENDANCE LOGS POLICIES (Fixing "Failed to log attendance" for new users)
DROP POLICY IF EXISTS "Users can manage own attendance logs" ON public.attendance_logs;
CREATE POLICY "Users can manage own attendance logs" ON public.attendance_logs
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Leadership can view all attendance logs" ON public.attendance_logs;
CREATE POLICY "Leadership can view all attendance logs" ON public.attendance_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.org_members 
            WHERE org_members.user_id = auth.uid() 
            AND org_members.role IN ('shepherd', 'admin', 'owner', 'ministry_lead')
        )
    );

-- 7. REPAIR VIEWS
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

-- 8. KIDS REGISTRY ENHANCEMENTS
ALTER TABLE public.kids_registry ADD COLUMN IF NOT EXISTS guardian_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.kids_registry ADD COLUMN IF NOT EXISTS location text; -- At Church, Online
ALTER TABLE public.kids_registry ADD COLUMN IF NOT EXISTS notes text;

DROP POLICY IF EXISTS "Guardians see own kids records" ON public.kids_registry;
CREATE POLICY "Guardians see own kids records" ON public.kids_registry
    FOR SELECT USING (guardian_id = auth.uid());

DROP POLICY IF EXISTS "Guardians insert own kids records" ON public.kids_registry;
CREATE POLICY "Guardians insert own kids records" ON public.kids_registry
    FOR INSERT WITH CHECK (guardian_id = auth.uid());

NOTIFY pgrst, 'reload schema';
