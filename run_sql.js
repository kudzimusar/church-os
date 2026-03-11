const { Client } = require('pg');
const fs = require('fs');

async function run() {
  const connectionString = 'postgresql://postgres.dapxrorkcvpzzkggopsa:Youblessme-1985@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const file = process.argv[2];
    const sql = fs.readFileSync(file, 'utf8');
    
    // Split by `-- ` section headers to execute chunks sequentially, because single string execution fails on added columns.
    const chunks = sql.split('-- ').filter(c => c.trim().length > 0);
    
    await client.connect();
    console.log('Connected to DB');
    
    for (const chunk of chunks) {
      const statement = '-- ' + chunk;
      console.log('Executing chunk:', statement.substring(0, 50).trim(), '...');
      await client.query(statement);
    }
    
    console.log('All SQL Executed successfully');
  } catch (err) {
    console.error('Error executing SQL:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
