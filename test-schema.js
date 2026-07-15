import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: d3, error: e3 } = await supabase.from('clipad_meeting_reactions').insert({
    meeting_id: '123e4567-e89b-12d3-a456-426614174000',
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    emoji: '👍'
  });
  console.log('Meeting Reactions:', e3 || d3);
  
  const { data: d4, error: e4 } = await supabase.from('clipad_video_reactions').insert({
    video_id: '123e4567-e89b-12d3-a456-426614174000',
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    emoji: '👍'
  });
  console.log('Video Reactions:', e4 || d4);
}
check();
