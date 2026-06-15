import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    const { to, subject, message } = await req.json()

    if (!to || !subject || !message) {
      throw new Error("Missing 'to', 'subject', or 'message' fields.");
    }

    const recipients = Array.isArray(to) ? to : to.split(',').map(e => e.trim()).filter(Boolean);

    // Using Resend for reliable external email sending.
    // The user must provide RESEND_API_KEY in Supabase Edge Function Secrets.
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is missing from environment variables.");
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Airflake System <onboarding@resend.dev>',
        to: recipients,
        subject: subject,
        html: `<div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #333;">${subject}</h2>
          <p style="white-space: pre-wrap; color: #555;">${message}</p>
        </div>`,
        text: message
      })
    });

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`Resend error: ${res.status} ${errorBody}`);
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
