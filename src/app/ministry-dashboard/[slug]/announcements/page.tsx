"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MinistryAuth, MinistrySession } from '@/lib/ministry-auth';
import { toast } from 'sonner';
import { AlertCircle, ArrowUpCircle, MessageCircle, Send } from 'lucide-react';

export default function MinistryAnnouncementsPage() {
    const params = useParams();
    const slug = params.slug as string;
    
    const [session, setSession] = useState<MinistrySession | null>(null);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [composeTitle, setComposeTitle] = useState('');
    const [composeBody, setComposeBody] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchAnnouncements = async (sess: MinistrySession) => {
        setLoading(true);
        const { data, error } = await supabase
            .from('ministry_announcements')
            .select(`
                *,
                author:profiles(name)
            `)
            .or(`ministry_id.is.null,ministry_id.eq.${sess.ministryId}`)
            .order('created_at', { ascending: false })
            .limit(50);
            
        if (error) {
            console.error(error);
            toast.error("Failed to load announcements");
        } else {
            setAnnouncements(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        MinistryAuth.requireAccess(slug).then(sess => {
            setSession(sess);
            fetchAnnouncements(sess);
        }).catch(err => {
            console.error(err);
        });
    }, [slug]);

    const handleSendUpward = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!composeTitle || !composeBody || !session) return;

        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user?.id).single();
            
            const { error } = await supabase.from('ministry_announcements').insert({
                org_id: profile?.org_id,
                ministry_id: session.ministryId,
                author_id: user?.id,
                direction: 'upward',
                title: composeTitle,
                body: composeBody,
                priority: 'normal'
            });

            if (error) throw error;
            toast.success("Update sent to Mission Control");
            setComposeTitle('');
            setComposeBody('');
            fetchAnnouncements(session);
        } catch (error: any) {
            toast.error(error.message || "Failed to send update");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading && !session) {
        return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">Loading...</div>;
    }

    if (!session) return null;

    return (
        <div className="min-h-screen bg-neutral-950 text-white p-6">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-2xl font-bold">{session.ministryName} Announcements</h1>
                    <p className="text-neutral-400 text-sm">Two-way communication with Mission Control.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Inbox */}
                    <div className="col-span-1 md:col-span-2 space-y-4">
                        <h2 className="text-xl font-semibold mb-4">Inbox</h2>
                        {announcements.filter(a => a.direction === 'downward' || a.direction === 'upward').length === 0 && !loading && (
                            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center text-neutral-500">
                                No messages found.
                            </div>
                        )}
                        {announcements.map(a => (
                            <div key={a.id} className={`p-5 rounded-xl border ${
                                a.direction === 'downward' 
                                    ? 'bg-indigo-950/20 border-indigo-500/20' 
                                    : 'bg-neutral-900 border-neutral-800'
                            }`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {a.direction === 'downward' ? (
                                            <AlertCircle className="w-4 h-4 text-indigo-400" />
                                        ) : (
                                            <ArrowUpCircle className="w-4 h-4 text-emerald-400" />
                                        )}
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                                            a.direction === 'downward' ? 'text-indigo-400' : 'text-emerald-400'
                                        }`}>
                                            {a.direction === 'downward' ? 'FROM ADMIN' : 'MY UPDATE'}
                                        </span>
                                    </div>
                                    <span className="text-xs text-neutral-500">
                                        {new Date(a.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className="font-semibold text-lg">{a.title}</h3>
                                <p className="text-neutral-300 text-sm mt-2 whitespace-pre-wrap">{a.body}</p>
                                {a.author?.name && (
                                    <p className="text-xs text-neutral-500 mt-4">— {a.author.name}</p>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Compose Upward */}
                    {MinistryAuth.can(session.ministryRole, 'assistant') && (
                        <div className="col-span-1">
                            <form onSubmit={handleSendUpward} className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 sticky top-6">
                                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Send className="w-4 h-4" /> Message Admin
                                </h2>
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        required
                                        placeholder="Subject"
                                        value={composeTitle}
                                        onChange={e => setComposeTitle(e.target.value)}
                                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
                                    />
                                    <textarea
                                        required
                                        placeholder="Type an update or request..."
                                        rows={5}
                                        value={composeBody}
                                        onChange={e => setComposeBody(e.target.value)}
                                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg px-4 py-2 transition-colors disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Sending...' : 'Send to Admin'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
