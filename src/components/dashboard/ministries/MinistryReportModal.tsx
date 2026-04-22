"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Calculator, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

interface MinistryReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  ministryId: string;
  ministryName: string;
}

export function MinistryReportModal({ isOpen, onClose, ministryId, ministryName }: MinistryReportModalProps) {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [formValues, setFormValues] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    async function loadMetrics() {
      const { data } = await supabase.from('ministry_metric_definitions').select('*').eq('ministry_id', ministryId);
      setMetrics(data || []);
      // Initialize form
      const initial: any = {};
      data?.forEach(m => initial[m.metric_key] = 0);
      setFormValues(initial);
    }
    loadMetrics();
  }, [isOpen, ministryId]);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const logs = Object.entries(formValues).map(([key, val]) => ({
        ministry_id: ministryId,
        metric_key: key,
        value: val,
        recorded_by: user?.id
      }));

      const { error } = await supabase.from('ministry_metric_logs').insert(logs);
      if (error) throw error;

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error(err);
      alert("Failed to submit report.");
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
            className="relative w-full max-w-md bg-card border border-border rounded-[32px] shadow-2xl overflow-hidden"
          >
            {isSuccess ? (
              <div className="p-12 text-center space-y-4">
                 <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl mx-auto flex items-center justify-center">
                    <CheckCircle2 size={32} />
                 </div>
                 <h2 className="text-2xl font-black text-foreground">Report Filed</h2>
                 <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold">Synchronizing intelligence...</p>
              </div>
            ) : (
              <>
                <div className="p-8 border-b border-border flex justify-between items-center bg-muted/30">
                  <div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">{ministryName}</p>
                    <h2 className="text-xl font-black text-foreground">Weekly Pulse Report</h2>
                  </div>
                  <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-all">
                    <X size={18} />
                  </button>
                </div>

                <div className="p-8 space-y-6">
                  {metrics.map(m => (
                    <div key={m.metric_key} className="space-y-3">
                      <div className="flex justify-between items-center">
                         <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">{m.label}</label>
                         <span className="text-[10px] font-bold text-muted-foreground opacity-40">Unit: {m.unit}</span>
                      </div>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none">
                           <Calculator size={14} />
                        </div>
                        <input 
                          type="number"
                          value={formValues[m.metric_key]}
                          onChange={(e) => setFormValues({...formValues, [m.metric_key]: parseFloat(e.target.value)})}
                          className="w-full bg-muted/20 border border-border rounded-2xl py-4 pl-12 pr-4 text-sm font-black outline-none focus:border-primary/50 transition-all"
                        />
                      </div>
                    </div>
                  ))}

                  {metrics.length === 0 && (
                     <div className="py-12 text-center text-muted-foreground/40 text-xs font-bold uppercase border-2 border-dashed border-border rounded-3xl">
                        Loading silo metrics...
                     </div>
                  )}

                  <Button 
                    onClick={handleSubmit} 
                    disabled={isLoading || metrics.length === 0}
                    className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-black text-xs tracking-widest uppercase shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-4"
                  >
                    {isLoading ? "Syncing..." : "VALIDATE & SUBMIT"} <Send className="ml-2 w-4 h-4" />
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
