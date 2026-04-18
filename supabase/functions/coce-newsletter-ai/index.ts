import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const body = await req.json().catch(() => ({}));
    const { org_id: targetOrgId, force_types } = body;

    // ── Determine orgs to process ──
    let orgs: any[] = [];
    if (targetOrgId) {
      const { data: org } = await supabase.from("organizations").select("id, name").eq("id", targetOrgId).single();
      if (org) orgs = [org];
    } else {
      const { data: allOrgs } = await supabase
        .from("organizations")
        .select("id, name")
        .eq("status", "active");
      orgs = allOrgs ?? [];
    }

    const draftsCreated: any[] = [];
    const errors: any[] = [];
    const todayUtc = new Date();
    const todayDow = todayUtc.getUTCDay(); // 0=Sun
    const todayHour = todayUtc.getUTCHours();
    const todayDate = todayUtc.toISOString().split("T")[0];

    for (const org of orgs) {
      try {
        // ── Fetch newsletter automation config ──
        const { data: config } = await supabase
          .from("newsletter_automation_config")
          .select("*")
          .eq("org_id", org.id)
          .single();

        if (!config && !force_types) continue;

        // ── Determine which types are due today ──
        const typesToDraft: string[] = [];

        if (force_types && Array.isArray(force_types)) {
          typesToDraft.push(...force_types);
        } else if (config) {
          if (config.weekly_digest_enabled && todayDow === config.weekly_digest_day && todayHour >= config.weekly_digest_hour)
            typesToDraft.push("newsletter_weekly_digest");
          if (config.prayer_bulletin_enabled && todayDow === config.prayer_bulletin_day && todayHour >= config.prayer_bulletin_hour)
            typesToDraft.push("newsletter_prayer_bulletin");
          if (config.pastoral_letter_enabled && todayDow === config.pastoral_letter_day)
            typesToDraft.push("newsletter_pastoral_letter");
          if (config.testimony_edition_enabled && todayDow === config.testimony_edition_day)
            typesToDraft.push("newsletter_testimony_edition");
        }

        if (typesToDraft.length === 0) continue;

        // ── Fetch or create church intelligence snapshot ──
        let snapshotId: string | null = null;
        let snapshotData: any = {};

        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: existingSnapshot } = await supabase
          .from("church_intelligence_snapshots")
          .select("id, snapshot_data")
          .eq("org_id", org.id)
          .gte("created_at", sevenDaysAgo)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (existingSnapshot) {
          snapshotId = existingSnapshot.id;
          snapshotData = existingSnapshot.snapshot_data ?? {};
        } else {
          // Aggregate fresh snapshot
          const [
            { count: attendanceCount },
            { count: devotionCount },
            { count: prayerCount },
            { count: visitorCount },
            { data: upcomingEvents },
            { data: soapEntries },
          ] = await Promise.all([
            supabase.from("service_attendance").select("id", { count: "exact", head: true }).eq("org_id", org.id).gte("created_at", sevenDaysAgo),
            supabase.from("devotion_logs").select("id", { count: "exact", head: true }).eq("org_id", org.id).gte("created_at", sevenDaysAgo),
            supabase.from("prayer_requests").select("id", { count: "exact", head: true }).eq("org_id", org.id).gte("created_at", sevenDaysAgo),
            supabase.from("public_inquiries").select("id", { count: "exact", head: true }).eq("org_id", org.id).gte("created_at", sevenDaysAgo),
            supabase.from("events").select("name, event_date, location").eq("org_id", org.id).gte("event_date", todayDate).order("event_date").limit(5),
            supabase.from("soap_entries").select("themes, scripture_reference").eq("org_id", org.id).gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()).limit(50),
          ]);

          // Extract top SOAP themes
          const themeCounts: Record<string, number> = {};
          for (const entry of soapEntries ?? []) {
            for (const theme of entry.themes ?? []) {
              themeCounts[theme] = (themeCounts[theme] ?? 0) + 1;
            }
          }
          const topThemes = Object.entries(themeCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t);

          snapshotData = {
            week_ending: todayDate,
            attendance_count: attendanceCount ?? 0,
            devotion_completions: devotionCount ?? 0,
            new_prayer_requests: prayerCount ?? 0,
            new_visitors: visitorCount ?? 0,
            upcoming_events: upcomingEvents ?? [],
            top_soap_themes: topThemes,
          };

          const { data: newSnapshot } = await supabase
            .from("church_intelligence_snapshots")
            .insert({ org_id: org.id, snapshot_data: snapshotData })
            .select("id")
            .single();
          snapshotId = newSnapshot?.id ?? null;
        }

        // ── Draft each newsletter type via coce-ai-brain ──
        for (const newsletterType of typesToDraft) {
          const brainRes = await fetch(
            `${SUPABASE_URL}/functions/v1/coce-ai-brain`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                // no auth needed — verify_jwt=false on coce-ai-brain
              },
              body: JSON.stringify({
                org_id: org.id,
                trigger_source: "cron_newsletter",
                campaign_type: newsletterType,
                audience_scope: "org_wide",
                context_data: { snapshot_id: snapshotId, snapshot_data: snapshotData },
              }),
            }
          );

          if (brainRes.ok) {
            const brainData = await brainRes.json();
            draftsCreated.push({ org_id: org.id, newsletter_type: newsletterType, draft_id: brainData.draft_id });
          } else {
            const errText = await brainRes.text();
            errors.push({ org_id: org.id, newsletter_type: newsletterType, error: errText });
          }
        }
      } catch (orgErr: any) {
        errors.push({ org_id: org.id, error: orgErr.message });
      }
    }

    return new Response(
      JSON.stringify({ drafts_created: draftsCreated, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("[coce-newsletter-ai] Unhandled error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
