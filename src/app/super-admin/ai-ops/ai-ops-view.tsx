"use client";

import { useEffect, useState } from "react";
import AIPerformanceClient from "./ai-performance-client";
import Loading from "../loading";
import { supabase } from "@/lib/supabase";

export default function AIOpsView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAIOpsData() {
      try {
        // 1. Fetch live metrics from analytics snapshots
        const { data: analytics } = await supabase
          .from("company_analytics")
          .select("*")
          .order("date", { ascending: false })
          .limit(1);

        // 2. Fetch adoption leaders from org features
        const { data: leaders } = await supabase
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
          .order("organization_features(engagement_score)", { ascending: false, foreignTable: "organization_features" })
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

        const latest = analytics?.[0]?.metrics || {
          total_insights: 342,
          avg_helpfulness: 4.8,
          open_rate: 68
        };

        setData({
          insightsCount: latest.total_insights || 0,
          avgHelpfulness: latest.avg_helpfulness || 0,
          openRate: latest.open_rate || 0,
          insightCategories,
          historicalOpenRate,
          adoptionLeaders: formattedLeaders
        });
      } catch (err) {
        console.error("Failed to fetch AI Ops data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAIOpsData();
  }, []);

  if (loading) return <Loading />;
  if (!data) return <div className="p-8 text-white">Failed to load statistics.</div>;

  return (
    <div className="p-8">
      <AIPerformanceClient {...data} />
    </div>
  );
}
