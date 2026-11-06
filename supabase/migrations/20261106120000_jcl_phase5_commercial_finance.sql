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
