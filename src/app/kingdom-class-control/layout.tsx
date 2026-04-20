
"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Flame, LogOut, Layout } from "lucide-react";
import { AdminAuth } from "@/lib/admin-auth";
import { basePath as BP } from "@/lib/utils";

export default function KingdomClassControlLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    const loadSession = useCallback(async () => {
        // Specifically look for kingdom-class surface session
        const session = await AdminAuth.getSession('tenant');
        
        // If no session or wrong surface, redirect to selector
        if (!session || session.auth_surface !== 'kingdom-class') {
           router.replace(`${BP}/auth/context-selector/?domain=tenant`);
           return;
        }

        setLoading(false);
    }, [router]);

    useEffect(() => {
        loadSession();
    }, [loadSession]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#080c14]">
                <div className="text-center space-y-4">
                    <Loader2 className="w-8 h-8 text-violet-500 animate-spin mx-auto" />
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">
                        Securing Kingdom Class Node
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#080c14] text-white">
            {/* Simple Top Bar for Standalone Dashboard */}
            <nav className="h-20 border-b border-white/5 bg-[#0d1421]/50 backdrop-blur-xl flex items-center justify-between px-8">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                        <Flame className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-widest">Kingdom Class</h2>
                        <p className="text-[9px] text-white/30 font-bold uppercase">Standalone Dashboard</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <button onClick={() => router.push(`${BP}/auth/context-selector/?domain=tenant`)} className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors flex items-center gap-2">
                        <Layout className="w-4 h-4" />
                        Switch Dashboard
                    </button>
                    <button onClick={() => AdminAuth.logout()} className="text-[10px] font-black uppercase tracking-widest text-red-400/60 hover:text-red-400 transition-colors flex items-center gap-2">
                        <LogOut className="w-4 h-4" />
                        Exit
                    </button>
                </div>
            </nav>

            <main className="p-8">
                {children}
            </main>
        </div>
    );
}
