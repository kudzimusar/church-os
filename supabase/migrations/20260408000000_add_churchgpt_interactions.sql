-- Migration: add_churchgpt_interactions
-- Purpose: Log ChurchGPT usage per org for ministry analytics

CREATE TABLE IF NOT EXISTS churchgpt_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  member_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_type TEXT DEFAULT 'general',
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_churchgpt_org_created 
  ON churchgpt_interactions(org_id, created_at DESC);

ALTER TABLE churchgpt_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members see own churchgpt interactions"
  ON churchgpt_interactions FOR SELECT
  USING (member_id = auth.uid());

CREATE POLICY "Org admins see all churchgpt interactions"
  ON churchgpt_interactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = churchgpt_interactions.org_id
        AND org_members.user_id = auth.uid()
        AND org_members.role IN ('admin', 'pastor', 'leader')
    )
  );

CREATE POLICY "Service role can insert churchgpt interactions"
  ON churchgpt_interactions FOR INSERT
  WITH CHECK (true);
