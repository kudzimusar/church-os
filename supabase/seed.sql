-- ==========================================
-- Church OS Test Data Seeding Script
-- ==========================================
-- This script creates test users and org data for testing auth flows
-- Run with: psql -h <host> -U postgres -d postgres -f supabase/seed.sql

-- 1. CREATE TEST ORGANIZATIONS
INSERT INTO public.organizations (id, name, slug, domain, primary_contact_email)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Test Church - Tenant 1', 'test-church-1', 'jkc.church.local', 'pastor@testchurch.local'),
  ('00000000-0000-0000-0000-000000000002', 'Test Church - Tenant 2', 'test-church-2', 'grace.church.local', 'admin@gracechurch.local')
ON CONFLICT (id) DO NOTHING;

-- 2. CREATE TEST USERS IN SUPABASE AUTH
-- Note: These need to be created via Supabase dashboard or auth API
-- Email: test-corporate@church.os | Password: TestCorp123!
-- Email: test-tenant@church.os | Password: TestTenant123!
-- Email: test-member@church.os | Password: TestMember123!
-- Email: test-onboarding@church.os | Password: TestOnboard123!

-- 3. CREATE IDENTITIES (synced via trigger from auth.users)
-- These are normally created automatically by the trigger, but we can seed them manually
INSERT INTO public.identities (id, email, created_at)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'test-corporate@church.os', NOW()),
  ('20000000-0000-0000-0000-000000000001', 'test-tenant@church.os', NOW()),
  ('30000000-0000-0000-0000-000000000001', 'test-member@church.os', NOW()),
  ('40000000-0000-0000-0000-000000000001', 'test-onboarding@church.os', NOW())
ON CONFLICT (id) DO NOTHING;

-- 4. SEED CORPORATE ADMIN (Super Admin)
INSERT INTO public.admin_roles (identity_id, role)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'super_admin')
ON CONFLICT (identity_id, role) DO NOTHING;

-- 5. SEED TENANT USERS (Church Leaders)
INSERT INTO public.org_members (identity_id, org_id, role)
VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'owner'),
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'pastor')
ON CONFLICT (identity_id, org_id) DO NOTHING;

-- 6. SEED MEMBER PROFILES
INSERT INTO public.member_profiles (identity_id, org_id)
VALUES
  ('30000000-0000-0000-0000-000000000001', 'fa547adf-f820-412f-9458-d6bade11517d')
ON CONFLICT (identity_id, org_id) DO NOTHING;

-- 7. SEED ONBOARDING SESSIONS (For new church signup)
INSERT INTO public.onboarding_sessions (identity_id, email, status, current_step)
VALUES
  ('40000000-0000-0000-0000-000000000001', 'test-onboarding@church.os', 'email_verified', 'org_creation')
ON CONFLICT (id) DO NOTHING;

-- 8. SEED PROFILES TABLE (User metadata)
INSERT INTO public.profiles (id, name, email, org_id, membership_status, growth_stage, created_at, updated_at)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'Test Corporate Admin', 'test-corporate@church.os', 'fa547adf-f820-412f-9458-d6bade11517d', 'active', 'engaged', NOW(), NOW()),
  ('20000000-0000-0000-0000-000000000001', 'Test Tenant Pastor', 'test-tenant@church.os', '00000000-0000-0000-0000-000000000001', 'active', 'engaged', NOW(), NOW()),
  ('30000000-0000-0000-0000-000000000001', 'Test Member', 'test-member@church.os', 'fa547adf-f820-412f-9458-d6bade11517d', 'visitor', 'curious', NOW(), NOW()),
  ('40000000-0000-0000-0000-000000000001', 'Test Onboarder', 'test-onboarding@church.os', NULL, 'visitor', 'curious', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 9. VERIFY DATA
SELECT 'Corporate Admin' as user_type, COUNT(*) as count FROM public.admin_roles;
SELECT 'Org Members' as user_type, COUNT(*) as count FROM public.org_members;
SELECT 'Member Profiles' as user_type, COUNT(*) as count FROM public.member_profiles;
SELECT 'Onboarding Sessions' as user_type, COUNT(*) as count FROM public.onboarding_sessions;
SELECT 'Identities' as user_type, COUNT(*) as count FROM public.identities;

COMMIT;
