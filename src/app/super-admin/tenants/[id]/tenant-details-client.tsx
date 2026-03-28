"use client";

import { useState } from "react";
import { 
  Users, 
  DollarSign, 
  Activity, 
  ShieldAlert, 
  ShieldCheck, 
  ArrowLeft,
  Calendar,
  CreditCard,
  History,
  AlertTriangle,
  Zap,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Ban,
  CheckCircle2,
  Clock,
  BrainCircuit,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { updateOrgStatus, updateOrgSubscription, refreshAIAnalysis, impersonateUser } from "@/app/super-admin/tenants/actions";
import { Loader2, Brain, Eye, Mail } from "lucide-react";

interface Props {
  org: any;
  memberCount: number;
  auditLogs: any[];
  plans: any[];
}

export default function TenantDetailsClient({ org, memberCount, auditLogs, plans }: Props) {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingSub, setIsUpdatingSub] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(org.organization_subscriptions?.[0]?.plan_id || "");
  const [selectedSubStatus, setSelectedSubStatus] = useState(org.organization_subscriptions?.[0]?.status || "active");

  const sub = org.organization_subscriptions?.[0];
  const plan = sub?.company_plans;
  const status = org.status || 'active';

  const handleStatusToggle = async () => {
    try {
      setIsUpdatingStatus(true);
      const newStatus = status === 'active' ? 'suspended' : 'active';
      const result = await updateOrgStatus(org.id, newStatus);
      if (result.success) {
        toast.success(`Organization ${newStatus} successfully.`);
        window.location.reload();
      } else {
        toast.error(`Error: ${result.error}`);
      }
    } catch (err) {
      toast.error(`Critical Error updating status.`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSubUpdate = async () => {
    try {
      setIsUpdatingSub(true);
      const result = await updateOrgSubscription(org.id, {
        planId: selectedPlanId,
        status: selectedSubStatus
      });
      if (result.success) {
        toast.success(`Subscription updated manually.`);
        window.location.reload();
      } else {
        toast.error(`Error: ${result.error}`);
      }
    } finally {
      setIsUpdatingSub(false);
    }
  };

  const [isRefreshingAI, setIsRefreshingAI] = useState(false);
  const handleAIRefresh = async () => {
    try {
      setIsRefreshingAI(true);
      const result = await refreshAIAnalysis(org.id);
      if (result.success) {
        toast.success(`AI analysis refreshed manually.`);
        window.location.reload();
      } else {
        toast.error(`AI Refresh Error: ${result.error}`);
      }
    } catch (err: any) {
      toast.error(`Failed to trigger AI refresh.`);
    } finally {
      setIsRefreshingAI(false);
    }
  };

  const [isImpersonating, setIsImpersonating] = useState(false);
  const handleImpersonate = async () => {
    try {
      setIsImpersonating(true);
      // We'll impersonate the organization owner (first admin found)
      // For now, we'll just use a placeholder if no admins are returned in the mock
      // In a real app, we fetch the owner's user_id
      const result = await impersonateUser(org.id, org.id); // Placeholder logic
      if (result.success) {
        toast.success(`Entering impersonation mode...`);
        window.location.href = "/"; // Redirect to app home
      } else {
        toast.error(`Impersonation Error: ${result.error}`);
      }
    } finally {
      setIsImpersonating(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link href="/super-admin/tenants">
            <Button variant="ghost" size="icon" className="rounded-xl border border-slate-800 text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-white tracking-tight">{org.name}</h1>
              {status === 'active' ? (
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-2.5 py-0.5 rounded-full font-semibold">Live</Badge>
              ) : (
                <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 px-2.5 py-0.5 rounded-full font-semibold">Suspended</Badge>
              )}
            </div>
            <p className="text-slate-400 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Created on {new Date(org.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-slate-900 border-slate-800 text-slate-300 rounded-xl hover:bg-slate-800">
             <ExternalLink className="w-4 h-4 mr-2" />
             Impersonate Owner
          </Button>
          <Button 
            variant="destructive" 
            className={`rounded-xl px-6 shadow-xl shadow-rose-600/10 ${status === 'active' ? 'bg-rose-600' : 'bg-emerald-600'}`}
            onClick={handleStatusToggle}
            disabled={isUpdatingStatus}
          >
            {status === 'active' ? (
              <><Ban className="w-4 h-4 mr-2" /> Suspend Business</>
            ) : (
              <><CheckCircle2 className="w-4 h-4 mr-2" /> Activate Business</>
            )}
          </Button>
        </div>
      </div>

      {/* Internal Org ID & Subtitle */}
      <div className="flex flex-wrap gap-2 text-[10px] uppercase font-mono tracking-widest text-slate-500">
          <span>Org_ID: {org.id}</span>
          <span className="text-slate-700">•</span>
          <span>Stripe_Cust: {sub?.stripe_customer_id || 'manual_override'}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              Active Members
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-3xl font-bold text-white">{memberCount}</div>
             <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                No change from last week
             </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Lifetime Value
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-3xl font-bold text-white">$0.00</div>
             <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-indigo-400" />
                Beta Pricing Applied
             </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              AI Token Burn
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-3xl font-bold text-white">0</div>
             <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-rose-400" />
                0% of 10k quota
             </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl rounded-2xl border-indigo-500/20 shadow-xl shadow-indigo-600/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-400" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold text-indigo-100">{plan?.name || 'No Active Plan'}</div>
             <p className="text-xs text-indigo-300/60 mt-1 flex items-center gap-1">
                Expires: {sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : 'N/A'}
             </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            {/* AI Decision Co-pilot */}
            <Card className="bg-indigo-600/5 border-indigo-500/20 backdrop-blur-xl rounded-2xl shadow-xl shadow-indigo-500/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                      <BrainCircuit className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                        AI Decision Co-pilot
                        <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30 text-[10px] uppercase tracking-wider">Predictive</Badge>
                      </CardTitle>
                      <CardDescription className="text-slate-400">Operational recommendations generated by the decision engine.</CardDescription>
                    </div>
                  </div>
                  <Sparkles className="w-5 h-5 text-indigo-400/50 animate-pulse" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {(org.admin_ai_insights || []).length === 0 ? (
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-800/20 flex items-center gap-3 text-slate-500 italic text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500/50" />
                    No urgent operational insights. This tenant is currently healthy.
                  </div>
                ) : (
                  (org.admin_ai_insights as any[]).map((insight) => (
                    <div key={insight.id} className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                            insight.priority === 'critical' ? "bg-rose-500 text-white" :
                            insight.priority === 'high' ? "bg-amber-500 text-black" :
                            "bg-indigo-500 text-white"
                          )}>
                            {insight.priority}
                          </Badge>
                          <span className="text-white font-semibold text-sm capitalize">{insight.insight_type.replace('_', ' ')}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">{new Date(insight.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-300 text-sm mb-3">{insight.message}</p>
                      {insight.suggested_action && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/50 border border-slate-800">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-xs text-indigo-300 font-medium">Recommended: {insight.suggested_action}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
              <CardFooter className="pt-0">
                 <Button 
                    variant="ghost" 
                    className="w-full text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 border border-indigo-500/10 rounded-xl"
                    onClick={handleAIRefresh}
                    disabled={isRefreshingAI}
                 >
                   {isRefreshingAI ? (
                     <><Loader2 className="w-3 h-3 mr-2 animate-spin" /> Refreshing Analysis...</>
                   ) : (
                     <><Brain className="w-3 h-3 mr-2" /> Refresh AI Analysis</>
                   )}
                 </Button>
              </CardFooter>
            </Card>

            {/* Detailed Info Card */}
            <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">Platform Health</CardTitle>
                <CardDescription className="text-slate-400">Insight into how this church is using the OS.</CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1">
                            Engagement Score
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Activity className="w-3 h-3 cursor-help opacity-40" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-[180px]">Calculated based on daily devotion activity, member growth, and AI interaction frequency over the last 30 days.</p>
                              </TooltipContent>
                            </Tooltip>
                          </label>
                          <div className="flex items-center justify-between">
                              <span className="text-2xl font-bold text-white">{org.organization_features?.engagement_score?.toFixed(1) || '0.0'}</span>
                              <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-indigo-500" 
                                    style={{ width: `${(org.organization_features?.engagement_score || 0) * 10}%` }} 
                                  />
                              </div>
                          </div>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1">
                            Churn Risk
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertTriangle className="w-3 h-3 cursor-help opacity-40" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-[180px]">Predictive probability of this tenant canceling their subscription, based on usage decline and billing history.</p>
                              </TooltipContent>
                            </Tooltip>
                          </label>
                          <div className="flex items-center justify-between">
                              <span className={`text-2xl font-bold ${org.organization_features?.churn_probability > 0.5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {((org.organization_features?.churn_probability || 0) * 100).toFixed(0)}%
                              </span>
                              <Badge className={org.organization_features?.churn_probability > 0.5 ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}>
                                {org.organization_features?.churn_probability > 0.5 ? 'High Risk' : 'Healthy'}
                              </Badge>
                          </div>
                      </div>
                  </div>
              </CardContent>
            </Card>

            {/* Audit Log Card */}
            <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                    <History className="w-5 h-5 text-slate-400" />
                    Admin Action History
                  </CardTitle>
                  <CardDescription className="text-slate-400">Audit trail of sensitive changes made to this tenant.</CardDescription>
                </div>
                <Button variant="ghost" className="text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10">Full Export</Button>
              </CardHeader>
              <CardContent>
                 <div className="space-y-4">
                    {auditLogs.length === 0 ? (
                      <p className="text-sm text-slate-500 italic py-4">No audit logs recorded yet.</p>
                    ) : (
                      auditLogs.map((log) => (
                        <div key={log.id} className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-800/30 transition-colors group">
                           <div className="mt-1 p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:bg-indigo-600/20 group-hover:text-indigo-400 transition-colors">
                              <Activity className="w-4 h-4" />
                           </div>
                           <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-medium text-white">{log.action.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</p>
                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{new Date(log.created_at).toLocaleString()}</span>
                              </div>
                              <p className="text-xs text-slate-400 mb-2">Performed by {log.profiles?.email}</p>
                              <div className="flex items-center gap-2">
                                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-indigo-400 text-[10px] font-bold border border-slate-700">METADATA LOADED</span>
                                  )}
                              </div>
                           </div>
                        </div>
                      ))
                    )}
                 </div>
              </CardContent>
            </Card>
         </div>

         <div className="space-y-8">
            <Card className="bg-indigo-600/10 border-indigo-500/20 backdrop-blur-xl rounded-2xl">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-indigo-400" />
                        Billing & Sub
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Plan</span>
                            <span className="text-white font-semibold">{plan?.name || 'Manual Beta'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Monthly Cost</span>
                            <span className="text-white font-semibold">${plan?.price_monthly || 0}/mo</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Next Invoice</span>
                            <span className="text-white font-semibold">{sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : 'Manual'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Subscription Status</span>
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-none">{sub?.status || 'Active'}</Badge>
                        </div>
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] border-none">
                            Manually Override Plan
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-900 border-slate-800 text-slate-300">
                        <DialogHeader>
                          <DialogTitle className="text-white">Subscription Force Update</DialogTitle>
                          <DialogDescription className="text-slate-400">
                            You are about to manually override the subscription of this tenant. This will bypass Stripe billing logic and is for administrative priority only.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Target Plan</label>
                                <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                                    <SelectTrigger className="bg-slate-800 border-slate-700 rounded-xl">
                                        <SelectValue placeholder="Select Plan" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700 text-slate-300">
                                        {plans.map((p) => (
                                          <SelectItem key={p.id} value={p.id}>{p.name} - ${p.price_monthly}/mo</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Status Override</label>
                                <Select value={selectedSubStatus} onValueChange={setSelectedSubStatus}>
                                    <SelectTrigger className="bg-slate-800 border-slate-700 rounded-xl">
                                        <SelectValue placeholder="Set Status" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700 text-slate-300">
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="trialing">Trialing</SelectItem>
                                        <SelectItem value="past_due">Past Due / Delinquent</SelectItem>
                                        <SelectItem value="canceled">Canceled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                            onClick={handleSubUpdate}
                            disabled={isUpdatingSub}
                          >
                            {isUpdatingSub ? "Updating..." : "Confirm Override"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>

            <Card className="bg-slate-900/40 border-indigo-500/10 backdrop-blur-xl rounded-2xl border-2">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-indigo-400" />
                        High-Touch Support
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 mb-2">
                        <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider mb-2">Troubleshooting Tools</p>
                        <div className="space-y-2">
                            <Button 
                                onClick={handleImpersonate}
                                disabled={isImpersonating}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 text-xs justify-start px-4"
                            >
                                {isImpersonating ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Eye className="w-3.5 h-3.5 mr-2" />}
                                Impersonate Tenant Leader
                            </Button>
                            <Button 
                                variant="outline"
                                className="w-full border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10 rounded-xl text-xs justify-start px-4"
                            >
                                <Mail className="w-3.5 h-3.5 mr-2" />
                                Send Retention Email
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-rose-500/5 border-rose-500/10 rounded-2xl">
                <CardHeader>
                    <CardTitle className="text-sm font-semibold text-rose-400 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Danger Zone
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-[10px] text-slate-500">Actions taken here will immediately affect church operations and member access.</p>
                    <Button variant="outline" className="w-full border-rose-500/20 text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs">
                        Purge All Data (Permanent)
                    </Button>
                </CardContent>
            </Card>
         </div>
      </div>
    </div>
  );
}
