import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Church Mission Control — JKC Shepherd OS",
    description: "AI-powered pastoral intelligence platform for Japan Kingdom Church leadership",
};

export default function ShepherdDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Layout shell: the actual grid (sidebar / main / ai-panel) is rendered client-side
    // to enable navigation state. The Server layout just provides metadata + dark bg.
    return (
        <div className="min-h-screen bg-[#080c14] text-white" suppressHydrationWarning>
            {children}
        </div>
    );
}
