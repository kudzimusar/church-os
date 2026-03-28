# Church OS Admin Onboarding Guide

Welcome to the Church OS Operations Team! This guide will walk you through your first steps as a Super Admin and help you understand how we manage the global church ecosystem.

## 1. Getting Started

### Access Requirements
To access the Admin Console, your account must have the `super_admin` role assigned in the `admin_roles` table. This role is strictly bound to the `Church OS Company` organization.

### Navigation
The Admin Console is located at `/super-admin`. It is separated from the standard `/admin` (now `/settings`) used by church leaders.

## 2. Platform Core Modules

### Dashboard (BI)
Your high-level view of platform health.
- **MRR**: Monitoring overall commercial growth.
- **Active Nodes**: Tracking the number of churches currently served.
- **Churn Rate**: Identifying platform-wide retention trends.

### Tenant Browser
The registry of all churches on the platform.
- **Search**: Find churches by name or status.
- **Status Management**: Activating, suspending, or trial management.
- **Impersonation**: Securely viewing the dashboard as a church leader to provide support.

### AI Ops Command Center
The heart of our decision intelligence.
- **Insights**: Proactive alerts about church health (Churn risk, low engagement).
- **Automation**: Monitoring how the AI triggers automated broadcasts.
- **Helpfulness**: Reviewing feedback from church leaders on AI insights.

## 3. Support Workflow

1. **Morning Review**: Check the BI Dashboard for anomalies.
2. **AI Insight Sweep**: Review `Critical` and `High` priority insights.
3. **Outreach**: For churches in the "Critical Churn" state, use the **Broadcast** tool to send a targeted message or initiate direct support.
4. **Audit**: Remember that every action you take is logged. Ensure every manual override is accompanied by a brief internal note.

## 4. Key Security Rules
- **PII Masking**: By default, you will see masked emails and phone numbers. Only unmask data when explicitly required for a support ticket.
- **Audit Compliance**: Do not share Super Admin credentials. Every action must be attributable to a specific operator.
