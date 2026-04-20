
-- Migration: Fix public_inquiries schema for the Language School and Multi-tenancy
-- Ensures all required columns exist for enrollment submissions

DO $$ 
BEGIN
    -- 1. org_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='public_inquiries' AND column_name='org_id') THEN
        ALTER TABLE public.public_inquiries ADD COLUMN org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
    END IF;

    -- 2. phone
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='public_inquiries' AND column_name='phone') THEN
        ALTER TABLE public.public_inquiries ADD COLUMN phone TEXT;
    END IF;

    -- 3. visitor_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='public_inquiries' AND column_name='visitor_type') THEN
        ALTER TABLE public.public_inquiries ADD COLUMN visitor_type TEXT;
    END IF;

    -- 4. how_heard
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='public_inquiries' AND column_name='how_heard') THEN
        ALTER TABLE public.public_inquiries ADD COLUMN how_heard TEXT;
    END IF;

    -- 5. status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='public_inquiries' AND column_name='status') THEN
        ALTER TABLE public.public_inquiries ADD COLUMN status TEXT DEFAULT 'new';
    END IF;

    -- 6. merged_profile_id (Just in case migration Step 1.4 was skipped)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='public_inquiries' AND column_name='merged_profile_id') THEN
        ALTER TABLE public.public_inquiries ADD COLUMN merged_profile_id UUID REFERENCES public.profiles(id);
    END IF;

END $$;

-- 2. Update RLS to ensure anyone can still insert
DROP POLICY IF EXISTS "anyone_can_submit" ON public.public_inquiries;
CREATE POLICY "anyone_can_submit" ON public.public_inquiries 
  FOR INSERT WITH CHECK (true);

-- 3. Ensure the jk-devotion-app Org exists (Pilot fallback)
INSERT INTO public.organizations (id, name, church_slug)
VALUES ('fa547adf-f820-412f-9458-d6bade11517d', 'Japan Kingdom Church', 'jkc')
ON CONFLICT (id) DO UPDATE SET church_slug = 'jkc';
