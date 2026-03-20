# Task: Profile System Stabilization & Implementation

## Phase 1: Planning & Design
- [x] Create Implementation Plan
- [x] Define Profile Field Map schema

## Phase 2: Backend Stabilization (Supabase)
- [x] Verify/Create `roles` and `user_roles` tables
- [x] Align `org_id` for all profiles
- [x] Update legacy column/table names in DB
- [x] Audit and simplify RLS policies

## Phase 3: Frontend Alignment
- [x] Create centralized mapping layer (`profileFieldMap.ts`)
- [x] Refactor `src/app/(public)/profile/page.tsx`:
    - [x] Update `loadData` with mapping layer
    - [x] Update `onIdentitySubmit` and other sub-form handlers
    - [x] Strengthen error handling and observability
- [x] Refactor `ConnectionCard` (`src/components/profile/connection-card.tsx`)
- [x] Update `Membership Pipeline` (`src/app/shepherd/dashboard/requests/page.tsx`)
- [x] Update cross-module references (`head_user_id`, `fellowship_group_members`)

## Phase 4: Verification & Testing
- [x] Create automated tester (`profile-tester.ts`)
- [x] Execute Identity Round-trip test
- [x] Execute RLS Update test
- [x] Verify Cross-System consistency (Admin Dashboard, Mission Control)
- [x] Document results in `walkthrough.md`

## Phase 5: Mission Control & Dashboard Stabilization
- [x] Implement `mission_control_stabilization.sql` migration
- [x] Standardize extended profile fields (Nationality, Industry, etc.)
- [x] Refactor all Shepherd dashboard pages to use `orgId` context
- [x] Stabilize shop operations and multi-tenant views
- [x] Push all changes to GitHub
- [x] Resolve `ConnectionCard` build error for production

## Phase 6: Comprehensive 11-Tab Synchronization
- [x] Audit all 11 tabs for schema discrepancies (Identity, Family, Junior Church, etc.)
- [x] Implement `20260328000000_profile_system_final_sync.sql` migration
- [x] Update `profileFieldMap.ts` with all 11-tab and missing schema fields
- [x] Refactor `src/app/(public)/profile/page.tsx` data fetching (`loadData`)
- [x] Standardize `attendance_logs` to `attendance_records` across frontend
- [x] Verify each tab (Identity -> Orders) for record persistence and history loading
- [x] Document final stabilization in `walkthrough.md`
- [x] Final production build and push to GitHub
