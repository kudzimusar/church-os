
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const connectionString = process.env.SUPABASE_CONNECTION_STRING;

if (!connectionString) {
    console.error("Missing SUPABASE_CONNECTION_STRING");
    process.exit(1);
}

const migrationPath = '/Users/shadreckmusarurwa/Project AI/jkc-devotion-app/supabase/migrations/20260307000000_fix_rls_recursion.sql';

async function runMigration() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log("Connected to database.");
        const sql = fs.readFileSync(migrationPath, 'utf8');
        console.log("Applying migration...");
        await client.query(sql);
        console.log("Migration applied successfully.");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await client.end();
    }
}

runMigration();
