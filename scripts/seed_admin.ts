import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function seedAdmin() {
    console.log("Seeding Super Admin user...");
    const email = 'admin@jkc.church';
    const password = 'JKC-MissionControl-2026!';
    const name = 'Sys Admin';

    try {
        // 1. Create user in auth.users
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: name }
        });

        if (authError) {
            if (authError.message.includes('already been registered')) {
                console.log(`User ${email} already exists in auth. Fetched existing user.`);
            } else {
                throw authError;
            }
        }

        // Get user ID
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
        const user = usersData.users.find(u => u.email === email);

        if (!user) {
            throw new Error("Could not find user after creation");
        }

        // 2. Upsert profile
        await supabaseAdmin.from('profiles').upsert({
            id: user.id,
            name,
            email,
        });
        console.log("Profile created/updated.");

        // 3. Upsert org_members with super_admin role
        await supabaseAdmin.from('org_members').upsert({
            user_id: user.id,
            role: 'super_admin'
        });
        console.log("Assigned super_admin role in org_members.");

        console.log(`\n✅ Success! You can now log in at /shepherd/login with:`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);

    } catch (error) {
        console.error("Error seeding config:", error);
    }
}

seedAdmin();
