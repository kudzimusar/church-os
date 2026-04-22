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

