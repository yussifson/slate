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
