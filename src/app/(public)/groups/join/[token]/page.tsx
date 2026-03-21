import GroupInviteClient from './GroupInviteClient';

/**
 * Static export requirement: return params even if empty
 */
export async function generateStaticParams() {
    return [
        { token: 'placeholder' }
    ];
}

export default function GroupInvitePage({ params }: { params: Promise<{ token: string }> }) {
    return <GroupInviteClient params={params} />;
}
