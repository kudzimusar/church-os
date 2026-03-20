import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config({ path: '.env.local' });

async function applyMigration() {
    const connectionString = process.env.SUPABASE_CONNECTION_STRING;
    const client = new Client({ connectionString });
    await client.connect();

    try {
        const sql = fs.readFileSync('supabase/migrations/20260320010000_data_consistency_fixes.sql', 'utf8');
        await client.query(sql);
        console.log("Migration applied successfully!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await client.end();
    }
}

applyMigration();
