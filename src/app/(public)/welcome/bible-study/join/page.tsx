"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, Sparkles, CheckCircle2, XCircle, MessagesSquare, Users } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

function JoinGroupContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');
    
    const [loading, setLoading] = useState(true);
    const [group, setGroup] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [joining, setJoining] = useState(false);
    const [joined, setJoined] = useState(false);

    useEffect(() => {
        if (!token) {
            setError("Invalid invitation link.");
            setLoading(false);
            return;
        }

        supabase.from('bible_study_groups')
            .select('*')
            .eq('share_token', token)
            .single()
            .then(({ data, error }) => {
                if (error || !data) {
                    setError("Group not found or link expired.");
                } else {
                    setGroup(data);
                }
                setLoading(false);
            });
    }, [token]);

    const handleJoin = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            toast.error("Please sign in to join a group.");
            router.push('/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search));
            return;
        }

        setJoining(true);
        const { error: joinError } = await supabase
            .from('bible_study_group_members')
            .insert([{
                user_id: user.id,
                group_id: group.id,
                org_id: group.org_id
            }]);

        if (joinError) {
            if (joinError.code === '23505') {
                toast.info("You're already a member of this group!");
                setJoined(true);
            } else {
                toast.error("Failed to join group.");
            }
        } else {
            toast.success("Welcome to " + group.name + "!");
            setJoined(true);
        }
        setJoining(false);
    };

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-[var(--primary)]" />
            <p className="text-xs font-black uppercase tracking-widest opacity-40">Verifying Invitation...</p>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-6">
            <XCircle className="w-16 h-16 text-red-500/50" />
            <div>
                <h1 className="text-2xl font-black mb-2">Invitation Error</h1>
                <p className="text-sm opacity-50 max-w-xs mx-auto">{error}</p>
            </div>
            <Link href="/welcome" className="px-8 py-3 rounded-2xl bg-[var(--jkc-navy)] text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-navy-500/20">
                Explore Ministries
            </Link>
        </div>
    );

    if (joined) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-8 animate-in fade-in zoom-in duration-700">
            <div className="relative">
                <CheckCircle2 className="w-20 h-20 text-emerald-500" />
                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-amber-400 animate-pulse" />
            </div>
            <div className="space-y-2">
                <h1 className="text-3xl font-black italic">Success!</h1>
                <p className="text-sm opacity-60">You're now a member of <span className="font-bold text-foreground">{group?.name}</span>.</p>
            </div>
            <div className="flex flex-col gap-3 w-full max-w-sm">
                <Link href="/profile" className="w-full py-4 rounded-2xl bg-[var(--jkc-navy)] text-white text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-navy-500/30">
                    Go to My Profile
                </Link>
                <Link href="/welcome" className="w-full py-4 rounded-2xl border border-[var(--border)] text-[10px] font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors">
                    Back to Home
                </Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-[3rem] p-10 shadow-2xl space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl opacity-50" />
                
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 rounded-[2rem] bg-[var(--section-alt)] border border-[var(--border)] flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <MessagesSquare className="w-10 h-10 text-[var(--jkc-gold)]" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-[var(--jkc-gold)] uppercase tracking-[0.3em] mb-1">YOU ARE INVITED TO JOIN</p>
                        <h1 className="text-3xl font-black tracking-tight">{group.name}</h1>
                    </div>
                </div>

                <div className="space-y-4 p-6 rounded-3xl bg-[var(--section-alt)]/50 border border-white/5">
                    <p className="text-xs text-center leading-relaxed opacity-60 italic">"{group.description}"</p>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                        <div className="text-center">
                            <p className="text-[8px] font-black text-[var(--jkc-gold)] uppercase tracking-widest mb-1">SCHEDULE</p>
                            <p className="text-[10px] font-bold uppercase">{group.meeting_day}s</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[8px] font-black text-[var(--jkc-gold)] uppercase tracking-widest mb-1">MEMBERS</p>
                            <p className="text-[10px] font-bold uppercase flex items-center justify-center gap-1">
                                <Users className="w-3 h-3" /> {group.member_count || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <button 
                    disabled={joining}
                    onClick={handleJoin}
                    className="w-full py-5 rounded-3xl bg-[var(--jkc-navy)] text-white text-xs font-black uppercase tracking-[0.2em] shadow-[0_10px_40px_-10px_rgba(27,58,107,0.5)] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                    {joining ? <Loader2 className="w-5 h-5 animate-spin" /> : <>JOIN THIS BIBLE STUDY <Sparkles className="w-4 h-4 text-amber-400" /></>}
                </button>

                <p className="text-[9px] text-center opacity-30 font-bold uppercase tracking-widest pb-2">
                    JAPAN KINGDOM CHURCH · BIBLE STUDY NETWORK
                </p>
            </div>
        </div>
    );
}

export default function JoinGroupPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin opacity-10" /></div>}>
            <JoinGroupContent />
        </Suspense>
    );
}
