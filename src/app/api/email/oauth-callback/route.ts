import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { encryptCredential } from '@/lib/email-credential-encryption';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const REDIRECT_URI = 'https://churchos-ai.website/api/email/oauth-callback';

const TOKEN_ENDPOINTS: Record<string, string> = {
  gmail: 'https://oauth2.googleapis.com/token',
  outlook: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  yahoo: 'https://api.login.yahoo.com/oauth2/get_token',
};

const CLIENT_IDS: Record<string, string> = {
  gmail: process.env.GOOGLE_OAUTH_CLIENT_ID ?? '',
  outlook: process.env.MICROSOFT_OAUTH_CLIENT_ID ?? '',
  yahoo: process.env.YAHOO_OAUTH_CLIENT_ID ?? '',
};

const CLIENT_SECRETS: Record<string, string> = {
  gmail: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? '',
  outlook: process.env.MICROSOFT_OAUTH_CLIENT_SECRET ?? '',
  yahoo: process.env.YAHOO_OAUTH_CLIENT_SECRET ?? '',
};

async function exchangeCodeForTokens(provider: string, code: string) {
  const res = await fetch(TOKEN_ENDPOINTS[provider], {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_IDS[provider],
      client_secret: CLIENT_SECRETS[provider],
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Token exchange failed: ${txt}`);
  }
  return res.json();
}

async function fetchGmailProfile(accessToken: string) {
  const res = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  return { email: data.emailAddress as string };
}

async function fetchOutlookProfile(accessToken: string) {
  const res = await fetch('https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  return { email: (data.mail || data.userPrincipalName) as string };
}

async function fetchUserEmail(provider: string, accessToken: string) {
  if (provider === 'gmail') return fetchGmailProfile(accessToken);
  if (provider === 'outlook') return fetchOutlookProfile(accessToken);
  // Yahoo uses OpenID — email is in id_token or from userinfo endpoint
  const res = await fetch('https://api.login.yahoo.com/openid/v1/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  return { email: data.email as string };
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/shepherd/dashboard/settings/email-accounts?error=oauth_denied', req.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/shepherd/dashboard/settings/email-accounts?error=missing_params', req.url));
  }

  try {
    // 1. Look up state token
    const { data: stateRow, error: stateErr } = await supabaseAdmin
      .from('oauth_states')
      .select('*')
      .eq('state_token', state)
      .single();

    if (stateErr || !stateRow) {
      return NextResponse.redirect(new URL('/shepherd/dashboard/settings/email-accounts?error=invalid_state', req.url));
    }

    if (new Date(stateRow.expires_at) < new Date()) {
      await supabaseAdmin.from('oauth_states').delete().eq('state_token', state);
      return NextResponse.redirect(new URL('/shepherd/dashboard/settings/email-accounts?error=state_expired', req.url));
    }

    // 2. Delete state token (one-time use)
    await supabaseAdmin.from('oauth_states').delete().eq('state_token', state);

    const { member_id, org_id, provider, redirect_url } = stateRow;

    // 3. Exchange code for tokens
    const tokenData = await exchangeCodeForTokens(provider, code);
    const { access_token, refresh_token, expires_in, scope } = tokenData;

    // 4. Fetch email address from provider
    const { email: emailAddress } = await fetchUserEmail(provider, access_token);
    if (!emailAddress) throw new Error('Could not determine email address from provider');

    // 5. Encrypt tokens
    const encryptedAccess = encryptCredential(access_token);
    const encryptedRefresh = refresh_token ? encryptCredential(refresh_token) : null;
    const oauthExpiresAt = expires_in
      ? new Date(Date.now() + expires_in * 1000).toISOString()
      : null;

    // 6. Upsert connected account
    const { data: account, error: upsertErr } = await supabaseAdmin
      .from('connected_email_accounts')
      .upsert({
        org_id,
        member_id,
        email_address: emailAddress,
        display_name: emailAddress,
        provider,
        oauth_access_token: encryptedAccess,
        oauth_refresh_token: encryptedRefresh,
        oauth_expires_at: oauthExpiresAt,
        oauth_scope: scope ?? null,
        connection_status: 'active',
        sync_enabled: true,
        show_in_unified_inbox: true,
        can_send_from: true,
        auto_classify_with_ai: true,
        route_to_church_inbox: true,
        last_sync_at: null,
      }, {
        onConflict: 'member_id,email_address',
        ignoreDuplicates: false,
      })
      .select('id')
      .single();

    if (upsertErr || !account) {
      throw new Error(upsertErr?.message ?? 'Failed to save account');
    }

    // 7. Trigger initial sync
    fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/email-sync-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ account_id: account.id, full_sync: true }),
    }).catch(e => console.error('Initial sync trigger failed:', e));

    const destUrl = redirect_url ?? '/shepherd/dashboard/settings/email-accounts';
    const finalUrl = `${destUrl}${destUrl.includes('?') ? '&' : '?'}connected=true&provider=${provider}`;
    return NextResponse.redirect(new URL(finalUrl, req.url));
  } catch (err: any) {
    console.error('[oauth-callback]', err);
    const errUrl = `/shepherd/dashboard/settings/email-accounts?error=${encodeURIComponent(err.message)}`;
    return NextResponse.redirect(new URL(errUrl, req.url));
  }
}
