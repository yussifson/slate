import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const payload = await req.json()
    const record = payload.record

    // Webhook payload from clipad_notifications INSERT
    if (!record || !record.user_id) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // 1. Fetch user to check notification preferences
    // For now we assume email opt-in by default
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(record.user_id)
    if (userError || !user?.user?.email) throw new Error('User not found or missing email')

    const email = user.user.email

    // 2. Map notification types to external emails
    if (RESEND_API_KEY && ['ai_summary', 'space_invite', 'comment', 'login_alert'].includes(record.type)) {
      
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'CliPad Notifications <notifications@clipad.optavel.com>',
          to: email,
          subject: `CliPad: ${record.title}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2>${record.title}</h2>
              <p>${record.message}</p>
              <br/>
              <a href="https://clipad.optavel.com${record.link || '/dashboard'}" style="background-color: #10B981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View in CliPad</a>
            </div>
          `
        })
      })

      if (!res.ok) {
        console.error("Resend API error:", await res.text())
      }
    }

    return new Response(
      JSON.stringify({ message: 'Notification processed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
