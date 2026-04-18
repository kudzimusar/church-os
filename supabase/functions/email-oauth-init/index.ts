import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const REDIRECT_URI = "https://churchos-ai.website/api/email/oauth-callback";

const PROVIDER_CONFIGS: Record<string, { authUrl: string; scope: string; extraParams?: Record<string, string> }> = {
  gmail: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    scope: "https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email",
    extraParams: { access_type: "offline", prompt: "consent" },
  },
  outlook: {
    authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    scope: "openid profile offline_access https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send",
    extraParams: { response_mode: "query" },
  },
  yahoo: {
    authUrl: "https://api.login.yahoo.com/oauth2/request_auth",
    scope: "mail-w",
    extraParams: {},
  },
};

const CLIENT_IDS: Record<string, string> = {
  gmail: Deno.env.get("GOOGLE_OAUTH_CLIENT_ID") ?? "",
  outlook: Deno.env.get("MICROSOFT_OAUTH_CLIENT_ID") ?? "",
  yahoo: Deno.env.get("YAHOO_OAUTH_CLIENT_ID") ?? "",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify JWT to get member_id
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { provider, org_id, redirect_url } = await req.json();
    if (!provider || !org_id || !PROVIDER_CONFIGS[provider]) {
      return new Response(JSON.stringify({ error: "Invalid provider or missing org_id" }), { status: 400, headers: corsHeaders });
    }

    // Generate state token (32 random bytes, hex-encoded)
    const stateBytes = new Uint8Array(32);
    crypto.getRandomValues(stateBytes);
    const stateToken = Array.from(stateBytes).map(b => b.toString(16).padStart(2, "0")).join("");

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    const { error: insertErr } = await supabase.from("oauth_states").insert({
      state_token: stateToken,
      member_id: user.id,
      org_id,
      provider,
      redirect_url: redirect_url ?? "/shepherd/dashboard/settings/email-accounts",
      expires_at: expiresAt,
    });

    if (insertErr) {
      return new Response(JSON.stringify({ error: insertErr.message }), { status: 500, headers: corsHeaders });
    }

    const config = PROVIDER_CONFIGS[provider];
    const clientId = CLIENT_IDS[provider];
    if (!clientId) {
      return new Response(JSON.stringify({ error: `OAuth client not configured for ${provider}` }), { status: 500, headers: corsHeaders });
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: REDIRECT_URI,
      response_type: "code",
      scope: config.scope,
      state: stateToken,
      ...config.extraParams,
    });

    const authorization_url = `${config.authUrl}?${params.toString()}`;
    return new Response(JSON.stringify({ authorization_url }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
