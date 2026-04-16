'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Church, Menu, X, BrainCircuit, TrendingUp, BarChart3,
  Activity, Globe, Shield, Users, Zap, ArrowRight,
  ChevronRight, Check, MapPin,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { JKC_ORG_ID } from '@/lib/platform-constants';

// ─── Navbar ───────────────────────────────────────────────────────────────────
const Navbar = () => {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const links = [
    { label: 'Global Registry',  path: '/platform/registry/' },
    { label: 'AI Growth Engine', path: '/platform/ai/' },
    { label: 'Philanthropy',     path: '/platform/philanthropy/' },
    { label: 'Devotion',         path: '/welcome/devotion/' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0a1628]/95 backdrop-blur-xl border-b border-white/[.08] py-3' : 'bg-[#0a1628]/80 backdrop-blur-sm border-b border-white/[.05] py-4'}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <button onClick={() => router.push('/platform/')} className="flex items-center gap-3">
          <div className="bg-emerald-500 p-2 rounded-xl shadow-lg shadow-emerald-500/30">
            <Church className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter text-white">Church<span className="text-emerald-400">OS</span></span>
        </button>
        <div className="hidden lg:flex items-center gap-10">
          {links.map(l => (
            <button key={l.path} onClick={() => router.push(l.path)}
              className={`text-[11px] font-black uppercase tracking-[.12em] transition-colors ${l.path === '/platform/ai/' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}>
              {l.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/platform/login/')} className="hidden sm:flex text-sm font-bold text-slate-400 hover:text-white transition-colors px-3 py-2">Sign In</button>
          <button onClick={() => router.push('/platform/register/')} className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors">Get Started</button>
          <button className="lg:hidden p-1 text-white" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-[#0a1628]/98 backdrop-blur-xl border-b border-white/[.08] p-6 flex flex-col gap-4">
          {links.map(l => (
            <button key={l.path} onClick={() => { router.push(l.path); setMobileOpen(false); }}
              className="text-left text-sm font-black uppercase tracking-widest text-white hover:text-emerald-400 transition-colors">{l.label}</button>
          ))}
          <hr className="border-white/10" />
          <button onClick={() => { router.push('/platform/register/'); setMobileOpen(false); }} className="bg-emerald-500 text-white text-sm font-bold px-5 py-3 rounded-xl">Get Started</button>
        </div>
      )}
    </nav>
  );
};

// ─── PIL Flow Step ────────────────────────────────────────────────────────────
const PIL_STEPS = [
  { num: '01', label: 'Member Journals',     desc: 'SOAP entries and prayer logs collected in real-time', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  { num: '02', label: 'Sentiment Engine',    desc: 'AI analyses emotional and spiritual tone of each entry', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
  { num: '03', label: 'Care Score Update',   desc: 'Member engagement score adjusts — Red/Amber alert triggers', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  { num: '04', label: 'Pastor Alert',        desc: 'Structured alert surfaces in Mission Control Victory Briefing', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { num: '05', label: 'Shepherd Responds',   desc: 'Pastoral action logged — the loop closes in the Spiritual Milestone Ledger', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
];

export default function AIGrowthPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<any>(null);
  const [pilAccuracy, setPilAccuracy] = useState('92%');
  const [modelCount, setModelCount] = useState('12');

  useEffect(() => {
    const run = async () => {
      const [metricsRes, pilRes, modelRes] = await Promise.all([
        supabase
          .from('church_health_metrics')
          .select('score,attendance_index,engagement_index,service_index,prayer_index,community_index')
          .eq('org_id', JKC_ORG_ID)
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
        supabase.from('platform_stats').select('stat_value').eq('stat_key', 'pil_accuracy').single(),
        supabase.from('platform_stats').select('stat_value').eq('stat_key', 'ai_model_count').single(),
      ]);
      if (metricsRes.data) setMetrics(metricsRes.data);
      if (pilRes.data?.stat_value) setPilAccuracy(pilRes.data.stat_value);
      if (modelRes.data?.stat_value) setModelCount(modelRes.data.stat_value);
    };
    run();
  }, []);

  const metricBars = [
    { label: 'Service Index',   value: metrics?.service_index    ?? 77,  color: 'bg-emerald-500' },
    { label: 'Prayer Index',    value: metrics?.prayer_index     ?? 75,  color: 'bg-indigo-500'  },
    { label: 'Community',       value: metrics?.community_index  ?? 68,  color: 'bg-blue-500'    },
    { label: 'Engagement',      value: metrics?.engagement_index ?? 50,  color: 'bg-amber-500'   },
    { label: 'Attendance',      value: metrics?.attendance_index ?? 12,  color: 'bg-rose-500'    },
  ];

  return (
    <div className="min-h-screen bg-[#0a1628] text-white antialiased overflow-x-hidden">
      <Navbar />
      <div className="pt-20">

        {/* Hero */}
        <section className="relative py-24 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-indigo-500/[.06] blur-[160px] rounded-full" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-500/[.05] blur-[140px] rounded-full" />
          </div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="max-w-3xl space-y-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-[10px] font-black uppercase tracking-[.14em] text-indigo-400">
                Prophetic Intelligence Layer
              </span>
              <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                AI Growth &amp; Intelligence.
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
                The world&apos;s first ministry-native AI engine. Predictive pastoral care, demographic intelligence, and content generation — built exclusively for the global church.
              </p>
            </div>

            {/* Stat strip */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'PIL Accuracy',         value: pilAccuracy,  sub: 'Prophetic Intelligence' },
                { label: 'Predictive Models',    value: modelCount,   sub: 'Active Simultaneously' },
                { label: 'Care Alerts',          value: 'Real-time',  sub: 'Continuous Monitoring' },
                { label: 'Engagement Scale',     value: '0–100',      sub: 'Per Member Score' },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl border border-white/[.08] bg-white/[.02] p-6 space-y-1">
                  <p className="text-2xl font-black text-white">{s.value}</p>
                  <p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-500">{s.label}</p>
                  <p className="text-[9px] text-indigo-400/80 font-medium uppercase tracking-wider">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Predictive Pastoral Care — large feature card */}
        <section className="border-t border-white/[.06] py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-rose-500/20 bg-rose-500/10 text-[10px] font-black uppercase tracking-[.14em] text-rose-400">
                  Pastoral Intelligence
                </span>
                <h2 className="text-4xl md:text-5xl font-black text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  Predictive <span className="text-rose-400">Pastoral Care.</span>
                </h2>
                <p className="text-lg text-slate-400 leading-relaxed">
                  The PIL engine runs 12 simultaneous predictive models on every member — detecting spiritual drift, burnout, crisis, and growth opportunities before pastors would naturally notice them.
                </p>
                <div className="space-y-4">
                  {[
                    { title: 'Spiritual Drift Detection',  desc: 'Identifies consistent disengagement across devotion, attendance, and giving over rolling 30/60/90-day windows.' },
                    { title: 'Burnout Risk Model',         desc: 'Flags leaders and volunteers showing exhaustion patterns based on service hours, communication quality, and prayer frequency.' },
                    { title: 'Growth Harvest Signal',      desc: 'AI identifies members entering receptive spiritual seasons — perfect timing for discipleship programme invitations.' },
                  ].map((f, i) => (
                    <div key={i} className="flex gap-3">
                      <Check className="h-4 w-4 mt-1 shrink-0 text-rose-400" />
                      <div>
                        <p className="text-sm font-black text-white">{f.title}</p>
                        <p className="text-sm text-slate-500 leading-relaxed mt-0.5">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live metrics card */}
              <div className="relative">
                <div className="absolute -inset-8 bg-indigo-500/[.04] blur-[100px] rounded-full pointer-events-none" />
                <div className="relative rounded-2xl border border-white/[.08] bg-white/[.03] p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[.2em] text-slate-500">Live · JKC Network</p>
                      <h3 className="text-xl font-black text-white mt-1">Network Health Score</h3>
                    </div>
                    <BarChart3 className="h-6 w-6 text-indigo-400" />
                  </div>
                  <div className="space-y-4">
                    {metricBars.map((m, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">{m.label}</span>
                          <span className="text-sm font-black text-white">{m.value}</span>
                        </div>
                        <div className="h-1.5 bg-white/[.06] rounded-full overflow-hidden">
                          <div className={`h-full ${m.color} rounded-full`} style={{ width: `${m.value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
                    <Activity className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                    <p className="text-xs font-bold text-rose-300 leading-relaxed">PIL Alert: Attendance index at 12/100 — pastoral intervention recommended.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Demographic Intel + Content AI */}
        <section className="border-t border-white/[.06] py-24">
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-8">
            <div className="rounded-2xl border border-white/[.08] bg-white/[.02] p-8 space-y-6">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Globe className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-2xl font-black text-white">Demographic Intelligence</h3>
              <p className="text-slate-400 leading-relaxed">
                Geo-spatial density mapping for strategic church planting. The PIL engine analyses population demographics, existing church coverage, socioeconomic indicators, and migration patterns to identify the highest-impact locations for new sanctuaries.
              </p>
              <div className="space-y-2">
                {['Geo-density heat mapping', 'Population growth overlays', 'Church coverage gap analysis', 'Migration corridor tracking'].map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-400">
                    <Check className="h-3.5 w-3.5 text-blue-400 shrink-0" /> {f}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/[.08] bg-white/[.02] p-8 space-y-6">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <BrainCircuit className="h-6 w-6 text-violet-400" />
              </div>
              <h3 className="text-2xl font-black text-white">Content AI</h3>
              <p className="text-slate-400 leading-relaxed">
                From sermon transcription to multilingual devotion content, Church OS automates your content pipeline. Every piece is filtered through your church&apos;s Theological DNA before publication — ensuring doctrinal consistency at scale.
              </p>
              <div className="space-y-2">
                {['Bilingual sermon transcription', 'Devotion content generation', 'Theological DNA filtering', 'Auto-translated SmallGroup materials'].map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-400">
                    <Check className="h-3.5 w-3.5 text-violet-400 shrink-0" /> {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How the PIL Works — 5-step flow */}
        <section className="border-t border-white/[.06] py-24 bg-[#050d18]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-12 space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-[10px] font-black uppercase tracking-[.14em] text-indigo-400">
                How It Works
              </span>
              <h2 className="text-4xl font-black text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                How the PIL Works.
              </h2>
              <p className="text-slate-400 max-w-xl">From member prayer journal entry to pastoral response — five steps, fully automated.</p>
            </div>

            {/* Desktop horizontal flow */}
            <div className="hidden md:flex items-start gap-0">
              {PIL_STEPS.map((step, i) => (
                <div key={i} className="flex-1 flex items-start gap-0">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-black text-sm mb-4 ${step.color}`}>
                      {step.num}
                    </div>
                    <p className="text-xs font-black text-white uppercase tracking-wider text-center mb-2">{step.label}</p>
                    <p className="text-[11px] text-slate-500 text-center leading-relaxed px-2">{step.desc}</p>
                  </div>
                  {i < PIL_STEPS.length - 1 && (
                    <div className="flex items-start pt-5 px-1 shrink-0">
                      <ChevronRight className="text-white/20" size={18} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Mobile vertical flow */}
            <div className="md:hidden space-y-4">
              {PIL_STEPS.map((step, i) => (
                <div key={i} className={`flex gap-4 p-5 rounded-2xl border ${step.color}`}>
                  <div className={`w-10 h-10 rounded-full border flex items-center justify-center font-black text-sm shrink-0 ${step.color}`}>
                    {step.num}
                  </div>
                  <div>
                    <p className="text-sm font-black text-white mb-1">{step.label}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="border-t border-white/[.06] py-24">
          <div className="max-w-3xl mx-auto px-6 text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-black text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Ready for <span className="text-indigo-400">Church Intelligence?</span>
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              Begin the Celestial Onboarding Process and provision your church&apos;s PIL engine, ChurchGPT model, and Shepherd Dashboard — all in one session.
            </p>
            <button
              onClick={() => router.push('/platform/register/?intent=church')}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 h-14 rounded-xl transition-colors text-base shadow-lg shadow-indigo-500/20"
            >
              Start Your Celestial Onboarding <ArrowRight size={18} />
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
