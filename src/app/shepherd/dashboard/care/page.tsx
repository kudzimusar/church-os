"use client";

import { useEffect, useState } from "react";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { motion } from "framer-motion";
import { Heart, AlertTriangle, CheckCircle2, Clock, MessageSquare, Plus, Filter } from "lucide-react";

interface Prayer { id: string; category: string; urgency: string; request_text: string; status: string; is_anonymous: boolean; created_at: string; }

const URGENCY_CONFIG = {
    crisis: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', badge: 'bg-red-500/20 text-red-400' },
    urgent: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', badge: 'bg-amber-500/20 text-amber-400' },
    normal: { color: 'text-white/40', bg: 'bg-white/3 border-white/5', badge: 'bg-white/10 text-white/40' },
};

const STATUS_CONFIG = {
    active: { icon: Clock, color: 'text-amber-400' },
    in_prayer: { icon: Heart, color: 'text-violet-400' },
    answered: { icon: CheckCircle2, color: 'text-emerald-400' },
    closed: { icon: CheckCircle2, color: 'text-white/30' },
};

export default function CareAndPrayerPage() {
    const [prayers, setPrayers] = useState<Prayer[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        supabaseAdmin.from('prayer_requests').select('*').order('created_at', { ascending: false })
            .then(({ data }) => { setPrayers(data || []); setLoading(false); });
    }, []);

    const active = prayers.filter(p => p.status === 'active' || p.status === 'in_prayer');
    const answered = prayers.filter(p => p.status === 'answered');
    const crisis = prayers.filter(p => p.urgency === 'crisis');

    const filtered = prayers.filter(p => filter === 'all' || p.status === filter || p.urgency === filter);

    const markAnswered = async (id: string) => {
        await supabaseAdmin.from('prayer_requests').update({ status: 'answered', answered_date: new Date().toISOString().split('T')[0] }).eq('id', id);
        setPrayers(prev => prev.map(p => p.id === id ? { ...p, status: 'answered' } : p));
    };

    return (
        <div className="p-6 xl:p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-black text-white">Pastoral Care Center</h1>
                    <p className="text-[11px] text-white/30 mt-0.5">Prayer board, crisis alerts & counseling coordination</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'Active Prayers', val: active.length, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                    { label: 'Crisis Requests', val: crisis.length, color: 'text-red-400', bg: 'bg-red-500/10' },
                    { label: 'Answered', val: answered.length, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { label: 'Total Requests', val: prayers.length, color: 'text-violet-400', bg: 'bg-violet-500/10' },
                ].map(s => (
                    <div key={s.label} className="bg-[#111827] border border-white/5 rounded-2xl p-4">
                        <p className="text-2xl font-black text-white">{s.val}</p>
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-wide mt-1">{s.label}</p>
                        <div className={`mt-2 h-1 rounded-full ${s.bg}`} />
                    </div>
                ))}
            </div>

            {/* Filter */}
            <div className="flex gap-2 mb-4">
                {['all', 'active', 'in_prayer', 'answered', 'crisis'].map(f => (
                    <button key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${filter === f ? 'bg-violet-600 text-white' : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'}`}>
                        {f}
                    </button>
                ))}
            </div>

            {/* Prayer Cards */}
            {loading ? (
                <div className="text-center py-16 text-white/30 text-xs">Loading prayer requests...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {filtered.map((p, i) => {
                        const urg = URGENCY_CONFIG[p.urgency as keyof typeof URGENCY_CONFIG] || URGENCY_CONFIG.normal;
                        const stat = STATUS_CONFIG[p.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.active;
                        const StatIcon = stat.icon;
                        return (
                            <motion.div
                                key={p.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className={`p-4 rounded-2xl border ${urg.bg}`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase ${urg.badge}`}>
                                            {p.urgency}
                                        </span>
                                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-white/10 text-white/40 uppercase">
                                            {p.category}
                                        </span>
                                    </div>
                                    <StatIcon className={`w-3.5 h-3.5 ${stat.color}`} />
                                </div>
                                <p className="text-xs text-white/70 leading-relaxed mb-3">
                                    {p.is_anonymous ? '🔒 ' : ''}{p.request_text}
                                </p>
                                <div className="flex items-center justify-between">
                                    <p className="text-[9px] text-white/25">{new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                    {p.status !== 'answered' && (
                                        <button
                                            onClick={() => markAnswered(p.id)}
                                            className="text-[9px] font-black text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
                                        >
                                            <CheckCircle2 className="w-3 h-3" /> Mark Answered
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
