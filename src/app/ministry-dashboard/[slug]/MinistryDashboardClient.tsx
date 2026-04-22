"use client";

import { useEffect, useState } from 'react';
import { MinistryAuth, MinistrySession } from '@/lib/ministry-auth';
import Link from 'next/link';
import { ChevronLeft, BarChart3, Users, CalendarDays, FileText, Bell, ClipboardList, TrendingUp, AlertCircle, Sparkles, CheckCircle2, MessagesSquare, BookOpen, DollarSign, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CommsTab } from '@/components/comms/CommsTab';

import { MinistryIntelligenceSilo } from '@/components/dashboard/ministries/MinistryIntelligenceSilo';
import { LeaderProfileExtension } from '@/components/dashboard/ministries/LeaderProfileExtension';

export default function MinistryOverviewClient({ slug }: { slug: string }) {
    const router = useRouter();
    const [session, setSession] = useState<MinistrySession | null>(null);
    const [loading, setLoading] = useState(true);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    useEffect(() => {
        MinistryAuth.requireAccess(slug).then(sess => {
            setSession(sess);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            router.replace('/ministry-dashboard/');
        });
    }, [slug]);

    if (loading || !session) {
        return (
            <div className="min-h-screen bg-[#080c14] flex flex-col items-center justify-center text-white gap-4">
                <div className="w-10 h-10 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Syncing Intelligence Pipeline...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#080c14] text-white transition-all">
            <div className="p-6 xl:p-12 max-w-[1600px] mx-auto">
                <MinistryIntelligenceSilo 
                    ministryId={session.ministryId}
                    ministrySlug={session.slug}
                    onBack={() => router.push('/ministry-dashboard/')}
                    onOpenProfile={() => setIsProfileOpen(true)}
                    forcedRole={session.ministryRole}
                />
            </div>

            <LeaderProfileExtension 
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
            />
        </div>
    );
}
    );
}

function KPICard({ label, value, color = 'indigo', suffix = '' }: any) {
    const colors: any = {
        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        red: 'text-red-400 bg-red-500/10 border-red-500/20',
        indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
        violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
        pink: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    };

    return (
        <div className="bg-[#0d1421] border border-white/10 rounded-3xl p-5 shadow-xl">
             <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">{label}</p>
             <p className={`text-2xl font-black ${colors[color].split(' ')[0]}`}>{value}{suffix}</p>
        </div>
    );
}

function InsightCard({ insight }: any) {
    const typeColors: any = {
        growth: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400',
        risk: 'border-red-500/30 bg-red-500/5 text-red-400',
        opportunity: 'border-blue-500/30 bg-blue-500/5 text-blue-400',
        commendation: 'border-amber-500/30 bg-amber-500/5 text-amber-400',
        correlation: 'border-violet-500/30 bg-violet-500/5 text-violet-400',
    };

    const color = typeColors[insight.insight_type] || 'border-white/10 bg-white/5 text-white';

    return (
        <div className={`p-4 rounded-2xl border ${color.split(' ')[0]} ${color.split(' ')[1]} shadow-lg`}>
            <div className="flex items-center gap-2 mb-2">
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${color.split(' ')[0]} ${color.split(' ')[1]}`}>
                    {insight.insight_type}
                </span>
                <span className="text-[9px] text-white/20 font-bold">{new Date(insight.created_at).toLocaleDateString()}</span>
            </div>
            <p className="text-white font-bold text-xs">{insight.subject}</p>
            <p className="text-white/60 text-[11px] mt-1.5 leading-relaxed">{insight.summary}</p>
        </div>
    );
}

