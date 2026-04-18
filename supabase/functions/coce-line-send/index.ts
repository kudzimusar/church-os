import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { org_id, line_user_id, message_en, message_ja, preferred_language, campaign_id, member_id, thread_id } = await req.json();

    if (!org_id) return err400("Missing org_id");
    if (!line_user_id) return err400("Missing line_user_id");
    if (!message_en && !message_ja) return err400("Must provide at least message_en or message_ja");

    // Pick the right message based on preferred language
    const lang = preferred_language ?? "en";
    const message = lang === "ja"
      ? (message_ja ?? message_en ?? "")
      : (message_en ?? message_ja ?? "");

    if (!message) return err400("No message content resolved");

    const lineToken = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN");
    let lineMessageId: string | null = null;

    if (lineToken) {
      const lineRes = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${lineToken}`,
        },
        body: JSON.stringify({
          to: line_user_id,
          messages: [{ type: "text", text: message }],
        }),
      });

      if (!lineRes.ok) {
        const errBody = await lineRes.text();
        console.error("[coce-line-send] LINE API error:", errBody);
        return new Response(
          JSON.stringify({ error: `LINE API error: ${errBody}` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 502 }
        );
      }

      const lineData = await lineRes.json().catch(() => ({}));
      lineMessageId = lineData?.sentMessages?.[0]?.id ?? null;
    } else {
      console.log(`[MOCK LINE] To: ${line_user_id} | Message: ${message.substring(0, 80)}`);
    }

    // ── Log to communication_events ──
    await supabase.from("communication_events").insert({
      org_id,
      channel: "line",
      direction: "outbound",
      event_type: "sent",
      campaign_id: campaign_id ?? null,
      member_id: member_id ?? null,
      thread_id: thread_id ?? null,
      external_identifier: line_user_id,
      preview: message.substring(0, 200),
      metadata: { line_message_id: lineMessageId, line_user_id },
    });

    return new Response(
      JSON.stringify({ success: true, line_message_id: lineMessageId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("[coce-line-send] Unhandled error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

function err400(message: string) {
  return new Response(
    JSON.stringify({ error: message }),
    { headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" }, status: 400 }
  );
}
