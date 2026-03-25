"use client";
import { useState, useEffect } from "react";

import { toast } from "sonner";
import {
    Users, ShieldCheck, Heart, Send, Calendar,
    TrendingUp, FileText, CheckCircle2, LayoutGrid,
    X, Loader2, Sparkles, Database, AlertCircle, Zap, UserPlus
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAdminCtx } from "../Context";

export default function MinistryHub() {
    const [loading, setLoading] = useState(true);
    const [skillGaps, setSkillGaps] = useState<any[]>([]);
    const [talentPool, setTalentPool] = useState<any[]>([]);
    const [ministriesHealth, setMinistriesHealth] = useState<any[]>([]);
    const [equipmentReports, setEquipmentReports] = useState<any[]>([]);
    const [stats, setStats] = useState({ active: 0, critical: 0, volunteers: 0, reports: 0 });
    const { orgId } = useAdminCtx();

    const loadData = async () => {
        if (!orgId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('vw_ministry_hub')
                .select('*')
                .eq('org_id', orgId)
                .order('name');
            
            if (error) throw error;
            setMinistriesHealth(data || []);

            const v = data?.reduce((acc: any, current: any) => {
                return {
                    active: acc.active + 1,
                    critical: acc.critical + (current.reporting_overdue ? 1 : 0),
                    volunteers: acc.volunteers + (current.volunteer_count || 0),
                    reports: acc.reports + (current.total_reports || 0)
                };
            }, { active: 0, critical: 0, volunteers: 0, reports: 0 });

            if (v) setStats(v);

            // Load skill gaps
            const { data: gaps } = await supabase
                .from('vw_ministry_skill_gaps')
                .select('*')
                .eq('org_id', orgId);
            setSkillGaps(gaps || []);

            // Load talent pool recommendations
            const { data: talent } = await supabase
                .from('vw_member_talent_pool')
                .select('*')
                .eq('org_id', orgId)
                .limit(5);
            setTalentPool(talent || []);

            // Load equipment reports
            const { data: equipData } = await supabase
                .from('vw_equipment_reports')
                .select('*')
                .eq('org_id', orgId)
                .limit(10);
            setEquipmentReports(equipData || []);
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to load Ministry Health Intelligence");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [orgId]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
    );

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto min-h-screen text-foreground transition-colors duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter uppercase">Intelligence Hub</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            Live Prophetic Intelligence Matrix
                        </span>
                    </div>
                </div>
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <p className="text-3xl font-black text-primary">{stats.active}</p>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Active Ministries</p>
                </div>
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{stats.volunteers}</p>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Engaged Volunteers</p>
                </div>
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <p className="text-3xl font-black text-amber-600 dark:text-amber-400">{stats.reports}</p>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Reports Analyzed</p>
                </div>
                <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden shadow-sm">
                    <div className={`absolute inset-0 bg-red-500/10 transition-opacity ${stats.critical > 0 ? 'opacity-100' : 'opacity-0'}`} />
                    <p className={`text-3xl font-black relative z-10 ${stats.critical > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground/40'}`}>
                        {stats.critical}
                    </p>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1 relative z-10">Critical Alerts</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Column 1 & 2: Ministry Health Grid */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                        <LayoutGrid className="w-4 h-4 text-primary" />
                        <h2 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Operational Snapshots</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {ministriesHealth.map((m: any) => (
                            <div key={m.id} className="bg-card border border-border rounded-3xl p-6 relative overflow-hidden hover:border-primary/30 transition-all group shadow-sm">
                                <div 
                                    className="absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-10 group-hover:opacity-20 transition-all"
                                    style={{ backgroundColor: m.color || '#6366F1' }}
                                />
                                
                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div>
                                        <h2 className="text-xl font-black uppercase tracking-tighter text-foreground inline-flex items-center gap-2">
                                            {m.name}
                                        </h2>
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                                            Leader: <span className="text-foreground/70">{m.leader_name || 'Unassigned'}</span>
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-2xl font-black ${m.health_score >= 80 ? 'text-emerald-600 dark:text-emerald-400' : m.health_score >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {m.health_score || 0}
                                        </span>
                                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Health</p>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-6 relative z-10">
                                    <div className="flex justify-between items-center bg-muted/50 rounded-xl px-4 py-3 border border-border/50">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Volunteers</span>
                                        <span className="text-lg font-black text-foreground">{m.volunteer_count || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-muted/50 rounded-xl px-4 py-3 border border-border/50">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Avg Attendance</span>
                                        <span className="text-lg font-black text-primary">{m.avg_attendance || 0}</span>
                                    </div>
                                </div>

                                <div className="border-t border-border pt-4 relative z-10 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Last Report</span>
                                        <span className={`text-xs font-bold ${m.reporting_overdue ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                            {m.last_report_date ? new Date(m.last_report_date).toLocaleDateString() : 'Never'}
                                        </span>
                                    </div>
                                    {m.reporting_overdue && (
                                        <div className="flex items-center gap-1.5 bg-red-500/10 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg border border-red-500/20 shadow-sm">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Overdue</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Column 3: Skill Gaps and Talent Pooling (The Rule-Based Forecasts) */}
                <div className="space-y-8">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Zap className="w-4 h-4 text-amber-500" />
                            <h2 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Leadership Skill Gaps</h2>
                        </div>
                        <div className="space-y-3">
                            {skillGaps.filter(g => g.skilled_volunteers_count < 2).map((gap: any) => (
                                <div key={gap.ministry_id} className="bg-card border border-border rounded-2xl p-4 shadow-sm border-l-4 border-l-amber-500">
                                    <p className="text-xs font-black text-foreground uppercase tracking-tight">{gap.ministry_name}</p>
                                    <div className="flex items-center justify-between mt-2">
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Critical Gap Detection</p>
                                        <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">Only {gap.skilled_volunteers_count} Skilled</span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground/60 mt-1 leading-relaxed">This ministry lacks specialized talent. Intelligence layer recommends targeted recruitment from the talent pool.</p>
                                </div>
                            ))}
                            {skillGaps.length === 0 && (
                                <div className="text-center py-8 border border-dashed border-border rounded-2xl">
                                    <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">No critical skill gaps</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <UserPlus className="w-4 h-4 text-emerald-500" />
                            <h2 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Recruitment Matches</h2>
                        </div>
                        <div className="space-y-3">
                            {talentPool.map((talent: any) => (
                                <div key={talent.email} className="bg-card border border-border rounded-2xl p-4 shadow-sm group hover:border-emerald-500/30 transition-all">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-black text-foreground">{talent.name}</p>
                                        <Sparkles className="w-3 h-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {talent.skills?.slice(0, 3).map((s: string) => (
                                            <span key={s} className="text-[8px] font-black bg-muted text-muted-foreground px-1.5 py-0.5 rounded uppercase tracking-tighter">{s}</span>
                                        ))}
                                    </div>
                                    <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold mt-2 uppercase tracking-widest">Match: {talent.current_ministries?.length ? 'Cross-Ministry Potential' : 'Unassigned Talent'}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Equipment & Resources Intelligence */}
            <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black tracking-tighter uppercase text-foreground">Equipment & Resources</h2>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Maintenance & Asset Integrity Matrix</p>
                    </div>
                </div>
 
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Ministry</th>
                                <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Equipment</th>
                                <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Status</th>
                                <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Urgency</th>
                                <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Last Reported</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {equipmentReports.map((report) => (
                                <tr key={report.id} className="group transition-colors hover:bg-muted">
                                    <td className="py-4">
                                        <p className="font-bold text-foreground text-sm">{report.ministry_name}</p>
                                    </td>
                                    <td className="py-4">
                                        <p className="text-foreground font-medium text-sm">{report.equipment_name}</p>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase truncate max-w-[200px]">
                                            {report.damage_description || 'No damage reported'}
                                        </p>
                                    </td>
                                    <td className="py-4">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${
                                            report.equipment_status === 'Working'
                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                                : report.equipment_status === 'Needs Repair' || report.repair_required === 'true'
                                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                                : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                                        }`}>
                                            {report.equipment_status}
                                        </span>
                                    </td>
                                    <td className="py-4">
                                         <span className={`text-[10px] font-black uppercase tracking-widest ${
                                            report.urgency === 'Critical' ? 'text-red-600 dark:text-red-400' : report.urgency === 'Medium' ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground/50'
                                         }`}>
                                             {report.urgency || 'Normal'}
                                         </span>
                                    </td>
                                    <td className="py-4 text-right">
                                        <p className="text-xs font-bold text-muted-foreground">
                                            {new Date(report.service_date).toLocaleDateString()}
                                        </p>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {equipmentReports.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground/20 text-xs font-black uppercase tracking-widest italic">All systems operational. No asset alerts detected.</p>
                    </div>
                )}
            </div>

            {ministriesHealth.length === 0 && !loading && (
                <div className="text-center bg-card border border-border rounded-3xl p-12 shadow-sm">
                    <p className="text-muted-foreground text-sm font-black uppercase tracking-widest">No Ministry Data Found</p>
                </div>
            )}
        </div>
    );
}
