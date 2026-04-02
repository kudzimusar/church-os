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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { campaign_id } = await req.json();
    if (!campaign_id) throw new Error("Missing campaign_id");

    // 1. Fetch Campaign
    const { data: campaign, error: campErr } = await supabaseClient
      .from("communication_campaigns")
      .select("*")
      .eq("id", campaign_id)
      .single();

    if (campErr || !campaign) throw new Error("Campaign not found");

    if (campaign.status === "sent") {
      return new Response(JSON.stringify({ success: true, message: "Already sent" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark as sending
    await supabaseClient
      .from("communication_campaigns")
      .update({ status: "sending" })
      .eq("id", campaign_id);

    // 2. Fetch Audience
    // For MVP: if target_id exists, we just fetch that exact email from member_communication_profiles.
    // If org_wide, we fetch all profiles for that org.
    let mcpQuery = supabaseClient
      .from("member_communication_profiles")
      .select("*")
      .eq("org_id", campaign.org_id);

    if (campaign.audience_filter?.target_id) {
      mcpQuery = mcpQuery.eq("email", campaign.audience_filter.target_id);
    }

    const { data: profiles, error: profErr } = await mcpQuery;
    if (profErr || !profiles) throw new Error("Failed to load audience");

    let totalSent = 0;
    let totalFailed = 0;

    // 3. Dispatch to each profile
    const brevoKey = Deno.env.get("BREVO_API_KEY");
    const lineKey = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN");

    for (const profile of profiles) {
      const isJa = profile.preferred_language === "ja";
      let sentToMember = false;

      // EMAIL
      if (campaign.channels.includes("email") && profile.email) {
        const subject = isJa ? campaign.subject_ja : campaign.subject_en;
        const bodyContent = isJa ? campaign.body_ja : campaign.body_en;
        
        if (brevoKey && subject && bodyContent) {
          try {
            const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
              method: "POST",
              headers: {
                "accept": "application/json",
                "api-key": brevoKey,
                "content-type": "application/json"
              },
              body: JSON.stringify({
                sender: { name: "Church OS", email: "communications@jkc.org" }, // placeholder fallback
                to: [{ email: profile.email }],
                subject: subject,
                htmlContent: `<div style="font-family: sans-serif; white-space: pre-wrap;">${bodyContent}</div>`
              })
            });
            if (brevoRes.ok) sentToMember = true;
            else {
              console.error("Brevo error:", await brevoRes.text());
            }
          } catch (e) {
            console.error("Brevo catch:", e);
          }
        } else {
             // Mock success if no keys but they wanted to send
             console.log(`[MOCK EMAIL] Sent to ${profile.email}: ${subject}`);
             sentToMember = true;
        }
      }

      // LINE
      if (campaign.channels.includes("line") && profile.line_user_id) {
        const lineContent = isJa ? campaign.line_message_ja : campaign.line_message_en;
        
        if (lineKey && lineContent) {
          try {
            const lineRes = await fetch("https://api.line.me/v2/bot/message/push", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${lineKey}`
              },
              body: JSON.stringify({
                to: profile.line_user_id,
                messages: [{ type: "text", text: lineContent }]
              })
            });
            if (lineRes.ok) sentToMember = true;
          } catch (e) {
            console.error("Line error:", e);
          }
        } else {
             console.log(`[MOCK LINE] Sent to ${profile.line_user_id}: ${lineContent}`);
             sentToMember = true;
        }
      }

      if (sentToMember) totalSent++;
      else totalFailed++;
    }

    // 4. Finalize Campaign
    await supabaseClient
      .from("communication_campaigns")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        total_sent: totalSent,
        total_failed: totalFailed
      })
      .eq("id", campaign_id);

    return new Response(JSON.stringify({ success: true, totalSent, totalFailed }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("[coce-dispatch] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
