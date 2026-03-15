'use client';
import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export function PublicThemeWrapper({
  children
}: {
  children: React.ReactNode
}) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('jkc-public-theme');
    if (saved) setIsDark(saved === 'dark');
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('jkc-public-theme', next ? 'dark' : 'light');
  };

  return (
    <div
      data-theme={isDark ? 'dark' : 'light'}
      style={{
        '--primary': isDark
          ? 'oklch(0.65 0.25 260)'
          : 'oklch(0.35 0.20 245)',
        '--primary-foreground': 'oklch(0.98 0 0)',
      } as React.CSSProperties}
      className={isDark ? 'jkc-dark' : 'jkc-light'}
    >
      <style>{`/* ── DARK MODE ── */
        .jkc-dark {
          background: oklch(0.08 0.04 255);
          color: white;
          min-height: 100vh;
        }
        .jkc-dark nav {
          background: rgba(0,0,0,0.85) !important;
          border-color: rgba(255,255,255,0.1) !important;
        }
        .jkc-dark footer {
          background: rgba(0,0,0,0.4) !important;
          border-color: rgba(255,255,255,0.1) !important;
          color: white;
        }

        /* ── LIGHT MODE BASE ── */
        .jkc-light {
          background: #f8f9ff;
          color: #0f172a;
          min-height: 100vh;
        }

        /* Navigation — white with shadow */
        .jkc-light nav {
          background: rgba(255,255,255,0.98) !important;
          border-color: rgba(0,0,0,0.06) !important;
          box-shadow: 0 1px 20px rgba(0,0,0,0.06) !important;
        }
        .jkc-light nav a,
        .jkc-light nav button,
        .jkc-light nav span {
          color: #1e3a8a !important;
        }
        .jkc-light nav a:hover {
          color: var(--primary) !important;
        }

        /* Headings */
        .jkc-light h1, .jkc-light h2, .jkc-light h3 {
          color: #1e3a8a !important;
        }
        .jkc-light h4, .jkc-light h5, .jkc-light h6 {
          color: #1e40af !important;
        }
        .jkc-light p {
          color: #334155 !important;
        }

        /* ── SECTION COLOR BANDS ──
           Each major section gets a distinct warm or cool tint
           to break up the flat single-color look */

        /* Mission strip — warm cream/gold */
        .jkc-light section:nth-of-type(2) {
          background: linear-gradient(135deg, #fef9ec 0%, #fff8e1 100%) !important;
        }
        .jkc-light section:nth-of-type(2) p,
        .jkc-light section:nth-of-type(2) h2 {
          color: #92400e !important;
        }

        /* Sermon section — light teal/mint */
        .jkc-light section:nth-of-type(3) {
          background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%) !important;
        }

        /* Testimonies — soft lavender */
        .jkc-light section:nth-of-type(4) {
          background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%) !important;
        }

        /* NewHere — warm white */
        .jkc-light section:nth-of-type(5) {
          background: #ffffff !important;
        }

        /* Ministries — light amber/gold band */
        .jkc-light section:nth-of-type(6) {
          background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 60%, #fde68a 100%) !important;
          border-color: rgba(245,158,11,0.2) !important;
        }
        .jkc-light section:nth-of-type(6) h2 {
          color: #92400e !important;
        }

        /* Events — light blue */
        .jkc-light section:nth-of-type(7) {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
        }

        /* Schedule — navy dark band (keep dark for contrast) */
        .jkc-light section:nth-of-type(8) {
          background: #1e3a8a !important;
          color: white !important;
        }
        .jkc-light section:nth-of-type(8) h2,
        .jkc-light section:nth-of-type(8) h3,
        .jkc-light section:nth-of-type(8) p {
          color: white !important;
        }
        .jkc-light section:nth-of-type(8) [class*="text-white"] {
          color: white !important;
        }

        /* Directions — warm grey */
        .jkc-light section:nth-of-type(9) {
          background: #f8fafc !important;
        }

        /* Connect form — light gold accent */
        .jkc-light section:nth-of-type(10) {
          background: linear-gradient(135deg, #fef9ec 0%, #ffffff 100%) !important;
        }

        /* ── GLASS CARDS ── */
        .jkc-light .glass,
        .jkc-light [class*="glass"] {
          background: rgba(255,255,255,0.85) !important;
          border-color: rgba(0,0,0,0.08) !important;
          backdrop-filter: blur(12px);
          box-shadow: 0 4px 24px rgba(0,0,0,0.06);
        }

        /* Ministry cards — warm white with gold hover */
        .jkc-light section:nth-of-type(6) [class*="bg-white"] {
          background: rgba(255,255,255,0.9) !important;
          border-color: rgba(245,158,11,0.2) !important;
        }
        .jkc-light section:nth-of-type(6) [class*="bg-white"]:hover {
          border-color: rgba(245,158,11,0.5) !important;
          box-shadow: 0 8px 32px rgba(245,158,11,0.12) !important;
        }

        /* ── TEXT OVERRIDES ── */
        .jkc-light [class*="text-white\\/90"],
        .jkc-light [class*="text-white\\/80"] {
          color: #1e3a8a !important;
        }
        .jkc-light [class*="text-white\\/70"],
        .jkc-light [class*="text-white\\/60"],
        .jkc-light [class*="text-white\\/50"] {
          color: #475569 !important;
        }
        .jkc-light [class*="text-white\\/40"],
        .jkc-light [class*="text-white\\/30"],
        .jkc-light [class*="text-white\\/20"] {
          color: #94a3b8 !important;
        }
        .jkc-light [class*="text-white"]:not([class*="text-white\\/"]) {
          color: #1e3a8a !important;
        }

        /* ── BORDERS ── */
        .jkc-light [class*="border-white\\/10"],
        .jkc-light [class*="border-white\\/5"] {
          border-color: rgba(0,0,0,0.07) !important;
        }
        .jkc-light [class*="border-white\\/20"] {
          border-color: rgba(0,0,0,0.1) !important;
        }

        /* ── BACKGROUNDS ── */
        .jkc-light [class*="bg-black\\/"] {
          background: rgba(255,255,255,0.7) !important;
        }
        .jkc-light [class*="bg-white\\/5"] {
          background: rgba(0,0,0,0.03) !important;
        }
        .jkc-light [class*="bg-white\\/10"] {
          background: rgba(0,0,0,0.05) !important;
        }

        /* ── INPUTS ── */
        .jkc-light input,
        .jkc-light textarea,
        .jkc-light select {
          background: white !important;
          color: #0f172a !important;
          border-color: rgba(0,0,0,0.12) !important;
        }
        .jkc-light input::placeholder,
        .jkc-light textarea::placeholder {
          color: #94a3b8 !important;
        }

        /* ── FOOTER — stays navy dark ── */
        .jkc-light footer {
          background: #1e3a8a !important;
          color: white !important;
        }
        .jkc-light footer p,
        .jkc-light footer a,
        .jkc-light footer h4,
        .jkc-light footer h5,
        .jkc-light footer span,
        .jkc-light footer [class*="text-white"] {
          color: rgba(255,255,255,0.8) !important;
        }
        .jkc-light footer a:hover {
          color: white !important;
        }
        .jkc-light footer [class*="text-[var(--primary)]"] {
          color: #93c5fd !important;
        }

        /* ── SERVICE SCHEDULE CARDS ── */
        .jkc-light section:nth-of-type(8) [class*="glass"],
        .jkc-light section:nth-of-type(8) [class*="rounded"] {
          background: rgba(255,255,255,0.1) !important;
          border-color: rgba(255,255,255,0.2) !important;
        }
        .jkc-light section:nth-of-type(8) [class*="text-\\[var\\(--primary\\)\\]"] {
          color: #fbbf24 !important;
        }

        /* ── PRIMARY COLOR TEXT — always stays primary ── */
        .jkc-light [class*="text-\\[var\\(--primary\\)\\]"] {
          color: var(--primary) !important;
        }

        /* ── BUTTONS ── */
        .jkc-light [class*="border-white\\/30"] {
          border-color: rgba(30,58,138,0.3) !important;
          color: #1e3a8a !important;
        }
        .jkc-light [class*="border-white\\/30"]:hover {
          border-color: rgba(30,58,138,0.6) !important;
        }

        /* ── LABEL UPPERCASE TRACKING TEXT ── */
        .jkc-light [class*="tracking-\\[0\\.4em\\]"],
        .jkc-light [class*="tracking-widest"] {
          color: #64748b !important;
        }
        .jkc-light [class*="text-\\[var\\(--primary\\)\\)\\]"][class*="tracking"] {
          color: var(--primary) !important;
        }

        /* ── HERO — always keeps photo + dark overlay ── */
        .jkc-light section[class*="min-h-screen"] {
          background: none !important;
        }
        .jkc-light section[class*="min-h-screen"] h1 span:last-child {
          color: var(--primary) !important;
        }
        .jkc-light section[class*="min-h-screen"] h1 span:first-child,
        .jkc-light section[class*="min-h-screen"] p {
          color: rgba(255,255,255,0.85) !important;
        }
        
        .jkc-light [data-section="mission"] {
          background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%) !important;
        }
        .jkc-light [data-section="mission"] p {
          color: rgba(255,255,255,0.95) !important;
        }

        /* New Here cards — warm teal and amber in light mode */
        .jkc-light [data-card="visitor"] {
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%) !important;
          border-color: rgba(16,185,129,0.3) !important;
        }
        .jkc-light [data-card="visitor"] h2 {
          color: #065f46 !important;
        }
        .jkc-light [data-card="member"] {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
          border-color: rgba(59,130,246,0.3) !important;
        }
        .jkc-light [data-card="member"] h2 {
          color: #1e3a8a !important;
        }
      `}</style>

      {/* Theme toggle */}
      <button
        onClick={toggle}
        style={{
          position: 'fixed',
          bottom: '5rem',
          right: '1.5rem',
          zIndex: 9998,
          width: '2.5rem',
          height: '2.5rem',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.15)',
          background: isDark ? 'rgba(255,255,255,0.1)' : 'white',
          color: isDark ? 'white' : '#0f172a',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        aria-label="Toggle theme"
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      {children}
    </div>
  );
}
