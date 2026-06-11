import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf8');
const vars = {};
env.split('\n').forEach(line => {
  const [k, v] = line.split('=');
  if (k && v) vars[k.trim()] = v.trim();
});

const supabase = createClient(vars.VITE_SUPABASE_URL, vars.VITE_SUPABASE_ANON_KEY);

async function findCompany() {
  const { data, error } = await supabase.from('companies').select('*');
  console.log("Companies:", data, error);
}

findCompany();
