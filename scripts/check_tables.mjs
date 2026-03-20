import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function listTables() {
    const connectionString = process.env.SUPABASE_CONNECTION_STRING;
    const client = new Client({ connectionString });
    await client.connect();

    const res = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE '%milestone%';
    `);
    
    console.log("Milestone-related tables:", res.rows);
    await client.end();
}

listTables();
