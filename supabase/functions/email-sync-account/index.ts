import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { decryptCredential, encryptCredential } from "../_shared/email-encryption.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;

// ── Token refresh helpers ──────────────────────────────────────────────────

async function refreshGmailToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
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
  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`);
  return res.json();
}

async function refreshOutlookToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
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

// ── Gmail helpers ──────────────────────────────────────────────────────────

function decodeBase64Url(str: string): string {
  try {
    const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(b64);
    // Handle UTF-8
    const bytes = Uint8Array.from(decoded, c => c.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return "";
  }
}

function extractBody(payload: any): { text: string; html: string } {
  let text = "";
  let html = "";

  function traverse(part: any) {
    if (!part) return;
    const mime = part.mimeType ?? "";
    if (mime === "text/plain" && part.body?.data) text = decodeBase64Url(part.body.data);
    if (mime === "text/html" && part.body?.data) html = decodeBase64Url(part.body.data);
    if (part.parts) part.parts.forEach(traverse);
  }

  traverse(payload);
  if (!text && !html && payload?.body?.data) {
    const decoded = decodeBase64Url(payload.body.data);
    if (payload.mimeType === "text/html") html = decoded;
    else text = decoded;
  }
  return { text, html };
}

function parseEmailHeader(headers: any[], name: string): string {
  return headers?.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function parseEmailList(raw: string): string[] {
  if (!raw) return [];
  return raw.split(",").map(s => s.trim()).filter(Boolean);
}

// ── AI classification ──────────────────────────────────────────────────────

async function classifyExternalMessage(msg: {
  from_name: string;
  from_email: string;
  subject: string;
  snippet: string;
}) {
  try {
    const prompt = `Analyse this email received by a church pastor.
From: ${msg.from_name} <${msg.from_email}>
Subject: ${msg.subject}
Snippet: ${msg.snippet}

Return only valid JSON with these fields:
- is_church_related: boolean (is this about church ministry, members, events, pastoral care?)
- tone: one of "joy"|"crisis"|"gratitude"|"confusion"|"anger"|"neutral"|"urgent"
- category: one of "prayer_request"|"question"|"personal"|"promotional"|"ministry"|"pastoral_care"|"other"
- urgency_score: integer 0-100
- summary: one sentence`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", maxOutputTokens: 256 },
        }),
      },
    );
    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    return JSON.parse(raw);
  } catch {
    return { is_church_related: false, tone: "neutral", category: "other", urgency_score: 0, summary: "" };
  }
}

// ── Gmail sync ─────────────────────────────────────────────────────────────

async function syncGmail(supabase: any, account: any, fullSync: boolean) {
  let accessToken: string;
  try {
    accessToken = await decryptCredential(account.oauth_access_token);
  } catch {
    await supabase.from("connected_email_accounts").update({ connection_status: "auth_expired", last_error: "Failed to decrypt access token" }).eq("id", account.id);
    return;
  }

  // Refresh if expired
  if (account.oauth_expires_at && new Date(account.oauth_expires_at) < new Date(Date.now() + 60000)) {
    try {
      const refreshToken = await decryptCredential(account.oauth_refresh_token);
      const refreshed = await refreshGmailToken(refreshToken);
      accessToken = refreshed.access_token;
      const encAccess = await encryptCredential(accessToken);
      const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
      await supabase.from("connected_email_accounts").update({
        oauth_access_token: encAccess,
        oauth_expires_at: expiresAt,
      }).eq("id", account.id);
    } catch (e: any) {
      await supabase.from("connected_email_accounts").update({ connection_status: "auth_expired", last_error: e.message }).eq("id", account.id);
      return;
    }
  }

  const gmailBase = "https://www.googleapis.com/gmail/v1/users/me";
  const headers = { Authorization: `Bearer ${accessToken}` };

  let messageIds: string[] = [];
  let newHistoryId: string | undefined;

  if (fullSync || !account.sync_history_id) {
    // Initial sync: fetch last 7 days of INBOX messages
    const listRes = await fetch(`${gmailBase}/messages?q=newer_than:7d in:inbox&maxResults=100`, { headers });
    if (!listRes.ok) {
      if (listRes.status === 401) {
        await supabase.from("connected_email_accounts").update({ connection_status: "auth_expired", last_error: "401 on messages list" }).eq("id", account.id);
        return;
      }
      throw new Error(`Gmail list failed: ${listRes.status}`);
    }
    const listData = await listRes.json();
    messageIds = (listData.messages ?? []).map((m: any) => m.id);
    newHistoryId = listData.historyId;
  } else {
    // Incremental sync via history
    const histRes = await fetch(`${gmailBase}/history?startHistoryId=${account.sync_history_id}&historyTypes=messageAdded,messageDeleted,labelAdded,labelRemoved`, { headers });
    if (!histRes.ok) {
      if (histRes.status === 404) {
        // historyId expired — fall back to full sync
        await supabase.from("connected_email_accounts").update({ sync_history_id: null }).eq("id", account.id);
        return syncGmail(supabase, { ...account, sync_history_id: null }, true);
      }
      throw new Error(`Gmail history failed: ${histRes.status}`);
    }
    const histData = await histRes.json();
    newHistoryId = histData.historyId;
    for (const record of (histData.history ?? [])) {
      for (const added of (record.messagesAdded ?? [])) {
        messageIds.push(added.message.id);
      }
    }
  }

  // Fetch and process each message
  for (const msgId of messageIds) {
    // Skip already-synced messages
    const { data: existing } = await supabase
      .from("external_email_messages")
      .select("id")
      .eq("account_id", account.id)
      .eq("provider_message_id", msgId)
      .maybeSingle();
    if (existing) continue;

    const msgRes = await fetch(`${gmailBase}/messages/${msgId}?format=full`, { headers });
    if (!msgRes.ok) continue;
    const msg = await msgRes.json();

    const hdrs = msg.payload?.headers ?? [];
    const fromRaw = parseEmailHeader(hdrs, "From");
    const fromMatch = fromRaw.match(/^(.*?)\s*<(.+?)>$/) ?? [null, fromRaw, fromRaw];
    const fromName = fromMatch[1]?.trim() ?? "";
    const fromEmail = fromMatch[2]?.trim() ?? fromRaw;
    const toRaw = parseEmailHeader(hdrs, "To");
    const ccRaw = parseEmailHeader(hdrs, "Cc");
    const subject = parseEmailHeader(hdrs, "Subject");
    const dateRaw = parseEmailHeader(hdrs, "Date");
    const { text: bodyText, html: bodyHtml } = extractBody(msg.payload);
    const isInbox = (msg.labelIds ?? []).includes("INBOX");
    const isSent = (msg.labelIds ?? []).includes("SENT");
    const direction = isSent ? "outbound" : "inbound";
    const sentAt = dateRaw ? new Date(dateRaw).toISOString() : new Date(parseInt(msg.internalDate ?? "0")).toISOString();

    const row = {
      account_id: account.id,
      org_id: account.org_id,
      member_id: account.member_id,
      provider_message_id: msgId,
      provider_thread_id: msg.threadId,
      gmail_label_ids: msg.labelIds ?? [],
      from_email: fromEmail,
      from_name: fromName,
      to_emails: parseEmailList(toRaw),
      cc_emails: parseEmailList(ccRaw),
      subject,
      snippet: msg.snippet ?? "",
      body_text: bodyText,
      body_html: bodyHtml,
      has_attachments: (msg.payload?.parts ?? []).some((p: any) => p.filename),
      direction,
      is_read: !(msg.labelIds ?? []).includes("UNREAD"),
      is_starred: (msg.labelIds ?? []).includes("STARRED"),
      is_archived: !isInbox && !isSent,
      is_trashed: (msg.labelIds ?? []).includes("TRASH"),
      sent_at: sentAt,
      received_at: direction === "inbound" ? sentAt : null,
      synced_at: new Date().toISOString(),
    };

    const { data: inserted } = await supabase
      .from("external_email_messages")
      .insert(row)
      .select("id")
      .single();

    // AI classification + member matching for inbound
    if (inserted && direction === "inbound" && account.auto_classify_with_ai) {
      const classification = await classifyExternalMessage({ from_name: fromName, from_email: fromEmail, subject, snippet: msg.snippet ?? "" });

      // Match sender to a church member
      const { data: linkedMember } = await supabase
        .from("profiles")
        .select("id")
        .eq("org_id", account.org_id)
        .eq("email", fromEmail)
        .maybeSingle();

      await supabase.from("external_email_messages").update({
        ai_classified: true,
        ai_is_church_related: classification.is_church_related ?? false,
        ai_tone: classification.tone ?? "neutral",
        ai_category: classification.category ?? "other",
        ai_urgency_score: classification.urgency_score ?? 0,
        ai_summary: classification.summary ?? "",
        linked_member_id: linkedMember?.id ?? null,
      }).eq("id", inserted.id);

      // Route to church inbox if configured
      if (classification.is_church_related && account.route_to_church_inbox) {
        // Create or find thread
        const { data: existingThread } = await supabase
          .from("communication_threads")
          .select("id")
          .eq("org_id", account.org_id)
          .eq("member_id", account.member_id)
          .eq("subject", subject)
          .maybeSingle();

        let threadId = existingThread?.id;
        if (!threadId) {
          const { data: newThread } = await supabase.from("communication_threads").insert({
            org_id: account.org_id,
            member_id: linkedMember?.id ?? account.member_id,
            subject,
            channel: "email",
            status: "open",
            priority: (classification.urgency_score ?? 0) >= 80 ? "crisis" : "normal",
            ai_tone: classification.tone,
            last_message_at: sentAt,
            last_message_preview: (msg.snippet ?? "").substring(0, 120),
          }).select("id").single();
          threadId = newThread?.id;
        }

        // Insert communication event
        const { data: event } = await supabase.from("communication_events").insert({
          org_id: account.org_id,
          thread_id: threadId ?? null,
          direction: "inbound",
          channel: "email",
          preview: (msg.snippet ?? "").substring(0, 200),
          from_email: fromEmail,
          ai_tone: classification.tone,
          ai_category: classification.category,
          ai_urgency_score: classification.urgency_score,
          ai_summary: classification.summary,
          occurred_at: sentAt,
          read_at: null,
        }).select("id").single();

        if (event) {
          await supabase.from("external_email_messages").update({
            comms_event_id: event.id,
            comms_thread_id: threadId ?? null,
          }).eq("id", inserted.id);
        }
      }
    }
  }

  // Update sync state
  const updatePayload: Record<string, any> = {
    last_sync_at: new Date().toISOString(),
    last_successful_sync_at: new Date().toISOString(),
    connection_status: "active",
    last_error: null,
  };
  if (newHistoryId) updatePayload.sync_history_id = newHistoryId;
  await supabase.from("connected_email_accounts").update(updatePayload).eq("id", account.id);
}

// ── Outlook sync ───────────────────────────────────────────────────────────

async function syncOutlook(supabase: any, account: any, fullSync: boolean) {
  let accessToken: string;
  try {
    accessToken = await decryptCredential(account.oauth_access_token);
  } catch {
    await supabase.from("connected_email_accounts").update({ connection_status: "auth_expired", last_error: "Failed to decrypt token" }).eq("id", account.id);
    return;
  }

  if (account.oauth_expires_at && new Date(account.oauth_expires_at) < new Date(Date.now() + 60000)) {
    try {
      const refreshToken = await decryptCredential(account.oauth_refresh_token);
      const refreshed = await refreshOutlookToken(refreshToken);
      accessToken = refreshed.access_token;
      const encAccess = await encryptCredential(accessToken);
      await supabase.from("connected_email_accounts").update({
        oauth_access_token: encAccess,
        oauth_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
      }).eq("id", account.id);
    } catch (e: any) {
      await supabase.from("connected_email_accounts").update({ connection_status: "auth_expired", last_error: e.message }).eq("id", account.id);
      return;
    }
  }

  const graphBase = "https://graph.microsoft.com/v1.0/me";
  const headers = { Authorization: `Bearer ${accessToken}` };

  let url = fullSync || !account.sync_history_id
    ? `${graphBase}/mailFolders/inbox/messages?$top=50&$orderby=receivedDateTime desc`
    : `${graphBase}/mailFolders/inbox/messages/delta?$deltaToken=${account.sync_history_id}`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 401) {
      await supabase.from("connected_email_accounts").update({ connection_status: "auth_expired", last_error: "401" }).eq("id", account.id);
      return;
    }
    throw new Error(`Outlook sync failed: ${errText}`);
  }
  const data = await res.json();
  const messages = data.value ?? [];
  const deltaLink = data["@odata.deltaLink"];

  for (const msg of messages) {
    const { data: existing } = await supabase.from("external_email_messages")
      .select("id").eq("account_id", account.id).eq("provider_message_id", msg.id).maybeSingle();
    if (existing) continue;

    const fromEmail = msg.from?.emailAddress?.address ?? "";
    const fromName = msg.from?.emailAddress?.name ?? "";
    const subject = msg.subject ?? "";
    const snippet = msg.bodyPreview ?? "";
    const sentAt = msg.sentDateTime ?? new Date().toISOString();
    const toEmails = (msg.toRecipients ?? []).map((r: any) => r.emailAddress?.address).filter(Boolean);

    const row = {
      account_id: account.id,
      org_id: account.org_id,
      member_id: account.member_id,
      provider_message_id: msg.id,
      provider_thread_id: msg.conversationId,
      from_email: fromEmail,
      from_name: fromName,
      to_emails: toEmails,
      cc_emails: [],
      subject,
      snippet,
      body_text: msg.body?.contentType === "text" ? msg.body?.content : "",
      body_html: msg.body?.contentType === "html" ? msg.body?.content : "",
      has_attachments: msg.hasAttachments ?? false,
      direction: "inbound",
      is_read: msg.isRead ?? false,
      is_starred: msg.flag?.flagStatus === "flagged",
      is_archived: false,
      is_trashed: false,
      sent_at: sentAt,
      received_at: msg.receivedDateTime ?? sentAt,
      synced_at: new Date().toISOString(),
    };

    const { data: inserted } = await supabase.from("external_email_messages").insert(row).select("id").single();

    if (inserted && account.auto_classify_with_ai) {
      const classification = await classifyExternalMessage({ from_name: fromName, from_email: fromEmail, subject, snippet });
      await supabase.from("external_email_messages").update({
        ai_classified: true,
        ai_is_church_related: classification.is_church_related ?? false,
        ai_tone: classification.tone ?? "neutral",
        ai_category: classification.category ?? "other",
        ai_urgency_score: classification.urgency_score ?? 0,
        ai_summary: classification.summary ?? "",
      }).eq("id", inserted.id);
    }
  }

  // Store delta token for next incremental sync
  const updatePayload: Record<string, any> = {
    last_sync_at: new Date().toISOString(),
    last_successful_sync_at: new Date().toISOString(),
    connection_status: "active",
    last_error: null,
  };
  if (deltaLink) {
    const token = new URL(deltaLink).searchParams.get("$deltaToken");
    if (token) updatePayload.sync_history_id = token;
  }
  await supabase.from("connected_email_accounts").update(updatePayload).eq("id", account.id);
}

// ── Main serve ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { account_id, full_sync = false } = await req.json();
    if (!account_id) return new Response(JSON.stringify({ error: "account_id required" }), { status: 400, headers: corsHeaders });

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: account, error } = await supabase
      .from("connected_email_accounts")
      .select("*")
      .eq("id", account_id)
      .single();

    if (error || !account) {
      return new Response(JSON.stringify({ error: "Account not found" }), { status: 404, headers: corsHeaders });
    }

    if (!account.sync_enabled || account.connection_status === "disconnected") {
      return new Response(JSON.stringify({ skipped: true }), { headers: corsHeaders });
    }

    if (account.provider === "gmail" || account.provider === "yahoo") {
      await syncGmail(supabase, account, full_sync);
    } else if (account.provider === "outlook") {
      await syncOutlook(supabase, account, full_sync);
    }
    // IMAP: handled by Vercel cron /api/cron/sync-imap-accounts (Node.js)

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
