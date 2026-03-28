"use client";

import { useEffect, useState } from "react";
import BroadcastForm from "@/components/super-admin/BroadcastForm";
import Loading from "../../loading";
import { ArrowLeft, Megaphone } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export default function BroadcastView() {
  const [context, setContext] = useState<{ plans: any[], orgs: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBroadcastContext() {
      try {
        const { data: plans } = await supabase
          .from("company_plans")
          .select("*")
          .order("price_monthly", { ascending: true });

        const { data: orgs } = await supabase
          .from("organizations")
          .select("id, name")
          .eq("status", "active")
          .order("name", { ascending: true });

        setContext({ 
          plans: plans || [], 
          orgs: orgs || [] 
        });
      } catch (err) {
        console.error("Failed to fetch broadcast context:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchBroadcastContext();
  }, []);

  if (loading) return <Loading />;
  if (!context) return <div className="p-8 text-white">Failed to load broadcast context.</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
            <Link 
                href="/super-admin/ai-ops" 
                className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-400 transition-colors uppercase tracking-widest pl-1 group"
            >
                <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                Back to AI Ops
            </Link>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                System Broadcast
            </h1>
        </div>

        <Button asChild variant="ghost" className="text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-xl">
           <Link href="/super-admin/ai-ops/broadcast/history" className="flex items-center gap-2">
              <Megaphone className="w-4 h-4" />
              View Dispatch History
           </Link>
        </Button>
      </div>

      <BroadcastForm {...context} />
    </div>
  );
}
