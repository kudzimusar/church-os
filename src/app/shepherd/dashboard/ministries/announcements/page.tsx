"use client";
import { supabase } from "@/lib/supabase";

import { useEffect, useState } from 'react';

import { toast } from 'sonner';
import { AlertCircle, ArrowDownCircle, ArrowUpCircle, Send, Paperclip, LayoutGrid, List, Eye } from 'lucide-react';

export default function MissionControlAnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [ministries, setMinistries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [composeTitle, setComposeTitle] = useState('');
    const [composeBody, setComposeBody] = useState('');
    const [selectedMinistryId, setSelectedMinistryId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [announcementAttachments, setAnnouncementAttachments] = useState<Record<string, any[]>>({});

    const replyTo = (announcement: any) => {
        setSelectedMinistryId(announcement.ministry_id);
        setComposeTitle(`RE: ${announcement.title}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const fetchAnnouncements = async (orgId: string) => {
        setLoading(true);
        const { data, error } = await supabase
            .from('ministry_announcements')
            .select(`
                *,
                ministries(name)
            `)
            .eq('org_id', orgId)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            console.error('Admin fetch error:', error);
            toast.error("Failed to load announcements");
            setLoading(false);
            return;
        }

        // Fetch author names separately to avoid RLS/FK join issues
        const authorIds = [...new Set((data || []).map(a => a.author_id).filter(Boolean))];
        let authorMap: Record<string, string> = {};
        if (authorIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, name')
                .in('id', authorIds);
            (profiles || []).forEach(p => { authorMap[p.id] = p.name; });
        }

        setAnnouncements((data || []).map(a => ({
            ...a,
            authorName: authorMap[a.author_id] || 'Unknown'
        })));

        // Fetch attachments
        const { data: attachmentData } = await supabase
            .from('message_attachments')
            .select('*')
            .in('announcement_id', (data || []).map(a => a.id));
        
        if (attachmentData) {
            const map: Record<string, any[]> = {};
            attachmentData.forEach(att => {
                if (!map[att.announcement_id]) map[att.announcement_id] = [];
                map[att.announcement_id].push(att);
            });
            setAnnouncementAttachments(map);
        }
        setLoading(false);
    };

    const downloadAttachment = async (path: string, name: string) => {
        const { data, error } = await supabase.storage
            .from('ministry-attachments')
            .download(path);
        if (error) {
            toast.error("Failed to download attachment");
            return;
        }
        if (data) {
            const url = URL.createObjectURL(data);
            const a = document.createElement('a');
            a.href = url;
            a.download = name;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    const loadData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single();
        if (!profile?.org_id) return;

        const { data: mData } = await supabase.from('ministries').select('*').eq('org_id', profile.org_id);
        if (mData) setMinistries(mData);

        fetchAnnouncements(profile.org_id);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSendDownward = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!composeTitle || !composeBody) return;

        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user?.id).single();
            
            if (selectedMinistryId) {
                // Single ministry transmission
                const { data: inserted, error } = await supabase.from('ministry_announcements').insert({
                    org_id: profile?.org_id,
                    ministry_id: selectedMinistryId,
                    author_id: user?.id,
                    direction: 'downward',
                    title: composeTitle,
                    body: composeBody,
                    priority: 'normal'
                }).select('id').single();
                
                if (error) throw error;
                
                // Upload attachments
                if (attachments.length > 0) {
                    for (const file of attachments) {
                        const filePath = `${selectedMinistryId}/${Date.now()}-${file.name}`;
                        const { error: uploadError } = await supabase.storage
                            .from('ministry-attachments')
                            .upload(filePath, file);
                        
                        if (!uploadError) {
                            await supabase.from('message_attachments').insert({
                                announcement_id: inserted.id,
                                uploaded_by: user?.id,
                                file_name: file.name,
                                file_path: filePath,
                                file_size: file.size,
                                mime_type: file.type
                            });
                        }
                    }
                }
            } else {
                // Broadcast to all ministries
                const inserts = ministries.map(m => ({
                    org_id: profile?.org_id,
                    ministry_id: m.id,
                    author_id: user?.id,
                    direction: 'downward',
                    title: composeTitle,
                    body: composeBody,
                    priority: 'normal'
                }));

                const { data: insertedList, error } = await supabase.from('ministry_announcements').insert(inserts).select('id');
                if (error) throw error;

                // For broadcast, upload once and link to all inserted announcements
                if (attachments.length > 0 && insertedList) {
                    for (const file of attachments) {
                        const filePath = `broadcast/${Date.now()}-${file.name}`;
                        const { error: uploadError } = await supabase.storage
                            .from('ministry-attachments')
                            .upload(filePath, file);
                        
                        if (!uploadError) {
                            const attInserts = insertedList.map(ins => ({
                                announcement_id: ins.id,
                                uploaded_by: user?.id,
                                file_name: file.name,
                                file_path: filePath,
                                file_size: file.size,
                                mime_type: file.type
                            }));
                            await supabase.from('message_attachments').insert(attInserts);
                        }
                    }
                }
            }

            toast.success(selectedMinistryId ? "Announcement sent" : "Broadcast transmitted with attachments");
            setComposeTitle('');
            setComposeBody('');
            setAttachments([]);
            loadData();
        } catch (error: any) {
            toast.error(error.message || "Failed to transmit");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading && announcements.length === 0) {
        return <div className="p-8 text-muted-foreground animate-pulse font-black text-xs tracking-widest uppercase">Loading Intelligence Comms...</div>;
    }

    return (
        <div className="p-8 space-y-8 max-w-6xl mx-auto min-h-screen text-foreground transition-colors duration-500">
            <header>
                <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase">Ministry Comm Lines</h1>
                <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mt-2">Mission Control &harr; Distributed Ministries</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Inbox */}
                <div className="col-span-1 md:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-foreground tracking-tighter uppercase">Comm Feed</h2>
                        <div className="flex bg-card p-1 rounded-xl border border-border shadow-sm transition-colors">
                            <button 
                                onClick={() => setViewMode('card')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'card' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    
                    {announcements.length === 0 && !loading && (
                        <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground/40 text-xs uppercase tracking-widest font-black shadow-sm">
                            No active comms.
                        </div>
                    )}
                    
                    {viewMode === 'card' ? (
                        <div className="space-y-4">
                            {announcements.map(a => (
                                <div key={a.id} className={`p-6 rounded-2xl border transition-colors ${
                                    a.direction === 'upward' 
                                        ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20 shadow-sm' 
                                        : 'bg-card border-border shadow-sm'
                                }`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            {a.direction === 'upward' ? (
                                                <ArrowUpCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                            ) : (
                                                <ArrowDownCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                            )}
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${
                                                a.direction === 'upward' ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary'
                                            }`}>
                                                {a.direction === 'upward' ? 'INCOMING UPDATE' : 'OUTBOUND COMM'}
                                            </span>
                                            <span className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest ml-2 px-2 py-0.5 rounded bg-muted/50 border border-border/50">
                                                {a.ministries ? a.ministries.name : 'BROADCAST TO ALL'}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">
                                            {new Date(a.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-black text-foreground mb-2">{a.title}</h3>
                                    <p className="text-foreground/70 text-sm leading-relaxed whitespace-pre-wrap">{a.body}</p>
                                    
                                    {announcementAttachments[a.id] && (
                                        <div className="mt-4 flex flex-wrap gap-2 pt-4 border-t border-border/50">
                                            {announcementAttachments[a.id].map(att => (
                                                <button 
                                                    key={att.id}
                                                    onClick={() => downloadAttachment(att.file_path, att.file_name)}
                                                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/50 border border-border text-[10px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                                                >
                                                    <Paperclip className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                                    {att.file_name}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {a.authorName && (
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-4">Transmitted by {a.authorName}</p>
                                    )}
                                    {a.direction === 'upward' && (
                                        <button 
                                            onClick={() => replyTo(a)}
                                            className="mt-4 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors"
                                        >
                                            <Send className="w-3 h-3" /> Reply Downward
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm transition-colors">
                            {announcements.map((a, idx) => (
                                <div key={a.id} className="border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors">
                                    <div 
                                        onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                                        className="flex items-center gap-4 px-6 py-4 cursor-pointer"
                                    >
                                        <div className={`w-2 h-2 rounded-full ${a.direction === 'upward' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.3)]'}`} />
                                        <div className="flex-2 w-32 shrink-0">
                                             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest truncate">
                                                {a.ministries?.name || 'BROADCAST'}
                                             </p>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-foreground truncate">{a.title}</p>
                                        </div>
                                        <div className="w-24 text-right">
                                            <p className="text-[10px] font-medium text-muted-foreground/40">
                                                {new Date(a.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <Eye className={`w-4 h-4 transition-all ${expandedId === a.id ? 'text-primary' : 'text-muted-foreground/20'}`} />
                                    </div>
                                    {expandedId === a.id && (
                                        <div className="px-6 pb-6 pt-2 bg-muted/20 border-t border-border/50 transition-all">
                                            <p className="text-sm text-foreground/70 leading-relaxed whitespace-pre-wrap">{a.body}</p>
                                            {announcementAttachments[a.id] && (
                                                <div className="mt-4 flex flex-wrap gap-2 pt-4 border-t border-border/50">
                                                    {announcementAttachments[a.id].map(att => (
                                                        <button 
                                                            key={att.id}
                                                            onClick={() => downloadAttachment(att.file_path, att.file_name)}
                                                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-border text-[10px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                                                        >
                                                            <Paperclip className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                                            {att.file_name}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="mt-4 flex items-center justify-between">
                                                <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">
                                                    BY {a.authorName} • {a.direction === 'upward' ? 'INCOMING' : 'OUTBOUND'}
                                                </p>
                                                {a.direction === 'upward' && (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); replyTo(a); }}
                                                        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors"
                                                    >
                                                        <Send className="w-3 h-3" /> Reply
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Compose Downward */}
                <div className="col-span-1">
                    <form onSubmit={handleSendDownward} className="bg-card border border-border rounded-3xl p-6 sticky top-8 shadow-sm transition-colors">
                        <h2 className="text-sm font-black text-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Send className="w-4 h-4 text-primary" /> Transmit Comm
                        </h2>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Target Ministry</label>
                                <select
                                    value={selectedMinistryId || ''}
                                    onChange={(e) => setSelectedMinistryId(e.target.value || null)}
                                    className="w-full h-12 bg-muted/50 border border-border rounded-xl px-4 text-sm text-foreground focus:border-primary/50 focus:outline-none appearance-none transition-colors"
                                >
                                    <option value="" className="bg-card">ALL MINISTRIES (BROADCAST)</option>
                                    {ministries.map(m => (
                                        <option key={m.id} value={m.id} className="bg-card">{m.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Subject</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Brief subject line"
                                    value={composeTitle}
                                    onChange={e => setComposeTitle(e.target.value)}
                                    className="w-full h-12 bg-muted/50 border border-border rounded-xl px-4 text-sm text-foreground focus:border-primary/50 focus:outline-none transition-colors"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Message Body</label>
                                <textarea
                                    required
                                    placeholder="Type your message..."
                                    rows={4}
                                    value={composeBody}
                                    onChange={e => setComposeBody(e.target.value)}
                                    className="w-full bg-muted/50 border border-border rounded-xl p-4 text-sm text-foreground focus:border-primary/50 focus:outline-none resize-none transition-colors"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                        <Paperclip className="w-3 h-3" /> Attachments
                                    </label>
                                    {attachments.length > 0 && (
                                        <button 
                                            type="button" 
                                            onClick={() => setAttachments([])}
                                            className="text-[9px] font-bold text-red-600 dark:text-red-400 hover:text-red-500 uppercase tracking-tighter"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                                <div className="relative group">
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*,.pdf,.doc,.docx"
                                        onChange={(e) => setAttachments(Array.from(e.target.files || []))}
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="w-full bg-muted/50 border border-border border-dashed rounded-xl px-4 py-4 text-center group-hover:border-primary/50 transition-all">
                                        <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                                            {attachments.length > 0 
                                                ? `${attachments.length} selected` 
                                                : 'Click or drag files'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md shadow-primary/20 disabled:opacity-50 mt-2"
                            >
                                {isSubmitting ? 'TRANSMITTING...' : 'INITIATE TRANSMISSION'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
