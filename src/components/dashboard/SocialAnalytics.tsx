'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Instagram, Facebook, Youtube, Twitter,
    TrendingUp, Users, Eye, MessageSquare, Plus,
    BarChart3, Share2, Activity, Save, X, Loader2
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from 'framer-motion';

const PLATFORM_COLORS: Record<string, string> = {
    instagram: '#E1306C',
    facebook: '#1877F2',
    youtube: '#FF0000',
    tiktok: '#000000',
    twitter: '#1DA1F2'
};

export function SocialAnalytics() {
    const [stats, setStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [newData, setNewData] = useState({ platform: 'instagram', reach: 0, engagement: 0, followers: 0 });

    const fetchStats = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('social_media_metrics')
                .select('*')
                .order('date', { ascending: true });
            setStats(data || []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleAdd = async () => {
        try {
            const { error } = await supabase.from('social_media_metrics').insert([newData]);
            if (error) throw error;
            toast.success("Operational metrics synchronized");
            setShowAdd(false);
            setNewData({ platform: 'instagram', reach: 0, engagement: 0, followers: 0 });
            fetchStats();
        } catch (e) {
            toast.error("Failed to update mission reach");
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-12">
            <Loader2 className="w-6 h-6 animate-spin text-violet-500 opacity-20" />
        </div>
    );

    return (
        <Card className="bg-card dark:bg-white/5 border-border dark:border-white/10 rounded-[2.5rem] overflow-hidden transition-colors">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border dark:border-white/5 pb-6">
                <div>
                    <CardTitle className="text-xl font-black text-foreground dark:text-white uppercase tracking-tighter flex items-center gap-2 transition-colors">
                        <Share2 className="w-5 h-5 text-pink-500" /> Outreach Analytics
                    </CardTitle>
                    <CardDescription className="text-[10px] font-black text-foreground/30 dark:text-white/30 uppercase tracking-[0.2em] mt-1 transition-colors">Digital Evangelism Pipeline</CardDescription>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdd(!showAdd)}
                    className="rounded-xl border-border dark:border-white/10 bg-card dark:bg-white/5 hover:bg-muted dark:hover:bg-white/10 text-[10px] font-black uppercase tracking-widest h-9 text-foreground dark:text-white"
                >
                    {showAdd ? <X className="w-3 h-3 mr-2" /> : <Plus className="w-3 h-3 mr-2" />}
                    {showAdd ? "Cancel" : "Update Reach"}
                </Button>
            </CardHeader>
            <CardContent className="pt-8 space-y-8">
                <AnimatePresence>
                    {showAdd && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-b border-border dark:border-white/5 pb-8"
                        >
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-foreground/30 dark:text-white/30 uppercase ml-1 transition-colors">Platform</label>
                                    <select
                                        value={newData.platform}
                                        onChange={e => setNewData({ ...newData, platform: e.target.value })}
                                        className="w-full bg-foreground/5 dark:bg-white/5 border border-border dark:border-white/10 rounded-xl h-10 px-3 text-xs font-bold text-foreground dark:text-white outline-none transition-colors"
                                    >
                                        <option value="instagram" className="bg-background text-foreground">Instagram</option>
                                        <option value="facebook" className="bg-background text-foreground">Facebook</option>
                                        <option value="youtube" className="bg-background text-foreground">YouTube</option>
                                        <option value="tiktok" className="bg-background text-foreground">TikTok</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-foreground/30 dark:text-white/30 uppercase ml-1 transition-colors">Reach</label>
                                    <Input
                                        type="number"
                                        value={newData.reach}
                                        onChange={e => setNewData({ ...newData, reach: parseInt(e.target.value) })}
                                        className="bg-foreground/5 dark:bg-white/5 border-border dark:border-white/10 rounded-xl h-10 text-xs font-bold text-foreground dark:text-white transition-colors"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-foreground/30 dark:text-white/30 uppercase ml-1 transition-colors">Engage</label>
                                    <Input
                                        type="number"
                                        value={newData.engagement}
                                        onChange={e => setNewData({ ...newData, engagement: parseInt(e.target.value) })}
                                        className="bg-foreground/5 dark:bg-white/5 border-border dark:border-white/10 rounded-xl h-10 text-xs font-bold text-foreground dark:text-white transition-colors"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <Button onClick={handleAdd} className="w-full h-10 bg-pink-600 hover:bg-pink-700 text-white font-black rounded-xl text-[10px] uppercase tracking-widest">
                                        <Save className="w-3.5 h-3.5 mr-2" /> Sync Data
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {stats.length > 0 ? (
                    <div className="space-y-8">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-foreground/5 dark:bg-white/5 border border-border dark:border-white/5 rounded-[1.5rem] flex flex-col justify-center transition-colors">
                                <span className="text-[9px] font-black text-foreground/25 dark:text-white/25 uppercase tracking-widest mb-1 transition-colors">Total Reach</span>
                                <span className="text-xl font-black text-foreground dark:text-white transition-colors">
                                    {stats.filter(s => s.platform === stats[stats.length - 1]?.platform).reduce((acc, s) => acc + s.reach, 0).toLocaleString()}
                                </span>
                            </div>
                            <div className="p-4 bg-foreground/5 dark:bg-white/5 border border-border dark:border-white/5 rounded-[1.5rem] flex flex-col justify-center transition-colors">
                                <span className="text-[9px] font-black text-foreground/25 dark:text-white/25 uppercase tracking-widest mb-1 transition-colors">Eng. Rate</span>
                                <span className="text-xl font-black text-foreground dark:text-white transition-colors">
                                    {(stats[stats.length - 1]?.engagement / stats[stats.length - 1]?.reach * 100 || 0).toFixed(1)}%
                                </span>
                            </div>
                            <div className="p-4 bg-foreground/5 dark:bg-white/5 border border-border dark:border-white/5 rounded-[1.5rem] flex flex-col justify-center transition-colors">
                                <span className="text-[9px] font-black text-foreground/25 dark:text-white/25 uppercase tracking-widest mb-1 transition-colors">Followers</span>
                                <span className="text-xl font-black text-foreground dark:text-white transition-colors">{stats[stats.length - 1]?.followers.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.05} vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="currentColor"
                                        strokeOpacity={0.2}
                                        fontSize={9}
                                        fontWeight="black"
                                        tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    />
                                    <YAxis stroke="currentColor" strokeOpacity={0.2} fontSize={9} fontWeight="black" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--card)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '12px',
                                            color: 'var(--foreground)'
                                        }}
                                        itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="reach"
                                        stroke="#db2777"
                                        fillOpacity={1}
                                        fill="url(#colorReach)"
                                        strokeWidth={3}
                                    />
                                    <defs>
                                        <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#db2777" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#db2777" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-20 opacity-20">
                        <BarChart3 className="w-12 h-12 mx-auto mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest">No reach data synchronized</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
