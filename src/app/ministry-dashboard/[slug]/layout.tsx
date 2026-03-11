import { MINISTRIES } from "@/lib/constants";

export async function generateStaticParams() {
    return Object.keys(MINISTRIES).map((slug) => ({
        slug: slug,
    }));
}

export default function MinistryLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
