import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCompanies() {
  console.log("Checking companies...");
  const { data, error } = await supabase.from('companies').select('id, name, subdomain');
  if (error) {
    console.error("Error querying companies:", error);
  } else {
    console.log("Companies:", data);
  }
  
  console.log("Testing RPC...");
  const rpcRes = await supabase.rpc('get_company_by_subdomain', { p_subdomain: 'optal' });
  console.log("RPC result:", rpcRes);
}

checkCompanies();
