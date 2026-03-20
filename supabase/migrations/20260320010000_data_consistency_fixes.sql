-- Data Consistency & Dashboard Stabilization Fixes
-- Migration: 20260320010000_data_consistency_fixes.sql

-- 1. Fix member_milestones by adding org_id for isolated RLS
ALTER TABLE public.member_milestones ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);

-- Populate org_id from profiles for existing records
UPDATE public.member_milestones mm
SET org_id = p.org_id
FROM public.profiles p
WHERE mm.user_id = p.id AND mm.org_id IS NULL;

-- 2. Fix events table by adding missing is_live column
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT false;

-- 3. Fix financial_records by adding aliased column for date sorting if needed
-- The dashboard expects 'date', but table has 'given_date'
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financial_records' AND column_name = 'date') THEN
        ALTER TABLE public.financial_records ADD COLUMN "date" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        UPDATE public.financial_records SET "date" = given_date;
    END IF;
END $$;

-- 4. Implement missing AI Insights RPC
CREATE OR REPLACE FUNCTION public.refresh_ai_insights()
RETURNS void AS $$
BEGIN
    -- Currently a stub to prevent 404s, can be expanded to trigger edge functions
    NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update RLS for member_milestones to use org_id
DROP POLICY IF EXISTS "Admins read all member_milestones" ON public.member_milestones;
DROP POLICY IF EXISTS "Admins read member_milestones" ON public.member_milestones;

CREATE POLICY "Admins view org milestones" ON public.member_milestones
FOR SELECT TO authenticated
USING (
    org_id = (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'shepherd', 'ministry_lead') LIMIT 1)
);

-- 6. Ensure profiles can be updated by owners
-- (Already exists, but reinforcing for clarity)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
