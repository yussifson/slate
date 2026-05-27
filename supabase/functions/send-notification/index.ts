import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { recipientEmail, title, message, type, data, senderName } = await req.json();

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set");
    }

    // HTML Template Design matching Optalflow Branding
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 0; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .header { background: linear-gradient(135deg, #2563eb, #4f46e5); padding: 32px 40px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
        .content { padding: 40px; color: #334155; }
        .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; }
        .content p { line-height: 1.6; font-size: 16px; margin: 16px 0; }
        .message-box { background: #f1f5f9; border-left: 4px solid #3b82f6; padding: 16px 24px; margin: 24px 0; border-radius: 4px 8px 8px 4px; }
        .btn { display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 24px; }
        .footer { padding: 24px 40px; text-align: center; color: #94a3b8; font-size: 14px; background: #f8fafc; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Optalflow</h1>
        </div>
        <div class="content">
          <h2>${title}</h2>
          <p>Hi there,</p>
          <div class="message-box">
            ${message}
          </div>
          ${data?.actionUrl ? `<a href="${data.actionUrl}" class="btn">View Details</a>` : ''}
          <p>Thanks,<br><strong>${senderName}</strong></p>
        </div>
        <div class="footer">
          <p>Powered by Optalflow & Orbit AI &bull; The Enterprise SaaS Platform</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: "Optalflow Notifications <onboarding@resend.dev>",
        to: [recipientEmail],
        subject: title,
        html: htmlContent
      })
    });

    const resData = await res.json();

    return new Response(JSON.stringify(resData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: res.ok ? 200 : 400
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});
