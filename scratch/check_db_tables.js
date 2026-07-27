import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testCols() {
  const table = 'clipad_meeting_records';
  const columns = ['company_id', 'workspace_id'];
  for (const col of columns) {
    const { error } = await supabase.from(table).select(col).limit(1);
    console.log(`${col}: ${error ? 'ERROR: ' + error.message : 'SUCCESS'}`);
  }
}
testCols();
