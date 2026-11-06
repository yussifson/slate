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
