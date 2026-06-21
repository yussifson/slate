-- Fix RLS for intelligence_runs and workspace_insights

-- 1. Ensure RLS is enabled
ALTER TABLE public.intelligence_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_insights ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies
DROP POLICY IF EXISTS "Enable ALL for users based on company_id" ON public.intelligence_runs;
DROP POLICY IF EXISTS "Enable ALL for users based on company_id" ON public.workspace_insights;

-- 3. Create fully permissive policies for authenticated users
-- This guarantees that any logged-in user can insert/update intelligence runs and insights
-- which is required by PowerSync to sync local SQLite changes to Supabase.
CREATE POLICY "Enable ALL for authenticated users" ON public.intelligence_runs 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Enable ALL for authenticated users" ON public.workspace_insights 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 4. Ensure they are in the PowerSync publication
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'powersync' AND tablename = 'intelligence_runs') THEN
        ALTER PUBLICATION powersync ADD TABLE public.intelligence_runs;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'powersync' AND tablename = 'workspace_insights') THEN
        ALTER PUBLICATION powersync ADD TABLE public.workspace_insights;
    END IF;
END $$;
