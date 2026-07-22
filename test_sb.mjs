import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: d2, error: e2 } = await supabase.from('clipad_videos')
    .update({ title: 'test', visibility: 'public', is_locked: false, unlock_at: null })
    .eq('id', '5154596f-f030-4b64-aa1a-8c0c7aa353ac')
    .select('*, creator:creator_id(full_name, avatar_url)')
    .single();
  console.log('Update Video Error:', e2);

  const { data: cols } = await supabase
    .from('information_schema.columns')
    .select('table_name, column_name')
    .eq('table_schema', 'public')
    .in('table_name', ['clipad_spaces', 'clipad_videos']);
  console.log('Columns:', cols);
}
run();
