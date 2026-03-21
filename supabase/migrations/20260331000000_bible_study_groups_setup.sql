-- ============================================================
-- BIBLE STUDY GROUPS MIGRATION
-- Renaming Fellowship Circles to Bible Study Groups
-- Adding support for online meetings, schedules, and curriculum
-- ============================================================

-- 1. Rename Tables
ALTER TABLE IF EXISTS public.fellowship_groups RENAME TO bible_study_groups;
ALTER TABLE IF EXISTS public.fellowship_members RENAME TO bible_study_group_members;

-- 2. Add New Columns to bible_study_groups
ALTER TABLE public.bible_study_groups ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.bible_study_groups ADD COLUMN IF NOT EXISTS meeting_link text;
ALTER TABLE public.bible_study_groups ADD COLUMN IF NOT EXISTS meeting_time text;
ALTER TABLE public.bible_study_groups ADD COLUMN IF NOT EXISTS meeting_day text;
ALTER TABLE public.bible_study_groups ADD COLUMN IF NOT EXISTS meeting_type text DEFAULT 'in-person';
ALTER TABLE public.bible_study_groups ADD COLUMN IF NOT EXISTS curriculum text;
ALTER TABLE public.bible_study_groups ADD COLUMN IF NOT EXISTS share_token uuid DEFAULT uuid_generate_v4();

-- 3. Update Function: calculate_vitality_score
-- This function was identified as using public.fellowship_members (previously fellowship_group_members)
CREATE OR REPLACE FUNCTION public.calculate_vitality_score(p_user_id uuid)
RETURNS int AS $$
DECLARE
    streak_score int := 0;
    attendance_score int := 0;
    ministry_score int := 0;
    giving_score int := 0;
    community_score int := 0;
    total_score int := 0;
BEGIN
    SELECT current_streak INTO streak_score
    FROM public.member_stats WHERE user_id = p_user_id;

    -- Attendance
    SELECT LEAST(25, COUNT(*) * 6) INTO attendance_score
    FROM public.attendance_records
    WHERE user_id = p_user_id
    AND event_date >= CURRENT_DATE - INTERVAL '30 days';

    -- Ministry involvement
    SELECT CASE WHEN COUNT(*) > 0 THEN 25 ELSE 0 END INTO ministry_score
    FROM public.ministry_members WHERE user_id = p_user_id AND is_active = true;

    -- Giving
    SELECT CASE WHEN COUNT(*) > 0 THEN 10 ELSE 0 END INTO giving_score
    FROM public.financial_records
    WHERE user_id = p_user_id
    AND date >= CURRENT_DATE - INTERVAL '30 days';

    -- Community (Updated to bible_study_group_members)
    SELECT CASE WHEN COUNT(*) > 0 THEN 10 ELSE 0 END INTO community_score
    FROM public.bible_study_group_members WHERE user_id = p_user_id;

    total_score := COALESCE(streak_score, 0) + COALESCE(attendance_score, 0) +
                   COALESCE(ministry_score, 0) + COALESCE(giving_score, 0) +
                   COALESCE(community_score, 0);

    RETURN LEAST(100, total_score);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update RLS Policy Names (Table renames preserve policies, but we rename them for clarity)
ALTER POLICY "Members view fellowship groups" ON public.bible_study_groups RENAME TO "Members view bible study groups";
ALTER POLICY "Members view group membership" ON public.bible_study_group_members RENAME TO "Members view bible study group membership";

-- 5. Ensure org_id is present and indexed (carried over from mission control stabilization)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bible_study_groups' AND column_name = 'org_id') THEN
        ALTER TABLE public.bible_study_groups ADD COLUMN org_id uuid REFERENCES public.organizations(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bible_study_group_members' AND column_name = 'org_id') THEN
        ALTER TABLE public.bible_study_group_members ADD COLUMN org_id uuid REFERENCES public.organizations(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_bible_study_groups_org ON public.bible_study_groups(org_id);
CREATE INDEX IF NOT EXISTS idx_bible_study_group_members_org ON public.bible_study_group_members(org_id);

-- 6. Update Ministries Table Entry
UPDATE public.ministries 
SET name = 'Bible Study Groups', 
    slug = 'bible-study'
WHERE slug = 'fellowship-circles' OR slug = 'fellowship';
