-- ============================================================
-- CHURCH OS: UNIFIED DATA SPINE (CONVERGENCE MIGRATION)
-- Phase 1: Creating the master architecture for deep alignment
-- ============================================================

-- 1. EXTEND MINISTRIES AND ROLES
-- Standardized List: worship, choir, media, ushers, hospitality, childrens, youth, 
-- young_adults, intercessory, evangelism, discipleship, small_groups, marriage, 
-- mens, womens, counseling, protocol, missions, administration, finance, 
-- technical, translation, outreach, community_service, worship_dance

-- 2. MASTER ACTIVITY LEDGER
CREATE TABLE IF NOT EXISTS public.activity_log (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type text NOT NULL, 
    -- e.g., member_joined, member_baptized, attendance_checkin, prayer_request, 
    -- ministry_join, devotion_entry, giving_submitted, soap_entry
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- 3. JUNIOR CHURCH & CHILDREN'S MINISTRY
CREATE TABLE IF NOT EXISTS public.children_checkins (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    child_name text NOT NULL,
    guardian_id uuid REFERENCES auth.users(id),
    room_name text, -- e.g., Toddlers, Ages 5-7, Pre-teens
    check_in_time timestamptz DEFAULT now(),
    check_out_time timestamptz,
    status text DEFAULT 'checked_in', -- checked_in, checked_out
    notes text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.guardian_links (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    guardian_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    child_name text NOT NULL,
    relationship text DEFAULT 'Parent', -- Parent, Legal Guardian, Sibling
    child_birthdate date,
    medical_notes text,
    created_at timestamptz DEFAULT now(),
    UNIQUE(guardian_id, child_name)
);

-- 4. UNIFIED MINISTRY OPERATIONAL REPORTS
-- This table replaces fragmented reporting and allows any ministry to log metrics
CREATE TABLE IF NOT EXISTS public.ministry_reports (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    submitted_by uuid REFERENCES auth.users(id),
    ministry_name text NOT NULL,
    report_date date DEFAULT CURRENT_DATE,
    metrics jsonb NOT NULL, 
    -- Dynamic data: { "attendance": 120, "first_timers": 5, "livestream_views": 450, "souls_won": 2 }
    summary text,
    created_at timestamptz DEFAULT now()
);

-- 5. SPIRITUAL JOURNEY MILESTONES (Formalized)
CREATE TABLE IF NOT EXISTS public.member_milestones (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    first_visit_date date,
    salvation_date date,
    foundation_class_date date,
    baptism_date date,
    membership_date date,
    leadership_training_date date,
    ordained_date date,
    custom_milestones jsonb DEFAULT '[]',
    updated_at timestamptz DEFAULT now()
);

-- 6. OUTREACH & EVANGELISM CONTACTS
CREATE TABLE IF NOT EXISTS public.outreach_contacts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    interviewer_id uuid REFERENCES auth.users(id),
    contact_name text NOT NULL,
    contact_phone text,
    location text,
    spiritual_status text, -- e.g., Unbeliever, Backslidden, Seeking
    follow_up_required boolean DEFAULT true,
    notes text,
    created_at timestamptz DEFAULT now()
);

-- 7. NOTIFICATIONS SYSTEM
CREATE TABLE IF NOT EXISTS public.member_notifications (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    type text NOT NULL, -- invitation, alert, general, success
    title text NOT NULL,
    message text NOT NULL,
    metadata jsonb DEFAULT '{}',
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- 8. UNIFY INSIGHTS (Ensuring dashboard queries work)
-- Bridge prophetic_insights and ai_insights if they differ
-- (Assuming we use prophetic_insights as the primary based on recent UI changes)
CREATE TABLE IF NOT EXISTS public.prophetic_insights (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    subject_id uuid REFERENCES auth.users(id), -- Null if for whole church
    category text NOT NULL, -- retention, growth, spiritual_health, drop_off
    insight_title text NOT NULL,
    insight_description text NOT NULL,
    probability_score int DEFAULT 50,
    risk_level text DEFAULT 'low', -- low, medium, high, critical
    metadata jsonb DEFAULT '{}',
    is_acknowledged boolean DEFAULT false,
    generated_at timestamptz DEFAULT now()
);

-- 9. TRIGGERS FOR MASTER LEDGER
-- Automatically log key events to activity_log for AI analysis

CREATE OR REPLACE FUNCTION public.log_member_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.activity_log (org_id, user_id, activity_type, metadata)
    VALUES (
        (SELECT org_id FROM public.profiles WHERE id = NEW.user_id),
        NEW.user_id,
        TG_ARGV[0],
        row_to_json(NEW)::jsonb
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply triggers
DROP TRIGGER IF EXISTS tr_log_soap ON public.soap_entries;
CREATE TRIGGER tr_log_soap AFTER INSERT ON public.soap_entries
FOR EACH ROW EXECUTE FUNCTION public.log_member_activity('soap_entry');

DROP TRIGGER IF EXISTS tr_log_attendance ON public.attendance_records;
CREATE TRIGGER tr_log_attendance AFTER INSERT ON public.attendance_records
FOR EACH ROW EXECUTE FUNCTION public.log_member_activity('attendance_checkin');

DROP TRIGGER IF EXISTS tr_log_prayer ON public.prayer_requests;
CREATE TRIGGER tr_log_prayer AFTER INSERT ON public.prayer_requests
FOR EACH ROW EXECUTE FUNCTION public.log_member_activity('prayer_request');

-- RLS POLICIES FOR NEW TABLES
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardian_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministry_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prophetic_insights ENABLE ROW LEVEL SECURITY;

-- Default "Admins can see all" policies
CREATE POLICY "Admins read all activity" ON public.activity_log FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.org_members WHERE user_id = auth.uid() AND role IN ('shepherd', 'admin', 'owner'))
);

CREATE POLICY "Guardians manage children" ON public.guardian_links FOR ALL USING (guardian_id = auth.uid());

CREATE POLICY "Users read own notifications" ON public.member_notifications FOR SELECT USING (user_id = auth.uid());

-- (Additional specific policies will be refined during execution)
