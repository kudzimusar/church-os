"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { joinBibleStudyGroupAction } from "@/app/actions/bible-study";
import { User, MessageCircle, Phone, Mail } from "lucide-react";

export function JoinGroupForm({ 
    group, 
    user, 
    shareToken, 
    onSuccess 
}: { 
    group: any; 
    user?: any; 
    shareToken?: string;
    onSuccess: () => void;
}) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        message: ""
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!user && (!formData.name || !formData.email)) {
            toast.error("Please provide your name and email.");
            return;
        }

        setLoading(true);
        const result = await joinBibleStudyGroupAction({
            groupId: group.id,
            userId: user?.id, // If logged in
            message: formData.message,
            shareToken
        });

        if (result.success) {
            if (result.status === 'joined') {
                toast.success("Successfully joined the group!");
            } else {
                toast.success("Join request sent! A leader will review it soon.");
            }
            onSuccess();
        } else {
            toast.error(result.error || "Failed to join group.");
        }
        setLoading(false);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 mb-6">
                <h4 className="font-bold text-foreground text-sm">Joining: {group.name}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                    {group.requires_approval ? "This group requires leader approval." : "You'll be added to the group immediately."}
                </p>
            </div>

            {!user && (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground">Your Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30" />
                            <Input 
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                placeholder="Full Name" 
                                className="bg-muted border-border text-foreground text-xs pl-9" 
                                required 
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30" />
                                <Input 
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                    placeholder="email@example.com" 
                                    className="bg-muted border-border text-foreground text-xs pl-9" 
                                    required 
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground">Phone (Optional)</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30" />
                                <Input 
                                    value={formData.phone}
                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                    placeholder="+1..." 
                                    className="bg-muted border-border text-foreground text-xs pl-9" 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground">Why do you want to join? (Optional)</label>
                <div className="relative">
                    <MessageCircle className="absolute left-3 top-3 w-3.5 h-3.5 text-muted-foreground/30" />
                    <Textarea 
                        value={formData.message}
                        onChange={e => setFormData({...formData, message: e.target.value})}
                        placeholder="Share a little bit about yourself..." 
                        className="bg-muted border-border text-foreground text-xs pl-9 pt-2.5 min-h-[100px]" 
                    />
                </div>
            </div>

            <div className="pt-2">
                <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-6 rounded-2xl shadow-lg transition-all">
                    {loading ? "Processing..." : (group.requires_approval ? "Request to Join" : "Join Group Now")}
                </Button>
                <p className="text-[10px] text-center text-muted-foreground mt-4 px-4">
                    By joining, you agree to the group guidelines and allow the leader to contact you regarding group activities.
                </p>
            </div>
        </form>
    );
}
