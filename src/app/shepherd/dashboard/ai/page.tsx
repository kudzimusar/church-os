"use client";
import { useEffect, useState } from "react";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronDown, CheckCircle2, RefreshCw, AlertTriangle, Info } from "lucide-react";

const PRIORITY_CONFIG = {
    critical: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', dot: 'bg-red-400', badge: 'bg-red-500/20 text-red-400' },
    warning: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-400', badge: 'bg-amber-500/20 text-amber-400' },
    info: { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/10', dot: 'bg-blue-400', badge: 'bg-blue-500/20 text-blue-400' },
};

export default function AICommandCenterPage() {
    const [insights, setInsights] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [acknowledging, setAcknowledging] = useState<string | null>(null);

    const loadInsights = async () => {
        setLoading(true);
        const { data } = await supabaseAdmin.from('ai_insights').select('*').order('generated_at', { ascending: false });
        setInsights(data || []);
        setLoading(false);
    };

    useEffect(() => { loadInsights(); }, []);

    const acknowledge = async (id: string) => {
        setAcknowledging(id);
        await supabaseAdmin.from('ai_insights').update({ is_acknowledged: true }).eq('id', id);
        setInsights(prev => prev.map(i => i.id === id ? { ...i, is_acknowledged: true } : i));
        setAcknowledging(null);
    };

    const unacknowledged = insights.filter(i => !i.is_acknowledged);
    const acknowledged = insights.filter(i => i.is_acknowledged);

    return (
        <div className="p-6 xl:p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-black text-white">AI Command Center</h1>
                    <p className="text-[11px] text-white/30 mt-0.5">{unacknowledged.length} active insights · AI-powered pastoral intelligence</p>
                </div>
                <button onClick={loadInsights} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white/50 hover:text-white transition-all">
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'Total Insights', val: insights.length, color: 'text-violet-400' },
                    { label: 'Critical', val: insights.filter(i => i.priority === 'critical').length, color: 'text-red-400' },
                    { label: 'Unacknowledged', val: unacknowledged.length, color: 'text-amber-400' },
                    { label: 'Resolved', val: acknowledged.length, color: 'text-emerald-400' },
                ].map(s => (
                    <div key={s.label} className="bg-[#111827] border border-white/5 rounded-2xl p-4">
                        <p className={`text-2xl font-black ${s.color}`}>{loading ? '—' : s.val}</p>
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-wide mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Active Insights */}
            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-3">Active Insights</p>
            <div className="space-y-2 mb-6">
                {loading ? <div className="text-center py-12 text-white/30 text-xs">Loading AI insights...</div> :
                    unacknowledged.map(insight => {
                        const cfg = PRIORITY_CONFIG[insight.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.info;
                        const isOpen = expanded === insight.id;
                        return (
                            <motion.div key={insight.id} layout className={`border rounded-2xl overflow-hidden ${cfg.bg}`}>
                                <button className="w-full flex items-center gap-3 p-4 text-left" onClick={() => setExpanded(isOpen ? null : insight.id)}>
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-white">{insight.title}</p>
                                        <p className="text-[9px] text-white/30 mt-0.5 capitalize">{insight.insight_type} · {new Date(insight.generated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                    </div>
                                    <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase flex-shrink-0 ${cfg.badge}`}>{insight.priority}</span>
                                    <ChevronDown className={`w-3.5 h-3.5 text-white/30 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                            className="px-4 pb-4 space-y-3">
                                            <p className="text-xs text-white/50 leading-relaxed">{insight.description}</p>
                                            {insight.suggested_action && (
                                                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                                    <p className="text-[8px] font-black text-white/30 uppercase tracking-wider mb-1">Suggested Action</p>
                                                    <p className="text-xs text-violet-300">{insight.suggested_action}</p>
                                                </div>
                                            )}
                                            <button
                                                onClick={() => acknowledge(insight.id)}
                                                disabled={acknowledging === insight.id}
                                                className="flex items-center gap-1.5 text-[9px] font-black text-emerald-400 hover:text-emerald-300 transition-colors"
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                {acknowledging === insight.id ? 'Acknowledging...' : 'Mark Acknowledged'}
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })
                }
                {!loading && unacknowledged.length === 0 && (
                    <div className="text-center py-8 text-emerald-400/60 text-xs">✅ All insights acknowledged</div>
                )}
            </div>

            {/* Acknowledged */}
            {acknowledged.length > 0 && (
                <>
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-2">Acknowledged</p>
                    <div className="space-y-1.5">
                        {acknowledged.map(i => (
                            <div key={i.id} className="flex items-center gap-3 p-3 bg-white/2 border border-white/3 rounded-xl opacity-50">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                <p className="text-xs text-white/40 line-through">{i.title}</p>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
