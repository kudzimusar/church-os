"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, TrendingUp, UserPlus, AlertTriangle, Sparkles, ChevronRight, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Forecast {
    id: string;
    category: string;
    insight_title: string;
    insight_description: string;
    risk_level: string;
    recommended_action: string;
    probability_score: number;
}

export function LeadershipForecastsCard({ orgId }: { orgId: string }) {
    const [forecasts, setForecasts] = useState<Forecast[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchForecasts = async () => {
        if (!orgId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('prophetic_insights')
                .select('*')
                .eq('org_id', orgId)
                .eq('is_acknowledged', false)
                .order('generated_at', { ascending: false })
                .limit(5);

            if (error) throw error;
            setForecasts(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchForecasts();
    }, [orgId]);

    const acknowledge = async (id: string) => {
        const { error } = await supabase
            .from('prophetic_insights')
            .update({ is_acknowledged: true })
            .eq('id', id);
        
        if (!error) {
            setForecasts(prev => prev.filter(f => f.id !== id));
            toast.success("Forecast Acknowledged");
        }
    };

    if (loading) return <div className="h-48 bg-card animate-pulse rounded-2xl border border-border" />;

    return (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
            
            <div className="flex items-center justify-between mb-6 relative z-10">
                <div>
                    <h3 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        Leadership Forecasts
                    </h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Direct Pastoral Intelligence Pipeline</p>
                </div>
                <Badge variant="outline" className="text-[9px] font-black border-primary/20 text-primary">
                    {forecasts.length} ACTIVE
                </Badge>
            </div>

            <div className="space-y-4 relative z-10">
                <AnimatePresence mode="popLayout">
                    {forecasts.map((f, i) => (
                        <motion.div
                            key={f.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: i * 0.1 }}
                            className="group p-4 bg-muted/30 border border-border rounded-xl hover:border-primary/30 transition-all"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full ${
                                    f.risk_level === 'critical' ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'
                                }`}>
                                    {f.category.replace('_', ' ')}
                                </span>
                                {f.probability_score && (
                                    <span className="text-[9px] font-bold text-muted-foreground/40">{f.probability_score}% CONFIDENCE</span>
                                )}
                            </div>
                            
                            <h4 className="text-xs font-black text-foreground mb-1 group-hover:text-primary transition-colors">{f.insight_title}</h4>
                            <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2 mb-3">{f.insight_description}</p>
                            
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-3 h-3 text-emerald-500" />
                                    <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Action Recommended</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        onClick={() => acknowledge(f.id)}
                                        className="h-7 px-2 text-[9px] font-black hover:bg-emerald-500/10 hover:text-emerald-500 text-muted-foreground rounded-lg"
                                    >
                                        ACKNOWLEDGE
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        className="h-7 px-3 text-[9px] font-black bg-primary text-white rounded-lg shadow-sm"
                                    >
                                        EXECUTE →
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {forecasts.length === 0 && (
                    <div className="text-center py-12">
                        <Check className="w-8 h-8 text-emerald-500/20 mx-auto mb-3" />
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">All Leadership Systems Nominal</p>
                        <p className="text-[9px] text-muted-foreground/40 mt-1 uppercase">Next sweep in 4 hours</p>
                    </div>
                )}
            </div>

            <Button 
                variant="ghost" 
                className="w-full mt-6 py-4 text-[10px] font-black text-primary border-t border-border rounded-none hover:bg-primary/5 transition-all"
            >
                OPEN AI COMMAND CENTER <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
        </div>
    );
}
