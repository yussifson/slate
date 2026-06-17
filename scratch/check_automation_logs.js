import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  // Even more columns to check
  const tests = ['id', 'company_id', 'created_at', 'status', 'rule_id',
    'updated_at', 'automation_id', 'trigger_type', 'triggered_at', 'triggered_by',
    'execution_time', 'error_message', 'result', 'output', 'input',
    'log_level', 'message', 'event_type', 'run_id',
    'success', 'completed_at', 'started_at', 'duration',
    'automation_name', 'rule_name', 'workflow_id', 'step_id',
    'payload', 'response', 'context', 'data', 'metadata',
    'created_by', 'updated_date', 'created_date'];
  
  const valid = [];
  for (const col of tests) {
    const { data, error } = await supabase.from('automation_logs').select(col).limit(1);
    if (!error) {
      valid.push(col);
    }
  }
  console.log("ALL VALID COLUMNS:", valid);
}
check();
