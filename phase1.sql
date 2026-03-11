-- 3.1  ministries
CREATE TABLE IF NOT EXISTS ministries (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  slug        TEXT        NOT NULL,
  description TEXT,
  category    TEXT        DEFAULT 'general',
  leader_id   UUID        REFERENCES auth.users(id),
  color       TEXT        DEFAULT '#6366F1',
  icon        TEXT        DEFAULT 'users',
  is_active   BOOLEAN     DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, slug)
);

-- 3.2  ministry_reports
CREATE TABLE IF NOT EXISTS ministry_reports (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id       UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ministry_id  UUID        NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
  submitted_by UUID        NOT NULL REFERENCES auth.users(id),
  report_type  TEXT        NOT NULL,
  service_date DATE        NOT NULL DEFAULT CURRENT_DATE,
  data         JSONB       NOT NULL DEFAULT '{}',
  status       TEXT        DEFAULT 'submitted',
  reviewed_by  UUID        REFERENCES auth.users(id),
  reviewed_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ministry_reports_ministry_date
  ON ministry_reports(ministry_id, service_date DESC);
CREATE INDEX IF NOT EXISTS idx_ministry_reports_org_type
  ON ministry_reports(org_id, report_type, service_date DESC);
CREATE INDEX IF NOT EXISTS idx_ministry_reports_data
  ON ministry_reports USING GIN(data);

-- 3.3  ministry_events
CREATE TABLE IF NOT EXISTS ministry_events (
  id                 UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id             UUID    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ministry_id        UUID    NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
  created_by         UUID    REFERENCES auth.users(id),
  event_name         TEXT    NOT NULL,
  event_type         TEXT    DEFAULT 'regular',
  event_date         DATE    NOT NULL,
  location           TEXT,
  expected_attendance INT    DEFAULT 0,
  actual_attendance   INT    DEFAULT 0,
  visitor_count       INT    DEFAULT 0,
  salvations          INT    DEFAULT 0,
  notes               TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ministry_events_ministry
  ON ministry_events(ministry_id, event_date DESC);

-- 3.4  ministry_announcements
CREATE TABLE IF NOT EXISTS ministry_announcements (
  id          UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      UUID    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ministry_id UUID    REFERENCES ministries(id),
  author_id   UUID    NOT NULL REFERENCES auth.users(id),
  direction   TEXT    NOT NULL DEFAULT 'downward',
  title       TEXT    NOT NULL,
  body        TEXT    NOT NULL,
  priority    TEXT    DEFAULT 'normal',
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3.5  form_templates
CREATE TABLE IF NOT EXISTS form_templates (
  id          UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      UUID    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ministry_id UUID    REFERENCES ministries(id),
  name        TEXT    NOT NULL,
  report_type TEXT    NOT NULL,
  description TEXT,
  fields      JSONB   NOT NULL DEFAULT '[]',
  is_active   BOOLEAN DEFAULT TRUE,
  version     INT     DEFAULT 1,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3.6  ministry_analytics
CREATE TABLE IF NOT EXISTS ministry_analytics (
  id              UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ministry_id     UUID    NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
  period_start    DATE    NOT NULL,
  period_end      DATE    NOT NULL,
  period_type     TEXT    DEFAULT 'weekly',
  avg_attendance  NUMERIC(8,2) DEFAULT 0,
  total_reports   INT     DEFAULT 0,
  volunteer_count INT     DEFAULT 0,
  event_count     INT     DEFAULT 0,
  salvations      INT     DEFAULT 0,
  visitor_count   INT     DEFAULT 0,
  health_score    INT     DEFAULT 0,
  computed_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ministry_id, period_start, period_type)
);

-- 3.7  Confirm & Update ministry_members
ALTER TABLE ministry_members ADD COLUMN IF NOT EXISTS ministry_role TEXT DEFAULT 'member';
ALTER TABLE ministry_members ADD COLUMN IF NOT EXISTS ministry_id  UUID REFERENCES ministries(id);
ALTER TABLE ministry_members ADD COLUMN IF NOT EXISTS joined_at    TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE ministry_members ADD COLUMN IF NOT EXISTS is_active    BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_ministry_members_user_ministry
  ON ministry_members(user_id, ministry_id) WHERE is_active = TRUE;

-- 4.1  Auto-update analytics cache on every report submission
CREATE OR REPLACE FUNCTION update_ministry_analytics_on_report()
RETURNS TRIGGER AS $$
DECLARE
  v_period_start  DATE    := date_trunc('week', NEW.service_date)::DATE;
  v_period_end    DATE    := (date_trunc('week', NEW.service_date) + INTERVAL '6 days')::DATE;
  v_attendance    INT     := COALESCE((NEW.data->>'total_adults')::INT, 0)
                           + COALESCE((NEW.data->>'total_children')::INT, 0);
  v_visitors      INT     := COALESCE((NEW.data->>'first_time_visitors')::INT, 0);
  v_salvations    INT     := COALESCE((NEW.data->>'salvations')::INT, 0);
BEGIN
  INSERT INTO ministry_analytics (
    org_id, ministry_id, period_start, period_end,
    period_type, avg_attendance, total_reports, visitor_count, salvations
  ) VALUES (
    NEW.org_id, NEW.ministry_id, v_period_start, v_period_end,
    'weekly', v_attendance, 1, v_visitors, v_salvations
  )
  ON CONFLICT (ministry_id, period_start, period_type) DO UPDATE SET
    total_reports  = ministry_analytics.total_reports + 1,
    avg_attendance = ROUND(
      (ministry_analytics.avg_attendance * ministry_analytics.total_reports
       + v_attendance) / (ministry_analytics.total_reports + 1), 2),
    visitor_count  = ministry_analytics.visitor_count  + v_visitors,
    salvations     = ministry_analytics.salvations     + v_salvations,
    computed_at    = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS ministry_report_analytics_trigger ON ministry_reports;
CREATE TRIGGER ministry_report_analytics_trigger
AFTER INSERT ON ministry_reports
FOR EACH ROW EXECUTE FUNCTION update_ministry_analytics_on_report();

-- 4.2  Alert Mission Control when a report is flagged
CREATE OR REPLACE FUNCTION alert_admin_on_flagged_report()
RETURNS TRIGGER AS $$
DECLARE
  v_ministry_name TEXT;
BEGIN
  IF NEW.status = 'flagged'
     AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'flagged') THEN
    SELECT name INTO v_ministry_name
    FROM ministries WHERE id = NEW.ministry_id;
    INSERT INTO member_alerts (member_id, org_id, alert_type, severity, message)
    VALUES (
      NEW.submitted_by,
      NEW.org_id,
      'Ministry Report Flag',
      'critical',
      v_ministry_name || ' submitted a flagged report — '
        || NEW.report_type || ' on '
        || TO_CHAR(NEW.service_date, 'Mon DD, YYYY')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS flagged_report_alert_trigger ON ministry_reports;
CREATE TRIGGER flagged_report_alert_trigger
AFTER INSERT OR UPDATE OF status ON ministry_reports
FOR EACH ROW EXECUTE FUNCTION alert_admin_on_flagged_report();

-- 4.3  Compute ministry health score
CREATE OR REPLACE FUNCTION compute_ministry_health_score(p_ministry_id UUID)
RETURNS INT AS $$
DECLARE
  v_reports_30d   INT;
  v_avg_attend    NUMERIC;
  v_volunteers    INT;
  v_consistency   INT;
  v_attend_score  INT;
  v_engage_score  INT;
  v_final         INT;
BEGIN
  SELECT COUNT(*) INTO v_reports_30d
  FROM ministry_reports
  WHERE ministry_id = p_ministry_id
    AND service_date >= CURRENT_DATE - INTERVAL '30 days';

  SELECT COALESCE(AVG(
    COALESCE((data->>'total_adults')::INT, 0)
    + COALESCE((data->>'total_children')::INT, 0)
  ), 0) INTO v_avg_attend
  FROM ministry_reports
  WHERE ministry_id = p_ministry_id
    AND service_date >= CURRENT_DATE - INTERVAL '30 days';

  SELECT COUNT(*) INTO v_volunteers
  FROM ministry_members
  WHERE ministry_id = p_ministry_id AND is_active = TRUE;

  v_consistency  := LEAST(100, v_reports_30d  * 25);
  v_attend_score := LEAST(100, v_avg_attend::INT * 2);
  v_engage_score := LEAST(100, v_volunteers    * 10);

  v_final := ROUND(
    (v_consistency  * 0.40) +
    (v_attend_score * 0.35) +
    (v_engage_score * 0.25)
  );

  UPDATE ministry_analytics
  SET health_score = v_final, computed_at = NOW()
  WHERE ministry_id    = p_ministry_id
    AND period_type    = 'monthly'
    AND period_start   = date_trunc('month', CURRENT_DATE)::DATE;

  RETURN v_final;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.  Row Level Security Policies
ALTER TABLE ministries              ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministry_reports        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministry_events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministry_announcements  ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_templates          ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministry_analytics      ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Read ministries') THEN
  CREATE POLICY "Read ministries" ON ministries
  FOR SELECT USING (auth.uid() IS NOT NULL);
END IF; END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Leaders access own ministry reports') THEN
  CREATE POLICY "Leaders access own ministry reports" ON ministry_reports
  FOR ALL USING (
    auth.uid() = submitted_by
    OR EXISTS (
      SELECT 1 FROM ministry_members mm
      WHERE mm.user_id = auth.uid()
        AND mm.ministry_id = ministry_reports.ministry_id
        AND mm.ministry_role IN ('leader','assistant')
        AND mm.is_active = TRUE
    )
  );
END IF; END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Read active form templates') THEN
  CREATE POLICY "Read active form templates" ON form_templates
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = TRUE);
END IF; END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Members read ministry announcements') THEN
  CREATE POLICY "Members read ministry announcements" ON ministry_announcements
  FOR SELECT USING (
    ministry_id IS NULL
    OR EXISTS (
      SELECT 1 FROM ministry_members mm
      WHERE mm.user_id = auth.uid()
        AND mm.ministry_id = ministry_announcements.ministry_id
    )
  );
END IF; END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Read ministry analytics') THEN
  CREATE POLICY "Read ministry analytics" ON ministry_analytics
  FOR SELECT USING (auth.uid() IS NOT NULL);
END IF; END $$;
