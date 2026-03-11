import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function cleanMockData() {
  const client = new Client({
    connectionString: process.env.SUPABASE_CONNECTION_STRING
  });

  try {
    await client.connect();

    console.log("Verification specific output:");
    // Step 1: Verify orphans
    const mmOrphans = await client.query(`
      SELECT mm.id, mm.ministry_name, p.name AS member_name
      FROM ministry_members mm
      LEFT JOIN profiles p ON p.id = mm.user_id
      WHERE p.id IS NULL;
    `);
    console.log("Orphaned ministry_members:", mmOrphans.rowCount);

    const fgDups = await client.query(`
      SELECT name, COUNT(*) AS duplicates
      FROM fellowship_groups
      GROUP BY name HAVING COUNT(*) > 1;
    `);
    console.log("Duplicate fellowship_groups:", fgDups.rows);

    // Step 2: Delete
    const delMm = await client.query(`
      DELETE FROM ministry_members mm
      WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = mm.user_id);
    `);
    console.log("Deleted orphaned ministry_members:", delMm.rowCount);

    const delFg = await client.query(`
      DELETE FROM fellowship_groups
      WHERE id NOT IN (
        SELECT id FROM (
          SELECT id, ROW_NUMBER() OVER(PARTITION BY name ORDER BY created_at ASC) as rn 
          FROM fellowship_groups
        ) t WHERE rn = 1
      );
    `);
    console.log("Deleted duplicate fellowship_groups:", delFg.rowCount);

    // Step 3: Delete unconnected prayer requests
    // Let's check prayer requests
    const prOrphans = await client.query(`
      SELECT pr.id, pr.request_text
      FROM prayer_requests pr
      LEFT JOIN profiles p ON p.id = pr.user_id
      WHERE p.id IS NULL;
    `);
    console.log("Orphaned prayer_requests:", prOrphans.rowCount);
    
    const delPr = await client.query(`
      DELETE FROM prayer_requests pr
      WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = pr.user_id);
    `);
    console.log("Deleted orphaned prayer_requests:", delPr.rowCount);

  } catch (error) {
    console.error("Error executing clean up:", error);
  } finally {
    await client.end();
  }
}

cleanMockData();
