-- View: vw_ministry_hub
CREATE OR REPLACE VIEW vw_ministry_hub AS
SELECT
  m.org_id,
  m.id, m.name, m.slug, m.color, m.icon,
  p.name                                      AS leader_name,
  COUNT(DISTINCT mm.id)                       AS volunteer_count,
  ma.health_score,
  ma.avg_attendance,
  ma.total_reports,
  ma.salvations,
  (SELECT MAX(mr.service_date)
   FROM ministry_reports mr
   WHERE mr.ministry_id = m.id)               AS last_report_date,
  CASE WHEN (SELECT MAX(mr.service_date)
             FROM ministry_reports mr
             WHERE mr.ministry_id = m.id)
            < (CURRENT_DATE - INTERVAL '14 days')
    THEN TRUE ELSE FALSE
  END                                          AS reporting_overdue
FROM ministries m
LEFT JOIN profiles p         ON p.id = m.leader_id
LEFT JOIN ministry_members mm ON mm.ministry_id = m.id AND mm.is_active = TRUE
LEFT JOIN ministry_analytics ma ON ma.ministry_id = m.id
  AND ma.period_type  = 'monthly'
  AND ma.period_start = date_trunc('month', CURRENT_DATE)::DATE
WHERE m.is_active = TRUE
GROUP BY m.org_id, m.id, p.name, ma.health_score, ma.avg_attendance,
         ma.total_reports, ma.salvations;

-- View: vw_growth_intelligence
CREATE OR REPLACE VIEW vw_growth_intelligence AS
SELECT
  org_id,
  DATE_TRUNC('month', service_date)         AS month,
  SUM((data->>'salvations')::numeric)           AS total_salvations,
  SUM((data->>'people_reached')::numeric)       AS people_reached,
  SUM((data->>'contacts_collected')::numeric)   AS contacts,
  COUNT(*)                                   AS outreach_events
FROM ministry_reports
WHERE report_type = 'outreach'
  AND service_date >= (CURRENT_DATE - INTERVAL '6 months')
GROUP BY org_id, DATE_TRUNC('month', service_date);

-- View: vw_attendance_reconciliation_new
CREATE OR REPLACE VIEW vw_attendance_reconciliation_new AS
SELECT
  ar.org_id,
  ar.event_date,
  ar.digital_count,
  COALESCE((mr.data->>'total_adults')::INT, 0)
  + COALESCE((mr.data->>'total_children')::INT, 0)   AS usher_headcount,
  ar.digital_count
  - COALESCE((mr.data->>'total_adults')::INT, 0)
  - COALESCE((mr.data->>'total_children')::INT, 0)   AS unregistered_gap
FROM (
  SELECT org_id, event_date, COUNT(*) AS digital_count
  FROM attendance_records
  GROUP BY org_id, event_date
) ar
LEFT JOIN ministry_reports mr
  ON  mr.service_date = ar.event_date
  AND mr.report_type  = 'offering_recon'
  AND mr.org_id       = ar.org_id
  AND mr.ministry_id  = (
    SELECT id FROM ministries
    WHERE slug = 'ushers' AND org_id = ar.org_id
  );
