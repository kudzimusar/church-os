import { supabase } from "@/lib/supabase";

export type ActivityAction = 'LOGIN' | 'LOGOUT' | 'MEMBER_UPDATE' | 'FINANCE_EDIT' | 'ROLE_CHANGE' | 'INTELLIGENCE_SWEEP' | 'MINISTRY_UPDATE' | 'SOAP_ENTRY_CREATED' | 'PROFILE_UPDATE' | 'PREFERENCE_UPDATE';

/**
 * Logs activity from the client side.
 * Resolves org_id dynamically from the authenticated user's org_members record.
 */
export async function logActivityServer(userId: string, action: ActivityAction, details: string, metadata: any = {}) {
    try {
        // Resolve org_id from org_members — never hardcode
        const { data: member } = await supabase
            .from('org_members')
            .select('org_id')
            .eq('user_id', userId)
            .limit(1)
            .single();

        const { error } = await supabase.from('system_activity_logs').insert({
            actor_id: userId,
            org_id: member?.org_id ?? null,
            action,
            details,
            metadata: { ...metadata, timestamp: new Date().toISOString() }
        });
        if (error) console.error("Activity log error:", error.message);
    } catch (err) {
        console.error("Failed to log activity:", err);
    }
}
