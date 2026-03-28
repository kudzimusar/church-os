import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * ESCALATION NOTIFIER - Phase 6 (Google Chat Integration)
 * Background worker triggered every 10 minutes (via cron) to alert
 * church staff of new AI-generated escalations using Google Chat Webhooks.
 */

// Google Chat Webhooks
const DEFAULT_WEBHOOK = Deno.env.get('GOOGLE_CHAT_WEBHOOK_URL');
const DEPARTMENT_WEBHOOKS = {
  pastoral: Deno.env.get('GOOGLE_CHAT_PASTORAL_WEBHOOK'),
  technical: Deno.env.get('GOOGLE_CHAT_TECH_WEBHOOK'),
  administrative: Deno.env.get('GOOGLE_CHAT_ADMIN_WEBHOOK'),
  events: Deno.env.get('GOOGLE_CHAT_EVENTS_WEBHOOK')
};

// Staff emails for @mentions (Mapped to Google Chat User IDs in production)
const STAFF_EMAILS: Record<string, string[]> = {
  pastoral: Deno.env.get('PASTORAL_STAFF_EMAILS')?.split(',') || [],
  technical: Deno.env.get('TECH_STAFF_EMAILS')?.split(',') || [],
  administrative: Deno.env.get('ADMIN_STAFF_EMAILS')?.split(',') || [],
  events: Deno.env.get('EVENTS_STAFF_EMAILS')?.split(',') || []
};

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Get pending escalations not yet notified
  const { data: escalations, error } = await supabase
    .from('escalations')
    .select(`
      *,
      user:profiles!inner(
        id,
        full_name
      )
    `)
    .eq('notified_at', null)
    .eq('status', 'pending')
    .limit(20);

  if (error) {
    console.error('Failed to fetch escalations:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!escalations || escalations.length === 0) {
    return new Response(JSON.stringify({ message: "No pending escalations." }), { status: 200 });
  }

  const results = [];

  for (const escalation of escalations) {
    const user = escalation.user;
    const department = escalation.department;
    const urgency = escalation.urgency;
    const reason = escalation.reason;

    // Get department-specific webhook
    const webhookUrl = DEPARTMENT_WEBHOOKS[department as keyof typeof DEPARTMENT_WEBHOOKS] || DEFAULT_WEBHOOK;

    if (!webhookUrl) {
      console.error(`No webhook configured for department: ${department}`);
      results.push({
        escalation_id: escalation.id,
        notified: false,
        error: `No webhook configured for ${department}`
      });
      continue;
    }

    // Get staff emails for @mentions
    const staffEmails = STAFF_EMAILS[department] || [];
    
    // Fetch User Email for context
    const { data: authUser } = await supabase.auth.admin.getUserById(escalation.user_id);
    const userEmail = authUser?.user?.email;

    // Build Google Chat message
    const chatMessage = buildGoogleChatMessage({
      user: {
        name: user.full_name || 'Anonymous',
        email: userEmail
      },
      department,
      urgency,
      reason,
      staffEmails
    });

    // Send to Google Chat
    const sent = await sendGoogleChatMessage(webhookUrl, chatMessage);

    if (sent) {
      // Update escalation record
      const { error: updateError } = await supabase
        .from('escalations')
        .update({
          notified_at: new Date().toISOString(),
          notified_to: staffEmails.length ? staffEmails : [webhookUrl]
        })
        .eq('id', escalation.id);

      results.push({
        escalation_id: escalation.id,
        notified: true,
        department,
        notified_to: staffEmails.length ? staffEmails : ['webhook']
      });
    } else {
      results.push({
        escalation_id: escalation.id,
        notified: false,
        error: 'Failed to send Google Chat notification'
      });
    }
  }

  return new Response(
    JSON.stringify({ processed: escalations.length, results }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});

// ============================================================================
// Google Chat Helpers
// ============================================================================

interface EscalationMessageParams {
  user: {
    name: string;
    email?: string;
  };
  department: string;
  urgency: string;
  reason: string;
  staffEmails: string[];
}

function buildGoogleChatMessage(params: EscalationMessageParams): any {
  const { user, department, urgency, reason, staffEmails } = params;

  // Map urgency to emoji and color
  const urgencyMap: Record<string, { emoji: string; color: string }> = {
    emergency: { emoji: '🚨', color: '#ef4444' },
    high: { emoji: '🔴', color: '#f97316' },
    normal: { emoji: '🟡', color: '#eab308' },
    low: { emoji: '🟢', color: '#22c55e' }
  };
  const urgencyInfo = urgencyMap[urgency] || urgencyMap.normal;

  // Note: For actual Google Chat @mentions, you need user IDs like <users/123456>
  // Here we'll just list the emails for the staff to see.
  const mentionText = staffEmails.length ? `\n\nAssignee Notification: ${staffEmails.map(e => `*${e}*`).join(', ')}` : '';

  return {
    text: `${urgencyInfo.emoji} *NEW ${department.toUpperCase()} ESCALATION*\n\n` +
          `*Priority:* ${urgencyInfo.emoji} ${urgency.toUpperCase()}\n` +
          `*Member:* ${user.name}\n` +
          (user.email ? `*Email:* ${user.email}\n` : '') +
          `*Reason:* ${reason}\n` +
          mentionText +
          `\n\n_Generated by Church OS AI Security Sentinel_`,
    cardsV2: [
      {
        cardId: `escalation-${Date.now()}`,
        card: {
          header: {
            title: `${department.toUpperCase()} Escalation`,
            subtitle: `Urgency: ${urgency.toUpperCase()}`,
            imageUrl: 'https://churchos.com/icons/ai-sentinel.png',
            imageType: 'CIRCLE'
          },
          sections: [
            {
              header: 'Ministry Action Required',
              widgets: [
                {
                  textParagraph: {
                    text: `<b>Member:</b> ${user.name}<br><b>Issue:</b> ${reason}`
                  }
                },
                {
                  buttonList: {
                    buttons: [
                      {
                        text: 'Review in Mission Control',
                        onClick: {
                          openLink: {
                            url: `https://churchos.com/super-admin/ai-ops/logs`
                          }
                        }
                      }
                    ]
                  }
                }
              ]
            }
          ]
        }
      }
    ]
  };
}

async function sendGoogleChatMessage(webhookUrl: string, message: any): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });

    if (response.ok) {
      return true;
    } else {
      const errorText = await response.text();
      console.error('Google Chat webhook error:', errorText);
      return false;
    }
  } catch (error) {
    console.error('Failed to send Google Chat message:', error);
    return false;
  }
}
