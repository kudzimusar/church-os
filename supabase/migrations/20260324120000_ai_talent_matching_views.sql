-- AI-Driven Ministry Talent Matching
-- 1. Extend member_skills with higher-fidelity tracking
ALTER TABLE public.member_skills 
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id),
ADD COLUMN IF NOT EXISTS skill_category TEXT,
ADD COLUMN IF NOT EXISTS skill_level TEXT DEFAULT 'Intermediate',
ADD COLUMN IF NOT EXISTS years_experience INTEGER DEFAULT 1;

-- 2. Create a view for the Member Talent Pool
-- This aggregates skills by member and organization for AI analysis.
CREATE OR REPLACE VIEW public.vw_member_talent_pool AS
SELECT 
    p.org_id,
    p.id as user_id,
    p.name,
    p.email,
    p.discipleship_score,
    (
        SELECT jsonb_agg(jsonb_build_object(
            'skill', ms.skill_name,
            'category', ms.skill_category,
            'level', ms.skill_level,
            'experience', ms.years_experience
        ))
        FROM public.member_skills ms
        WHERE ms.user_id = p.id
    ) as skills,
    (
        SELECT jsonb_agg(mm.ministry_name)
        FROM public.ministry_members mm
        WHERE mm.user_id = p.id AND mm.is_active = true
    ) as current_ministries
FROM public.profiles p;

-- 3. Create a view for Ministry Skill Gaps
-- This helps identify ministries that lack members with specific relevant skills.
CREATE OR REPLACE VIEW public.vw_ministry_skill_gaps AS
SELECT 
    m.org_id,
    m.id as ministry_id,
    m.name as ministry_name,
    COUNT(mm.id) as volunteer_count,
    -- Simple heuristic: check for skills that often pair with the ministry name
    (
        SELECT COUNT(ms.id)
        FROM public.member_skills ms
        JOIN public.ministry_members mm_inner ON mm_inner.user_id = ms.user_id
        WHERE mm_inner.ministry_id = m.id
          AND (
            (m.name ILIKE '%Media%' AND ms.skill_category ILIKE '%Technical%') OR
            (m.name ILIKE '%Worship%' AND (ms.skill_name ILIKE '%Music%' OR ms.skill_name ILIKE '%Sing%')) OR
            (m.name ILIKE '%Kids%' AND ms.skill_category ILIKE '%Teaching%') OR
            (m.name ILIKE '%Usher%' AND ms.skill_category ILIKE '%Service%')
          )
    ) as skilled_volunteers_count
FROM public.ministries m
LEFT JOIN public.ministry_members mm ON mm.ministry_id = m.id AND mm.is_active = true
GROUP BY m.id, m.name, m.org_id;

-- Grant permissions
GRANT SELECT ON public.vw_member_talent_pool TO authenticated;
GRANT SELECT ON public.vw_ministry_skill_gaps TO authenticated;
