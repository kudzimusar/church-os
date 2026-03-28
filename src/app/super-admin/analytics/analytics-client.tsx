"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Users, DollarSign, Activity, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  change: number;
  label: string;
  icon: any;
  prefix?: string;
  suffix?: string;
}

function KPICard({ title, value, change, label, icon: Icon, prefix = "", suffix = "" }: KPICardProps) {
  const isPositive = change >= 0;
  
  return (
    <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="w-4 h-4 text-slate-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </div>
        <div className="flex items-center mt-1">
          {isPositive ? (
            <ArrowUpRight className="w-4 h-4 mr-1 text-emerald-400" />
          ) : (
            <ArrowDownRight className="w-4 h-4 mr-1 text-rose-400" />
          )}
          <span className={cn(
            "text-xs font-medium",
            isPositive ? "text-emerald-400" : "text-rose-400"
          )}>
            {Math.abs(change).toFixed(1)}%
          </span>
          <span className="ml-1 text-xs text-slate-500">
            vs last period
          </span>
        </div>
        <p className="mt-4 text-xs text-slate-400">{label}</p>
      </CardContent>
    </Card>
  );
}

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#ec4899', '#f59e0b'];

export default function AnalyticsClient({ initialData, kpis }: { initialData: any[], kpis: any }) {
  // Format data for chart
  const chartData = initialData.map(d => ({
    date: new Date(d.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    mrr: d.metrics?.mrr || 0,
    activeOrgs: d.metrics?.active_orgs || 0,
    totalUsers: d.metrics?.total_users || 0,
    churn: (d.metrics?.churn_rate || 0) * 100
  }));

  // Latest plan distribution
  const latestMetrics = initialData[initialData.length - 1]?.metrics || {};
  const planData = Object.entries(latestMetrics.plan_distribution || {}).map(([name, value]) => ({
    name,
    value
  }));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* KPI Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard 
          title="Monthly Recurring Revenue"
          value={kpis.mrr.value}
          change={kpis.mrr.change}
          label="SaaS recurring revenue"
          icon={DollarSign}
          prefix="$"
        />
        <KPICard 
          title="Active Organizations"
          value={kpis.activeOrgs.value}
          change={kpis.activeOrgs.change}
          label="Churches using platform"
          icon={Activity}
        />
        <KPICard 
          title="Total Platform Users"
          value={kpis.totalUsers.value}
          change={kpis.totalUsers.change}
          label="Cumulative member profiles"
          icon={Users}
        />
        <KPICard 
          title="Current Churn Rate"
          value={kpis.churnRate.value.toFixed(1)}
          change={kpis.churnRate.change}
          label="Tenant attrition"
          icon={TrendingDown}
          suffix="%"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* MRR Trend Chart */}
        <Card className="col-span-4 bg-slate-900/40 border-slate-800/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
            <CardDescription>Monthly Recurring Revenue over last 30 days.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: '1px solid #334155',
                    borderRadius: '8px'
                  }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="mrr" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorMrr)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card className="col-span-3 bg-slate-900/40 border-slate-800/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
            <CardDescription>Organizations by product tier.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planData.length > 0 ? planData : [{ name: 'No Data', value: 1 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {planData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                  {planData.length === 0 && <Cell fill="#334155" />}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: '1px solid #334155',
                    borderRadius: '8px'
                  }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-12">
        {/* User Growth */}
        <Card className="col-span-12 lg:col-span-8 bg-slate-900/40 border-slate-800/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Platform User Growth</CardTitle>
            <CardDescription>Total member profiles across all tenants.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                />
                <Tooltip 
                  cursor={{ fill: '#334155', opacity: 0.1 }}
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: '1px solid #334155',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="totalUsers" name="Users" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Churn Analytics */}
        <Card className="col-span-12 lg:col-span-4 bg-slate-900/40 border-slate-800/50 backdrop-blur-xl">
           <CardHeader>
              <CardTitle>Subscription Health</CardTitle>
              <CardDescription>Organizational churn trends.</CardDescription>
           </CardHeader>
           <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                    <XAxis dataKey="date" hide />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                      itemStyle={{ color: '#f43f5e' }}
                    />
                    <Line name="Churn Rate" type="monotone" dataKey="churn" stroke="#f43f5e" strokeWidth={3} dot={false} />
                 </LineChart>
              </ResponsiveContainer>
           </CardContent>
        </Card>
      </div>

      {/* AI Strategy & Intelligence Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-gradient-to-br from-indigo-900/20 to-blue-900/20 border-indigo-500/20 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-400" />
                AI Strategy Insights
              </CardTitle>
              <CardDescription>Performance of platform-wide AI models.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-center">
                   <div className="text-sm text-slate-400">Insights Generated</div>
                   <div className="text-2xl font-bold">1,204</div>
                </div>
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                   <div className="text-sm text-slate-400">Helpfulness Score</div>
                   <div className="text-2xl font-bold">4.8/5</div>
                </div>
             </div>
             <p className="text-sm text-slate-400 italic">
               "Latest cross-tenant modeling suggests that churches using the AI-onboarding blueprint are 40% more likely to reach 'High Engagement' status within the first 60 days."
             </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Strategic Summary</CardTitle>
            <CardDescription>Platform-wide growth indicators.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Average Revenue Per Church (ARPC)</span>
              <span className="font-semibold text-slate-200">${(kpis.mrr.value / (kpis.activeOrgs.value || 1)).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">AI Engagement Factor</span>
              <span className="font-semibold text-emerald-400">+12% MoM</span>
            </div>
            <div className="pt-4 border-t border-slate-800/50">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-400">Trial to Pro Conversion</span>
                <span className="text-slate-200">18.5%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[18.5%]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
