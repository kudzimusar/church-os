-- Migration: onboarding_drafts
-- Purpose: Server-side persistence for onboarding wizard progress.
--          Allows users to resume from any device, survive browser clears,
--          and recover from registration failures.

CREATE TABLE IF NOT EXISTS public.onboarding_drafts (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT        NOT NULL UNIQUE,
  identity_id  UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  form_data    JSONB       NOT NULL DEFAULT '{}',
  current_step TEXT        NOT NULL DEFAULT 'Identity',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days')
);

CREATE INDEX IF NOT EXISTS idx_onboarding_drafts_identity_id ON public.onboarding_drafts(identity_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_drafts_email       ON public.onboarding_drafts(email);

ALTER TABLE public.onboarding_drafts ENABLE ROW LEVEL SECURITY;

-- Authenticated users can fully manage their own draft row
CREATE POLICY "Users manage own onboarding draft"
  ON public.onboarding_drafts
  FOR ALL
  USING  (identity_id = auth.uid())
  WITH CHECK (identity_id = auth.uid());

-- Auto-update updated_at on change
CREATE OR REPLACE FUNCTION public.set_onboarding_draft_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_onboarding_drafts_updated_at
  BEFORE UPDATE ON public.onboarding_drafts
  FOR EACH ROW EXECUTE FUNCTION public.set_onboarding_draft_updated_at();

COMMENT ON TABLE public.onboarding_drafts IS
  'Stores in-progress onboarding wizard state per user. Cleared on successful registration.';
