import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkInviteMethodType() {
    const connectionString = process.env.SUPABASE_CONNECTION_STRING;
    const client = new Client({ connectionString });
    await client.connect();

    const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
        AND column_name = 'invite_method';
    `);
    
    console.log("Column Info:", res.rows);
    await client.end();
}

checkInviteMethodType();
