import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://wmabgiafwamxkcgxyhee.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtYWJnaWFmd2FteGtjZ3h5aGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NTk0MjIsImV4cCI6MjA5NTMzNTQyMn0.cXS4DjYP_KEMDJ5n1QXOfOu0TGxUOQktf_j88Y9FHpk";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data, error } = await supabase
    .from('industry_records')
    .select('created_at, company_id, data')
    .eq('record_type', 'workspace_config')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (error) console.error("Error:", error);
  else console.log("Recent workspace configs:", JSON.stringify(data, null, 2));
}
check();
