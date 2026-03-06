"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { PILEngine } from "@/lib/pil-engine";
import { AdminAuth } from "@/lib/admin-auth";

/**
 * Server Action: Run the Prophetic Intelligence Sweep
 * Bypasses RLS using Service Role.
 */
export async function runPILScanner() {
    // Basic server-side guard
    // In a real app, we would verify the session/role here too.
    try {
        const results = await PILEngine.runIntelligenceSweep();
        return { success: true, results };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Fetch Prophetic Insights
 */
export async function getPropheticInsights() {
    try {
        const { data, error } = await supabaseAdmin
            .from('prophetic_insights')
            .select('*')
            .order('generated_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Acknowledge Insight
 */
export async function acknowledgeInsight(id: string) {
    try {
        const { error } = await supabaseAdmin
            .from('prophetic_insights')
            .update({ is_acknowledged: true })
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Get Critical AI Alert Count
 */
export async function getAlertCount() {
    try {
        const { count, error } = await supabaseAdmin
            .from('ai_insights')
            .select('*', { count: 'exact', head: true })
            .eq('priority', 'critical')
            .eq('is_acknowledged', false);

        if (error) throw error;
        return { success: true, count: count || 0 };
    } catch (error: any) {
        return { success: false, error: error.message, count: 0 };
    }
}

/**
 * Server Action: Get All Member Profiles
 */
export async function getMembers() {
    try {
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .order('name');

        if (error) throw error;
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Get Spiritual Analytics Data
 */
export async function getSpiritualStats() {
    try {
        const [statsRes, soapRes] = await Promise.all([
            supabaseAdmin.from('member_stats').select('*').order('engagement_score', { ascending: false }).limit(20),
            supabaseAdmin.from('soap_entries').select('*').order('created_at', { ascending: false }).limit(50),
        ]);

        if (statsRes.error) throw statsRes.error;
        if (soapRes.error) throw soapRes.error;

        return {
            success: true,
            stats: statsRes.data || [],
            soap: soapRes.data || []
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Get Financial Records
 */
export async function getFinanceRecords() {
    try {
        const { data, error } = await supabaseAdmin
            .from('financial_records')
            .select('*')
            .order('given_date', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
