# Church OS - Authentication Testing Guide

## Quick Start

### 1. Set up test data
```bash
npx ts-node scripts/seed-test-data.ts
```

This creates 4 test users in your Supabase instance:
- **Corporate Admin** (super_admin role)
- **Tenant Pastor** (owner + pastor roles)
- **Member** (member profile)
- **Onboarding User** (in onboarding flow)

### 2. Test credentials

```
Corporate (Super Admin):
  URL:      http://localhost:3000/corporate/login
  Email:    test-corporate@church.os
  Password: TestCorp123!
  Expected: Redirect to /super-admin

Tenant (Church Pastor):
  URL:      http://localhost:3000/church/login
  Email:    test-tenant@church.os
  Password: TestTenant123!
  Expected: Redirect to /shepherd/dashboard

Member:
  URL:      http://localhost:3000/member/login
  Email:    test-member@church.os
  Password: TestMember123!
  Expected: Redirect to /member/profile

Onboarding:
  URL:      http://localhost:3000/onboarding/login
  Email:    test-onboarding@church.os
  Password: TestOnboard123!
  Expected: Redirect to /onboarding (org_creation step)
```

---

## Testing Checklist

### ✅ Test 1: Corporate Admin Login (Most Restrictive)

**Purpose:** Verify super_admin access and corporate domain isolation

**Steps:**
1. Navigate to `/corporate/login`
2. Enter credentials:
   - Email: `test-corporate@church.os`
   - Password: `TestCorp123!`
3. Click "Initialize Authentication"
4. **Expected behavior:**
   - ✅ Login succeeds
   - ✅ Redirected to `/super-admin`
   - ✅ Page shows admin dashboard
   - ✅ No redirect loop

**Edge cases to test:**
- [ ] Try logging in with wrong password → Error message appears
- [ ] Try logging in with non-existent email → Error message appears
- [ ] Try accessing `/super-admin` without login → Redirected to `/corporate/login`
- [ ] Page refresh while on `/super-admin` → Session persists

**Debug info to check:**
```javascript
// Open browser console and check:
sessionStorage.getItem('church_os_active_domain') // Should be 'corporate'
sessionStorage.getItem('church_os_domain_session') // Should have session JSON
```

---

### ✅ Test 2: Tenant (Church) Login (Domain-Specific)

**Purpose:** Verify tenant isolation and multi-role handling

**Steps:**
1. Navigate to `/church/login`
2. Enter credentials:
   - Email: `test-tenant@church.os`
   - Password: `TestTenant123!`
3. Click "Initialize Authentication"
4. **Expected behavior:**
   - ✅ Login succeeds
   - ✅ Redirected to `/shepherd/dashboard`
   - ✅ Can see church data
   - ✅ No redirect loop

**Edge cases to test:**
- [ ] Try accessing `/pastor-hq` → Should work (same domain)
- [ ] Try accessing `/super-admin` while logged in as tenant → Redirected or context selector
- [ ] Create a second tenant user (different org) and try login → Should see org selector
- [ ] Page refresh → Session recovers

**Debug info:**
```javascript
sessionStorage.getItem('church_os_active_domain') // Should be 'tenant'
sessionStorage.getItem('church_os_active_surface') // Should be 'mission-control'
```

---

### ✅ Test 3: Member Login (Auto-Provisioning)

**Purpose:** Verify self-service access for members

**Steps:**
1. Navigate to `/member/login`
2. Enter credentials:
   - Email: `test-member@church.os`
   - Password: `TestMember123!`
3. Click "Initialize Authentication"
4. **Expected behavior:**
   - ✅ Login succeeds
   - ✅ Redirected to `/member/profile`
   - ✅ Can view profile
   - ✅ No redirect loop

**Edge cases:**
- [ ] New member (no profile yet) → Auto-creates `member_profiles` entry
- [ ] Try accessing `/member/profile` without login → Redirected to `/member/login`
- [ ] Page refresh → Session persists

---

### ✅ Test 4: Onboarding Flow (Church Registration)

**Purpose:** Verify new church onboarding path

**Steps:**
1. Navigate to `/onboarding/login`
2. Enter credentials:
   - Email: `test-onboarding@church.os`
   - Password: `TestOnboard123!`
3. Click "Initialize Authentication"
4. **Expected behavior:**
   - ✅ Login succeeds
   - ✅ Redirected to `/onboarding`
   - ✅ Shows org creation form
   - ✅ No redirect loop

**Edge cases:**
- [ ] Try accessing `/onboarding` without login → Redirected to `/onboarding/login`
- [ ] Complete onboarding → Should transition to appropriate domain

---

### ✅ Test 5: Logout & Session Cleanup

**Purpose:** Verify logout clears session properly

**Steps:**
1. Log in with any user (e.g., member)
2. Click logout button (should be in sidebar/header)
3. **Expected behavior:**
   - ✅ Redirected to appropriate login page for that domain
   - ✅ SessionStorage cleared (session should be gone)
   - ✅ Can't access protected pages
   - ✅ Can log in again immediately

**Debug:**
```javascript
// After logout:
sessionStorage.getItem('church_os_domain_session') // Should be null
sessionStorage.getItem('church_os_active_domain') // Should be null
```

---

### ✅ Test 6: Page Refresh (Session Recovery)

**Purpose:** Verify session persists across page reloads

**Steps:**
1. Log in with a user
2. Navigate to their protected page (e.g., `/member/profile`)
3. Press `Cmd+R` (Mac) or `Ctrl+R` (Windows) to refresh
4. **Expected behavior:**
   - ✅ Page doesn't redirect to login
   - ✅ Session is recovered
   - ✅ User is still logged in

**Debug:**
```javascript
// Before refresh:
sessionStorage.getItem('church_os_domain_session')

// After refresh - should still exist
sessionStorage.getItem('church_os_domain_session')
```

---

### ✅ Test 7: Cross-Domain Access (Security)

**Purpose:** Verify users can't access unintended domains

**Steps:**
1. Log in as `test-member@church.os` (member domain)
2. Try to access `/corporate/login` → Redirected to `/member/login`
3. Try to access `/church/login` → Redirected to `/member/login`
4. Try to access `/shepherd/dashboard` directly → Redirected to `/member/login`
5. **Expected behavior:**
   - ✅ User stays in their domain
   - ✅ No access to other domains
   - ✅ Clear error message if accessing restricted area

---

### ✅ Test 8: Error Messages (UX)

**Purpose:** Verify users understand auth failures

**Scenarios:**
1. Wrong password → "Invalid credentials"
2. Non-existent user → "User not found"
3. No domain access → "You do not have permissions for this domain. Please contact your administrator."
4. Page refresh during login → Graceful recovery

**Check:**
- [ ] Error messages are clear (not cryptic)
- [ ] No technical jargon
- [ ] User knows what to do next

---

## Troubleshooting Guide

### Issue: "Redirect loop" (stuck at login)

**Possible causes:**
1. User doesn't have entry in domain table (org_members, admin_roles, etc.)
   - **Fix:** Run seed script again or manually add entry

2. Session token expired
   - **Fix:** Clear sessionStorage and refresh

3. Supabase auth session lost
   - **Fix:** Log out and log in again

**Debug:**
```javascript
// Check what's in v_user_auth_contexts
// This requires Supabase dashboard access
// Look for rows where identity_id = your_user_id
```

---

### Issue: "Cannot find auth_surface"

**Cause:** User has auth context but no matching auth_surface

**Fix:** Check the database directly or re-run seed script

---

### Issue: "Page keeps redirecting between pages"

**Possible causes:**
1. AuthGuard and specific page guard conflicts
2. Session state mismatch between components
3. Browser cache issues

**Debug steps:**
1. Open DevTools → Application → SessionStorage
2. Check for keys:
   - `church_os_active_domain`
   - `church_os_active_surface`
   - `church_os_domain_session`
3. Check browser console for warnings

---

## Performance Baselines

Track these metrics as you test:

| Metric | Target | Current |
|--------|--------|---------|
| Login response time | < 500ms | - |
| Page load after login | < 1s | - |
| Session recovery on refresh | < 300ms | - |
| Logout time | < 200ms | - |

---

## Regression Testing

After any auth changes, run this checklist:
- [ ] All 8 tests pass
- [ ] No new error messages
- [ ] All domains still work
- [ ] No browser console errors
- [ ] Session storage clean
- [ ] No infinite redirects

---

## Test Data Cleanup

To remove test data:

```bash
# In Supabase dashboard, delete these users:
# - test-corporate@church.os
# - test-tenant@church.os
# - test-member@church.os
# - test-onboarding@church.os

# Or run in SQL editor:
DELETE FROM auth.users 
WHERE email LIKE 'test-%@church.os';
```

---

## Next Steps

After testing:
1. **If all tests pass** → Move to C) Signup flow implementation
2. **If tests fail** → Document the failure and check the debug guide
3. **If tests reveal edge cases** → Add them to this guide

**Contact:** Check CLAUDE.md for debug protocols
