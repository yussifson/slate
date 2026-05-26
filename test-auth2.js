import { createClient } from '@supabase/supabase-js';

const url = 'https://igigwbifmfflzvnglrrl.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnaWd3YmlmbWZmbHp2bmdscnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1MTMwMTAsImV4cCI6MjA5NTA4OTAxMH0.qX_-LMnV7oYBeHu15zpsRrGkLfGq9p11qa9IMc1NRqE';

const supabase = createClient(url, key);

async function test() {
  console.log("Testing signInWithPassword...");
  try {
    const start = Date.now();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'yussifabduljalil601@gmail.com',
      password: 'AdminPassword123!'
    });
    console.log("signIn Time taken:", Date.now() - start, "ms");
    console.log("signIn Data user id:", data?.user?.id, "Error:", error?.message);
    
    if (data?.user?.id) {
        console.log("Testing getUser...");
        const start2 = Date.now();
        const { data: userData, error: userError } = await supabase.auth.getUser();
        console.log("getUser Time taken:", Date.now() - start2, "ms");
        console.log("getUser Data id:", userData?.user?.id, "Error:", userError?.message);

        console.log("Testing profiles query...");
        const start3 = Date.now();
        const { data: prof, error: profError } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
        console.log("profiles Time taken:", Date.now() - start3, "ms");
        console.log("profiles Data:", prof?.id, "Error:", profError?.message);
    }
  } catch (e) {
    console.error("Exception:", e);
  }
}
test();
