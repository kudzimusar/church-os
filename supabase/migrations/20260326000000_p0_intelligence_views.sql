-- Church OS: P0 Intelligence Views Migration
-- Focus: Crisis detection, Retention health, and Isolation risk analysis.

-- 1. View: Crisis Early Warning
-- Detects members whose spiritual/emotional signals (SOAP + Prayers + Stats) indicate an immediate need for intervention.
CREATE OR REPLACE VIEW public.vw_crisis_early_warning AS
WITH member_context AS (
    SELECT 
        p.id as user_id,
        p.name,
        p.org_id,
        ms.last_devotion_date,
        COALESCE(CURRENT_DATE - ms.last_devotion_date::date, 0) as days_silent,
        (SELECT COUNT(*) FROM public.prayer_requests pr 
         WHERE pr.user_id = p.id AND pr.urgency IN ('crisis', 'urgent') 
           AND pr.status = 'active' AND pr.created_at > now() - interval '14 days') as active_crisis_prayers,
        (SELECT COUNT(*) FROM public.soap_entries se 
         WHERE se.user_id = p.id AND (se.sentiment ILIKE '%anxiety%' OR se.sentiment ILIKE '%despair%' OR se.sentiment ILIKE '%conflict%' OR se.sentiment ILIKE '%lonely%')
           AND se.created_at > now() - interval '14 days') as negative_soap_sentiment_count
    FROM public.profiles p
    LEFT JOIN public.member_stats ms ON p.id = ms.user_id
)
SELECT 
    *,
    (
        (CASE WHEN days_silent >= 14 THEN 40 WHEN days_silent >= 7 THEN 20 ELSE 0 END) +
        (CASE WHEN active_crisis_prayers > 0 THEN 40 ELSE 0 END) +
        (CASE WHEN negative_soap_sentiment_count > 0 THEN 20 ELSE 0 END)
    ) as crisis_score
FROM member_context
WHERE (days_silent >= 7 OR active_crisis_prayers > 0 OR negative_soap_sentiment_count > 0);

-- 2. View: New Member 90-Day Health
-- Tracks the first 90 days of a member's journey. Flags those who are failing to "stick."
CREATE OR REPLACE VIEW public.vw_new_member_90day_health AS
WITH new_members AS (
    SELECT 
        p.id as user_id,
        p.name,
        p.org_id,
        p.date_joined_church,
        (SELECT COUNT(*) FROM public.attendance_records ar 
         WHERE ar.user_id = p.id AND ar.event_date > now() - interval '30 days') as recent_attendance,
        (SELECT COUNT(*) FROM public.ministry_members mm 
         WHERE mm.user_id = p.id AND mm.is_active = true) as ministry_count,
        (SELECT COUNT(*) FROM public.fellowship_group_members fgm 
         WHERE fgm.user_id = p.id) as group_count
    FROM public.profiles p
    WHERE p.date_joined_church > CURRENT_DATE - INTERVAL '90 days'
)
SELECT 
    *,
    CASE 
        WHEN recent_attendance >= 2 AND (ministry_count > 0 OR group_count > 0) THEN 'Healthy'
        WHEN recent_attendance >= 1 THEN 'Stabilizing'
        ELSE 'At Risk'
    END as health_status,
    CASE
        WHEN recent_attendance = 0 AND ministry_count = 0 AND group_count = 0 THEN 90
        WHEN recent_attendance < 2 THEN 60
        ELSE 10
    END as attrition_risk_score
FROM new_members;

-- 3. View: Community Isolation Risk
-- Identifies established members (>30 days) who have ZERO structural connections (Ministries or Cell Groups).
CREATE OR REPLACE VIEW public.vw_community_isolation_risk AS
SELECT 
    p.id as user_id,
    p.name,
    p.org_id,
    p.date_joined_church,
    (SELECT COUNT(*) FROM public.ministry_members mm WHERE mm.user_id = p.id AND mm.is_active = true) as ministry_count,
    (SELECT COUNT(*) FROM public.fellowship_group_members fgm WHERE fgm.user_id = p.id) as group_count
FROM public.profiles p
WHERE p.date_joined_church < CURRENT_DATE - INTERVAL '30 days'
  -- Filter for zero connections
  AND (SELECT COUNT(*) FROM public.ministry_members mm WHERE mm.user_id = p.id AND mm.is_active = true) = 0
  AND (SELECT COUNT(*) FROM public.fellowship_group_members fgm WHERE fgm.user_id = p.id) = 0;

-- Grant permissions for analytical access
GRANT SELECT ON public.vw_crisis_early_warning TO authenticated;
GRANT SELECT ON public.vw_new_member_90day_health TO authenticated;
GRANT SELECT ON public.vw_community_isolation_risk TO authenticated;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
