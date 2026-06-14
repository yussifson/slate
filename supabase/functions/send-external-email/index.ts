import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Multi-Novu Fallback implementation
const NOVU_API_KEYS = [
  Deno.env.get('NOVU_API_KEY') ?? '',
  Deno.env.get('NOVU_API_KEY_SECONDARY') ?? '',
  Deno.env.get('NOVU_API_KEY_TERTIARY') ?? ''
].filter(key => key !== '');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, message } = await req.json()

    if (!to || !subject || !message) {
      throw new Error("Missing 'to', 'subject', or 'message' fields.");
    }

    const recipients = Array.isArray(to) ? to : to.split(',').map(e => e.trim()).filter(Boolean);
    let allSuccess = true;
    let lastError = null;

    // Send via Novu with Multi-Account Fallback
    for (const recipient of recipients) {
      let success = false;
      for (const apiKey of NOVU_API_KEYS) {
        try {
          const res = await fetch('https://api.novu.co/v1/events/trigger', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `ApiKey ${apiKey}`
            },
            body: JSON.stringify({
              name: 'system-notification',
              to: {
                subscriberId: recipient,
                email: recipient
              },
              payload: {
                title: subject,
                message: message
              }
            })
          });

          if (!res.ok) {
            const errorBody = await res.text();
            throw new Error(`Novu error: ${res.status} ${errorBody}`);
          }
          
          success = true;
          break; // Success! Break the retry loop
        } catch (err) {
          lastError = err;
          console.warn(`[NOVU FALLBACK] Key failed for ${recipient}: ${err.message}. Trying next...`);
        }
      }

      if (!success) {
        allSuccess = false;
        console.error(`Failed to send to ${recipient} after trying all Novu accounts.`);
      }
    }

    if (!allSuccess) {
      throw new Error(lastError?.message || "Failed to send to one or more recipients.");
    }

    return new Response(JSON.stringify({ message: "Emails sent successfully" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
