import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Starting daily AI insight metrics aggregation...");

    // 1. Fetch total insights generated across all orgs (last 24h)
    const { data: insights, error: insightError } = await supabase
      .from("prophetic_insights")
      .select("org_id, insight_type")
      .gte("created_at", new Date(Date.now() - 86400000).toISOString());

    if (insightError) throw insightError;

    // 2. Fetch viewed insights and helpfulness ratings
    const { data: analytics, error: analyticsError } = await supabase
      .from("ai_insight_analytics")
      .select("org_id, helpfulness_rating, viewed_at")
      .gte("created_at", new Date(Date.now() - 86400000).toISOString());

    if (analyticsError) throw analyticsError;

    // 3. Aggregate metrics
    const totalGenerated = insights?.length || 0;
    const totalViewed = analytics?.filter(a => a.viewed_at).length || 0;
    const avgRating = analytics?.length 
      ? analytics.reduce((acc, curr) => acc + (curr.helpfulness_rating || 0), 0) / (analytics.filter(a => a.helpfulness_rating).length || 1)
      : 0;

    const openRate = totalGenerated > 0 ? (totalViewed / totalGenerated) * 100 : 0;

    console.log(`Aggregated: Total=${totalGenerated}, Viewed=${totalViewed}, AvgRating=${avgRating.toFixed(2)}, OpenRate=${openRate.toFixed(2)}%`);

    // 4. Update company_analytics with these AI-specific platform KPIs
    // We'll append metadata to the latest snapshot or create a new entry
    const { data: latestSnapshot, error: snapshotError } = await supabase
      .from("company_analytics")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!snapshotError && latestSnapshot) {
      await supabase
        .from("company_analytics")
        .update({
          ai_metrics: {
            total_insights_24h: totalGenerated,
            avg_helpfulness: avgRating,
            open_rate: openRate,
            aggregated_at: new Date().toISOString()
          }
        })
        .eq("id", latestSnapshot.id);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        metrics: { totalGenerated, totalViewed, avgRating, openRate } 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error aggregating AI metrics:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
