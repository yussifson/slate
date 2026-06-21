import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { companyId, recipientId, recipientEmail, recipientPhone, recipientName, title, message, type, channels, workflowId } = await req.json();

    const results: any = { inApp: null, novu: null };

    // 1. In-App Notification (Direct to Supabase)
    if (channels.includes("in-app")) {
      const { data, error } = await supabaseClient
        .from("notifications")
        .insert({
          company_id: companyId,
          recipient_email: recipientEmail,
          title: title,
          message: message,
          type: type || "info",
          status: "unread",
          is_read: false
        })
        .select()
        .single();
      
      results.inApp = { success: !error, data: data, error };
    }

    // 2. Novu (Handles Email via Resend/Brevo and SMS via Twilio)
    if (channels.includes("email") || channels.includes("sms")) {
      const NOVU_API_KEY = Deno.env.get("NOVU_API_KEY");
      if (NOVU_API_KEY) {
        // Build payload for Novu
        const payload = {
          name: workflowId || "default-workflow",
          to: {
            subscriberId: recipientId || recipientEmail || "anonymous",
            email: recipientEmail,
            phone: recipientPhone,
            firstName: recipientName
          },
          payload: {
            title: title,
            message: message,
            companyId: companyId
          }
        };

        const res = await fetch("https://api.novu.co/v1/events/trigger", {
          method: "POST",
          headers: {
            "Authorization": "ApiKey $" + NOVU_API_KEY,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        results.novu = { success: res.ok, data };
      } else {
        results.novu = { success: false, error: "NOVU_API_KEY missing in Edge Function" };
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
