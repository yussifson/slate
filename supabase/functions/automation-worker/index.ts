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

  // This function is designed to be called by pg_cron or an external chronometer
  // To protect it, we check for a custom header or rely on service role.

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Fetch pending tasks that are due for execution
    const { data: queueItems, error: qError } = await supabaseClient
      .from('automation_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('execute_at', new Date().toISOString())
      .limit(50); // Process in batches of 50

    if (qError) throw qError;
    if (!queueItems || queueItems.length === 0) {
      return new Response(JSON.stringify({ message: "No pending tasks." }), { headers: corsHeaders, status: 200 });
    }

    // 2. Mark them as processing so another cron tick doesn't pick them up
    const itemIds = queueItems.map(item => item.id);
    await supabaseClient.from('automation_queue').update({ status: 'processing' }).in('id', itemIds);

    const results = [];

    // 3. Send them back to the automation-engine
    for (const item of queueItems) {
      try {
        const payload = item.payload; // This contains { is_resume: true, rule, record, table, next_node_id }
        
        // Forward to the automation-engine
        const res = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/automation-engine`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
           await supabaseClient.from('automation_queue').update({ status: 'completed' }).eq('id', item.id);
           results.push({ id: item.id, status: 'completed' });
        } else {
           const errText = await res.text();
           const nextRetry = (item.retry_count || 0) + 1;
           const maxRetries = item.max_retries || 3;
           if (nextRetry > maxRetries) {
             // Send to DLQ
             await supabaseClient.from('automation_dlq').insert({
               company_id: item.company_id,
               rule_id: item.rule_id,
               payload: item.payload,
               error_message: errText,
               original_queue_id: item.id
             });
             await supabaseClient.from('automation_queue').update({ status: 'failed_dlq', last_error: errText }).eq('id', item.id);
           } else {
             // Exponential backoff
             const backoffMs = Math.pow(2, nextRetry) * 60000; // 2m, 4m, 8m
             const executeAt = new Date(Date.now() + backoffMs).toISOString();
             await supabaseClient.from('automation_queue').update({ status: 'pending', retry_count: nextRetry, last_error: errText, execute_at: executeAt }).eq('id', item.id);
           }
           results.push({ id: item.id, status: 'failed', error: errText });
        }
      } catch (err) {
         const nextRetry = (item.retry_count || 0) + 1;
         const maxRetries = item.max_retries || 3;
         if (nextRetry > maxRetries) {
           await supabaseClient.from('automation_dlq').insert({
             company_id: item.company_id,
             rule_id: item.rule_id,
             payload: item.payload,
             error_message: err.message,
             original_queue_id: item.id
           });
           await supabaseClient.from('automation_queue').update({ status: 'failed_dlq', last_error: err.message }).eq('id', item.id);
         } else {
           const backoffMs = Math.pow(2, nextRetry) * 60000;
           const executeAt = new Date(Date.now() + backoffMs).toISOString();
           await supabaseClient.from('automation_queue').update({ status: 'pending', retry_count: nextRetry, last_error: err.message, execute_at: executeAt }).eq('id', item.id);
         }
         results.push({ id: item.id, status: 'failed', error: err.message });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
