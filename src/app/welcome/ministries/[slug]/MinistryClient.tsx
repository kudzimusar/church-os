
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Loader2, Send } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

type Ministry = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  leader_name?: string;
};

const fallbacks: Ministry[] = [
  { name: "Children's Ministry", slug: "kids-ministry",
    description: "Nurturing the next generation in faith." },
  { name: "Youth Ministry", slug: "youth-ministry",
    description: "Empowering young people to live for Christ." },
  { name: "Worship Ministry", slug: "worship-ministry",
    description: "Leading the congregation into God's presence." },
  { name: "Women's Ministry", slug: "womens-ministry",
    description: "Equipping women to walk in purpose and grace." },
  { name: "Men's Ministry", slug: "mens-ministry",
    description: "Building men of faith, character, and vision." },
  { name: "Language School", slug: "language-school",
    description: "Kingdom Language School — bridging cultures." }
];

export default function MinistryClient({ slug }: { slug: string }) {
  const [ministry, setMinistry] = useState<Ministry | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  useEffect(() => {
    async function fetchMinistry() {
      const { data } = await supabase
        .from('ministries')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (data) {
        setMinistry(data);
      } else {
        const fallback = fallbacks.find(f => f.slug === slug);
        setMinistry(fallback || null);
      }
      setLoading(false);
    }
    fetchMinistry();
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const fullMessage = `Ministry Interest: ${ministry?.name} — ${formData.message}`;

    const { error } = await supabase
      .from('public_inquiries')
      .insert([{
        name: formData.name,
        email: formData.email,
        message: fullMessage
      }]);

    if (error) {
      toast.error('Failed to send inquiry');
    } else {
      toast.success('Interest sent! We will contact you soon.');
      setFormData({ name: '', email: '', message: '' });
    }
    setSubmitting(false);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center pt-20">
      <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
    </div>
  );

  if (!ministry) return (
     <div className="min-h-screen flex flex-col items-center justify-center pt-20 space-y-6">
        <h1 className="text-4xl font-black">Ministry Not Found</h1>
        <Link href="/welcome" className="text-[var(--primary)] font-black uppercase tracking-widest">Back to Home</Link>
     </div>
  );

  return (
    <div className="min-h-screen pt-16 bg-[oklch(0.08_0.04_255)] text-white">
      {/* Hero Strip */}
      <section className="relative py-32 px-6 flex items-center justify-center overflow-hidden bg-black/40 border-b border-white/5">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[var(--primary)] blur-[120px] rounded-full opacity-10" />
        </div>
        <div className="relative z-10 text-center space-y-4">
          <Link href="/welcome" className="inline-flex items-center gap-2 text-[10px] font-black tracking-[0.4em] text-white/30 uppercase hover:text-[var(--primary)] transition-colors mb-6">
            <ChevronLeft className="w-4 h-4" /> BACK TO HOME
          </Link>
          <h1 className="text-5xl md:text-7xl font-sans leading-none font-black uppercase tracking-tight">
             {ministry.name}
          </h1>
          <p className="text-white/40 text-lg max-w-2xl mx-auto italic font-medium pt-4">
             {ministry.description}
          </p>
        </div>
      </section>

      <div className="max-w-screen-xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
          {/* Details Content */}
          <div className="space-y-12">
            <div className="space-y-6">
               <h2 className="text-3xl font-black italic">About this ministry</h2>
               <p className="text-white/60 leading-relaxed text-lg font-medium">
                  {ministry.description} Our {ministry.name} is a vital part of our community. 
                  We believe in building a strong foundation of faith and providing a space where 
                  everyone can grow and serve according to their gifts.
               </p>
               {ministry.leader_name && (
                 <div className="pt-6">
                    <p className="text-[10px] font-black tracking-widest text-white/30 uppercase">LEAD BY</p>
                    <p className="text-xl font-black">{ministry.leader_name}</p>
                 </div>
               )}
            </div>

            <div className="grid grid-cols-2 gap-6">
               <div className="glass rounded-3xl p-8 space-y-2 border border-white/5">
                  <p className="text-[10px] font-black tracking-widest text-[var(--primary)] uppercase">MEETS</p>
                  <p className="text-lg font-black italic">Weekly</p>
               </div>
               <div className="glass rounded-3xl p-8 space-y-2 border border-white/5">
                  <p className="text-[10px] font-black tracking-widest text-[var(--primary)] uppercase">OPEN TO</p>
                  <p className="text-lg font-black italic">Everyone</p>
               </div>
            </div>
          </div>

          {/* Inquiry Form */}
          <div className="glass rounded-[3rem] p-12 border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/10 blur-3xl rounded-full" />
            <div className="relative space-y-8">
              <div className="space-y-2 text-center">
                 <h2 className="text-3xl font-black">Join this Ministry</h2>
                 <p className="text-white/40 text-sm italic font-medium">Interested in serving? Let us know.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest text-white/30 uppercase ml-1">Full Name</label>
                  <input 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-5 text-white placeholder:text-white/20 focus:border-[var(--primary)]/50 transition-all outline-none"
                    placeholder="Your Name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest text-white/30 uppercase ml-1">Email Address</label>
                  <input 
                    required
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-5 text-white placeholder:text-white/20 focus:border-[var(--primary)]/50 transition-all outline-none"
                    placeholder="you@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest text-white/30 uppercase ml-1">Message</label>
                  <textarea 
                    required
                    value={formData.message}
                    onChange={e => setFormData({...formData, message: e.target.value})}
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-5 text-white placeholder:text-white/20 focus:border-[var(--primary)]/50 transition-all outline-none resize-none"
                    placeholder="Tell us a bit about why you'd like to join..."
                  />
                </div>

                <button 
                  disabled={submitting}
                  className="w-full bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white font-black py-6 rounded-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-2xl shadow-primary/20"
                >
                  {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Send className="w-5 h-5" /> SEND INTEREST</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
