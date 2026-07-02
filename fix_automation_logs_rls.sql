-- Enable RLS just in case it isn't
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON public.automation_logs;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.automation_logs;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.automation_logs;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.automation_logs;

-- Recreate robust policies for automation_logs allowing full access 
-- (assuming company_id scoping is handled via application layer/PowerSync)
CREATE POLICY "Enable read access for all users"
ON public.automation_logs FOR SELECT
USING (true);

CREATE POLICY "Enable insert access for all users"
ON public.automation_logs FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
ON public.automation_logs FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete access for all users"
ON public.automation_logs FOR DELETE
USING (true);
