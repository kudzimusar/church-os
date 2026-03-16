
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

async function checkAdminRole() {
    const email = 'admin@jkc.church';
    const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('email', email).maybeSingle();
    
    if (!profile) {
        console.log(`User ${email} not found in profiles.`);
        return;
    }

    const { data: orgMember } = await supabaseAdmin.from('org_members').select('role').eq('user_id', profile.id).maybeSingle();
    console.log(`Role in org_members for ${email}:`, orgMember?.role);

    const { data: userRole } = await supabaseAdmin.from('user_roles').select('role_name').eq('user_id', profile.id).maybeSingle();
    console.log(`Role in user_roles for ${email}:`, userRole?.role_name);
}

checkAdminRole();
