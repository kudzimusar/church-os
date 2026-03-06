-- Church OS: Reports System & Ministry Fixes
-- 1. Fix the member_roles vs ministry_members discrepancy
-- We use public.ministry_members as the source of truth for ministry involvement.

-- Add missing columns to ministry_members if they were meant for member_roles
ALTER TABLE public.ministry_members ADD COLUMN IF NOT EXISTS status text DEFAULT 'active'; 
-- status: active, pending_invitation, declined, former
ALTER TABLE public.ministry_members ADD COLUMN IF NOT EXISTS invited_by uuid REFERENCES auth.users(id);
ALTER TABLE public.ministry_members ADD COLUMN IF NOT EXISTS invitation_date timestamptz DEFAULT now();
ALTER TABLE public.ministry_members ADD COLUMN IF NOT EXISTS notes text;

-- 2. Create Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    author_id uuid REFERENCES auth.users(id),
    title text NOT NULL,
    report_type text NOT NULL, -- health, financial, growth, directory
    content text NOT NULL, -- JSON or Markdown content
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- 3. RLS for Reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage reports" ON public.reports FOR ALL USING (
    EXISTS (SELECT 1 FROM public.org_members WHERE user_id = auth.uid() AND role IN ('shepherd', 'admin', 'owner'))
);

-- 4. Ensure Events table has created_by
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);

-- 5. Notify PostgREST to reload
NOTIFY pgrst, 'reload schema';
