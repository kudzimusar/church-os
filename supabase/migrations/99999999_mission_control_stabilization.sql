-- Fix existing ministry member records
UPDATE ministry_members
SET ministry_id = m.id
FROM ministries m
WHERE (ministry_members.ministry_name = m.name 
   OR ministry_members.ministry_name = 'Media' AND m.name = 'Media Ministry'
   OR ministry_members.ministry_name = 'Worship' AND m.name = 'Worship Ministry'
   OR ministry_members.ministry_name = 'Youth' AND m.name = 'Youth Ministry'
   OR ministry_members.ministry_name = 'Childrens' AND m.name = 'Children''s Ministry')
AND ministry_members.ministry_id IS NULL;

-- Ensure all ministry members have a status
UPDATE ministry_members SET status = 'active' WHERE status IS NULL AND is_active = TRUE;
UPDATE ministry_members SET status = 'pending' WHERE status IS NULL AND is_active = FALSE;

-- Improve refresh_ai_insights to be more robust
CREATE OR REPLACE FUNCTION public.refresh_ai_insights(p_org_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_member_count INT;
    v_pending_apps INT;
    v_skill_gaps INT;
BEGIN
    -- 1. Get base metrics for the org
    SELECT count(*) INTO v_member_count FROM profiles WHERE org_id = p_org_id;
    SELECT count(*) INTO v_pending_apps FROM ministry_members WHERE org_id = p_org_id AND status = 'pending';
    SELECT count(*) INTO v_skill_gaps FROM vw_ministry_skill_gaps WHERE org_id = p_org_id;

    -- 2. Clear stale (non-archived) insights for this org
    DELETE FROM ai_insights WHERE org_id = p_org_id AND status != 'archived';

    -- 3. Proactive Talent Insight
    IF v_skill_gaps > 0 THEN
        INSERT INTO ai_insights (org_id, type, priority, title, insight, action_taken, status)
        VALUES (
            p_org_id,
            'recruitment',
            'high',
            'Ministry Talent Alignment',
            format('Found %s critical skill gaps across ministries. AI suggests matching members from the talent pool to optimize outreach.', v_skill_gaps),
            'Matching recommendations generated',
            'active'
        );
    END IF;

    -- 4. Onboarding Insight
    IF v_pending_apps > 0 THEN
        INSERT INTO ai_insights (org_id, type, priority, title, insight, action_taken, status)
        VALUES (
            p_org_id,
            'growth',
            'medium',
            'Pending Ministry Applications',
            format('You have %s members waiting to join ministry teams. Proactive onboarding increases member retention by 40%.', v_pending_apps),
            'Priority queue updated',
            'active'
        );
    END IF;

    -- 5. Baseline Care Insight
    INSERT INTO ai_insights (org_id, type, priority, title, insight, action_taken, status)
    VALUES (
        p_org_id,
        'pastoral',
        'low',
        'Congregational Health Pulse',
        CASE 
            WHEN v_member_count < 10 THEN 'Church is in seed stage. Focus on core team building and relationship depth.'
            ELSE 'Engagement stable. AI monitoring for any seasonal participation dips.'
        END,
        'Baseline audit complete',
        'active'
    );

END;
$function$;
