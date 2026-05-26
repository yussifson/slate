const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [k, v] = line.split('=');
  if(k && v) acc[k.trim()] = v.trim();
  return acc;
}, {});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function testCases() {
  const { data, error } = await supabase.from('legal_cases').select('*');
  console.log('Cases in DB:', data ? data.length : 0);
  if (data && data.length > 0) {
     console.log('Sample case company_id:', data[0].company_id);
  }
}
testCases();
