# Profile Page Data Integrity Audit Report

## 1. Executive Summary
The investigation into unreliable data persistence on the profile page has identified **critical misalignments** between the frontend application logic and the Supabase backend schema. The "failure to save" is often a "failure to display after save" due to property name mismatches, compounded by potential Row-Level Security (RLS) errors resulting from schema fragmentation.

---

## 2. Frontend → Backend Data Flow Mapping

### 2.1 Identity Section (Primary Point of Failure)
The `Identity` section suffers from a severe property name drift between the loading and saving logic.

| Field | Frontend Component (`page.tsx`) | `profiles` Table Column | Status |
| :--- | :--- | :--- | :--- |
| Phone Number | `phone_number` | `phone` | **Mismatched (Load)** |
| Birthdate | `birthdate` | `date_of_birth` | **Mismatched (Load)** |
| Physical Address| `physical_address` | `full_address` | **Mismatched (Load)** |
| Referral Name | `invited_by_name` | `referral_name` | **Mismatched (Load)** |
| Referral Source | `invite_method` | `referral_source` | **Mismatched (Load)** |

**Failure Mechanism:**
1. User enters data (e.g., Phone).
2. `onIdentitySubmit` correctly maps `phone_number` to `phone` in the Supabase `.update()` call.
3. Supabase saves the data to the `phone` column.
4. On page refresh, `loadData` fetches the profile data but looks for `pData.phone_number`. 
5. Since the DB returned `phone`, `pData.phone_number` is `undefined`.
6. The form resets to empty, leading the user to believe the save failed.

### 2.2 Family & Households
- **Column Rename**: `public.households` changed `head_user_id` to `head_id`.
- **Relationship Table**: Frontend expects `household_members`, which was added in late-stage migrations.
- **Impact**: Inconsistency in how family members are linked and displayed.

### 2.3 Circle Community
- **Table Rename**: `fellowship_group_members` was renamed to `fellowship_members`.
- **Impact**: Queries using the old table name will fail silently or return 404/invalid relation errors.

---

## 3. Supabase Schema & Logic Audit

### 3.1 Missing/Fragmented Role System
Recent migrations (`20260320`, `20260321`) introduce RLS policies and views that depend on `public.user_roles` and `public.roles`.
- **Finding**: No migration in the current set explicitly creates these tables, although they are referenced in `fn_validate_role_assignment` and `vw_user_identity`.
- **Risk**: If these tables are missing or empty on the production/target instance, all RLS policies referencing them will evaluate to `FALSE` or throw errors, effectively locking users out of updates.

### 3.2 Row-Level Security (RLS) Complexity
The RLS policies for `profiles` and `org_members` have multiple versions across migrations.
- **Recursion Risk**: Policies that check `org_members` to see if a user is an admin while `org_members` itself has an RLS policy checking roles can lead to infinite recursion or timeouts.

---

## 4. Identified Failure Points

### Priority 1: Property Name Drift (Identity Form)
- **File**: `src/app/(public)/profile/page.tsx`
- **Issue**: `loadData` uses stale property names while `onIdentitySubmit` uses modern schema names.
- **Result**: Data is "saved" but never "re-loaded" into the UI.

### Priority 2: RLS Denial
- **Issue**: Updates to `profiles` or `ministry_members` may be blocked if the `user_roles` JOIN fails.
- **Result**: `supabase.from('profiles').update(...)` returns an error object which is caught but only triggers a generic `toast.error("Failed to save changes")`.

### Priority 3: Organization Context Loss
- **Issue**: Many queries filter by `profile.org_id`. If a profile is "orphaned" (null `org_id`), the user may be able to see their profile but unable to join ministries or log attendance because those tables require a valid `org_id`.

---

## 5. Summary of Field Mappings

### Profiles Table Mapping
| UI Section | Form Field | DB Column | Migration Source |
| :--- | :--- | :--- | :--- |
| Personal Info | `name` | `name` | Base |
| | `phone_number` | `phone` | Base |
| | `gender` | `gender` | Base |
| | `birthdate` | `date_of_birth` | Base |
| | `nationality` | `country_of_origin` | Base |
| | `physical_address`| `full_address` | Base |
| Spiritual | `salvation_date` | `salvation_date` | Base |
| | `baptism_status` | `baptism_status` | Base |
| Referral | `invited_by_name` | `referral_name` | Extension |
| | `invite_method` | `referral_source` | Extension |

---

## 6. Recommendations (Investigation Only)
1. **Unify Property Names**: Standardize on either the DB column names or the form names across `loadData` and `onSubmit`.
2. **Verify Role Schema**: Confirm the existence of `user_roles` and `roles` tables in the target database.
3. **Audit Org Context**: Run a script to ensure every profile has a valid `org_id`.
4. **Enhanced Error Handling**: Update the frontend to log the specific error message from Supabase (`error.message`, `error.details`) to help debug RLS/Constraint failures in the field.
