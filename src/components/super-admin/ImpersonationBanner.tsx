"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Brain, Eye, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { refreshAIAnalysis } from "@/app/super-admin/tenants/actions";
import { toast } from "sonner";

export default function ImpersonationBanner() {
  const [impersonator, setImpersonator] = useState<any>(null);
  const [targetOrg, setTargetOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkImpersonation = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.original_user_id) {
        setImpersonator(user.user_metadata.original_user_id);
        
        // Fetch org details for context
        const { data: org } = await supabase
          .from('organizations')
          .select(`
            id,
            name,
            organization_features (engagement_score, churn_probability)
          `)
          .single();
        
        setTargetOrg(org);
      }
      setLoading(false);
    };

    checkImpersonation();
  }, []);

  const handleExit = async () => {
    // Logic to sign back in as admin or clear metadata
    // For now, let's assume we sign out and redirect to admin login
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = async () => {
    if (!targetOrg?.id) return;
    setIsRefreshing(true);
    const result = await refreshAIAnalysis(targetOrg.id);
    if (result.success) {
      toast.success("AI context refreshed for this organization.");
      window.location.reload();
    } else {
      toast.error(result.error);
    }
    setIsRefreshing(false);
  };

  if (loading || !impersonator) return null;

  const churnRisk = (targetOrg?.organization_features?.[0]?.churn_probability || 0) > 0.4 ? 'high' : 'low';

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-indigo-900/90 backdrop-blur-md border-b border-indigo-500/30 px-6 py-3 shadow-2xl animate-in slide-in-from-top duration-500">
      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-500 p-2 rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            <Eye className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-sm">Impersonation Mode Active</span>
              <Badge variant={churnRisk === 'high' ? 'destructive' : 'secondary'} className="text-[10px] h-4 uppercase">
                Churn Risk: {churnRisk}
              </Badge>
            </div>
            <p className="text-indigo-200 text-xs mt-0.5">
              Viewing as <span className="text-white font-medium">{targetOrg?.name || 'Loading organization...'}</span>
            </p>
          </div>
        </div>

        <div className="hidden lg:grid grid-cols-2 gap-x-8 gap-y-1 text-[10px] text-indigo-300 font-mono">
            <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                ENGAGEMENT: {(targetOrg?.organization_features?.[0]?.engagement_score || 0).toFixed(1)}
            </div>
            <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                AI PROVISIONED: YES
            </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-xs font-medium text-white transition-all border border-indigo-500/20 disabled:opacity-50"
          >
            <Brain className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-pulse' : ''}`} />
            Refresh AI
          </button>
          
          <Link
            href={`/super-admin/tenants/${targetOrg?.id}`}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition-all border border-slate-700"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Dashboard
          </Link>

          <div className="w-px h-6 bg-indigo-500/20 mx-1" />

          <button 
            onClick={handleExit}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-all shadow-[0_4px_10px_rgba(225,29,72,0.3)]"
          >
            <X className="w-3.5 h-3.5" />
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}
