"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  Church, 
  DollarSign, 
  TrendingUp, 
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Bot,
  AlertTriangle,
  BrainCircuit
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import Loading from "./loading";

interface DashboardStat {
  title: string;
  value: string;
  description: string;
  type: string;
}

export default function DashboardClient() {
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // 1. Fetch Total Organizations
        const { count: orgCount } = await supabase
          .from('organizations')
          .select('*', { count: 'exact', head: true });

        // 2. Fetch Total Members (Sum)
        const { data: memberCounts } = await supabase
          .rpc('get_org_member_counts');
        
        const totalUsers = memberCounts?.reduce((acc: number, curr: any) => acc + (curr.member_count || 0), 0) || 0;

        // 3. Fetch Unresolved AI Insights
        const { count: insightCount } = await supabase
          .from('admin_ai_insights')
          .select('*', { count: 'exact', head: true })
          .is('resolved_at', null);

        // 4. Fetch Latest Analytics Row for MRR and Churn
        const { data: latestAnalytics } = await supabase
          .from('company_analytics')
          .select('metrics')
          .order('date', { ascending: false })
          .limit(1)
          .maybeSingle();

        const mrrValue = latestAnalytics?.metrics?.mrr || 0;
        const churnRate = (latestAnalytics?.metrics?.churn_rate || 0) * 100;

        // 5. Fetch Recent Audit Logs
        const { data: logs } = await supabase
          .from('admin_audit_logs')
          .select(`
            *,
            profiles:admin_id (name, email)
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        setStats([
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
        ]);
        setAuditLogs(logs || []);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'nodes': return Church;
      case 'revenue': return DollarSign;
      case 'users': return Users;
      case 'alerts': return BrainCircuit;
      default: return Activity;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'nodes': return { text: "text-blue-400", bg: "bg-blue-400/10" };
      case 'revenue': return { text: "text-emerald-400", bg: "bg-emerald-400/10" };
      case 'users': return { text: "text-indigo-400", bg: "bg-indigo-400/10" };
      case 'alerts': return { text: "text-rose-400", bg: "bg-rose-400/10" };
      default: return { text: "text-slate-400", bg: "bg-slate-400/10" };
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Platform Overview</h1>
          <p className="text-slate-400">Welcome to the Church OS business ops center.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/super-admin/analytics">
            <Button variant="outline" className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl">
              <TrendingUp className="w-4 h-4 mr-2 text-indigo-400" />
              View Analytics
            </Button>
          </Link>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] border-none">
            Add New Church
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = getIcon(stat.type);
          const colors = getColor(stat.type);
          
          return (
            <Card key={stat.title} className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl group hover:border-slate-700/50 transition-all duration-300 rounded-2xl overflow-hidden relative">
              <div className={cn("absolute top-0 right-0 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700", colors.bg)} />
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-slate-400">
                  {stat.title}
                </CardTitle>
                <div className={cn("p-2 rounded-xl", colors.bg, colors.text)}>
                  <Icon className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  {stat.type === 'alerts' && Number(stat.value) > 0 ? (
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                  ) : (
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                  )}
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 bg-slate-900/40 border-slate-800/50 backdrop-blur-xl rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">System Activity</CardTitle>
            <CardDescription className="text-slate-400">Real-time platform operations and audit logs.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {auditLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-500 italic">No recent activity detected.</div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-800/30 transition-colors group">
                    <div className="mt-1 p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:bg-indigo-600/20 group-hover:text-indigo-400 transition-colors">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-white">{log.action?.replace(/_/g, ' ').toUpperCase()}</p>
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{new Date(log.created_at).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs text-slate-400 mb-2">Performed by {log.profiles?.email}</p>
                      <div className="flex items-center gap-2">
                         <span className={cn(
                           "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                           log.action?.includes('suspend') ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                         )}>
                            {log.action?.includes('suspend') ? 'SECURITY' : 'SYSTEM'}
                         </span>
                         <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold border border-slate-700">ORD-{log.id.slice(0, 5).toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Link href="/super-admin/tenants">
              <Button variant="ghost" className="w-full mt-6 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-xl group">
                Review All Tenants
                <ArrowUpRight className="ml-2 w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Health & Status */}
        <div className="space-y-6">
           <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Infrastructure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 {[
                   { label: "Supabase Engine", status: "Healthy" },
                   { label: "Vertex AI Pipeline", status: "Healthy" },
                   { label: "Prophetic Insight Core", status: "Online" }
                 ].map(item => (
                   <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-800/50">
                      <span className="text-sm text-slate-300">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                        <span className="text-xs font-medium text-emerald-400">{item.status}</span>
                      </div>
                   </div>
                 ))}
              </CardContent>
           </Card>

           <Card className="bg-indigo-600/10 border-indigo-500/20 backdrop-blur-xl rounded-2xl">
              <CardContent className="pt-6 pb-6 text-center">
                 <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(79,70,229,0.4)]">
                    <TrendingUp className="w-6 h-6 text-white" />
                 </div>
                 <h3 className="text-white font-bold mb-1">Business Analytics</h3>
                 <p className="text-xs text-indigo-300/70 mb-4 px-4">Tracking MRR growth, user adoption, and historical performance trends.</p>
                 <Link href="/super-admin/analytics">
                  <Button className="w-full bg-white text-indigo-900 hover:bg-slate-100 rounded-xl font-bold transition-all hover:scale-[1.02]">
                      Open BI Dashboard
                  </Button>
                 </Link>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
