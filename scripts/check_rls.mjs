import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkRLS() {
    const connectionString = process.env.SUPABASE_CONNECTION_STRING;
    const client = new Client({ connectionString });
    await client.connect();

    const res = await client.query(`
        SELECT 
            tablename, 
            policyname, 
            permissive, 
            roles, 
            cmd, 
            qual, 
            with_check
        FROM pg_policies
        WHERE tablename = 'profiles';
    `);
    
    console.log("RLS Policies on profiles:", JSON.stringify(res.rows, null, 2));
    await client.end();
}

checkRLS();
