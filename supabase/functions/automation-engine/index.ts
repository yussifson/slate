import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const NOVU_API_KEYS = [
  Deno.env.get('NOVU_API_KEY') ?? '',
  Deno.env.get('NOVU_API_KEY_SECONDARY') ?? '',
  Deno.env.get('NOVU_API_KEY_TERTIARY') ?? ''
].filter(key => key !== '');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payloadRaw = await req.json()
    let { type, table, record, old_record } = payloadRaw
    
    let isResume = false;
    let ruleToResume = null;
    let resumeNodeId = null;
    
    if (payloadRaw.is_resume) {
      isResume = true;
      ruleToResume = payloadRaw.rule;
      resumeNodeId = payloadRaw.next_node_id;
      record = payloadRaw.record;
      table = payloadRaw.table;
    }

    let rules = [];
    if (!isResume) {
      const { data, error: rulesError } = await supabaseClient
        .from('automation_rules')
        .select('*')
        .eq('table_name', table)
        .eq('is_active', true)
      if (rulesError) throw rulesError;
      rules = data || [];
    } else {
      rules = [ruleToResume];
    }

    if (!rules || rules.length === 0) {
      return new Response(JSON.stringify({ message: "No rules active for this table." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const executedActions = [];

    const interpolate = (obj, context) => {
      let str = JSON.stringify(obj || {});
      str = str.replace(/\{\{(.*?)\}\}/g, (match, key) => {
        const val = context[key.trim()] || context.data?.[key.trim()];
        return val !== undefined ? String(val) : match;
      });
      return JSON.parse(str);
    }

    const evaluateCondition = (variable, operator, value, context) => {
      let actual = context[variable] || context.data?.[variable];
      if (actual === undefined) return false;
      
      let nActual = Number(actual);
      let nValue = Number(value);
      let isNum = !isNaN(nActual) && !isNaN(nValue);

      switch(operator) {
        case '==': return actual == value;
        case '!=': return actual != value;
        case '>': return isNum ? nActual > nValue : actual > value;
        case '<': return isNum ? nActual < nValue : actual < value;
        case 'contains': return String(actual).toLowerCase().includes(String(value).toLowerCase());
        default: return false;
      }
    }

    const logExecution = async (rule_id, company_id, status, logs) => {
      await supabaseClient.from('automation_logs').insert({
        rule_id, company_id, status, logs
      });
    }

    for (const rule of rules) {
      const actionType = rule.action_type;
      const logs = [];
      let finalStatus = 'success';
      
      try {
        if (actionType === 'flow' && rule.action_payload?.nodes) {
          const nodes = rule.action_payload.nodes;
          const edges = rule.action_payload.edges;
          
          let currentNode = null;
          
          if (isResume) {
            currentNode = nodes.find(n => n.id === resumeNodeId);
          } else {
            currentNode = nodes.find(n => n.type === 'triggerNode');
            if (currentNode) {
               const nextEdge = edges.find(e => e.source === currentNode.id);
               currentNode = nextEdge ? nodes.find(n => n.id === nextEdge.target) : null;
            }
          }

          while (currentNode) {
            let nextEdge = null;
            
            if (currentNode.type === 'conditionNode') {
              const { variable, operator, value } = currentNode.data.config || {};
              const isTrue = evaluateCondition(variable, operator, value, record);
              logs.push("Condition (${variable} ${operator} ${value}) evaluated to ${isTrue}");
              
              nextEdge = edges.find(e => e.source === currentNode.id && e.sourceHandle === (isTrue ? 'true' : 'false'));
            } 
            else if (currentNode.type === 'delayNode') {
              const { amount, unit } = currentNode.data.config || {};
              logs.push("Delaying for ${amount} ${unit}");
              
              const edgeOut = edges.find(e => e.source === currentNode.id);
              if (edgeOut) {
                let ms = 0;
                if (unit === 'minutes') ms = amount * 60000;
                else if (unit === 'hours') ms = amount * 3600000;
                else if (unit === 'days') ms = amount * 86400000;
                
                const executeAt = new Date(Date.now() + ms).toISOString();
                
                await supabaseClient.from('automation_queue').insert({
                  company_id: rule.company_id,
                  rule_id: rule.id,
                  payload: {
                    is_resume: true,
                    rule: rule,
                    record: record,
                    table: table,
                    next_node_id: edgeOut.target
                  },
                  execute_at: executeAt,
                  status: 'pending'
                });
                
                finalStatus = 'delayed';
                break;
              }
            }
            else if (currentNode.type === 'actionNode') {
               const actType = currentNode.data.actionType;
               const actPayload = interpolate(currentNode.data.config?.payload || {}, record);
               logs.push("Executing ${actType}");
               
               if (actType === 'send_notification') {
                  let success = false;
                  for (const apiKey of NOVU_API_KEYS) {
                    try {
                      const res = await fetch('https://api.novu.co/v1/events/trigger', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': "ApiKey ${apiKey}" },
                        body: JSON.stringify({
                          name: 'system-notification',
                          to: { subscriberId: actPayload.recipient || record.email || 'unknown', email: actPayload.recipient || record.email },
                          payload: { title: actPayload.title || "Alert from ${table}", message: actPayload.message || "A new record was added to ${table}." }
                        })
                      });
                      if (res.ok) { success = true; break; }
                    } catch (err) {}
                  }
                  if (!success) throw new Error("Novu failed");
               }
               else if (actType === 'create_task') {
                  const { error: insertError } = await supabaseClient.from('tasks').insert({
                    title: actPayload.title || "Task from ${table}",
                    description: actPayload.description || "Generated by automation on ${table}",
                    status: 'pending',
                    company_id: rule.company_id || record.company_id || null
                  });
                  if (insertError) throw insertError;
               }
               else if (actType === 'webhook') {
                  const response = await fetch(actPayload.url, {
                    method: actPayload.method || 'POST',
                    headers: actPayload.headers || { 'Content-Type': 'application/json' },
                    body: (actPayload.method === 'GET' || actPayload.method === 'HEAD') ? undefined : JSON.stringify(actPayload.body || record)
                  });
                  if (!response.ok) throw new Error("Webhook HTTP status: " + response.status);
               }
               
               nextEdge = edges.find(e => e.source === currentNode.id);
            }
            
            if (nextEdge) {
               currentNode = nodes.find(n => n.id === nextEdge.target);
            } else {
               currentNode = null;
            }
          }
        }

        executedActions.push({ rule_id: rule.id, status: finalStatus, logs });
        await logExecution(rule.id, rule.company_id, finalStatus, logs);
      } catch (err) {
        executedActions.push({ rule_id: rule.id, status: 'failed', error: err.message, logs });
        await logExecution(rule.id, rule.company_id, 'failed', [...logs, "ERROR: ${err.message}" ]);
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