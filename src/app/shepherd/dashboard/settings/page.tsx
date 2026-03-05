"use client";

import { useEffect, useState } from "react";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { supabase } from "@/lib/supabase";
import { useAdminCtx } from "../layout";
import { AdminAuth, ADMIN_ROLES, ROLE_HIERARCHY, AdminRole } from "@/lib/admin-auth";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Users, Shield, Mail, Plus, Trash2, CheckCircle2, AlertCircle, Crown, User, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ROLE_ICONS: Record<string, any> = { super_admin: Crown, owner: Shield, shepherd: Shield, admin: User, ministry_lead: User };
const ROLE_COLORS: Record<string, string> = {
    super_admin: 'text-amber-400 bg-amber-500/20',
    owner: 'text-violet-400 bg-violet-500/20',
    shepherd: 'text-blue-400 bg-blue-500/20',
    admin: 'text-emerald-400 bg-emerald-500/20',
    ministry_lead: 'text-cyan-400 bg-cyan-500/20',
};

export default function SettingsPage() {
    const { role: myRole, userName, email: myEmail } = useAdminCtx() as any;
    const [team, setTeam] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInvite, setShowInvite] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<AdminRole>("admin");
    const [inviting, setInviting] = useState(false);
    const [tab, setTab] = useState<'profile' | 'team' | 'invitations'>('profile');

    const isSuperAdmin = AdminAuth.can(myRole, 'owner');

    useEffect(() => {
        supabaseAdmin.from('org_members').select('*, profiles(name, email)')
            .then(({ data }) => { setTeam(data || []); setLoading(false); });
    }, []);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;
        setInviting(true);

        try {
            // Send invite via Supabase Admin API
            const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(inviteEmail, {
                data: { role: inviteRole, invited_by: userName }
            });

            if (error) throw error;

            // Pre-create org_member record so role is assigned on first login
            if (data.user) {
                await supabaseAdmin.from('org_members').upsert({
                    user_id: data.user.id,
                    role: inviteRole,
                    org_id: null, // will be set by the user
                });
            }

            toast.success(`Invitation sent to ${inviteEmail} as ${inviteRole}`);
            setInviteEmail("");
            setShowInvite(false);
        } catch (err: any) {
            // If user already exists, still create the member record
            if (err.message?.includes('already been registered')) {
                toast.error('User already exists. Ask them to sign in at /shepherd/login');
            } else {
                toast.error(err.message || 'Failed to send invitation');
            }
        } finally {
            setInviting(false);
        }
    };

    const handleRevoke = async (memberId: string, memberName: string) => {
        if (!confirm(`Remove ${memberName} from admin access?`)) return;
        await supabaseAdmin.from('org_members').delete().eq('id', memberId);
        setTeam(prev => prev.filter(m => m.id !== memberId));
        toast.success(`${memberName} access revoked`);
    };

    return (
        <div className="p-6 xl:p-8">
            <div className="mb-6">
                <h1 className="text-xl font-black text-white">Settings & Team</h1>
                <p className="text-[11px] text-white/30 mt-0.5">Profile · Team management · Admin access control</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/5 w-fit mb-6">
                {(['profile', 'team', 'invitations'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all capitalize ${tab === t ? 'bg-violet-600 text-white' : 'text-white/30 hover:text-white/60'}`}>
                        {t}
                    </button>
                ))}
            </div>

            {/* Profile Tab */}
            {tab === 'profile' && (
                <div className="max-w-lg">
                    <div className="bg-[#111827] border border-white/5 rounded-2xl p-6">
                        <div className="flex items-center gap-4 mb-5">
                            <div className="w-14 h-14 rounded-2xl bg-violet-500/20 flex items-center justify-center text-xl font-black text-violet-400">
                                {userName?.[0]?.toUpperCase()}
                            </div>
                            <div>
                                <p className="text-base font-black text-white">{userName}</p>
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${ROLE_COLORS[myRole] || 'bg-white/10 text-white/40'}`}>
                                    {myRole?.replace(/_/g, ' ')?.toUpperCase()}
                                </span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Role</p>
                                <p className="text-xs text-white/60 capitalize">{myRole?.replace(/_/g, ' ')}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Role Level</p>
                                <p className="text-xs text-white/60">{ROLE_HIERARCHY[myRole as AdminRole] || 0} / 100</p>
                            </div>
                        </div>
                        <button
                            onClick={() => AdminAuth.logoutAdmin()}
                            className="mt-5 w-full h-10 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-black rounded-xl hover:bg-red-500/20 transition-all"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            )}

            {/* Team Tab */}
            {tab === 'team' && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-xs text-white/40">{team.length} admin users</p>
                        {isSuperAdmin && (
                            <button
                                onClick={() => setShowInvite(s => !s)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-black rounded-xl transition-all"
                            >
                                <Plus className="w-3.5 h-3.5" /> Invite Admin
                            </button>
                        )}
                    </div>

                    {/* Invite form */}
                    <AnimatePresence>
                        {showInvite && (
                            <motion.form
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                onSubmit={handleInvite}
                                className="bg-[#111827] border border-violet-500/20 rounded-2xl p-5 mb-4 space-y-3 overflow-hidden"
                            >
                                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Send Admin Invitation</p>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
                                        <input
                                            type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                                            placeholder="admin@church.org"
                                            className="w-full h-10 bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/40"
                                            required
                                        />
                                    </div>
                                    <select value={inviteRole} onChange={e => setInviteRole(e.target.value as AdminRole)}
                                        className="h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white/60 focus:outline-none min-w-[130px]">
                                        {ADMIN_ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                                    </select>
                                </div>
                                <div className="flex gap-2">
                                    <button type="submit" disabled={inviting}
                                        className="flex-1 h-9 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-[10px] font-black rounded-xl transition-all flex items-center justify-center gap-1.5">
                                        {inviting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Sending...</> : <><Mail className="w-3.5 h-3.5" />Send Invite Email</>}
                                    </button>
                                    <button type="button" onClick={() => setShowInvite(false)}
                                        className="h-9 px-4 bg-white/5 text-white/40 text-[10px] font-black rounded-xl hover:bg-white/10 transition-all">
                                        Cancel
                                    </button>
                                </div>
                                <p className="text-[9px] text-white/20">The user will receive an email with a magic link to set their password and access the admin dashboard.</p>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    {/* Team list */}
                    <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
                        <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-white/5">
                            {['Member', 'Role', 'Joined', ''].map(h => (
                                <p key={h} className="text-[8px] font-black text-white/25 uppercase tracking-widest">{h}</p>
                            ))}
                        </div>
                        {loading ? (
                            <div className="p-8 text-center text-white/25 text-xs">Loading team...</div>
                        ) : team.length === 0 ? (
                            <div className="p-8 text-center text-white/25 text-xs">No admin team members yet.</div>
                        ) : (
                            <div className="divide-y divide-white/3">
                                {team.map(m => {
                                    const RoleIcon = ROLE_ICONS[m.role] || User;
                                    const name = m.profiles?.name || 'Unknown';
                                    const email = m.profiles?.email || '';
                                    const canRevoke = isSuperAdmin && m.role !== 'super_admin';
                                    return (
                                        <div key={m.id} className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 px-5 py-3.5 items-center">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-7 h-7 rounded-lg bg-violet-500/15 flex items-center justify-center text-[10px] font-black text-violet-400 flex-shrink-0">
                                                    {name[0]?.toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-white truncate">{name}</p>
                                                    <p className="text-[9px] text-white/30 truncate">{email}</p>
                                                </div>
                                            </div>
                                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-lg capitalize w-fit ${ROLE_COLORS[m.role] || 'bg-white/10 text-white/40'}`}>
                                                {m.role?.replace(/_/g, ' ')}
                                            </span>
                                            <p className="text-[10px] text-white/30">
                                                {m.joined_at ? new Date(m.joined_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
                                            </p>
                                            {canRevoke ? (
                                                <button onClick={() => handleRevoke(m.id, name)}
                                                    className="text-red-400/40 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-500/10">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            ) : <div />}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Invitations tab */}
            {tab === 'invitations' && (
                <div className="bg-[#111827] border border-white/5 rounded-2xl p-6 text-center text-white/25 text-xs">
                    <Mail className="w-8 h-8 mx-auto mb-3 opacity-30" />
                    <p>Invitation tracking coming soon.</p>
                    <p className="mt-1 text-[10px]">Sent invitations will be listed here with status (pending/accepted/expired).</p>
                </div>
            )}
        </div>
    );
}
