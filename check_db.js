import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConstraints() {
  const { data, error } = await supabase.rpc('execute_sql', {
    sql: `SELECT conname, pg_get_constraintdef(c.oid)
          FROM pg_constraint c
          JOIN pg_namespace n ON n.oid = c.connamespace
          WHERE contype = 'c' AND conname LIKE 'clients_%';`
  });
  console.log('Result:', data, error);
}

checkConstraints();
