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
