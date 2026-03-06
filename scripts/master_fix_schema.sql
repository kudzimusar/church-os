-- CHURCH OS: MASTER OPERATIONAL INTELLIGENCE SCHEMA
-- This script consolidates the necessary tables, views, and functions for the Digital Ministry Forms & Intelligence Engine.

-- 1. CORE INTELLIGENCE TABLES
CREATE TABLE IF NOT EXISTS public.prophetic_insights (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category text NOT NULL, -- 'drop_off', 'conversion', 'volunteer', 'geo', 'ministry_performance'
    subject_id uuid,
    probability_score integer CHECK (probability_score BETWEEN 0 AND 100),
    risk_level text DEFAULT 'low',
    insight_title text NOT NULL,
    insight_description text,
    recommended_action text,
    metadata jsonb DEFAULT '{}'::jsonb,
    is_acknowledged boolean DEFAULT false,
    generated_at timestamptz DEFAULT now()
);

-- 2. OPERATIONAL DATA TABLES
CREATE TABLE IF NOT EXISTS public.kids_registry (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    child_name text NOT NULL,
    age int,
    parent_name text,
    allergies text,
    check_in_time timestamptz DEFAULT now(),
    checked_out_at timestamptz,
    supervised_by uuid REFERENCES auth.users(id),
    status text DEFAULT 'checked_in',
    created_at timestamptz DEFAULT now()
);

-- 3. INTELLIGENCE VIEWS
-- View for AI Feed: Dynamic Forms + Ministry Core
CREATE OR REPLACE VIEW public.vw_ministry_intelligence_feed AS
SELECT 
    fs.id as submission_id,
    f.name as form_name,
    fs.org_id,
    fs.submitted_at::date as event_date,
    CASE 
        WHEN f.name = 'Usher Headcount Report' THEN 'attendance'
        WHEN f.name = 'Evangelism Activity Log' THEN 'evangelism'
        WHEN f.name = 'Prayer Request Intake' THEN 'spiritual'
        ELSE 'operation'
    END as metric_type,
    (SELECT field_name || ': ' || field_value FROM public.form_submission_values WHERE submission_id = fs.id LIMIT 1) as detail,
    COALESCE((SELECT field_value::numeric FROM public.form_submission_values WHERE submission_id = fs.id AND field_name IN ('Total Adults', 'Reach Decision', 'Number of Children') LIMIT 1), 0) as value,
    'Submitted by leader ' || fs.user_id as context
FROM public.form_submissions fs
JOIN public.forms f ON fs.form_id = f.id;

-- View for Attendance Reconciliation
CREATE OR REPLACE VIEW public.vw_attendance_reconciliation AS
WITH digital AS (
    SELECT event_date, count(*) as digital_count
    FROM public.attendance_records
    GROUP BY event_date
),
manual AS (
    SELECT report_date, SUM(total_count) as manual_count
    FROM public.service_reports
    GROUP BY report_date
)
SELECT 
    COALESCE(m.report_date, d.event_date) as report_date,
    COALESCE(m.manual_count, 0) as total_physical,
    COALESCE(d.digital_count, 0) as total_digital,
    (COALESCE(m.manual_count, 0) - COALESCE(d.digital_count, 0)) as unregistered_count
FROM manual m
FULL OUTER JOIN digital d ON m.report_date = d.event_date;

-- 4. CROSS-LINKING FUNCTIONS (Dispatcher)
-- Called via RPC from the app layer after all form values are stored.
CREATE OR REPLACE FUNCTION public.finalize_form_submission(p_submission_id uuid) 
RETURNS jsonb AS $$
DECLARE
    v_form_name text;
    v_values jsonb;
    v_org_id uuid;
    v_user_id uuid;
    v_sub record;
BEGIN
    SELECT * INTO v_sub FROM public.form_submissions WHERE id = p_submission_id;
    IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Submission not found'); END IF;

    v_org_id := v_sub.org_id;
    v_user_id := v_sub.user_id;

    SELECT name INTO v_form_name FROM public.forms WHERE id = v_sub.form_id;
    SELECT jsonb_object_agg(field_name, field_value) INTO v_values 
    FROM (
        SELECT f.label as field_name, fsv.field_value 
        FROM public.form_submission_values fsv
        JOIN public.form_fields f ON fsv.field_id = f.id
        WHERE fsv.submission_id = p_submission_id
    ) val;

    -- USHER REPORT SYNC
    IF v_form_name = 'Usher Headcount Report' THEN
        INSERT INTO public.service_reports (org_id, report_date, service_type, adults_count, children_count, total_count, submitted_by)
        VALUES (v_org_id, v_sub.submitted_at::date, 'Sunday Service', COALESCE((v_values->>'Adults')::int, 0), COALESCE((v_values->>'Children')::int, 0), COALESCE((v_values->>'Total')::int, 0), v_user_id)
        ON CONFLICT (org_id, report_date, service_type) DO UPDATE SET 
            adults_count = EXCLUDED.adults_count, 
            children_count = EXCLUDED.children_count,
            total_count = EXCLUDED.total_count;
    
    -- KIDS REGISTRY SYNC
    ELSIF v_form_name = 'Child Check-In' THEN
        INSERT INTO public.kids_registry (org_id, child_name, age, parent_name, allergies, supervised_by)
        VALUES (v_org_id, v_values->>'Child Name', (v_values->>'Age')::int, v_values->>'Parent/Guardian Name', v_values->>'Allergies', v_user_id);
    END IF;

    UPDATE public.form_submissions SET processed_at = now() WHERE id = p_submission_id;
    RETURN jsonb_build_object('success', true, 'form', v_form_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. INITIAL FORM SEEDING
-- (Example seeds for Children and Outreach)
INSERT INTO public.forms (name, description, category) 
VALUES 
('Child Check-In', 'Digital registration for children services', 'children'),
('Evangelism Log', 'Capture outreach decisions and follow-up needs', 'evangelism')
ON CONFLICT (name) DO NOTHING;

-- Seed Fields for Child Check-In (simplified example)
ALTER TABLE public.form_fields DROP CONSTRAINT IF EXISTS form_fields_form_id_label_key;
ALTER TABLE public.form_fields ADD CONSTRAINT form_fields_form_id_label_key UNIQUE (form_id, label);

INSERT INTO public.form_fields (form_id, label, field_type, is_required, sort_order)
SELECT id, 'Child Name', 'text', true, 1 FROM public.forms WHERE name = 'Child Check-In'
ON CONFLICT (form_id, label) DO NOTHING;
INSERT INTO public.form_fields (form_id, label, field_type, is_required, sort_order)
SELECT id, 'Age', 'number', true, 2 FROM public.forms WHERE name = 'Child Check-In'
ON CONFLICT (form_id, label) DO NOTHING;
INSERT INTO public.form_fields (form_id, label, field_type, is_required, sort_order)
SELECT id, 'Parent/Guardian Name', 'text', true, 3 FROM public.forms WHERE name = 'Child Check-In'
ON CONFLICT (form_id, label) DO NOTHING;
INSERT INTO public.form_fields (form_id, label, field_type, is_required, sort_order)
SELECT id, 'Allergies', 'text', false, 4 FROM public.forms WHERE name = 'Child Check-In'
ON CONFLICT (form_id, label) DO NOTHING;

NOTIFY pgrst, 'reload schema';
