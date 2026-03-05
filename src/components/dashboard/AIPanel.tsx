"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, AlertTriangle, TrendingUp, Heart, Users, ChevronRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface AiInsight {
    id: string;
    insight_type: string;
    title: string;
    description: string;
    suggested_action: string;
    priority: 'critical' | 'warning' | 'info';
    generated_at: string;
}

const MOCK_INSIGHTS: AiInsight[] = [
    {
        id: '1', insight_type: 'daily',
        title: '12 Members Inactive 7+ Days',
        description: 'Devotional engagement has dropped sharply among 12 members who had active streaks just 2 weeks ago.',
        suggested_action: 'Assign 3 pastoral leaders to make personal check-in calls this week.',
        priority: 'critical', generated_at: new Date().toISOString()
    },
    {
        id: '2', insight_type: 'daily',
        title: 'Financial Stress Prayers +40%',
        description: 'Prayer requests mentioning financial difficulty have surged 40% vs. last week across all fellowship groups.',
        suggested_action: 'Prepare a sermon or workshop on biblical financial stewardship within 2 weeks.',
        priority: 'warning', generated_at: new Date().toISOString()
    },
    {
        id: '3', insight_type: 'weekly',
        title: 'Youth Attendance Up 24%',
        description: 'Youth ministry attendance has increased 24% month-over-month. Small group participation is at an all-time high.',
        suggested_action: 'Expand youth leadership team. Consider adding a second youth service slot.',
        priority: 'info', generated_at: new Date().toISOString()
    },
    {
        id: '4', insight_type: 'weekly',
        title: 'SOAP Anxiety Theme Rising',
        description: 'AI analysis of this week\'s SOAP journals shows anxiety-themed language in 31% of entries, up from 18% last week.',
        suggested_action: 'Incorporate a church-wide prayer and fasting day focused on peace and trust in God.',
        priority: 'warning', generated_at: new Date().toISOString()
    },
    {
        id: '5', insight_type: 'monthly',
        title: '3 New Families Registered',
        description: 'Three new household units joined through the app and attended at least one Sunday service this month.',
        suggested_action: 'Assign a welcome deacon to each new family for follow-up within 72 hours.',
        priority: 'info', generated_at: new Date().toISOString()
    }
];

const PRIORITY_CONFIG = {
    critical: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: AlertTriangle, dot: 'bg-red-500', label: 'CRITICAL' },
    warning: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: TrendingUp, dot: 'bg-amber-500', label: 'ATTENTION' },
    info: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: Zap, dot: 'bg-emerald-500', label: 'INSIGHT' },
};

export function AIPanel() {
    const [insights, setInsights] = useState<AiInsight[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [churchScore, setChurchScore] = useState<number | null>(null);

    async function loadInsights() {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('ai_insights')
                .select('*')
                .order('generated_at', { ascending: false })
                .limit(10);
            setInsights(data && data.length > 0 ? data : MOCK_INSIGHTS);

            // Try to load health score
            const { data: scoreData } = await supabase.rpc('get_church_health_score');
            if (scoreData?.score) setChurchScore(scoreData.score);
            else setChurchScore(78); // Mock
        } catch {
            setInsights(MOCK_INSIGHTS);
            setChurchScore(78);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { loadInsights(); }, []);

    const criticalCount = insights.filter(i => i.priority === 'critical').length;

    return (
        <aside className="flex flex-col h-full bg-[#0d1421] border-l border-white/5 overflow-hidden w-80 flex-shrink-0">
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/5 flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-violet-400" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-white uppercase tracking-wide">AI Shepherd</p>
                            <p className="text-[9px] text-white/30">Daily Intelligence</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-white/30 hover:text-white" onClick={loadInsights}>
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>

                {/* Church Health Score */}
                {churchScore !== null && (
                    <div className="bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/20 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Church Health Score</p>
                            {criticalCount > 0 && (
                                <span className="text-[9px] font-black bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                                    {criticalCount} ALERT{criticalCount > 1 ? 'S' : ''}
                                </span>
                            )}
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-black text-violet-300">{churchScore}</span>
                            <span className="text-sm font-bold text-white/30 mb-1">/ 100</span>
                        </div>
                        <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${churchScore}%` }}
                                transition={{ duration: 1.2, ease: "easeOut" }}
                                className={`h-full rounded-full ${churchScore >= 75 ? 'bg-emerald-400' : churchScore >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Insights List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                <p className="text-[10px] font-black text-white/25 uppercase tracking-widest px-2 py-1">Today's Insights</p>
                <AnimatePresence>
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
                        ))
                    ) : (
                        insights.map((insight, idx) => {
                            const cfg = PRIORITY_CONFIG[insight.priority];
                            const Icon = cfg.icon;
                            const isExp = expanded === insight.id;
                            return (
                                <motion.div
                                    key={insight.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => setExpanded(isExp ? null : insight.id)}
                                    className={`border rounded-xl p-3 cursor-pointer transition-all hover:border-violet-500/30 ${cfg.bg}`}
                                >
                                    <div className="flex items-start gap-2.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot} mt-1.5 flex-shrink-0`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1">
                                                <p className={`text-[9px] font-black tracking-wider uppercase ${cfg.color}`}>{cfg.label}</p>
                                                <ChevronRight className={`w-3 h-3 text-white/20 flex-shrink-0 transition-transform ${isExp ? 'rotate-90' : ''}`} />
                                            </div>
                                            <p className="text-xs font-semibold text-white/80 mt-0.5 leading-tight">{insight.title}</p>
                                            <AnimatePresence>
                                                {isExp && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <p className="text-[10px] text-white/50 mt-2 leading-relaxed">{insight.description}</p>
                                                        <div className="mt-2 pt-2 border-t border-white/10">
                                                            <p className="text-[9px] font-black text-violet-400 uppercase tracking-wider mb-1">Suggested Action</p>
                                                            <p className="text-[10px] text-white/60 leading-relaxed">{insight.suggested_action}</p>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-white/5 flex-shrink-0">
                <p className="text-[9px] text-white/20 text-center font-medium tracking-wider">
                    AI Analysis · Updated {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
        </aside>
    );
}
