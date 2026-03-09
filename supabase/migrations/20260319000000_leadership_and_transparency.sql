-- 1. Attendance Logs
-- Enables predictive planning (in-person/online/not-attending)
CREATE TABLE IF NOT EXISTS attendance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('in-person', 'online', 'not-attending')),
  service_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, service_date)
);

-- 2. Newsletters
-- Stores weekly updates and "Impact Numbers"
CREATE TABLE IF NOT EXISTS newsletters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content JSONB, -- { "impact_metrics": {...}, "message": "...", "cta_links": [...] }
  published_at TIMESTAMPTZ DEFAULT NOW(),
  author_id UUID REFERENCES auth.users(id),
  is_published BOOLEAN DEFAULT TRUE
);

-- 3. Social Media Metrics
-- Tracks platform ROI (manual entry or future API sync)
CREATE TABLE IF NOT EXISTS social_media_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform TEXT NOT NULL, -- 'instagram', 'facebook', 'youtube', 'tiktok'
  reach INTEGER DEFAULT 0,
  engagement INTEGER DEFAULT 0,
  followers INTEGER DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_metrics ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Attendance Logs: 
-- Users can manage their own log entries.
-- Leadership can view all entries for planning.
CREATE POLICY "Users can manage own attendance logs" ON attendance_logs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Leadership can view all attendance logs" ON attendance_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_members.user_id = auth.uid() 
      AND org_members.role IN ('shepherd', 'admin', 'owner', 'ministry_lead')
    )
  );

-- Newsletters:
-- Leadership can manage newsletters.
-- All authenticated users can read published newsletters.
CREATE POLICY "Leadership can manage newsletters" ON newsletters
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_members.user_id = auth.uid() 
      AND org_members.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Authenticated users can read newsletters" ON newsletters
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_published = TRUE);

-- Social Media Metrics:
-- Leadership only (Data-sensitive)
CREATE POLICY "Leadership can manage social metrics" ON social_media_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_members.user_id = auth.uid() 
      AND org_members.role IN ('admin', 'owner')
    )
  );
