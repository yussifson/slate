import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wmabgiafwamxkcgxyhee.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtYWJnaWFmd2FteGtjZ3h5aGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NTk0MjIsImV4cCI6MjA5NTMzNTQyMn0.cXS4DjYP_KEMDJ5n1QXOfOu0TGxUOQktf_j88Y9FHpk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const dummyRecord = {
    company_id: 'dummy-company-id',
    industry: 'school',
    record_type: 'student',
    status: 'Active',
    search_text: 'Test Student',
    data: { name: 'Test Student' }
  };

  const { data, error } = await supabase.from('industry_records').insert(dummyRecord).select();
  if (error) {
    console.error("Insert failed:", error.message);
  } else {
    console.log("Successfully inserted a dummy record directly using Anon key! Data:", data);
  }
}

test();
