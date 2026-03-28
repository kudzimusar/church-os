-- Phase 4: AI Function Calling Essentials
-- Implementation of supporting tables for AI tools (Care Records, Escalations, Reminders)

-- 1. care_records (Pastoral care tasks)
CREATE TABLE IF NOT EXISTS public.care_records (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    shepherd_id uuid REFERENCES auth.users(id),
    task_type text NOT NULL, -- call, visit, prayer, check_in, follow_up
    notes text,
    status text DEFAULT 'pending', -- pending, completed, cancelled
    due_date timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. escalations (Conversational handovers)
CREATE TABLE IF NOT EXISTS public.escalations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    department text NOT NULL, -- pastoral, technical, administrative, events
    reason text NOT NULL,
    urgency text DEFAULT 'normal', -- normal, high, emergency
    status text DEFAULT 'pending', -- pending, in_progress, resolved
    assigned_to uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    resolved_at timestamptz
);

-- 3. reminders (Automated user notifications)
CREATE TABLE IF NOT EXISTS public.reminders (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    message text NOT NULL,
    reminder_type text DEFAULT 'general', -- devotion, event, prayer, follow_up
    scheduled_for timestamptz NOT NULL,
    status text DEFAULT 'pending', -- pending, sent, dismissed
    created_at timestamptz DEFAULT now(),
    sent_at timestamptz
);

-- 4. Enable RLS
ALTER TABLE public.care_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- 5. Policies
DROP POLICY IF EXISTS "Admins manage care records" ON public.care_records;
CREATE POLICY "Admins manage care records" ON public.care_records
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.org_members WHERE user_id = auth.uid() AND role IN ('shepherd', 'admin', 'owner'))
);

DROP POLICY IF EXISTS "Admins manage escalations" ON public.escalations;
CREATE POLICY "Admins manage escalations" ON public.escalations
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.org_members WHERE user_id = auth.uid() AND role IN ('admin', 'owner'))
);

DROP POLICY IF EXISTS "Users manage own reminders" ON public.reminders;
CREATE POLICY "Users manage own reminders" ON public.reminders
FOR ALL USING (user_id = auth.uid());
