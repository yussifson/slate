import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // or service key if needed

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchPlans() {
  const { data, error } = await supabase.from('subscription_plans').select('id, name, price_monthly, price_yearly, paystack_plan_code, is_active');
  if (error) {
    console.error("Error fetching plans:", error);
    return;
  }
  console.log(JSON.stringify(data, null, 2));
}

fetchPlans();
