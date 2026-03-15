'use client';

import Link from 'next/link';

export default function OurPastorPage() {
  const books = [
    {
      title: "Power of Purpose",
      src: "/jkc-devotion-app/images/books/book-power-of-purpose.png",
      link: "https://a.co/d/0hKjjYn1"
    },
    {
      title: "A Miraculous Encounter",
      src: "/jkc-devotion-app/images/books/book-miraculous-encounter.webp",
      link: "https://a.co/d/0eXyvya6"
    },
    {
      title: "The Reason I'm Black",
      src: "/jkc-devotion-app/images/books/book-why-i-am-black.png",
      link: "https://a.co/d/00mPTRES"
    },
    {
      title: "The Ultimate Love Challenge Guide",
      src: "/jkc-devotion-app/images/books/book-love-challenge.jpg",
      link: "https://form.jotform.com/202568624678467"
    }
  ];

  return (
    <div className="pt-16 min-h-screen">
      {/* Hero Strip */}
      <section className="relative py-32 px-6 flex items-center justify-center overflow-hidden bg-black/40">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-500 blur-[120px] rounded-full opacity-10" />
        </div>
        <div className="relative z-10 text-center space-y-4">
          <p className="text-[10px] font-black tracking-[0.4em] text-white/40 uppercase">PASTOR MARCEL JONTE GADSDEN</p>
          <h1 className="text-5xl md:text-7xl font-sans leading-none font-black uppercase tracking-tight">
            <span className="font-serif italic font-medium pr-4 normal-case text-white/90">Our</span> Pastor
          </h1>
          <nav className="flex justify-center gap-2 text-[10px] font-black tracking-widest text-white/30 uppercase pt-6">
            <span className="text-[var(--primary)]">Welcome</span>
            <span>/</span>
            <span>Our Pastor</span>
          </nav>
        </div>
      </section>

      <div className="max-w-screen-xl mx-auto px-6 py-24 space-y-24">
        {/* Bio Section */}
        <section className="grid lg:grid-cols-2 gap-16 items-start">
          <div className="relative order-2 lg:order-1">
            <div className="rounded-[2rem] overflow-hidden aspect-[4/3] md:aspect-auto md:h-[600px] glass border border-white/10">
              <img
                src="/jkc-devotion-app/images/pastor/pastor-profile.png"
                alt="Pastor Marcel Jonte Gadsden"
                className="w-full h-full object-cover object-top"
                loading="eager"
              />
            </div>
          </div>
          
          <div className="space-y-8 order-1 lg:order-2">
            <div className="space-y-4">
              <p className="text-[10px] font-black tracking-[0.4em] text-[var(--primary)] uppercase">MEET OUR LEADER</p>
              <h2 className="text-4xl md:text-6xl font-black italic font-serif leading-none">Pastor <br/>Marcel Jonte</h2>
            </div>
            <div className="space-y-6 text-white/60 text-lg leading-relaxed font-bold max-w-full overflow-hidden">
              <p>
                Pastor Marcel Jonte is an American CEO and Pastor abiding in Tokyo,
                Japan who is an expert communicator and motivational speaker to all
                nationalities and ages of people and has gained a unique perspective
                on life, relationships and living your purpose.
              </p>
              <p className="font-medium text-white/50">
                Pastor Marcel was born in Kamp Lintford, Germany and traveled the
                world through his father's military career and arrived in Japan in
                July of 1999. Moving to Tokyo was a challenge for Marcel as he didn't
                understand the Japanese culture nor the language. However, through a
                passion to communicate with the Japanese people, Marcel challenged
                himself to learn and become fluent in the language.
              </p>
              <p className="font-medium text-white/50">
                Pastor Marcel studied for several years under the tutelage of
                overseeing Bishop, the late Bishop Nathaniel Holcomb of the Christian
                House of Prayer (CHOP) in Killeen Texas and earned his Pastorate in
                2017. He and his wife Chiaki founded Japan Kingdom Church when he was
                just 29 years old in Fussa city of west Tokyo.
              </p>
              <p className="font-medium text-white/50">
                In that same year, Pastor Marcel and his wife Chiaki founded Japan
                Kingdom Builders, Inc which currently holds Japan Kingdom Church,
                Akiramenai Homeless Program, Food Pantry and Gospel Music Workshop
                programs.
              </p>
            </div>
            
            {/* Secondary Photo */}
            <div className="rounded-[2rem] overflow-hidden aspect-video mt-8 border border-white/10">
              <img
                src="/jkc-devotion-app/images/pastor/pastor-event.jpg"
                alt="Pastor Marcel at an event"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </section>

        {/* Books Section */}
        <section className="space-y-12">
          <div className="space-y-4 text-center">
            <p className="text-[10px] font-black tracking-[0.4em] text-[var(--primary)] opacity-60 uppercase">AUTHOR & SPEAKER</p>
            <h2 className="text-4xl md:text-5xl font-black italic font-serif">Books by Pastor Marcel</h2>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-10">
            {books.map((book, idx) => (
              <div key={idx} className="group flex flex-col items-center">
                <div className="aspect-[2/3] w-full rounded-xl overflow-hidden glass border border-white/10 mb-6 flex flex-col">
                  <img
                    src={book.src}
                    alt={book.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="text-center space-y-4 px-2">
                  <h3 className="text-[10px] font-black text-white/90 leading-tight uppercase tracking-[0.2em] min-h-[2.5rem] flex items-center justify-center">
                    {book.title}
                  </h3>
                  <a 
                    href={book.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block text-[9px] font-black tracking-[0.3em] text-[var(--primary)] uppercase hover:text-white transition-colors border border-white/10 rounded-full px-6 py-3"
                  >
                    GET BOOK →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Speaking CTA */}
        <section className="relative rounded-[4rem] overflow-hidden bg-white/5 border border-white/5 p-16 md:p-32 text-center group">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="relative z-10 space-y-10 focus-within:z-20">
            <h2 className="text-4xl md:text-6xl font-black italic font-serif max-w-2xl mx-auto">Book Pastor Marcel for your next event</h2>
            <Link 
              href="/welcome/contact"
              className="inline-block bg-white text-black font-black px-12 py-6 rounded-full text-xs tracking-[0.3em] shadow-2xl hover:scale-105 active:scale-95 transition-all"
            >
              BOOK TODAY
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
