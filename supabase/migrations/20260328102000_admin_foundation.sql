-- 1. Create Administration Tables

-- Company-wide subscription plans
CREATE TABLE IF NOT EXISTS company_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- 'Growth', 'Pro', 'Enterprise'
    price_monthly INTEGER NOT NULL,
    price_yearly INTEGER NOT NULL,
    features JSONB NOT NULL DEFAULT '{}',
    max_members INTEGER,
    max_storage_gb INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Organization subscriptions (linking tenants to plans)
CREATE TABLE IF NOT EXISTS organization_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES company_plans(id) NOT NULL,
    status TEXT NOT NULL DEFAULT 'trialing', -- 'trialing', 'active', 'past_due', 'canceled', 'paused'
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT false,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Admin roles for company staff
CREATE TABLE IF NOT EXISTS admin_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL DEFAULT 'support_admin', -- 'super_admin', 'support_admin', 'billing_admin', 'analytics_viewer'
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, role)
);

-- Admin audit logs
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL, -- 'impersonated_user', 'suspended_org', 'viewed_sensitive_data', 'manually_updated_subscription'
    target_type TEXT, -- 'organization', 'user', 'subscription'
    target_id UUID,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Company-wide analytics (anonymized aggregates)
CREATE TABLE IF NOT EXISTS company_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    metrics JSONB NOT NULL DEFAULT '{}', -- { active_orgs, total_members, mrr, churn_rate }
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Organization features for churn analytics
CREATE TABLE IF NOT EXISTS organization_features (
    org_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
    engagement_score FLOAT DEFAULT 0.0,
    churn_probability FLOAT DEFAULT 0.0,
    last_journal_at TIMESTAMPTZ,
    active_member_count INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- AI Feedback for PIL insights
CREATE TABLE IF NOT EXISTS ai_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insight_id UUID NOT NULL, -- references prophetic_insights(id)
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    was_helpful BOOLEAN,
    feedback_text TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Update Organizations Table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS ai_training_opt_in BOOLEAN DEFAULT false;

-- 3. Security (RLS)

-- Enable RLS on all new tables
ALTER TABLE company_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;

-- Super Admin Bypass Policy Pattern
-- Any user with 'super_admin' in admin_roles can access these tables.

CREATE POLICY "Admins can manage plans" ON company_plans
    FOR ALL USING (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "Admins can manage subscriptions" ON organization_subscriptions
    FOR ALL USING (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'billing_admin')));

CREATE POLICY "Admins can view audit logs" ON admin_audit_logs
    FOR SELECT USING (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "System generates audit logs" ON admin_audit_logs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can view company analytics" ON company_analytics
    FOR SELECT USING (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'analytics_viewer')));

CREATE POLICY "Admins can view org features" ON organization_features
    FOR SELECT USING (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'support_admin', 'analytics_viewer')));

CREATE POLICY "Admins can manage roles" ON admin_roles
    FOR ALL USING (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid() AND role = 'super_admin'));

-- 4. Seed Data (Initial Plans)
INSERT INTO company_plans (name, price_monthly, price_yearly, features) VALUES
('Lite', 29, 290, '{"api_calls": 1000, "support": "standard"}'),
('Pro', 79, 790, '{"api_calls": 10000, "support": "priority", "mcp_access": true}'),
('Enterprise', 0, 0, '{"api_calls": -1, "support": "dedicated"}')
ON CONFLICT (name) DO NOTHING;
