"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { addGroupMemberAction } from "@/app/actions/bible-study";
import { supabase } from "@/lib/supabase";
import { User, Search, Shield, ShieldAlert } from "lucide-react";

export function AddGroupMemberForm({ groupId, onSuccess }: { groupId: string, onSuccess: () => void }) {
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [role, setRole] = useState("member");

    useEffect(() => {
        if (search.length < 3) {
            setResults([]);
            return;
        }

        const fetchResults = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('id, name, email')
                .or(`name.ilike.%${search}%,email.ilike.%${search}%`)
                .limit(5);
            setResults(data || []);
        };

        const timer = setTimeout(fetchResults, 300);
        return () => clearTimeout(timer);
    }, [search]);

    async function handleAdd() {
        if (!selectedUser) return;
        setLoading(true);
        const res = await addGroupMemberAction(groupId, selectedUser.id, role);
        if (res.success) {
            toast.success(`${selectedUser.name} added to the group!`);
            onSuccess();
        } else {
            toast.error(res.error || "Failed to add user.");
        }
        setLoading(false);
    }

    return (
        <div className="space-y-6 pt-4">
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground">Search Member</label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30" />
                    <Input 
                        value={search}
                        onChange={e => {
                            setSearch(e.target.value);
                            setSelectedUser(null);
                        }}
                        placeholder="Search by name or email (min 3 chars)..." 
                        className="bg-muted border-border text-foreground text-xs pl-9 placeholder:text-muted-foreground/40" 
                    />
                </div>
                
                {results.length > 0 && !selectedUser && (
                    <div className="mt-2 bg-card border border-border rounded-xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                        {results.map(u => (
                            <button 
                                key={u.id}
                                onClick={() => {
                                    setSelectedUser(u);
                                    setSearch(u.name);
                                    setResults([]);
                                }}
                                className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 text-left transition-colors border-b border-border/50 last:border-0"
                            >
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary uppercase">
                                    {u.name.slice(0, 2)}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-foreground">{u.name}</p>
                                    <p className="text-[10px] text-muted-foreground">{u.email}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {selectedUser && (
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 animate-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-black">
                            {selectedUser.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-bold text-foreground">{selectedUser.name}</p>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{selectedUser.email}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground">Assign Role</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={() => setRole("member")}
                                className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all text-[11px] font-bold ${
                                    role === "member" 
                                        ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                                        : "bg-muted border-border text-muted-foreground hover:bg-muted/70"
                                }`}
                            >
                                <Shield className="w-3.5 h-3.5" /> Normal Member
                            </button>
                            <button 
                                onClick={() => setRole("assistant")}
                                className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all text-[11px] font-bold ${
                                    role === "assistant" 
                                        ? "bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20" 
                                        : "bg-muted border-border text-muted-foreground hover:bg-muted/70"
                                }`}
                            >
                                <ShieldAlert className="w-3.5 h-3.5" /> Assistant Leader
                            </button>
                        </div>
                    </div>

                    <Button 
                        onClick={handleAdd}
                        disabled={loading}
                        className="w-full mt-6 bg-primary text-white font-bold h-11 rounded-xl shadow-lg transition-all"
                    >
                        {loading ? "Adding..." : `Confirm Addition`}
                    </Button>
                </div>
            )}
        </div>
    );
}
