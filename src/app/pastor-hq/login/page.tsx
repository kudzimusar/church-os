"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, Eye, EyeOff, Mail, Lock, AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { AdminAuth } from "@/lib/admin-auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DASHBOARD_PATH = "/pastor-hq";

export default function PastorHQLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [checkingSession, setCheckingSession] = useState(true);

    useEffect(() => {
        AdminAuth.getAdminSession().then(session => {
            const authorized = session && (session.role === 'super_admin' || session.role === 'owner' || (session.role as string) === 'pastor');
            if (authorized) router.replace(`${DASHBOARD_PATH}/`);
            else setCheckingSession(false);
        });
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;
        setError(null);
        setLoading(true);

        const result = await AdminAuth.loginAdmin(email, password);

        if (!result.success) {
            setError(result.error || "Authentication failed");
            setLoading(false);
            return;
        }

        // Check if the role is authorized for Pastor HQ
        const authorized = result.role === 'super_admin' || result.role === 'owner' || (result.role as string) === 'pastor';
        
        if (!authorized) {
            setError("Unauthorized access. This area is reserved for the Strategic Head.");
            setLoading(false);
            // We should probably sign them out if they aren't authorized for this specific area
            // but for now we just show the error.
            return;
        }

        toast.success(`Welcome to the Strategic Center, Pastor`);
        router.push(`${DASHBOARD_PATH}/`);
    };

    if (checkingSession) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500">
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-violet-600/[0.03] blur-3xl animate-pulse" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-lg"
            >
                {/* Logo & Header */}
                <div className="flex flex-col items-center mb-12 text-center">
                    <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-2xl shadow-violet-500/20 mb-6 group transition-transform hover:scale-110 duration-500">
                        <Monitor className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase mb-2">Pastor&apos;s HQ</h1>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] leading-tight">Strategic Leadership Gate</p>
                </div>

                {/* Login Card */}
                <Card className="rounded-[3rem] border-border bg-card/40 backdrop-blur-xl p-10 shadow-2xl overflow-hidden relative border-t-2 border-t-violet-500/20">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Monitor className="w-32 h-32 rotate-12" />
                    </div>

                    <div className="mb-10 relative">
                        <h2 className="text-xl font-black text-foreground uppercase tracking-tight">System Entry</h2>
                        <p className="text-xs font-medium text-muted-foreground mt-1">
                            Verify your credentials to enter the Strategic Command Center.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6 relative">
                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                                Pastoral Identity (Email)
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-violet-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="pastor@jkc.church"
                                    className="w-full h-14 bg-muted/50 border border-border rounded-2xl pl-12 pr-4 text-sm focus:outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/5 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                                Secure Keyphrase
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-violet-500" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••••••••••"
                                    className="w-full h-14 bg-muted/50 border border-border rounded-2xl pl-12 pr-12 text-sm focus:outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/5 transition-all"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(s => !s)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Error Handling */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex items-start gap-3 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl"
                                >
                                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs font-medium text-red-500/80 leading-relaxed">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={loading || !email || !password}
                            className="w-full h-16 bg-gradient-to-r from-violet-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm rounded-2xl tracking-widest uppercase transition-all flex items-center justify-center gap-3 shadow-xl shadow-violet-500/20 active:scale-[0.98]"
                        >
                            {loading ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Verifying Intelligence...</>
                            ) : (
                                <><ShieldCheck className="w-5 h-5 text-violet-300" /> Enter Command Center</>
                            )}
                        </button>
                    </form>
                </Card>

                {/* Verification footer */}
                <div className="flex flex-col items-center justify-center gap-3 mt-8">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">
                            System Security: Level 4 Active
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function Card({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={cn("bg-card border border-border shadow-sm", className)}>
            {children}
        </div>
    );
}
