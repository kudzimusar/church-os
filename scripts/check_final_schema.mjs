import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkSchema() {
    const connectionString = process.env.SUPABASE_CONNECTION_STRING;
    const client = new Client({ connectionString });
    await client.connect();

    const tables = [
        { table: 'profiles', columns: ['marital_status', 'tithe_status', 'preferred_giving_method', 'household_type'] },
        { table: 'households', columns: ['household_name', 'head_id'] },
        { table: 'guardian_links', columns: ['org_id'] }
    ];

    for (const t of tables) {
        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = '${t.table}'
            AND column_name = ANY($1);
        `, [t.columns]);
        console.log(`Report for ${t.table}:`, res.rows.map(r => r.column_name));
    }
    
    await client.end();
}

checkSchema();
