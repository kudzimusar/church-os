-- ==============================================================================
-- Migration: 20260422000001_intelligence_logic_motor.sql
-- Description: Implements the calculation engine for Ministry Health Scores
--              and automated activity heartbeats.
-- ==============================================================================

BEGIN;

-- 1. FUNCTION: CALCULATE MINISTRY HEALTH SCORE
-- Logic: 
-- 40% Reporting Consistency (Did they file a report by the deadline?)
-- 40% Attendance Trend (Is the latest value higher than the average?)
-- 20% Team Capacity (Silo-dependent)
CREATE OR REPLACE FUNCTION public.calculate_ministry_health(p_ministry_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_reporting_score NUMERIC := 0;
    v_attendance_score NUMERIC := 0;
    v_total_score INTEGER;
    v_last_report_days INTEGER;
    v_trend_ratio NUMERIC;
BEGIN
    -- A. Calculate Reporting Consistency (weighted 40%)
    -- How many days since the last report?
    SELECT (EXTRACT(DAY FROM (now() - recorded_at))) INTO v_last_report_days
    FROM public.ministry_metric_logs
    WHERE ministry_id = p_ministry_id
    ORDER BY recorded_at DESC LIMIT 1;

    IF v_last_report_days IS NULL THEN v_reporting_score := 0;
    ELSIF v_last_report_days <= 7 THEN v_reporting_score := 40;
    ELSIF v_last_report_days <= 14 THEN v_reporting_score := 20;
    ELSE v_reporting_score := 5;
    END IF;

    -- B. Calculate Trend (weighted 40%)
    -- Simple logic: latest value vs average of last 5
    WITH latest_vals AS (
        SELECT value FROM public.ministry_metric_logs 
        WHERE ministry_id = p_ministry_id 
        ORDER BY recorded_at DESC LIMIT 5
    )
    SELECT (latest.value / NULLIF(avg_val.v, 0)) INTO v_trend_ratio
    FROM (SELECT value FROM latest_vals LIMIT 1) latest,
         (SELECT AVG(value) as v FROM latest_vals) avg_val;

    IF v_trend_ratio >= 1.05 THEN v_attendance_score := 40;
    ELSIF v_trend_ratio >= 0.95 THEN v_attendance_score := 30;
    ELSE v_attendance_score := 10;
    END IF;

    -- C. Final Score (Base 20 + A + B)
    v_total_score := 20 + v_reporting_score + v_attendance_score;
    
    RETURN LEAST(100, v_total_score);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. TRIGGER: AUTO-UPDATE HEALTH SNAPSHOT
CREATE OR REPLACE FUNCTION public.tr_update_ministry_health()
RETURNS TRIGGER AS $$
DECLARE
    v_new_score INTEGER;
    v_old_score INTEGER;
    v_trend TEXT;
BEGIN
    v_new_score := public.calculate_ministry_health(NEW.ministry_id);
    
    SELECT score INTO v_old_score 
    FROM public.ministry_health_snapshots 
    WHERE ministry_id = NEW.ministry_id 
    ORDER BY recorded_at DESC LIMIT 1;

    IF v_new_score > v_old_score THEN v_trend := 'up';
    ELSIF v_new_score < v_old_score THEN v_trend := 'down';
    ELSE v_trend := 'stable';
    END IF;

    INSERT INTO public.ministry_health_snapshots (ministry_id, score, trend_direction)
    VALUES (NEW.ministry_id, v_new_score, v_trend);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_health_on_metric_log ON public.ministry_metric_logs;
CREATE TRIGGER update_health_on_metric_log
AFTER INSERT ON public.ministry_metric_logs
FOR EACH ROW EXECUTE FUNCTION public.tr_update_ministry_health();

-- 3. TRIGGER: AUTO-LOG HEARTBEAT FOR LEADERS
CREATE OR REPLACE FUNCTION public.tr_auto_heartbeat()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.member_activity_heartbeats (user_id, activity_type, metadata)
    VALUES (
        NEW.recorded_by, 
        'report_submit', 
        jsonb_build_object('ministry_id', NEW.ministry_id, 'metric', NEW.metric_key)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS report_heartbeat ON public.ministry_metric_logs;
CREATE TRIGGER report_heartbeat
AFTER INSERT ON public.ministry_metric_logs
FOR EACH ROW
WHEN (NEW.recorded_by IS NOT NULL)
EXECUTE FUNCTION public.tr_auto_heartbeat();

COMMIT;
