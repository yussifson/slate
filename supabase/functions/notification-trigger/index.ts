import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Novu } from "https://esm.sh/@novu/node";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { type, table, record } = body

    if (table !== 'notifications' || type !== 'INSERT') {
      return new Response(JSON.stringify({ message: "Ignored" }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Initialize Novu with the provided API key
    const novuApiKey = "217619c1ae4338c49414e02df010bce3";
    const novu = new Novu(novuApiKey);

    // Trigger Novu workflow named 'in-app-notification'
    await novu.trigger('in-app-notification', {
      to: { subscriberId: record.recipient_email },
      payload: {
        title: record.title,
        message: record.message,
        type: record.type,
        link: record.related_id
      }
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
