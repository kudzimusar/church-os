import PublicNav from '@/components/public/PublicNav';
import PublicFooter from '@/components/public/PublicFooter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Japan Kingdom Church — Tokyo',
  description: 'Building a Strong Christian Community that Represents Christ to Japanese Society. Join us Sundays at 10:30AM in Akishima, Tokyo.',
  openGraph: {
    title: 'Japan Kingdom Church',
    description: 'A Christian community in Tokyo, Japan.',
    url: 'https://kudzimusar.github.io/jkc-devotion-app/welcome/',
    siteName: 'Japan Kingdom Church',
  },
};

export default function PublicLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className="min-h-screen bg-[oklch(0.08_0.04_255)] text-white"
      style={{
        '--primary': 'oklch(0.6 0.25 285)',
        '--primary-foreground': 'oklch(0.98 0.01 285)',
      } as React.CSSProperties}
    >
      <PublicNav />
      <main>{children}</main>
      <PublicFooter />
    </div>
  );
}
