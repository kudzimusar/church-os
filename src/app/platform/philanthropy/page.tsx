'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Church, Menu, X, HeartHandshake, Globe, ShieldCheck,
  ArrowRight, Check, Coins, BookOpen, Users,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CHURCHOS_ORG_ID } from '@/lib/platform-constants';

// ─── Navbar ───────────────────────────────────────────────────────────────────
const Navbar = () => {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  React.useEffect(() => {
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
              className={`text-[11px] font-black uppercase tracking-[.12em] transition-colors ${l.path === '/platform/philanthropy/' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'}`}>
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

// ─── Intent map ───────────────────────────────────────────────────────────────
const intentOptions = [
  { label: 'Apply for assistance',  value: 'beneficiary_application' },
  { label: 'Become a donor',        value: 'donor_inquiry' },
  { label: 'General inquiry',       value: 'general_inquiry' },
] as const;

type IntentValue = typeof intentOptions[number]['value'];

// ─── Interest Form ────────────────────────────────────────────────────────────
const InterestForm = () => {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedIntent, setSelectedIntent] = useState<IntentValue>('beneficiary_application');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !email.trim()) return;
    setStatus('loading');
    const { error } = await supabase.from('public_inquiries').insert({
      first_name: firstName.trim(),
      last_name: '',
      email: email.trim(),
      visitor_intent: selectedIntent,
      org_id: CHURCHOS_ORG_ID,
      message: `Philanthropy interest: ${selectedIntent}`,
    });
    setStatus(error ? 'error' : 'done');
  };

  const inputStyle = 'w-full h-12 px-4 rounded-xl bg-white/[.04] border border-white/[.08] text-white placeholder:text-slate-600 text-sm font-medium focus:outline-none focus:border-white/20 transition-colors';

  if (status === 'done') {
    return (
      <div className="text-center py-12 space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
          <Check className="h-8 w-8 text-emerald-400" />
        </div>
        <h4 className="text-xl font-black text-white">Thank you — we&apos;ll be in touch soon.</h4>
        <p className="text-slate-400 text-sm">Your interest has been received by the Church OS Philanthropy team.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-[.2em] text-slate-500 mb-2">First Name</label>
          <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Your name" className={inputStyle} />
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-[.2em] text-slate-500 mb-2">Email Address</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className={inputStyle} />
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-black uppercase tracking-[.2em] text-slate-500 mb-2">I want to...</label>
        <select
          value={selectedIntent}
          onChange={e => setSelectedIntent(e.target.value as IntentValue)}
          className={`${inputStyle} appearance-none cursor-pointer`}
        >
          {intentOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      {status === 'error' && <p className="text-rose-400 text-xs font-bold">Something went wrong — please try again.</p>}
      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold transition-colors disabled:opacity-50 disabled:pointer-events-none"
      >
        {status === 'loading' ? 'Submitting...' : 'Submit Interest'}
      </button>
    </form>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PhilanthropyPage() {
  const router = useRouter();

  const transactions = [
    { region: 'Scandinavia',  target: "St. Peter's Global", amt: '$4,250',  type: 'Outreach Grant'  },
    { region: 'Texas, USA',   target: 'Grace Sanctuary',    amt: '$1,800',  type: 'Emergency Aid'   },
    { region: 'Singapore',    target: 'Zion Hill',          amt: '$12,000', type: 'Expansion Fund'  },
  ];

  return (
    <div className="min-h-screen bg-[#0a1628] text-white antialiased overflow-x-hidden">
      <Navbar />
      <div className="pt-20">

        {/* Hero */}
        <section className="relative py-24 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/[.06] blur-[160px] rounded-full" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-500/[.04] blur-[140px] rounded-full" />
          </div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="max-w-3xl space-y-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-[10px] font-black uppercase tracking-[.14em] text-emerald-400">
                Global Giving Network
              </span>
              <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                A Bridge for <span className="text-emerald-400">Global Assistance.</span>
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
                The Church OS Giving Bridge connects verified ministries with global donors, international assistance programmes, and peer-to-peer spiritual aid — secured by the Global Church Registry Ledger.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => router.push('/platform/giving/')}
                  className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-8 h-14 rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
                >
                  Register Beneficiary <ArrowRight size={18} />
                </button>
                <button
                  onClick={() => router.push('/platform/audit/')}
                  className="inline-flex items-center justify-center gap-2 border border-white/20 text-white hover:bg-white/5 font-bold px-8 h-14 rounded-xl transition-colors"
                >
                  View Donation Ledger
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Three Ways to Participate */}
        <section className="border-t border-white/[.06] py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-12 space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/[.04] text-[10px] font-black uppercase tracking-[.14em] text-slate-300">
                Participation Pathways
              </span>
              <h2 className="text-4xl font-black text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Three Ways to Participate.
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: <HeartHandshake size={22} />,
                  colour: 'emerald',
                  title: 'Apply for Assistance',
                  desc: 'Register your ministry as a verified beneficiary. Receive funds from international donors, emergency aid programmes, and peer-to-peer giving initiatives.',
                  cta: 'Apply Now',
                  path: '/platform/giving/?intent=beneficiary',
                },
                {
                  icon: <Coins size={22} />,
                  colour: 'amber',
                  title: 'Become a Giving Partner',
                  desc: 'Connect your organisation with verified ministries globally. Sponsor a church plant, provide disaster relief, or set up a recurring assistance programme.',
                  cta: 'Partner With Us',
                  path: '/platform/giving/?intent=donor',
                },
                {
                  icon: <BookOpen size={22} />,
                  colour: 'blue',
                  title: 'Browse the Ledger',
                  desc: 'Full transparency is a core Church OS principle. View the verified giving ledger — every transaction, every ministry, publicly auditable at any time.',
                  cta: 'Open Ledger',
                  path: '/platform/audit/',
                },
              ].map((card, i) => {
                const colours: Record<string, string> = {
                  emerald: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20',
                  amber:   'border-amber-500/25 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20',
                  blue:    'border-blue-500/25 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20',
                };
                const iconBg: Record<string, string> = {
                  emerald: 'bg-emerald-500/10 text-emerald-400',
                  amber:   'bg-amber-500/10 text-amber-400',
                  blue:    'bg-blue-500/10 text-blue-400',
                };
                const btnColour: Record<string, string> = {
                  emerald: 'bg-emerald-500 hover:bg-emerald-400 text-white',
                  amber:   'bg-amber-500 hover:bg-amber-400 text-white',
                  blue:    'bg-blue-600 hover:bg-blue-500 text-white',
                };
                return (
                  <div key={i} className={`rounded-2xl border p-8 space-y-6 transition-all duration-200 ${colours[card.colour]}`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg[card.colour]}`}>
                      {card.icon}
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-xl font-black text-white">{card.title}</h3>
                      <p className="text-sm text-slate-400 leading-relaxed">{card.desc}</p>
                    </div>
                    <button
                      onClick={() => router.push(card.path)}
                      className={`w-full h-11 rounded-xl font-bold transition-colors text-sm ${btnColour[card.colour]}`}
                    >
                      {card.cta}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Trust Ledger Visual */}
        <section className="border-t border-white/[.06] py-24 bg-[#050d18]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
              <div className="space-y-8">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-[10px] font-black uppercase tracking-[.14em] text-emerald-400">
                  Trust Architecture
                </span>
                <h2 className="text-4xl font-black text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  Verified <span className="text-emerald-400">Trust Architecture.</span>
                </h2>
                <p className="text-lg text-slate-400 leading-relaxed">
                  The Church OS Registry Ledger is the trust backbone of the Giving Bridge. Every registered church undergoes a multi-point verification process before becoming eligible to receive or send funds.
                </p>
                <div className="space-y-5">
                  {[
                    { icon: <ShieldCheck size={18} />, title: 'Verified Trust Status', desc: 'On-chain verification builds instant credibility for international donors. No unverified entity can receive funds through the bridge.' },
                    { icon: <Globe size={18} />, title: 'Zero-Friction Grants',   desc: 'Automated assistance programmes for disaster relief and community expansion. No bureaucratic delay when communities need help most.' },
                    { icon: <Users size={18} />, title: 'Community Oversight',    desc: 'Every transaction is visible to the full registered community. Fraud and misuse are flagged and reviewed by Church OS PVT LTD.' },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="bg-emerald-500/10 p-2.5 rounded-xl h-fit shrink-0 text-emerald-500">{item.icon}</div>
                      <div>
                        <h4 className="font-black text-white">{item.title}</h4>
                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aid Network Live card */}
              <div className="relative">
                <div className="absolute -inset-6 bg-emerald-500/[.04] blur-[100px] rounded-full pointer-events-none" />
                <div className="relative rounded-2xl border border-white/[.08] bg-white/[.03] p-8 space-y-6 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black text-white">Aid Network Live</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mt-1">Real-time Transactions</p>
                    </div>
                    <span className="relative inline-flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                    </span>
                  </div>
                  <div className="space-y-3">
                    {transactions.map((tx, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[.02] border border-white/[.05] hover:border-emerald-500/20 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="bg-emerald-500/10 p-2 rounded-lg shrink-0">
                            <HeartHandshake className="h-4 w-4 text-emerald-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold text-slate-500 truncate">{tx.region} &rarr; {tx.target}</p>
                            <p className="text-sm font-black text-white">{tx.type}</p>
                          </div>
                        </div>
                        <span className="text-lg font-mono font-black text-emerald-400 shrink-0 ml-3">{tx.amt}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-white/[.05] text-center">
                    <button onClick={() => router.push('/platform/audit/')} className="text-[10px] font-black uppercase tracking-[.2em] text-slate-500 hover:text-emerald-400 transition-colors">
                      Secured by Church OS Registry Ledger &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interest Form */}
        <section className="border-t border-white/[.06] py-24">
          <div className="max-w-2xl mx-auto px-6">
            <div className="rounded-2xl border border-white/[.08] bg-white/[.02] p-10 space-y-8">
              <div className="text-center space-y-3">
                <h2 className="text-3xl font-black text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  Express Your Interest
                </h2>
                <p className="text-slate-400 text-sm">The Church OS Philanthropy team will follow up within 48 hours.</p>
              </div>
              <InterestForm />
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
