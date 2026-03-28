import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";

Deno.serve(async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting daily analytics aggregation...");

    // 1. Fetch counts by status from organizations
    const { data: orgsData, error: orgsError } = await supabaseClient
      .from('organizations')
      .select('status, id');
    
    if (orgsError) throw orgsError;

    const activeOrgsCount = orgsData?.filter((o: any) => o.status === 'active').length || 0;
    const suspendedOrgsCount = orgsData?.filter((o: any) => o.status === 'suspended').length || 0;
    const totalOrgsCount = orgsData?.length || 0;

    // 2. Fetch MRR from organization_subscriptions
    // We join with company_plans to get the price_monthly
    const { data: subData, error: subError } = await supabaseClient
      .from('organization_subscriptions')
      .select(`
        status,
        plan_id,
        company_plans (price_monthly, name)
      `)
      .in('status', ['active', 'trialing']);
    
    if (subError) throw subError;

    // Calculate MRR (Monthly Recurring Revenue)
    // subData will contain plan details for each subscription
    const mrr = subData?.reduce((acc: number, sub: any) => acc + (sub.company_plans?.price_monthly || 0), 0) || 0;

    // 3. Fetch total users
    const { count: totalUsers, error: usersError } = await supabaseClient
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (usersError) throw usersError;

    // 4. Fetch unresolved AI insights
    const { count: unresolvedInsights, error: insightsError } = await supabaseClient
      .from('admin_ai_insights')
      .select('*', { count: 'exact', head: true })
      .is('resolved_at', null);

    if (insightsError) throw insightsError;

    // 5. Calculate Churn Rate (simplified for now: suspended / (active + suspended))
    const churnRate = (activeOrgsCount + suspendedOrgsCount) > 0 
      ? (suspendedOrgsCount / (activeOrgsCount + suspendedOrgsCount)) 
      : 0;

    // 6. Plan Distribution
    const planDistribution: Record<string, number> = {};
    subData?.forEach((sub: any) => {
      const planName = sub.company_plans?.name || 'Unknown';
      planDistribution[planName] = (planDistribution[planName] || 0) + 1;
    });

    const metrics = {
      active_orgs: activeOrgsCount,
      suspended_orgs: suspendedOrgsCount,
      total_orgs: totalOrgsCount,
      total_users: totalUsers || 0,
      mrr: mrr,
      churn_rate: churnRate,
      unresolved_insights: unresolvedInsights || 0,
      plan_distribution: planDistribution,
      timestamp: new Date().toISOString()
    };

    const today = new Date().toISOString().split('T')[0];

    // 7. Upsert into company_analytics
    const { error: upsertError } = await supabaseClient
      .from('company_analytics')
      .upsert({
        date: today,
        metrics: metrics
      }, { onConflict: 'date' });

    if (upsertError) throw upsertError;

    return new Response(
      JSON.stringify({ 
        success: true, 
        date: today,
        metrics: metrics 
      }), 
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Aggregation error:", err);
    return new Response(
      JSON.stringify({ error: err.message }), 
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
