"use client";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search, User, Check, X, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useAdminCtx } from "@/app/shepherd/dashboard/Context";

interface Member {
    id: string;
    name: string;
    email: string;
    skills?: any[];
}

interface MemberSearchSelectProps {
    onSelect: (memberId: string) => void;
    placeholder?: string;
    selectedId?: string;
    showSkills?: boolean;
}

export function MemberSearchSelect({ onSelect, placeholder = "Search members...", selectedId, showSkills = true }: MemberSearchSelectProps) {
    const { orgId } = useAdminCtx();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Member[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Initial load for selected member
    useEffect(() => {
        if (selectedId) {
            supabase.from('profiles')
                .select('id, name, email')
                .eq('id', selectedId)
                .single()
                .then(({ data }) => {
                    if (data) setSelectedMember(data);
                });
        }
    }, [selectedId]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Debounced search
    useEffect(() => {
        if (!query || query.length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                let queryBuilder = supabase.from('profiles')
                    .select('id, name, email')
                    .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
                    .eq('org_id', orgId)
                    .limit(5);

                const { data, error } = await queryBuilder;

                if (data && showSkills) {
                    // Fetch skills for these members efficiently
                    const ids = data.map(m => m.id);
                    const { data: skillsData } = await supabase
                        .from('member_skills')
                        .select('user_id, skill_name, skill_level')
                        .in('user_id', ids);

                    const resultsWithSkills = data.map(m => ({
                        ...m,
                        skills: skillsData?.filter(s => s.user_id === m.id) || []
                    }));
                    setResults(resultsWithSkills);
                } else {
                    setResults(data || []);
                }
            } catch (err) {
                console.error("Search error:", err);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query, orgId, showSkills]);

    const handleSelect = (member: Member) => {
        setSelectedMember(member);
        onSelect(member.id);
        setOpen(false);
        setQuery("");
    };

    const clearSelection = () => {
        setSelectedMember(null);
        onSelect("");
        setQuery("");
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            {selectedMember ? (
                <div className="flex items-center justify-between p-2 pl-3 bg-muted border border-border rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-violet-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold leading-none">{selectedMember.name}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{selectedMember.email}</p>
                        </div>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-red-500"
                        onClick={clearSelection}
                    >
                        <X className="w-3.5 h-3.5" />
                    </Button>
                </div>
            ) : (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
                    <Input
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setOpen(true);
                        }}
                        onFocus={() => setOpen(true)}
                        placeholder={placeholder}
                        className="bg-muted border-border text-xs pl-9 h-10 placeholder:text-muted-foreground/30 rounded-xl focus-visible:ring-violet-500/30"
                    />
                    {loading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="w-3.5 h-3.5 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
                        </div>
                    )}
                </div>
            )}

            {open && !selectedMember && query.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-card border border-border rounded-xl shadow-2xl overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                    {results.length > 0 ? (
                        <div className="py-1">
                            {results.map((member) => (
                                <button
                                    key={member.id}
                                    onClick={() => handleSelect(member)}
                                    className="w-full flex items-center justify-between p-3 hover:bg-muted text-left transition-colors border-b border-border last:border-0"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-violet-500/5 flex items-center justify-center flex-shrink-0">
                                            <User className="w-4 h-4 text-violet-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold truncate">{member.name}</p>
                                            <p className="text-[10px] text-muted-foreground truncate">{member.email}</p>
                                            
                                            {/* AI Skill Tags */}
                                            {showSkills && member.skills && member.skills.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1.5">
                                                    {member.skills.slice(0, 3).map((s, idx) => (
                                                        <span key={idx} className="inline-flex items-center gap-1 text-[8px] font-black uppercase bg-violet-500/10 text-violet-600 px-1.5 py-0.5 rounded-md">
                                                            <Sparkles className="w-2 h-2" />
                                                            {s.skill_name}
                                                        </span>
                                                    ))}
                                                    {member.skills.length > 3 && (
                                                        <span className="text-[8px] text-muted-foreground ml-0.5">+{member.skills.length - 3}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <Check className="w-3.5 h-3.5 text-muted-foreground/20" />
                                </button>
                            ))}
                        </div>
                    ) : !loading ? (
                        <div className="p-4 text-center">
                            <p className="text-xs text-muted-foreground">No members found matching "{query}"</p>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}
