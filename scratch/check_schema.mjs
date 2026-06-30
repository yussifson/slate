import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

const envConfig = dotenv.parse(fs.readFileSync('.env'));
const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

async function checkSchema() {
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'companies' });
  
  if (error) {
    // try selecting one row
    const res = await supabase.from('companies').select('*').limit(1);
    console.log(Object.keys(res.data[0] || {}));
  } else {
    console.log(data);
  }
}

checkSchema();
