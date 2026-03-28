"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Megaphone, Users, CheckCircle2, Circle, Clock } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import Loading from "@/app/super-admin/loading";

export default function BroadcastHistoryClient() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getBroadcastHistory() {
      try {
        const { data: broadcasts } = await supabase
          .from("platform_broadcasts")
          .select(`
            *,
            admin_roles (user_id)
          `)
          .order("created_at", { ascending: false });

        // Fetch read counts for all broadcasts
        const { data: stats } = await supabase
          .from("broadcast_receipts")
          .select("broadcast_id, viewed_at");

        const historyWithStats = broadcasts?.map(bc => {
          const bcStats = stats?.filter(s => s.broadcast_id === bc.id) || [];
          const total = bcStats.length;
          const read = bcStats.filter(s => s.viewed_at).length;
          return {
            ...bc,
            readCount: read,
            totalCount: total,
            openRate: total > 0 ? Math.round((read / total) * 100) : 0
          };
        });

        setHistory(historyWithStats || []);
      } catch (err) {
        console.error("Failed to fetch broadcast history:", err);
      } finally {
        setLoading(false);
      }
    }

    getBroadcastHistory();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
            <Link 
                href="/super-admin/ai-ops/broadcast" 
                className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-400 transition-colors uppercase tracking-widest pl-1 group"
            >
                <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                Back to Compose
            </Link>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                Dispatch History
            </h1>
        </div>
      </div>

      <div className="grid gap-4">
        {history.map((bc) => (
          <Card key={bc.id} className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl rounded-2xl overflow-hidden hover:border-indigo-500/30 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-[10px] uppercase border-indigo-500/20 text-indigo-400 bg-indigo-500/5">
                        {bc.target_type === 'all' ? 'Universal' : bc.target_type === 'plan' ? 'Tier Specific' : 'Grouped'}
                    </Badge>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(bc.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">{bc.title}</h3>
                  <p className="text-slate-400 text-sm line-clamp-1 opacity-70">{bc.message || bc.content}</p>
                </div>

                <div className="flex flex-wrap items-center gap-8 md:px-8 border-l border-slate-800/50">
                    <div className="text-center">
                        <div className="text-2xl font-black text-white">{bc.openRate}%</div>
                        <div className="text-[9px] uppercase font-black text-slate-500 tracking-tighter">Open Rate</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-black text-white">{bc.readCount}</div>
                        <div className="text-[9px] uppercase font-black text-slate-500 tracking-tighter">Read</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-black text-slate-700">/ {bc.target_ids?.length || bc.totalCount}</div>
                        <div className="text-[9px] uppercase font-black text-slate-500 tracking-tighter">Total</div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" className="rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
                        View Details
                    </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {history.length === 0 && (
            <div className="py-20 text-center space-y-4 rounded-3xl border-2 border-dashed border-slate-800/50">
                <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto">
                    <Megaphone className="w-8 h-8 text-slate-700" />
                </div>
                <div className="space-y-1">
                    <p className="text-white font-bold">No broadcasts dispatched yet</p>
                    <p className="text-slate-500 text-sm">Your communication history will appear here once you send an announcement.</p>
                </div>
                <Button asChild className="bg-indigo-600 hover:bg-indigo-500 rounded-xl mt-4">
                    <Link href="/super-admin/ai-ops/broadcast">Compose First Message</Link>
                </Button>
            </div>
        )}
      </div>
    </div>
  );
}
