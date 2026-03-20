import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkTriggers() {
    const connectionString = process.env.SUPABASE_CONNECTION_STRING;
    const client = new Client({ connectionString });
    await client.connect();

    const res = await client.query(`
        SELECT 
            event_object_table AS table_name, 
            trigger_name, 
            action_statement AS action
        FROM information_schema.triggers
        WHERE event_object_table = 'profiles';
    `);
    
    console.log("Triggers on profiles:", res.rows);
    await client.end();
}

checkTriggers();
