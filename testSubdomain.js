import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const tests = ['optal', 'Optal', 'OPTAL', 'optal.slate.optavel.com'];
  for (const t of tests) {
    const res = await supabase.rpc('get_company_by_subdomain', { p_subdomain: t });
    console.log(`Test '${t}':`, res.data);
  }
}
check();
