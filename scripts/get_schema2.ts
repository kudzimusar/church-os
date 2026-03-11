import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

async function extractSchema() {
  const client = new Client({
    connectionString: process.env.SUPABASE_CONNECTION_STRING
  });

  try {
    await client.connect();

    const tablesRes = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);

    const viewsRes = await client.query(`
      SELECT table_name
      FROM information_schema.views
      WHERE table_schema = 'public'
    `);

    const columnsRes = await client.query(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
    `);

    const fksRes = await client.query(`
      SELECT
          tc.table_name, 
          kcu.column_name, 
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
      FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema='public';
    `);

    const schema = {
      tables: tablesRes.rows.map(r => r.table_name).sort(),
      views: viewsRes.rows.map(r => r.table_name).sort(),
      columns: columnsRes.rows,
      foreignKeys: fksRes.rows
    };

    fs.writeFileSync('/tmp/clean_schema.json', JSON.stringify(schema, null, 2));
    
  } catch (error) {
    console.error("Error connecting to database:", error);
  } finally {
    await client.end();
  }
}

extractSchema();
