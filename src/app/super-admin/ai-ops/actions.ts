"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/utils/supabase/server";

async function verifySuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: role } = await supabaseAdmin
    .from('admin_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (role?.role !== 'super_admin') throw new Error("Access denied");
  return user;
}

export async function createBroadcast(data: {
  title: string;
  message: string;
  target_type: 'all' | 'plan' | 'selected';
  target_metadata: any;
  scheduled_at?: string;
}) {
  try {
    const admin = await verifySuperAdmin();

    const { data: broadcast, error } = await supabaseAdmin
      .from('platform_broadcasts')
      .insert({
        title: data.title,
        message: data.message,
        target_type: data.target_type,
        target_metadata: data.target_metadata,
        scheduled_at: data.scheduled_at || new Date().toISOString(),
        created_by: admin.id
      })
      .select()
      .single();

    if (error) throw error;

    // Log action
    await supabaseAdmin
      .from('admin_audit_logs')
      .insert({
        admin_id: admin.id,
        action: 'create_broadcast',
        target_type: 'broadcast',
        target_id: broadcast.id,
        metadata: { target: data.target_type }
      });

    // If immediate, trigger dispatcher
    if (!data.scheduled_at || new Date(data.scheduled_at) <= new Date()) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (supabaseUrl && supabaseKey) {
        fetch(`${supabaseUrl}/functions/v1/dispatch-broadcasts`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${supabaseKey}` }
        }).catch(e => console.error("Dispatcher trigger failed:", e));
      }
    }

    return { success: true, broadcast };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getBroadcastStats(broadcastId: string) {
  try {
    await verifySuperAdmin();

    const { data: receipts } = await supabaseAdmin
      .from('broadcast_receipts')
      .select('is_read')
      .eq('broadcast_id', broadcastId);

    const total = receipts?.length || 0;
    const read = receipts?.filter(r => r.is_read).length || 0;

    return { 
      total, 
      read, 
      openRate: total > 0 ? (read / total) * 100 : 0 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
export async function forceReaggregateAnalytics() {
  try {
    await verifySuperAdmin();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) throw new Error("Missing configuration");

    const response = await fetch(`${supabaseUrl}/functions/v1/daily-analytics-aggregator`, {
      method: "POST",
      headers: { Authorization: `Bearer ${supabaseKey}` },
    });

    if (!response.ok) throw new Error("Failed to trigger aggregation");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
