import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Novu } from "https://esm.sh/@novu/node";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    const body = await req.json();
    const { to, subject, message } = body;

    if (!to || !subject || !message) {
      throw new Error(`Missing required fields. Received to: ${!!to}, subject: ${!!subject}, message: ${!!message}`);
    }

    const recipients = Array.isArray(to) ? to : to.split(',').map((e: string) => e.trim()).filter(Boolean);
    
    if (recipients.length === 0) {
       throw new Error("No valid recipients provided.");
    }

    const novuApiKeys = [
      "09ce520feae0cc9d84fab4ab83b7c13c", // Account 1 (Primary)
      Deno.env.get('NOVU_API_KEY') ?? '',
      Deno.env.get('NOVU_API_KEY_SECONDARY') ?? '',
      Deno.env.get('NOVU_API_KEY_TERTIARY') ?? ''
    ].filter(key => key !== '');

    if (novuApiKeys.length === 0) {
       throw new Error("No Novu API keys configured.");
    }

    let allSuccess = true;
    let lastError = null;

    // Send via Novu with Multi-Account Fallback
    for (const recipient of recipients) {
      let success = false;
      for (const apiKey of novuApiKeys) {
        try {
          const novu = new Novu(apiKey);

          // We use in-app-notification because system-notification might not exist on the user's dashboard
          await novu.trigger('in-app-notification', {
            to: {
              subscriberId: recipient,
              email: recipient
            },
            payload: {
              title: subject,
              message: message,
              type: "email"
            }
          });
          
          success = true;
          break; // Success! Break the retry loop
        } catch (err) {
          lastError = err;
          console.warn(`[NOVU FALLBACK] Key failed for ${recipient}: ${err.message}. Trying next...`);
        }
      }

      if (!success) {
        allSuccess = false;
        console.error(`Failed to send to ${recipient} after trying all Novu accounts. Last error: ${lastError?.message}`);
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
    console.error("SEND EXTERNAL EMAIL ERROR:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
