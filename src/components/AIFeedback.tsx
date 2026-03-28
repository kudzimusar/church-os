"use client";

import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AIFeedbackProps {
  logId: string | null; // The ID of the log entry to update
  onFeedbackSubmitted?: () => void;
}

/**
 * AI FEEDBACK COMPONENT - Phase 5
 * Allows users to provide rapid feedback (thumbs up/down) on AI responses.
 * Updates the audit log entry created at the start of the interaction.
 */
export function AIFeedback({ logId, onFeedbackSubmitted }: AIFeedbackProps) {
  const [submitted, setSubmitted] = useState(false);
  const [showReason, setShowReason] = useState(false);
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If no logId, we can't associate feedback
  if (!logId) return null;

  const handleFeedback = async (rating: 'up' | 'down') => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('ai_conversation_logs')
        .update({
          feedback_rating: rating,
          feedback_reason: rating === 'down' ? reason : null
        })
        .eq('id', logId);
      
      if (error) throw error;
      
      setSubmitted(true);
      onFeedbackSubmitted?.();
    } catch (error: any) {
      console.error('[AI FEEDBACK] Submission failed:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 italic flex animate-in fade-in slide-in-from-bottom-1 duration-300">
        Thanks for your feedback! It helps improve my spiritual metrics.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 mt-1">
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleFeedback('up')}
          disabled={isLoading}
          className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group flex items-center"
          title="Helpful"
        >
          <ThumbsUp className="w-3 h-3 text-zinc-400 group-hover:text-amber-500 transition-colors" />
        </button>
        <button
          onClick={() => setShowReason(!showReason)}
          disabled={isLoading}
          className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group flex items-center"
          title="Needs improvement"
        >
          <ThumbsDown className="w-3 h-3 text-zinc-400 group-hover:text-red-500 transition-colors" />
        </button>
      </div>
      
      {showReason && !submitted && (
        <div className="flex flex-col gap-2 p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg animate-in fade-in duration-200">
          <textarea
            placeholder="How can I improve this response?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="text-[11px] px-2 py-1.5 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-md focus:ring-1 focus:ring-amber-500 min-h-[60px] outline-none"
          />
          <div className="flex gap-2 justify-end">
            <button
               onClick={() => setShowReason(false)}
               className="text-[10px] px-2 py-1 text-zinc-500 hover:text-zinc-700"
            >
              Cancel
            </button>
            <button
              onClick={() => handleFeedback('down')}
              disabled={isLoading || !reason.trim()}
              className="text-[10px] px-3 py-1 bg-zinc-900 dark:bg-amber-600 text-white rounded-md disabled:opacity-50"
            >
              Submit Feedback
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
