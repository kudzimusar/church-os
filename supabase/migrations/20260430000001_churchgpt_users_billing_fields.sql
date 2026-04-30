-- Add Stripe billing fields to churchgpt_users so individual subscribers
-- can be tracked without requiring an organization record.
ALTER TABLE public.churchgpt_users
  ADD COLUMN IF NOT EXISTS stripe_customer_id     text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS subscription_status    text NOT NULL DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS trial_ends_at          timestamptz,
  ADD COLUMN IF NOT EXISTS period_ends_at         timestamptz;

-- Unique index so webhook upserts don't double-insert
CREATE UNIQUE INDEX IF NOT EXISTS churchgpt_users_stripe_sub_idx
  ON public.churchgpt_users (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- Quota limits per plan (reference values used by the gateway quota check)
-- These are updated by the stripe-webhook on subscription events.
CREATE OR REPLACE FUNCTION public.churchgpt_quota_for_plan(p_plan text)
RETURNS integer
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE p_plan
    WHEN 'lite'       THEN 500
    WHEN 'pro'        THEN 3000
    WHEN 'enterprise' THEN -1   -- -1 = unlimited
    ELSE 50                     -- starter / free
  END;
$$;
