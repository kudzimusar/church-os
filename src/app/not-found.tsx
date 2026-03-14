'use client';
import Link from 'next/link';
import { basePath as BP } from '@/lib/utils';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[oklch(0.08_0.04_255)] text-white
                    flex flex-col items-center justify-center text-center px-6">
      <div className="space-y-8 max-w-lg">
        <p className="text-[10px] font-black tracking-[0.4em] text-white/20 uppercase">
          404
        </p>
        <h1 className="text-6xl md:text-8xl font-black leading-none">
          Page Not <span className="font-serif italic font-medium">Found</span>
        </h1>
        <p className="text-white/40 text-lg leading-relaxed font-medium">
          The page you are looking for does not exist or may have moved.
        </p>
        <Link
          href="/welcome"
          className="inline-flex items-center gap-2 bg-[var(--primary)] text-white
                     font-black px-10 py-4 rounded-full text-sm tracking-[0.2em]
                     uppercase hover:scale-105 transition-all"
        >
          BACK TO HOME
        </Link>
      </div>
    </div>
  );
}
