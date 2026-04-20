
-- Migration: Kingdom Class Structured Data Layer
-- Fragmenting enrollment data for stats & analytics

CREATE TABLE IF NOT EXISTS public.kingdom_class_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    track TEXT NOT NULL,
    learning_level TEXT NOT NULL,
    heard_via TEXT,
    wants_online BOOLEAN DEFAULT false,
    notes TEXT,
    status TEXT DEFAULT 'pending', -- pending, accepted, rejected, paid
    is_notified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.kingdom_class_applications ENABLE ROW LEVEL SECURITY;

-- Allow public enrollment
CREATE POLICY "Public can enroll in kingdom class" ON public.kingdom_class_applications
    FOR INSERT WITH CHECK (true);

-- Allow admins to manage
CREATE POLICY "Admins can manage kingdom class" ON public.kingdom_class_applications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.org_members
            WHERE user_id = auth.uid()
            AND org_id = kingdom_class_applications.org_id
            AND role IN ('admin', 'owner', 'shepherd', 'pastor')
        )
    );

-- Indexing for analytics
CREATE INDEX IF NOT EXISTS idx_kingdom_class_track ON public.kingdom_class_applications(track);
CREATE INDEX IF NOT EXISTS idx_kingdom_class_org ON public.kingdom_class_applications(org_id);
