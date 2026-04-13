#!/usr/bin/env node
/**
 * Test Data Seeding Script
 * Creates test users and organizations for auth flow testing
 *
 * Usage: npx ts-node scripts/seed-test-data.ts
 *
 * Test Credentials:
 * - Corporate Admin: test-corporate@church.os / TestCorp123!
 * - Tenant Pastor: test-tenant@church.os / TestTenant123!
 * - Member: test-member@church.os / TestMember123!
 * - Onboarding: test-onboarding@church.os / TestOnboard123!
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_USERS = {
  corporate: {
    email: "test-corporate@church.os",
    password: "TestCorp123!",
    name: "Test Corporate Admin",
  },
  tenant: {
    email: "test-tenant@church.os",
    password: "TestTenant123!",
    name: "Test Tenant Pastor",
  },
  member: {
    email: "test-member@church.os",
    password: "TestMember123!",
    name: "Test Member",
  },
  onboarding: {
    email: "test-onboarding@church.os",
    password: "TestOnboard123!",
    name: "Test Onboarding User",
  },
};

const JKC_ORG_ID = "fa547adf-f820-412f-9458-d6bade11517d";

const TEST_ORG_ID = "00000000-0000-0000-0000-000000000001";

async function seedTestData() {
  console.log("🌱 Starting test data seeding...\n");

  try {
    // Step 1: Create test organizations
    console.log("1️⃣ Creating test organizations...");
    const { data: orgs, error: orgError } = await supabase
      .from("organizations")
      .upsert([
        {
          id: TEST_ORG_ID,
          name: "Test Church",
          domain: "test.church.local",
        },
      ])
      .select();

    if (orgError) {
      console.error("❌ Failed to create organizations:", orgError);
      return;
    }
    console.log(`✅ Created ${orgs?.length || 0} organization(s)\n`);

    // Step 2: Create test users in auth
    console.log("2️⃣ Creating test users in authentication...");
    const createdUsers: Record<string, string> = {};

    for (const [type, user] of Object.entries(TEST_USERS)) {
      console.log(`   Creating ${type} user: ${user.email}`);

      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
      });

      if (error) {
        console.warn(`   ⚠️  ${type} user may already exist: ${error.message}`);
        // Try to get the existing user
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existing = existingUsers?.users?.find((u) => u.email === user.email);
        if (existing) {
          createdUsers[type] = existing.id;
          console.log(`   ℹ️  Using existing user: ${existing.id}`);
        }
      } else if (data?.user) {
        createdUsers[type] = data.user.id;
        console.log(`   ✅ Created: ${data.user.id}`);
      }
    }
    console.log();

    // Step 3: Create identities (should be synced via trigger, but ensure they exist)
    console.log("3️⃣ Ensuring identities are synced...");
    for (const [type, userId] of Object.entries(createdUsers)) {
      const { error } = await supabase
        .from("identities")
        .upsert({
          id: userId,
          email: TEST_USERS[type as keyof typeof TEST_USERS].email,
        })
        .select();

      if (error) {
        console.warn(`   ⚠️  Failed to upsert identity for ${type}:`, error.message);
      } else {
        console.log(`   ✅ Identity synced: ${userId}`);
      }
    }
    console.log();

    // Step 4: Seed admin_roles (corporate domain)
    console.log("4️⃣ Seeding corporate domain (admin_roles)...");
    if (createdUsers.corporate) {
      const { error } = await supabase
        .from("admin_roles")
        .upsert(
          {
            identity_id: createdUsers.corporate,
            role: "super_admin",
          },
          { onConflict: "identity_id,role" }
        )
        .select();

      if (error) {
        console.error(`   ❌ Failed to create admin role:`, error);
      } else {
        console.log(`   ✅ Created super_admin role`);
      }
    }
    console.log();

    // Step 5: Seed org_members (tenant domain)
    console.log("5️⃣ Seeding tenant domain (org_members)...");
    if (createdUsers.tenant) {
      const roles = ["owner", "pastor"];
      for (const role of roles) {
        const { error } = await supabase
          .from("org_members")
          .upsert(
            {
              identity_id: createdUsers.tenant,
              org_id: TEST_ORG_ID,
              role: role,
            },
            { onConflict: "identity_id,org_id" }
          )
          .select();

        if (error) {
          console.warn(`   ⚠️  Failed to create org_member role ${role}:`, error.message);
        } else {
          console.log(`   ✅ Created ${role} role`);
        }
      }
    }
    console.log();

    // Step 6: Seed member_profiles (member domain)
    console.log("6️⃣ Seeding member domain (member_profiles)...");
    if (createdUsers.member) {
      const { error } = await supabase
        .from("member_profiles")
        .upsert(
          {
            identity_id: createdUsers.member,
            org_id: JKC_ORG_ID,
          },
          { onConflict: "identity_id,org_id" }
        )
        .select();

      if (error) {
        console.error(`   ❌ Failed to create member_profile:`, error);
      } else {
        console.log(`   ✅ Created member profile`);
      }
    }
    console.log();

    // Step 7: Seed onboarding_sessions (onboarding domain)
    console.log("7️⃣ Seeding onboarding domain (onboarding_sessions)...");
    if (createdUsers.onboarding) {
      const { error } = await supabase
        .from("onboarding_sessions")
        .upsert({
          identity_id: createdUsers.onboarding,
          email: TEST_USERS.onboarding.email,
          status: "email_verified",
          current_step: "org_creation",
        })
        .select();

      if (error) {
        console.error(`   ❌ Failed to create onboarding_session:`, error);
      } else {
        console.log(`   ✅ Created onboarding session`);
      }
    }
    console.log();

    // Step 8: Create profiles (user metadata)
    console.log("8️⃣ Creating user profiles...");
    const profileUpdates = [
      {
        id: createdUsers.corporate,
        name: TEST_USERS.corporate.name,
        email: TEST_USERS.corporate.email,
        org_id: JKC_ORG_ID,
      },
      {
        id: createdUsers.tenant,
        name: TEST_USERS.tenant.name,
        email: TEST_USERS.tenant.email,
        org_id: TEST_ORG_ID,
      },
      {
        id: createdUsers.member,
        name: TEST_USERS.member.name,
        email: TEST_USERS.member.email,
        org_id: JKC_ORG_ID,
      },
      {
        id: createdUsers.onboarding,
        name: TEST_USERS.onboarding.name,
        email: TEST_USERS.onboarding.email,
        org_id: null,
      },
    ];

    for (const profile of profileUpdates) {
      if (profile.id) {
        const { error } = await supabase
          .from("profiles")
          .upsert(profile, { onConflict: "id" })
          .select();

        if (error) {
          console.warn(`   ⚠️  Failed to update profile for ${profile.email}:`, error.message);
        } else {
          console.log(`   ✅ Created profile: ${profile.name}`);
        }
      }
    }
    console.log();

    // Summary
    console.log("=" .repeat(60));
    console.log("✅ TEST DATA SEEDING COMPLETE\n");
    console.log("Test Credentials:");
    console.log("─".repeat(60));

    for (const [type, user] of Object.entries(TEST_USERS)) {
      const url = type === "corporate" ? "/corporate/login"
                : type === "tenant" ? "/church/login"
                : type === "member" ? "/member/login"
                : type === "onboarding" ? "/onboarding/login"
                : "/login";
      console.log(`\n${type.toUpperCase()} (${url})`);
      console.log(`  Email:    ${user.email}`);
      console.log(`  Password: ${user.password}`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("\n🧪 Next: Run the testing checklist in your browser");
    console.log("📝 Check: src/components/auth/BaseAuth.tsx for login logic\n");

  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seedTestData();
