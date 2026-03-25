-- Church OS: Remaining Unimplemented Views from Blueprint
-- Covers: Prayer Burden, Attendance Trajectory, Discipleship Velocity

-- 1. View: Prayer Burden Analysis
-- Tracks the ratio of active-to-answered prayers and flags surge categories.
CREATE OR REPLACE VIEW public.vw_prayer_burden_analysis AS
SELECT 
    pr.org_id,
    pr.category,
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE pr.status = 'active') as active_count,
    COUNT(*) FILTER (WHERE pr.status = 'answered') as answered_count,
    COUNT(*) FILTER (WHERE pr.urgency IN ('crisis', 'urgent') AND pr.status = 'active') as critical_active_count,
    ROUND(
        CASE WHEN COUNT(*) > 0 
        THEN (COUNT(*) FILTER (WHERE pr.status = 'answered')::numeric / COUNT(*)::numeric) * 100 
        ELSE 0 END, 2
    ) as answer_rate_pct
FROM public.prayer_requests pr
WHERE pr.created_at > now() - interval '30 days'
GROUP BY pr.org_id, pr.category
ORDER BY critical_active_count DESC;

-- 2. View: Attendance Trajectory
-- Detects declining attendance trajectories (not just absence).
CREATE OR REPLACE VIEW public.vw_attendance_trajectory AS
WITH period_counts AS (
    SELECT 
        p.id as user_id,
        p.name,
        p.org_id,
        COUNT(*) FILTER (WHERE ar.event_date > now() - interval '30 days') as last_30d,
        COUNT(*) FILTER (WHERE ar.event_date > now() - interval '60 days' AND ar.event_date <= now() - interval '30 days') as prev_30d
    FROM public.profiles p
    LEFT JOIN public.attendance_records ar ON p.id = ar.user_id
    GROUP BY p.id, p.name, p.org_id
)
SELECT 
    *,
    CASE 
        WHEN prev_30d > 0 AND last_30d < prev_30d THEN 'Declining'
        WHEN prev_30d = 0 AND last_30d = 0 THEN 'Absent'
        WHEN last_30d >= prev_30d THEN 'Stable'
        ELSE 'New'
    END as trajectory,
    CASE 
        WHEN prev_30d > 0 THEN last_30d - prev_30d 
        ELSE 0 
    END as change
FROM period_counts
WHERE prev_30d > 0 AND last_30d < prev_30d;

-- 3. View: Discipleship Velocity
-- Measures speed of spiritual journey milestones.
CREATE OR REPLACE VIEW public.vw_discipleship_velocity AS
SELECT 
    p.id as user_id,
    p.name,
    p.org_id,
    p.joined_at,
    p.salvation_date,
    p.baptism_date,
    p.membership_date,
    p.discipleship_score,
    CASE 
        WHEN p.baptism_date IS NOT NULL AND p.salvation_date IS NOT NULL 
        THEN p.baptism_date - p.salvation_date 
        ELSE NULL 
    END as days_salvation_to_baptism,
    CASE 
        WHEN p.membership_date IS NOT NULL AND p.baptism_date IS NOT NULL 
        THEN p.membership_date - p.baptism_date 
        ELSE NULL 
    END as days_baptism_to_membership,
    CASE 
        WHEN p.salvation_date IS NOT NULL AND p.baptism_date IS NULL THEN 'Bottleneck: Awaiting Baptism'
        WHEN p.baptism_date IS NOT NULL AND p.membership_date IS NULL THEN 'Bottleneck: Awaiting Membership'
        WHEN p.membership_date IS NOT NULL THEN 'Full Member'
        ELSE 'Early Journey'
    END as pipeline_status
FROM public.profiles p
WHERE p.salvation_date IS NOT NULL;

GRANT SELECT ON public.vw_prayer_burden_analysis TO authenticated;
GRANT SELECT ON public.vw_attendance_trajectory TO authenticated;
GRANT SELECT ON public.vw_discipleship_velocity TO authenticated;

NOTIFY pgrst, 'reload schema';
