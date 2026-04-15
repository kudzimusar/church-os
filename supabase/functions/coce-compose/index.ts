import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS — allow GitHub Pages and localhost
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const {
      org_id,
      intent,
      campaign_type,
      audience_scope,
      target_id,
      channels,
      scheduled_at,
      created_by,
    } = await req.json();

    if (!org_id || !intent || !campaign_type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: org_id, intent, campaign_type" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // ────────────────────────────────────────────────────────────
    // 1. Fetch Church Health Context for intelligent drafting
    // ────────────────────────────────────────────────────────────
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("name, country")
      .eq("id", org_id)
      .single();

    if (orgErr) console.error(`[coce-compose] org query error: ${orgErr.message} (code: ${orgErr.code})`);

    const { data: healthMetrics } = await supabase
      .from("church_health_metrics")
      .select("metric_type, metric_value, note")
      .eq("org_id", org_id)
      .order("recorded_at", { ascending: false })
      .limit(10);

    const { data: recentAttendance } = await supabase
      .from("attendance_logs")
      .select("attendance_count, service_date")
      .eq("org_id", org_id)
      .order("service_date", { ascending: false })
      .limit(3);

    // ────────────────────────────────────────────────────────────
    // 2. Determine which channel formats to generate
    // ────────────────────────────────────────────────────────────
    const needsLine = Array.isArray(channels) && channels.includes("line");
    const needsSms = Array.isArray(channels) && channels.includes("sms");

    // ────────────────────────────────────────────────────────────
    // 3. Call Gemini to compose bilingual, multi-channel content
    // ────────────────────────────────────────────────────────────
    const geminiKey = Deno.env.get("GEMINI_API_KEY");

    // Build context summary for Gemini
    const churchName = org?.name ?? "our church";
    console.log(`[coce-compose] org="${churchName}" | gemini=${!!geminiKey}`);
    const healthSummary = healthMetrics
      ? healthMetrics.map((m: any) => `${m.metric_type}: ${m.metric_value}${m.note ? ` (${m.note})` : ""}`).join(", ")
      : "No health metrics available";
    const attendanceSummary = recentAttendance
      ? recentAttendance.map((a: any) => `${a.service_date}: ${a.attendance_count} present`).join(", ")
      : "No recent attendance data";

    let draft: Record<string, string> = {
      subject_en: `Update from ${churchName}`,
      subject_ja: `${churchName}からのお知らせ`,
      body_en: intent,
      body_ja: intent,
      send_time_suggestion: "Consider sending on Sunday morning or Wednesday evening for best engagement.",
    };

    if (geminiKey) {
      const channelInstructions = [
        `"subject_en": compelling email subject line (English)`,
        `"subject_ja": compelling email subject line (Japanese)`,
        `"body_en": warm pastoral email body (English, 3-5 paragraphs)`,
        `"body_ja": pastoral email body (Japanese, matching tone and length)`,
        needsLine ? `"line_message_en": punchy LINE message (English, max 3 sentences, casual and warm)` : "",
        needsLine ? `"line_message_ja": LINE message (Japanese, max 3 sentences)` : "",
        needsSms ? `"sms_message_en": SMS text (English, max 160 chars)` : "",
        needsSms ? `"sms_message_ja": SMS text (Japanese, max 70 chars)` : "",
        `"send_time_suggestion": one sentence on the best time to send this type of message`,
      ].filter(Boolean).join(", ");

      const prompt = `You are the Church OS Pastoral Communications Intelligence for ${churchName}.
Act as an expert copywriter and composer giving specific numbers from the ecosystem, rather than just returning the user's intent.
Draft a ${campaign_type.replace(/_/g, " ")} message based on this admin intent: "${intent}"

Ecosystem Intelligence: 
- Health Metrics: ${healthSummary}
- Recent Attendance: ${attendanceSummary}
- Audience: ${audience_scope.replace("_", " ")}
- Sender Context: Sent by a leader/staff member to the church. Ensure it sounds like it comes from the leadership team.

Requirement: Use the actual numbers and metrics supplied above in the body of the message to show real impact, spiritual growth, and transparency. Do not tell the user to insert numbers; write them into the text yourself.

Return ONLY a valid JSON object with these exact keys: ${channelInstructions}

Be warm, pastoral, encouraging and specific to the intent. No placeholder text. NO MARKDOWN. NO CODE BLOCKS.`;

      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 4096,
              },
            }),
          }
        );


        const geminiData = await geminiRes.json();
        const candidate = geminiData?.candidates?.[0];
        const rawText = candidate?.content?.parts?.[0]?.text ?? "";
        if (geminiData?.error) {
          console.error(`[coce-compose] Gemini error: ${JSON.stringify(geminiData.error)}`);
        }

        // Strip any markdown code fences Gemini sometimes adds
        let cleanJson = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

        if (cleanJson) {
           // Handle the case where JSON is slightly cut off but mostly valid (if it ever happens again)
           if (!cleanJson.endsWith("}")) {
              cleanJson += "\"}"; // naive append to prevent total failure
           }
          const parsed = JSON.parse(cleanJson);
          draft = { ...draft, ...parsed };
          console.log(`[coce-compose] Draft generated with AI ✓`);
        }
      } catch (gemErr: any) {
        console.error("[coce-compose] Gemini parse error:", gemErr.message, "Raw was:", rawText.substring(0, 50));
        // Fall through to fallback
      }



    } else {
      console.warn("[coce-compose] GEMINI_API_KEY not set — returning intent as draft body");
      // Still return a usable draft so the page works without AI
      draft = {
        subject_en: `Message from ${churchName}`,
        subject_ja: `${churchName}からのメッセージ`,
        body_en: intent,
        body_ja: `(Japanese translation pending — Gemini API key required)\n\n${intent}`,
        send_time_suggestion: "Consider sending on Sunday morning or Wednesday evening for best engagement.",
      };
      if (needsLine) {
        draft.line_message_en = intent.substring(0, 200);
        draft.line_message_ja = `(翻訳保留) ${intent.substring(0, 150)}`;
      }
      if (needsSms) {
        draft.sms_message_en = intent.substring(0, 160);
        draft.sms_message_ja = intent.substring(0, 70);
      }
    }

    // ────────────────────────────────────────────────────────────
    // 4. Save as draft campaign in communication_campaigns
    // ────────────────────────────────────────────────────────────
    const { data: campaign, error: campaignError } = await supabase
      .from("communication_campaigns")
      .insert({
        org_id,
        title: draft.subject_en || `Draft: ${campaign_type}`,
        campaign_type,
        subject_en: draft.subject_en,
        subject_ja: draft.subject_ja,
        body_en: draft.body_en,
        body_ja: draft.body_ja,
        ai_drafted: !!geminiKey,
        ai_prompt_used: intent,
        ai_model_used: geminiKey ? "gemini-2.0-flash" : null,
        ai_context_used: {
          health_metrics: healthMetrics,
          recent_attendance: recentAttendance,
        },
        audience_scope,
        audience_filter: target_id ? { target_id } : null,
        channels: channels ?? ["email"],
        status: "draft",
        scheduled_at: scheduled_at ?? null,
        trigger_type: "manual",
        created_by: created_by ?? null,
      })
      .select()
      .single();

    if (campaignError) {
      console.error("[coce-compose] Campaign insert error:", campaignError);
      return new Response(
        JSON.stringify({ error: campaignError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        campaign_id: campaign.id,
        draft,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (err: any) {
    console.error("[coce-compose] Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: err.message ?? "Internal server error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
