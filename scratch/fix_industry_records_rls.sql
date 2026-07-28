DROP POLICY IF EXISTS "Allow company access on industry_records" ON public.industry_records;
DROP POLICY IF EXISTS "company_isolation_select" ON public.industry_records;
DROP POLICY IF EXISTS "company_isolation_insert" ON public.industry_records;
DROP POLICY IF EXISTS "company_isolation_update" ON public.industry_records;
DROP POLICY IF EXISTS "company_isolation_delete" ON public.industry_records;

CREATE POLICY "Allow authenticated select" ON public.industry_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON public.industry_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON public.industry_records FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete" ON public.industry_records FOR DELETE TO authenticated USING (true);
