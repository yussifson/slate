-- JCL Phase 1: unified engagements, estimates, proposals, contracts and projects.
-- Additive only: legacy univ_re_* tables remain untouched.

ALTER TABLE public.ops_projects
  ADD COLUMN IF NOT EXISTS project_type TEXT,
  ADD COLUMN IF NOT EXISTS engagement_id UUID,
  ADD COLUMN IF NOT EXISTS contract_id UUID,
  ADD COLUMN IF NOT EXISTS site_address TEXT,
  ADD COLUMN IF NOT EXISTS project_manager_party_id UUID REFERENCES public.core_parties(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_budget_amount NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS project_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.jcl_engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  engagement_number TEXT NOT NULL,
  client_party_id UUID NOT NULL REFERENCES public.core_parties(id) ON DELETE RESTRICT,
  lead_party_id UUID REFERENCES public.core_parties(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  engagement_type TEXT NOT NULL CHECK (engagement_type IN ('new_construction','takeover_completion','renovation_extension','engineering_consultancy','planning_design','landscaping_external_works','site_preparation_supervision','other')),
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
  UNIQUE (company_id, engagement_number),
  UNIQUE (company_id, id)
);

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

CREATE TABLE IF NOT EXISTS public.jcl_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES public.jcl_engagements(id) ON DELETE CASCADE,
  estimate_number TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','under_review','approved','rejected','superseded')),
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
  contingency_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  expected_margin_amount NUMERIC(15,2),
  assumptions TEXT,
  exclusions TEXT,
  prepared_by UUID REFERENCES public.core_parties(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES public.core_parties(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, estimate_number, version)
);

CREATE TABLE IF NOT EXISTS public.jcl_estimate_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  estimate_id UUID NOT NULL REFERENCES public.jcl_estimates(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'services' CHECK (category IN ('labour','materials','services','other')),
  description TEXT NOT NULL,
  quantity NUMERIC(15,3) NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  unit TEXT,
  unit_rate NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (unit_rate >= 0),
  line_total NUMERIC(15,2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.jcl_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  engagement_id UUID NOT NULL REFERENCES public.jcl_engagements(id) ON DELETE CASCADE,
  estimate_id UUID REFERENCES public.jcl_estimates(id) ON DELETE SET NULL,
  proposal_number TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','under_review','sent','accepted','rejected','expired','superseded')),
  scope_of_work TEXT,
  deliverables JSONB NOT NULL DEFAULT '[]'::jsonb,
  pricing JSONB NOT NULL DEFAULT '{}'::jsonb,
  payment_terms TEXT,
  proposed_timeline TEXT,
  assumptions TEXT,
  exclusions TEXT,
  valid_until DATE,
  supporting_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  prepared_by UUID REFERENCES public.core_parties(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, proposal_number, version)
);

CREATE TABLE IF NOT EXISTS public.jcl_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  contract_number TEXT NOT NULL,
  client_party_id UUID NOT NULL REFERENCES public.core_parties(id) ON DELETE RESTRICT,
  engagement_id UUID REFERENCES public.jcl_engagements(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.ops_projects(id) ON DELETE SET NULL,
  proposal_id UUID REFERENCES public.jcl_proposals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  scope_and_deliverables TEXT,
  contract_value NUMERIC(15,2),
  payment_terms TEXT,
  milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','under_review','pending_approval','pending_signature','active','completed','terminated','cancelled')),
  start_date DATE,
  end_date DATE,
  documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  signatures JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, contract_number),
  UNIQUE (company_id, id)
);

ALTER TABLE public.ops_projects
  ADD CONSTRAINT ops_projects_engagement_fk FOREIGN KEY (company_id, engagement_id) REFERENCES public.jcl_engagements(company_id, id) ON DELETE SET NULL,
  ADD CONSTRAINT ops_projects_contract_fk FOREIGN KEY (company_id, contract_id) REFERENCES public.jcl_contracts(company_id, id) ON DELETE SET NULL;

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

CREATE TABLE IF NOT EXISTS public.jcl_project_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.ops_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sequence_order INTEGER NOT NULL DEFAULT 0,
  planned_start DATE,
  planned_end DATE,
  owner_party_id UUID REFERENCES public.core_parties(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','blocked','completed','skipped')),
  completion_percentage NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
  dependencies JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.jcl_project_scope_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.ops_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  deliverables JSONB NOT NULL DEFAULT '[]'::jsonb,
  owner_party_id UUID REFERENCES public.core_parties(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','in_progress','under_review','accepted','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.jcl_project_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.ops_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  probability TEXT NOT NULL DEFAULT 'medium' CHECK (probability IN ('low','medium','high')),
  impact TEXT NOT NULL DEFAULT 'medium' CHECK (impact IN ('low','medium','high','critical')),
  mitigation TEXT,
  owner_party_id UUID REFERENCES public.core_parties(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','monitoring','mitigated','closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.jcl_project_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.ops_projects(id) ON DELETE CASCADE,
  change_number TEXT NOT NULL,
  title TEXT NOT NULL,
  reason TEXT,
  scope_impact TEXT,
  schedule_impact TEXT,
  cost_impact NUMERIC(15,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','under_review','approved','rejected','implemented','cancelled')),
  requested_by UUID REFERENCES public.core_parties(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES public.core_parties(id) ON DELETE SET NULL,
  history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, change_number)
);

CREATE INDEX IF NOT EXISTS idx_jcl_engagements_company_status ON public.jcl_engagements(company_id, status);
CREATE INDEX IF NOT EXISTS idx_jcl_engagements_client ON public.jcl_engagements(company_id, client_party_id);
CREATE INDEX IF NOT EXISTS idx_jcl_requirements_engagement ON public.jcl_engagement_requirements(company_id, engagement_id);
CREATE INDEX IF NOT EXISTS idx_jcl_estimates_engagement ON public.jcl_estimates(company_id, engagement_id);
CREATE INDEX IF NOT EXISTS idx_jcl_proposals_engagement ON public.jcl_proposals(company_id, engagement_id);
CREATE INDEX IF NOT EXISTS idx_jcl_contracts_engagement ON public.jcl_contracts(company_id, engagement_id);
CREATE INDEX IF NOT EXISTS idx_jcl_phases_project ON public.jcl_project_phases(company_id, project_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_jcl_scope_project ON public.jcl_project_scope_packages(company_id, project_id);
CREATE INDEX IF NOT EXISTS idx_jcl_risks_project ON public.jcl_project_risks(company_id, project_id, status);
CREATE INDEX IF NOT EXISTS idx_jcl_changes_project ON public.jcl_project_change_requests(company_id, project_id, status);

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['jcl_engagements','jcl_engagement_requirements','jcl_takeover_assessments','jcl_estimates','jcl_estimate_lines','jcl_proposals','jcl_contracts','jcl_project_phases','jcl_project_scope_packages','jcl_project_risks','jcl_project_change_requests'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I_tenant_isolation ON public.%I', t, t);
    EXECUTE format('CREATE POLICY %I_tenant_isolation ON public.%I FOR ALL USING (company_id = (auth.jwt() -> ''app_metadata'' ->> ''company_id'')::uuid) WITH CHECK (company_id = (auth.jwt() -> ''app_metadata'' ->> ''company_id'')::uuid)', t, t);
  END LOOP;
END $$;

INSERT INTO public.jcl_project_phase_templates (project_type, name, phases, is_system) VALUES
('new_construction','New Construction','[{"name":"Qualification & Brief","sequence":1},{"name":"Planning & Design","sequence":2},{"name":"Approvals & Mobilization","sequence":3},{"name":"Construction Delivery","sequence":4},{"name":"Handover Preparation","sequence":5}]'::jsonb,true),
('takeover_completion','Takeover / Completion','[{"name":"Condition Assessment","sequence":1},{"name":"Inherited Work Review","sequence":2},{"name":"Revised Scope & Estimate","sequence":3},{"name":"Completion Delivery","sequence":4},{"name":"Handover","sequence":5}]'::jsonb,true),
('renovation_extension','Renovation / Extension','[{"name":"Brief & Survey","sequence":1},{"name":"Design & Approvals","sequence":2},{"name":"Works Delivery","sequence":3},{"name":"Closeout","sequence":4}]'::jsonb,true),
('planning_design','Consultancy & Planning','[{"name":"Brief","sequence":1},{"name":"Investigation","sequence":2},{"name":"Design / Advice","sequence":3},{"name":"Review & Delivery","sequence":4}]'::jsonb,true),
('landscaping_external_works','Landscaping / External Works','[{"name":"Site Review","sequence":1},{"name":"Design & Estimate","sequence":2},{"name":"Works Delivery","sequence":3},{"name":"Closeout","sequence":4}]'::jsonb,true)
ON CONFLICT DO NOTHING;
