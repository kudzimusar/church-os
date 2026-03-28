"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createBroadcast } from "@/app/super-admin/ai-ops/actions";
import { toast } from "sonner";
import { Megaphone, Users, Target, Calendar, Loader2, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  plans: any[];
  orgs: any[];
}

export default function BroadcastForm({ plans, orgs }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    target_type: "all" as "all" | "plan" | "selected",
    target_metadata: {} as any,
    scheduled_at: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.message) return toast.error("Please fill title and message");

    try {
      setLoading(true);
      const result = await createBroadcast({
        ...formData,
        scheduled_at: formData.scheduled_at || undefined
      });

      if (result.success) {
        toast.success("Broadcast created and scheduled.");
        setFormData({ title: "", message: "", target_type: "all", target_metadata: {}, scheduled_at: "" });
      } else {
        toast.error(`Error: ${result.error}`);
      }
    } catch (err: any) {
      toast.error("Failed to build broadcast.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl rounded-2xl">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400">
               <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-white tracking-tight">Compose Platform Broadcast</CardTitle>
              <CardDescription className="text-slate-400 text-sm">Send high-priority system announcements to churches.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Broadcast Title</label>
                <Input 
                  placeholder="e.g. Critical System Update - Action Required" 
                  value={formData.title} 
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="bg-slate-800/30 border-slate-700/50 rounded-xl text-white py-6"
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Message Content</label>
                <Textarea 
                  placeholder="Draft your platform-wide announcement here..." 
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  className="bg-slate-800/30 border-slate-700/50 rounded-xl text-white min-h-[160px] resize-none"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 pl-1">
                        <Target className="w-3.5 h-3.5" /> Targeting Strategy
                    </label>
                    <Select 
                      value={formData.target_type} 
                      onValueChange={(val: any) => setFormData({ ...formData, target_type: val, target_metadata: {} })}
                    >
                        <SelectTrigger className="bg-slate-800/30 border-slate-700/50 rounded-xl text-white py-6">
                            <SelectValue placeholder="Select Target Audience" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800 text-slate-300">
                            <SelectItem value="all">All Active Churches</SelectItem>
                            <SelectItem value="plan">Target by Subscription Tier</SelectItem>
                            <SelectItem value="selected">Individual Selection</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 pl-1">
                        <Calendar className="w-3.5 h-3.5" /> Delivery Schedule
                    </label>
                    <Input 
                        type="datetime-local"
                        value={formData.scheduled_at}
                        onChange={e => setFormData({ ...formData, scheduled_at: e.target.value })}
                        className="bg-slate-800/30 border-slate-700/50 rounded-xl text-white py-6"
                    />
                </div>
            </div>

            {formData.target_type === 'plan' && (
                <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-3">Target Subscriptions</label>
                    <div className="flex flex-wrap gap-2">
                        {plans.map(plan => (
                             <Badge 
                                key={plan.id}
                                variant={formData.target_metadata.plan_id === plan.id ? 'default' : 'outline'}
                                className="cursor-pointer py-1.5 px-3 border-indigo-500/20 uppercase text-[10px]"
                                onClick={() => setFormData({ ...formData, target_metadata: { plan_id: plan.id } })}
                             >
                                 {plan.name} Tier
                             </Badge>
                        ))}
                    </div>
                </div>
            )}

            {formData.target_type === 'selected' && (
                <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-3">Recipient Audit</label>
                    <Select 
                      onValueChange={(val) => {
                        const currentIds = formData.target_metadata.org_ids || [];
                        if (!currentIds.includes(val)) {
                          setFormData({ ...formData, target_metadata: { org_ids: [...currentIds, val] } });
                        }
                      }}
                    >
                        <SelectTrigger className="bg-slate-800/30 border-slate-700/50 rounded-xl text-white h-10">
                            <SelectValue placeholder="Add Target Organization" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800 text-slate-300">
                            {orgs.map(org => (
                                <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    
                    <div className="mt-4 flex flex-wrap gap-2">
                        {(formData.target_metadata.org_ids || []).map((id: string) => (
                             <Badge 
                                key={id} 
                                variant="secondary" 
                                className="bg-slate-800 text-slate-300 border-slate-700 pl-3 pr-2 py-1 gap-2 rounded-lg"
                             >
                                {orgs.find(o => o.id === id)?.name || id}
                                <button 
                                  onClick={() => setFormData({ ...formData, target_metadata: { org_ids: formData.target_metadata.org_ids.filter((oid: string) => oid !== id) } })}
                                  className="hover:text-rose-400 transition-colors"
                                >
                                  ×
                                </button>
                             </Badge>
                        ))}
                    </div>
                </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="bg-slate-800/20 p-6 flex items-center justify-between border-t border-slate-800/50">
            <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                        <div key={i} className="w-6 h-6 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center">
                            <Users className="w-3 h-3 text-slate-500" />
                        </div>
                    ))}
                </div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Targeting Platform Community</span>
            </div>
            <Button 
                disabled={loading} 
                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-8 py-6 h-auto shadow-[0_0_20px_rgba(79,70,229,0.3)] border-none transition-all duration-300 active:scale-95"
            >
                {loading ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Send className="w-4 h-4 mr-3" />}
                {formData.scheduled_at ? "Schedule Announcement" : "Broadcast Immediately"}
            </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
