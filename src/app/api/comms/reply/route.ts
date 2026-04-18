import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { thread_id, body, channel, org_id, member_id } = await req.json();

    if (!org_id || !body) {
      return NextResponse.json({ error: 'Missing org_id or body' }, { status: 400 });
    }

    // Get sending user from auth header
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    let senderId: string | null = null;

    if (token) {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      senderId = user?.id ?? null;
    }

    // Create a campaign for the reply
    const { data: campaign, error: campErr } = await supabaseAdmin
      .from('communication_campaigns')
      .insert({
        org_id,
        title: 'Thread Reply',
        campaign_type: 'pastoral_message',
        subject_en: 'Re: Pastoral Reply',
        subject_ja: 'Re: 牧会的返信',
        body_en: body,
        body_ja: body,
        channels: [channel ?? 'email'],
        audience_scope: 'individual',
        status: 'draft',
        trigger_type: 'thread_reply',
        thread_id: thread_id ?? null,
        created_by: senderId,
      })
      .select('id')
      .single();

    if (campErr || !campaign) {
      return NextResponse.json({ error: campErr?.message ?? 'Campaign insert failed' }, { status: 500 });
    }

    // Dispatch immediately
    const dispatchRes = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/coce-dispatch`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ campaign_id: campaign.id }),
      }
    );

    if (!dispatchRes.ok) {
      const err = await dispatchRes.text();
      return NextResponse.json({ error: `Dispatch failed: ${err}` }, { status: 502 });
    }

    return NextResponse.json({ success: true, campaign_id: campaign.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
