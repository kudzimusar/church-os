'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { draftNewsletter } from '@/app/actions/comms-draft-actions';
import { DraftReviewModal } from './DraftReviewModal';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Zap, BookOpen, Heart, Users, Star, Bell, Gift, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

const LUCIDE_ICONS: Record<string, any> = {
  BookOpen, Heart, Users, Star, Bell, Gift, MessageSquare, Zap,
};

interface NewsletterTypeSelectorProps {
  open: boolean;
  onClose: () => void;
  orgId: string;
}

const HUMAN_INPUT_TYPES = ['event_spotlight', 'ministry_update', 'pastoral_letter', 'generosity_appeal', 'testimony_edition'];

export function NewsletterTypeSelector({ open, onClose, orgId }: NewsletterTypeSelectorProps) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [humanInput, setHumanInput] = useState('');
  const [drafting, setDrafting] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [showDraftReview, setShowDraftReview] = useState(false);

  useEffect(() => {
    if (!open) return;
    supabase
      .from('newsletter_templates')
      .select('*')
      .eq('is_active', true)
      .order('display_name_en')
      .then(({ data }) => { setTemplates(data ?? []); setLoading(false); });
  }, [open]);

  const handleDraftNow = async (template: any) => {
    const needsInput = HUMAN_INPUT_TYPES.some(t => template.template_key?.includes(t));
    if (needsInput && !selected) {
      setSelected(template);
      return;
    }
    await createDraft(template, needsInput ? humanInput : undefined);
  };

  const createDraft = async (template: any, input?: string) => {
    setDrafting(true);
    try {
      const typeKey = (template.template_key ?? '').replace('newsletter_', '');
      const result = await draftNewsletter({
        org_id: orgId,
        newsletter_type: typeKey,
        audience_scope: template.default_audience_scope ?? 'org_wide',
        user_input: input ? { theme: input } : undefined,
      });
      if (result.error) throw new Error(result.error);
      setDraftId(result.draft_id!);
      setShowDraftReview(true);
      onClose();
    } catch (err: any) {
      toast.error(`Failed to draft: ${err.message}`);
    } finally {
      setDrafting(false);
      setSelected(null);
      setHumanInput('');
    }
  };

  if (!open && !showDraftReview) return null;

  return (
    <>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={onClose}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight text-foreground">Create Newsletter</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">AI drafts instantly from your church's live data</p>
                </div>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                  </div>
                ) : (
                  <>
                    {/* Human input step */}
                    {selected && (
                      <div className="mb-6 p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 space-y-3">
                        <p className="text-xs font-black uppercase tracking-widest text-violet-400">
                          Tell the AI what to feature in this {selected.display_name_en}
                        </p>
                        <textarea
                          value={humanInput}
                          onChange={e => setHumanInput(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-foreground focus:outline-none focus:border-violet-500/50"
                          placeholder={`E.g. "Feature the upcoming youth camp on May 3rd at Saitama"…`}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => createDraft(selected, humanInput)}
                            disabled={drafting || !humanInput.trim()}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 text-white text-xs font-black uppercase tracking-widest hover:bg-violet-700 disabled:opacity-50"
                          >
                            {drafting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                            Generate Draft
                          </button>
                          <button onClick={() => setSelected(null)} className="px-3 py-2 text-xs text-muted-foreground hover:text-foreground">
                            Back
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Template grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {templates.map(template => {
                        const IconComp = LUCIDE_ICONS[template.icon_name] ?? BookOpen;
                        const needsInput = HUMAN_INPUT_TYPES.some(t => template.template_key?.includes(t));
                        return (
                          <div
                            key={template.id}
                            className="flex flex-col gap-3 p-5 rounded-xl border border-white/10 bg-white/3 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all group"
                          >
                            <div className="flex items-start justify-between">
                              <div className="p-2 rounded-lg bg-violet-500/10 group-hover:bg-violet-500/20 transition-colors">
                                <IconComp className="w-4 h-4 text-violet-400" />
                              </div>
                              <div className="flex items-center gap-1.5">
                                {template.auto_send_eligible && (
                                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 uppercase tracking-widest">Auto</span>
                                )}
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground uppercase">
                                  {template.default_cadence ?? 'manual'}
                                </span>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-black text-foreground leading-tight">{template.display_name_en}</p>
                              <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{template.description_en}</p>
                            </div>
                            <button
                              onClick={() => handleDraftNow(template)}
                              disabled={drafting}
                              className="mt-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600/80 text-white text-xs font-black uppercase tracking-widest hover:bg-violet-600 transition-colors disabled:opacity-50"
                            >
                              {drafting && selected?.id === template.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Zap className="w-3.5 h-3.5" />
                              )}
                              {needsInput ? 'Set Focus & Draft' : 'Draft Now'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {draftId && (
        <DraftReviewModal
          draftId={draftId}
          open={showDraftReview}
          onClose={() => { setShowDraftReview(false); setDraftId(null); }}
        />
      )}
    </>
  );
}
