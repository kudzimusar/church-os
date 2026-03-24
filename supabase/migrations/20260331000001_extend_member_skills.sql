-- Extend member_skills table with organization and metadata columns
-- Target: public.member_skills

ALTER TABLE IF EXISTS public.member_skills 
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id),
ADD COLUMN IF NOT EXISTS skill_category TEXT,
ADD COLUMN IF NOT EXISTS skill_level TEXT,
ADD COLUMN IF NOT EXISTS years_experience INTEGER;

-- Update RLS (if needed, but usually it's already there for user_id)
-- Confirming existing RLS is sufficient for the profile page
ALTER TABLE public.member_skills ENABLE ROW LEVEL SECURITY;

-- Policy for members to manage their own skills
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'member_skills' AND policyname = 'Users can manage their own skills'
    ) THEN
        CREATE POLICY "Users can manage their own skills" ON public.member_skills
        FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Policy for admins to view all skills within their organization
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'member_skills' AND policyname = 'Admins can view all skills in org'
    ) THEN
        CREATE POLICY "Admins can view all skills in org" ON public.member_skills
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.user_roles
                WHERE user_roles.user_id = auth.uid()
                AND user_roles.org_id = member_skills.org_id
                AND user_roles.role_name IN ('admin', 'super_admin', 'pastor')
            )
        );
    END IF;
END $$;
