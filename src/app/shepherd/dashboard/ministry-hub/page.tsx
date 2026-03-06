"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
    Users, Baby, Megaphone, Music,
    ShieldCheck, Heart, Send, Calendar,
    TrendingUp, FileText, CheckCircle2, LayoutGrid,
    X, Loader2, Sparkles, Database
} from "lucide-react";
import { motion } from "framer-motion";
import { MINISTRY_OPTIONS } from "@/lib/constants";
import { MinistryCommandCenter } from "@/components/dashboard/MinistryCommandCenter";
import { DynamicFormRenderer } from "@/components/forms/DynamicFormRenderer";

const ICON_MAP: Record<string, any> = {
    "Worship Ministry": Music,
    "Choir": Music,
    "Media / Production": Megaphone,
    "Ushers": ShieldCheck,
    "Protocol / Security": ShieldCheck,
    "Hospitality": Heart,
    "Children's Ministry": Baby,
    "Youth Ministry": Users,
    "Intercessory Prayer Team": Heart,
    "Evangelism Team": Megaphone,
    "Counseling Ministry": Heart,
    "Missions Team": Send,
};

const DEFAULT_FIELDS = ['Attendance', 'Souls Won', 'First Timers', 'Highlights'];

const MINISTRIES = MINISTRY_OPTIONS.map(name => ({
    id: name.toLowerCase().replace(/[^a-z]/g, '_'),
    name: name,
    icon: ICON_MAP[name] || LayoutGrid,
    fields: name.toLowerCase().includes('ministry') || name.toLowerCase().includes('team') ? DEFAULT_FIELDS : ['Active Members', 'Status', 'Notes']
}));

export default function MinistryHub() {
    const [loading, setLoading] = useState(true);
    const [selectedMinistry, setSelectedMinistry] = useState<any>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [userMinistry, setUserMinistry] = useState<any>(null);
    const [allMinistries, setAllMinistries] = useState<any[]>([]);
    const [activeFormId, setActiveFormId] = useState<string | null>(null);

    useEffect(() => {
        async function loadContext() {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: member } = await supabase
                    .from('org_members')
                    .select('role, ministry_id, ministries(*)')
                    .eq('user_id', user.id)
                    .single();

                setUserRole(member?.role || 'member');
                setUserMinistry(member?.ministries || null);

                const { data: mData } = await supabase.from('ministries').select('*').order('name');
                setAllMinistries(mData || []);

                if (member?.ministries) {
                    setSelectedMinistry(member.ministries);
                } else if (mData && mData.length > 0) {
                    setSelectedMinistry(mData[0]);
                }
            } catch (err) {
                console.error("Failed to load ministry context", err);
            } finally {
                setLoading(false);
            }
        }
        loadContext();
    }, []);

    const handleAction = async (action: string) => {
        let formName = "";
        if (action === 'usher_report') formName = 'Usher Headcount Report';
        if (action === 'register_child') formName = 'Child Check-In';
        if (action === 'log_outreach') formName = 'Evangelism Log';
        if (action === 'generic_report') formName = 'Weekly Ministry Report';

        if (formName) {
            const { data } = await supabase.from('forms').select('id').eq('name', formName).single();
            if (data) {
                setActiveFormId(data.id);
            } else {
                toast.error(`Operational form '${formName}' is not active in the pipeline.`);
            }
        }
    };

    const isPrivileged = ['admin', 'shepherd', 'owner', 'super_admin', 'pastor'].includes(userRole || '');

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        </div>
    );

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto min-h-screen">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
                        {userRole === 'ministry_leader' ? `${userMinistry?.name} Command` : 'Intelligence Hub'}
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Live Pipeline Active</span>
                    </div>
                </div>

                {isPrivileged && (
                    <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10 overflow-x-auto max-w-full no-scrollbar">
                        {allMinistries.map(m => (
                            <button
                                key={m.id}
                                onClick={() => setSelectedMinistry(m)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${selectedMinistry?.id === m.id ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20' : 'text-white/40 hover:bg-white/5'}`}
                            >
                                {m.name}
                            </button>
                        ))}
                    </div>
                )}
            </header>

            {/* Form Overlay */}
            {activeFormId && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl p-6 md:p-12 overflow-y-auto"
                >
                    <div className="max-w-2xl mx-auto">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
                                    <Send className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Operational Intake</h2>
                            </div>
                            <Button variant="outline" size="icon" onClick={() => setActiveFormId(null)} className="rounded-full bg-white/5 border-white/10 hover:bg-white/10">
                                <X className="w-5 h-5 text-white" />
                            </Button>
                        </div>
                        <div className="bg-[#111] border border-white/5 rounded-[3rem] p-2 shadow-2xl">
                            <DynamicFormRenderer
                                formId={activeFormId}
                                onSuccess={() => {
                                    setActiveFormId(null);
                                    toast.success("Ministry data synchronized with intelligence feed!");
                                }}
                            />
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Ministry Specific Dashboard Grid */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <MinistryCommandCenter
                    ministrySlug={selectedMinistry?.slug || ''}
                    onAction={handleAction}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
                {/* Status Column */}
                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
                    <h3 className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-6">Pipeline Health</h3>
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-white">SUPABASE CONNECTED</p>
                                <p className="text-[9px] text-white/30 font-bold uppercase">Operational integrity verified</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-white">AI FEED ACTIVE</p>
                                <p className="text-[9px] text-white/30 font-bold uppercase">Real-time pattern analysis</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Card */}
                <div className="lg:col-span-2 bg-[#111] border-white/5 rounded-[2.5rem] p-10 flex flex-col justify-center relative overflow-hidden group">
                    <div className="relative z-10">
                        <h3 className="text-xl font-black text-white mb-2 uppercase italic tracking-tighter">Strategic Impact</h3>
                        <p className="text-white/40 text-sm font-bold leading-relaxed max-w-xl">
                            The data you input here transforms into the proprietary PI (Prophetic Intelligence) layer,
                            allowing the church leadership to see growth trends and pastoral needs in real-time.
                        </p>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 blur-[120px] rounded-full group-hover:bg-violet-600/10 transition-all duration-1000" />
                </div>
            </div>
        </div>
    );
}
