import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.*)/) || env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

async function run() {
  const sql = fs.readFileSync('update_rpc2.sql', 'utf8');
  const { data, error } = await supabase.rpc('exec_sql', { query: sql });
  console.log("exec_sql result:", data, error);
}
run();
