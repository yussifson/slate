
-- 4. Space Members Isolation
DROP POLICY IF EXISTS "Strict Tenant Isolation - Space Members" ON public.clipad_space_members;
CREATE POLICY "Strict Tenant Isolation - Space Members" ON public.clipad_space_members FOR SELECT TO authenticated USING (space_id IN (SELECT id FROM public.clipad_spaces WHERE company_id IN (SELECT get_auth_company_ids())));
