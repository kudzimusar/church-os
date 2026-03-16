
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

async function listUsers() {
    const { data: users, error } = await supabaseAdmin.from('profiles').select('email, name').limit(5);
    if (error) {
        console.error('Error fetching profiles:', error);
        return;
    }
    console.log('Recent Profiles:', users);
}

listUsers();
