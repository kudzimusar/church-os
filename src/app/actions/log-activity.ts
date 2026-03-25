"use server";
import { supabaseAdmin } from "@/lib/supabase-admin";
export type ActivityAction = 'LOGIN' | 'LOGOUT' | 'MEMBER_UPDATE' | 'FINANCE_EDIT' | 'ROLE_CHANGE' | 'INTELLIGENCE_SWEEP' | 'MINISTRY_UPDATE' | 'SOAP_ENTRY_CREATED' | 'PROFILE_UPDATE' | 'PREFERENCE_UPDATE';
export async function logActivityServer(userId: string, action: ActivityAction, details: string, metadata: any = {}) {
    const { error } = await supabaseAdmin.from('system_activity_logs').insert({ actor_id: userId, org_id: 'fa547adf-f820-412f-9458-d6bade11517d', action, details, metadata: { ...metadata, timestamp: new Date().toISOString() } });
    if (error) console.error("Activity log error:", error.message);
}
