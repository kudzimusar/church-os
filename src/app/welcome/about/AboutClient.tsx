
'use client';

import { CheckCircle2 } from 'lucide-react';

export default function AboutClient() {
  const beliefs = [
    "The Trinity: Father, Son, and Holy Spirit",
    "Jesus is God manifest in the flesh",
    "Jesus is the only way to the Father",
    "The Word of God is infallible and living",
    "Sin separates us from God and requires repentance",
    "Salvation is by faith in Christ through grace",
    "Baptism demonstrates our association with the death and resurrection of Christ",
    "All gifts of the Spirit (e.g., healing, speaking in tongues)",
    "Holy communion is to be observed to remember the sacrifice of Christ",
    "Giving tithes and offerings",
    "Each person has a purpose and mission to fulfill on earth",
    "The second coming of Christ"
  ];

  const outreach = [
    { title: "Akiramenai Homeless Program", desc: "Rehabilitating and supporting homeless individuals in Tokyo." },
    { title: "Food Pantry", desc: "Providing food support to those in need in our community." },
    { title: "Gospel Music Workshop", desc: "Using music as a bridge to share the Gospel across cultures." }
  ];

  return (
    <div className="pt-16 min-h-screen bg-[oklch(0.08_0.04_255)] text-white">
      <section className="relative py-32 px-6 flex items-center justify-center overflow-hidden bg-black/40">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[var(--primary)] blur-[120px] rounded-full opacity-10" />
        </div>
        <div className="relative z-10 text-center space-y-4">
          <p className="text-[10px] font-black tracking-[0.4em] text-white/40 uppercase">OUR STORY · OUR BELIEFS · OUR MISSION</p>
          <h1 className="text-5xl md:text-7xl font-sans leading-none font-black uppercase tracking-tight">
            <span className="font-serif italic font-medium pr-4 normal-case text-white/90">About</span> Us
          </h1>
          <nav className="flex justify-center gap-2 text-[10px] font-black tracking-widest text-white/30 uppercase pt-6">
            <span className="text-[var(--primary)]">Welcome</span>
            <span>/</span>
            <span>About Us</span>
          </nav>
        </div>
      </section>

      <div className="max-w-screen-xl mx-auto px-6 py-24 space-y-32">
        <section className="grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <div className="space-y-2">
              <p className="text-[10px] font-black tracking-[0.4em] text-[var(--primary)] opacity-60 uppercase">THE BEGINNING</p>
              <h2 className="text-4xl md:text-5xl font-black italic font-serif">A Vision for Japan</h2>
            </div>
            <div className="space-y-6 text-white/60 text-lg leading-relaxed font-medium">
              <p>In 2017, Japan Kingdom Church held its first service in Pastor Marcel's living room...</p>
              <p>Recognizing the need to further support the community, Pastor Marcel envisioned a church facility...</p>
              <p>Since then, Japan Kingdom Church has rehabilitated over a dozen homeless individuals...</p>
            </div>
          </div>
          <div className="relative aspect-square glass rounded-[3rem] border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center text-white/20 font-black">IMAGE</div>
        </section>

        <section className="grid md:grid-cols-2 gap-8">
          <div className="glass rounded-[3rem] p-12 border border-white/10 border-l-4 border-l-[var(--primary)] space-y-6 bg-white/5">
            <p className="text-[10px] font-black tracking-[0.3em] text-[var(--primary)] uppercase">OUR VISION</p>
            <p className="text-3xl font-black italic font-serif leading-tight">"To Make a Difference In Japan and Around the World Together!"</p>
          </div>
          <div className="glass rounded-[3rem] p-12 border border-white/10 border-l-4 border-l-indigo-400 space-y-6 bg-white/5">
            <p className="text-[10px] font-black tracking-[0.3em] text-indigo-400 uppercase">OUR MISSION</p>
            <p className="text-3xl font-black italic font-serif leading-tight">"We exist to build a strong Christian community that represents Christ to society."</p>
          </div>
        </section>

        <section className="space-y-12 bg-white/5 rounded-[4rem] p-12 md:p-20 border border-white/5 shadow-2xl">
          <div className="text-center space-y-4">
            <p className="text-[10px] font-black tracking-[0.4em] text-[var(--primary)] opacity-60 uppercase">WHAT WE BELIEVE</p>
            <h2 className="text-4xl md:text-6xl font-black italic font-serif">Statement of Faith</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 pt-10">
            {beliefs.map((belief, idx) => (
              <div key={idx} className="flex gap-4 items-start group">
                <div className="mt-1 w-6 h-6 rounded-full bg-[var(--primary)]/10 flex items-center justify-center shrink-0 border border-[var(--primary)]/20 group-hover:bg-[var(--primary)] group-hover:text-white transition-all"><CheckCircle2 className="w-4 h-4 text-[var(--primary)] group-hover:text-white" /></div>
                <p className="text-white/80 font-bold leading-relaxed">{belief}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
