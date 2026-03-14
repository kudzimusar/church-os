'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-[var(--primary)] blur-[120px] rounded-full opacity-20"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-indigo-500 blur-[120px] rounded-full opacity-20"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </div>

      <div className="relative z-10 max-w-screen-xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <p className="text-[10px] font-black tracking-[0.4em] text-white/40 uppercase">
            JAPAN KINGDOM CHURCH · TOKYO, JAPAN
          </p>

          <h1 className="flex flex-col gap-2">
            <span className="text-4xl md:text-6xl font-serif italic text-white/90">
              Welcome to
            </span>
            <span className="text-6xl md:text-9xl font-black uppercase tracking-tighter text-[var(--primary)] leading-none">
              Japan Kingdom <br className="hidden md:block" /> Church
            </span>
          </h1>

          <p className="text-xs md:text-base font-bold tracking-[0.2em] text-white/60 uppercase max-w-2xl mx-auto mt-4">
            Building a Strong Christian Community that represents Christ to Japanese Society
          </p>

          <div className="inline-flex glass-card rounded-full px-8 py-3 text-[10px] md:text-xs font-black tracking-widest text-white/80 border border-white/10 mt-8 mb-4 backdrop-blur-md bg-white/5">
            SUNDAYS · PRAYER 9:30AM · SERVICE 10:30AM JST
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-10">
            <Link 
              href="#visit"
              className="w-full sm:w-auto bg-[var(--primary)] text-white font-black px-10 py-5 rounded-full text-xs tracking-[0.2em] shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all text-center"
            >
              NEW HERE?
            </Link>
            <a 
              href="https://youtube.com/japankingdomchurch" 
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto border border-white/20 text-white font-black px-10 py-5 rounded-full text-xs tracking-[0.2em] hover:bg-white/5 hover:border-white/40 active:scale-95 transition-all text-center"
            >
              WATCH LIVE
            </a>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span className="text-[8px] font-black tracking-[0.3em] text-white/20 uppercase">SCROLL</span>
        <div className="w-px h-12 bg-gradient-to-b from-white/40 to-transparent" />
      </motion.div>
    </section>
  );
}
