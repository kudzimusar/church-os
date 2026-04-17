const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data: d1, error: e1 } = await supabase.rpc('pg_get_viewdef', { view_name: 'vw_global_connection_metrics' });
  console.log("Q11 Viewdef RPC:", d1, e1);
}
run();
