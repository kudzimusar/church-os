"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Activity, 
  Sparkles, 
  AlertCircle, 
  ArrowLeft, 
  Calendar, 
  ChevronRight, 
  CheckCircle2,
  Clock,
  Mail,
  Plus
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MinistryReportModal } from "./MinistryReportModal";
import { MinistryBroadcastModal } from "./MinistryBroadcastModal";
import { useAdminCtx } from "@/app/shepherd/dashboard/Context";

interface MinistryIntelligenceSiloProps {
  ministryId: string;
  ministrySlug: string;
  onBack: () => void;
  onOpenProfile: () => void;
  forcedRole?: string;
}

export function MinistryIntelligenceSilo({ 
  ministryId, 
  ministrySlug, 
  onBack, 
  onOpenProfile,
  forcedRole 
}: MinistryIntelligenceSiloProps) {
  const adminCtx = useAdminCtx(); // This might be null in member portal
  const activeRole = forcedRole || adminCtx?.role;
  
  const isLeader = activeRole === 'admin' || 
                   activeRole === 'pastor' || 
                   activeRole === 'shepherd' || 
                   activeRole === 'ministry_leader' ||
                   activeRole === 'leader'; // Account for ministry-specific leader role

  const [intelligence, setIntelligence] = useState<any>(null);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commsTab, setCommsTab] = useState("ALL");
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);

  const getMinistryOps = (slug: string) => {
    const defaults = [
      { id: 'report', icon: <CheckCircle2 size={14} />, label: 'Submit Report', sub: 'Ministry performance' },
      { id: 'attendance', icon: <Plus size={14} />, label: 'Quick Attendance', sub: 'Log service headcounts' },
      { id: 'events', icon: <Calendar size={14} />, label: 'Ministry Events', sub: 'Manage retreats' },
      { id: 'team', icon: <Users size={14} />, label: 'Manage Team', sub: 'Assign roles' },
      { id: 'analytics', icon: <Activity size={14} />, label: 'Analytics', sub: 'Performance metrics' }
    ];

    const specific: Record<string, any[]> = {
      media: [
        { id: 'report', icon: <CheckCircle2 size={14} />, label: 'Submit Ministry Report', sub: 'Submit media report' },
        { id: 'manual', icon: <Activity size={14} />, label: 'Media Operations Manual', sub: 'SOPs and guides' },
        { id: 'runsheet', icon: <Calendar size={14} />, label: 'Service Media Run Sheet', sub: 'Weekend planning' },
        { id: 'pipeline', icon: <Sparkles size={14} />, label: 'Content Pipeline', sub: 'Socials & broadcast' },
        { id: 'roster', icon: <Users size={14} />, label: 'Tech Team Roster', sub: 'Volunteer schedule' },
        { id: 'sermon_hub', icon: <Activity size={14} />, label: 'Sermon Hub', sub: 'Asset management' }
      ],
      worship: [
        { id: 'report', icon: <CheckCircle2 size={14} />, label: 'Submit Report', sub: 'Rehearsal attendance' },
        { id: 'attendance', icon: <Plus size={14} />, label: 'Quick Attendance', sub: 'Log service headcounts' },
        { id: 'events', icon: <Calendar size={14} />, label: 'Ministry Events', sub: 'Manage retreats' },
        { id: 'team', icon: <Users size={14} />, label: 'Manage Team', sub: 'Assign roles' },
        { id: 'analytics', icon: <Activity size={14} />, label: 'Analytics', sub: 'Performance metrics' },
        { id: 'setlists', icon: <Sparkles size={14} />, label: 'Setlists', sub: 'Weekend planning' }
      ]
    };

    return specific[slug] || defaults;
  };


  const loadSilo = async () => {
    const [intelRes, metricsRes, commsRes] = await Promise.all([
      supabase.from('vw_ministry_intelligence').select('*').eq('ministry_id', ministryId).single(),
      supabase.from('vw_ministry_metrics_current').select('*').eq('ministry_id', ministryId),
      supabase.from('ministry_comms_outbox').select('*, profiles(full_name)').eq('ministry_id', ministryId).order('created_at', { ascending: false }).limit(20)
    ]);

    setIntelligence(intelRes.data);
    setMetrics(metricsRes.data || []);
    setMessages(commsRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadSilo();
  }, [ministryId]);

  if (loading || !intelligence) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Syncing Silo Intelligence...</p>
      </div>
    );
  }

  const color = intelligence.primary_color || "#8B5CF6";
  const tag = intelligence.intelligence_tag || "OPERATIONAL";

  return (
    <div className="space-y-6">
      {/* Silo Top Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-muted rounded-xl transition-colors border border-border bg-card shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
              <span className="opacity-40 font-medium">Ministry /</span> {intelligence.name}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{tag}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button 
            onClick={onOpenProfile}
            className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-xl hover:border-primary/50 transition-all group"
           >
             <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center text-[10px] font-black text-primary">K</div>
             <div className="text-left">
               <p className="text-[10px] font-black text-foreground leading-tight">MY PROFILE</p>
               <p className="text-[8px] font-bold text-primary group-hover:text-primary/70 transition-colors">6 DAY STREAK →</p>
             </div>
           </button>
        </div>
      </div>

      {/* ① MINISTRY HEALTH INTELLIGENCE */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatTile 
            T={{ d: true }}
            label="Health Score" 
            value={intelligence.health_score ? `${intelligence.health_score}/100` : "72/100"} 
            accent={color} 
            note="↑ +12 since last month"
            spark={[28, 31, 36, 29, 41, 38, 36, 39]}
          />
          {metrics.slice(0, 5).map((m) => (
             <StatTile 
              key={m.metric_key}
              label={m.label} 
              value={m.current_value !== null ? (m.unit === 'percentage' ? `${m.current_value}%` : m.current_value) : "—"} 
              note={m.current_value === null ? "Waiting data" : `Target: ${m.target_value || "N/A"}`}
              accent={m.current_value === null ? undefined : color}
              alert={m.current_value === null}
           />
          ))}
          {metrics.length === 0 && (
             <>
               <StatTile label="Avg Attendance" value="36.8" note="↑ Trending up" spark={[30,35,32,40,38]} />
               <StatTile label="Team Capacity" value="18/25" note="7 new spots" />
             </>
          )}
        </div>

        {/* AI INSIGHTS PANEL */}
        <div className="bg-card border border-border rounded-3xl p-6 flex flex-col relative overflow-hidden shadow-sm">
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl pointer-events-none" />
           <div className="flex items-center gap-2 mb-6">
             <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
             </div>
             <p className="text-xs font-black text-foreground uppercase tracking-widest">AI Insights</p>
           </div>
           
           <div className="space-y-4 flex-1">
             {(intelligence.active_insights || [
               { insight_type: 'success', content: 'Attendance grew 18% over 8 weeks. Submit a report to lock in this data.' },
               { insight_type: 'warning', content: 'No report in 40 days. Health score capped at 72. Filing a report is high-leverage.' },
               { insight_type: 'tip', content: 'Vocalist Rotation form inactive. Irregular rotation may impact sound consistency.' }
             ]).map((ins: any, i: number) => (
               <div key={i} className="flex gap-3 group">
                 <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                   ins.insight_type === 'warning' ? 'bg-amber-500' : 
                   ins.insight_type === 'critical' ? 'bg-red-500' : 
                   'bg-emerald-500'
                 }`} />
                 <p className="text-xs text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">
                   {ins.content}
                 </p>
               </div>
             ))}
           </div>

           <div className="mt-8 pt-4 border-t border-border">
             <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">Church OS Intelligence Layer</p>
           </div>
        </div>
      </section>

      {/* ② HERO SECTION */}
      <section 
        className="relative rounded-[32px] p-8 overflow-hidden border"
        style={{
          background: `linear-gradient(135deg, ${color}33 0%, ${color}1A 45%, transparent 100%)`,
          borderColor: `${color}40`
        }}
      >
        <div 
           className="absolute -top-12 -right-8 w-72 h-72 rounded-full pointer-events-none" 
           style={{ background: `radial-gradient(circle, ${color}26, transparent 70%)` }} 
        />
        <div className="relative flex flex-col lg:flex-row items-end justify-between gap-8">
           <div className="max-w-xl">
             <Badge className="bg-primary/20 text-primary border-0 mb-4 px-3 py-1 font-black text-[10px] tracking-widest">
               {tag} · {intelligence.name.toUpperCase()}
             </Badge>
             <h2 className="text-5xl font-black text-foreground tracking-tighter mb-4 leading-none">
               {intelligence.name}
             </h2>
             <p className="text-sm text-muted-foreground leading-relaxed mb-6">
               Leading the congregation into God&apos;s presence through music and arts. 
               Saturday evening rehearsals. Assign roles and volunteers below.
             </p>
             <div className="flex gap-2 flex-wrap">
               <HeroStat label="NEXT REHEARSAL" value="Sat, Apr 26" />
               <HeroStat label="TEAM" value="18 members" />
               <HeroStat label="LAST REPORT" value={metrics.length > 0 ? "Active" : "Pending"} />
             </div>
           </div>
           
           <div className="flex flex-col items-center gap-4">
              <CircleScore score={intelligence.health_score || 72} color={color} />
              <div className="flex items-center gap-1 opacity-20">
                 {[1,2,3,4,5,6].map(i => <div key={i} className="w-1.5 h-6 bg-primary rounded-full" />)}
              </div>
           </div>
        </div>
      </section>

      {/* ③ OPERATIONS HUB */}
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar Ops */}
        <div className="bg-card border border-border rounded-3xl p-4 h-fit">
           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 px-2">Silo Operations</p>
                      <div className="space-y-1">
             {getMinistryOps(ministrySlug).map(op => (
               <OpItem 
                 key={op.id}
                 onClick={() => {
                   if (op.id === 'report') setIsReportOpen(true);
                   // Handle other clicks if needed
                 }} 
                 icon={op.icon} 
                 label={op.label} 
                 sub={op.sub} 
               />
             ))}
           </div>
        </div>

        {/* Internal Comms Center */}
        <div className="lg:col-span-3 space-y-4">
           <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Broadcast messages and team alerts</p>
              </div>
              {isLeader && (
                <Button 
                  onClick={() => setIsBroadcastOpen(true)}
                  className="rounded-xl font-bold text-xs h-9" style={{ backgroundColor: color }}
                >
                  + NEW MESSAGE ▾
                </Button>
              )}
           </div>
           
           <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
             <div className="px-6 py-4 flex gap-2 border-bottom border-border overflow-x-auto no-scrollbar">
                {["ALL", "all_volunteers", "emergency", "announcement"].map(t => (
                  <button 
                    key={t}
                    onClick={() => setCommsTab(t)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${
                      commsTab === t ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {t === "all_volunteers" ? "Team" : t === "emergency" ? "Crisis" : t}
                  </button>
                ))}
             </div>
             <div className="min-h-[300px] flex flex-col p-4 space-y-3 overflow-y-auto max-h-[500px]">
                {messages.filter(m => commsTab === "ALL" || m.recipient_type === commsTab).map((msg, i) => (
                  <div key={i} className="p-4 bg-muted/20 border border-border rounded-2xl group hover:border-primary/20 transition-all">
                     <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                           <Badge className={`text-[8px] font-black border-0 uppercase ${
                             msg.recipient_type === 'emergency' ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'
                           }`}>
                             {msg.recipient_type === 'emergency' ? 'Crisis' : 'Team'}
                           </Badge>
                           <p className="text-xs font-black text-foreground">{msg.subject}</p>
                        </div>
                        <p className="text-[10px] text-muted-foreground/40 font-bold">{new Date(msg.created_at).toLocaleDateString()}</p>
                     </div>
                     <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{msg.body}</p>
                     <div className="mt-3 pt-3 border-t border-border/50 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Sent by {msg.profiles?.full_name?.split(' ')[0] || 'Leader'}</p>
                        <button className="text-[9px] font-black text-primary uppercase">Read More →</button>
                     </div>
                  </div>
                ))}
                {messages.length === 0 && (
                   <div className="h-64 flex flex-col items-center justify-center text-center p-8">
                      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-4">
                         <Mail className="w-5 h-5 text-muted-foreground/40" />
                      </div>
                      <p className="text-xs font-bold text-muted-foreground">No {commsTab.toLowerCase()} messages found</p>
                      <p className="text-[10px] text-muted-foreground/50 mt-1 uppercase tracking-widest">Everything is current</p>
                   </div>
                )}
             </div>
           </div>
        </div>
      </section>

      {/* REPORTING MODAL */}
      <MinistryReportModal 
         isOpen={isReportOpen}
         onClose={() => {
           setIsReportOpen(false);
           loadSilo(); // Reload data when modal closes
         }}
         ministryId={ministryId}
         ministryName={intelligence.name}
      />

      {/* BROADCAST MODAL */}
      <MinistryBroadcastModal 
         isOpen={isBroadcastOpen}
         onClose={() => {
           setIsBroadcastOpen(false);
           loadSilo();
         }}
         ministryId={ministryId}
         ministryName={intelligence.name}
      />
    </div>
  );
}

function StatTile({ label, value, note, accent, alert, spark }: any) {
  return (
    <div className={`bg-card border p-5 rounded-3xl shadow-sm transition-all hover:shadow-md ${alert ? 'border-red-500/20' : 'border-border'}`}>
      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-3">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-black ${alert ? 'text-red-500' : 'text-foreground'}`} style={{ color: !alert && accent ? accent : undefined }}>
          {value}
        </span>
      </div>
      {spark && (
        <div className="mt-4 h-8 flex items-end gap-1 opacity-40">
           {spark.map((v: number, i: number) => (
             <div key={i} className="flex-1 bg-primary rounded-t-sm" style={{ height: `${(v/Math.max(...spark))*100}%` }} />
           ))}
        </div>
      )}
      {note && (
        <p className={`text-[10px] font-bold mt-2 ${alert ? 'text-red-500/60' : 'text-muted-foreground/60'}`}>
          {note}
        </p>
      )}
    </div>
  );
}

function HeroStat({ label, value }: any) {
  return (
    <div className="bg-card/50 backdrop-blur-md border border-white/5 rounded-2xl px-5 py-3 shadow-inner">
       <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
       <p className="text-xs font-black text-foreground uppercase">{value}</p>
    </div>
  );
}

function CircleScore({ score, color }: any) {
  const R = 36;
  const C = 2 * Math.PI * R;
  return (
    <div className="relative w-28 h-28 flex flex-col items-center justify-center">
       <svg className="absolute inset-0 -rotate-90 w-28 h-28">
         <circle cx={56} cy={56} r={R} fill="none" stroke="currentColor" strokeWidth={6} className="text-muted/10" />
         <circle 
           cx={56} cy={56} r={R} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round"
           strokeDasharray={C} strokeDashoffset={C * (1 - score/100)}
           className="transition-all duration-1000 ease-out"
           style={{ filter: `drop-shadow(0 0 8px ${color}44)` }}
         />
       </svg>
       <span className="text-3xl font-black text-foreground leading-none">{score}</span>
       <span className="text-[8px] font-black text-muted-foreground mt-1 uppercase opacity-40">HEALTH</span>
    </div>
  );
}

function OpItem({ icon, label, sub, onClick }: any) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/50 transition-all group text-left">
       <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all">
          {React.cloneElement(icon, { size: 14 })}
       </div>
       <div className="flex-1 truncate">
          <p className="text-xs font-black text-foreground leading-tight">{label}</p>
          <p className="text-[9px] font-bold text-muted-foreground truncate">{sub}</p>
       </div>
       <ChevronRight className="w-3 h-3 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-all translate-x--2 group-hover:translate-x-0" />
    </button>
  );
}
