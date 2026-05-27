import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { companyId, recipientEmail, recipientName, recipientPhone, title, message, type, channels } = await req.json();

    const results = { inApp: null, email: null, sms: null };

    // 1. In-App Notification (Supabase)
    if (channels.includes('in-app')) {
      const { data, error } = await supabaseClient
        .from('notifications')
        .insert({
          company_id: companyId,
          recipient_email: recipientEmail,
          title: title,
          message: message,
          type: type || 'info',
          status: 'unread',
          is_read: false
        })
        .select()
        .single();
      
      results.inApp = { success: !error, data: data, error };
    }

    // 2. Email (Resend)
    if (channels.includes('email') && recipientEmail) {
      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
      if (RESEND_API_KEY) {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Optalflow Alerts <alerts@optalflow.com>',
            to: [recipientEmail],
            subject: title,
            html: `<div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2>${title}</h2>
                    <p>${message}</p>
                    <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #888;">This is an automated message from your Optalflow workspace.</p>
                   </div>`
          })
        });
        const data = await res.json();
        results.email = { success: res.ok, data };
      } else {
        results.email = { success: false, error: 'RESEND_API_KEY missing in Edge Function' };
      }
    }

    // 3. SMS (Twilio)
    if (channels.includes('sms') && recipientPhone) {
      const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
      const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
      const TWILIO_FROM_NUMBER = Deno.env.get('TWILIO_FROM_NUMBER');

      if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
        const authHeader = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
        const formData = new URLSearchParams();
        formData.append('To', recipientPhone);
        formData.append('From', TWILIO_FROM_NUMBER || '+1234567890');
        formData.append('Body', `Optalflow: ${title}\n${message}`);

        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${authHeader}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: formData.toString()
        });
        
        const data = await res.json();
        results.sms = { success: res.ok, data };
      } else {
        results.sms = { success: false, error: 'TWILIO credentials missing in Edge Function' };
      }
    }

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
