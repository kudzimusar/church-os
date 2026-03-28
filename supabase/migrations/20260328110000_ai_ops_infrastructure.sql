-- AI Insight Analytics: Track effectiveness and engagement with AI shepherd insights
CREATE TABLE IF NOT EXISTS public.ai_insight_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    insight_id UUID REFERENCES public.prophetic_insights(id) ON DELETE SET NULL,
    viewed_at TIMESTAMPTZ,
    helpfulness_rating INTEGER CHECK (helpfulness_rating BETWEEN 1 AND 5),
    feedback_text TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Platform Broadcasts: System-wide admin announcements
CREATE TABLE IF NOT EXISTS public.platform_broadcasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('all', 'selected', 'plan')),
    target_ids UUID[] DEFAULT NULL, -- for 'selected' type
    plan_filter TEXT DEFAULT NULL, -- for 'plan' type
    is_urgent BOOLEAN DEFAULT false,
    scheduled_for TIMESTAMPTZ DEFAULT NULL,
    sent_at TIMESTAMPTZ DEFAULT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Broadcast Receipts: Track which organizations have received/viewed the broadcast
CREATE TABLE IF NOT EXISTS public.broadcast_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broadcast_id UUID REFERENCES public.platform_broadcasts(id) ON DELETE CASCADE,
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(broadcast_id, org_id)
);

-- RLS Policies
ALTER TABLE public.ai_insight_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_receipts ENABLE ROW LEVEL SECURITY;

-- Super Admin restricted access
-- We assume the 'super_admin' role logic from previous migrations
-- Service role can do everything (needed for Edge Functions)

CREATE POLICY "Super Admins can manage AI Insight Analytics" 
ON public.ai_insight_analytics 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

CREATE POLICY "Super Admins can manage broadcasts" 
ON public.platform_broadcasts 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

CREATE POLICY "Super Admins can manage broadcast receipts" 
ON public.broadcast_receipts 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- Allow organizations to view broadcasts targeted at them
CREATE POLICY "Organizations can view their broadcasts" 
ON public.platform_broadcasts 
FOR SELECT 
TO authenticated 
USING (
  target_type = 'all' OR 
  (target_type = 'selected' AND EXISTS (
      SELECT 1 FROM public.org_members 
      WHERE user_id = auth.uid() AND org_id = ANY(target_ids)
  )) OR
  (target_type = 'plan' AND EXISTS (
      SELECT 1 FROM public.organization_subscriptions s
      JOIN public.company_plans p ON s.plan_id = p.id
      JOIN public.org_members m ON s.org_id = m.org_id
      WHERE m.user_id = auth.uid() AND p.name = plan_filter
  ))
);

-- Allow organizations to record receipts
CREATE POLICY "Organizations can insert receipts" 
ON public.broadcast_receipts 
FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.org_members 
    WHERE user_id = auth.uid() AND org_id = broadcast_receipts.org_id
  )
);

-- Indexes for performance
CREATE INDEX idx_ai_insight_analytics_org_id ON public.ai_insight_analytics(org_id);
CREATE INDEX idx_platform_broadcasts_sent_at ON public.platform_broadcasts(sent_at);
CREATE INDEX idx_broadcast_receipts_org_id ON public.broadcast_receipts(org_id);
