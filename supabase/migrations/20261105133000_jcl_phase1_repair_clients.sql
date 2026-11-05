-- JCL Phase 1 repair / completion migration.
-- This script is safe to run whether the Phase 1 tables exist or not.
-- It uses the existing Real Estate client register: public.univ_re_clients.

CREATE TABLE IF NOT EXISTS public.jcl_engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  engagement_number TEXT NOT NULL,
  client_party_id UUID REFERENCES public.core_parties(id) ON DELETE RESTRICT,
  client_id UUID REFERENCES public.univ_re_clients(id) ON DELETE RESTRICT,
  lead_party_id UUID REFERENCES public.core_parties(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  engagement_type TEXT NOT NULL DEFAULT 'other' CHECK (engagement_type IN ('new_construction','takeover_completion','renovation_extension','engineering_consultancy','planning_design','landscaping_external_works','site_preparation_supervision','other')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','qualification','consultation','requirements_gathering','assessment','estimation','proposal','negotiation','contracted','converted_to_project','lost','cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  site_address TEXT,
  date_received DATE NOT NULL DEFAULT CURRENT_DATE,
  responsible_party_id UUID REFERENCES public.core_parties(id) ON DELETE SET NULL,
  budget_min NUMERIC(15,2),
  budget_max NUMERIC(15,2),
  expected_start_date DATE,
  expected_completion_date DATE,
  internal_notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, engagement_number)
);

ALTER TABLE public.jcl_engagements
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.univ_re_clients(id) ON DELETE RESTRICT;

ALTER TABLE public.jcl_engagements
  ALTER COLUMN client_party_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.jcl_engagement_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES public.jcl_engagements(id) ON DELETE CASCADE,
  objectives TEXT,
  requested_scope TEXT,
  expected_deliverables JSONB NOT NULL DEFAULT '[]'::jsonb,
  site_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  constraints TEXT,
  budget_expectations TEXT,
  desired_timeline TEXT,
  technical_requirements TEXT,
  supporting_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  decisions JSONB NOT NULL DEFAULT '[]'::jsonb,
  outstanding_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, engagement_id)
);

CREATE TABLE IF NOT EXISTS public.jcl_takeover_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES public.jcl_engagements(id) ON DELETE CASCADE,
  original_contractor TEXT,
  previous_project_owner TEXT,
  current_condition TEXT,
  inherited_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed_work JSONB NOT NULL DEFAULT '[]'::jsonb,
  outstanding_work JSONB NOT NULL DEFAULT '[]'::jsonb,
  known_defects JSONB NOT NULL DEFAULT '[]'::jsonb,
  preliminary_risks JSONB NOT NULL DEFAULT '[]'::jsonb,
  estimated_completion_requirements TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, engagement_id)
);

ALTER TABLE public.ops_projects
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.univ_re_clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_jcl_engagements_client_id ON public.jcl_engagements(company_id, client_id);
CREATE INDEX IF NOT EXISTS idx_ops_projects_jcl_client_id ON public.ops_projects(company_id, client_id);

UPDATE public.jcl_engagements e
SET client_id = c.id
FROM public.univ_re_clients c
WHERE e.client_id IS NULL
  AND e.company_id::text = c.company_id::text
  AND e.client_party_id IS NULL;

CREATE TABLE IF NOT EXISTS public.jcl_project_phase_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  project_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  phases JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, project_type, name)
);

ALTER TABLE public.jcl_project_phase_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS jcl_project_phase_templates_read ON public.jcl_project_phase_templates;
CREATE POLICY jcl_project_phase_templates_read ON public.jcl_project_phase_templates
FOR SELECT USING (
  is_system = true
  OR company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
);

INSERT INTO public.jcl_project_phase_templates (project_type, name, phases, is_system) VALUES
('new_construction','New Construction','[{"name":"Qualification & Brief","sequence":1},{"name":"Planning & Design","sequence":2},{"name":"Approvals & Mobilization","sequence":3},{"name":"Construction Delivery","sequence":4},{"name":"Handover Preparation","sequence":5}]'::jsonb,true),
('takeover_completion','Takeover / Completion','[{"name":"Condition Assessment","sequence":1},{"name":"Inherited Work Review","sequence":2},{"name":"Revised Scope & Estimate","sequence":3},{"name":"Completion Delivery","sequence":4},{"name":"Handover","sequence":5}]'::jsonb,true),
('renovation_extension','Renovation / Extension','[{"name":"Brief & Survey","sequence":1},{"name":"Design & Approvals","sequence":2},{"name":"Works Delivery","sequence":3},{"name":"Closeout","sequence":4}]'::jsonb,true),
('planning_design','Consultancy & Planning','[{"name":"Brief","sequence":1},{"name":"Investigation","sequence":2},{"name":"Design / Advice","sequence":3},{"name":"Review & Delivery","sequence":4}]'::jsonb,true),
('landscaping_external_works','Landscaping / External Works','[{"name":"Site Review","sequence":1},{"name":"Design & Estimate","sequence":2},{"name":"Works Delivery","sequence":3},{"name":"Closeout","sequence":4}]'::jsonb,true)
ON CONFLICT DO NOTHING;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['jcl_engagements','jcl_engagement_requirements','jcl_takeover_assessments'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I_tenant_isolation ON public.%I', t, t);
    EXECUTE format('CREATE POLICY %I_tenant_isolation ON public.%I FOR ALL USING (company_id = (auth.jwt() -> ''app_metadata'' ->> ''company_id'')::uuid) WITH CHECK (company_id = (auth.jwt() -> ''app_metadata'' ->> ''company_id'')::uuid)', t, t);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
