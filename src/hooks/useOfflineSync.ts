"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface OfflineQueueItem {
    id: string; // Internal local ID
    formId: string;
    userId: string;
    campusId?: string;
    values: Record<string, any>;
    timestamp: string;
}

const OFFLINE_QUEUE_KEY = "ministry_offline_queue";

/**
 * Hook to manage offline form submissions.
 * Stores failed submissions in localStorage and retries them when back online.
 */
export function useOfflineSync() {
    const [queueSize, setQueueSize] = useState(0);

    const getQueue = useCallback((): OfflineQueueItem[] => {
        const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
        return stored ? JSON.parse(stored) : [];
    }, []);

    const saveQueue = useCallback((queue: OfflineQueueItem[]) => {
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
        setQueueSize(queue.length);
    }, []);

    const addToQueue = (item: Omit<OfflineQueueItem, 'id' | 'timestamp'>) => {
        const queue = getQueue();
        const newItem: OfflineQueueItem = {
            ...item,
            id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            timestamp: new Date().toISOString()
        };
        saveQueue([...queue, newItem]);
        toast.warning("Submission saved to offline queue. It will sync once you are back online.");
    };

    const processQueue = useCallback(async () => {
        const queue = getQueue();
        if (queue.length === 0) return;

        console.log(`📡 Offline Sync: Processing ${queue.length} queued items...`);
        const remainingQueue: OfflineQueueItem[] = [];
        let successCount = 0;

        for (const item of queue) {
            try {
                // 1. Submit header
                const { data: submission, error: sError } = await supabase
                    .from('form_submissions')
                    .insert([{
                        form_id: item.formId,
                        user_id: item.userId,
                        campus_id: item.campusId,
                        submitted_at: item.timestamp,
                        notes: `[OFFLINE SYNC] Submitted from queue`
                    }])
                    .select()
                    .single();

                if (sError) throw sError;

                // 2. Insert Values
                const valuesToInsert = Object.entries(item.values).map(([fieldId, value]) => ({
                    submission_id: submission.id,
                    field_id: fieldId,
                    field_value: value.toString()
                }));

                const { error: vError } = await supabase
                    .from('form_submission_values')
                    .insert(valuesToInsert);

                if (vError) throw vError;

                // 3. Finalize
                await supabase.rpc('finalize_form_submission', { p_submission_id: submission.id });

                successCount++;
            } catch (err) {
                console.error("Offline Sync Error for item:", item.id, err);
                remainingQueue.push(item);
            }
        }

        saveQueue(remainingQueue);
        if (successCount > 0) {
            toast.success(`Successfully synchronized ${successCount} offline submissions!`);
        }
    }, [getQueue, saveQueue]);

    useEffect(() => {
        const handleOnline = () => processQueue();
        window.addEventListener('online', handleOnline);

        // Initial check
        if (navigator.onLine) {
            processQueue();
        }

        return () => window.removeEventListener('online', handleOnline);
    }, [processQueue]);

    return { addToQueue, queueSize, processQueue };
}
