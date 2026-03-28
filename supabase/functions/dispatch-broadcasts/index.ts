import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

Deno.serve(async (req: Request) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log("Starting broadcast dispatcher...");

    // 1. Fetch scheduled broadcasts that haven't been dispatched
    const { data: broadcasts, error: fetchError } = await supabaseClient
      .from('platform_broadcasts')
      .select('*')
      .is('dispatched_at', null)
      .lte('scheduled_at', new Date().toISOString());

    if (fetchError) throw fetchError;

    let totalDispatched = 0;

    for (const bc of broadcasts || []) {
      const { id, target_type, target_metadata } = bc;
      let targetOrgIds: string[] = [];

      // Determine target organizations
      if (target_type === 'all') {
        const { data: allOrgs } = await supabaseClient
          .from('organizations')
          .select('id')
          .eq('status', 'active');
        targetOrgIds = (allOrgs || []).map(o => o.id);
      } else if (target_type === 'plan') {
        const { data: planOrgs } = await supabaseClient
          .from('organization_subscriptions')
          .select('org_id')
          .eq('plan_id', target_metadata.plan_id)
          .eq('status', 'active');
        targetOrgIds = (planOrgs || []).map(o => o.org_id);
      } else if (target_type === 'selected') {
        targetOrgIds = target_metadata.org_ids || [];
      }

      // 2. Insert unread receipts for each target org
      if (targetOrgIds.length > 0) {
        const receipts = targetOrgIds.map(orgId => ({
          broadcast_id: id,
          org_id: orgId,
          is_read: false
        }));

        const { error: receiptError } = await supabaseClient
          .from('broadcast_receipts')
          .insert(receipts);

        if (receiptError) console.error(`Error inserting receipts for BC ${id}:`, receiptError);
      }

      // 3. Mark broadcast as dispatched
      await supabaseClient
        .from('platform_broadcasts')
        .update({ 
          dispatched_at: new Date().toISOString(),
          recipient_count: targetOrgIds.length
        })
        .eq('id', id);

      totalDispatched++;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        dispatched_count: totalDispatched 
      }), 
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Broadcast Dispatcher error:", err);
    return new Response(
      JSON.stringify({ error: err.message }), 
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
