import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function migrate() {
  // Check if 'role' column already exists
  const { data: cols } = await supabase
    .from('information_schema.columns')
    .select('column_name')
    .eq('table_schema', 'public')
    .eq('table_name', 'clipad_space_members')
    .eq('column_name', 'role');

  if (cols && cols.length > 0) {
    console.log('✅ role column already exists on clipad_space_members');
    return;
  }

  // Try adding via RPC (if available)
  const { error: rpcErr } = await supabase.rpc('exec_sql', {
    sql: `ALTER TABLE clipad_space_members ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member';`
  });

  if (rpcErr) {
    console.warn('⚠️  exec_sql RPC not available. You must run this SQL manually in Supabase SQL editor:');
    console.log(`\nALTER TABLE clipad_space_members ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member';\n`);
  } else {
    console.log('✅ Migration successful — role column added to clipad_space_members');
  }
}

migrate().catch(console.error);
