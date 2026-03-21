import GroupDetailClient from './GroupDetailClient';

/**
 * Static export requirement for ID segments
 */
export async function generateStaticParams() {
    return [
        { id: 'placeholder' }
    ];
}

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
    return <GroupDetailClient params={params} />;
}
