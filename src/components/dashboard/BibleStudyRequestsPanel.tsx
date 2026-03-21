"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { handleJoinRequestAction } from "@/app/actions/bible-study";
import { supabase } from "@/lib/supabase";
import { Check, X, Clock, User, Mail, MessageSquare, MessageCircle } from "lucide-react";

export function BibleStudyRequestsPanel({ groupId }: { groupId?: string }) {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
        
        // Subscription for real-time updates
        const sub = supabase.channel('requests-realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bible_study_group_requests' }, () => {
                fetchRequests();
            })
            .subscribe();
            
        return () => {
            supabase.removeChannel(sub);
        };
    }, [groupId]);

    async function fetchRequests() {
        let query = supabase
            .from('bible_study_group_requests')
            .select('*, profiles(name, email), bible_study_groups(name)')
            .eq('status', 'pending');
            
        if (groupId) query = query.eq('group_id', groupId);
        
        const { data } = await query.order('created_at', { ascending: false });
        setRequests(data || []);
        setLoading(false);
    }

    async function handleAction(requestId: string, action: 'approved' | 'rejected') {
        const result = await handleJoinRequestAction(requestId, action);
        if (result.success) {
            toast.success(`Request ${action === 'approved' ? 'accepted' : 'declined'}!`);
            fetchRequests(); // Refresh list
        } else {
            toast.error(result.error || "Failed to handle request.");
        }
    }

    if (loading) return <div className="p-12 text-center text-muted-foreground animate-pulse font-black uppercase text-[10px] tracking-widest">Loading pending requests...</div>;

    if (requests.length === 0) {
        return (
            <div className="p-12 bg-muted/20 border border-dashed border-border rounded-3xl text-center space-y-4">
                <div className="w-16 h-16 bg-muted border border-border rounded-full flex items-center justify-center text-muted-foreground/30 mx-auto">
                    <Clock className="w-8 h-8" />
                </div>
                <div>
                    <h5 className="font-bold text-foreground">No Pending Requests</h5>
                    <p className="text-xs text-muted-foreground mt-1">All joining requests for your Bible study groups have been processed.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="grid gap-4">
            {requests.map(req => (
                <div key={req.id} className="bg-card border border-border rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-xl hover:shadow-primary/5 transition-all group overflow-hidden relative">
                    {/* Background accent */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
                    
                    <div className="flex items-center gap-5 z-10">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl border border-primary/10 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                            {req.profiles?.name.slice(0, 1)}
                        </div>
                        <div>
                            <p className="font-black text-foreground text-lg">{req.profiles?.name}</p>
                            <div className="flex flex-wrap items-center gap-3 mt-1.5">
                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted px-2 py-0.5 rounded-md border border-border/50">
                                    <Mail className="w-3 h-3" /> {req.profiles?.email}
                                </span>
                                <span className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-md border border-primary/10">
                                    <Clock className="w-3 h-3" /> {new Date(req.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 min-w-[200px] z-10">
                        <div className="p-3.5 bg-muted/40 border border-border/50 rounded-2xl">
                             <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 block tracking-wider">Requested to Join: <span className="text-primary">{req.bible_study_groups?.name}</span></p>
                             <div className="flex items-start gap-2 text-xs text-foreground/80 italic font-medium">
                                <MessageCircle className="w-3.5 h-3.5 mt-0.5 text-primary/40 shrink-0" />
                                <span>{req.message || "No message provided."}</span>
                             </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 z-10 w-full md:w-auto">
                        <Button 
                            onClick={() => handleAction(req.id, 'rejected')}
                            variant="outline" 
                            className="flex-1 md:flex-none h-11 px-5 border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive font-black uppercase text-[10px] tracking-widest rounded-xl transition-all"
                        >
                            <X className="w-4 h-4 mr-2" /> Decline
                        </Button>
                        <Button 
                            onClick={() => handleAction(req.id, 'approved')}
                            className="flex-1 md:flex-none h-11 px-6 bg-primary hover:bg-primary/90 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-primary/20 transition-all border-0"
                        >
                            <Check className="w-4 h-4 mr-2" /> Approve Join
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
}
