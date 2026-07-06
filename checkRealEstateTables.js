import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseKey) throw new Error('VITE_SUPABASE_ANON_KEY is required in .env');

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: tables, error: tableErr } = await supabase.rpc('execute_sql', {
    sql: `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'univ_re_%';
    `
  });
  
  if (tableErr) {
    console.error("RPC execute_sql failed:", tableErr);
    return;
  }
  
  console.log("Real Estate Tables found:", tables.map(t => t.table_name).join(', '));
  
  // Check schema for missing company_id
  for (const t of tables) {
    const { data: cols } = await supabase.rpc('execute_sql', {
      sql: `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = '${t.table_name}'
      `
    });
    const hasCompanyId = cols.some(c => c.column_name === 'company_id');
    console.log(`Table ${t.table_name}: has company_id? ${hasCompanyId}`);
  }
}
run();
