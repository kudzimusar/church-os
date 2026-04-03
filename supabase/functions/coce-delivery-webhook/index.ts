import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("📨 Brevo Webhook Received:", JSON.stringify(payload));
    
    // Brevo sends an array of events or a single object.
    const events = Array.isArray(payload) ? payload : [payload];
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    for (const evt of events) {
      if (!evt.tags || evt.tags.length === 0) continue;
      
      const campaign_id = evt.tags[0]; // Extracted campaign_id tag from Brevo
      const status = evt.event; // 'opened', 'click', 'delivered', 'hard_bounce', etc.
      
      // Look up current totals
      const { data: campaign } = await supabaseClient
        .from('communication_campaigns')
        .select('total_opened, total_failed')
        .eq('id', campaign_id)
        .single();
        
      if (!campaign) continue;

      if (status === 'opened') {
        const newOpened = (campaign.total_opened || 0) + 1;
        await supabaseClient.from('communication_campaigns').update({ total_opened: newOpened }).eq('id', campaign_id);
        console.log(`Campaign ${campaign_id} Opened (+1), Total: ${newOpened}`);
      } else if (['hard_bounce', 'soft_bounce', 'spam', 'invalid_email', 'error', 'blocked'].includes(status)) {
        const newFailed = (campaign.total_failed || 0) + 1;
        await supabaseClient.from('communication_campaigns').update({ total_failed: newFailed }).eq('id', campaign_id);
        console.log(`Campaign ${campaign_id} Failed (+1), Total: ${newFailed}`);
      }
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("❌ Webhook error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
});
