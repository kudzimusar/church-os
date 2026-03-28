import { supabaseAdmin } from "@/lib/supabase-admin";
import DashboardClient from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function SuperAdminDashboard() {
  // 1. Fetch Total Organizations
  const { count: orgCount } = await supabaseAdmin
    .from('organizations')
    .select('*', { count: 'exact', head: true });

  // 2. Fetch Total Members (Sum)
  const { data: memberCounts } = await supabaseAdmin
    .rpc('get_org_member_counts');
  
  const totalUsers = memberCounts?.reduce((acc: number, curr: any) => acc + (curr.member_count || 0), 0) || 0;

  // 3. Fetch Unresolved AI Insights
  const { count: insightCount } = await supabaseAdmin
    .from('admin_ai_insights')
    .select('*', { count: 'exact', head: true })
    .is('resolved_at', null);

  // 4. Fetch Latest Analytics Row for MRR and Churn
  const { data: latestAnalytics } = await supabaseAdmin
    .from('company_analytics')
    .select('metrics')
    .order('date', { ascending: false })
    .limit(1)
    .single();

  const mrrValue = latestAnalytics?.metrics?.mrr || 0;
  const churnRate = (latestAnalytics?.metrics?.churn_rate || 0) * 100;

  // 5. Fetch Recent Audit Logs
  const { data: auditLogs } = await supabaseAdmin
    .from('admin_audit_logs')
    .select(`
      *,
      profiles:admin_id (name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  const stats = [
    {
      title: "Total Churches",
      value: (orgCount || 0).toString(),
      description: "Active platform nodes",
      type: "nodes"
    },
    {
      title: "Monthly Revenue",
      value: `$${mrrValue.toLocaleString()}`,
      description: `${churnRate.toFixed(1)}% churn rate`,
      type: "revenue"
    },
    {
      title: "Global Users",
      value: totalUsers.toLocaleString(),
      description: "Across all tenants",
      type: "users"
    },
    {
      title: "AI Alerts",
      value: (insightCount || 0).toString(),
      description: "Unresolved insights",
      type: "alerts"
    },
  ];

  return (
    <DashboardClient 
      stats={stats} 
      auditLogs={auditLogs || []} 
    />
  );
}
