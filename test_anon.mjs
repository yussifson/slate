import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://wmabgiafwamxkcgxyhee.supabase.co";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "YOUR_KEY";

const testSB = async () => {
  // Read anon key from env file if available
  const fs = await import('fs');
  const env = fs.readFileSync('.env.local', 'utf-8');
  const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
  const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);
  
  const url = urlMatch ? urlMatch[1] : SUPABASE_URL;
  const key = keyMatch ? keyMatch[1] : SUPABASE_ANON_KEY;
  
  const supabase = createClient(url, key);
  
  const { data, error } = await supabase
    .from('clipad_videos')
    .select('id, title, visibility, creator:creator_id(full_name)')
    .eq('id', '5154596f-f030-4b64-aa1a-8c0c7aa353ac')
    .single();
    
  console.log("Anon Fetch Result:", JSON.stringify({data, error}, null, 2));
};

testSB();
