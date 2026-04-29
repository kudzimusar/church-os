import PublicNav from '@/components/public/PublicNav';
import PublicFooter from '@/components/public/PublicFooter';
import { PublicThemeWrapper } from '@/components/public/PublicThemeWrapper';
import { ConnectModalProvider } from '@/components/public/ConnectModalProvider';
import { ChurchProvider } from '@/lib/church-context';
import { LanguageProvider } from '@/lib/language-context';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Japan Kingdom Church — Tokyo',
  description: 'Building a Strong Christian Community that Represents Christ to Japanese Society.',
  openGraph: {
    title: 'Japan Kingdom Church',
    description: 'A Christian community in Tokyo, Japan.',
    url: 'https://www.churchos-ai.website/jkc/',
    siteName: 'Japan Kingdom Church',
  },
};

export default function PublicLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <ChurchProvider>
      <LanguageProvider>
        <PublicThemeWrapper>
          <ConnectModalProvider>
            <PublicNav />
            <main className="flex-1">{children}</main>
            <PublicFooter />
          </ConnectModalProvider>
        </PublicThemeWrapper>
      </LanguageProvider>
    </ChurchProvider>
  );
}
