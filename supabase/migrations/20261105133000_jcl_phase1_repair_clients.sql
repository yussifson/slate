-- JCL Phase 1 repair: use the existing JCL client register and refresh PostgREST schema.
-- Run after 20261105120000_jcl_phase1_engagements_projects.sql.

ALTER TABLE public.jcl_engagements
  ALTER COLUMN client_party_id DROP NOT NULL;

ALTER TABLE public.jcl_engagements
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.univ_re_clients(id) ON DELETE RESTRICT;

ALTER TABLE public.ops_projects
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.univ_re_clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_jcl_engagements_client_id ON public.jcl_engagements(company_id, client_id);
CREATE INDEX IF NOT EXISTS idx_ops_projects_jcl_client_id ON public.ops_projects(company_id, client_id);

-- Keep existing core-party references valid where a mapping already exists.
UPDATE public.jcl_engagements e
SET client_id = c.id
FROM public.univ_re_clients c
WHERE e.client_id IS NULL
  AND e.company_id::text = c.company_id::text
  AND e.client_party_id IS NULL;

-- Make the seeded phase templates visible through the API immediately.
ALTER TABLE public.jcl_project_phase_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS jcl_project_phase_templates_read ON public.jcl_project_phase_templates;
CREATE POLICY jcl_project_phase_templates_read ON public.jcl_project_phase_templates
FOR SELECT USING (is_system = true OR company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid);

NOTIFY pgrst, 'reload schema';
