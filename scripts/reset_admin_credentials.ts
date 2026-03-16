
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

async function resetAdminPassword() {
    const email = 'admin@jkc.church';
    const password = 'PastorHQ2026!';

    const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('email', email).maybeSingle();
    
    if (!profile) {
        console.log(`User ${email} not found.`);
        return;
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(profile.id, {
        password: password
    });

    if (error) {
        console.error('Error resetting password:', error);
    } else {
        console.log(`✅ Password for ${email} has been reset to: ${password}`);
    }

    // Also ensure the role is set to pastor (though owner/super_admin is already supported)
    await supabaseAdmin.from('org_members').upsert({ user_id: profile.id, role: 'pastor', org_id: 'default' });
}

resetAdminPassword();
