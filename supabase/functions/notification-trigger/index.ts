import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Novu } from "https://esm.sh/@novu/node";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const body = await req.json();

    // Fetch the user's phone number from profiles to support Twilio SMS routing in Novu
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    let phone = null;
    let firstName = null;
    if (body.record && body.record.recipient_email) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone, name")
        .eq("email", body.record.recipient_email)
        .single();
      if (profile) {
        phone = profile.phone;
        firstName = profile.name;
      }
    }
    const { type, table, record } = body

    if (table !== 'notifications' || type !== 'INSERT') {
      return new Response(JSON.stringify({ message: "Ignored" }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // If it's an internal-only notification, skip triggering Novu completely.
    // This allows it to show up in the database-backed inbox without sending an email.
    if (record.type === 'internal') {
      console.log("Internal notification detected. Skipping Novu trigger.");
      return new Response(JSON.stringify({ message: "Ignored - Internal Only" }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log("Received Webhook Trigger!");
    console.log("Record Data:", JSON.stringify({ recipient: record.recipient_email, type: record.type, title: record.title }));

    // Array of Novu API Keys for fallback (Add more keys here to stack 10k limits)
    const novuApiKeys = [
      "09ce520feae0cc9d84fab4ab83b7c13c", // Account 1 (Primary)
      // "YOUR_SECOND_NOVU_API_KEY_HERE", // Account 2 (Fallback)
      // "YOUR_THIRD_NOVU_API_KEY_HERE",  // Account 3 (Fallback)
    ];

    let lastError = null;
    let novuResponse = null;
    let successfulKeyIndex = -1;

    for (let i = 0; i < novuApiKeys.length; i++) {
      try {
        console.log(`Attempting to trigger Novu using API Key ${i + 1}...`);
        const novu = new Novu(novuApiKeys[i]);

        novuResponse = await novu.trigger('in-app-notification', {
          to: { 
            subscriberId: record.recipient_email,
            email: record.recipient_email,
            phone: phone || undefined,
            firstName: firstName || undefined 
          },
          payload: {
            title: record.title,
            message: record.message,
            type: record.type,
            link: record.related_id
          }
        });

        console.log(`Novu Trigger Success with Key ${i + 1}!`);
        successfulKeyIndex = i + 1;
        lastError = null;
        break; // Success! Break out of the fallback loop
      } catch (err) {
        console.warn(`Failed to send with Novu API Key ${i + 1}. Error:`, err.message);
        lastError = err;
        // The loop will automatically continue to the next API key in the array
      }
    }

    if (lastError) {
      throw new Error(`All Novu API keys failed. Exhausted fallback limit. Last error: ${lastError.message}`);
    }

    return new Response(JSON.stringify({ success: true, novu: novuResponse.data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

