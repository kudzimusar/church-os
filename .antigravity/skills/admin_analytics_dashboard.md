# Skill: Admin Analytics Dashboard

**Trigger:** “Add analytics dashboard to admin console”

**Purpose:** Build a dashboard showing cross‑tenant metrics (MRR, active churches, engagement, churn) with drill‑down capabilities.

**Implementation Steps:**

1. Create `company_analytics` table with daily aggregates.
2. Build an Edge Function (`daily-analytics-aggregator`) that runs at midnight and populates the table.
3. Create a dashboard page that queries this table and displays:
   - Key metrics (MRR, active orgs, total members, churn rate)
   - Time‑series charts (using Recharts or similar)
   - Filters for date range and organization size
4. Add drill‑down to see details for a specific organization.

**Success Criteria:** Admins can view historical trends and identify growth patterns.

**Failure Handling:** If the aggregator fails, show stale data with a warning banner.
