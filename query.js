const { createClient } = require('@supabase/supabase-js');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fa547adf-f820-412f-9458-d6bade11517d.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'fake';
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: d1, error: e1 } = await supabase.from('vw_global_connection_metrics').select('*').limit(5);
  console.log("Q11 Result:", d1, e1);
}
run();
