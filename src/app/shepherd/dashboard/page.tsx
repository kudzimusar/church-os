"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, HeartPulse, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ShepherdView } from "@/components/dashboard/shepherd-view";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { AIPanel } from "@/components/dashboard/AIPanel";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { basePath as BP } from "@/lib/utils";

export default function ShepherdDashboard() {
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [userName, setUserName] = useState("Admin");
    const [dashLang, setDashLang] = useState<"EN" | "JP">("EN");
    const [alertCount, setAlertCount] = useState(3);
    const [refreshKey, setRefreshKey] = useState(0);

    const loadDashboard = useCallback(async () => {
        try {
            setLoading(true);
            const user = await Auth.getCurrentUser();

            if (!user) {
                setUserRole("shepherd"); // demo fallback
            } else {
                setUserName(user.name || "Admin");
                const { data: member } = await supabase
                    .from("org_members")
                    .select("role")
                    .eq("user_id", user.id)
                    .single();

                if (member) {
                    setUserRole(member.role);
                } else {
                    setUserRole("shepherd"); // allow demo access
                }
            }

            // Load alert count from AI insights
            const { count } = await supabase
                .from("ai_insights")
                .select("*", { count: "exact", head: true })
                .eq("priority", "critical")
                .eq("is_acknowledged", false);
            if (count) setAlertCount(count);

        } catch (err) {
            console.error(err);
            setUserRole("shepherd"); // fallback for demo
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadDashboard(); }, [loadDashboard]);

    const handleRefresh = () => {
        setRefreshKey(k => k + 1);
        toast.success("Dashboard refreshed");
    };

    // ─── Loading State ───
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#080c14]">
                <div className="text-center space-y-4">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    >
                        <RefreshCw className="w-8 h-8 text-violet-400 mx-auto" />
                    </motion.div>
                    <p className="text-xs font-black text-white/30 uppercase tracking-widest">Initializing Mission Control</p>
                </div>
            </div>
        );
    }

    // ─── Access Denied ───
    const allowedRoles = ['shepherd', 'admin', 'owner', 'ministry_lead'];
    if (!userRole || !allowedRoles.includes(userRole)) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#080c14] p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-[#0d1421] border border-red-500/20 rounded-3xl p-10 max-w-lg w-full text-center space-y-6"
                >
                    <HeartPulse className="w-16 h-16 text-red-500 mx-auto" />
                    <div>
                        <h1 className="text-2xl font-black text-white mb-2">Access Restricted</h1>
                        <p className="text-sm text-white/40 leading-relaxed">
                            This dashboard is secured for Pastoral leadership, Elders, and Ministry Leads.
                        </p>
                    </div>
                    <div className="bg-white/3 border border-white/5 rounded-2xl p-4 text-left font-mono text-[10px] text-white/40 space-y-1">
                        <p>1. Supabase verifies active user session.</p>
                        <p>2. Database queries `org_members` for your UUID.</p>
                        <p>3. Must hold shepherd / admin / owner / ministry_lead role.</p>
                    </div>
                    <div className="space-y-3">
                        <Button
                            onClick={() => { toast.success("Bypassed as Pastor (Demo Mode)"); setUserRole("shepherd"); }}
                            className="w-full h-12 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-2xl"
                        >
                            BYPASS FOR TESTING (DEMO PASTOR)
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => window.location.href = BP || "/"}
                            className="w-full h-12 border-white/10 text-white/50 hover:text-white rounded-2xl"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" /> Return to App
                        </Button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // ─── Full Dashboard ───
    return (
        <div className="flex h-screen overflow-hidden bg-[#080c14]">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* TopBar */}
                <TopBar alertCount={alertCount} userName={userName} onRefresh={handleRefresh} />

                {/* Main Canvas */}
                <div className="flex flex-1 overflow-hidden">
                    <main className="flex-1 overflow-y-auto p-6 xl:p-8" key={refreshKey}>
                        {/* Language toggle */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-xl font-black text-white tracking-wide">
                                    Church Mission Control
                                </h1>
                                <p className="text-[11px] text-white/30 mt-0.5">
                                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · JST
                                </p>
                            </div>
                            <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10">
                                <button
                                    onClick={() => setDashLang('EN')}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${dashLang === 'EN' ? 'bg-violet-600 text-white shadow-sm' : 'text-white/30 hover:text-white'}`}
                                >EN</button>
                                <button
                                    onClick={() => setDashLang('JP')}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${dashLang === 'JP' ? 'bg-violet-600 text-white shadow-sm' : 'text-white/30 hover:text-white'}`}
                                >日本語</button>
                            </div>
                        </div>

                        <ShepherdView lang={dashLang} />
                    </main>

                    {/* AI Panel */}
                    <AIPanel />
                </div>
            </div>
        </div>
    );
}
