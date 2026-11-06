-- ============================================================================
-- JCL REAL ESTATE & CONSTRUCTION: MASTER CONSOLIDATED PRODUCTION MIGRATION
-- PHASES 1 - 9 COMPLETE FULL-STACK DATABASE SCHEMA
-- EXECUTE DIRECTLY IN SUPABASE SQL EDITOR
-- ============================================================================


-- >>> START OF MIGRATION: 20261105090000_jcl_front_desk_logbooks.sql <<<
-- JCL Real Estate secretary desk: visitor and staff presence registers.
CREATE TABLE IF NOT EXISTS public.jcl_visitor_logbook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  visitor_name TEXT NOT NULL,
  visitor_company TEXT,
  host_name TEXT NOT NULL,
  purpose TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'checked_in' CHECK (status IN ('checked_in', 'checked_out')),
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  checked_out_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jcl_visitor_logbook_company_time ON public.jcl_visitor_logbook(company_id, checked_in_at DESC);
ALTER TABLE public.jcl_visitor_logbook ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS jcl_visitor_logbook_company_access ON public.jcl_visitor_logbook;
CREATE POLICY jcl_visitor_logbook_company_access ON public.jcl_visitor_logbook FOR ALL TO authenticated
USING (company_id::text IN (SELECT company_id::text FROM public.profiles WHERE id = auth.uid()))
WITH CHECK (company_id::text IN (SELECT company_id::text FROM public.profiles WHERE id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.jcl_staff_logbook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  staff_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  staff_name TEXT NOT NULL,
  staff_email TEXT,
  status TEXT NOT NULL DEFAULT 'checked_in' CHECK (status IN ('checked_in', 'checked_out')),
  logged_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  logged_out_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jcl_staff_logbook_company_time ON public.jcl_staff_logbook(company_id, logged_in_at DESC);
ALTER TABLE public.jcl_staff_logbook ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS jcl_staff_logbook_company_access ON public.jcl_staff_logbook;
CREATE POLICY jcl_staff_logbook_company_access ON public.jcl_staff_logbook FOR ALL TO authenticated
USING (company_id::text IN (SELECT company_id::text FROM public.profiles WHERE id = auth.uid()))
WITH CHECK (company_id::text IN (SELECT company_id::text FROM public.profiles WHERE id = auth.uid()));

DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION powersync ADD TABLE public.jcl_visitor_logbook';
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL;
END $$;
DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION powersync ADD TABLE public.jcl_staff_logbook';
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL;
END $$;

-- >>> END OF MIGRATION: 20261105090000_jcl_front_desk_logbooks.sql <<<

-- >>> START OF MIGRATION: 20261105120000_jcl_phase1_engagements_projects.sql <<<
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

-- >>> END OF MIGRATION: 20261105120000_jcl_phase1_engagements_projects.sql <<<

-- >>> START OF MIGRATION: 20261105133000_jcl_phase1_repair_clients.sql <<<
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

-- >>> END OF MIGRATION: 20261105133000_jcl_phase1_repair_clients.sql <<<

-- >>> START OF MIGRATION: 20261106120000_jcl_phase_2_site_operations.sql <<<
-- JCL Phase 2: project and site operations
-- Apply this migration in the connected Supabase project before using /jcl/project-operations.

create table if not exists public.ops_work_packages (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid not null references public.ops_projects(id) on delete cascade, phase text, scope_package_id uuid,
  name text not null, description text, responsible_team_id uuid, supervisor_party_id uuid,
  start_date date, target_completion_date date, priority text not null default 'medium',
  status text not null default 'planned' check (status in ('planned','ready','in_progress','on_hold','completed','cancelled')),
  deliverables jsonb not null default '[]'::jsonb, completion_notes text, created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.ops_site_diary (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid not null references public.ops_projects(id) on delete cascade, entry_date date not null default current_date,
  author_id uuid, supervisor_party_id uuid, weather text, general_conditions text, work_performed text,
  workforce_present jsonb not null default '[]'::jsonb, equipment_used jsonb not null default '[]'::jsonb,
  delays text, safety_observations text, issues_blockers text, notes text, attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.ops_daily_reports (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid not null references public.ops_projects(id) on delete cascade, reporting_date date not null,
  prepared_by uuid, supervisor_party_id uuid, work_completed text, planned_activities text, actual_activities text,
  workforce_attendance jsonb not null default '[]'::jsonb, equipment_usage jsonb not null default '[]'::jsonb,
  delays text, site_issues text, safety_observations text, inspection_outcomes text, photographs jsonb not null default '[]'::jsonb,
  next_day_plan text, outstanding_actions text, status text not null default 'draft' check (status in ('draft','submitted','under_review','approved','rejected')),
  reviewed_by uuid, reviewed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(company_id, project_id, reporting_date)
);
create table if not exists public.ops_resource_allocations (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid not null references public.ops_projects(id) on delete cascade, work_package_id uuid references public.ops_work_packages(id) on delete set null,
  employee_id uuid, employee_name text, role_on_project text, phase text, start_date date, end_date date,
  planned_hours numeric(8,2) not null default 0, supervisor_party_id uuid, status text not null default 'active',
  created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.ops_project_issues (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid not null references public.ops_projects(id) on delete cascade, phase text, work_package_id uuid references public.ops_work_packages(id) on delete set null,
  issue_code text not null, title text not null, description text, category text not null default 'other', severity text not null default 'medium', priority text not null default 'medium',
  reported_by uuid, responsible_owner uuid, impact text, proposed_resolution text, due_date date, status text not null default 'open' check (status in ('open','investigating','resolved','closed')),
  resolution_notes text, closure_date date, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(company_id, issue_code)
);
create table if not exists public.ops_site_inspections (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid not null references public.ops_projects(id) on delete cascade, inspection_reference text not null, inspection_type text not null,
  inspection_date date not null, inspector_id uuid, checklist_items jsonb not null default '[]'::jsonb, observations text, result text not null default 'not_applicable' check (result in ('pass','fail','not_applicable')),
  attachments jsonb not null default '[]'::jsonb, issue_id uuid references public.ops_project_issues(id) on delete set null, corrective_task_id uuid references public.ops_project_tasks(id) on delete set null,
  review_status text not null default 'draft', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(company_id, inspection_reference)
);
create table if not exists public.ops_project_activity (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid not null references public.ops_projects(id) on delete cascade, actor_id uuid, action text not null, record_type text not null, record_id uuid, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

create index if not exists idx_ops_work_packages_project on public.ops_work_packages(company_id, project_id, status);
create index if not exists idx_ops_site_diary_project on public.ops_site_diary(company_id, project_id, entry_date desc);
create index if not exists idx_ops_daily_reports_project on public.ops_daily_reports(company_id, project_id, reporting_date desc);
create index if not exists idx_ops_allocations_project on public.ops_resource_allocations(company_id, project_id, status);
create index if not exists idx_ops_project_issues_project on public.ops_project_issues(company_id, project_id, status);
create index if not exists idx_ops_inspections_project on public.ops_site_inspections(company_id, project_id, inspection_date desc);
create index if not exists idx_ops_activity_project on public.ops_project_activity(company_id, project_id, created_at desc);

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['ops_work_packages','ops_site_diary','ops_daily_reports','ops_resource_allocations','ops_project_issues','ops_site_inspections','ops_project_activity'] LOOP
    EXECUTE format('alter table public.%I enable row level security', t);
    EXECUTE format('drop policy if exists %I on public.%I', t || '_tenant_isolation', t);
    EXECUTE format('create policy %I on public.%I for all using (company_id = (auth.jwt() -> ''app_metadata'' ->> ''company_id'')::uuid) with check (company_id = (auth.jwt() -> ''app_metadata'' ->> ''company_id'')::uuid)', t || '_tenant_isolation', t);
  END LOOP;
END $$;

-- >>> END OF MIGRATION: 20261106120000_jcl_phase_2_site_operations.sql <<<

-- >>> START OF MIGRATION: 20261106120000_jcl_phase3_procurement_materials.sql <<<
-- JCL Phase 3: Procurement, receiving and construction materials
-- Run this complete migration in Supabase SQL Editor before using the module.

create table if not exists public.jcl_materials (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  reference text not null, name text not null, category text, description text, specification text, unit text not null,
  preferred_supplier_id uuid references public.core_parties(id) on delete set null, minimum_stock numeric(14,3) not null default 0 check (minimum_stock >= 0),
  reorder_level numeric(14,3) not null default 0 check (reorder_level >= 0), status text not null default 'active' check (status in ('active','inactive','discontinued')),
  created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(company_id, reference)
);
create table if not exists public.jcl_storage_locations (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  reference text not null, name text not null, location_type text not null default 'warehouse' check (location_type in ('warehouse','store','project_site','transit')),
  project_id uuid references public.ops_projects(id) on delete set null, address text, responsible_party_id uuid references public.core_parties(id) on delete set null,
  status text not null default 'active' check (status in ('active','inactive')), notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(company_id, reference)
);
create table if not exists public.jcl_purchase_requisitions (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  reference text not null, project_id uuid not null references public.ops_projects(id) on delete restrict, phase_id uuid, work_package_id uuid,
  department text, requested_by uuid, required_date date, priority text not null default 'normal' check (priority in ('normal','high','urgent')),
  description text not null, justification text, status text not null default 'draft' check (status in ('draft','submitted','under_review','approved','rejected','partially_ordered','fully_ordered','cancelled')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(company_id, reference)
);
create table if not exists public.jcl_purchase_orders (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  reference text not null, supplier_id uuid references public.core_parties(id) on delete set null, supplier_name text, project_id uuid not null references public.ops_projects(id) on delete restrict,
  requisition_id uuid references public.jcl_purchase_requisitions(id) on delete set null, quotation_id uuid, order_date date not null default current_date, expected_delivery_date date,
  delivery_location_id uuid references public.jcl_storage_locations(id) on delete set null, total_amount numeric(15,2) not null default 0 check (total_amount >= 0), status text not null default 'draft' check (status in ('draft','pending_approval','approved','issued','acknowledged','partially_delivered','fully_delivered','closed','cancelled')),
  approved_by uuid, approved_at timestamptz, issued_at timestamptz, notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(company_id, reference)
);
create table if not exists public.jcl_goods_receipts (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  reference text not null, purchase_order_id uuid not null references public.jcl_purchase_orders(id) on delete restrict, supplier_id uuid references public.core_parties(id) on delete set null,
  project_id uuid not null references public.ops_projects(id) on delete restrict, received_at timestamptz not null default now(), received_by uuid, delivery_note_reference text,
  status text not null default 'received' check (status in ('received','inspected','accepted','disputed','closed')), inspection_notes text, created_at timestamptz not null default now(), unique(company_id, reference)
);
create table if not exists public.jcl_inventory_balances (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  material_id uuid not null references public.jcl_materials(id) on delete restrict, location_id uuid not null references public.jcl_storage_locations(id) on delete restrict,
  available_quantity numeric(14,3) not null default 0 check (available_quantity >= 0), reserved_quantity numeric(14,3) not null default 0 check (reserved_quantity >= 0), allocated_quantity numeric(14,3) not null default 0 check (allocated_quantity >= 0), consumed_quantity numeric(14,3) not null default 0 check (consumed_quantity >= 0), damaged_quantity numeric(14,3) not null default 0 check (damaged_quantity >= 0), returned_quantity numeric(14,3) not null default 0 check (returned_quantity >= 0), updated_at timestamptz not null default now(), unique(company_id, material_id, location_id)
);
create table if not exists public.jcl_inventory_movements (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  reference text not null, movement_type text not null check (movement_type in ('goods_received','stock_adjustment','transfer','project_allocation','material_issue','material_consumption','material_return','damaged_stock','stock_correction')),
  material_id uuid not null references public.jcl_materials(id) on delete restrict, quantity numeric(14,3) not null check (quantity > 0), source_location_id uuid references public.jcl_storage_locations(id) on delete restrict, destination_location_id uuid references public.jcl_storage_locations(id) on delete restrict,
  project_id uuid references public.ops_projects(id) on delete set null, work_package_id uuid, purchase_order_id uuid references public.jcl_purchase_orders(id) on delete set null, goods_receipt_id uuid references public.jcl_goods_receipts(id) on delete set null, responsible_party_id uuid references public.core_parties(id) on delete set null, reason text, notes text, created_at timestamptz not null default now(), unique(company_id, reference)
);
create index if not exists idx_jcl_req_company_status on public.jcl_purchase_requisitions(company_id, status, created_at desc);
create index if not exists idx_jcl_po_company_status on public.jcl_purchase_orders(company_id, status, created_at desc);
create index if not exists idx_jcl_receipts_company_po on public.jcl_goods_receipts(company_id, purchase_order_id);
create index if not exists idx_jcl_inventory_company_material on public.jcl_inventory_balances(company_id, material_id);
create index if not exists idx_jcl_movements_company_material on public.jcl_inventory_movements(company_id, material_id, created_at desc);

alter table public.jcl_materials enable row level security;
alter table public.jcl_storage_locations enable row level security;
alter table public.jcl_purchase_requisitions enable row level security;
alter table public.jcl_purchase_orders enable row level security;
alter table public.jcl_goods_receipts enable row level security;
alter table public.jcl_inventory_balances enable row level security;
alter table public.jcl_inventory_movements enable row level security;

do $$ declare t text; begin foreach t in array array['jcl_materials','jcl_storage_locations','jcl_purchase_requisitions','jcl_purchase_orders','jcl_goods_receipts','jcl_inventory_balances','jcl_inventory_movements'] loop execute format('drop policy if exists %I_tenant_isolation on public.%I', t, t); execute format('create policy %I_tenant_isolation on public.%I for all using (company_id = (auth.jwt() -> ''app_metadata'' ->> ''company_id'')::uuid) with check (company_id = (auth.jwt() -> ''app_metadata'' ->> ''company_id'')::uuid)', t, t); end loop; end $$;

-- Inventory movements are append-only for authenticated users; corrections use a new movement.
revoke update, delete on public.jcl_inventory_movements from authenticated;

-- >>> END OF MIGRATION: 20261106120000_jcl_phase3_procurement_materials.sql <<<

-- >>> START OF MIGRATION: 20261106120000_jcl_phase5_commercial_finance.sql <<<
-- JCL Phase 5: Commercial, Project Finance and Financial Control
-- Run after the Phase 1-4 JCL migrations and procurement migrations.
-- This migration is additive and preserves existing accounting records.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.jcl_project_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.ops_projects(id) ON DELETE CASCADE,
  budget_reference text NOT NULL,
  title text NOT NULL,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  currency text NOT NULL DEFAULT 'GHS' CHECK (length(currency) = 3),
  preparation_date date NOT NULL DEFAULT current_date,
  prepared_by uuid,
  review_status text NOT NULL DEFAULT 'draft' CHECK (review_status IN ('draft','under_review','reviewed','returned')),
  approval_status text NOT NULL DEFAULT 'draft' CHECK (approval_status IN ('draft','pending_approval','approved','rejected','superseded')),
  effective_date date,
  notes text,
  supporting_documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, project_id, budget_reference, version)
);

CREATE TABLE IF NOT EXISTS public.jcl_project_budget_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  budget_id uuid NOT NULL REFERENCES public.jcl_project_budgets(id) ON DELETE CASCADE,
  phase_id uuid,
  work_package_id uuid,
  cost_code text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('labour','materials','equipment','subcontractors','engineering','transportation','site_preparation','construction','professional_services','permits','contingency','other')),
  quantity numeric(18,4) NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  unit_of_measure text,
  unit_rate numeric(18,2) NOT NULL DEFAULT 0 CHECK (unit_rate >= 0),
  total_amount numeric(18,2) GENERATED ALWAYS AS (round(quantity * unit_rate, 2)) STORED,
  department text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.jcl_project_cost_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.ops_projects(id) ON DELETE CASCADE,
  phase_id uuid,
  work_package_id uuid,
  cost_code text,
  category text NOT NULL,
  supplier_id uuid,
  source_type text NOT NULL CHECK (source_type IN ('supplier_bill','expense','payment','journal','goods_receipt','other')),
  source_id uuid NOT NULL,
  source_reference text,
  status text NOT NULL DEFAULT 'posted' CHECK (status IN ('invoiced','posted','paid','reversed')),
  amount numeric(18,2) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'GHS' CHECK (length(currency) = 3),
  transaction_date date NOT NULL DEFAULT current_date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, source_type, source_id, project_id)
);

CREATE TABLE IF NOT EXISTS public.jcl_project_variations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.ops_projects(id) ON DELETE CASCADE,
  contract_id uuid,
  phase_id uuid,
  variation_reference text NOT NULL,
  title text NOT NULL,
  description text,
  reason text,
  variation_type text NOT NULL CHECK (variation_type IN ('additional_work','scope_reduction','design_change','specification_change','site_condition','client_request','regulatory','other')),
  requested_by uuid,
  request_date date NOT NULL DEFAULT current_date,
  original_contract_value numeric(18,2) NOT NULL DEFAULT 0 CHECK (original_contract_value >= 0),
  proposed_value_adjustment numeric(18,2) NOT NULL DEFAULT 0,
  cost_impact numeric(18,2) NOT NULL DEFAULT 0,
  schedule_impact_days integer NOT NULL DEFAULT 0 CHECK (schedule_impact_days >= 0),
  approval_status text NOT NULL DEFAULT 'draft' CHECK (approval_status IN ('draft','submitted','under_review','approved_internally','pending_client_approval','accepted','rejected','cancelled')),
  client_acceptance_status text NOT NULL DEFAULT 'not_required' CHECK (client_acceptance_status IN ('not_required','pending','accepted','rejected')),
  effective_date date,
  supporting_documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  review_comments text,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, project_id, variation_reference)
);

CREATE TABLE IF NOT EXISTS public.jcl_progress_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.ops_projects(id) ON DELETE CASCADE,
  client_id uuid,
  contract_id uuid,
  claim_reference text NOT NULL,
  claim_period_start date,
  claim_period_end date,
  claim_date date NOT NULL DEFAULT current_date,
  submission_date date,
  description text,
  previous_certified_amount numeric(18,2) NOT NULL DEFAULT 0 CHECK (previous_certified_amount >= 0),
  current_claim_amount numeric(18,2) NOT NULL DEFAULT 0 CHECK (current_claim_amount >= 0),
  cumulative_claimed_amount numeric(18,2) NOT NULL DEFAULT 0 CHECK (cumulative_claimed_amount >= 0),
  approved_amount numeric(18,2) NOT NULL DEFAULT 0 CHECK (approved_amount >= 0),
  retention_amount numeric(18,2) NOT NULL DEFAULT 0 CHECK (retention_amount >= 0),
  other_deductions numeric(18,2) NOT NULL DEFAULT 0 CHECK (other_deductions >= 0),
  tax_amount numeric(18,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  net_amount_due numeric(18,2) GENERATED ALWAYS AS (round(approved_amount - retention_amount - other_deductions + tax_amount, 2)) STORED,
  approval_status text NOT NULL DEFAULT 'draft' CHECK (approval_status IN ('draft','submitted','under_review','approved','partially_certified','rejected','invoiced','partially_paid','paid')),
  payment_status text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','partially_paid','paid')),
  invoice_reference text,
  invoice_date date,
  due_date date,
  amount_paid numeric(18,2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  client_response text,
  supporting_documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  reviewed_by uuid,
  certified_at timestamptz,
  review_comments text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, project_id, claim_reference)
);

CREATE TABLE IF NOT EXISTS public.jcl_retention_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.ops_projects(id) ON DELETE CASCADE,
  contract_id uuid,
  claim_id uuid REFERENCES public.jcl_progress_claims(id) ON DELETE SET NULL,
  counterparty_id uuid,
  counterparty_type text NOT NULL CHECK (counterparty_type IN ('client','supplier','subcontractor')),
  retention_type text NOT NULL CHECK (retention_type IN ('client_claim','supplier_payment','subcontractor_payment')),
  applicable_percentage numeric(7,4) CHECK (applicable_percentage >= 0 AND applicable_percentage <= 100),
  retention_basis numeric(18,2) NOT NULL DEFAULT 0 CHECK (retention_basis >= 0),
  retained_amount numeric(18,2) NOT NULL DEFAULT 0 CHECK (retained_amount >= 0),
  cumulative_retained_amount numeric(18,2) NOT NULL DEFAULT 0 CHECK (cumulative_retained_amount >= 0),
  released_amount numeric(18,2) NOT NULL DEFAULT 0 CHECK (released_amount >= 0),
  release_conditions text,
  expected_release_date date,
  actual_release_date date,
  status text NOT NULL DEFAULT 'held' CHECK (status IN ('held','partially_released','released','disputed')),
  supporting_documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.jcl_project_forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.ops_projects(id) ON DELETE CASCADE,
  forecast_date date NOT NULL DEFAULT current_date,
  approved_budget numeric(18,2) NOT NULL DEFAULT 0 CHECK (approved_budget >= 0),
  actual_cost numeric(18,2) NOT NULL DEFAULT 0 CHECK (actual_cost >= 0),
  outstanding_commitments numeric(18,2) NOT NULL DEFAULT 0 CHECK (outstanding_commitments >= 0),
  estimated_uncommitted_cost numeric(18,2) NOT NULL DEFAULT 0 CHECK (estimated_uncommitted_cost >= 0),
  approved_variations numeric(18,2) NOT NULL DEFAULT 0,
  pending_variations numeric(18,2) NOT NULL DEFAULT 0,
  forecast_final_cost numeric(18,2) GENERATED ALWAYS AS (round(actual_cost + outstanding_commitments + estimated_uncommitted_cost, 2)) STORED,
  forecast_budget_variance numeric(18,2) GENERATED ALWAYS AS (round(approved_budget - (actual_cost + outstanding_commitments + estimated_uncommitted_cost), 2)) STORED,
  assumptions text,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, project_id, forecast_date)
);

CREATE INDEX IF NOT EXISTS idx_jcl_budgets_project ON public.jcl_project_budgets(company_id, project_id);
CREATE INDEX IF NOT EXISTS idx_jcl_budget_lines_budget ON public.jcl_project_budget_lines(company_id, budget_id);
CREATE INDEX IF NOT EXISTS idx_jcl_cost_entries_project ON public.jcl_project_cost_entries(company_id, project_id, status);
CREATE INDEX IF NOT EXISTS idx_jcl_variations_project ON public.jcl_project_variations(company_id, project_id, approval_status);
CREATE INDEX IF NOT EXISTS idx_jcl_claims_project ON public.jcl_progress_claims(company_id, project_id, approval_status);
CREATE INDEX IF NOT EXISTS idx_jcl_retention_project ON public.jcl_retention_records(company_id, project_id, status);
CREATE INDEX IF NOT EXISTS idx_jcl_forecasts_project ON public.jcl_project_forecasts(company_id, project_id, forecast_date DESC);

CREATE OR REPLACE FUNCTION public.jcl_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['jcl_project_budgets','jcl_project_variations','jcl_progress_claims','jcl_retention_records','jcl_project_forecasts'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I_updated_at ON public.%I', table_name, table_name);
    EXECUTE format('CREATE TRIGGER %I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.jcl_set_updated_at()', table_name, table_name);
  END LOOP;
END $$;

CREATE OR REPLACE VIEW public.jcl_project_finance_summary
WITH (security_invoker = true) AS
SELECT
  p.id AS project_id,
  p.company_id,
  p.project_code,
  p.name AS project_name,
  COALESCE(b.approved_budget, 0) AS approved_budget,
  COALESCE(c.actual_cost, 0) AS actual_cost,
  COALESCE(c.committed_cost, 0) AS committed_cost,
  COALESCE(v.approved_variations, 0) AS approved_variations,
  COALESCE(v.pending_variations, 0) AS pending_variations,
  COALESCE(cl.submitted_claims, 0) AS submitted_claims,
  COALESCE(cl.certified_claims, 0) AS certified_claims,
  COALESCE(r.retention_balance, 0) AS retention_balance,
  COALESCE(c.actual_cost, 0) + COALESCE(c.committed_cost, 0) AS forecast_final_cost,
  COALESCE(b.approved_budget, 0) - (COALESCE(c.actual_cost, 0) + COALESCE(c.committed_cost, 0)) AS forecast_variance
FROM public.ops_projects p
LEFT JOIN LATERAL (
  SELECT COALESCE(SUM(l.total_amount), 0) AS approved_budget
  FROM public.jcl_project_budgets b0
  JOIN public.jcl_project_budget_lines l ON l.budget_id = b0.id
  WHERE b0.project_id = p.id AND b0.company_id = p.company_id AND b0.approval_status = 'approved'
) b ON true
LEFT JOIN LATERAL (
  SELECT
    COALESCE(SUM(amount) FILTER (WHERE status IN ('posted','paid')), 0) AS actual_cost,
    COALESCE(SUM(amount) FILTER (WHERE status = 'invoiced'), 0) AS committed_cost
  FROM public.jcl_project_cost_entries ce
  WHERE ce.project_id = p.id AND ce.company_id = p.company_id
) c ON true
LEFT JOIN LATERAL (
  SELECT
    COALESCE(SUM(proposed_value_adjustment) FILTER (WHERE approval_status IN ('approved_internally','accepted')), 0) AS approved_variations,
    COALESCE(SUM(proposed_value_adjustment) FILTER (WHERE approval_status IN ('submitted','under_review','pending_client_approval')), 0) AS pending_variations
  FROM public.jcl_project_variations v0
  WHERE v0.project_id = p.id AND v0.company_id = p.company_id
) v ON true
LEFT JOIN LATERAL (
  SELECT
    COALESCE(SUM(current_claim_amount), 0) AS submitted_claims,
    COALESCE(SUM(approved_amount), 0) AS certified_claims
  FROM public.jcl_progress_claims cl0
  WHERE cl0.project_id = p.id AND cl0.company_id = p.company_id
) cl ON true
LEFT JOIN LATERAL (
  SELECT COALESCE(SUM(retained_amount - released_amount), 0) AS retention_balance
  FROM public.jcl_retention_records r0
  WHERE r0.project_id = p.id AND r0.company_id = p.company_id
) r ON true;

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['jcl_project_budgets','jcl_project_budget_lines','jcl_project_cost_entries','jcl_project_variations','jcl_progress_claims','jcl_retention_records','jcl_project_forecasts'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I_company_access ON public.%I', table_name, table_name);
    EXECUTE format('CREATE POLICY %I_company_access ON public.%I FOR ALL USING (company_id = (auth.jwt() -> ''app_metadata'' ->> ''company_id'')::uuid) WITH CHECK (company_id = (auth.jwt() -> ''app_metadata'' ->> ''company_id'')::uuid)', table_name, table_name);
  END LOOP;
END $$;

GRANT SELECT ON public.jcl_project_finance_summary TO authenticated;
NOTIFY pgrst, 'reload schema';

-- >>> END OF MIGRATION: 20261106120000_jcl_phase5_commercial_finance.sql <<<

-- >>> START OF MIGRATION: 20261106130000_jcl_attachments.sql <<<
create table if not exists public.ops_project_attachments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  project_id uuid not null references public.ops_projects(id) on delete cascade,
  record_type text not null default 'project',
  record_id uuid,
  filename text not null,
  pathname text not null unique,
  content_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 26214400),
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists ops_project_attachments_project_idx on public.ops_project_attachments(company_id, project_id, created_at desc);
alter table public.ops_project_attachments enable row level security;
drop policy if exists ops_project_attachments_select on public.ops_project_attachments;
drop policy if exists ops_project_attachments_insert on public.ops_project_attachments;
drop policy if exists ops_project_attachments_delete on public.ops_project_attachments;
create policy ops_project_attachments_select on public.ops_project_attachments for select using (company_id::text = (select company_id from public.profiles where id = auth.uid()));
create policy ops_project_attachments_insert on public.ops_project_attachments for insert with check (company_id::text = (select company_id from public.profiles where id = auth.uid()) and uploaded_by = auth.uid());
create policy ops_project_attachments_delete on public.ops_project_attachments for delete using (company_id::text = (select company_id from public.profiles where id = auth.uid()) and uploaded_by = auth.uid());

-- >>> END OF MIGRATION: 20261106130000_jcl_attachments.sql <<<

-- >>> START OF MIGRATION: 20261106140000_jcl_phase_7_collaboration.sql <<<
-- JCL Phase 7: project collaboration, risks, milestones, members and audit-ready activity.
-- Apply this migration in Supabase before opening the Project workspace.
create extension if not exists pgcrypto;

create table if not exists public.ops_project_members (
  id uuid primary key default gen_random_uuid(),
  company_id text not null,
  project_id uuid not null references public.ops_projects(id) on delete cascade,
  user_id uuid not null,
  display_name text,
  role text not null default 'member' check (role in ('owner','manager','member','viewer')),
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique(project_id, user_id)
);

create table if not exists public.ops_project_messages (
  id uuid primary key default gen_random_uuid(),
  company_id text not null,
  project_id uuid not null references public.ops_projects(id) on delete cascade,
  author_id uuid,
  body text not null check (char_length(trim(body)) between 1 and 10000),
  message_type text not null default 'message' check (message_type in ('message','decision','announcement','system')),
  parent_message_id uuid references public.ops_project_messages(id) on delete set null,
  edited_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.ops_project_message_reactions (
  id uuid primary key default gen_random_uuid(),
  company_id text not null,
  message_id uuid not null references public.ops_project_messages(id) on delete cascade,
  user_id uuid not null,
  reaction text not null check (reaction in ('like','acknowledged','question','important')),
  created_at timestamptz not null default now(),
  unique(message_id, user_id, reaction)
);

create table if not exists public.ops_project_message_mentions (
  id uuid primary key default gen_random_uuid(),
  company_id text not null,
  message_id uuid not null references public.ops_project_messages(id) on delete cascade,
  mentioned_user_id uuid not null,
  created_at timestamptz not null default now(),
  unique(message_id, mentioned_user_id)
);

create table if not exists public.ops_project_risks (
  id uuid primary key default gen_random_uuid(),
  company_id text not null,
  project_id uuid not null references public.ops_projects(id) on delete cascade,
  title text not null,
  description text,
  mitigation text,
  owner_id uuid,
  owner_name text,
  severity text not null default 'medium' check (severity in ('low','medium','high','critical')),
  status text not null default 'open' check (status in ('open','monitoring','resolved','closed')),
  due_date date,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ops_project_milestones (
  id uuid primary key default gen_random_uuid(),
  company_id text not null,
  project_id uuid not null references public.ops_projects(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'planned' check (status in ('planned','in_progress','completed','delayed')),
  due_date date,
  owner_id uuid,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ops_project_members_project_idx on public.ops_project_members(company_id, project_id);
create index if not exists ops_project_messages_project_idx on public.ops_project_messages(company_id, project_id, created_at desc);
create index if not exists ops_project_risks_project_idx on public.ops_project_risks(company_id, project_id, status);
create index if not exists ops_project_milestones_project_idx on public.ops_project_milestones(company_id, project_id, due_date);

alter table public.ops_project_members enable row level security;
alter table public.ops_project_messages enable row level security;
alter table public.ops_project_message_reactions enable row level security;
alter table public.ops_project_message_mentions enable row level security;
alter table public.ops_project_risks enable row level security;
alter table public.ops_project_milestones enable row level security;

-- Replace the company membership predicate with the firm's existing access helper if its name differs.
create policy ops_project_members_company_access on public.ops_project_members for all using (company_id::text = (select company_id from public.profiles where id = auth.uid())) with check (company_id::text = (select company_id from public.profiles where id = auth.uid()));
create policy ops_project_messages_company_access on public.ops_project_messages for all using (company_id::text = (select company_id from public.profiles where id = auth.uid())) with check (company_id::text = (select company_id from public.profiles where id = auth.uid()));
create policy ops_project_message_reactions_company_access on public.ops_project_message_reactions for all using (company_id::text = (select company_id from public.profiles where id = auth.uid())) with check (company_id::text = (select company_id from public.profiles where id = auth.uid()));
create policy ops_project_message_mentions_company_access on public.ops_project_message_mentions for all using (company_id::text = (select company_id from public.profiles where id = auth.uid())) with check (company_id::text = (select company_id from public.profiles where id = auth.uid()));
create policy ops_project_risks_company_access on public.ops_project_risks for all using (company_id::text = (select company_id from public.profiles where id = auth.uid())) with check (company_id::text = (select company_id from public.profiles where id = auth.uid()));
create policy ops_project_milestones_company_access on public.ops_project_milestones for all using (company_id::text = (select company_id from public.profiles where id = auth.uid())) with check (company_id::text = (select company_id from public.profiles where id = auth.uid()));

alter publication supabase_realtime add table public.ops_project_messages;
alter publication supabase_realtime add table public.ops_project_risks;

-- >>> END OF MIGRATION: 20261106140000_jcl_phase_7_collaboration.sql <<<

-- >>> START OF MIGRATION: 20261106150000_jcl_phase_8_intelligence_reporting.sql <<<
-- JCL Phase 8: intelligence, reporting, KPI targets and business alerts
-- Apply in Supabase SQL Editor before using /jcl/intelligence.

create table if not exists public.jcl_report_definitions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  category text not null check (category in ('projects','financial','procurement','engineering','operations','workforce','quality','handover','partner','client','property')),
  source_key text not null,
  filters jsonb not null default '{}'::jsonb,
  columns jsonb not null default '[]'::jsonb,
  grouping jsonb not null default '[]'::jsonb,
  created_by uuid,
  is_shared boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jcl_report_schedules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  report_definition_id uuid not null references public.jcl_report_definitions(id) on delete cascade,
  frequency text not null check (frequency in ('daily','weekly','monthly','quarterly','custom')),
  recipient_user_ids uuid[] not null default '{}',
  delivery_method text not null check (delivery_method in ('in_app','email')),
  format text not null check (format in ('csv','xlsx','pdf')),
  timezone text not null default 'UTC',
  start_date date not null,
  end_date date,
  next_run_at timestamptz,
  is_active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jcl_report_executions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  report_definition_id uuid references public.jcl_report_definitions(id) on delete set null,
  schedule_id uuid references public.jcl_report_schedules(id) on delete set null,
  status text not null default 'queued' check (status in ('queued','running','completed','failed')),
  format text,
  row_count integer not null default 0,
  generated_at timestamptz,
  delivered_at timestamptz,
  failure_reason text,
  storage_path text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.jcl_kpi_definitions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  description text,
  department text not null,
  measurement_unit text not null,
  calculation_method text not null,
  target_value numeric not null,
  reporting_frequency text not null check (reporting_frequency in ('daily','weekly','monthly','quarterly','annual')),
  owner_id uuid,
  effective_date date not null,
  is_active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jcl_kpi_target_history (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  kpi_id uuid not null references public.jcl_kpi_definitions(id) on delete cascade,
  previous_target numeric,
  new_target numeric not null,
  effective_date date not null,
  changed_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.jcl_bi_alert_rules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  department text not null,
  metric_key text not null,
  operator text not null check (operator in ('gt','gte','lt','lte','eq')),
  threshold numeric not null,
  severity text not null default 'medium' check (severity in ('low','medium','high','critical')),
  responsible_user_id uuid,
  is_active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jcl_bi_alerts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  rule_id uuid references public.jcl_bi_alert_rules(id) on delete set null,
  title text not null,
  description text,
  department text not null,
  severity text not null check (severity in ('low','medium','high','critical')),
  source_table text,
  source_record_id uuid,
  responsible_user_id uuid,
  status text not null default 'open' check (status in ('open','acknowledged','resolved')),
  acknowledged_by uuid,
  acknowledged_at timestamptz,
  resolution_notes text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists jcl_report_definitions_company_idx on public.jcl_report_definitions(company_id, created_at desc);
create index if not exists jcl_report_schedules_due_idx on public.jcl_report_schedules(company_id, is_active, next_run_at);
create index if not exists jcl_report_executions_company_idx on public.jcl_report_executions(company_id, created_at desc);
create index if not exists jcl_kpi_definitions_company_idx on public.jcl_kpi_definitions(company_id, is_active, department);
create index if not exists jcl_kpi_history_idx on public.jcl_kpi_target_history(company_id, kpi_id, effective_date desc);
create index if not exists jcl_alert_rules_company_idx on public.jcl_bi_alert_rules(company_id, is_active, department);
create index if not exists jcl_alerts_company_idx on public.jcl_bi_alerts(company_id, status, severity, created_at desc);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'jcl_report_definitions','jcl_report_schedules','jcl_report_executions',
    'jcl_kpi_definitions','jcl_kpi_target_history','jcl_bi_alert_rules','jcl_bi_alerts'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I_tenant_isolation on public.%I', table_name, table_name);
    execute format(
      'create policy %I_tenant_isolation on public.%I for all using (company_id = (auth.jwt() -> ''app_metadata'' ->> ''company_id'')::uuid) with check (company_id = (auth.jwt() -> ''app_metadata'' ->> ''company_id'')::uuid)',
      table_name, table_name
    );
  end loop;
end $$;

-- >>> END OF MIGRATION: 20261106150000_jcl_phase_8_intelligence_reporting.sql <<<

-- >>> START OF MIGRATION: 20261106160000_jcl_real_estate_production_backend_complete.sql <<<
-- Migration: 20261106160000_jcl_real_estate_production_backend_complete.sql
-- Description: Complete backend database schema, missing tables, missing columns, indexes, and RLS for all JCL Real Estate features.

-- 1. Create univ_re_esignatures (dual-named table for E-Signatures)
CREATE TABLE IF NOT EXISTS public.univ_re_esignatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    document_title TEXT NOT NULL,
    signer_name TEXT NOT NULL,
    signer_email TEXT NOT NULL,
    signer_role TEXT DEFAULT 'Client',
    status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'sent', 'viewed', 'signed', 'declined', 'expired')),
    sent_date TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    signed_date TIMESTAMPTZ,
    audit_hash TEXT,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_univ_re_esignatures_company ON public.univ_re_esignatures(company_id);
ALTER TABLE public.univ_re_esignatures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "jcl_re_esignatures_company_all" ON public.univ_re_esignatures;
CREATE POLICY "jcl_re_esignatures_company_all" ON public.univ_re_esignatures
    FOR ALL USING (company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid)
    WITH CHECK (company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid);

-- 2. Create univ_re_maintenance table
CREATE TABLE IF NOT EXISTS public.univ_re_maintenance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    lease_id UUID,
    property_id UUID,
    title TEXT NOT NULL,
    issue_type TEXT DEFAULT 'general',
    description TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'scheduled', 'resolved', 'closed', 'cancelled')),
    contractor_id UUID,
    cost NUMERIC DEFAULT 0,
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_univ_re_maintenance_company ON public.univ_re_maintenance(company_id);
ALTER TABLE public.univ_re_maintenance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "jcl_re_maintenance_company_all" ON public.univ_re_maintenance;
CREATE POLICY "jcl_re_maintenance_company_all" ON public.univ_re_maintenance
    FOR ALL USING (company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid)
    WITH CHECK (company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid);

-- 3. Add missing columns to univ_re_commissions
ALTER TABLE public.univ_re_commissions ADD COLUMN IF NOT EXISTS property_address TEXT;
ALTER TABLE public.univ_re_commissions ADD COLUMN IF NOT EXISTS sale_price NUMERIC DEFAULT 0;
ALTER TABLE public.univ_re_commissions ADD COLUMN IF NOT EXISTS brokerage_split_rate NUMERIC DEFAULT 0;
ALTER TABLE public.univ_re_commissions ADD COLUMN IF NOT EXISTS agent_payout_amount NUMERIC DEFAULT 0;
ALTER TABLE public.univ_re_commissions ADD COLUMN IF NOT EXISTS notes TEXT;

-- 4. Add missing columns to univ_re_counter_offers
ALTER TABLE public.univ_re_counter_offers ADD COLUMN IF NOT EXISTS property_address TEXT;
ALTER TABLE public.univ_re_counter_offers ADD COLUMN IF NOT EXISTS buyer_name TEXT;
ALTER TABLE public.univ_re_counter_offers ADD COLUMN IF NOT EXISTS original_price NUMERIC DEFAULT 0;
ALTER TABLE public.univ_re_counter_offers ADD COLUMN IF NOT EXISTS counter_price NUMERIC DEFAULT 0;
ALTER TABLE public.univ_re_counter_offers ADD COLUMN IF NOT EXISTS earnest_money NUMERIC DEFAULT 0;
ALTER TABLE public.univ_re_counter_offers ADD COLUMN IF NOT EXISTS expiration_date TIMESTAMPTZ;
ALTER TABLE public.univ_re_counter_offers ADD COLUMN IF NOT EXISTS contingencies TEXT;
ALTER TABLE public.univ_re_counter_offers ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.univ_re_counter_offers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- 5. Add missing columns to univ_re_contractor_reviews
ALTER TABLE public.univ_re_contractor_reviews ADD COLUMN IF NOT EXISTS contractor_name TEXT;
ALTER TABLE public.univ_re_contractor_reviews ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 5;
ALTER TABLE public.univ_re_contractor_reviews ADD COLUMN IF NOT EXISTS review_text TEXT;
ALTER TABLE public.univ_re_contractor_reviews ADD COLUMN IF NOT EXISTS reviewer_name TEXT;

-- 6. Add missing columns to univ_re_contractors
ALTER TABLE public.univ_re_contractors ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.univ_re_contractors ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.univ_re_contractors ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 5;

-- 7. Add missing columns to univ_re_escrow_accounts
ALTER TABLE public.univ_re_escrow_accounts ADD COLUMN IF NOT EXISTS buyer_name TEXT;
ALTER TABLE public.univ_re_escrow_accounts ADD COLUMN IF NOT EXISTS seller_name TEXT;
ALTER TABLE public.univ_re_escrow_accounts ADD COLUMN IF NOT EXISTS property_address TEXT;
ALTER TABLE public.univ_re_escrow_accounts ADD COLUMN IF NOT EXISTS escrow_agent_company TEXT;
ALTER TABLE public.univ_re_escrow_accounts ADD COLUMN IF NOT EXISTS release_status TEXT DEFAULT 'held';
ALTER TABLE public.univ_re_escrow_accounts ADD COLUMN IF NOT EXISTS release_conditions TEXT;

-- 8. Add missing columns to univ_re_lease_renewals
ALTER TABLE public.univ_re_lease_renewals ADD COLUMN IF NOT EXISTS tenant_name TEXT;
ALTER TABLE public.univ_re_lease_renewals ADD COLUMN IF NOT EXISTS property_address TEXT;
ALTER TABLE public.univ_re_lease_renewals ADD COLUMN IF NOT EXISTS current_rent NUMERIC DEFAULT 0;
ALTER TABLE public.univ_re_lease_renewals ADD COLUMN IF NOT EXISTS proposed_rent NUMERIC DEFAULT 0;
ALTER TABLE public.univ_re_lease_renewals ADD COLUMN IF NOT EXISTS expiration_date TIMESTAMPTZ;
ALTER TABLE public.univ_re_lease_renewals ADD COLUMN IF NOT EXISTS new_term_months INTEGER DEFAULT 12;
ALTER TABLE public.univ_re_lease_renewals ADD COLUMN IF NOT EXISTS notes TEXT;

-- 9. Add missing columns to univ_re_leases and univ_re_offers
ALTER TABLE public.univ_re_leases ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.univ_re_offers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 10. Add missing columns to univ_re_rent_payments
ALTER TABLE public.univ_re_rent_payments ADD COLUMN IF NOT EXISTS property_address TEXT;
ALTER TABLE public.univ_re_rent_payments ADD COLUMN IF NOT EXISTS tenant_name TEXT;

-- 11. Add missing columns to univ_re_trust_accounts and univ_re_trust_ledger
ALTER TABLE public.univ_re_trust_accounts ADD COLUMN IF NOT EXISTS routing_number TEXT;
ALTER TABLE public.univ_re_trust_accounts ADD COLUMN IF NOT EXISTS account_holder_name TEXT;
ALTER TABLE public.univ_re_trust_accounts ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

ALTER TABLE public.univ_re_trust_ledger ADD COLUMN IF NOT EXISTS reference_number TEXT;
ALTER TABLE public.univ_re_trust_ledger ADD COLUMN IF NOT EXISTS transaction_date TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.univ_re_trust_ledger ADD COLUMN IF NOT EXISTS created_by UUID;

-- 12. Ensure comprehensive RLS policies across all JCL real estate tables
DO $$
DECLARE
    tbl text;
    jcl_tables text[] := ARRAY[
        'univ_re_properties', 'univ_re_clients', 'univ_re_viewings', 'univ_re_offers',
        'univ_re_transactions', 'univ_re_leases', 'univ_re_rent_payments', 'univ_re_maintenance_requests',
        'univ_re_maintenance', 'univ_re_leads', 'univ_re_lead_activities', 'univ_re_trust_accounts',
        'univ_re_trust_ledger', 'univ_re_escrow_accounts', 'univ_re_document_templates', 'univ_re_esignatures',
        'univ_re_counter_offers', 'univ_re_commission_rules', 'univ_re_commissions', 'univ_re_contractors',
        'univ_re_contractor_reviews', 'univ_re_lease_renewals', 'univ_re_rent_payment_schedules',
        'univ_re_market_data', 'univ_re_comparable_properties', 'univ_re_agent_metrics', 'univ_re_audit_log',
        'univ_re_team_members', 'univ_frontdesk_visitors', 'univ_frontdesk_staff_logs', 'univ_office_custody_items'
    ];
BEGIN
    FOREACH tbl IN ARRAY jcl_tables LOOP
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', 'p_' || tbl || '_access', tbl);
            EXECUTE format(
                'CREATE POLICY %I ON public.%I FOR ALL USING (
                    company_id = (auth.jwt() -> ''app_metadata'' ->> ''company_id'')::uuid
                    OR (auth.jwt() ->> ''role'') = ''super_admin''
                ) WITH CHECK (
                    company_id = (auth.jwt() -> ''app_metadata'' ->> ''company_id'')::uuid
                    OR (auth.jwt() ->> ''role'') = ''super_admin''
                );',
                'p_' || tbl || '_access',
                tbl
            );
        END IF;
    END LOOP;
END $$;

-- >>> END OF MIGRATION: 20261106160000_jcl_real_estate_production_backend_complete.sql <<<
