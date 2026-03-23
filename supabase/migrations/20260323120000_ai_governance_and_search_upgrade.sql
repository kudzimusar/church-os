-- MIGRATION: 20260323120000_ai_governance_and_search_upgrade.sql
-- DESCRIPTION: Implements AI Cost Governance and Transcript Indexing for Search.

-- 1. AI Cost Governance
CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  job_id UUID REFERENCES job_queue(id) ON DELETE SET NULL,
  job_type TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  cost_amount NUMERIC(10, 4) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_org ON ai_usage(org_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON ai_usage(created_at);

-- 2. Extend media_assets for AI support
ALTER TABLE media_assets 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- 3. Extend public_sermons for Search Capability
ALTER TABLE public_sermons
ADD COLUMN IF NOT EXISTS transcript_text TEXT,
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- 4. Create trigger to update search_vector
CREATE OR REPLACE FUNCTION update_sermon_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector = 
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.series, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.transcript_text, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sermon_search_vector ON public_sermons;
CREATE TRIGGER trigger_sermon_search_vector
BEFORE INSERT OR UPDATE ON public_sermons
FOR EACH ROW
EXECUTE FUNCTION update_sermon_search_vector();

-- 5. GIN Index for fast search
CREATE INDEX IF NOT EXISTS idx_sermons_search_vector ON public_sermons USING GIN(search_vector);

-- 6. Add AI Quotas to organizations
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS ai_monthly_token_quota INTEGER DEFAULT 1000000,
ADD COLUMN IF NOT EXISTS ai_current_month_tokens INTEGER DEFAULT 0;

-- 7. RLS for ai_usage
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org isolation ai_usage" ON ai_usage FOR ALL USING (org_id::text IN (SELECT org_id::text FROM org_members WHERE user_id = auth.uid()));

-- 8. Add function to update transcript in sermon
-- This will be called by the AI worker to bridge media_assets and public_sermons
CREATE OR REPLACE FUNCTION sync_transcript_to_sermon()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'transcript' AND NEW.status = 'active' THEN
    UPDATE public_sermons
    SET transcript_text = NEW.metadata->>'full_text'
    WHERE id = NEW.sermon_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_transcript ON media_assets;
CREATE TRIGGER trigger_sync_transcript
AFTER INSERT OR UPDATE ON media_assets
FOR EACH ROW
EXECUTE FUNCTION sync_transcript_to_sermon();
