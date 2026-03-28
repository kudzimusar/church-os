# Church OS Super Admin Operations

This document outlines the operational procedures for managing the Church OS platform using the Super Admin Console.

## 1. Tenant Management

Managing the lifecycle of a church organization on the platform.

### Onboarding Workflow
1. **Invite**: Send a magic link via `/super-admin/tenants` to the church pastor.
2. **DNA Review**: Monitor the `organization_intelligence` table to ensure the pastor completes the "Theological DNA" survey.
3. **AI Provisioning**: Confirm the `provision-church-intelligence` function completes and the "Growth Blueprint" is delivered.
4. **Member Migration**: If the church is migrating from another system, use the `profiles` import tool (Service Role only).

### Status Transitions
- **Active → Suspended**: Use the "Suspend Organization" button in Tenant Detail. Always provide a reason in the audit log (e.g., "Subscription overdue," "TOS Violation").
- **Suspended → Active**: Requires resolution of the underlying issue. Activating a tenant immediately restores all member access.
- **Trial → Full**: Manually update the `plan_id` and set `status` to `active` if they choose to pay via offline invoice.

### Subscription Overrides
Admins can manually override a church's plan and status via the **Tenant Detail > Billing & Sub** card. This is useful for:
- Granting complimentary access to beta testers.
- Manually resolving billing disputes before Stripe reconciliation.
- Onboarding Enterprise clients with custom terms.

...

## 8. Troubleshooting & Maintenance

### Stale AI Insights
If a dashboard shows "No Recent Insights" or data feels old:
1. Trigger a **Manual Refresh** from the Tenant Detail page.
2. Check `edge_function_logs` in the Supabase Dashboard for the `ai-decision-engine`.
3. Verify the church has opted in via `ai_training_opt_in`.

### Sync Issues
If a church reports that their members can't see a Global Broadcast:
1. Verify the broadcast `dispatched_at` timestamp is in the past.
2. Check `broadcast_receipts` to see if a row exists for that `org_id`.
3. Ensure the church `status` is `active`.

### Performance Lag
If the Super Admin dashboard is slow:
1. Check the `daily-analytics-aggregator` logs. It may be processing a large volume of new nodes.
2. Verify that the browser is not being throttled by too many open "Impersonation" tabs.

## 2. AI Decision Intelligence

The Admin Console uses a daily background engine (`ai-decision-engine`) to analyze cross-tenant behavior.

### Insight Priorities
- **CRITICAL (Red)**: Immediate churn risk or severe engagement drop. Requires direct outreach.
- **HIGH (Amber)**: Significant usage pattern shifts. Recommended attention.
- **MEDIUM (Indigo)**: Growth opportunities or optimization suggestions (e.g., "Ready for Pro plan").

### Metrics
- **Engagement Score (0-10)**: A weighted average of member login frequency, devotion creation, and AI shepherd interactions.
- **Churn Probability (0-100%)**: Predictive metric based on the velocity of engagement decline.

## 3. Business Intelligence (BI)

Platform metrics are aggregated every 24 hours via `daily-analytics-aggregator`.

### Key Platform KPIs
- **MRR (Monthly Recurring Revenue)**: Sum of all active subscriptions based on `company_plans` pricing.
- **Active Nodes**: Count of churches with 'Active' status.
- **User Growth**: Aggregate growth of unique member profiles across all tenants.
- **AI Strategy Insights**: Monitoring how many insights are being generated vs. how many are rated as helpful by pastoral teams.

## 5. Platform Broadcasting

Admins can communicate directly with church leadership via the **Platform Broadcast** engine.

### Targeting Tiers
- **All Active Nodes**: Global announcements (system maintenance, new features).
- **Plan-Based**: Targeting specific tiers (e.g., "Pro Plan exclusive webinar").
- **Selected Organizations**: Manual override or targeted support (e.g., "Critical Churn Alert").

### High-Priority Alerts
When a broadcast is created with a **Critical** priority, it will appear as a high-visibility persistent banner at the top of the church leader's dashboard. Dismissing the alert is tracked in `broadcast_receipts`.

## 6. AI Ops Command Center

The **AI Ops Dashboard** provides visibility into the platform's decision intelligence layer.

### Key AI Metrics
- **Mean Helpfulness (1-5)**: Average rating church leaders give to AI-generated prophetic insights.
- **Open Rate (%)**: Ratio of generated insights that have been viewed by pastoral teams.
- **Insights/Day**: Velocity of insight generation across all tenants.

### Manual Refresh
If a specific organization's AI context feels stale, admins can trigger an on-demand analysis via **Tenant Detail > AI Insight > Refresh AI Analysis**. This bypasses the 24-hour sweep cycle for immediate intervention.

## 7. Security & Auditing

### Audit Logs
Every sensitive administrative action (suspending a church, overriding billing, impersonating a user, sending a platform-wide broadcast) is tracked in the `admin_audit_logs` table. Reports can be exported from the Action History card.

### Super Admin Access
Access is restricted to users with the `super_admin` role in the `admin_roles` table, linked to the `Church OS Company` organization (UUID: `00000000-0000-0000-0000-000000000000`).
