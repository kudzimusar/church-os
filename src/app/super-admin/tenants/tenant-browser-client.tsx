"use client";

import { useState, useMemo } from "react";
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  ChevronDown, 
  ExternalLink, 
  MoreVertical,
  Activity,
  ShieldAlert,
  Calendar,
  Users,
  AlertTriangle,
  BrainCircuit,
  TrendingUp,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Tenant {
  id: string;
  name: string;
  status: string;
  plan: string;
  planStatus: string;
  memberCount: number;
  createdAt: string;
  lastActive: string | null;
  aiInsights: any[];
  topPriority: 'critical' | 'high' | 'medium' | 'low' | null;
}

interface Props {
  initialTenants: Tenant[];
}

export default function TenantBrowserClient({ initialTenants }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [onlyNeedsAttention, setOnlyNeedsAttention] = useState<boolean>(false);

  const filteredTenants = useMemo(() => {
    return initialTenants.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      const matchesPlan = planFilter === "all" || t.plan === planFilter;
      const matchesAttention = !onlyNeedsAttention || (t.topPriority === 'critical' || t.topPriority === 'high');
      return matchesSearch && matchesStatus && matchesPlan && matchesAttention;
    });
  }, [initialTenants, search, statusFilter, planFilter, onlyNeedsAttention]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-2.5 py-0.5 rounded-full font-semibold">Active</Badge>;
      case 'suspended':
        return <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 px-2.5 py-0.5 rounded-full font-semibold">Suspended</Badge>;
      case 'trial_expired':
        return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 px-2.5 py-0.5 rounded-full font-semibold">Trial Expired</Badge>;
      default:
        return <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20 px-2.5 py-0.5 rounded-full font-semibold">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Search churches by name..." 
            className="pl-10 bg-slate-900/50 border-slate-800 focus:border-indigo-500/50 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-slate-900/50 border-slate-800 text-slate-300 rounded-xl flex gap-2">
                <Filter className="w-4 h-4" />
                Status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-slate-900 border-slate-800 text-slate-300">
              <DropdownMenuItem onClick={() => setStatusFilter("all")}>All Statuses</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("active")}>Active</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("suspended")}>Suspended</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("trial_expired")}>Trial Expired</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-slate-900/50 border-slate-800 text-slate-300 rounded-xl flex gap-2">
                Plan: {planFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-slate-900 border-slate-800 text-slate-300">
              <DropdownMenuItem onClick={() => setPlanFilter("all")}>All Plans</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPlanFilter("Standard")}>Standard</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPlanFilter("Premium")}>Premium</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPlanFilter("Free")}>Free</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant={onlyNeedsAttention ? "default" : "outline"} 
            className={cn(
              "rounded-xl gap-2",
              onlyNeedsAttention 
                ? "bg-rose-600 hover:bg-rose-700 text-white border-none shadow-[0_0_15px_rgba(225,29,72,0.3)]" 
                : "bg-slate-900/50 border-slate-800 text-slate-300"
            )}
            onClick={() => setOnlyNeedsAttention(!onlyNeedsAttention)}
          >
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            Needs Attention
          </Button>
        </div>
      </div>

      {/* Tenants Table */}
      <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/50 bg-slate-900/20">
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Church Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Insight</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Members</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Created Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">
                    No churches found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((tenant) => (
                  <tr key={tenant.id} className="group hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                          {tenant.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{tenant.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono lowercase">{tenant.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {tenant.topPriority ? (
                        <div className="flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "font-bold border-none flex gap-1 items-center px-2 py-0.5 rounded-md cursor-help",
                                  tenant.topPriority === 'critical' 
                                    ? "bg-rose-500/20 text-rose-400" 
                                    : tenant.topPriority === 'high'
                                      ? "bg-amber-500/20 text-amber-400"
                                      : "bg-indigo-500/20 text-indigo-400"
                                )}
                              >
                                {tenant.topPriority === 'critical' && <ShieldAlert className="w-3 h-3" />}
                                {tenant.topPriority === 'high' && <AlertTriangle className="w-3 h-3" />}
                                {tenant.topPriority === 'medium' && <BrainCircuit className="w-3 h-3" />}
                                {tenant.topPriority.toUpperCase()}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-[200px]">
                                {tenant.topPriority === 'critical' && "Immediate action required. High churn risk or system anomaly detected."}
                                {tenant.topPriority === 'high' && "Requires attention soon. Significant behavioral shift observed."}
                                {tenant.topPriority === 'medium' && "Growth or refinement opportunity identified by AI co-pilot."}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                          <span className="text-[11px] text-slate-400 line-clamp-1 max-w-[120px]">
                            {tenant.aiInsights[0]?.message}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <BrainCircuit className="w-3.5 h-3.5 opacity-30 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>System healthy. No urgent AI insights for this tenant.</p>
                            </TooltipContent>
                          </Tooltip>
                          <span className="text-[11px] italic">Healthy</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(tenant.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-indigo-500/20 text-indigo-300 font-medium">
                          {tenant.plan}
                        </Badge>
                        {tenant.planStatus === 'active' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-sm text-slate-300 font-medium">{tenant.memberCount}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(tenant.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-300 w-48">
                          <DropdownMenuLabel>Tenant Actions</DropdownMenuLabel>
                          <DropdownMenuItem className="flex gap-2">
                            <ExternalLink className="w-4 h-4" />
                            View Portal
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex gap-2">
                            <Activity className="w-4 h-4" />
                            Analytics
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-800" />
                          <DropdownMenuItem className="flex gap-2 text-rose-400 focus:text-rose-400 focus:bg-rose-400/10">
                            <ShieldAlert className="w-4 h-4" />
                            Suspend Access
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
