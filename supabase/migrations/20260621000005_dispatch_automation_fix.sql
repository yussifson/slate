ALTER TABLE IF EXISTS public.univ_dispatch ADD COLUMN IF NOT EXISTS shipment_id text;

DROP POLICY IF EXISTS "company_isolation_insert" ON public."automation_logs";
CREATE POLICY "company_isolation_insert" ON public."automation_logs"
FOR INSERT WITH CHECK (
    company_id::text IN (SELECT user_company_ids())
);
