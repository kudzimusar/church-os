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
        return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white"><p>Loading...</p></div>;
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white p-6">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header Card */}
                <div 
                  className="rounded-2xl p-8 shadow-inner relative overflow-hidden"
                  style={{ backgroundColor: session.color || '#6366F1' }}
                >
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">{session.ministryName}</h1>
                            <p className="text-white/80 max-w-lg mb-6">{session.description}</p>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white backdrop-blur-sm shadow-sm capitalize">
                                Your Role: {session.ministryRole}
                            </span>
                        </div>
                    </div>
                    {/* Decorative Background Icon */}
                    <div className="absolute -right-8 -bottom-8 opacity-20 transform rotate-12" style={{ fontSize: '12rem' }}>
                        {/* Could render Lucide icon matching session.icon */}
                    </div>
                </div>

                {/* Dashboard Actions */}
                <h2 className="text-xl font-semibold mt-8 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {MinistryAuth.can(session.ministryRole, 'assistant') && (
                        <>
                            <Link href={`/ministry-dashboard/${slug}/reports`} className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl hover:border-indigo-500 transition-colors group">
                                <h3 className="font-semibold text-lg text-white group-hover:text-indigo-400">Submit Report</h3>
                                <p className="text-neutral-400 text-sm mt-2">Log attendance, events, or resources</p>
                            </Link>
                            <Link href={`/ministry-dashboard/${slug}/attendance`} className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl hover:border-indigo-500 transition-colors group">
                                <h3 className="font-semibold text-lg text-white group-hover:text-indigo-400">Quick Attendance</h3>
                                <p className="text-neutral-400 text-sm mt-2">Log standard service headcounts</p>
                            </Link>
                            <Link href={`/ministry-dashboard/${slug}/events`} className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl hover:border-indigo-500 transition-colors group">
                                <h3 className="font-semibold text-lg text-white group-hover:text-indigo-400">Ministry Events</h3>
                                <p className="text-neutral-400 text-sm mt-2">Manage retreats and outreach</p>
                            </Link>
                        </>
                    )}
                    {MinistryAuth.can(session.ministryRole, 'leader') && (
                        <>
                            <Link href={`/ministry-dashboard/${slug}/team`} className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl hover:border-indigo-500 transition-colors group">
                                <h3 className="font-semibold text-lg text-white group-hover:text-indigo-400">Manage Team</h3>
                                <p className="text-neutral-400 text-sm mt-2">Assign roles to volunteers</p>
                            </Link>
                            <Link href={`/ministry-dashboard/${slug}/analytics`} className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl hover:border-indigo-500 transition-colors group">
                                <h3 className="font-semibold text-lg text-white group-hover:text-indigo-400">Analytics</h3>
                                <p className="text-neutral-400 text-sm mt-2">View performance metrics</p>
                            </Link>
                        </>
                    )}
                    <Link href={`/ministry-dashboard/${slug}/announcements`} className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl hover:border-indigo-500 transition-colors group">
                        <h3 className="font-semibold text-lg text-white group-hover:text-indigo-400">Announcements</h3>
                        <p className="text-neutral-400 text-sm mt-2">Read messages from leadership</p>
                    </Link>
                </div>

                {/* Return link */}
                <div className="pt-8 text-sm">
                    <Link href="/ministry-dashboard" className="text-neutral-500 hover:text-white transition-colors flex items-center gap-2">
                        ← Back to Ministry List
                    </Link>
                </div>
            </div>
        </div>
    );
}
