import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // The payload from the Supabase Webhook
    const { type, table, record, old_record } = await req.json()

    // 1. Fetch active automation rules for this table
    const { data: rules, error: rulesError } = await supabaseClient
      .from('automation_rules')
      .select('*')
      .eq('table_name', table)
      .eq('is_active', true)

    if (rulesError) throw rulesError
    if (!rules || rules.length === 0) {
      return new Response(JSON.stringify({ message: "No rules active for this table." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const executedActions = []

    // 2. Evaluate each rule
    for (const rule of rules) {
      // rule.conditions is an array of conditions e.g. { field: "status", operator: "equals", value: "Approved" }
      let conditionMet = false

      if (type === 'UPDATE') {
        conditionMet = rule.conditions.every(cond => {
          if (cond.operator === 'equals') return record[cond.field] === cond.value
          if (cond.operator === 'changed_to') return record[cond.field] === cond.value && old_record[cond.field] !== cond.value
          return false
        })
      } else if (type === 'INSERT') {
        conditionMet = rule.conditions.every(cond => {
          if (cond.operator === 'equals') return record[cond.field] === cond.value
          return false
        })
      }

      // 3. Execute action if conditions met
      if (conditionMet) {
        if (rule.action_type === 'send_email') {
          // Mock sending email
          console.log(`[ACTION] Sending email to ${rule.action_payload.to} with subject: ${rule.action_payload.subject}`)
          // Here we would integrate Resend, Sendgrid, etc.
          executedActions.push({ rule_id: rule.id, action: 'send_email', status: 'success' })
        } 
        else if (rule.action_type === 'create_task') {
          // Insert a new task
          const { error: insertError } = await supabaseClient
            .from('tasks')
            .insert({
              title: rule.action_payload.title.replace('{{record_id}}', record.id),
              description: rule.action_payload.description,
              status: 'pending',
              company_id: record.company_id || null
            })
          
          executedActions.push({ rule_id: rule.id, action: 'create_task', status: insertError ? 'failed' : 'success' })
        }
        else if (rule.action_type === 'create_record') {
          // Insert dynamic record
          let payloadStr = JSON.stringify(rule.action_payload.payload || {});
          payloadStr = payloadStr.replace(/\{\{(.*?)\}\}/g, (match, key) => {
            const val = record[key.trim()];
            return val !== undefined ? val : match;
          });
          const parsedPayload = JSON.parse(payloadStr);
          parsedPayload.company_id = record.company_id || null;

          const targetTable = rule.action_payload.table_name || 'industry_records';
          
          const { error: insertError } = await supabaseClient
            .from(targetTable)
            .insert(parsedPayload);
          
          executedActions.push({ rule_id: rule.id, action: 'create_record', status: insertError ? 'failed' : 'success' })
        }
        else if (rule.action_type === 'update_record') {
          // Update record dynamically
          let payloadStr = JSON.stringify(rule.action_payload.payload || {});
          payloadStr = payloadStr.replace(/\{\{(.*?)\}\}/g, (match, key) => {
            const val = record[key.trim()];
            return val !== undefined ? val : match;
          });
          const parsedPayload = JSON.parse(payloadStr);

          const targetTable = rule.action_payload.table_name || 'industry_records';
          const targetIdStr = String(rule.action_payload.id).replace(/\{\{(.*?)\}\}/g, (match, key) => {
            const val = record[key.trim()];
            return val !== undefined ? val : match;
          });
          
          const { error: updateError } = await supabaseClient
            .from(targetTable)
            .update(parsedPayload)
            .eq('id', targetIdStr);
            
          executedActions.push({ rule_id: rule.id, action: 'update_record', status: updateError ? 'failed' : 'success' })
        }
        else if (rule.action_type === 'delete_record') {
          // Delete record dynamically
          const targetTable = rule.action_payload.table_name || 'industry_records';
          const targetIdStr = String(rule.action_payload.id).replace(/\{\{(.*?)\}\}/g, (match, key) => {
            const val = record[key.trim()];
            return val !== undefined ? val : match;
          });
          
          const { error: deleteError } = await supabaseClient
            .from(targetTable)
            .delete()
            .eq('id', targetIdStr);
            
          executedActions.push({ rule_id: rule.id, action: 'delete_record', status: deleteError ? 'failed' : 'success' })
        }
        else if (rule.action_type === 'http_request') {
          // External API request
          let urlStr = (rule.action_payload.url || '').replace(/\{\{(.*?)\}\}/g, (match, key) => {
            const val = record[key.trim()];
            return val !== undefined ? String(val) : match;
          });
          let bodyStr = JSON.stringify(rule.action_payload.body || {});
          bodyStr = bodyStr.replace(/\{\{(.*?)\}\}/g, (match, key) => {
            const val = record[key.trim()];
            return val !== undefined ? val : match;
          });
          
          try {
            const response = await fetch(urlStr, {
              method: rule.action_payload.method || 'POST',
              headers: rule.action_payload.headers || { 'Content-Type': 'application/json' },
              body: (rule.action_payload.method === 'GET' || rule.action_payload.method === 'HEAD') ? undefined : bodyStr
            });
            executedActions.push({ rule_id: rule.id, action: 'http_request', status: response.ok ? 'success' : 'failed' })
          } catch (err) {
            executedActions.push({ rule_id: rule.id, action: 'http_request', status: 'failed', error: err.message })
          }
        }
      }
    }

    return new Response(JSON.stringify({ message: "Rules evaluated successfully", executedActions }), {
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
