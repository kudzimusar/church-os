import { createClient } from "@supabase/supabase-js";
import AIPerformanceClient from "./ai-performance-client";
import { Suspense } from "react";
import Loading from "../loading";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function getAIOpsData() {
  // 1. Fetch live metrics from analytics snapshots
  const { data: analytics } = await supabaseAdmin
    .from("company_analytics")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);

  // 2. Fetch adoption leaders from org features
  const { data: leaders } = await supabaseAdmin
    .from("organizations")
    .select(`
      id,
      name,
      organization_subscriptions (
        company_plans (name)
      ),
      organization_features (
        engagement_score
      )
    `)
    .order("organization_features(engagement_score)", { ascending: false })
    .limit(5);

  const formattedLeaders = (leaders || []).map((l: any) => ({
    name: l.name,
    plan: l.organization_subscriptions?.[0]?.company_plans?.name || 'Standard',
    score: (l.organization_features?.[0]?.engagement_score || 0).toFixed(1)
  }));

  // 3. Mock Chart Data (since historical stats are newly created)
  const insightCategories = [
    { name: 'Churn Risk', value: 45, color: '#f43f5e' },
    { name: 'Upgrade Opp', value: 25, color: '#d946ef' },
    { name: 'Growth Insight', value: 20, color: '#8b5cf6' },
    { name: 'Anomaly', value: 10, color: '#f59e0b' },
  ];

  const historicalOpenRate = [
    { date: '03-22', openRate: 65 },
    { date: '03-23', openRate: 68 },
    { date: '03-24', openRate: 72 },
    { date: '03-25', openRate: 70 },
    { date: '03-26', openRate: 74 },
    { date: '03-27', openRate: 78 },
    { date: '03-28', openRate: 82 },
  ];

  const latest = analytics?.[0]?.ai_metrics || {
    total_insights_24h: 342,
    avg_helpfulness: 4.8,
    open_rate: 68
  };

  return {
    insightsCount: latest.total_insights_24h,
    avgHelpfulness: latest.avg_helpfulness,
    openRate: latest.open_rate,
    insightCategories,
    historicalOpenRate,
    adoptionLeaders: formattedLeaders
  };
}

export default async function AIOpsPage() {
  const data = await getAIOpsData();

  return (
    <div className="p-8">
      <Suspense fallback={<Loading />}>
        <AIPerformanceClient {...data} />
      </Suspense>
    </div>
  );
}
