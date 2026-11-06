-- JCL Phase 7: project collaboration, risks, milestones, members and audit-ready activity.
-- Apply this migration in Supabase before opening the Project workspace.
create extension if not exists pgcrypto;

create table if not exists public.ops_project_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
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
  company_id uuid not null,
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
  company_id uuid not null,
  message_id uuid not null references public.ops_project_messages(id) on delete cascade,
  user_id uuid not null,
  reaction text not null check (reaction in ('like','acknowledged','question','important')),
  created_at timestamptz not null default now(),
  unique(message_id, user_id, reaction)
);

create table if not exists public.ops_project_message_mentions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  message_id uuid not null references public.ops_project_messages(id) on delete cascade,
  mentioned_user_id uuid not null,
  created_at timestamptz not null default now(),
  unique(message_id, mentioned_user_id)
);

create table if not exists public.ops_project_risks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
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
  company_id uuid not null,
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
