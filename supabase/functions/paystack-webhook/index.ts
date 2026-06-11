import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import * as crypto from "https://deno.land/std@0.168.0/crypto/mod.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const paystackSecret = Deno.env.get("PAYSTACK_SECRET_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  try {
    // 1. Validate Paystack Signature
    const signature = req.headers.get("x-paystack-signature");
    const body = await req.text();
    
    // Compute HMAC SHA512
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", encoder.encode(paystackSecret),
      { name: "HMAC", hash: "SHA-512" },
      false, ["sign"]
    );
    const hashBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (hashHex !== signature) {
      return new Response("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(body);

    // 2. Handle Events
    if (event.event === "charge.success") {
      const data = event.data;
      const metadata = data.metadata?.custom_fields;
      
      const companyIdField = metadata?.find((f: any) => f.variable_name === "company_id");
      const planIdField = metadata?.find((f: any) => f.variable_name === "plan_id");
      
      const companyId = companyIdField?.value;
      const planId = planIdField?.value;
      const customerCode = data.customer.customer_code;

      // Log Transaction
      await supabase.from('billing_transactions').insert([{
        company_id: companyId,
        paystack_reference: data.reference,
        amount: data.amount / 100, // Convert from kobo to standard currency
        status: 'success',
        description: `Payment for plan ${planId}`
      }]);

      // Update Subscription
      if (companyId && planId) {
        // Calculate next period end (e.g., +1 month)
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        await supabase.from('company_subscriptions').upsert([{
          company_id: companyId,
          plan_id: planId,
          paystack_customer_code: customerCode,
          status: 'active',
          current_period_end: nextMonth.toISOString()
        }], { onConflict: 'company_id' });
      }
    }

    return new Response(JSON.stringify({ status: "success" }), { status: 200 });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
})
