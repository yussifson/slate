import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    const url = new URL(req.url);
    const rule_id = url.searchParams.get('rule_id');

    if (!rule_id) {
      return new Response(JSON.stringify({ error: "Missing rule_id parameter" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    let payloadData = {};
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      try {
        payloadData = await req.json();
      } catch (e) {
        // Fallback for non-JSON or empty body
        payloadData = {};
      }
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Fetch the rule to ensure it exists and is active
    const { data: rule, error: ruleError } = await supabaseClient
      .from('automation_rules')
      .select('*')
      .eq('id', rule_id)
      .single();

    if (ruleError || !rule) {
      return new Response(JSON.stringify({ error: "Rule not found or invalid." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    if (!rule.is_active || rule.table_name !== 'webhook_inbound') {
      return new Response(JSON.stringify({ error: "Rule is not active or is not configured for inbound webhooks." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 2. Schedule it directly into the durable execution queue we built in Phase 1
    // This ensures that even if there is a massive spike in webhook traffic, the system won't crash
    const executeAt = new Date().toISOString();
    
    // We pass the webhook payload as the "record" context
    const queuePayload = {
      is_resume: false,
      rule: rule,
      record: payloadData,
      table: 'webhook_inbound',
      type: 'webhook_event'
    };

    const { error: insertError } = await supabaseClient.from('automation_queue').insert({
      company_id: rule.company_id,
      rule_id: rule.id,
      payload: queuePayload,
      execute_at: executeAt,
      status: 'pending'
    });

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ message: "Webhook accepted and queued for processing.", rule_id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 202,
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})
