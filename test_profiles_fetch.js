import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('*').limit(5);
  console.log('Profiles:', profiles, pErr);

  const { data: staff, error: sErr } = await supabase.from('staff_records').select('*').limit(5);
  console.log('Staff:', staff, sErr);
}

test();
