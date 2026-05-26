import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wmabgiafwamxkcgxyhee.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtYWJnaWFmd2FteGtjZ3h5aGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NTk0MjIsImV4cCI6MjA5NTMzNTQyMn0.cXS4DjYP_KEMDJ5n1QXOfOu0TGxUOQktf_j88Y9FHpk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('companies').select('email').eq('subdomain', 'corewave').single();
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Email for corewave:", data.email);
  }
}

run();
