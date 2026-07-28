const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    const { email, type, deviceInfo } = await req.json()

    if (!email || !type) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const subject = `Security Alert: New ${type} on your Optavel Account`;

    // In a real implementation, you would use Resend or SendGrid here:
    /*
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      },
      body: JSON.stringify({
        from: 'Optavel Security <security@optavel.com>',
        to: email,
        subject: subject,
        html: `
          <h1>Optavel Security Alert</h1>
          <p>We noticed a new ${type.toLowerCase()} for your account.</p>
          <p><strong>Device Info:</strong> ${deviceInfo || 'Unknown'}</p>
          <p>If this was you, you can ignore this email. If this wasn't you, please secure your account immediately.</p>
        `,
      }),
    });
    */

    // For now, we mock a successful send
    console.log(`[MOCK EMAIL SENT] To: ${email} | Subject: ${subject} | Device: ${deviceInfo}`)

    return new Response(JSON.stringify({ success: true, message: 'Notification sent successfully (mocked)' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
