import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-line-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("💬 LINE Webhook Received:", JSON.stringify(payload));
    
    const events = payload.events || [];
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    for (const event of events) {
       const lineUserId = event.source?.userId;
       if (!lineUserId) continue;

       // Example of catching LINE messages
       if (event.type === 'message' && event.message?.type === 'text') {
           console.log(`💬 User ${lineUserId} sent: ${event.message.text}`);
           // E.g., Insert to 2-way chat table for Shepherd Inbox
           // await supabaseClient.from('inbound_messages').insert({ ... })
       }
       if (event.type === 'follow') {
           console.log(`🤖 User ${lineUserId} added the official LINE account.`);
       }
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("❌ LINE Webhook error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
});
