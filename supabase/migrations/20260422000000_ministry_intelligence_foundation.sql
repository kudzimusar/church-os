-- ==============================================================================
-- Migration: 20260422000000_ministry_intelligence_foundation.sql
-- Description: Establishes the high-fidelity data foundation for the upgraded
--              Ministry Intelligence Ecosystem and Leader Profiles.
-- ==============================================================================

BEGIN;

-- 1. MINISTRY BRANDING & IDENTITY (The UI Engine)
CREATE TABLE IF NOT EXISTS public.ministry_branding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ministry_id UUID REFERENCES public.ministries(id) ON DELETE CASCADE,
    primary_color TEXT NOT NULL DEFAULT '#8B5CF6',
    secondary_color TEXT NOT NULL DEFAULT '#6D28D9',
    intelligence_tag TEXT NOT NULL DEFAULT 'OPERATIONAL',
    icon_name TEXT DEFAULT 'box',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(ministry_id)
);

ALTER TABLE public.ministry_branding ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view branding" ON public.ministry_branding FOR SELECT USING (true);
CREATE POLICY "Admins can manage branding" ON public.ministry_branding FOR ALL USING (
    EXISTS (SELECT 1 FROM public.org_members WHERE user_id = auth.uid() AND role IN ('admin', 'owner', 'pastor'))
);

-- 2. DYNAMIC METRICS ENGINE (The 15 Silos Logic)
CREATE TABLE IF NOT EXISTS public.ministry_metric_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ministry_id UUID REFERENCES public.ministries(id) ON DELETE CASCADE,
    metric_key TEXT NOT NULL,
    label TEXT NOT NULL,
    unit TEXT DEFAULT 'count', -- count, percentage, currency, etc.
    target_value NUMERIC,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(ministry_id, metric_key)
);

CREATE TABLE IF NOT EXISTS public.ministry_metric_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ministry_id UUID REFERENCES public.ministries(id) ON DELETE CASCADE,
    metric_key TEXT NOT NULL,
    value NUMERIC NOT NULL,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    recorded_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ministry_metric_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministry_metric_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone view metrics" ON public.ministry_metric_definitions FOR SELECT USING (true);
CREATE POLICY "Ministry leads log metrics" ON public.ministry_metric_logs FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.org_members WHERE user_id = auth.uid() AND (role IN ('admin','pastor') OR (role = 'ministry_leader' AND ministry_id = public.ministry_metric_logs.ministry_id)))
);
CREATE POLICY "Ministry leads view logs" ON public.ministry_metric_logs FOR SELECT USING (true);

-- 3. ACTIVE INTELLIGENCE (Health & AI Insights)
CREATE TABLE IF NOT EXISTS public.ministry_health_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ministry_id UUID REFERENCES public.ministries(id) ON DELETE CASCADE,
    score INTEGER CHECK (score >= 0 AND score <= 100),
    trend_direction TEXT CHECK (trend_direction IN ('up', 'down', 'stable')),
    calculation_logic JSONB, -- Stores the "Why" behind the score
    recorded_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ministry_ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ministry_id UUID REFERENCES public.ministries(id) ON DELETE CASCADE,
    insight_type TEXT CHECK (insight_type IN ('success', 'warning', 'critical', 'tip')),
    content TEXT NOT NULL,
    priority INTEGER DEFAULT 1, -- 1: Normal, 2: High, 3: Crisis
    action_required BOOLEAN DEFAULT false,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ministry_health_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministry_ai_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View health & insights" ON public.ministry_health_snapshots FOR SELECT USING (true);
CREATE POLICY "View ai insights" ON public.ministry_ai_insights FOR SELECT USING (true);

-- 4. LEADER HEARTBEAT (Streaks & Spiritual Journey)
CREATE TABLE IF NOT EXISTS public.member_activity_heartbeats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- 'login', 'report_submit', 'attendance', 'giving'
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.spiritual_journey_progression (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    milestone TEXT NOT NULL, -- 'seeker', 'believer', 'disciple', 'leader', 'equipper'
    achieved_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, milestone)
);

ALTER TABLE public.member_activity_heartbeats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spiritual_journey_progression ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own heartbeat" ON public.member_activity_heartbeats FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users view own spiritual progression" ON public.spiritual_journey_progression FOR SELECT USING (user_id = auth.uid());

-- 5. REPORTING DEADLINES (Consistency Engine)
CREATE TABLE IF NOT EXISTS public.ministry_reporting_deadlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ministry_id UUID REFERENCES public.ministries(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0: Sunday, 6: Saturday
    deadline_time TIME DEFAULT '23:59:59',
    reminder_lead_time_hours INTEGER DEFAULT 2,
    UNIQUE(ministry_id)
);

ALTER TABLE public.ministry_reporting_deadlines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View deadlines" ON public.ministry_reporting_deadlines FOR SELECT USING (true);

-- 5. FUNCTION: CALCULATE STREAK
CREATE OR REPLACE FUNCTION public.calculate_user_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_streak INTEGER := 0;
    v_last_date DATE;
    v_current_date DATE;
    v_rec RECORD;
BEGIN
    FOR v_rec IN 
        SELECT DISTINCT created_at::DATE as act_date 
        FROM public.member_activity_heartbeats 
        WHERE user_id = p_user_id 
        ORDER BY act_date DESC
    LOOP
        IF v_last_date IS NULL THEN
            v_streak := 1;
            v_last_date := v_rec.act_date;
            -- If the latest activity wasn't today or yesterday, streak is broken
            IF v_last_date < CURRENT_DATE - INTERVAL '1 day' THEN
                RETURN 0;
            END IF;
        ELSIF v_last_date = v_rec.act_date + INTERVAL '1 day' THEN
            v_streak := v_streak + 1;
            v_last_date := v_rec.act_date;
        ELSE
            EXIT;
        END IF;
    END LOOP;
    RETURN v_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. SEED INITIAL BRANDING (Based on design specification)
DO $$
DECLARE
    min_record RECORD;
BEGIN
    FOR min_record IN SELECT id, slug FROM public.ministries LOOP
        INSERT INTO public.ministry_branding (ministry_id, primary_color, secondary_color, intelligence_tag, icon_name)
        VALUES (
            min_record.id,
            CASE 
                WHEN min_record.slug = 'worship' THEN '#8B5CF6'
                WHEN min_record.slug = 'ushers' THEN '#F59E0B'
                WHEN min_record.slug = 'media' THEN '#06B6D4'
                WHEN min_record.slug = 'children' THEN '#F472B6'
                WHEN min_record.slug = 'youth' THEN '#EAB308'
                WHEN min_record.slug = 'prayer' THEN '#818CF8'
                WHEN min_record.slug = 'pastoral' THEN '#10B981'
                WHEN min_record.slug = 'evangelism' THEN '#22C55E'
                WHEN min_record.slug = 'language' THEN '#3B82F6'
                WHEN min_record.slug = 'finance' THEN '#F59E0B'
                WHEN min_record.slug = 'hospitality' THEN '#D97706'
                WHEN min_record.slug = 'fellowship' THEN '#14B8A6'
                WHEN min_record.slug = 'missions' THEN '#60A5FA'
                WHEN min_record.slug = 'akiramenai' THEN '#F87171'
                WHEN min_record.slug = 'foodpantry' THEN '#84CC16'
                ELSE '#8B5CF6'
            END,
            CASE 
                WHEN min_record.slug = 'worship' THEN '#6D28D9'
                WHEN min_record.slug = 'ushers' THEN '#D97706'
                WHEN min_record.slug = 'media' THEN '#0891B2'
                WHEN min_record.slug = 'children' THEN '#DB2777'
                WHEN min_record.slug = 'youth' THEN '#CA8A04'
                WHEN min_record.slug = 'prayer' THEN '#6366F1'
                WHEN min_record.slug = 'pastoral' THEN '#059669'
                WHEN min_record.slug = 'evangelism' THEN '#15803D'
                WHEN min_record.slug = 'language' THEN '#1D4ED8'
                WHEN min_record.slug = 'finance' THEN '#10B981'
                WHEN min_record.slug = 'hospitality' THEN '#92400E'
                WHEN min_record.slug = 'fellowship' THEN '#0D9488'
                WHEN min_record.slug = 'missions' THEN '#2563EB'
                WHEN min_record.slug = 'akiramenai' THEN '#DC2626'
                WHEN min_record.slug = 'foodpantry' THEN '#4D7C0F'
                ELSE '#6D28D9'
            END,
            CASE 
                WHEN min_record.slug = 'worship' THEN 'SOULFUL & TECH'
                WHEN min_record.slug = 'ushers' THEN 'PRECISE & SHARP'
                WHEN min_record.slug = 'media' THEN 'INDUSTRIAL & DARK'
                WHEN min_record.slug = 'children' THEN 'SOFT & PROTECTIVE'
                WHEN min_record.slug = 'youth' THEN 'VIBRANT & ACTIVE'
                WHEN min_record.slug = 'prayer' THEN 'ETHEREAL & CALM'
                WHEN min_record.slug = 'pastoral' THEN 'TRUST & SECURITY'
                WHEN min_record.slug = 'evangelism' THEN 'URGENT & BOLD'
                WHEN min_record.slug = 'language' THEN 'ACADEMIC & ELITE'
                WHEN min_record.slug = 'finance' THEN 'CLEAN & SECURE'
                WHEN min_record.slug = 'hospitality' THEN 'WARM & INVITING'
                WHEN min_record.slug = 'fellowship' THEN 'ORGANIC & CONNECTED'
                WHEN min_record.slug = 'missions' THEN 'GLOBAL & EXPANSIVE'
                WHEN min_record.slug = 'akiramenai' THEN 'GRITTY & COMPASSIONATE'
                WHEN min_record.slug = 'foodpantry' THEN 'ORDERLY & FRESH'
                ELSE 'LOGISTICS'
            END,
            CASE 
                WHEN min_record.slug = 'worship' THEN 'music'
                WHEN min_record.slug = 'ushers' THEN 'users'
                WHEN min_record.slug = 'media' THEN 'video'
                WHEN min_record.slug = 'children' THEN 'baby'
                WHEN min_record.slug = 'youth' THEN 'zap'
                WHEN min_record.slug = 'prayer' THEN 'feather'
                WHEN min_record.slug = 'pastoral' THEN 'heart'
                WHEN min_record.slug = 'evangelism' THEN 'megaphone'
                WHEN min_record.slug = 'language' THEN 'book'
                WHEN min_record.slug = 'finance' THEN 'dollar-sign'
                WHEN min_record.slug = 'hospitality' THEN 'coffee'
                WHEN min_record.slug = 'fellowship' THEN 'share-2'
                WHEN min_record.slug = 'missions' THEN 'globe'
                WHEN min_record.slug = 'akiramenai' THEN 'hand-metal'
                WHEN min_record.slug = 'foodpantry' THEN 'shopping-bag'
                ELSE 'box'
            END
        ) ON CONFLICT (ministry_id) DO UPDATE SET
            primary_color = EXCLUDED.primary_color,
            secondary_color = EXCLUDED.secondary_color,
            intelligence_tag = EXCLUDED.intelligence_tag;
    END LOOP;
END $$;

-- 7. SEED INITIAL METRIC DEFINITIONS
DO $$
DECLARE
    min_record RECORD;
BEGIN
    FOR min_record IN SELECT id, slug FROM public.ministries LOOP
        -- Worship
        IF min_record.slug = 'worship' THEN
            INSERT INTO public.ministry_metric_definitions (ministry_id, metric_key, label, unit) VALUES
            (min_record.id, 'rehearsal_attendance', 'Avg Attendance', 'count'),
            (min_record.id, 'setlists_completed', 'Setlists', 'count'),
            (min_record.id, 'gear_health', 'Gear Health', 'percentage');
        -- Ushers
        ELSIF min_record.slug = 'ushers' THEN
            INSERT INTO public.ministry_metric_definitions (ministry_id, metric_key, label, unit) VALUES
            (min_record.id, 'sanctuary_occupancy', 'Occupancy', 'count'),
            (min_record.id, 'welcome_warmth', 'Warmth', 'percentage'),
            (min_record.id, 'incidents', 'Incidents', 'count');
        -- Media
        ELSIF min_record.slug = 'media' THEN
            INSERT INTO public.ministry_metric_definitions (ministry_id, metric_key, label, unit) VALUES
            (min_record.id, 'streaming_uptime', 'Uptime', 'percentage'),
            (min_record.id, 'live_views', 'Views', 'count'),
            (min_record.id, 'digital_assets', 'Assets', 'count');
        -- Children
        ELSIF min_record.slug = 'children' THEN
            INSERT INTO public.ministry_metric_definitions (ministry_id, metric_key, label, unit) VALUES
            (min_record.id, 'safety_audit', 'Safety', 'percentage'),
            (min_record.id, 'children_count', 'Children', 'count'),
            (min_record.id, 'teacher_volunteers', 'Teachers', 'count');
        -- Evangelism
        ELSIF min_record.slug = 'evangelism' THEN
            INSERT INTO public.ministry_metric_definitions (ministry_id, metric_key, label, unit) VALUES
            (min_record.id, 'salvations', 'Salvations', 'count'),
            (min_record.id, 'new_contacts', 'Contacts', 'count'),
            (min_record.id, 'territory_reached', 'Territory', 'percentage');
        -- Youth
        ELSIF min_record.slug = 'youth' THEN
            INSERT INTO public.ministry_metric_definitions (ministry_id, metric_key, label, unit) VALUES
            (min_record.id, 'event_attendance', 'Events', 'count'),
            (min_record.id, 'engagement_rate', 'Engaged', 'percentage'),
            (min_record.id, 'at_risk_count', 'At-Risk', 'count');
        -- Prayer
        ELSIF min_record.slug = 'prayer' THEN
            INSERT INTO public.ministry_metric_definitions (ministry_id, metric_key, label, unit) VALUES
            (min_record.id, 'requests_active', 'Requests', 'count'),
            (min_record.id, 'resolved_testimonies', 'Resolved', 'count'),
            (min_record.id, 'intercessor_coverage', 'Coverage', 'percentage');
        -- Pastoral Care
        ELSIF min_record.slug = 'pastoral' THEN
            INSERT INTO public.ministry_metric_definitions (ministry_id, metric_key, label, unit) VALUES
            (min_record.id, 'wellbeing_score', 'Wellbeing', 'percentage'),
            (min_record.id, 'visitation_count', 'Visits', 'count'),
            (min_record.id, 'open_care_cases', 'Cases', 'count');
        -- Kingdom Language
        ELSIF min_record.slug = 'language' THEN
            INSERT INTO public.ministry_metric_definitions (ministry_id, metric_key, label, unit) VALUES
            (min_record.id, 'student_count', 'Students', 'count'),
            (min_record.id, 'avg_grade_percent', 'Grade', 'percentage'),
            (min_record.id, 'retention_rate', 'Retention', 'percentage');
        -- Finance
        ELSIF min_record.slug = 'finance' THEN
            INSERT INTO public.ministry_metric_definitions (ministry_id, metric_key, label, unit) VALUES
            (min_record.id, 'burn_rate_runway', 'Runway', 'count'),
            (min_record.id, 'tithe_percentage', 'Tithe', 'percentage'),
            (min_record.id, 'operational_expenses', 'Expenses', 'currency');
        -- Hospitality
        ELSIF min_record.slug = 'hospitality' THEN
            INSERT INTO public.ministry_metric_definitions (ministry_id, metric_key, label, unit) VALUES
            (min_record.id, 'inventory_level', 'Inventory', 'percentage'),
            (min_record.id, 'volunteer_count', 'Volunteers', 'count'),
            (min_record.id, 'member_satisfaction', 'Satisfaction', 'percentage');
        -- Fellowship Circles
        ELSIF min_record.slug = 'fellowship' THEN
            INSERT INTO public.ministry_metric_definitions (ministry_id, metric_key, label, unit) VALUES
            (min_record.id, 'total_groups', 'Groups', 'count'),
            (min_record.id, 'percent_connected', 'Connected', 'percentage'),
            (min_record.id, 'isolated_member_count', 'Isolated', 'count');
        -- Missions
        ELSIF min_record.slug = 'missions' THEN
            INSERT INTO public.ministry_metric_definitions (ministry_id, metric_key, label, unit) VALUES
            (min_record.id, 'nations_impacted', 'Nations', 'count'),
            (min_record.id, 'missionaries_supported', 'Missionaries', 'count'),
            (min_record.id, 'mission_budget_util', 'Budget', 'percentage');
        -- Akiramenai
        ELSIF min_record.slug = 'akiramenai' THEN
            INSERT INTO public.ministry_metric_definitions (ministry_id, metric_key, label, unit) VALUES
            (min_record.id, 'meals_served', 'Meals', 'count'),
            (min_record.id, 'contacts_made', 'Contacts', 'count'),
            (min_record.id, 'street_stock_level', 'Stock', 'percentage');
        -- Food Pantry
        ELSIF min_record.slug = 'foodpantry' THEN
            INSERT INTO public.ministry_metric_definitions (ministry_id, metric_key, label, unit) VALUES
            (min_record.id, 'families_helped', 'Families', 'count'),
            (min_record.id, 'current_stock_percent', 'Stock', 'percentage'),
            (min_record.id, 'total_donations', 'Donations', 'count');
        END IF;
    END LOOP;
END $$;

-- 8. THE INTELLIGENCE VIEWS (The feed for Mission Control)
CREATE OR REPLACE VIEW public.vw_ministry_intelligence AS
SELECT 
    m.id as ministry_id,
    m.name,
    m.slug,
    mb.primary_color,
    mb.intelligence_tag,
    mb.icon_name,
    hs.score as health_score,
    hs.trend_direction,
    hs.calculation_logic,
    (SELECT json_agg(ins) FROM (SELECT insight_type, content, priority FROM public.ministry_ai_insights WHERE ministry_id = m.id AND is_read = false ORDER BY created_at DESC LIMIT 5) ins) as active_insights
FROM public.ministries m
LEFT JOIN public.ministry_branding mb ON m.id = mb.ministry_id
LEFT JOIN LATERAL (
    SELECT score, trend_direction, calculation_logic 
    FROM public.ministry_health_snapshots 
    WHERE ministry_id = m.id 
    ORDER BY recorded_at DESC LIMIT 1
) hs ON true;

CREATE OR REPLACE VIEW public.vw_ministry_metrics_current AS
SELECT 
    md.ministry_id,
    md.metric_key,
    md.label,
    md.unit,
    md.target_value,
    ml.value as current_value,
    ml.recorded_at as last_updated
FROM public.ministry_metric_definitions md
LEFT JOIN LATERAL (
    SELECT value, recorded_at 
    FROM public.ministry_metric_logs 
    WHERE ministry_id = md.ministry_id AND metric_key = md.metric_key 
    ORDER BY recorded_at DESC LIMIT 1
) ml ON true;

CREATE OR REPLACE VIEW public.vw_leader_profile_summary AS
SELECT 
    p.id as user_id,
    p.full_name,
    p.avatar_url,
    p.years_in_japan,
    p.language_proficiency,
    om.role,
    om.ministry_id,
    m.name as ministry_name,
    mb.primary_color as ministry_color,
    public.calculate_user_streak(p.id) as current_streak,
    (SELECT achieved_at FROM public.spiritual_journey_progression WHERE user_id = p.id ORDER BY achieved_at DESC LIMIT 1) as last_milestone_date,
    (SELECT milestone FROM public.spiritual_journey_progression WHERE user_id = p.id ORDER BY achieved_at DESC LIMIT 1) as current_spiritual_stage
FROM public.profiles p
LEFT JOIN public.org_members om ON p.id = om.user_id
LEFT JOIN public.ministries m ON om.ministry_id = m.id
LEFT JOIN public.ministry_branding mb ON m.id = mb.ministry_id;

COMMIT;
