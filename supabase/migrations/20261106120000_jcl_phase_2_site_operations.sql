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
