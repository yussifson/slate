-- JCL REAL ESTATE PHASE 4: ENGINEERING & TECHNICAL RECORDS
-- Execute in Supabase SQL Editor before using /jcl/engineering.
-- This migration is intentionally additive and preserves revisions/history.

create table if not exists public.jcl_engineering_assignments (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.ops_projects(id) on delete set null, phase_id uuid, work_package_id uuid,
  assignment_reference text not null, discipline text not null check (discipline in ('architectural','structural','civil','electrical','mechanical','plumbing','geotechnical','environmental','quantity_surveying','other')),
  title text not null, description text, scope_of_responsibility text, assigned_engineer_id uuid references public.core_parties(id) on delete set null,
  assigned_team_id uuid references public.ops_teams(id) on delete set null, start_date date, target_completion_date date,
  priority text not null default 'medium' check (priority in ('low','medium','high','critical')),
  status text not null default 'draft' check (status in ('draft','assigned','in_progress','submitted','under_review','completed','on_hold','cancelled')),
  expected_deliverables text, notes text, created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(company_id, assignment_reference)
);

create table if not exists public.jcl_technical_requirements (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.ops_projects(id) on delete set null, assignment_id uuid references public.jcl_engineering_assignments(id) on delete set null,
  requirement_reference text not null, discipline text not null, title text not null, description text, specification text, source_reference text,
  responsible_person_id uuid references public.core_parties(id) on delete set null, priority text not null default 'medium' check (priority in ('low','medium','high','critical')),
  verification_criteria text, status text not null default 'open' check (status in ('open','under_review','verified','approved','clarification_required','closed')),
  review_notes text, required_date date, created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(company_id, requirement_reference)
);

create table if not exists public.jcl_drawings (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.ops_projects(id) on delete set null, assignment_id uuid references public.jcl_engineering_assignments(id) on delete set null,
  work_package_id uuid, drawing_number text not null, title text not null, discipline text not null, category text, description text,
  owner_id uuid references public.core_parties(id) on delete set null, current_revision text not null default 'A', drawing_status text not null default 'draft',
  review_status text not null default 'not_submitted', approval_status text not null default 'not_submitted', created_by uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(company_id, drawing_number)
);

create table if not exists public.jcl_drawing_revisions (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  drawing_id uuid not null references public.jcl_drawings(id) on delete cascade, revision_identifier text not null, revision_date date not null default current_date,
  description text, reason_for_revision text, change_notes text, file_path text, original_filename text, file_type text, file_size bigint,
  author_id uuid references public.core_parties(id) on delete set null, revision_status text not null default 'draft' check (revision_status in ('draft','submitted_for_review','under_review','approved','rejected','superseded')),
  review_status text not null default 'not_submitted', approval_status text not null default 'not_submitted', previous_revision_id uuid references public.jcl_drawing_revisions(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(drawing_id, revision_identifier)
);

create table if not exists public.jcl_technical_submissions (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.ops_projects(id) on delete set null, assignment_id uuid references public.jcl_engineering_assignments(id) on delete set null,
  submission_reference text not null, discipline text not null, submitted_by uuid references public.core_parties(id) on delete set null, submitted_at timestamptz not null default now(),
  purpose text, recipient_id uuid references public.core_parties(id) on delete set null, required_response_date date,
  status text not null default 'submitted' check (status in ('draft','submitted','under_review','approved','approved_with_comments','revise_and_resubmit','rejected','closed')),
  comments text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(company_id, submission_reference)
);

create table if not exists public.jcl_technical_reviews (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  submission_id uuid not null references public.jcl_technical_submissions(id) on delete cascade, drawing_revision_id uuid references public.jcl_drawing_revisions(id) on delete set null,
  reviewer_id uuid references public.core_parties(id) on delete set null, outcome text not null check (outcome in ('approved','approved_with_comments','revise_and_resubmit','rejected','not_approved')),
  comments text, required_changes text, decision_date timestamptz not null default now(), created_at timestamptz not null default now()
);

create table if not exists public.jcl_technical_reports (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.ops_projects(id) on delete set null, assignment_id uuid references public.jcl_engineering_assignments(id) on delete set null,
  report_reference text not null, discipline text not null, report_type text not null, title text not null, description text,
  author_id uuid references public.core_parties(id) on delete set null, responsible_engineer_id uuid references public.core_parties(id) on delete set null,
  file_path text, original_filename text, revision text, submission_date date, review_status text not null default 'not_submitted', approval_status text not null default 'not_submitted', notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(company_id, report_reference)
);

create table if not exists public.jcl_technical_issues (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.ops_projects(id) on delete set null, assignment_id uuid references public.jcl_engineering_assignments(id) on delete set null,
  drawing_id uuid references public.jcl_drawings(id) on delete set null, drawing_revision_id uuid references public.jcl_drawing_revisions(id) on delete set null,
  requirement_id uuid references public.jcl_technical_requirements(id) on delete set null, issue_reference text not null, discipline text, title text not null, description text, category text,
  severity text not null default 'medium' check (severity in ('low','medium','high','critical')), priority text not null default 'medium', reported_by uuid references public.core_parties(id) on delete set null,
  assigned_engineer_id uuid references public.core_parties(id) on delete set null, date_reported date not null default current_date, proposed_resolution text, required_resolution_date date,
  status text not null default 'open' check (status in ('open','assigned','under_investigation','awaiting_clarification','resolved','verified','closed')), resolution_notes text, closure_date date,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(company_id, issue_reference)
);

create table if not exists public.jcl_design_changes (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.ops_projects(id) on delete set null, work_package_id uuid, drawing_id uuid references public.jcl_drawings(id) on delete set null,
  current_revision_id uuid references public.jcl_drawing_revisions(id) on delete set null, proposed_revision_id uuid references public.jcl_drawing_revisions(id) on delete set null,
  change_reference text not null, description text not null, reason_for_change text, requester_id uuid references public.core_parties(id) on delete set null, technical_impact text,
  schedule_implications text, cost_implications numeric(15,2), supporting_file_path text, status text not null default 'draft', approval_status text not null default 'not_submitted', decision_notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(company_id, change_reference)
);

create index if not exists idx_jcl_eng_assignments_company_project on public.jcl_engineering_assignments(company_id, project_id, status);
create index if not exists idx_jcl_requirements_company_project on public.jcl_technical_requirements(company_id, project_id, status);
create index if not exists idx_jcl_drawings_company_project on public.jcl_drawings(company_id, project_id, approval_status);
create index if not exists idx_jcl_revisions_drawing on public.jcl_drawing_revisions(company_id, drawing_id, revision_date desc);
create index if not exists idx_jcl_submissions_company_status on public.jcl_technical_submissions(company_id, status, required_response_date);
create index if not exists idx_jcl_issues_company_status on public.jcl_technical_issues(company_id, status, required_resolution_date);
create index if not exists idx_jcl_changes_company_status on public.jcl_design_changes(company_id, status, approval_status);

-- Preserve all technical history; no destructive update/delete policy is granted to regular users.
do $$
declare t text;
begin
  foreach t in array array['jcl_engineering_assignments','jcl_technical_requirements','jcl_drawings','jcl_drawing_revisions','jcl_technical_submissions','jcl_technical_reviews','jcl_technical_reports','jcl_technical_issues','jcl_design_changes'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_tenant_access', t);
    execute format('create policy %I on public.%I for all using (company_id = (auth.jwt() -> ''app_metadata'' ->> ''company_id'')::uuid) with check (company_id = (auth.jwt() -> ''app_metadata'' ->> ''company_id'')::uuid)', t || '_tenant_access', t);
  end loop;
end $$;

-- Private bucket for engineering files. The application should upload with a company-scoped path:
-- <company_id>/<project_id>/<drawing_id>/<revision_id>/<filename>
insert into storage.buckets (id, name, public) values ('jcl-engineering-files', 'jcl-engineering-files', false) on conflict (id) do nothing;
drop policy if exists jcl_engineering_files_read on storage.objects;
drop policy if exists jcl_engineering_files_write on storage.objects;
create policy jcl_engineering_files_read on storage.objects for select using (bucket_id = 'jcl-engineering-files' and (storage.foldername(name))[1] = ((auth.jwt() -> 'app_metadata' ->> 'company_id')));
create policy jcl_engineering_files_write on storage.objects for insert with check (bucket_id = 'jcl-engineering-files' and (storage.foldername(name))[1] = ((auth.jwt() -> 'app_metadata' ->> 'company_id')));
