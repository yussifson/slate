/**
 * Slate V2 Inngest Workflow Engine Bridge
 * 
 * Bridges transactional platform_events to durable Inngest functions,
 * dispatching to the WorkflowRuntime with retry handling and idempotency.
 */

import { inngest } from '../client.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Durable Workflow Dispatcher
 * Listens for all 'slate/event.*' and triggers matching workflow definitions
 */
export const slateWorkflowDispatcher = inngest.createFunction(
  {
    id: 'slate-workflow-dispatcher',
    retries: 3
  },
  { event: 'slate/*' },
  async ({ event, step }) => {
    const eventName = event.name.replace('slate/', '');
    const companyId = event.data?.company_id;

    if (!companyId) {
      return { success: false, reason: 'Missing company_id in event payload' };
    }

    // 1. Fetch active workflows matching this event trigger
    const workflows = await step.run('fetch-matching-workflows', async () => {
      const { data, error } = await supabase
        .from('workflow_definitions')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .eq('trigger_type', 'event');

      if (error) throw error;
      return (data || []).filter((wf: any) => {
        return wf.trigger_config?.event_type === eventName || wf.trigger_config?.event_type === '*';
      });
    });

    if (!workflows || workflows.length === 0) {
      return { success: true, message: `No active workflows registered for event ${eventName}` };
    }

    // 2. Dispatch execution for each matching workflow
    const results = [];
    for (const wf of workflows) {
      const execResult = await step.run(`execute-wf-${wf.id}`, async () => {
        // Enforce idempotency key using event ID and workflow ID
        const idempotencyKey = `wf_${wf.id}_evt_${event.data?.event_id || event.id}`;

        const { data: run, error: runErr } = await supabase
          .from('workflow_executions')
          .insert({
            workflow_id: wf.id,
            company_id: companyId,
            trigger_event_id: event.data?.event_id || null,
            trigger_type: 'event',
            idempotency_key: idempotencyKey,
            status: 'running',
            input_payload: event.data || {},
            steps_total: Array.isArray(wf.steps) ? wf.steps.length : 0,
            steps_completed: 0,
            started_at: new Date().toISOString()
          })
          .select()
          .single();

        if (runErr) {
          // If already exists, return existing
          if (runErr.code === '23505') {
            return { skipped: true, reason: 'Duplicate event execution suppressed' };
          }
          throw runErr;
        }

        return { execution_id: run.id, status: 'started' };
      });

      results.push(execResult);
    }

    return { success: true, triggeredCount: results.length, executions: results };
  }
);
