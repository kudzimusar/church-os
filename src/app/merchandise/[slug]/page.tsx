import ProductDetailClient from './ProductDetailClient';
import { use } from 'react';
import { supabase } from '@/lib/supabase';

export const dynamicParams = false; // Required for output: export

/**
 * Next.js Static Export (SSG) requires pre-defining all possible slugs.
 * We fetch them from the database to ensure all products are pre-rendered.
 */
export async function generateStaticParams() {
  const { data } = await supabase
    .from('merchandise')
    .select('slug');
  
  return (data || []).map(p => ({ slug: p.slug }));
}

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return <ProductDetailClient slug={slug} />;
}
