# Skill: Admin Churn Analytics

**Trigger:** “Add churn analysis to admin console”

**Purpose:** Use AI to predict and analyze churn, and provide actionable insights to reduce it.

**Implementation Steps:**

1. Build a feature store (table `organization_features`) with:
   - Engagement metrics (journal frequency, prayer request volume)
   - AI insight open rate
   - Payment history (failed payments, upgrade/downgrade)
   - Support tickets
2. Run a Vertex AI model (or logistic regression) weekly to compute churn probability per organization.
3. Store predictions in `organization_features.churn_probability`.
4. In the admin console, show a churn risk list with high‑risk churches.
5. Provide actions: “Send retention email”, “View engagement history”, “Flag for support follow‑up”.

**Success Criteria:** Admins proactively intervene with high‑risk churches, reducing churn.

**Failure Handling:** If AI fails, fallback to rule‑based thresholds (e.g., zero engagement for 30 days = high risk).
