# Profile System Stabilization (Comprehensive Synchronization)

This plan outlines the steps to resolve all data inconsistencies across the 11 profile tabs, align the frontend with the Supabase schema, and ensure reliable multi-tenancy.

## Proposed Changes

### 1. Database Schema Finalization (Supabase)
Address schema drift and missing objects identified during the 11-tab audit.

- **`public.profiles`**:
    - [MODIFY] Ensure `marital_status` is documented and indexed.
    - [NEW] Add `tithe_status` (boolean) and `preferred_giving_method` (text).
    - [NEW] Add `household_type` (text) to support UI logic.
- **`public.households`**:
    - [RENAME] `name` to `household_name` for UI consistency.
    - [RENAME] `head_user_id` to `head_id`.
- **`public.guardian_links`**:
    - [NEW] Add `org_id` (UUID) with foreign key to `organizations`.
- **`public.attendance_logs`**:
    - [NEW] Create this table as a high-frequency write buffer OR update frontend to use `attendance_records`.
- **`public.member_notifications`**:
    - [NEW] Create table to support invitation/alert system.

### 2. Centralized Mapping Layer (`src/lib/profileFieldMap.ts`)
Update the mapper to include the full spectrum of fields used in the UI.

- [UPDATE] Add `marital_status`, `wedding_anniversary`, `tithe_status`, and `preferred_giving_method` to naming logic.
- [UPDATE] Ensure `household_type` and `head_id` are correctly serialized.

### 3. Frontend Data Pipeline (`src/app/(public)/profile/page.tsx`)
Refactor the logic to load and save data across all tabs reliably.

- **Data Fetching (`loadData`)**:
    - [NEW] Fetch `prayer_requests` for the Pastoral Care tab.
    - [NEW] Fetch `fellowship_groups` and user memberships for the Community tab.
    - [NEW] Fetch `financial_records` for the Giving history tab.
- **Attendance & Junior Church**:
    - [UPDATE] Change `handleLogAttendance` and `handleChildCheckin` to write to the standardized schema.
- **UI States**:
    - [UPDATE] Ensure all forms use the mapping layer instead of direct state overrides.

## Verification Plan

### Automated Tests
- Run `src/lib/profile-tester.ts` to verify full object round-trip (Identity -> Spiritual -> Household).

### Manual Verification
1. **Identity**: Change marital status and tithe preference; verify persistence after refresh.
2. **Family**: Link a member; verify it shows up in both the list and the database.
3. **Junior Church**: Enroll a child and check-in; verify the attendance record is created.
4. **Care**: Submit a prayer; verify it appears in the historical list immediately.
5. **Community**: Join a circle; verify the badge updates.

### Production Build
- Run `npm run build` to ensure no regression in type safety.
