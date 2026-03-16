'use client';
import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export function PublicThemeWrapper({
  children
}: {
  children: React.ReactNode
}) {
  const [isDark, setIsDark] = useState(false);

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
        '--primary': isDark ? 'oklch(0.65 0.25 260)' : '#1b3a6b',
        '--gold': '#f5a623',
        '--primary-foreground': 'oklch(0.98 0 0)',
      } as React.CSSProperties}
      className={isDark ? 'jkc-dark' : 'jkc-light'}
    >
      <style>{`/* ═══ DARK MODE (unchanged) ═══ */
.jkc-dark {
  background: #0d1b2e;
  color: white;
  min-height: 100vh;
}
.jkc-dark nav {
  background: rgba(13,27,46,0.92) !important;
  border-color: rgba(255,255,255,0.08) !important;
  backdrop-filter: blur(20px);
}
.jkc-dark footer {
  background: rgba(0,0,0,0.5) !important;
  color: white;
}
.jkc-dark .wave-cream { fill: #0d1b2e !important; }
.jkc-dark .wave-navy { fill: #0d1b2e !important; }
.jkc-dark .wave-gold { fill: #0d1b2e !important; }

/* ═══ LIGHT MODE — JKC Gold & Navy ═══ */
.jkc-light {
  background: #fef8ec;
  color: #0d1b2e;
  min-height: 100vh;
}

/* Nav — crisp white */
.jkc-light nav {
  background: rgba(255,255,255,0.97) !important;
  border-color: rgba(0,0,0,0.06) !important;
  box-shadow: 0 2px 24px rgba(27,58,107,0.08) !important;
}
.jkc-light nav a, 
.jkc-light nav [class*="text-white"] { color: #1b3a6b !important; font-weight: 900; }
.jkc-light nav a:hover { color: #f5a623 !important; }
.jkc-light nav button:not([aria-label]) { color: #1b3a6b !important; }
.jkc-light nav div[class*="glass"] { border-color: rgba(27,58,107,0.2) !important; }
.jkc-light nav span[class*="text-white"] { color: #1b3a6b !important; }


/* Global text */
.jkc-light h1, .jkc-light h2, .jkc-light h3 { color: #1b3a6b !important; }
.jkc-light h4, .jkc-light h5, .jkc-light h6 { color: #1b3a6b !important; }
.jkc-light p { color: #334155 !important; }

/* White-opacity text → navy */
.jkc-light [class*="text-white\\/90"],
.jkc-light [class*="text-white\\/80"],
.jkc-light [class*="text-white"]:not([class*="text-white\\/"]) { color: #1b3a6b !important; }
.jkc-light [class*="text-white\\/70"],
.jkc-light [class*="text-white\\/60"],
.jkc-light [class*="text-white\\/50"] { color: #334155 !important; }
.jkc-light [class*="text-white\\/40"],
.jkc-light [class*="text-white\\/30"],
.jkc-light [class*="text-white\\/20"] { color: #64748b !important; }

/* ── DARK ISLANDS (Stay dark in light mode) ── */
.jkc-light [data-section="give-video"],
.jkc-light [data-section="give-partner"],
.jkc-light [data-section="testimonies"],
.jkc-light [data-section="schedule"],
.jkc-light footer {
    color: white !important;
}

.jkc-light [data-section="give-video"] *,
.jkc-light [data-section="give-partner"] *,
.jkc-light [data-section="testimonies"] *,
.jkc-light [data-section="schedule"] *,
.jkc-light footer * {
    color: inherit !important;
}

.jkc-light [data-section="give-video"] p,
.jkc-light [data-section="give-partner"] p,
.jkc-light [data-section="testimonies"] p,
.jkc-light [data-section="schedule"] p,
.jkc-light footer p {
    color: rgba(255,255,255,0.7) !important;
}

.jkc-light [data-section="give-video"] h1, .jkc-light [data-section="give-video"] h2, .jkc-light [data-section="give-video"] h3,
.jkc-light [data-section="give-partner"] h1, .jkc-light [data-section="give-partner"] h2, .jkc-light [data-section="give-partner"] h3,
.jkc-light [data-section="testimonies"] h1, .jkc-light [data-section="testimonies"] h2, .jkc-light [data-section="testimonies"] h3,
.jkc-light [data-section="schedule"] h1, .jkc-light [data-section="schedule"] h2, .jkc-light [data-section="schedule"] h3,
.jkc-light footer h1, .jkc-light footer h2, .jkc-light footer h3, .jkc-light footer h4 {
    color: white !important;
}

/* Primary always navy blue */
.jkc-light [class*="text-[var(--primary)]"] { color: #1b3a6b !important; }
.jkc-light [class*="bg-[var(--primary)]"] { background: #1b3a6b !important; }

/* Borders */
.jkc-light [class*="border-white\\/10"],
.jkc-light [class*="border-white\\/5"] { border-color: rgba(27,58,107,0.1) !important; }
.jkc-light [class*="border-white\\/20"] { border-color: rgba(27,58,107,0.15) !important; }

/* Backgrounds */
  .jkc-light [class*="bg-black\\/20"],
  .jkc-light [class*="bg-black\\/30"] {
    background: rgba(27,58,107,0.04) !important;
  }
  /* Do NOT override bg-black/40, bg-black/50, bg-black/60 
     as these are used for overlays on dark sections */
.jkc-light [class*="bg-white\\/5"] { background: rgba(27,58,107,0.04) !important; }
.jkc-light [class*="bg-white\\/10"] { background: rgba(27,58,107,0.06) !important; }

/* Glass cards - refined for light mode */
.jkc-light .glass,
.jkc-light [class*="glass-card"] {
  background: rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: blur(16px) !important;
  border-color: rgba(27, 58, 107, 0.08) !important;
  box-shadow: 
    0 4px 6px -1px rgba(27, 58, 107, 0.05),
    0 10px 15px -3px rgba(27, 58, 107, 0.1) !important;
}

/* Inputs */
.jkc-light input, .jkc-light textarea, .jkc-light select {
  background: white !important;
  color: #0d1b2e !important;
  border-color: rgba(27,58,107,0.15) !important;
}
.jkc-light input::placeholder, .jkc-light textarea::placeholder {
  color: #94a3b8 !important;
}

/* Buttons — outline style */
.jkc-light [class*="border-white\\/20"],
.jkc-light [class*="border-white\\/30"] {
  border-color: rgba(27,58,107,0.25) !important;
  color: #1b3a6b !important;
}

/* Hero — always keeps dark overlay regardless of theme */
.jkc-light section[class*="min-h-screen"]:not([data-section]),
.jkc-light [data-section="hero"] { 
    background: none !important; 
}
.jkc-light section[class*="min-h-screen"]:not([data-section]) [class*="text-white"],
.jkc-light [data-section="hero"] [class*="text-white"] { 
    color: white !important; 
}
.jkc-light section[class*="min-h-screen"]:not([data-section]) p,
.jkc-light [data-section="hero"] p { 
    color: rgba(255,255,255,0.7) !important; 
}

/* ── SECTION PERSONALITIES ── */

/* Give Page - Hero */
.jkc-light [data-section="give-hero"] {
    background: linear-gradient(180deg, #fff9f0 0%, #fef8ec 100%) !important;
}
.jkc-light [data-section="give-hero"] h1,
.jkc-light [data-section="give-hero"] p,
.jkc-light [data-section="give-hero"] span { color: #1b3a6b !important; }
.jkc-light [data-section="give-hero"] [class*="text-[var(--primary)]"] { color: #f5a623 !important; }

/* Give Page - Video (Dark Island) */
.jkc-light [data-section="give-video"] {
    background: #0d1b2e !important;
}

/* Give Page - Legal */
.jkc-light [data-section="give-legal"] {
    background: white !important;
}

/* Give Page - Online */
.jkc-light [data-section="give-online"] {
    background: white !important;
}

/* Give Page - US Options */
.jkc-light [data-section="give-us"] {
    background: #fbf9f4 !important;
}

/* Give Page - Domestic (MUFG) */
.jkc-light [data-section="give-domestic"] {
    background: #fffcfc !important;
}
.jkc-light [data-section="give-domestic"] h2 { color: #991b1b !important; }

/* Give Page - Impact */
.jkc-light [data-section="give-impact"] {
    background: white !important;
}

/* Give Page - Partner (Dark Island) */
.jkc-light [data-section="give-partner"] {
    background: linear-gradient(135deg, #1b3a6b 0%, #1e40af 100%) !important;
}
.jkc-light [data-section="give-partner"] span { color: #f5a623 !important; }

/* About Page - Hero (Light/Cream) */
.jkc-light [data-section="about-hero"] {
    background: #fff9f0 !important;
}
.jkc-light [data-section="about-hero"] h1,
.jkc-light [data-section="about-hero"] p,
.jkc-light [data-section="about-hero"] span { color: #1b3a6b !important; }
.jkc-light [data-section="about-hero"] .bg-black\/40 { background: none !important; }

/* About Page - History */
.jkc-light [data-section="about-history"] {
    background: #fef8ec !important;
}

/* About Page - Vision/Mission */
.jkc-light [data-section="about-vision"] {
    background: white !important;
}

/* About Page - Outreach */
.jkc-light [data-section="about-outreach"] {
    background: #fdfaf3 !important;
}

/* About Page - Beliefs */
.jkc-light [data-section="about-beliefs"] {
    background: white !important;
}

/* MissionStrip — full gold */
.jkc-light [data-section="mission"] {
  background: #f5a623 !important;
}
.jkc-light [data-section="mission"] p,
.jkc-light [data-section="mission"] span {
  color: #1b3a6b !important;
}

/* SermonSection — cream white */
.jkc-light [data-section="sermon"] {
  background: #fffdf7 !important;
}

/* TestimoniesSection — navy full-bleed */
.jkc-light [data-section="testimonies"] {
  background: #1b3a6b !important;
}

/* MinistriesSection — warm gold band */
.jkc-light [data-section="ministries"] {
  background: linear-gradient(160deg, #fef3c7 0%, #fde68a 100%) !important;
}
.jkc-light [data-section="ministries"] h2 { color: #92400e !important; }
.jkc-light [data-section="ministries"] h3 { color: #1b3a6b !important; }
.jkc-light [data-section="ministries"] p { color: #44403c !important; }

/* ServiceSchedule — navy full-bleed */
.jkc-light [data-section="schedule"] {
  background: #1b3a6b !important;
}

/* DirectionsSection — clean cream */
.jkc-light [data-section="directions"] {
  background: #f8f6f0 !important;
}

/* ConnectSection — gold tint */
.jkc-light [data-section="connect"] {
  background: linear-gradient(135deg, #fef8ec 0%, #fff9f0 100%) !important;
}

/* NewHere cards */
.jkc-light [data-card="visitor"] {
  background: linear-gradient(135deg, #1b3a6b 0%, #1e4080 100%) !important;
}
.jkc-light [data-card="member"] {
  background: linear-gradient(135deg, #f5a623 0%, #e8940a 100%) !important;
}
.jkc-light [data-card="member"] h2,
.jkc-light [data-card="member"] p { color: #1b3a6b !important; }

/* Footer — navy */
.jkc-light footer {
  background: #1b3a6b !important;
}

/* Footer always stays navy — cannot be overridden */
.jkc-light footer,
.jkc-light footer * {
  background-color: transparent !important;
}
.jkc-light footer {
  background-color: #1b3a6b !important;
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
          color: isDark ? 'white' : '#1b3a6b',
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
