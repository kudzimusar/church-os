/// <reference lib="deno.ns" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

Deno.serve(async (req: Request) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request for optional org_id
    let targetOrgId: string | null = null;
    try {
      if (req.method === 'POST') {
        const body = await req.json();
        targetOrgId = body.org_id || null;
      }
    } catch (e) {
      // Body parsing might fail if no body provided
    }

    console.log(targetOrgId ? `Refreshing AI for org: ${targetOrgId}` : "Starting full AI Decision Engine sweep...");

    // 1. Fetch organizations and features
    let query = supabaseClient
      .from('organizations')
      .select(`
        id, 
        name, 
        status,
        organization_features (*),
        organization_subscriptions (
          status,
          current_period_end,
          company_plans (*)
        ),
        ai_feedback (was_helpful)
      `) as any;

    if (targetOrgId) {
      query = query.eq('id', targetOrgId);
    }

    const { data: orgs, error: fetchError } = await query;

    if (fetchError) throw fetchError;

    const insights: any[] = [];

    for (const org of orgs || []) {
      const features = org.organization_features;
      const sub = org.organization_subscriptions?.[0];
      const plan = sub?.company_plans;
      const feedback = org.ai_feedback || [];

      // A. Churn Prediction Analysis
      if (features?.churn_probability > 0.7) {
        insights.push({
          org_id: org.id,
          insight_type: 'churn_risk',
          priority: 'critical',
          message: `${org.name} has a critical churn risk of ${Math.round(features.churn_probability * 100)}%.`,
          suggested_action: 'Send prioritized retention email or discount offer.',
          metadata: { probability: features.churn_probability, engagement: features.engagement_score }
        });
      } else if (features?.churn_probability > 0.4) {
        insights.push({
          org_id: org.id,
          insight_type: 'churn_risk',
          priority: 'high',
          message: `${org.name} churn probability is increasing (${Math.round(features.churn_probability * 100)}%).`,
          suggested_action: 'Review activity logs and consider support outreach.',
          metadata: { probability: features.churn_probability, engagement: features.engagement_score }
        });
      }

      // B. Anomaly Detection (Engagement Drop)
      if (features?.engagement_score < 2.0) {
        insights.push({
          org_id: org.id,
          insight_type: 'anomaly',
          priority: 'high',
          message: `Engagement for ${org.name} has dropped below threshold (score: ${features.engagement_score.toFixed(1)}).`,
          suggested_action: 'Check if daily devotions are being published correctly.',
          metadata: { current_engagement: features.engagement_score }
        });
      }

      // C. Upgrade Opportunities
      if (plan && features?.active_member_count >= (plan.max_members * 0.9)) {
        insights.push({
          org_id: org.id,
          insight_type: 'upgrade_suggestion',
          priority: 'medium',
          message: `${org.name} is at 90% capacity for the ${plan.name} plan.`,
          suggested_action: 'Contact client about the next subscription tier.',
          metadata: { capacity: features.active_member_count, limit: plan.max_members }
        });
      }

      // D. AI Health (Feedback Monitoring)
      const lowHelpfulCount = feedback.filter((f: any) => f.was_helpful === false).length;
      if (feedback.length > 5 && (lowHelpfulCount / feedback.length) > 0.4) {
        insights.push({
          org_id: org.id,
          insight_type: 'engagement',
          priority: 'medium',
          message: `${org.name} has high negative AI feedback (${Math.round((lowHelpfulCount / feedback.length) * 100)}% unhelpful).`,
          suggested_action: 'Refine prophetic intelligence model for this organization context.',
          metadata: { unhelpful_rate: lowHelpfulCount / feedback.length }
        });
      }
    }

    // 2. Clear old non-resolved insights and insert new ones
    if (insights.length > 0) {
      const orgIds = [...new Set(insights.map(i => i.org_id))];
      await supabaseClient
        .from('admin_ai_insights')
        .delete()
        .in('org_id', orgIds)
        .is('resolved_at', null);

      const { error: insertError } = await supabaseClient
        .from('admin_ai_insights')
        .insert(insights);

      if (insertError) throw insertError;

      // 3. Trigger broadcasts for critical priority insights
      const criticalInsights = insights.filter(i => i.priority === 'critical');
      for (const ci of criticalInsights) {
        // Create a broadcast for this specific church
        const { data: bc } = await supabaseClient
          .from('platform_broadcasts')
          .insert({
            title: `Critical Alert: ${ci.insight_type.replace('_', ' ').toUpperCase()}`,
            message: `The AI Decision Engine has flagged a critical update for your church: ${ci.message} Recommended action: ${ci.suggested_action}`,
            target_type: 'selected',
            target_metadata: { org_ids: [ci.org_id], insight_id: ci.id },
            scheduled_at: new Date().toISOString()
          })
          .select()
          .single();

        if (bc) {
          // Trigger immediate dispatch info
          await supabaseClient
            .from('broadcast_receipts')
            .insert({
              broadcast_id: bc.id,
              org_id: ci.org_id,
              is_read: false
            });
          
          await supabaseClient
            .from('platform_broadcasts')
            .update({ dispatched_at: new Date().toISOString(), recipient_count: 1 })
            .eq('id', bc.id);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed_orgs: orgs?.length || 0,
        insights_count: insights.length,
        insights
      }), 
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("AI Decision Engine error:", err);
    return new Response(
      JSON.stringify({ error: err.message }), 
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
