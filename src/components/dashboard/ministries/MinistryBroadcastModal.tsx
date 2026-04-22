"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Users, ShieldAlert, Info, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

interface MinistryBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  ministryId: string;
  ministryName: string;
}

export function MinistryBroadcastModal({ isOpen, onClose, ministryId, ministryName }: MinistryBroadcastModalProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("all_volunteers");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSend = async () => {
    if (!subject || !body) return;
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      // Get org_id for the current user/context
      const { data: memberData } = await supabase.from('org_members').select('org_id').eq('user_id', user?.id).single();

      const { error } = await supabase.from('ministry_comms_outbox').insert({
        org_id: memberData?.org_id,
        ministry_id: ministryId,
        sender_id: user?.id,
        recipient_type: type,
        subject,
        body,
        status: 'sent'
      });

      if (error) throw error;
      
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error(err);
      alert("Failed to send broadcast.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-card border border-border rounded-[32px] shadow-2xl overflow-hidden"
          >
            {isSuccess ? (
              <div className="p-12 text-center space-y-4">
                 <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl mx-auto flex items-center justify-center">
                    <CheckCircle2 size={32} />
                 </div>
                 <h2 className="text-2xl font-black text-foreground">Message Dispatched</h2>
                 <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold">Email and SMS notifications sent.</p>
              </div>
            ) : (
              <>
                <div className="p-8 border-b border-border flex justify-between items-center bg-muted/30">
                  <div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">{ministryName} Silo</p>
                    <h2 className="text-xl font-black text-foreground">Internal Broadcast</h2>
                  </div>
                  <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-all">
                    <X size={18} />
                  </button>
                </div>

                <div className="p-8 space-y-6">
                  {/* Recipient Selector */}
                  <div className="flex gap-2">
                     <TypeBtn active={type === 'all_volunteers'} onClick={() => setType('all_volunteers')} icon={<Users size={12}/>} label="TEAM" />
                     <TypeBtn active={type === 'emergency'} onClick={() => setType('emergency')} icon={<ShieldAlert size={12}/>} label="CRISIS" />
                     <TypeBtn active={type === 'announcement'} onClick={() => setType('announcement')} icon={<Info size={12}/>} label="INFO" />
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Subject</label>
                      <input 
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        placeholder="Importance level / Topic..."
                        className="w-full bg-muted/20 border border-border rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:border-primary/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Message Body</label>
                      <textarea 
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        placeholder="Write your brief to the team..."
                        className="w-full bg-muted/20 border border-border rounded-2xl py-4 px-4 text-xs font-bold outline-none focus:border-primary/50 min-h-[140px] resize-none"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleSend} 
                    disabled={isLoading || !subject || !body}
                    className="w-full h-14 rounded-2xl bg-foreground text-background font-black text-[10px] tracking-[0.2em] uppercase hover:bg-foreground/90 active:scale-95 transition-all mt-4"
                  >
                    {isLoading ? "BROADCASTING..." : "DISPATCH BROADCAST"} <Send className="ml-2 w-3 h-3" />
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function TypeBtn({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-[9px] font-black tracking-widest uppercase transition-all ${
        active ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-muted/10 border-border text-muted-foreground hover:bg-muted/50'
      }`}
    >
      {icon} {label}
    </button>
  );
}
