"use client";
import { useEffect, useState } from "react";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { motion } from "framer-motion";
import { TrendingUp, Users, UserCheck, Globe, Plus, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const STAGES = ['invited_visitor', 'first_service', 'second_visit', 'salvation_decision', 'baptism', 'membership'];
const STAGE_COLORS = ['#94a3b8', '#60a5fa', '#8b5cf6', '#fbbf24', '#34d399', '#f472b6'];

export default function GrowthPage() {
    const [pipeline, setPipeline] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isTrackerOpen, setIsTrackerOpen] = useState(false);
    const [formData, setFormData] = useState({ prospect_name: '', stage: 'invited_visitor', notes: '' });
    const [submitting, setSubmitting] = useState(false);

    const loadPipeline = () => {
        setLoading(true);
        supabaseAdmin.from('evangelism_pipeline').select('*').order('created_at', { ascending: false })
            .then(({ data }) => { setPipeline(data || []); setLoading(false); });
    };

    useEffect(() => {
        loadPipeline();
    }, []);

    const handleAddProspect = async () => {
        if (!formData.prospect_name) return toast.error("Name is required");
        setSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user?.id).single();
            const org_id = profile?.org_id;

            const { error } = await supabase.from('evangelism_pipeline').insert([{
                ...formData,
                invited_by: user?.id,
                org_id
            }]);
            
            if (error) throw error;
            
            toast.success("Prospect added to pipeline");
            setIsTrackerOpen(false);
            setFormData({ prospect_name: '', stage: 'invited_visitor', notes: '' });
            loadPipeline();
        } catch (error: any) {
            toast.error(error.message || "Failed to add prospect");
        } finally {
            setSubmitting(false);
        }
    };


    const bystage = STAGES.map(stage => ({
        stage,
        count: pipeline.filter(p => p.stage === stage).length,
    }));
    const conversionRate = pipeline.length > 0
        ? Math.round((pipeline.filter(p => p.stage === 'membership').length / pipeline.length) * 100)
        : 0;

    return (
        <div className="p-6 xl:p-8">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-xl font-black text-white">Growth Intelligence</h1>
                    <p className="text-[11px] text-white/30 mt-0.5">Evangelism pipeline · Household growth · Conversion analytics</p>
                </div>
                
                <Dialog open={isTrackerOpen} onOpenChange={setIsTrackerOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl h-10 px-5 shadow-lg shadow-emerald-500/20">
                            <Plus className="w-4 h-4 mr-2" /> ADD PROSPECT
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#0f172a] border-white/10 text-white max-w-sm rounded-3xl p-6">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-black tracking-tight">Evangelism Tracker</DialogTitle>
                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Log New Contact</p>
                        </DialogHeader>
                        
                        <div className="space-y-4 mt-6">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Prospect Name</p>
                                <Input 
                                    placeholder="e.g. Kenji Tanaka" 
                                    className="bg-white/5 border-white/10 text-sm h-12 rounded-xl"
                                    value={formData.prospect_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, prospect_name: e.target.value }))}
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Current Stage</p>
                                <select 
                                    value={formData.stage} 
                                    onChange={(e) => setFormData(prev => ({ ...prev, stage: e.target.value }))}
                                    className="bg-white/5 border border-white/10 w-full h-12 rounded-xl text-sm px-4 text-white appearance-none focus:outline-none focus:border-white/20"
                                >
                                    <option value="" disabled className="bg-[#0f172a]">Select Stage</option>
                                    {STAGES.map(s => (
                                        <option key={s} value={s} className="bg-[#0f172a] capitalize">
                                            {s.replace(/_/g, ' ')}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Quick Notes</p>
                                <Input 
                                    placeholder="e.g. Met at station outreach..." 
                                    className="bg-white/5 border-white/10 text-sm h-12 rounded-xl"
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                />
                            </div>

                            <Button 
                                onClick={handleAddProspect}
                                disabled={submitting}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 h-12 text-white font-black rounded-xl text-sm mt-4 shadow-xl shadow-emerald-600/20 px-0 line-clamp-1 truncate block"
                            >
                                {submitting ? "SAVING..." : "SAVE PROSPECT TO PIPELINE"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'In Pipeline', val: pipeline.length, color: 'text-blue-400' },
                    { label: 'New Members', val: pipeline.filter(p => p.stage === 'membership').length, color: 'text-emerald-400' },
                    { label: 'Salvations', val: pipeline.filter(p => ['salvation_decision', 'baptism', 'membership'].includes(p.stage)).length, color: 'text-amber-400' },
                    { label: 'Conversion Rate', val: `${conversionRate}%`, color: 'text-violet-400' },
                ].map(s => (
                    <div key={s.label} className="bg-[#111827] border border-white/5 rounded-2xl p-4">
                        <p className={`text-2xl font-black ${s.color}`}>{loading ? '—' : s.val}</p>
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-wide mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Funnel */}
            <div className="bg-[#111827] border border-white/5 rounded-2xl p-6 mb-4">
                <p className="text-xs font-black text-white/40 uppercase tracking-widest mb-5">Evangelism Pipeline Funnel</p>
                <div className="space-y-2">
                    {bystage.map((s, i) => {
                        const pct = pipeline.length > 0 ? Math.round((s.count / Math.max(bystage[0].count, 1)) * 100) : 0;
                        const dropOff = i > 0 ? Math.round(((bystage[i - 1].count - s.count) / Math.max(bystage[i - 1].count, 1)) * 100) : 0;
                        return (
                            <div key={s.stage}>
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-[9px] text-white/40 font-bold capitalize">{s.stage.replace(/_/g, ' ')}</p>
                                    <div className="flex items-center gap-2">
                                        {dropOff > 0 && <span className="text-[8px] text-red-400 font-bold">-{dropOff}%</span>}
                                        <p className="text-[9px] font-black text-white/60">{s.count}</p>
                                    </div>
                                </div>
                                <div className="h-5 bg-white/3 rounded-lg overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        transition={{ delay: i * 0.1, duration: 0.8 }}
                                        className="h-full rounded-lg"
                                        style={{ background: STAGE_COLORS[i], opacity: 0.75 }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
                {pipeline.length === 0 && !loading && (
                    <p className="text-center text-white/20 text-xs mt-4">No pipeline data yet. Add prospects via the evangelism tracker.</p>
                )}
            </div>

            {/* Recent pipeline entries */}
            {pipeline.length > 0 && (
                <div className="bg-[#111827] border border-white/5 rounded-2xl p-5">
                    <p className="text-xs font-black text-white/40 uppercase tracking-widest mb-4">Recent Prospects</p>
                    <div className="space-y-2">
                        {pipeline.slice(0, 8).map((p, i) => (
                            <div key={p.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                <p className="text-xs font-bold text-white">{p.prospect_name}</p>
                                <span className="text-[9px] font-black px-2 py-0.5 rounded-md capitalize"
                                    style={{ background: `${STAGE_COLORS[STAGES.indexOf(p.stage) || 0]}20`, color: STAGE_COLORS[STAGES.indexOf(p.stage) || 0] }}>
                                    {p.stage?.replace(/_/g, ' ')}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
