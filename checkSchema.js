import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase
    .from('clipad_integrations')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('Error fetching clipad_integrations:', error);
  } else {
    console.log('Columns in clipad_integrations:', data.length > 0 ? Object.keys(data[0]) : 'Table is empty');
  }

  // Check if we can update 'metadata'
  if (data && data.length > 0) {
    const { error: updateError } = await supabase
      .from('clipad_integrations')
      .update({ metadata: { test: 1 } })
      .eq('id', data[0].id);
    if (updateError) {
      console.error('Update Error:', updateError);
    } else {
      console.log('Update successful');
    }
  }
}

checkSchema();
