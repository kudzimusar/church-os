import { Client } from 'pg';
import fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
    const connectionString = process.env.SUPABASE_CONNECTION_STRING;
    if (!connectionString) {
        console.error("No SUPABASE_CONNECTION_STRING found in .env.local");
        return;
    }

    const migrationFile = 'supabase/migrations/20260328000000_profile_system_final_sync.sql';
    if (!fs.existsSync(migrationFile)) {
        console.error(`Migration file ${migrationFile} not found.`);
        return;
    }

    const sql = fs.readFileSync(migrationFile, 'utf8');
    const client = new Client({ connectionString });
    
    try {
        await client.connect();
        console.log(`Applying migration: ${migrationFile}...`);
        await client.query(sql);
        console.log("Migration successfully applied to Supabase.");
    } catch (err) {
        console.error("Migration failed:", err.message);
        if (err.detail) console.error("Detail:", err.detail);
        if (err.hint) console.error("Hint:", err.hint);
    } finally {
        await client.end();
    }
}

run();
