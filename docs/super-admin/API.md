# Church OS Internal Admin API Documentation

This document describes the internal Edge Functions and Server Actions used by the Admin Console for platform operations.

## 1. Edge Functions (Public/Internal)

### `ai-decision-engine`
The heart of our proactive analysis.
- **Endpoint**: `/v1/ai-decision-engine`
- **Method**: `POST`
- **Authentication**: `SUPABASE_SERVICE_ROLE_KEY`
- **Payload**: `{"org_id": "UUID"}` (optional)
- **Functionality**:
  - Scans `organization_features` for performance metrics.
  - Generates `admin_ai_insights` (Churn, Anomaly, Upgrade).
  - Automatically triggers **Platform Broadcasts** for `priority='critical'`.

### `dispatch-broadcasts`
The delivery system for platform alerts.
- **Endpoint**: `/v1/dispatch-broadcasts`
- **Method**: `GET` / `POST` (Cron-compatible)
- **Authentication**: `SUPABASE_SERVICE_ROLE_KEY`
- **Functionality**:
  - Fetches any `platform_broadcasts` where `scheduled_at <= now()`.
  - Distributes the message to all target `org_ids`.
  - Generates `broadcast_receipts` for each target church.
  - Updates the `dispatched_at` status.

### `daily-analytics-aggregator`
The business intelligence processor.
- **Endpoint**: `/v1/daily-analytics-aggregator`
- **Method**: `GET` / `POST` (Cron-compatible)
- **Authentication**: `SUPABASE_SERVICE_ROLE_KEY`
- **Functionality**:
  - Calculates MRR from active subscriptions.
  - Counts active/suspended organizations and total members.
  - Creates a historical snapshot in `company_analytics`.

## 2. Admin Server Actions (`src/app/super-admin/actions.ts`)

These are Next.js Server Actions used directly by the Super Admin UI.

### `createBroadcast`
- **Args**: `title, message, targetType, targetMetadata, scheduledAt`
- **Security**: Strict `verifySuperAdmin()` check.
- **Audit**: Logs to `admin_audit_logs`.

### `sendPlatformBroadcast`
- **Args**: `orgId, title, message`
- **Description**: Rapidly sends a single-org broadcast alert.

### `getAdminStats`
- **Description**: Retrieves high-level MRR and user counts for the BI dashboard.
