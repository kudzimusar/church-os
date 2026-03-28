import { supabaseAdmin } from "@/lib/supabase-admin";
import AnalyticsClient from "./analytics-client";

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  // Fetch last 30 days of analytics from company_analytics table
  const { data: analyticsData, error } = await supabaseAdmin
    .from('company_analytics')
    .select('*')
    .order('date', { ascending: true })
    .limit(30);

  if (error) {
    console.error("Error fetching analytics:", error);
  }

  // Handle empty state gracefully
  const last30DaysData = analyticsData || [];
  const latestData = last30DaysData.length > 0 ? last30DaysData[last30DaysData.length - 1] : null;
  const previousData = last30DaysData.length > 1 ? last30DaysData[last30DaysData.length - 2] : null;

  const currentMetrics = latestData?.metrics || {};
  const prevMetrics = previousData?.metrics || {};

  const calculateChange = (current: number, previous: number) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const kpis = {
    mrr: {
      value: currentMetrics.mrr || 0,
      change: calculateChange(currentMetrics.mrr || 0, prevMetrics.mrr || 0),
    },
    activeOrgs: {
      value: currentMetrics.active_orgs || 0,
      change: calculateChange(currentMetrics.active_orgs || 0, prevMetrics.active_orgs || 0),
    },
    totalUsers: {
      value: currentMetrics.total_users || 0,
      change: calculateChange(currentMetrics.total_users || 0, prevMetrics.total_users || 0),
    },
    churnRate: {
      value: (currentMetrics.churn_rate || 0) * 100,
      change: ((currentMetrics.churn_rate || 0) - (prevMetrics.churn_rate || 0)) * 100,
    }
  };

  return (
    <div className="space-y-8 min-h-screen">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-50">Business Intelligence</h1>
        <p className="text-slate-400">
          Comprehensive performance metrics, revenue growth, and platform-wide engagement trends.
        </p>
      </header>

      {last30DaysData.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[400px] border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
          <p className="text-slate-400 text-lg">No analytics data found yet.</p>
          <p className="text-sm text-slate-500 mt-2">The daily-analytics-aggregator Edge Function must run first.</p>
        </div>
      ) : (
        <AnalyticsClient 
          initialData={last30DaysData} 
          kpis={kpis}
        />
      )}
    </div>
  );
}
