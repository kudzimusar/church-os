
'use client';

import { useState } from 'react';

const AMOUNTS = [1000, 3000, 5000, 10000];

export default function GiveClient() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');

  return (
    <div className="pt-16 min-h-screen bg-[oklch(0.08_0.04_255)] text-white">
      <section className="relative py-32 px-6 flex items-center justify-center overflow-hidden bg-black/40">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[var(--primary)] blur-[120px] rounded-full opacity-10" />
        </div>
        <div className="relative z-10 text-center space-y-4">
          <p className="text-[10px] font-black tracking-[0.4em] text-white/40 uppercase">SUPPORTING THE MISSION</p>
          <h1 className="text-5xl md:text-7xl font-sans leading-none font-black uppercase tracking-tight">
            <span className="font-serif italic font-medium pr-4 normal-case text-white/90">Give</span> Online
          </h1>
          <nav className="flex justify-center gap-2 text-[10px] font-black tracking-widest text-white/30 uppercase pt-6">
            <span className="text-[var(--primary)]">Welcome</span>
            <span>/</span>
            <span>Give</span>
          </nav>
        </div>
      </section>

      <div className="max-w-screen-xl mx-auto px-6 py-24 space-y-32">
        <section className="grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <div className="space-y-2">
              <p className="text-[10px] font-black tracking-[0.4em] text-[var(--primary)] opacity-60 uppercase">WORSHIP THROUGH GIVING</p>
              <h2 className="text-4xl md:text-6xl font-black italic font-serif">Why we give</h2>
            </div>
            <div className="space-y-6 text-white/60 text-lg leading-relaxed font-bold">
              <p>Giving is an act of worship. At Japan Kingdom Church, your generosity directly supports our mission.</p>
            </div>
          </div>
          <div className="glass rounded-[4rem] p-12 border border-white/5 bg-white/5 space-y-8 shadow-2xl relative overflow-hidden">
             <div className="relative space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   {AMOUNTS.map(amount => (
                     <button key={amount} onClick={() => { setSelectedAmount(amount); setCustomAmount(''); }} className={`py-4 rounded-2xl font-black transition-all active:scale-95 ${selectedAmount === amount ? 'bg-[var(--primary)] text-white' : 'bg-white/5 border border-white/10 text-white/60 hover:border-white/20'}`}>¥{amount.toLocaleString()}</button>
                   ))}
                </div>
                <input type="number" placeholder="Enter custom amount (¥)" value={customAmount} onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/20 outline-none" />
                <a href="https://japankingdomchurch.com/give" target="_blank" rel="noopener noreferrer" className="w-full bg-[var(--primary)] text-white font-black py-5 rounded-2xl text-xs tracking-[0.3em] text-center flex items-center justify-center">GIVE NOW →</a>
             </div>
          </div>
        </section>
      </div>
    </div>
  );
}
