import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const envPath = resolve(__dirname, '../.env.local');
try {
    const envFile = readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) process.env[match[1]] = match[2];
    });
} catch (e: any) { }

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

async function createTestPastor() {
    const email = 'pastor.test@jkc.church';
    const password = 'PastorHQTest2026!'; // Strong password for testing

    console.log(`Creating test pastor user: ${email}`);

    // 1. Create the user in Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    });

    if (authError) {
        if (authError.message.includes('already registered')) {
            console.log('User already exists in Auth.');
        } else {
            console.error('Error creating auth user:', authError);
            return;
        }
    }

    const userId = authUser?.user?.id;
    if (!userId) {
        // Find existing user id by email
        const { data: existingUser } = await supabaseAdmin.from('profiles').select('id').eq('email', email).maybeSingle();
        if (!existingUser) {
             console.error('Could not find user ID');
             return;
        }
        // If we don't have it here, it might be tricky. Let's assume newUser worked or we need to fetch it.
    }

    // Since we need the ID, let's try to fetch it if authUser was null (already exists)
    let finalUserId = userId;
    if (!finalUserId) {
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const user = users.users.find(u => u.email === email);
        finalUserId = user?.id;
    }

    if (!finalUserId) {
        console.error('Final User ID not found');
        return;
    }

    // 2. Create Profile
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
        id: finalUserId,
        name: 'Test Pastor',
        email: email,
        membership_status: 'member'
    });

    if (profileError) console.error('Error creating profile:', profileError);

    // 3. Set Role in org_members
    const { error: roleError } = await supabaseAdmin.from('org_members').upsert({
        user_id: finalUserId,
        role: 'pastor',
        org_id: 'default' // Assuming a default org exists or this matches the table structure
    });

    if (roleError) {
        console.error('Error setting role in org_members:', roleError);
        // Fallback to user_roles if that's what's used
        const { error: roleError2 } = await supabaseAdmin.from('user_roles').upsert({
            user_id: finalUserId,
            role_name: 'pastor'
        });
        if (roleError2) console.error('Error setting role in user_roles:', roleError2);
    }

    console.log('✅ Test Pastor account set up successfully.');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
}

createTestPastor();
