'use client';

import Link from 'next/link';

export default function StaffPage() {
  const staff = [
    {
      name: 'Pastor Marcel Jonte Gadsden',
      role: 'Senior Pastor',
      photo: '/jkc-devotion-app/images/staff/pastor-marcel.jpg',
      link: '/welcome/our-pastor'
    },
    {
      name: 'Elder Sanna Patterson',
      role: 'Assistant Pastor / Discipleship Director',
      photo: '/jkc-devotion-app/images/staff/sanna-patterson.jpg',
      link: '/welcome/ministries/discipleship'
    },
    {
      name: 'Min. Yutaka Nakamura',
      role: 'Teacher / Fellowship Director',
      photo: '/jkc-devotion-app/images/staff/yutaka-nakamura.jpg',
      link: '/welcome/ministries/fellowship'
    },
    {
      name: 'Eri Kudo',
      role: 'Worship Director',
      photo: '/jkc-devotion-app/images/staff/eri-kudo.jpg',
      link: '/welcome/ministries/worship'
    },
    {
      name: 'Eiko Kuboyama',
      role: 'Evangelism Director / Finance Leader',
      photo: '/jkc-devotion-app/images/staff/eiko-kuboyama.jpg',
      link: '/welcome/ministries/evangelism'
    },
    {
      name: 'Yurie Suzuki',
      role: 'Welcome Director',
      photo: '/jkc-devotion-app/images/staff/yurie-suzuki.jpg',
      link: '/welcome/ministries/hospitality'
    },
    {
      name: 'Naomi Yamamoto',
      role: 'Youth Director',
      photo: '/jkc-devotion-app/images/staff/naomi-yamamoto.jpg',
      link: '/welcome/ministries/youth'
    },
    {
      name: 'Itsuki Kuboyama',
      role: 'Language Class Director',
      photo: '/jkc-devotion-app/images/staff/itsuki-kuboyama.jpg',
      link: '/welcome/ministries/language-school'
    },
  ];

  return (
    <div className="pt-16 min-h-screen bg-[var(--background)]">
      {/* Hero Strip */}
      <section className="relative py-32 px-6 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/jkc-devotion-app/images/hero-background.jpg" 
            alt="Staff Background" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)]/80 via-transparent to-[var(--background)]" />
        </div>
        
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[var(--primary)] blur-[120px] rounded-full opacity-10" />
        </div>
        
        <div className="relative z-10 text-center space-y-4">
          <p className="text-[10px] font-black tracking-[0.4em] text-[var(--foreground)]/40 uppercase">OUR LEADERSHIP TEAM</p>
          <h1 className="text-5xl md:text-7xl font-sans leading-none font-black uppercase tracking-tight text-[var(--foreground)]">
            <span className="font-serif italic font-medium pr-4 normal-case text-[var(--primary)]">Staff</span> & Team
          </h1>
          <nav className="flex justify-center gap-2 text-[10px] font-black tracking-widest text-[var(--foreground)]/30 uppercase pt-6">
            <span className="text-[var(--primary)]">Welcome</span>
            <span>/</span>
            <span>Leadership & Staff</span>
          </nav>
        </div>
      </section>

      <div className="max-w-screen-xl mx-auto px-6 py-24 space-y-20">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <p className="text-[10px] font-black tracking-[0.4em] text-[var(--primary)] uppercase">SERVING THE COMMUNITY</p>
          <h2 className="text-4xl md:text-5xl font-black italic font-serif text-[var(--foreground)]">Meet the team serving Japan Kingdom Church</h2>
          <p className="text-[var(--foreground)]/60 text-sm font-medium leading-relaxed font-sans uppercase tracking-widest pt-4">
            A diverse group of leaders dedicated to fulfilling the mission of God in Japan.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {staff.map((member, idx) => (
            <Link 
              key={idx} 
              href={member.link}
              className="group card-surface p-4 hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all text-center flex flex-col h-full"
            >
              <div className="w-full aspect-[4/5] rounded-[1.5rem] overflow-hidden bg-[var(--foreground)]/5 mb-6">
                <img
                  src={member.photo}
                  alt={member.name}
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              
              <div className="space-y-3 pb-4">
                <h3 className="text-[11px] font-black text-[var(--foreground)]/90 uppercase tracking-[0.2em] leading-tight">
                  {member.name}
                </h3>
                <div className="h-px w-6 bg-[var(--foreground)]/10 mx-auto" />
                <p className="text-[9px] text-[var(--foreground)]/40 font-black uppercase tracking-widest px-2 group-hover:text-[var(--primary)] transition-colors">
                  {member.role}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
