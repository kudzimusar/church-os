"use client";

import { useState, useEffect } from "react";
import { ShepherdLayout } from "@/components/layout/ShepherdLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
    Users, Baby, Megaphone, Music,
    ShieldCheck, Heart, Send, Calendar,
    TrendingUp, FileText, CheckCircle2, LayoutGrid
} from "lucide-react";
import { motion } from "framer-motion";
import { MINISTRY_OPTIONS } from "@/lib/constants";

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
    const [selectedMinistry, setSelectedMinistry] = useState(MINISTRIES[0]);
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [recentReports, setRecentReports] = useState<any[]>([]);

    useEffect(() => {
        loadRecentReports();
    }, [selectedMinistry]);

    async function loadRecentReports() {
        const { data } = await supabase
            .from('ministry_reports')
            .select('*')
            .eq('ministry_name', selectedMinistry.name)
            .order('report_date', { ascending: false })
            .limit(5);
        setRecentReports(data || []);
    }

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { error } = await supabase.from('ministry_reports').insert([{
                org_id: (await supabase.from('profiles').select('org_id').eq('id', user.id).single()).data?.org_id,
                submitted_by: user.id,
                ministry_name: selectedMinistry.name,
                metrics: formData,
                summary: `Operational report for ${selectedMinistry.name}`
            }]);

            if (error) throw error;
            toast.success("Report submitted successfully!");
            setFormData({});
            loadRecentReports();
        } catch (e: any) {
            toast.error(e.message || "Failed to submit report");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter">MINISTRY HUB</h1>
                    <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] mt-1">Operational Reporting & Data Intake</p>
                </div>
                <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10 overflow-x-auto max-w-full no-scrollbar pb-1">
                    {MINISTRIES.map(m => (
                        <button
                            key={m.id}
                            onClick={() => { setSelectedMinistry(m); setFormData({}); }}
                            className={`p-3 rounded-xl transition-all flex-shrink-0 ${selectedMinistry.id === m.id ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20' : 'text-white/40 hover:bg-white/5'}`}
                        >
                            <m.icon className="w-5 h-5" />
                        </button>
                    ))}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <Card className="lg:col-span-2 bg-[#111] border-white/5 rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="p-10 pb-4">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-12 h-12 rounded-2xl bg-violet-500/20 flex items-center justify-center text-violet-500">
                                <selectedMinistry.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-black text-white">{selectedMinistry.name.toUpperCase()}</CardTitle>
                                <p className="text-white/30 text-xs font-bold tracking-wider">Submit current service data</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10 pt-4 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {selectedMinistry.fields.map(field => (
                                <div key={field} className="space-y-2">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">{field}</label>
                                    <Input
                                        type="text"
                                        placeholder="Enter value..."
                                        value={formData[field] || ''}
                                        onChange={e => setFormData({ ...formData, [field]: e.target.value })}
                                        className="h-16 bg-white/5 border-white/10 rounded-2xl px-6 text-white font-bold focus:ring-violet-500"
                                    />
                                </div>
                            ))}
                        </div>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="w-full h-16 bg-violet-500 hover:bg-violet-600 text-white font-black rounded-2xl shadow-xl shadow-violet-500/20 transition-all border-0"
                        >
                            {isSubmitting ? "SYNCING TO SUPABASE..." : "SUBMIT MINISTRY REPORT"}
                            <Send className="w-4 h-4 ml-2" />
                        </Button>
                    </CardContent>
                </Card>

                {/* Recent Reports / Feed */}
                <div className="space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Recent Activity</h3>
                            <Badge className="bg-violet-500/20 text-violet-400 border-0">HISTORY</Badge>
                        </div>
                        <div className="space-y-4">
                            {recentReports.length > 0 ? recentReports.map((report, i) => (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    key={report.id}
                                    className="p-4 bg-white/2 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-white/10 transition-all"
                                >
                                    <div>
                                        <p className="text-xs font-bold text-white">{new Date(report.report_date).toLocaleDateString()}</p>
                                        <div className="flex gap-2 mt-1">
                                            {Object.entries(report.metrics).slice(0, 2).map(([k, v]: any) => (
                                                <span key={k} className="text-[9px] text-white/30 font-bold uppercase">{k}: {v}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </motion.div>
                            )) : (
                                <div className="text-center py-10 opacity-20">
                                    <Calendar className="w-8 h-8 mx-auto mb-2" />
                                    <p className="text-[9px] font-bold uppercase tracking-widest">No recent reports</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                        <div className="relative z-10">
                            <TrendingUp className="w-8 h-8 mb-4" />
                            <h3 className="text-xl font-black mb-2">INTELLIGENCE SYNC</h3>
                            <p className="text-white/70 text-xs font-bold leading-relaxed">
                                Every report submitted here directly feeds the Mission Control AI analysis models.
                            </p>
                        </div>
                        <div className="absolute -right-4 -bottom-4 opacity-50 group-hover:scale-110 transition-transform duration-700">
                            <Send className="w-32 h-32 rotate-[-15deg] text-white/10" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
