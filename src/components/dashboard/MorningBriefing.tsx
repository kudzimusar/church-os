'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, Mail, CheckCircle2, Loader2, Inbox, FileText, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface MorningBriefingProps {
  orgId: string;
  onOpenDrafts?: () => void;
  onOpenInbox?: () => void;
}

export function MorningBriefing({ orgId, onOpenDrafts, onOpenInbox }: MorningBriefingProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [approvingAll, setApprovingAll] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    (async () => {
      try {
        const { data: d } = await supabase.rpc('get_morning_briefing', { p_org_id: orgId });
        setData(d);
      } finally {
        setLoading(false);
      }
    })();
  }, [orgId]);

  const handleApproveAllRoutine = async () => {
    setApprovingAll(true);
    try {
      // Approve all auto-send-eligible drafts with confidence >= 0.80
      await supabase
        .from('communication_drafts')
        .update({ review_status: 'approved' })
        .eq('org_id', orgId)
        .eq('review_status', 'pending_review')
        .gte('ai_confidence', 0.80)
        .not('auto_send_at', 'is', null);
      // Refresh
      const { data: d } = await supabase.rpc('get_morning_briefing', { p_org_id: orgId });
      setData(d);
    } finally {
      setApprovingAll(false);
    }
  };

  if (loading) {
    return (
      <Card className="border border-white/10 bg-white/5">
        <CardContent className="p-6 flex items-center gap-3">
          <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
          <span className="text-xs text-muted-foreground tracking-widest uppercase font-bold">Loading briefing…</span>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const pendingDrafts: any[] = data.pending_drafts ?? [];
  const urgentInbound: any[] = data.urgent_inbound ?? [];
  const engagement = data.recent_engagement ?? {};
  const hasCrisis = urgentInbound.some((i: any) => (i.ai_urgency_score ?? i.urgency_score ?? 0) >= 80);

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Crisis banner */}
      {hasCrisis && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-black text-red-400 uppercase tracking-widest">Crisis Alert</p>
            <p className="text-sm text-red-300 mt-0.5">
              {urgentInbound.filter((i: any) => (i.ai_urgency_score ?? 0) >= 80).length} message(s) flagged as crisis. Immediate pastoral attention needed.
            </p>
          </div>
          <button onClick={onOpenInbox} className="text-xs font-bold text-red-400 hover:text-red-300 underline shrink-0">
            View Inbox
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pending drafts */}
        <Card className="border border-white/10 bg-white/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-violet-400" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Awaiting Review</p>
            </div>
            {pendingDrafts.length === 0 ? (
              <p className="text-sm text-muted-foreground">All clear</p>
            ) : (
              <div className="space-y-2">
                {pendingDrafts.slice(0, 4).map((d: any, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs text-foreground/80 truncate max-w-[130px]">
                      {(d.campaign_type ?? d.type ?? 'Draft').replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-black text-violet-400">{d.count ?? 1}</span>
                  </div>
                ))}
                <div className="pt-1">
                  <span className="text-lg font-black text-foreground">{pendingDrafts.reduce((s: number, d: any) => s + (d.count ?? 1), 0)}</span>
                  <span className="text-xs text-muted-foreground ml-1">total</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Urgent inbox */}
        <Card className="border border-white/10 bg-white/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Inbox className="w-4 h-4 text-amber-400" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Urgent Inbox</p>
            </div>
            {urgentInbound.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing urgent</p>
            ) : (
              <div className="space-y-2">
                {urgentInbound.slice(0, 3).map((item: any, i: number) => (
                  <div key={i} className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground/90 leading-tight truncate">
                      {item.ai_summary ?? item.subject ?? 'Inbound message'}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                        (item.ai_urgency_score ?? 0) >= 80 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {item.ai_urgency_score ?? '?'}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{item.from_name ?? item.sender_name ?? 'Unknown'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Yesterday's engagement */}
        <Card className="border border-white/10 bg-white/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">24h Engagement</p>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Sent', value: engagement.last_24h_sent ?? 0, color: 'text-foreground' },
                { label: 'Opened', value: engagement.last_24h_opened ?? 0, color: 'text-emerald-400' },
                { label: 'Replies', value: engagement.last_24h_replies ?? 0, color: 'text-violet-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className={`text-sm font-black ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={onOpenDrafts}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-black uppercase tracking-widest hover:bg-violet-500/20 transition-colors"
        >
          <FileText className="w-3.5 h-3.5" />
          Review All Drafts
        </button>
        <button
          onClick={onOpenInbox}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground/70 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
        >
          <Mail className="w-3.5 h-3.5" />
          View Inbox
        </button>
        <button
          onClick={handleApproveAllRoutine}
          disabled={approvingAll}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
        >
          {approvingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          Approve All Routine
        </button>
      </div>
    </motion.div>
  );
}
