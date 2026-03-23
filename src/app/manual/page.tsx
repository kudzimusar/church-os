"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Building2, Flame, Video, BookOpen, ArrowRight, ShieldCheck, Terminal, Heart, Zap } from 'lucide-react';
import { ManualSection, MANUAL_CONTENT } from '@/lib/manual-config';

export default function ManualLandingPage() {
  const roles = [
    { id: 'super-admin', title: 'Super Admin', icon: Building2, color: 'text-primary', desc: 'Global Control & SaaS Guardrails' },
    { id: 'pastor-hq', title: 'Pastor HQ', icon: Flame, color: 'text-red-500', desc: 'Spiritual Altar & Impact Metrics' },
    { id: 'ministry-leader', title: 'Ministry Leader', icon: Video, color: 'text-amber-500', desc: 'Media Automation & Content' },
    { id: 'member', title: 'Church Member', icon: BookOpen, color: 'text-emerald-500', desc: 'Spiritual Growth & SOAPs' }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 md:p-24 selection:bg-primary/30">
        <div className="max-w-6xl mx-auto space-y-16">
            <header className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary">
                        <ShieldCheck size={28} />
                    </div>
                    <div>
                        <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none">Church OS <span className="text-primary">Manual</span></h1>
                        <p className="text-xs font-black tracking-[0.4em] text-white/30 uppercase mt-1">Role-Based Knowledge & Validation Hub</p>
                    </div>
                </div>
                <p className="text-lg text-white/40 max-w-2xl font-medium leading-relaxed">
                    This is your operational center for understanding, measuring, and testing the system. 
                    Choose your role to see the <span className="text-white italic">Internal Workflow</span> and verify the product functions.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {roles.map((role) => (
                    <Link 
                        key={role.id}
                        href={`/manual/${role.id}`}
                        className="glass group hover:bg-white/5 border border-white/10 rounded-[2.5rem] p-10 flex flex-col justify-between transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[320px]"
                    >
                        <div className="space-y-6">
                            <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center ${role.color} group-hover:scale-110 transition-transform`}>
                                <role.icon size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter">{role.title}</h3>
                                <p className="text-xs font-bold text-white/40 uppercase mt-1 italic">{role.desc}</p>
                            </div>
                        </div>
                        <div className="pt-8 flex items-center justify-between">
                            <span className="text-[10px] font-black tracking-widest uppercase text-white/20 group-hover:text-primary transition-colors">Enter Manual</span>
                            <ArrowRight size={20} className="text-white/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                    </Link>
                ))}
            </div>

            {/* System Automation Quick Access */}
            <div className="pt-12 grid grid-cols-1 lg:grid-cols-3 gap-8 border-t border-white/5">
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xs font-black tracking-[0.4em] text-primary uppercase">Core Systems & Automation</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { title: 'The AI Worker', desc: 'Transcription & Summary Pipeline', icon: Terminal },
                            { title: 'Governance & Costs', desc: 'AI Usage Ledgers & Quotas', icon: Zap },
                            { title: 'Spirituality Alerts', desc: 'Real-time Follow-up Logic', icon: Heart }
                        ].map((sys, idx) => (
                            <div key={idx} className="bg-white/5 border border-white/5 p-6 rounded-3xl hover:border-white/10 group transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-primary transition-colors">
                                        <sys.icon size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase text-white/80">{sys.title}</p>
                                        <p className="text-[10px] font-bold text-white/20 uppercase mt-0.5">{sys.desc}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="glass rounded-[2rem] p-8 border border-white/10 flex flex-col justify-center text-center space-y-4">
                    <p className="text-[9px] font-black text-primary uppercase tracking-widest">Global Status</p>
                    <h3 className="text-3xl font-black italic tracking-tighter uppercase">Stage 6 <br/>Operational</h3>
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">System Online</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}
