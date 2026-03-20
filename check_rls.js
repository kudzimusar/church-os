
const { Client } = require('pg');

const connectionString = "postgresql://postgres.dapxrorkcvpzzkggopsa:Youblessme-1985@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres";

async function checkRLS() {
    const client = new Client({ connectionString });
    await client.connect();
    
    try {
        const res = await client.query(`
            SELECT tablename, policyname, roles, cmd, qual, with_check 
            FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename IN ('profiles', 'org_members', 'attendance_records', 'ministries', 'ministry_reports', 'merchandise');
        `);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkRLS();
