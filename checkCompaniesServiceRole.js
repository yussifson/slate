import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCompanies() {
  const { data, error } = await supabase.from('companies').select('id, name, subdomain');
  if (data) {
    console.log("Companies:", data.map(c => c.subdomain));
  } else {
    console.log("Error:", error);
  }
}
checkCompanies();
