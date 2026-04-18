import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { decryptCredential, encryptCredential } from "../_shared/email-encryption.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function b64url(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function buildRfc822(opts: {
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyText?: string;
  bodyHtml: string;
  inReplyTo?: string;
  references?: string;
}): string {
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const lines: string[] = [];
  lines.push(`From: ${opts.from}`);
  lines.push(`To: ${opts.to.join(", ")}`);
  if (opts.cc?.length) lines.push(`Cc: ${opts.cc.join(", ")}`);
  if (opts.bcc?.length) lines.push(`Bcc: ${opts.bcc.join(", ")}`);
  lines.push(`Subject: ${opts.subject}`);
  if (opts.inReplyTo) lines.push(`In-Reply-To: ${opts.inReplyTo}`);
  if (opts.references) lines.push(`References: ${opts.references}`);
  lines.push(`MIME-Version: 1.0`);
  lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
  lines.push(``);
  if (opts.bodyText) {
    lines.push(`--${boundary}`);
    lines.push(`Content-Type: text/plain; charset="UTF-8"`);
    lines.push(``);
    lines.push(opts.bodyText);
    lines.push(``);
  }
  lines.push(`--${boundary}`);
  lines.push(`Content-Type: text/html; charset="UTF-8"`);
  lines.push(``);
  lines.push(opts.bodyHtml);
  lines.push(``);
  lines.push(`--${boundary}--`);
  return lines.join("\r\n");
}

async function refreshGmailToken(refreshToken: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: Deno.env.get("GOOGLE_OAUTH_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET")!,
    }),
  });
  if (!res.ok) throw new Error(`Gmail token refresh failed: ${await res.text()}`);
  return res.json();
}

async function refreshOutlookToken(refreshToken: string) {
  const res = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: Deno.env.get("MICROSOFT_OAUTH_CLIENT_ID")!,
      client_secret: Deno.env.get("MICROSOFT_OAUTH_CLIENT_SECRET")!,
      scope: "offline_access https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send",
    }),
  });
  if (!res.ok) throw new Error(`Outlook token refresh failed: ${await res.text()}`);
  return res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    // Verify JWT
    const authHeader = req.headers.get("authorization") ?? "";
    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { account_id, to, cc, bcc, subject, body_text, body_html, reply_to_message_id, thread_id } = await req.json();

    if (!account_id || !to?.length || !subject || !body_html) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: corsHeaders });
    }

    // Fetch + verify account ownership
    const { data: account, error: accErr } = await supabase
      .from("connected_email_accounts")
      .select("*")
      .eq("id", account_id)
      .eq("member_id", user.id)
      .single();

    if (accErr || !account) return new Response(JSON.stringify({ error: "Account not found or unauthorized" }), { status: 403, headers: corsHeaders });
    if (!account.can_send_from) return new Response(JSON.stringify({ error: "Send not enabled for this account" }), { status: 403, headers: corsHeaders });

    let accessToken = await decryptCredential(account.oauth_access_token);

    // Refresh if expired
    if (account.oauth_expires_at && new Date(account.oauth_expires_at) < new Date(Date.now() + 60000)) {
      const refreshToken = await decryptCredential(account.oauth_refresh_token);
      let refreshed: any;
      if (account.provider === "gmail" || account.provider === "yahoo") {
        refreshed = await refreshGmailToken(refreshToken);
      } else {
        refreshed = await refreshOutlookToken(refreshToken);
      }
      accessToken = refreshed.access_token;
      const encAccess = await encryptCredential(accessToken);
      await supabase.from("connected_email_accounts").update({
        oauth_access_token: encAccess,
        oauth_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
      }).eq("id", account.id);
    }

    const fromHeader = `${account.display_name} <${account.email_address}>`;
    let providerMessageId: string | null = null;
    const sentAt = new Date().toISOString();

    if (account.provider === "gmail" || account.provider === "yahoo") {
      const rfc822 = buildRfc822({ from: fromHeader, to, cc, bcc, subject, bodyText: body_text, bodyHtml: body_html, inReplyTo: reply_to_message_id, references: reply_to_message_id });
      const raw = b64url(rfc822);

      const sendBody: any = { raw };
      if (reply_to_message_id) sendBody.threadId = reply_to_message_id;

      const sendRes = await fetch("https://www.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(sendBody),
      });
      if (!sendRes.ok) {
        const err = await sendRes.text();
        return new Response(JSON.stringify({ error: `Gmail send failed: ${err}` }), { status: 502, headers: corsHeaders });
      }
      const sent = await sendRes.json();
      providerMessageId = sent.id;
    } else if (account.provider === "outlook") {
      const body: any = {
        message: {
          subject,
          body: { contentType: "html", content: body_html },
          toRecipients: to.map((e: string) => ({ emailAddress: { address: e } })),
          ccRecipients: (cc ?? []).map((e: string) => ({ emailAddress: { address: e } })),
          bccRecipients: (bcc ?? []).map((e: string) => ({ emailAddress: { address: e } })),
        },
        saveToSentItems: true,
      };
      const sendRes = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!sendRes.ok) {
        const err = await sendRes.text();
        return new Response(JSON.stringify({ error: `Outlook send failed: ${err}` }), { status: 502, headers: corsHeaders });
      }
    }

    // Record sent message
    const { data: msgRow } = await supabase.from("external_email_messages").insert({
      account_id: account.id,
      org_id: account.org_id,
      member_id: account.member_id,
      provider_message_id: providerMessageId ?? `local-${Date.now()}`,
      provider_thread_id: reply_to_message_id ?? null,
      from_email: account.email_address,
      from_name: account.display_name,
      to_emails: to,
      cc_emails: cc ?? [],
      subject,
      snippet: body_text?.substring(0, 200) ?? "",
      body_text: body_text ?? "",
      body_html,
      direction: "outbound",
      is_read: true,
      comms_thread_id: thread_id ?? null,
      sent_at: sentAt,
      synced_at: sentAt,
    }).select("id").single();

    // Record in communication_events
    if (thread_id) {
      await supabase.from("communication_events").insert({
        org_id: account.org_id,
        thread_id,
        direction: "outbound",
        channel: "email",
        preview: body_text?.substring(0, 200) ?? subject,
        occurred_at: sentAt,
        read_at: sentAt,
      });
    }

    return new Response(JSON.stringify({ success: true, provider_message_id: providerMessageId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
