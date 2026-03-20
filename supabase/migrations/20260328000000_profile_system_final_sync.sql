-- Comprehensive Profile System Synchronization
-- This migration ensures all 11 tabs in the profile hub are backed by the correct schema.

-- 1. Identity & Profiles
-- Add missing fields for Giving and UI state tracking
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'marital_status') THEN
        ALTER TABLE public.profiles ADD COLUMN marital_status text;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'wedding_anniversary') THEN
        ALTER TABLE public.profiles ADD COLUMN wedding_anniversary date;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'tithe_status') THEN
        ALTER TABLE public.profiles ADD COLUMN tithe_status boolean DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferred_giving_method') THEN
        ALTER TABLE public.profiles ADD COLUMN preferred_giving_method text;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'household_type') THEN
        ALTER TABLE public.profiles ADD COLUMN household_type text;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'invite_method') THEN
        ALTER TABLE public.profiles ADD COLUMN invite_method text;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'invited_by_name') THEN
        ALTER TABLE public.profiles ADD COLUMN invited_by_name text;
    END IF;
END $$;

-- 2. Households
-- Standardize names to match frontend expectations established in loadData
DO $$
BEGIN
    -- Rename 'name' to 'household_name' if it exists
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'households' AND column_name = 'name') AND 
       NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'households' AND column_name = 'household_name') THEN
        ALTER TABLE public.households RENAME COLUMN name TO household_name;
    END IF;

    -- Rename 'head_user_id' to 'head_id' if it exists
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'households' AND column_name = 'head_user_id') AND 
       NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'households' AND column_name = 'head_id') THEN
        ALTER TABLE public.households RENAME COLUMN head_user_id TO head_id;
    END IF;
END $$;

-- 3. Guardian Links
-- Ensure multi-tenancy support for Junior Church enrollments
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'guardian_links' AND column_name = 'org_id') THEN
        ALTER TABLE public.guardian_links ADD COLUMN org_id uuid REFERENCES public.organizations(id);
    END IF;
END $$;

-- 4. Attendance
-- Ensure attendance_logs exists as a high-frequency write buffer for check-ins
CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id),
    guardian_id uuid REFERENCES auth.users(id), -- For child check-ins
    child_link_id uuid, -- Reference to guardian_links record
    service_id uuid,
    service_date date DEFAULT CURRENT_DATE,
    check_in_time timestamptz DEFAULT now(),
    status text DEFAULT 'present',
    org_id uuid REFERENCES public.organizations(id),
    metadata jsonb DEFAULT '{}'::jsonb,
    UNIQUE(user_id, service_date),
    UNIQUE(child_link_id, service_date)
);

-- RLS for attendance_logs
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can log their own attendance') THEN
        CREATE POLICY "Users can log their own attendance" ON public.attendance_logs 
            FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = guardian_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own logs') THEN
        CREATE POLICY "Users can view their own logs" ON public.attendance_logs 
            FOR SELECT USING (auth.uid() = user_id OR auth.uid() = guardian_id);
    END IF;
END $$;

-- 5. Notifications
-- Create missing table for internal system alerts and invites
CREATE TABLE IF NOT EXISTS public.member_notifications (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id),
    title text,
    message text,
    type text DEFAULT 'system',
    is_read boolean DEFAULT false,
    org_id uuid REFERENCES public.organizations(id),
    created_at timestamptz DEFAULT now()
);

-- RLS for member_notifications
ALTER TABLE public.member_notifications ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their notifications') THEN
        CREATE POLICY "Users can manage their notifications" ON public.member_notifications 
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;
