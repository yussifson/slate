import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  console.log("Testing Supabase URL:", process.env.VITE_SUPABASE_URL);
  try {
    const start = Date.now();
    console.log("Fetching profiles...");
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    console.log("Time taken:", Date.now() - start, "ms");
    console.log("Data:", data, "Error:", error);
  } catch (e) {
    console.error("Exception:", e);
  }
}
test();
