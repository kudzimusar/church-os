-- Church OS: Prophetic Intelligence Layer (PIL) Migration
-- Core storage for predictive ministry analytics

-- 1. Create prophetic_insights table
CREATE TABLE IF NOT EXISTS public.prophetic_insights (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category text NOT NULL, -- 'drop_off', 'conversion', 'volunteer', 'geo', 'finance'
    subject_id uuid, -- user_id, ministry_id, or null for general
    probability_score integer CHECK (probability_score >= 0 AND probability_score <= 100),
    risk_level text DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
    insight_title text NOT NULL,
    insight_description text,
    recommended_action text,
    metadata jsonb DEFAULT '{}'::jsonb, -- dynamic context like { "last_attendance": "2024-03-01" }
    is_acknowledged boolean DEFAULT false,
    generated_at timestamptz DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.prophetic_insights ENABLE ROW LEVEL SECURITY;

-- Admins/Shepherds can see and manage all insights
CREATE POLICY "Admins manage prophetic insights" ON public.prophetic_insights
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.org_members WHERE user_id = auth.uid() AND role IN ('shepherd', 'admin', 'owner'))
    );

-- 3. Utility Function: Identify members at risk of drop-off (7-day silence)
-- This logic can be called via CRON or Edge Function, but we provide the SQL view for the dashboard
CREATE OR REPLACE VIEW public.vw_member_disengagement_risk AS
SELECT 
    p.id as user_id,
    p.name,
    s.last_devotion_date,
    CURRENT_DATE - s.last_devotion_date::date as days_silent,
    CASE 
        WHEN CURRENT_DATE - s.last_devotion_date::date >= 14 THEN 90
        WHEN CURRENT_DATE - s.last_devotion_date::date >= 7 THEN 60
        ELSE 10
    END as risk_score
FROM public.profiles p
JOIN public.member_stats s ON p.id = s.user_id
WHERE s.last_devotion_date < CURRENT_DATE - INTERVAL '6 days';

-- 4. Utility Function: Identify Geographic Planting Opportunities
CREATE OR REPLACE VIEW public.vw_geo_planting_opportunities AS
SELECT 
    ward,
    count(*) as member_count,
    (SELECT count(*) FROM public.fellowship_groups WHERE lower(ward) = lower(p.ward)) as group_count
FROM public.profiles p
WHERE ward IS NOT NULL AND ward != ''
GROUP BY ward
HAVING count(*) >= 5 AND (SELECT count(*) FROM public.fellowship_groups WHERE lower(ward) = lower(p.ward)) = 0;

NOTIFY pgrst, 'reload schema';
