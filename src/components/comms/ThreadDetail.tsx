'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Mail, MessageCircle, Smartphone, CheckCircle2, AlertTriangle, Loader2, Send, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const CHANNEL_ICONS: Record<string, any> = {
  email: Mail,
  line: MessageCircle,
  sms: Smartphone,
};

const TONE_COLORS: Record<string, string> = {
  crisis: 'bg-red-500/20 text-red-400',
  urgent: 'bg-orange-500/20 text-orange-400',
  joy: 'bg-emerald-500/20 text-emerald-400',
  gratitude: 'bg-blue-500/20 text-blue-400',
  confusion: 'bg-yellow-500/20 text-yellow-400',
  anger: 'bg-red-500/20 text-red-400',
  neutral: 'bg-white/10 text-muted-foreground',
};

interface ThreadDetailProps {
  threadId: string;
  onClose: () => void;
}

export function ThreadDetail({ threadId, onClose }: ThreadDetailProps) {
  const [thread, setThread] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [replyChannel, setReplyChannel] = useState('email');
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!threadId) return;
    Promise.all([
      supabase.from('communication_threads').select('*').eq('id', threadId).single(),
      supabase.from('communication_events').select('*').eq('thread_id', threadId).order('occurred_at', { ascending: true }),
    ]).then(([{ data: t }, { data: e }]) => {
      setThread(t);
      setEvents(e ?? []);
      // Pre-populate reply with AI suggested response from latest inbound
      const latestInbound = [...(e ?? [])].reverse().find(ev => ev.direction === 'inbound');
      if (latestInbound?.ai_suggested_response) {
        setReplyText(latestInbound.ai_suggested_response);
      }
      setLoading(false);
    });
  }, [threadId]);

  const handleSend = async () => {
    if (!replyText.trim()) { toast.error('Reply cannot be empty'); return; }
    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/comms/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ thread_id: threadId, body: replyText, channel: replyChannel, org_id: thread?.org_id, member_id: thread?.member_id }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Reply sent');
      setReplyText('');
      // Refresh events
      const { data: e } = await supabase.from('communication_events').select('*').eq('thread_id', threadId).order('occurred_at', { ascending: true });
      setEvents(e ?? []);
    } catch (err: any) {
      toast.error(`Send failed: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async () => {
    setResolving(true);
    await supabase.from('communication_threads').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', threadId);
    setThread((t: any) => ({ ...t, status: 'resolved' }));
    setResolving(false);
    toast.success('Thread marked as resolved');
  };

  const latestInbound = [...events].reverse().find(ev => ev.direction === 'inbound');

  return (
    <div className="flex flex-col h-full bg-[#0f172a] rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b border-white/10 shrink-0">
        {loading ? (
          <div className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin text-violet-400" /><span className="text-xs text-muted-foreground">Loading…</span></div>
        ) : (
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-sm font-black text-foreground truncate">{thread?.subject ?? 'Thread'}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">{thread?.participant_name ?? thread?.member_id}</span>
              {thread?.ai_tone && (
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${TONE_COLORS[thread.ai_tone] ?? TONE_COLORS.neutral}`}>
                  {thread.ai_tone}
                </span>
              )}
              {thread?.priority === 'crisis' && (
                <span className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                  <AlertTriangle className="w-2.5 h-2.5" /> CRISIS
                </span>
              )}
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 shrink-0 ml-3">
          {thread?.status !== 'resolved' && (
            <button
              onClick={handleResolve}
              disabled={resolving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
            >
              {resolving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
              Resolve
            </button>
          )}
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1"><X className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-violet-400" /></div>
        ) : events.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">No messages yet</p>
        ) : (
          events.map(event => {
            const isOutbound = event.direction === 'outbound';
            const ChannelIcon = CHANNEL_ICONS[event.channel] ?? Mail;
            return (
              <div key={event.id} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] space-y-1.5 ${isOutbound ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    isOutbound
                      ? 'bg-violet-600/20 border border-violet-500/20 text-foreground rounded-tr-sm'
                      : 'bg-white/5 border border-white/10 text-foreground rounded-tl-sm'
                  }`}>
                    {event.body_en ?? event.preview ?? '(no content)'}
                  </div>
                  <div className="flex items-center gap-1.5 px-1">
                    <ChannelIcon className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">
                      {event.occurred_at ? new Date(event.occurred_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>

                  {/* AI classification card for inbound */}
                  {!isOutbound && event.ai_summary && (
                    <div className="w-full mt-1 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 space-y-1.5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-amber-400">AI Analysis</p>
                      <p className="text-xs text-foreground/80">{event.ai_summary}</p>
                      {event.ai_urgency_score != null && (
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            event.ai_urgency_score >= 80 ? 'bg-red-500/20 text-red-400' :
                            event.ai_urgency_score >= 60 ? 'bg-orange-500/20 text-orange-400' :
                            'bg-white/10 text-muted-foreground'
                          }`}>
                            Urgency {event.ai_urgency_score}
                          </span>
                          <span className="text-[9px] text-muted-foreground capitalize">{event.ai_category}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reply composer */}
      <div className="p-4 border-t border-white/10 space-y-3 shrink-0">
        {/* AI suggested response quick-use */}
        {latestInbound?.ai_suggested_response && replyText !== latestInbound.ai_suggested_response && (
          <button
            onClick={() => setReplyText(latestInbound.ai_suggested_response)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold hover:bg-violet-500/15 transition-colors text-left"
          >
            <ChevronDown className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Use AI suggested response</span>
          </button>
        )}

        <textarea
          value={replyText}
          onChange={e => setReplyText(e.target.value)}
          rows={4}
          className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground focus:outline-none focus:border-violet-500/50 resize-none transition-colors"
          placeholder="Type your reply…"
        />

        <div className="flex items-center justify-between">
          <select
            value={replyChannel}
            onChange={e => setReplyChannel(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-foreground focus:outline-none"
          >
            <option value="email">Email</option>
            <option value="line">LINE</option>
            <option value="sms">SMS</option>
          </select>
          <button
            onClick={handleSend}
            disabled={sending || !replyText.trim()}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-violet-600 text-white text-xs font-black uppercase tracking-widest hover:bg-violet-700 transition-colors disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
