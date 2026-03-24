"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createBibleStudyGroupAction, updateBibleStudyGroupAction } from "@/app/actions/admin";
import { MessagesSquare, Link, Clock, Calendar, BookOpen, User } from "lucide-react";
import { useAdminCtx } from "@/app/shepherd/dashboard/Context";
import { useStickyForm } from "@/hooks/useStickyForm";
import { supabase } from "@/lib/supabase";

import { MemberSearchSelect } from "../MemberSearchSelect";

export function BibleStudyGroupForm({ onSuccess, initialData }: { onSuccess: () => void, initialData?: any }) {
    const { orgId } = useAdminCtx();
    const [loading, setLoading] = useState(false);
    
    const { values, handleChange, clear } = useStickyForm(initialData || {
        name: "",
        description: "",
        meeting_type: "in-person",
        leader_id: "",
        assistant_leader_id: "",
        meeting_link: "",
        meeting_day: "",
        meeting_time: "",
        curriculum: "",
        location: "",
        is_private: false,
        requires_approval: false,
        max_members: 50
    }, initialData ? `edit-group-${initialData.id}` : "bible-study-group-form");
    
    const meetingType = values.meeting_type;
    const setMeetingType = (val: string) => handleChange("meeting_type", val);
    
    // Member fetching logic removed as it's now handled by the searchable component

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        
        const payload = { ...values, orgId };
        
        const result = initialData 
            ? await updateBibleStudyGroupAction(initialData.id, payload)
            : await createBibleStudyGroupAction(payload);

        if (result.success) {
            toast.success(initialData ? "Group updated!" : "Bible Study Group created!");
            clear();
            onSuccess();
        } else {
            toast.error("Error: " + result.error);
        }
        setLoading(false);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 pt-4 max-h-[70vh] overflow-y-auto px-1 custom-scrollbar">
            {/* Header Section */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground">Group Name</label>
                    <div className="relative">
                        <MessagesSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30" />
                        <Input 
                            name="name" 
                            value={values.name || ''}
                            onChange={(e) => handleChange("name", e.target.value)}
                            placeholder="e.g. Wednesday Night Fellowship" 
                            className="bg-muted border-border text-foreground text-xs pl-9 placeholder:text-muted-foreground/40" 
                            required 
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground">Description</label>
                    <Textarea 
                        name="description" 
                        value={values.description || ''}
                        onChange={(e) => handleChange("description", e.target.value)}
                        placeholder="Briefly describe the focus of this group..." 
                        className="bg-muted border-border text-foreground text-xs min-h-[80px] placeholder:text-muted-foreground/40" 
                    />
                </div>
            </div>

            {/* Logistics Section */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground">Meeting Day</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30" />
                        <Input 
                            name="meeting_day" 
                            value={values.meeting_day || ''}
                            onChange={(e) => handleChange("meeting_day", e.target.value)}
                            placeholder="e.g. Wednesday" 
                            className="bg-muted border-border text-foreground text-xs pl-9" 
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground">Meeting Time</label>
                    <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30" />
                        <Input 
                            name="meeting_time" 
                            value={values.meeting_time || ''}
                            onChange={(e) => handleChange("meeting_time", e.target.value)}
                            placeholder="e.g. 7:30 PM" 
                            className="bg-muted border-border text-foreground text-xs pl-9" 
                        />
                    </div>
                </div>
            </div>

            {/* Venue Section */}
            <div className="p-4 bg-muted/30 rounded-2xl border border-border/50 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground">Meeting Type</label>
                        <select 
                            name="meeting_type" 
                            value={meetingType}
                            onChange={(e) => setMeetingType(e.target.value)}
                            className="w-full h-9 bg-muted border border-border rounded-xl px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                            <option value="in-person">In-Person</option>
                            <option value="online">Online</option>
                            <option value="hybrid">Hybrid</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground">Max Members</label>
                        <Input 
                            type="number"
                            name="max_members"
                            value={values.max_members || ''}
                            onChange={(e) => handleChange("max_members", parseInt(e.target.value))}
                            className="bg-muted border-border text-foreground text-xs h-9"
                        />
                    </div>
                </div>

                {(meetingType === 'online' || meetingType === 'hybrid') && (
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground">Meeting Link</label>
                        <div className="relative">
                            <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30" />
                            <Input 
                                name="meeting_link" 
                                value={values.meeting_link || ''}
                                onChange={(e) => handleChange("meeting_link", e.target.value)}
                                placeholder="https://zoom.us/j/..." 
                                className="bg-muted border-border text-foreground text-xs pl-9" 
                            />
                        </div>
                    </div>
                )}

                {(meetingType === 'in-person' || meetingType === 'hybrid') && (
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground">Location / Venue</label>
                        <Input 
                            name="location" 
                            value={values.location || ''}
                            onChange={(e) => handleChange("location", e.target.value)}
                            placeholder="e.g. Church Hall or Brother Smith's House" 
                            className="bg-muted border-border text-foreground text-xs" 
                        />
                    </div>
                )}
            </div>

            {/* Leadership Section */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground">Primary Leader</label>
                    <MemberSearchSelect 
                        onSelect={(id) => handleChange("leader_id", id)}
                        selectedId={values.leader_id}
                        placeholder="Select a Leader"
                        showSkills={true}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground">Assistant (Optional)</label>
                    <MemberSearchSelect 
                        onSelect={(id) => handleChange("assistant_leader_id", id)}
                        selectedId={values.assistant_leader_id}
                        placeholder="None"
                        showSkills={true}
                    />
                </div>
            </div>

            {/* Governance Section */}
            <div className="flex flex-wrap gap-6 p-4 bg-muted/20 rounded-2xl border border-dashed border-border">
                <div className="flex items-center gap-3">
                    <input 
                        type="checkbox" 
                        id="requires_approval"
                        checked={values.requires_approval}
                        onChange={(e) => handleChange("requires_approval", e.target.checked)}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <label htmlFor="requires_approval" className="text-xs font-bold text-foreground cursor-pointer">Require Approval to Join</label>
                </div>
                <div className="flex items-center gap-3">
                    <input 
                        type="checkbox" 
                        id="is_private"
                        checked={values.is_private}
                        onChange={(e) => handleChange("is_private", e.target.checked)}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <label htmlFor="is_private" className="text-xs font-bold text-foreground cursor-pointer">Private (Invite Link Only)</label>
                </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-5 rounded-xl shadow-lg shadow-violet-500/20 transition-all">
                {loading ? "Saving..." : (initialData ? "Update Bible Study Group" : "Initialize Bible Study Group")}
            </Button>
        </form>
    );
}
