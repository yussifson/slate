import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  console.log("Testing signInWithPassword...");
  try {
    const start = Date.now();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'yussifabduljalil601@gmail.com',
      password: 'AdminPassword123!'
    });
    console.log("Time taken:", Date.now() - start, "ms");
    console.log("Data user id:", data?.user?.id, "Error:", error?.message);
    
    console.log("Testing getUser...");
    const start2 = Date.now();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    console.log("getUser Time taken:", Date.now() - start2, "ms");
    console.log("getUser Data id:", userData?.user?.id, "Error:", userError?.message);

  } catch (e) {
    console.error("Exception:", e);
  }
}
test();
