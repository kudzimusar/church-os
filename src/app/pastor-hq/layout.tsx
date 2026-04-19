"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    Loader2, Moon, Sun, LogOut, Bell, LayoutDashboard,
    Mail, MessageSquare, Heart, Settings, ChevronDown,
    ArrowRightLeft, Monitor,
} from "lucide-react";
import { AdminAuth, AdminRole } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";
import { ThemeProvider } from "next-themes";
import { cn } from "@/lib/utils";

import { PastorCtx, PastorContext } from "./pastor-context";

// ── Notification helpers ──────────────────────────────────────────────────────
function timeAgoShort(dateStr: string): string {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
}

// ── Sidebar (inner — uses useSearchParams) ───────────────────────────────────
function PastorHQSidebarInner({
    commsUnread,
    onSwitchToMission,
}: {
    commsUnread: number;
    onSwitchToMission: () => void;
}) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const commsParam = searchParams.get("comms");

    const [commsOpen, setCommsOpen] = useState(!!commsParam);
    useEffect(() => { if (commsParam) setCommsOpen(true); }, [commsParam]);

    const COMMS_SUBS = [
        { tab: "inbox", label: "Inbox" },
        { tab: "drafts", label: "Drafts" },
        { tab: "sent", label: "Sent" },
        { tab: "newsletters", label: "Newsletters" },
    ];

    const isCommsActive = pathname === "/pastor-hq" && !!commsParam;

    function NavItem({
        href, icon: Icon, label, exact = false,
    }: { href: string; icon: any; label: string; exact?: boolean }) {
        const active = exact
            ? pathname === href && !commsParam
            : pathname.startsWith(href) && pathname !== "/pastor-hq";
        return (
            <Link
                href={href}
                className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group",
                    active
                        ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
            >
                <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    active ? "bg-violet-500/30" : "group-hover:bg-muted"
                )}>
                    <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold tracking-wide">{label}</span>
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />}
            </Link>
        );
    }

    return (
        <aside className="fixed left-0 top-16 bottom-0 w-56 bg-card border-r border-border overflow-y-auto z-40 flex flex-col">
            {/* Brand */}
            <div className="px-4 py-4 border-b border-border flex-shrink-0">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Pastor&apos;s HQ</p>
                <p className="text-[8px] text-muted-foreground/40 uppercase tracking-widest mt-0.5">Strategic Command Center</p>
            </div>

            <nav className="flex-1 p-3 space-y-0.5 py-4 overflow-y-auto">
                {/* Dashboard */}
                <NavItem href="/pastor-hq" icon={LayoutDashboard} label="Dashboard" exact />

                {/* Communications — expandable */}
                <div>
                    <button
                        onClick={() => setCommsOpen(v => !v)}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                            isCommsActive
                                ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                            isCommsActive ? "bg-violet-500/30" : "group-hover:bg-muted"
                        )}>
                            <Mail className="w-4 h-4" />
                        </div>
                        <span className="flex-1 text-xs font-semibold tracking-wide text-left">Communications</span>
                        {commsUnread > 0 && !commsOpen && (
                            <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                                {commsUnread > 99 ? "99+" : commsUnread}
                            </span>
                        )}
                        <ChevronDown className={cn("w-3 h-3 flex-shrink-0 transition-transform", commsOpen ? "rotate-180" : "")} />
                    </button>
                    {commsOpen && (
                        <div className="ml-4 mt-1 space-y-0.5 border-l border-border pl-3">
                            {COMMS_SUBS.map(sub => (
                                <Link
                                    key={sub.tab}
                                    href={`/pastor-hq?comms=${sub.tab}`}
                                    className={cn(
                                        "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                                        commsParam === sub.tab
                                            ? "text-violet-600 dark:text-violet-400 bg-violet-500/10"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                    )}
                                >
                                    {sub.label}
                                    {sub.tab === "inbox" && commsUnread > 0 && (
                                        <span className="bg-red-500 text-white text-[8px] font-black px-1 py-0.5 rounded-full leading-none">
                                            {commsUnread}
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                <NavItem href="/pastor-hq/prayer-requests" icon={Heart} label="Prayer Requests" />
                <NavItem href="/pastor-hq/inquiries" icon={MessageSquare} label="Inquiries" />
                <NavItem href="/pastor-hq/settings" icon={Settings} label="Settings" />
            </nav>

            {/* Bottom: switch */}
            <div className="p-3 border-t border-border flex-shrink-0">
                <button
                    onClick={onSwitchToMission}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-muted-foreground hover:text-violet-500 hover:bg-violet-500/5 text-[10px] font-black uppercase tracking-widest transition-all"
                >
                    <ArrowRightLeft className="w-3.5 h-3.5 flex-shrink-0" />
                    Mission Control
                </button>
            </div>
        </aside>
    );
}

function PastorHQSidebar(props: { commsUnread: number; onSwitchToMission: () => void }) {
    return (
        <Suspense fallback={<div className="fixed left-0 top-16 bottom-0 w-56 bg-card border-r border-border z-40" />}>
            <PastorHQSidebarInner {...props} />
        </Suspense>
    );
}

// ── Layout ────────────────────────────────────────────────────────────────────
export default function PastorHQLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [state, setState] = useState<{
        loading: boolean; authed: boolean; timedOut: boolean; ctx: PastorCtx;
    }>({
        loading: true,
        authed: false,
        timedOut: false,
        ctx: { role: "super_admin", userName: "Pastor", userId: "", orgId: "", refreshDashboard: () => { } },
    });

    // Notification state
    const [commsUnread, setCommsUnread] = useState(0);
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [notifCount, setNotifCount] = useState(0);

    const loadSession = useCallback(async () => {
        const session = await AdminAuth.getSession("tenant");
        const authorized = session && session.auth_surface === "pastor-hq";
        if (!authorized) { router.replace("/church/login/"); return; }
        setState({
            loading: false,
            authed: true,
            timedOut: false,
            ctx: {
                role: session.role as AdminRole,
                userName: session.name,
                userId: session.identity_id,
                orgId: session.org_id || "",
                refreshDashboard: () => loadSession(),
            },
        });
    }, [router]);

    useEffect(() => {
        const failsafe = setTimeout(() => {
            setState(prev => prev.loading ? { ...prev, loading: false, timedOut: true } : prev);
        }, 12000);
        loadSession().finally(() => clearTimeout(failsafe));
        return () => clearTimeout(failsafe);
    }, [loadSession]);

    // Fetch comms unread count (for sidebar badge)
    useEffect(() => {
        if (!state.ctx.userId) return;
        const fetchUnread = async () => {
            const { count } = await supabase
                .from("external_email_messages")
                .select("id", { count: "exact", head: true })
                .eq("member_id", state.ctx.userId)
                .eq("is_read", false)
                .eq("is_trashed", false);
            setCommsUnread(count ?? 0);
        };
        fetchUnread();
        const iv = setInterval(fetchUnread, 60000);
        return () => clearInterval(iv);
    }, [state.ctx.userId]);

    // Fetch dashboard notifications
    useEffect(() => {
        if (!state.ctx.userId) return;
        const fetchNotifs = async () => {
            const { data } = await supabase
                .from("dashboard_notifications")
                .select("id, notification_type, title, created_at, is_read, link")
                .eq("member_id", state.ctx.userId)
                .order("created_at", { ascending: false })
                .limit(5);
            const rows = data ?? [];
            setNotifications(rows);
            setNotifCount(rows.filter(n => !n.is_read).length);
        };
        fetchNotifs();
    }, [state.ctx.userId]);

    const markAllRead = async () => {
        await supabase
            .from("dashboard_notifications")
            .update({ is_read: true })
            .eq("member_id", state.ctx.userId);
        setNotifCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setNotifOpen(false);
    };

    const handleLogout = async () => {
        await AdminAuth.logout();
        router.push("/church/login/");
    };

    const handleSwitchToMission = () => {
        if (typeof window !== "undefined") {
            sessionStorage.setItem("church_os_active_surface", "mission-control");
            sessionStorage.removeItem("church_os_domain_session");
        }
        router.push("/shepherd/dashboard/");
    };

    if (state.timedOut) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
                <p className="text-sm font-semibold text-destructive">Pastor HQ failed to load — session timed out</p>
                <button
                    onClick={() => { AdminAuth.clearCache(); window.location.href = "/church/login/"; }}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                >
                    Return to Login
                </button>
            </div>
        );
    }

    if (state.loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 bg-violet-600/20 rounded-2xl flex items-center justify-center mx-auto">
                        <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
                    </div>
                    <p className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.3em]">
                        Preparing Strategic Center
                    </p>
                </div>
            </div>
        );
    }

    if (!state.authed) return null;

    return (
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <PastorContext.Provider value={state.ctx}>
                <div className="min-h-screen bg-background text-foreground transition-colors duration-500 font-sans selection:bg-violet-500/20">

                    {/* ── Top header ──────────────────────────────────────────── */}
                    <header className="fixed top-0 left-0 right-0 h-16 border-b border-border bg-background/80 backdrop-blur-xl z-50 px-6 flex items-center justify-between">
                        {/* Brand */}
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-violet-500/20">
                                <Monitor className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h1 className="text-sm font-black uppercase tracking-tighter">Pastor&apos;s HQ</h1>
                                <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Strategic Command Center</p>
                            </div>
                        </div>

                        {/* Right actions */}
                        <div className="flex items-center gap-3">
                            <ThemeToggle />

                            {/* Notification bell */}
                            <div className="relative">
                                <button
                                    onClick={() => setNotifOpen(v => !v)}
                                    className="relative w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                >
                                    <Bell className="w-4 h-4" />
                                    {notifCount > 0 && (
                                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-background" />
                                    )}
                                </button>
                                {notifOpen && (
                                    <div className="absolute right-0 top-12 w-80 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50">
                                        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Notifications</p>
                                            {notifCount > 0 && (
                                                <button
                                                    onClick={markAllRead}
                                                    className="text-[10px] text-violet-400 hover:text-violet-300 font-bold transition-colors"
                                                >
                                                    Mark all read
                                                </button>
                                            )}
                                        </div>
                                        {notifications.length === 0 ? (
                                            <p className="px-4 py-6 text-xs text-muted-foreground text-center">No notifications</p>
                                        ) : notifications.map(n => (
                                            <div
                                                key={n.id}
                                                className={cn(
                                                    "px-4 py-3 border-b border-border last:border-0 transition-colors",
                                                    !n.is_read ? "bg-violet-500/5" : ""
                                                )}
                                            >
                                                {n.link ? (
                                                    <Link href={n.link} onClick={() => setNotifOpen(false)} className="block">
                                                        <p className="text-xs font-bold text-foreground line-clamp-1">{n.title}</p>
                                                        <p className="text-[10px] text-muted-foreground mt-0.5">
                                                            {n.notification_type} · {timeAgoShort(n.created_at)}
                                                        </p>
                                                    </Link>
                                                ) : (
                                                    <>
                                                        <p className="text-xs font-bold text-foreground line-clamp-1">{n.title}</p>
                                                        <p className="text-[10px] text-muted-foreground mt-0.5">
                                                            {n.notification_type} · {timeAgoShort(n.created_at)}
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Profile */}
                            <div className="flex items-center gap-2 pl-3 border-l border-border">
                                <div className="text-right hidden sm:block">
                                    <p className="text-[10px] font-black uppercase leading-tight">{state.ctx.userName}</p>
                                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Strategic Head</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 transition-all"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </header>

                    {/* ── Left sidebar ─────────────────────────────────────────── */}
                    <PastorHQSidebar
                        commsUnread={commsUnread}
                        onSwitchToMission={handleSwitchToMission}
                    />

                    {/* ── Main content ─────────────────────────────────────────── */}
                    <main className="pt-16 pl-56 min-h-screen">
                        <div className="px-8 py-8">
                            {children}
                        </div>
                    </main>
                </div>
            </PastorContext.Provider>
        </ThemeProvider>
    );
}

// ── Theme toggle ──────────────────────────────────────────────────────────────
import { useTheme } from "next-themes";

function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return <div className="w-20 h-9 bg-muted rounded-full animate-pulse" />;
    return (
        <div className="flex items-center bg-muted rounded-full p-1 gap-1">
            <button
                onClick={() => setTheme("light")}
                className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                    theme === "light" ? "bg-background shadow-sm text-violet-600" : "text-muted-foreground hover:text-foreground"
                )}
            >
                <Sun className="w-3.5 h-3.5" />
            </button>
            <button
                onClick={() => setTheme("dark")}
                className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                    theme === "dark" ? "bg-background shadow-sm text-violet-400" : "text-muted-foreground hover:text-foreground"
                )}
            >
                <Moon className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}
