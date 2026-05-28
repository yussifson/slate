import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getValidAccessToken } from '../_shared/token-manager.ts'

console.log("Notify Team Function Started!")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { companyId, provider, message, channel, recipientPhone } = await req.json()

    if (!companyId || !provider || !message) {
      throw new Error("Missing required fields: companyId, provider, message")
    }

    // =====================================
    // SLACK NOTIFICATIONS
    // =====================================
    if (provider === 'slack') {
      const accessToken = await getValidAccessToken(companyId, 'slack')
      if (!accessToken) throw new Error(`Integration not connected or token expired for slack.`)

      const slackResponse = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel: channel || '#general',
          text: message
        })
      })

      const data = await slackResponse.json()
      if (!data.ok) throw new Error(`Slack API Error: ${data.error}`)
      
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } 
    
    // =====================================
    // WHATSAPP (TWILIO) NOTIFICATIONS
    // =====================================
    else if (provider === 'twilio') {
      // Twilio typically uses Account SID and Auth Token, which might be stored as the access_token in our DB,
      // or configured globally as environment variables.
      // For this implementation, we assume the user authenticated via Twilio OAuth or we stored credentials.
      
      const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID')
      const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
      const twilioPhone = Deno.env.get('TWILIO_WHATSAPP_NUMBER') || 'whatsapp:+14155238886' // Twilio sandbox number

      if (!twilioSid || !twilioAuthToken) throw new Error("Missing Twilio global credentials in Supabase secrets")
      if (!recipientPhone) throw new Error("Missing recipientPhone for WhatsApp message")

      const body = new URLSearchParams({
        To: `whatsapp:${recipientPhone}`,
        From: twilioPhone,
        Body: message
      })

      const twilioResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${twilioSid}:${twilioAuthToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
      })

      const data = await twilioResponse.json()
      if (data.code && data.message) throw new Error(`Twilio API Error: ${data.message}`)
      
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else {
      throw new Error(`Unsupported notification provider: ${provider}`)
    }

  } catch (error) {
    console.error("Notify Team Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
