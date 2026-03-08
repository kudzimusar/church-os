import pkg from 'pg';
const { Client } = pkg;
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env.local');
const envFile = readFileSync(envPath, 'utf8');
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2].trim();
});

const client = new Client({
    connectionString: process.env.SUPABASE_CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    await client.connect();

    console.log("Adding Foreign Key from org_members to profiles...");

    const sql = `
        -- Ensure profiles id is indexed and unique (it should be)
        -- Add foreign key
        ALTER TABLE public.org_members
        DROP CONSTRAINT IF EXISTS fk_org_members_profiles;
        
        ALTER TABLE public.org_members
        ADD CONSTRAINT fk_org_members_profiles
        FOREIGN KEY (user_id)
        REFERENCES public.profiles(id)
        ON DELETE CASCADE;
    `;

    try {
        await client.query(sql);
        console.log("Foreign Key added successfully.");
    } catch (err: any) {
        console.error("Failed to add foreign key:", err.message);
        // If it fails because of missing rows in profiles, we need to know
    }

    await client.end();
}

main().catch(console.error);
