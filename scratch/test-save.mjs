import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Manually parse .env
const env = fs.readFileSync('.env', 'utf8');
const vars = {};
env.split('\n').forEach(line => {
  const [k, v] = line.split('=');
  if (k && v) vars[k.trim()] = v.trim();
});

const supabaseUrl = vars.VITE_SUPABASE_URL;
const supabaseKey = vars.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSave() {
  console.log("Supabase URL:", supabaseUrl);
  
  // Try inserting a record
  const payload = {
    title: 'Test Appointment ' + Date.now(),
    client_name: 'John Doe',
    client_email: 'john@example.com',
    duration_minutes: 45,
    status: 'Scheduled'
  };
  
  console.log("Inserting payload:", payload);
  const { data, error } = await supabase.from('univ_appointments').insert(payload).select();
  console.log("Insert response:", { data, error });
}

testSave();
