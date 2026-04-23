"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";

interface MinistryHubGridProps {
  onSelect: (ministry: any) => void;
  userId?: string;
}

export function MinistryHubGrid({ onSelect, userId }: MinistryHubGridProps) {
  const [ministries, setMinistries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hov, setHov] = useState<string | null>(null);

  useEffect(() => {
    async function loadHub() {
      let query = supabase.from('vw_ministry_intelligence').select('*');
      
      if (userId) {
        // 1. Check if user is a Global Admin (Skeleton Key)
        const { data: globalRoles } = await supabase
          .from('org_members')
          .select('role')
          .eq('user_id', userId)
          .in('role', ['admin', 'owner', 'shepherd', 'pastor', 'super_admin', 'super-admin']);

        const isGlobalAdmin = globalRoles && globalRoles.length > 0;

        if (!isGlobalAdmin) {
          // 2. Not an admin? Fetch only ministries where I am a member
          const { data: mems } = await supabase
            .from('ministry_members')
            .select('ministry_id')
            .eq('user_id', userId)
            .eq('is_active', true);
          
          const ids = mems?.map(m => m.ministry_id) || [];
          
          if (ids.length > 0) {
            query = query.in('ministry_id', ids);
          } else {
            // Return empty if no memberships found for non-admin
            setMinistries([]);
            setLoading(false);
            return;
          }
        }
      }

      const { data } = await query;
      setMinistries(data || []);
      setLoading(false);
    }
    loadHub();
  }, [userId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="h-48 bg-muted/20 animate-pulse rounded-3xl border border-border" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {ministries.map((m) => {
        const isH = hov === m.id;
        const color = m.primary_color || "#8B5CF6";
        const rgb = hexToRgb(color);

        return (
          <motion.div
            key={m.id}
            onMouseEnter={() => setHov(m.id)}
            onMouseLeave={() => setHov(null)}
            onClick={() => onSelect(m)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className="group relative cursor-pointer overflow-hidden rounded-[32px] border transition-all p-6 z-10"
            style={{
              background: isH
                ? `linear-gradient(145deg, rgba(${rgb},0.12), var(--card) 70%)`
                : `linear-gradient(145deg, rgba(${rgb},0.06), var(--card) 70%)`,
              borderColor: isH ? `rgba(${rgb},0.4)` : 'var(--border)',
              boxShadow: isH ? `0 20px 40px rgba(${rgb},0.08)` : 'none',
              pointerEvents: 'auto'
            }}
          >
            {/* Top accent line - Fix #8: use m.secondary_color from DB */}
            <div 
              className="absolute top-0 left-0 right-0 h-1" 
              style={{ background: `linear-gradient(90deg, ${color}, ${m.secondary_color || '#6D28D9'})` }} 
            />
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color }}>{m.intelligence_tag || 'DECENTRALIZED'}</p>
                <h3 className="text-lg font-black text-foreground leading-tight">{m.name}</h3>
              </div>
              {/* Fix #9: dynamic role badge */}
              <Badge className="bg-primary/20 text-primary border-0 text-[8px] font-black tracking-widest uppercase">
                {userId && m.leader_id === userId ? 'LEADER' : 'MEMBER'}
              </Badge>
            </div>

            {/* Fix #5: dynamic description from DB */}
            <p className="text-xs text-muted-foreground/70 leading-relaxed mb-6 line-clamp-2">
              {m.description || `Intelligence silo for the ${m.name}.`}
            </p>

            <div className="grid grid-cols-3 gap-2">
               <HubStat label="HEALTH" value={m.health_score || "—"} color={color} />
               <HubStat label="TREND" value={m.trend_direction?.toUpperCase() || "—"} />
               {/* Fix #6: dynamic reports count from DB */}
               <HubStat label="REPORTS" value={m.reports_this_month != null ? String(m.reports_this_month) : '—'} />
            </div>

            <div className="mt-4 flex justify-end">
               <p className="text-[9px] font-black uppercase tracking-widest transition-opacity group-hover:opacity-100 opacity-0" style={{ color }}>
                 Open Dashboard →
               </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function HubStat({ label, value, color }: any) {
  return (
    <div className="bg-muted/30 rounded-2xl p-3 border border-border/5">
       <p className="text-[10px] font-black text-foreground leading-none mb-1" style={{ color }}>{value}</p>
       <p className="text-[7px] font-black text-muted-foreground uppercase tracking-widest opacity-40">{label}</p>
    </div>
  );
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? 
    `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` 
    : "139, 92, 246";
}
