import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { level, event, message, metadata } = await req.json()

    console.log(`[SYSTEM ALERT] ${level.toUpperCase()}: ${message}`)

    // In a real production setup, we would send to Slack/Discord here
    const SLACK_WEBHOOK = Deno.env.get('SLACK_WEBHOOK_URL')
    
    if (SLACK_WEBHOOK) {
        await fetch(SLACK_WEBHOOK, {
            method: 'POST',
            body: JSON.stringify({
                text: `🚨 *Critical System Alert*\n*Level*: ${level}\n*Event*: ${event}\n*Message*: ${message}\n*Job ID*: ${metadata?.job_id || 'N/A'}`
            })
        })
    }

    return new Response(JSON.stringify({ sent: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
