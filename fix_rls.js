import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wmabgiafwamxkcgxyhee.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtYWJnaWFmd2FteGtjZ3h5aGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NTk0MjIsImV4cCI6MjA5NTMzNTQyMn0.cXS4DjYP_KEMDJ5n1QXOfOu0TGxUOQktf_j88Y9FHpk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const sql = `
    -- Enable RLS
    ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if any
    DROP POLICY IF EXISTS "Allow public read access to platform_config" ON public.platform_config;
    DROP POLICY IF EXISTS "Allow super_admins to manage platform_config" ON public.platform_config;
    DROP POLICY IF EXISTS "Super admins can manage platform_config" ON public.platform_config;
    
    -- Anyone can read platform_config
    CREATE POLICY "Allow public read access to platform_config"
      ON public.platform_config
      FOR SELECT
      USING (true);
      
    -- Only super admins can insert/update/delete
    CREATE POLICY "Allow super_admins to manage platform_config"
      ON public.platform_config
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'super_admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'super_admin'
        )
      );
  `;

  console.log("Applying RLS policies to platform_config...");
  const { data, error } = await supabase.rpc('execute_sql', { sql_query: sql });
  
  if (error) {
    console.error("Error executing SQL via RPC:", error);
  } else {
    console.log("Successfully updated RLS policies for platform_config.", data);
  }
}

run();
