'use server';
import { createClient } from '@supabase/supabase-js';
import { encryptCredential } from '@/lib/email-credential-encryption';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function getAuthUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export interface ImapConnectionData {
  email_address: string;
  display_name?: string;
  imap_host: string;
  imap_port: number;
  imap_username: string;
  imap_password: string;
  imap_use_ssl: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  smtp_use_tls: boolean;
  org_id: string;
}

export async function connectImapAccount(data: ImapConnectionData): Promise<{ success: boolean; accountId?: string; error?: string }> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: 'Not authenticated' };

  const supabase = adminClient();

  const encImapPw = encryptCredential(data.imap_password);
  const encSmtpPw = encryptCredential(data.smtp_password);

  const { data: account, error } = await supabase
    .from('connected_email_accounts')
    .upsert({
      org_id: data.org_id,
      member_id: userId,
      email_address: data.email_address,
      display_name: data.display_name ?? data.email_address,
      provider: 'imap',
      imap_host: data.imap_host,
      imap_port: data.imap_port,
      imap_username: data.imap_username,
      imap_password_encrypted: encImapPw,
      imap_use_ssl: data.imap_use_ssl,
      smtp_host: data.smtp_host,
      smtp_port: data.smtp_port,
      smtp_username: data.smtp_username,
      smtp_password_encrypted: encSmtpPw,
      smtp_use_tls: data.smtp_use_tls,
      connection_status: 'active',
      sync_enabled: true,
      show_in_unified_inbox: true,
      can_send_from: true,
      auto_classify_with_ai: true,
    }, { onConflict: 'member_id,email_address', ignoreDuplicates: false })
    .select('id')
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, accountId: account.id };
}

export async function disconnectAccount(accountId: string): Promise<{ success: boolean; error?: string }> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: 'Not authenticated' };

  const supabase = adminClient();
  const { error } = await supabase
    .from('connected_email_accounts')
    .update({ connection_status: 'disconnected', sync_enabled: false })
    .eq('id', accountId)
    .eq('member_id', userId);

  return error ? { success: false, error: error.message } : { success: true };
}

export async function setPrimaryAccount(accountId: string): Promise<{ success: boolean; error?: string }> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: 'Not authenticated' };

  const supabase = adminClient();
  const { error } = await supabase.rpc('set_primary_email_account', { p_account_id: accountId });
  return error ? { success: false, error: error.message } : { success: true };
}

export async function pauseSyncForAccount(accountId: string): Promise<{ success: boolean; error?: string }> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: 'Not authenticated' };

  const supabase = adminClient();
  const { error } = await supabase
    .from('connected_email_accounts')
    .update({ sync_enabled: false })
    .eq('id', accountId)
    .eq('member_id', userId);
  return error ? { success: false, error: error.message } : { success: true };
}

export async function resumeSyncForAccount(accountId: string): Promise<{ success: boolean; error?: string }> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: 'Not authenticated' };

  const supabase = adminClient();
  const { error } = await supabase
    .from('connected_email_accounts')
    .update({ sync_enabled: true, connection_status: 'active' })
    .eq('id', accountId)
    .eq('member_id', userId);
  return error ? { success: false, error: error.message } : { success: true };
}

export async function updateAccountSettings(
  accountId: string,
  settings: {
    display_name?: string;
    account_color?: string;
    show_in_unified_inbox?: boolean;
    can_send_from?: boolean;
    auto_classify_with_ai?: boolean;
    route_to_church_inbox?: boolean;
    sync_frequency_minutes?: number;
  },
): Promise<{ success: boolean; error?: string }> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: 'Not authenticated' };

  const supabase = adminClient();
  const { error } = await supabase
    .from('connected_email_accounts')
    .update(settings)
    .eq('id', accountId)
    .eq('member_id', userId);
  return error ? { success: false, error: error.message } : { success: true };
}

export async function triggerManualSync(accountId: string): Promise<{ success: boolean; error?: string }> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: 'Not authenticated' };

  const supabase = adminClient();
  // Verify ownership
  const { data: account } = await supabase
    .from('connected_email_accounts')
    .select('id, member_id')
    .eq('id', accountId)
    .eq('member_id', userId)
    .single();
  if (!account) return { success: false, error: 'Account not found' };

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/email-sync-account`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ account_id: accountId }),
    },
  );
  return res.ok ? { success: true } : { success: false, error: `Sync failed: ${res.status}` };
}

export async function testAccountConnection(accountId: string): Promise<{ success: boolean; error?: string }> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: 'Not authenticated' };

  const supabase = adminClient();
  const { data: account } = await supabase
    .from('connected_email_accounts')
    .select('id, member_id, connection_status, last_successful_sync_at')
    .eq('id', accountId)
    .eq('member_id', userId)
    .single();

  if (!account) return { success: false, error: 'Account not found' };
  return {
    success: account.connection_status === 'active',
    error: account.connection_status !== 'active' ? `Status: ${account.connection_status}` : undefined,
  };
}
