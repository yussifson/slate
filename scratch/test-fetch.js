import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf8');
const vars = {};
env.split('\n').forEach(line => {
  const [k, v] = line.split('=');
  if (k && v) vars[k.trim()] = v.trim();
});

const clientFile = fs.readFileSync('src/api/supabaseClient.js', 'utf8');
const preparedCode = clientFile
  .replace("const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;", `const supabaseUrl = "${vars.VITE_SUPABASE_URL}";`)
  .replace("const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;", `const supabaseAnonKey = "${vars.VITE_SUPABASE_ANON_KEY}";`)
  .replace("export const supabase =", "const supabase =")
  .replace("if (typeof navigator !== 'undefined' && !navigator.onLine) {", "if (false) {");

fs.writeFileSync('scratch/temp-client.js', preparedCode + '\nexport { supabase };');

const { supabase } = await import('./temp-client.js');

async function runTest() {
  const titleVal = 'Test Null Company ' + Date.now();
  const payload = {
    title: titleVal,
    client_name: 'John Doe Null',
    date: '2026-06-11',
    time: '10:00:00',
    duration_minutes: 60,
    status: 'Scheduled',
    company_id: null
  };
  
  console.log("Inserting payload with null company_id...");
  const { data: insertData, error: insertError } = await supabase.from('univ_appointments').insert(payload).select();
  console.log("Insert result:", insertData, insertError);

  console.log("Querying using .eq('company_id', null)...");
  const { data: selectData, error: selectError } = await supabase.from('univ_appointments').select('*').eq('company_id', null);
  console.log("Select result count:", selectData ? selectData.length : 0, selectError);
  
  if (selectData && selectData.length > 0) {
    const found = selectData.find(r => r.title === titleVal);
    console.log("Found inserted record in retrieved list?", found ? "YES!" : "NO");
  }
}

runTest();
