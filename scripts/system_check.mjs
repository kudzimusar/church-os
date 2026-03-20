import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkSystem() {
    const connectionString = process.env.SUPABASE_CONNECTION_STRING;
    const client = new Client({ connectionString });
    await client.connect();

    try {
        const tablesRes = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
        console.log('Tables:', tablesRes.rows.map(r => r.tablename));

        const functionsRes = await client.query("SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public'");
        console.log('Functions:', functionsRes.rows.map(r => r.routine_name).filter(f => f.includes('insight') || f.includes('refresh')));
    } finally {
        await client.end();
    }
}

checkSystem();
