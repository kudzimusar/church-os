'use client';

import Link from 'next/link';

export default function QRScanPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6 pt-24">
      <div className="max-w-md w-full card-surface rounded-[3rem] p-12 border border-[var(--border)] shadow-2xl text-center space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 blur-[100px] rounded-full bg-[var(--jkc-gold)] opacity-10 pointer-events-none" />
        
        <div className="space-y-4">
          <p className="text-[10px] font-black tracking-[0.4em] text-[var(--jkc-gold)] uppercase">JAPAN KINGDOM CHURCH</p>
          <h1 className="text-4xl font-black uppercase text-[var(--foreground)] leading-tight">
            Connect <br />
            <span className="font-serif italic font-medium normal-case">with us</span>
          </h1>
          <p className="text-sm font-medium text-[var(--muted-foreground)]">
            Scan below or click the button to open the Digital Connect Card. Let us know you are here!
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl mx-auto inline-block border-4 border-slate-100 shadow-inner">
          {/* We use a placeholder image for the QR, or an external generation API */}
          {/* Since they want to use this to scan the form which is at /welcome/visit, we generate the QR using a public API. */}
          <img 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://kudzimusar.github.io/jkc/welcome/visit&color=1B3A6B`} 
            alt="Scan to access Visitor Form"
            className="w-48 h-48 sm:w-64 sm:h-64 rounded-xl"
          />
        </div>

        <div className="space-y-4 pt-4">
          <Link
            href="/welcome/visit"
            className="block w-full py-4 rounded-full bg-[var(--jkc-navy)] text-white font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[var(--jkc-navy)]/30"
          >
            Open Connect Card
          </Link>
          <Link
            href="/welcome"
            className="block text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
