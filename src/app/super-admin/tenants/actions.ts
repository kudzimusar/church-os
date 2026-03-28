"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/utils/supabase/server"; // Standard server-side client

/**
 * Ensures the currently authenticated user has the 'super_admin' role.
 */
async function verifySuperAdmin() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Unauthorized");

  const { data: role, error: roleError } = await supabaseAdmin
    .from('admin_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (roleError || !role || role.role !== 'super_admin') {
    throw new Error("Unauthorized: Super Admin access required");
  }

  return user;
}

/**
 * Updates an organization's status (active, suspended).
 */
export async function updateOrgStatus(orgId: string, status: string) {
  try {
    const admin = await verifySuperAdmin();

    const { error } = await supabaseAdmin
      .from('organizations')
      .update({ status })
      .eq('id', orgId);

    if (error) throw error;

    // Log the action
    await supabaseAdmin
      .from('admin_audit_logs')
      .insert({
        admin_id: admin.id,
        action: 'status_update',
        target_type: 'organization',
        target_id: orgId,
        metadata: { new_status: status }
      });

    return { success: true };
  } catch (error: any) {
    console.error("Action Error [updateOrgStatus]:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Manually updates subscription plan and status.
 */
export async function updateOrgSubscription(orgId: string, data: { planId: string, status: string }) {
  try {
    const admin = await verifySuperAdmin();

    // Check if subscription exists
    const { data: existingSub } = await supabaseAdmin
      .from('organization_subscriptions')
      .select('id')
      .eq('org_id', orgId)
      .single();

    let result;
    if (existingSub) {
      result = await supabaseAdmin
        .from('organization_subscriptions')
        .update({
          plan_id: data.planId,
          status: data.status,
          updated_at: new Date().toISOString()
        })
        .eq('org_id', orgId);
    } else {
      // Create new
      result = await supabaseAdmin
        .from('organization_subscriptions')
        .insert({
          org_id: orgId,
          plan_id: data.planId,
          status: data.status,
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Default 30 days
        });
    }

    if (result.error) throw result.error;

    // Log the action
    await supabaseAdmin
      .from('admin_audit_logs')
      .insert({
        admin_id: admin.id,
        action: 'subscription_override',
        target_type: 'organization',
        target_id: orgId,
        metadata: data
      });

    return { success: true };
  } catch (error: any) {
    console.error("Action Error [updateOrgSubscription]:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Triggers an on-demand AI analysis for a specific organization.
 * Calls the 'ai-decision-engine' edge function via service role.
 */
export async function refreshAIAnalysis(orgId: string) {
  try {
    const admin = await verifySuperAdmin();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase configuration missing (service role key required)");
    }

    // Call the Edge Function
    const response = await fetch(`${supabaseUrl}/functions/v1/ai-decision-engine`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        org_id: orgId,
        force_refresh: true 
      }),
    });

    if (!response.ok) {
        throw new Error(`Edge Function returned status ${response.status}`);
    }

    const result = await response.json();

    // Log the action
    await supabaseAdmin
      .from('admin_audit_logs')
      .insert({
        admin_id: admin.id,
        action: 'ai_refresh',
        target_type: 'organization',
        target_id: orgId,
        metadata: { 
          result: 'success',
          insights_count: (result.insights || []).length
        }
      });

    return { success: true, insights: result.insights };
  } catch (error: any) {
    console.error("Action Error [refreshAIAnalysis]:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Initiates an impersonation session by marking the admin's metadata.
 */
export async function impersonateUser(targetUserId: string, targetOrgId: string) {
  try {
    const admin = await verifySuperAdmin();
    const supabase = await createClient();

    // Update the admin's own metadata to track who they are impersonating
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        original_user_id: admin.id,
        impersonated_user_id: targetUserId,
        impersonated_org_id: targetOrgId
      }
    });

    if (updateError) throw updateError;

    // Log the action
    await supabaseAdmin
      .from('admin_audit_logs')
      .insert({
        admin_id: admin.id,
        action: 'impersonate_user',
        target_type: 'user',
        target_id: targetUserId,
        metadata: { org_id: targetOrgId }
      });

    return { success: true };
  } catch (error: any) {
    console.error("Action Error [impersonateUser]:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Clears impersonation metadata.
 */
export async function exitImpersonation() {
  try {
    const supabase = await createClient();
    
    // Clear the metadata
    await supabase.auth.updateUser({
      data: {
        original_user_id: null,
        impersonated_user_id: null,
        impersonated_org_id: null
      }
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
