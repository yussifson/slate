-- JCL REAL ESTATE PHASE 5: COMMERCIAL, PROJECT FINANCE AND FINANCIAL CONTROL
-- Owner review required: run this complete file in the Supabase SQL Editor before using /jcl/finance.
-- This migration is additive. It reuses ops_projects, fin_supplier_bills and fin_payments.

create table if not exists public.jcl_project_budgets (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.ops_projects(id) on delete set null, budget_reference text not null, title text not null,
  version integer not null default 1 check (version > 0), currency text not null default 'USD', preparation_date date not null default current_date,
  prepared_by uuid, original_amount numeric(15,2) not null default 0 check (original_amount >= 0), current_approved_amount numeric(15,2) not null default 0 check (current_approved_amount >= 0),
  review_status text not null default 'draft' check (review_status in ('draft','submitted','under_review','reviewed','rejected')),
  approval_status text not null default 'draft' check (approval_status in ('draft','submitted','approved','rejected','superseded')),
  effective_date date, approved_by uuid, approved_at timestamptz, notes text, created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(company_id, budget_reference, version)
);

create table if not exists public.jcl_project_budget_lines (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  budget_id uuid not null references public.jcl_project_budgets(id) on delete cascade, phase_id uuid, work_package_id uuid, cost_code text not null,
  description text not null, category text not null, quantity numeric(15,3) not null default 1 check (quantity >= 0), unit_of_measure text,
  unit_rate numeric(15,2) not null default 0 check (unit_rate >= 0), total_amount numeric(15,2) generated always as (round(quantity * unit_rate, 2)) stored, department text, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.jcl_project_commitments (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.ops_projects(id) on delete set null, purchase_order_id uuid, purchase_order_reference text not null,
  supplier_party_id uuid references public.core_parties(id) on delete set null, phase_id uuid, work_package_id uuid, cost_code text, currency text not null default 'USD',
  approved_amount numeric(15,2) not null default 0 check (approved_amount >= 0), received_amount numeric(15,2) not null default 0 check (received_amount >= 0), invoiced_amount numeric(15,2) not null default 0 check (invoiced_amount >= 0),
  outstanding_amount numeric(15,2) generated always as (greatest(approved_amount - invoiced_amount, 0)) stored,
  status text not null default 'approved' check (status in ('draft','approved','partially_received','fully_received','closed','cancelled')), source_updated_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(company_id, purchase_order_reference)
);

create table if not exists public.jcl_project_cost_allocations (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.ops_projects(id) on delete set null, phase_id uuid, work_package_id uuid, cost_code text, cost_category text,
  supplier_party_id uuid references public.core_parties(id) on delete set null, source_transaction_type text not null, source_transaction_id uuid not null,
  amount numeric(15,2) not null check (amount >= 0), currency text not null default 'USD', accounting_status text not null default 'posted' check (accounting_status in ('invoiced','posted','paid','reversed')),
  allocated_at timestamptz not null default now(), created_by uuid, unique(company_id, source_transaction_type, source_transaction_id, project_id, cost_code)
);

create table if not exists public.jcl_project_variations (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.ops_projects(id) on delete set null, contract_id uuid, variation_reference text not null, title text not null, description text, reason text,
  variation_type text not null default 'other' check (variation_type in ('additional_work','scope_reduction','design_change','specification_change','site_condition','client_request','regulatory','other')),
  requested_by uuid, request_date date not null default current_date, original_contract_value numeric(15,2) not null default 0 check (original_contract_value >= 0), proposed_value_adjustment numeric(15,2) not null default 0,
  cost_impact numeric(15,2) not null default 0 check (cost_impact >= 0), schedule_impact_days integer not null default 0 check (schedule_impact_days >= 0), status text not null default 'draft' check (status in ('draft','submitted','under_review','approved_internally','pending_client_approval','accepted','rejected','cancelled')),
  approval_status text not null default 'not_submitted', client_acceptance_status text not null default 'not_submitted', reviewed_by uuid, approved_by uuid, approved_at timestamptz, effective_date date, review_comments text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(company_id, variation_reference)
);

create table if not exists public.jcl_progress_claims (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.ops_projects(id) on delete set null, contract_id uuid, client_party_id uuid references public.core_parties(id) on delete set null, claim_reference text not null,
  claim_period text, claim_date date not null default current_date, submission_date date, description text, contract_value numeric(15,2) not null default 0 check (contract_value >= 0), previous_certified_amount numeric(15,2) not null default 0 check (previous_certified_amount >= 0),
  current_claim_amount numeric(15,2) not null default 0 check (current_claim_amount >= 0), cumulative_claimed_amount numeric(15,2) generated always as (previous_certified_amount + current_claim_amount) stored, certified_amount numeric(15,2) not null default 0 check (certified_amount >= 0),
  retention_deduction numeric(15,2) not null default 0 check (retention_deduction >= 0), other_deductions numeric(15,2) not null default 0 check (other_deductions >= 0), tax_amount numeric(15,2) not null default 0 check (tax_amount >= 0), net_amount_due numeric(15,2) not null default 0 check (net_amount_due >= 0), amount_paid numeric(15,2) not null default 0 check (amount_paid >= 0),
  status text not null default 'draft' check (status in ('draft','submitted','under_review','approved','partially_certified','rejected','invoiced','partially_paid','paid')), payment_status text not null default 'unpaid', invoice_reference text, client_response text, reviewer_id uuid, certified_at timestamptz, created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(company_id, claim_reference)
);

create table if not exists public.jcl_retention_ledger (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.ops_projects(id) on delete set null, contract_id uuid, counterparty_id uuid references public.core_parties(id) on delete set null, source_type text not null, source_id uuid,
  retention_type text not null default 'percentage', retention_basis text, retention_percentage numeric(7,4) check (retention_percentage is null or (retention_percentage >= 0 and retention_percentage <= 100)), retained_amount numeric(15,2) not null default 0 check (retained_amount >= 0), released_amount numeric(15,2) not null default 0 check (released_amount >= 0),
  release_conditions text, expected_release_date date, actual_release_date date, status text not null default 'held' check (status in ('held','partially_released','released','disputed')), supporting_document_path text, created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.jcl_cost_forecasts (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.ops_projects(id) on delete set null, forecast_reference text not null, as_of_date date not null default current_date,
  approved_budget numeric(15,2) not null default 0 check (approved_budget >= 0), actual_costs numeric(15,2) not null default 0 check (actual_costs >= 0), remaining_commitments numeric(15,2) not null default 0 check (remaining_commitments >= 0), estimated_uncommitted_cost numeric(15,2) not null default 0 check (estimated_uncommitted_cost >= 0),
  forecast_final_cost numeric(15,2) generated always as (actual_costs + remaining_commitments + estimated_uncommitted_cost) stored, approved_variations numeric(15,2) not null default 0 check (approved_variations >= 0), pending_variations numeric(15,2) not null default 0 check (pending_variations >= 0), assumption_notes text, prepared_by uuid, is_current boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(company_id, forecast_reference)
);

create index if not exists idx_jcl_budgets_company_project on public.jcl_project_budgets(company_id, project_id, approval_status);
create index if not exists idx_jcl_budget_lines_budget on public.jcl_project_budget_lines(company_id, budget_id, cost_code);
create index if not exists idx_jcl_commitments_company_project on public.jcl_project_commitments(company_id, project_id, status);
create index if not exists idx_jcl_cost_allocations_source on public.jcl_project_cost_allocations(company_id, source_transaction_type, source_transaction_id);
create index if not exists idx_jcl_variations_company_project on public.jcl_project_variations(company_id, project_id, status);
create index if not exists idx_jcl_claims_company_project on public.jcl_progress_claims(company_id, project_id, status);
create index if not exists idx_jcl_retention_company_project on public.jcl_retention_ledger(company_id, project_id, status);
create index if not exists idx_jcl_forecasts_company_project on public.jcl_cost_forecasts(company_id, project_id, is_current);

create or replace function public.jcl_set_updated_at() returns trigger language plpgsql security definer set search_path = '' as $$ begin new.updated_at = now(); return new; end $$;
do $$ declare t text; begin foreach t in array array['jcl_project_budgets','jcl_project_budget_lines','jcl_project_commitments','jcl_project_cost_allocations','jcl_project_variations','jcl_progress_claims','jcl_retention_ledger','jcl_cost_forecasts'] loop execute format('drop trigger if exists %I on public.%I', 'set_updated_at_' || t, t); execute format('create trigger %I before update on public.%I for each row execute function public.jcl_set_updated_at()', 'set_updated_at_' || t, t); end loop; end $$;

-- Enforce tenant isolation. Role-specific approval gates should be added to the existing JCL authorization function/table when available.
do $$ declare t text; begin foreach t in array array['jcl_project_budgets','jcl_project_budget_lines','jcl_project_commitments','jcl_project_cost_allocations','jcl_project_variations','jcl_progress_claims','jcl_retention_ledger','jcl_cost_forecasts'] loop execute format('alter table public.%I enable row level security', t); execute format('drop policy if exists %I on public.%I', t || '_tenant_access', t); execute format('create policy %I on public.%I for all using (company_id = (auth.jwt() -> ''app_metadata'' ->> ''company_id'')::uuid) with check (company_id = (auth.jwt() -> ''app_metadata'' ->> ''company_id'')::uuid)', t || '_tenant_access', t); end loop; end $$;

-- Prevent over-claiming beyond contract value unless an approved variation exists. This is a database guard for submitted/certified claims.
create or replace function public.jcl_validate_progress_claim() returns trigger language plpgsql security definer set search_path = '' as $$
declare approved_variations numeric(15,2); previous_total numeric(15,2); max_value numeric(15,2);
begin
  if new.status in ('submitted','under_review','approved','partially_certified','invoiced','partially_paid','paid') then
    select coalesce(sum(cost_impact),0) into approved_variations from public.jcl_project_variations where company_id = new.company_id and project_id = new.project_id and status in ('approved','accepted');
    previous_total := coalesce(new.previous_certified_amount,0);
    max_value := coalesce(new.contract_value,0) + approved_variations;
    if max_value > 0 and previous_total + coalesce(new.current_claim_amount,0) > max_value then raise exception 'Progress claim exceeds contract value plus approved variations'; end if;
  end if;
  return new;
end $$;
drop trigger if exists validate_jcl_progress_claim on public.jcl_progress_claims;
create trigger validate_jcl_progress_claim before insert or update on public.jcl_progress_claims for each row execute function public.jcl_validate_progress_claim();

-- Duplicate source transactions cannot be allocated twice because of the unique constraint above.
-- Supplier bills and payments remain owned by fin_supplier_bills and fin_payments; this migration only adds project visibility.
