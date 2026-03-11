"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MinistryAuth, MinistrySession } from '@/lib/ministry-auth';
import Link from 'next/link';

export default function MinistryOverviewPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [session, setSession] = useState<MinistrySession | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        MinistryAuth.requireAccess(slug).then(sess => {
            setSession(sess);
            setLoading(false);
        }).catch(err => {
            console.error(err);
        });
    }, [slug]);

    if (loading || !session) {
        return <div className="min-h-screen bg-[#080c14] flex items-center justify-center text-white"><p className="text-white/40 font-medium">Loading ministry profile...</p></div>;
    }

    return (
        <div className="min-h-screen bg-[#080c14] text-white p-6 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-full h-96 bg-gradient-to-b from-indigo-900/10 to-transparent pointer-events-none" />
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-violet-600/5 blur-3xl pointer-events-none" />

            <div className="max-w-5xl mx-auto space-y-8 relative z-10">
                {/* Header Card */}
                <div 
                  className="rounded-[2rem] p-8 md:p-12 shadow-2xl relative overflow-hidden border border-white/10"
                  style={{ backgroundColor: session.color || '#6366F1' }}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h1 className="text-3xl md:text-5xl font-black mb-2 tracking-tight">{session.ministryName}</h1>
                            <p className="text-white/90 max-w-lg mb-6 leading-relaxed font-medium">{session.description}</p>
                            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest bg-black/30 text-white backdrop-blur-md border border-white/20 uppercase shadow-lg">
                                Your Role: {session.ministryRole}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Dashboard Actions */}
                <div className="pt-4">
                    <h2 className="text-lg font-black text-white mb-4 tracking-wide">Command Center Operations</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {MinistryAuth.can(session.ministryRole, 'assistant') && (
                            <>
                                <Link href={`/ministry-dashboard/${slug}/reports`} className="bg-[#0d1421] border border-white/10 p-6 rounded-3xl hover:border-violet-500/50 hover:bg-white/5 transition-all shadow-xl group">
                                    <h3 className="font-bold text-lg text-white group-hover:text-violet-400">Submit Report</h3>
                                    <p className="text-white/40 text-[13px] mt-2 font-medium">Log attendance, events, or resources</p>
                                </Link>
                                <Link href={`/ministry-dashboard/${slug}/attendance`} className="bg-[#0d1421] border border-white/10 p-6 rounded-3xl hover:border-violet-500/50 hover:bg-white/5 transition-all shadow-xl group">
                                    <h3 className="font-bold text-lg text-white group-hover:text-violet-400">Quick Attendance</h3>
                                    <p className="text-white/40 text-[13px] mt-2 font-medium">Log standard service headcounts</p>
                                </Link>
                                <Link href={`/ministry-dashboard/${slug}/events`} className="bg-[#0d1421] border border-white/10 p-6 rounded-3xl hover:border-violet-500/50 hover:bg-white/5 transition-all shadow-xl group">
                                    <h3 className="font-bold text-lg text-white group-hover:text-violet-400">Ministry Events</h3>
                                    <p className="text-white/40 text-[13px] mt-2 font-medium">Manage retreats and outreach</p>
                                </Link>
                            </>
                        )}
                        {MinistryAuth.can(session.ministryRole, 'leader') && (
                            <>
                                <Link href={`/ministry-dashboard/${slug}/team`} className="bg-[#0d1421] border border-white/10 p-6 rounded-3xl hover:border-violet-500/50 hover:bg-white/5 transition-all shadow-xl group">
                                    <h3 className="font-bold text-lg text-white group-hover:text-violet-400">Manage Team</h3>
                                    <p className="text-white/40 text-[13px] mt-2 font-medium">Assign roles to volunteers</p>
                                </Link>
                                <Link href={`/ministry-dashboard/${slug}/analytics`} className="bg-[#0d1421] border border-white/10 p-6 rounded-3xl hover:border-violet-500/50 hover:bg-white/5 transition-all shadow-xl group">
                                    <h3 className="font-bold text-lg text-white group-hover:text-violet-400">Analytics</h3>
                                    <p className="text-white/40 text-[13px] mt-2 font-medium">View performance metrics</p>
                                </Link>
                            </>
                        )}
                        <Link href={`/ministry-dashboard/${slug}/announcements`} className="bg-[#0d1421] border border-white/10 p-6 rounded-3xl hover:border-violet-500/50 hover:bg-white/5 transition-all shadow-xl group">
                            <h3 className="font-bold text-lg text-white group-hover:text-violet-400">Announcements</h3>
                            <p className="text-white/40 text-[13px] mt-2 font-medium">Read messages from leadership</p>
                        </Link>
                    </div>
                </div>

                {/* Return link */}
                <div className="pt-12 text-center">
                    <Link href="/ministry-dashboard" className="text-white/30 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors border border-white/10 px-6 py-3 rounded-full bg-[#0d1421]">
                        ← Return to Mission Control Gateway
                    </Link>
                </div>
            </div>
        </div>
    );
}
