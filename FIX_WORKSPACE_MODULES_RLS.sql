-- Fix workspace_modules RLS Policy

DO $$
BEGIN
    DROP POLICY IF EXISTS "workspace_modules_all_access" ON public.workspace_modules;
    
    CREATE POLICY "workspace_modules_all_access" ON public.workspace_modules
    AS PERMISSIVE FOR ALL
    TO public
    USING (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text))
    WITH CHECK (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text));
    
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;
