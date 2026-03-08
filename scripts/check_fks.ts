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
    const res = await client.query(`
        SELECT
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM
            information_schema.key_column_usage AS kcu
        JOIN
            information_schema.constraint_column_usage AS ccu
            ON kcu.constraint_name = ccu.constraint_name
        WHERE kcu.table_name = 'org_members'
    `);
    console.log("Foreign Keys for org_members:", res.rows);
    await client.end();
}

main().catch(console.error);
