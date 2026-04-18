import { Metadata } from 'next';
import WelcomeClient from '@/app/(public)/WelcomeClient';
import { supabase } from '@/lib/supabase';

type Props = {
  params: Promise<{ church_slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { church_slug } = await params;
  
  if (!church_slug || church_slug === 'jkc') {
    return {
      title: 'Japan Kingdom Church — Tokyo',
      description: 'Building a Strong Christian Community that Represents Christ to Japanese Society. Join us Sundays at 10:30AM in Akishima, Tokyo.',
    };
  }

  const { data } = await supabase
    .from('organizations')
    .select('name, description')
    .eq('church_slug', church_slug)
    .single();

  return {
    title: data?.name ? `${data.name} | Church OS` : 'Church OS Tenant',
    description: data?.description || 'Welcome to our church community.',
  };
}

export default function ChurchSlugWelcomePage() {
  return <WelcomeClient />;
}
