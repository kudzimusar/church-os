"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
    UserPlus, Mail, Shield,
    CheckCircle, Loader2, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { motion } from "framer-motion";

export function MinistryOnboarding() {
    const [searchQuery, setSearchQuery] = useState("");
    const [members, setMembers] = useState<any[]>([]);
    const [ministries, setMinistries] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedMember, setSelectedMember] = useState<any>(null);
    const [selectedRole, setSelectedRole] = useState("ministry_leader");
    const [selectedMinistryId, setSelectedMinistryId] = useState("");

    useEffect(() => {
        loadMinistries();
    }, []);

    async function loadMinistries() {
        const { data } = await supabase.from('ministries').select('*').order('name');
        setMinistries(data || []);
        if (data && data.length > 0) setSelectedMinistryId(data[0].id);
    }

    async function handleSearch() {
        if (!searchQuery) return;
        setLoading(true);
        const { data } = await supabase
            .from('profiles')
            .select('id, name, email')
            .ilike('name', `%${searchQuery}%`)
            .limit(5);
        setMembers(data || []);
        setLoading(false);
    }

    async function handleAssign() {
        if (!selectedMember || !selectedMinistryId) return;
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const orgId = (await supabase.from('profiles').select('org_id').eq('id', user?.id).single()).data?.org_id;

            const { data: token, error } = await supabase.rpc('invite_ministry_leader', {
                p_user_id: selectedMember.id,
                p_org_id: orgId,
                p_ministry_id: selectedMinistryId,
                p_role: selectedRole
            });

            if (error) throw error;

            toast.success(`Invitation generated for ${selectedMember.name}!`);
            // In a real app, you'd trigger a postmark/sendgrid email here.
            setSelectedMember(null);
            setSearchQuery("");
            setMembers([]);
        } catch (e: any) {
            toast.error(e.message || "Failed to assign role");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card className="bg-[#111] border-white/5 rounded-[2.5rem] p-8">
            <CardHeader className="p-0 mb-8">
                <CardTitle className="text-2xl font-black text-white flex items-center gap-3">
                    <UserPlus className="w-6 h-6 text-violet-500" />
                    Ministry Onboarding
                </CardTitle>
                <p className="text-white/30 text-xs font-bold tracking-widest mt-1 uppercase">Assign leadership roles to church members</p>
            </CardHeader>

            <CardContent className="p-0 space-y-8">
                <div className="space-y-4">
                    <div className="relative">
                        <Input
                            placeholder="Search member by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="bg-white/5 border-white/10 h-16 rounded-2xl px-12 text-white font-bold"
                        />
                        <Search className="absolute left-4 top-5 w-6 h-6 text-white/20" />
                        <Button
                            onClick={handleSearch}
                            className="absolute right-2 top-2 h-12 bg-white/10 hover:bg-white/20 rounded-xl"
                        >
                            SEARCH
                        </Button>
                    </div>

                    {members.length > 0 && (
                        <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/10">
                            {members.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setSelectedMember(m)}
                                    className={`w-full p-4 flex items-center justify-between hover:bg-white/5 transition-all ${selectedMember?.id === m.id ? 'bg-violet-500/10 border-l-4 border-violet-500' : ''}`}
                                >
                                    <div className="text-left">
                                        <p className="text-xs font-black text-white">{m.name}</p>
                                        <p className="text-[10px] text-white/30 font-bold">{m.email}</p>
                                    </div>
                                    <CheckCircle className={`w-4 h-4 ${selectedMember?.id === m.id ? 'text-violet-500' : 'text-white/10'}`} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {selectedMember && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pt-6 border-t border-white/5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Target Ministry</label>
                                <select
                                    value={selectedMinistryId}
                                    onChange={(e) => setSelectedMinistryId(e.target.value)}
                                    className="w-full h-16 bg-white/5 border-white/10 rounded-2xl px-6 text-white font-bold appearance-none outline-none focus:ring-2 focus:ring-violet-500"
                                >
                                    {ministries.map(m => <option key={m.id} value={m.id} className="bg-[#111]">{m.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Platform Role</label>
                                <select
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                    className="w-full h-16 bg-white/5 border-white/10 rounded-2xl px-6 text-white font-bold appearance-none outline-none focus:ring-2 focus:ring-violet-500"
                                >
                                    <option value="ministry_leader" className="bg-[#111]">Ministry Leader</option>
                                    <option value="ministry_worker" className="bg-[#111]">Ministry Worker (Input only)</option>
                                    <option value="shepherd" className="bg-[#111]">Shepherd (Care focus)</option>
                                </select>
                            </div>
                        </div>

                        <Button
                            onClick={handleAssign}
                            disabled={loading}
                            className="w-full h-16 bg-violet-600 hover:bg-violet-500 text-white font-black rounded-2xl shadow-xl shadow-violet-600/20 uppercase tracking-widest"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Mail className="w-5 h-5 mr-2" />}
                            {loading ? "ASSIGNING..." : `ASSIGN ${selectedMember.name.toUpperCase()} TO LEADERSHIP`}
                        </Button>
                    </motion.div>
                )}
            </CardContent>
        </Card>
    );
}
