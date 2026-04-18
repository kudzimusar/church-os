import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Pick the right sender address based on campaign type */
function pickSenderAddress(emailConfig: any, campaignType: string): string {
  if (!emailConfig) return "noreply@churchos-ai.website";
  if (campaignType === "devotion_reminder" || campaignType.startsWith("newsletter_"))
    return emailConfig.noreply_address;
  if (campaignType === "pastoral_message" || campaignType === "thread_reply")
    return emailConfig.pastor_address;
  if (campaignType === "inquiry_reply")
    return emailConfig.connect_address;
  if (campaignType === "event_reminder" || campaignType === "event_spotlight")
    return emailConfig.events_address;
  if (campaignType === "giving_appeal" || campaignType === "generosity_appeal")
    return emailConfig.give_address;
  return emailConfig.noreply_address;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // ── Parse body (optional: campaign_id, per_member_bodies) ──
    let payloadIds: string[] = [];
    let perMemberBodies: Record<string, { body_en?: string; body_ja?: string }> = {};

    try {
      const text = await req.text();
      if (text) {
        const body = JSON.parse(text);
        if (body.campaign_id) payloadIds.push(body.campaign_id);
        if (Array.isArray(body.campaign_ids)) payloadIds.push(...body.campaign_ids);
        if (body.per_member_bodies) perMemberBodies = body.per_member_bodies; // { [member_id]: { body_en, body_ja } }
      }
    } catch (_e) { /* empty body is fine */ }

    let campaignsToProcess: any[] = [];

    if (payloadIds.length > 0) {
      const { data: c } = await supabaseClient
        .from("communication_campaigns")
        .select("*")
        .in("id", payloadIds);
      if (c && c.length > 0) campaignsToProcess = c;
    } else {
      // Cron mode: fetch scheduled campaigns that are due
      const { data: pending } = await supabaseClient
        .from("communication_campaigns")
        .select("*")
        .eq("status", "scheduled")
        .lte("scheduled_at", new Date().toISOString())
        .limit(5);
      if (pending && pending.length > 0) campaignsToProcess = pending;
    }

    if (campaignsToProcess.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No campaigns to process" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const brevoKey = Deno.env.get("BREVO_API_KEY");
    const lineKey = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN");

    for (const campaign of campaignsToProcess) {
      if (campaign.status === "sent") continue;

      // ── Fetch church email config for branded sender ──
      const { data: emailConfig } = await supabaseClient
        .from("church_email_config")
        .select("sender_display_name, noreply_address, pastor_address, connect_address, events_address, give_address, ministry_address, admin_address")
        .eq("org_id", campaign.org_id)
        .single();

      const senderName = emailConfig?.sender_display_name ?? "Church OS";
      const senderEmail = pickSenderAddress(emailConfig, campaign.campaign_type ?? "");

      // Mark as sending
      await supabaseClient
        .from("communication_campaigns")
        .update({ status: "sending" })
        .eq("id", campaign.id);

      let mcpQuery = supabaseClient
        .from("member_communication_profiles")
        .select("*")
        .eq("org_id", campaign.org_id);

      if (campaign.audience_scope === "individual" && campaign.audience_filter?.target_id) {
        mcpQuery = mcpQuery.eq("email", campaign.audience_filter.target_id);
      } else if (campaign.audience_scope === "ministry" && campaign.audience_filter?.target_id) {
        const { data: members } = await supabaseClient
          .from("ministry_members")
          .select("user_id")
          .eq("ministry_id", campaign.audience_filter.target_id);
        const pids = members?.map((m: any) => m.user_id) || [];
        if (pids.length > 0) mcpQuery = mcpQuery.in("member_id", pids);
        else mcpQuery = mcpQuery.eq("member_id", "00000000-0000-0000-0000-000000000000");
      } else if (campaign.audience_scope === "small_group" && campaign.audience_filter?.target_id) {
        const { data: members } = await supabaseClient
          .from("bible_study_group_members")
          .select("user_id")
          .eq("group_id", campaign.audience_filter.target_id);
        const pids = members?.map((m: any) => m.user_id) || [];
        if (pids.length > 0) mcpQuery = mcpQuery.in("member_id", pids);
        else mcpQuery = mcpQuery.eq("member_id", "00000000-0000-0000-0000-000000000000");
      }

      const { data: profiles } = await mcpQuery;
      if (!profiles || profiles.length === 0) {
        await supabaseClient
          .from("communication_campaigns")
          .update({ status: "sent", sent_at: new Date().toISOString(), total_sent: 0, total_failed: 0 })
          .eq("id", campaign.id);
        continue;
      }

      let totalSent = 0;
      let totalFailed = 0;

      for (const profile of profiles) {
        const isJa = profile.preferred_language === "ja";
        let sentToMember = false;

        // ── EMAIL ──
        if (campaign.channels?.includes("email") && profile.email) {
          const subject = isJa ? campaign.subject_ja : campaign.subject_en;
          // Use per-member body if provided (for personalised devotion emails)
          const memberBody = perMemberBodies[profile.member_id];
          const bodyContent = memberBody
            ? (isJa ? (memberBody.body_ja ?? campaign.body_ja) : (memberBody.body_en ?? campaign.body_en))
            : (isJa ? campaign.body_ja : campaign.body_en);

          if (subject && bodyContent) {
            // ── Create delivery record first so we have its ID for reply token ──
            const { data: delivery } = await supabaseClient
              .from("communication_deliveries")
              .insert({
                org_id: campaign.org_id,
                campaign_id: campaign.id,
                member_id: profile.member_id,
                channel: "email",
                status: "sent",
                sent_at: new Date().toISOString(),
              })
              .select("id")
              .single();

            // ── Generate personalised reply-to address ──
            let replyTo: string | null = null;
            if (delivery?.id) {
              const { data: replyAddr } = await supabaseClient.rpc("create_reply_address", {
                p_org_id: campaign.org_id,
                p_campaign_id: campaign.id,
                p_thread_id: campaign.thread_id ?? null,
                p_member_id: profile.member_id,
                p_delivery_id: delivery.id,
              });
              replyTo = replyAddr ?? null;

              // Store reply token in delivery metadata
              if (replyAddr) {
                const token = replyAddr.split("+")[1]?.split("@")[0] ?? "";
                await supabaseClient
                  .from("communication_deliveries")
                  .update({ metadata: { reply_token: token } })
                  .eq("id", delivery.id);
              }
            }

            if (brevoKey) {
              try {
                const brevoPayload: any = {
                  sender: { name: senderName, email: senderEmail },
                  to: [{ email: profile.email }],
                  subject,
                  htmlContent: bodyContent,
                  tags: [campaign.id],
                };
                if (replyTo) brevoPayload.replyTo = { email: replyTo };

                const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
                  method: "POST",
                  headers: {
                    "accept": "application/json",
                    "api-key": brevoKey,
                    "content-type": "application/json",
                  },
                  body: JSON.stringify(brevoPayload),
                });

                if (brevoRes.ok) {
                  sentToMember = true;
                } else {
                  console.error("[coce-dispatch] Brevo error:", await brevoRes.text());
                }
              } catch (e: any) {
                console.error("[coce-dispatch] Brevo catch:", e.message);
              }
            } else {
              console.log(`[MOCK EMAIL] To: ${profile.email} | Subject: ${subject} | ReplyTo: ${replyTo}`);
              sentToMember = true;
            }
          }
        }

        // ── LINE ──
        if (campaign.channels?.includes("line") && profile.line_user_id) {
          const isJa = profile.preferred_language === "ja";
          const lineContent = isJa ? campaign.line_message_ja : campaign.line_message_en;

          if (lineContent) {
            if (lineKey) {
              try {
                const lineRes = await fetch("https://api.line.me/v2/bot/message/push", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${lineKey}`,
                  },
                  body: JSON.stringify({
                    to: profile.line_user_id,
                    messages: [{ type: "text", text: lineContent }],
                  }),
                });
                if (lineRes.ok) sentToMember = true;
              } catch (e: any) {
                console.error("[coce-dispatch] LINE error:", e.message);
              }
            } else {
              console.log(`[MOCK LINE] To: ${profile.line_user_id}: ${lineContent}`);
              sentToMember = true;
            }
          }
        }

        if (sentToMember) totalSent++;
        else totalFailed++;
      }

      // Finalize campaign
      await supabaseClient
        .from("communication_campaigns")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          total_sent: totalSent,
          total_failed: totalFailed,
        })
        .eq("id", campaign.id);
    }

    return new Response(
      JSON.stringify({ success: true, processed: campaignsToProcess.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[coce-dispatch] Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
