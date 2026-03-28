"use client";

import { useState } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import { 
  TrendingUp, 
  BrainCircuit, 
  Zap, 
  Star, 
  Eye, 
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Activity,
  Bot
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: any;
  color: string;
  description: string;
}

function MetricCard({ title, value, change, icon: Icon, color, description }: MetricCardProps) {
  const isPositive = change >= 0;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl rounded-2xl border-l-[4px] cursor-help transition-all hover:bg-slate-900/60" style={{ borderLeftColor: color }}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                  <Icon className="w-4 h-4" style={{ color }} />
                  {title}
                </CardTitle>
                <div className={cn(
                  "flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                  isPositive ? "text-emerald-400 bg-emerald-400/10" : "text-rose-400 bg-rose-400/10"
                )}>
                  {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(change)}%
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">{value}</div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-relaxed">
                {description}
              </p>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent className="bg-slate-950 border-slate-800 text-slate-300 text-xs max-w-[200px]">
          {description}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface Props {
  insightsCount: number;
  avgHelpfulness: number;
  openRate: number;
  insightCategories: any[];
  historicalOpenRate: any[];
  adoptionLeaders: any[];
}

export default function AIPerformanceClient({ 
  insightsCount, 
  avgHelpfulness, 
  openRate,
  insightCategories,
  historicalOpenRate,
  adoptionLeaders
}: Props) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleReaggregate = async () => {
    setIsRefreshing(true);
    const { toast } = await import("sonner");
    const { forceReaggregateAnalytics } = await import("./actions");

    const result = await forceReaggregateAnalytics();
    if (result.success) {
      toast.success("Aggregation process started successfully.");
    } else {
      toast.error("Failed to start aggregation: " + result.error);
    }
    setIsRefreshing(false);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2 font-manrope">AI Ops Dashboard</h1>
          <p className="text-slate-400">Monitoring platform-wide AI performance and effectiveness.</p>
        </div>
        <div className="flex gap-3">
           <Link href="/super-admin/ai-ops/logs">
             <Button variant="outline" className="bg-slate-900 border-slate-800 text-slate-300 rounded-xl hover:bg-slate-800">
                <MessageSquare className="w-4 h-4 mr-2 text-amber-500" />
                Interaction Logs
             </Button>
           </Link>
           <Button 
            variant="outline" 
            className="bg-slate-900 border-slate-800 text-slate-300 rounded-xl hover:bg-slate-800 disabled:opacity-50"
            onClick={handleReaggregate}
            disabled={isRefreshing}
           >
             {isRefreshing ? "Processing..." : "Force Re-Aggregation"}
           </Button>
           <Link href="/super-admin/ai-ops/broadcast">
             <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)]">
                Create Broadcast
             </Button>
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Insights"
          value={insightsCount}
          change={12}
          icon={BrainCircuit}
          color="#818cf8"
          description="Total insights generated for all churches (last 30 days)"
        />
        <MetricCard 
          title="Open Rate"
          value={`${openRate.toFixed(1)}%`}
          change={5.4}
          icon={Eye}
          color="#3b82f6"
          description="% of insights actually viewed by pastoral teams"
        />
        <MetricCard 
          title="Avg Helpfulness"
          value={avgHelpfulness.toFixed(1)}
          change={2.1}
          icon={Star}
          color="#f59e0b"
          description="Mean 1-5 rating provided by church administrators"
        />
        <MetricCard 
          title="AI ROI Score"
          value="8.4"
          change={3.2}
          icon={Zap}
          color="#10b981"
          description="Weighted score based on retention and growth correlation"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 bg-slate-900/40 border-slate-800/50 backdrop-blur-xl rounded-2xl">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg font-semibold text-white">Insight Engagement Trends</CardTitle>
                <CardDescription className="text-slate-400">Platform-wide open rates over time.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">7 Days</Badge>
                <Badge variant="ghost" className="text-slate-500">30 Days</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[350px] pt-4">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={historicalOpenRate}>
                 <defs>
                   <linearGradient id="colorOpen" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                 <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                 <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} unit="%" />
                 <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                 />
                 <Area type="monotone" dataKey="openRate" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorOpen)" />
               </AreaChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Insight Categories</CardTitle>
            <CardDescription className="text-slate-400">Frequency of insight type distribution.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] pt-0">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={insightCategories}
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {insightCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                  />
                </PieChart>
             </ResponsiveContainer>
             <div className="grid grid-cols-2 gap-4 mt-4">
               {insightCategories.map((cat, i) => (
                 <div key={i} className="flex items-center gap-2">
                   <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                   <span className="text-[10px] font-medium text-slate-300 uppercase tracking-widest">{cat.name}</span>
                   <span className="text-[10px] text-slate-500 ml-auto">{cat.value}%</span>
                 </div>
               ))}
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">AI Strategy Adoption Leaders</CardTitle>
            <CardDescription className="text-slate-400">Churches with the highest AI engagement scores.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
               {adoptionLeaders.map((org, i) => (
                 <div key={i} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-800/30 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                        {org.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{org.name}</p>
                        <p className="text-xs text-slate-500 uppercase tracking-widest">{org.plan}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <div className="text-lg font-bold text-white mb-0.5">{org.score}</div>
                       <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[10px] font-bold">TOP PERFORMANCE</Badge>
                    </div>
                 </div>
               ))}
             </div>
             <Button variant="ghost" className="w-full mt-4 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-xl">
               View All Church Adoption Data
             </Button>
          </CardContent>
        </Card>

        <Card className="bg-indigo-600/5 border-indigo-500/20 backdrop-blur-xl rounded-2xl shadow-xl shadow-blue-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                <Bot className="w-5 h-5" />
              </div>
              <CardTitle className="text-lg font-semibold text-white">System Broadcast Engine</CardTitle>
            </div>
            <CardDescription className="text-blue-300/60 mt-1">Communicate directly with pastoral teams and administrators.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                   <h4 className="text-sm font-medium text-white flex items-center gap-2">
                     <Activity className="w-4 h-4 text-emerald-400" />
                     Broadcast Availability
                   </h4>
                   <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[10px]">99.9% UPTIME</Badge>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                   Your team can now send system-wide alerts for maintenance, new AI model releases, or general pastoral encouragement directly to church dashboards.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2">
                   <div className="text-center p-3 rounded-xl bg-slate-800/50">
                      <div className="text-xs font-bold text-white mb-1">0</div>
                      <div className="text-[10px] text-slate-500 uppercase font-mono">Sent Today</div>
                   </div>
                   <div className="text-center p-3 rounded-xl bg-slate-800/50">
                      <div className="text-xs font-bold text-white mb-1">0</div>
                      <div className="text-[10px] text-slate-500 uppercase font-mono">Pending</div>
                   </div>
                </div>
             </div>
             <Link href="/super-admin/ai-ops/broadcast" className="block">
               <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)]">
                  Launch Broadcast Setup
                  <ChevronRight className="w-4 h-4 ml-2" />
               </Button>
             </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
