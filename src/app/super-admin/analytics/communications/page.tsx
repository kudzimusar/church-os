'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, ScatterChart, Scatter,
} from 'recharts';
import { Mail, TrendingUp, AlertTriangle, Zap, Loader2, RefreshCw, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

function exportCsv(data: any[], filename: string) {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  const rows = [keys.join(','), ...data.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(','))];
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function CommsAnalyticsPage() {
  const [churchStats, setChurchStats] = useState<any[]>([]);
  const [timeSeries, setTimeSeries] = useState<any[]>([]);
  const [contentDepth, setContentDepth] = useState<any[]>([]);
  const [aiHeatmap, setAiHeatmap] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    const [
      { data: cs },
      { data: ts },
      { data: cd },
    ] = await Promise.all([
      supabase.from('v_platform_comms_analytics').select('*').limit(50),
      supabase.from('org_comms_stats').select('*').gte('stat_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]).order('stat_date').limit(200),
      supabase.from('v_content_engagement_depth').select('*').limit(20),
    ]);

    setChurchStats(cs ?? []);
    setTimeSeries(ts ?? []);
    setContentDepth(cd ?? []);
    setAiHeatmap((cs ?? []).map(c => ({ x: c.ai_drafts_generated_30d ?? 0, y: c.ai_edit_distance ?? 0, name: c.church_name ?? c.org_id })));
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Trigger aggregate for all active orgs for today
      await supabase.rpc('aggregate_daily_comms_stats', { p_org_id: 'all', p_date: new Date().toISOString().split('T')[0] }).maybeSingle();
      await loadAll();
      toast.success('Stats refreshed');
    } catch (err: any) {
      toast.error('Refresh failed: ' + err.message);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
      </div>
    );
  }

  const totals = churchStats.reduce((acc, c) => ({
    emails: acc.emails + (c.emails_sent_30d ?? 0),
    opens: acc.opens + (c.emails_opened_30d ?? 0),
    replies: acc.replies + (c.emails_replied_30d ?? 0),
    crisis: acc.crisis + (c.crisis_flags_30d ?? 0),
    drafts: acc.drafts + (c.ai_drafts_generated_30d ?? 0),
  }), { emails: 0, opens: 0, replies: 0, crisis: 0, drafts: 0 });

  const avgEditDist = churchStats.length
    ? churchStats.reduce((s, c) => s + (c.ai_edit_distance ?? 0), 0) / churchStats.length
    : 0;

  // Build time series grouped by date
  const tsByDate: Record<string, number> = {};
  timeSeries.forEach(r => {
    const d = r.stat_date?.split('T')[0] ?? '';
    tsByDate[d] = (tsByDate[d] ?? 0) + (r.emails_sent ?? 0);
  });
  const lineData = Object.entries(tsByDate).map(([date, sent]) => ({ date: date.slice(5), sent }));

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Communications Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Platform-wide comms performance across all churches</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-white/20 transition-colors"
        >
          {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Refresh
        </button>
      </div>

      {/* Top strip KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Emails Sent (30d)', value: totals.emails.toLocaleString(), icon: Mail, color: 'text-blue-400' },
          { label: 'Opens', value: totals.opens.toLocaleString(), icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Replies', value: totals.replies.toLocaleString(), icon: Mail, color: 'text-violet-400' },
          { label: 'Crisis Flags', value: totals.crisis.toLocaleString(), icon: AlertTriangle, color: 'text-red-400' },
          { label: 'AI Drafts', value: totals.drafts.toLocaleString(), icon: Zap, color: 'text-amber-400' },
          { label: 'Avg AI Edit Dist', value: avgEditDist.toFixed(2), icon: Zap, color: 'text-muted-foreground' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border border-white/10 bg-white/5">
            <CardContent className="p-4 space-y-1">
              <Icon className={`w-4 h-4 ${color}`} />
              <p className="text-xl font-black text-foreground">{value}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-tight">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Per-church table */}
      <Card className="border border-white/10 bg-white/5">
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Per-Church Performance</p>
            <button onClick={() => exportCsv(churchStats, 'comms_analytics.csv')} className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground hover:text-foreground">
              <Download className="w-3 h-3" /> CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5">
                  {['Church', 'Members', 'Subscribers', 'Emails 30d', 'Open Rate', 'Devotion Rate', 'AI Edit Dist', 'Crisis'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {churchStats.map((c, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3 font-bold text-foreground">{c.church_name ?? c.org_id?.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.member_count ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.subscriber_count ?? '—'}</td>
                    <td className="px-4 py-3 text-foreground">{(c.emails_sent_30d ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={c.open_rate_30d > 0.3 ? 'text-emerald-400' : c.open_rate_30d > 0.15 ? 'text-amber-400' : 'text-muted-foreground'}>
                        {c.open_rate_30d != null ? `${(c.open_rate_30d * 100).toFixed(1)}%` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.devotion_open_rate_30d != null ? `${(c.devotion_open_rate_30d * 100).toFixed(1)}%` : '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.ai_edit_distance != null ? c.ai_edit_distance.toFixed(2) : '—'}</td>
                    <td className="px-4 py-3">
                      {(c.crisis_flags_30d ?? 0) > 0
                        ? <span className="text-red-400 font-black">{c.crisis_flags_30d}</span>
                        : <span className="text-muted-foreground">0</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily emails line chart */}
        <Card className="border border-white/10 bg-white/5">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Daily Emails Sent (90d)</p>
              <button onClick={() => exportCsv(lineData, 'daily_emails.csv')} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"><Download className="w-3 h-3" />CSV</button>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} interval={13} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12 }} />
                <Line type="monotone" dataKey="sent" stroke="#7c3aed" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Open rate bar chart */}
        <Card className="border border-white/10 bg-white/5">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Open Rate by Church</p>
              <button onClick={() => exportCsv(churchStats, 'open_rates.csv')} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"><Download className="w-3 h-3" />CSV</button>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={churchStats.map(c => ({ name: (c.church_name ?? '').split(' ')[0], rate: Math.round((c.open_rate_30d ?? 0) * 100) }))}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12 }} />
                <Bar dataKey="rate" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Content engagement depth */}
        {contentDepth.length > 0 && (
          <Card className="border border-white/10 bg-white/5">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Time Spent per Newsletter Type</p>
                <button onClick={() => exportCsv(contentDepth, 'engagement_depth.csv')} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"><Download className="w-3 h-3" />CSV</button>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={contentDepth.map(d => ({ name: (d.newsletter_type ?? d.campaign_type ?? '').replace('newsletter_', '').substring(0, 10), seconds: Math.round(d.avg_time_seconds ?? 0) }))}>
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit="s" />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12 }} />
                  <Bar dataKey="seconds" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* AI usage scatter */}
        {aiHeatmap.length > 0 && (
          <Card className="border border-white/10 bg-white/5">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">AI Trust (Drafts vs Edit Distance)</p>
                <button onClick={() => exportCsv(aiHeatmap, 'ai_trust.csv')} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"><Download className="w-3 h-3" />CSV</button>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="x" name="AI Drafts" tick={{ fontSize: 10, fill: '#64748b' }} label={{ value: 'Drafts', position: 'insideBottomRight', offset: -5, fontSize: 10, fill: '#64748b' }} />
                  <YAxis dataKey="y" name="Edit Distance" tick={{ fontSize: 10, fill: '#64748b' }} label={{ value: 'Edit Dist', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12 }} cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={aiHeatmap} fill="#7c3aed" />
                </ScatterChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-muted-foreground">Low edit distance = high AI trust</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
