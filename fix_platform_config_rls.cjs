const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
  // Using RPC if available or a simple query
  const { error } = await supabase.rpc('execute_sql', { sql_query: sql });
  
  if (error) {
    console.error("Error executing SQL via RPC:", error);
    console.log("Please run the SQL manually in the Supabase dashboard.");
    console.log(sql);
  } else {
    console.log("Successfully updated RLS policies for platform_config.");
  }
}

run();
