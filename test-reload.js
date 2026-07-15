import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
// Wait, we can't run NOTIFY without service role key!
// But wait, the skill data_sync_persistence_fix says:
// "Run via: npx supabase db query --linked --file fix_migration.sql"
// I can't do that if I don't have the linked project password!
