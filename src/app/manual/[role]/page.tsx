"use client";

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import { MANUAL_CONTENT, ManualRole } from '@/lib/manual-config';
import { ArrowLeft, CheckCircle2, AlertTriangle, Terminal, Database, ShieldAlert, Cpu, Heart, Activity, ArrowRight, Zap, Target } from 'lucide-react';

export default function RoleManualPage({ params }: { params: Promise<{ role: string }> }) {
  const router = useRouter();
  const { role } = use(params);
  const content = MANUAL_CONTENT[role as ManualRole] || [];

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-16 selection:bg-primary/30">
        <div className="max-w-7xl mx-auto space-y-12">
            <header className="flex flex-col md:flex-row items-center gap-8 justify-between border-b border-white/5 pb-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/manual')} className="p-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none">
                            {role === 'super-admin' && 'Global Control Center'}
                            {role === 'pastor-hq' && 'Shepherding Intelligence'}
                            {role === 'ministry-leader' && 'Operational Automation'}
                            {role === 'member' && 'Spiritual Growth'}
                        </h1>
                        <p className="text-xs font-black tracking-[0.4em] text-primary uppercase mt-1 italic">{role.replace(/-/g, ' ')} Manual</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-8 py-4 rounded-[2rem]">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Stage 6 (Operational)</span>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-12">
                    {content.map((section, idx) => (
                        <div key={idx} className="glass rounded-[3rem] border border-white/10 p-10 md:p-16 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] scale-150 rotate-12 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                                <section.icon size={320} />
                            </div>
                            
                            <div className="space-y-8 relative z-10">
                                <div className="space-y-4">
                                    <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic">{section.title}</h2>
                                    <p className="text-lg text-white/40 font-medium max-w-xl">{section.overview}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="space-y-6">
                                        <h3 className="text-xs font-black tracking-widest text-primary uppercase flex items-center gap-2">
                                            <Activity size={12} /> Standard Workflow
                                        </h3>
                                        <div className="space-y-4">
                                            {section.workflow.map((step, sIdx) => (
                                                <div key={sIdx} className="flex items-start gap-4 group/item">
                                                    <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black group-hover/item:border-primary/50 transition-colors">
                                                        {sIdx + 1}
                                                    </div>
                                                    <p className="text-sm font-medium text-white/60 group-hover/item:text-white transition-colors">{step}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h3 className="text-xs font-black tracking-widest text-amber-500 uppercase flex items-center gap-2">
                                            <Zap size={12} /> Test This Feature
                                        </h3>
                                        <div className="bg-[#0c0c0c] border border-white/5 rounded-3xl p-6 space-y-4">
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest leading-none">Task</p>
                                                <p className="text-xs font-bold text-white/90 leading-relaxed italic">{section.validation.testTask}</p>
                                            </div>
                                            <div className="space-y-2 pt-4 border-t border-white/5">
                                                <p className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest leading-none">Expected Success Outcome</p>
                                                <p className="text-[11px] font-medium text-white/40">{section.validation.expectedResult}</p>
                                            </div>
                                            <div className="space-y-2 pt-4 border-t border-white/5">
                                                <p className="text-[10px] font-black text-red-500/60 uppercase tracking-widest leading-none">Expected Failure Reason</p>
                                                <p className="text-[11px] font-medium text-white/40">{section.validation.failureScenario}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Automation & Technical Side Section */}
                <div className="space-y-8">
                    <div className="glass rounded-[2rem] p-8 border border-white/10 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary">
                                <Terminal size={20} />
                            </div>
                            <h3 className="text-xs font-black tracking-widest uppercase">System Behavior</h3>
                        </div>
                        
                        <div className="space-y-6">
                            {content.map((section) => 
                                section.systemBehavior.map((behavior, bIdx) => (
                                    <div key={bIdx} className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-black text-white/40 uppercase">{behavior.action}</span>
                                            <ArrowRight size={10} className="text-primary" />
                                        </div>
                                        <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-4 space-y-3">
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-primary italic">
                                                <Cpu size={12} /> {behavior.internalEvent}
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Metadata Sync (Tables)</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {behavior.affectedTables.map((table, tIdx) => (
                                                        <span key={tIdx} className="bg-white/5 border border-white/5 px-2 py-0.5 rounded-lg text-[8px] font-black text-white/40 uppercase tracking-tighter">
                                                            {table}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-primary/5 border border-primary/20 p-8 rounded-[2rem] space-y-4">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white">
                            <ShieldAlert size={20} />
                        </div>
                        <h4 className="text-xs font-black tracking-widest uppercase text-white">Multi-Tenant Isolation</h4>
                        <p className="text-[11px] font-medium text-white/60 leading-relaxed uppercase tracking-widest">
                            Every database query in this role path is physically restricted by the <span className="text-primary font-black">org_id</span>.
                            Cross-church data access is blocked at the Hardware level via PostgreSQL Row Level Security (RLS).
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}
