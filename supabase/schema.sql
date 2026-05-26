
-- MASTER RESET: Drop old buggy tables to force recreation (Preserving your new firm & profile)
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.case_emails CASCADE;
DROP TABLE IF EXISTS public.case_messages CASCADE;
DROP TABLE IF EXISTS public.case_outcomes CASCADE;
DROP TABLE IF EXISTS public.case_pipelines CASCADE;
DROP TABLE IF EXISTS public.case_pipeline_states CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.client_checklists CASCADE;
DROP TABLE IF EXISTS public.client_messages CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.firm_settings CASCADE;
DROP TABLE IF EXISTS public.hearings CASCADE;
DROP TABLE IF EXISTS public.h_r_complaints CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;
DROP TABLE IF EXISTS public.leave_requests CASCADE;
DROP TABLE IF EXISTS public.legal_cases CASCADE;
DROP TABLE IF EXISTS public.linked_emails CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.payroll_slips CASCADE;
DROP TABLE IF EXISTS public.promotions CASCADE;
DROP TABLE IF EXISTS public.retainers CASCADE;
DROP TABLE IF EXISTS public.signature_requests CASCADE;
DROP TABLE IF EXISTS public.staff_permissions CASCADE;
DROP TABLE IF EXISTS public.staff_records CASCADE;
DROP TABLE IF EXISTS public.subscription_invoices CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.time_entries CASCADE;

-- Supabase Schema Generated from Base44 Entities

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  user_email TEXT,
  user_name TEXT,
  action TEXT,
  entity_type TEXT,
  entity_id TEXT,
  entity_label TEXT,
  details TEXT,
  ip_address TEXT,
  severity TEXT CHECK (severity IN ('info', 'warning', 'critical'))
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.audit_logs;
CREATE POLICY "Enable all for authenticated users" ON public.audit_logs FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.case_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  subject TEXT,
  sender_email TEXT,
  recipient_email TEXT,
  received_date DATE,
  body_preview TEXT,
  case_id TEXT,
  case_title TEXT,
  client_id TEXT,
  client_name TEXT,
  logged_by TEXT,
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  tags JSONB
);

ALTER TABLE public.case_emails ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.case_emails;
CREATE POLICY "Enable all for authenticated users" ON public.case_emails FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.case_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  case_id TEXT,
  sender_email TEXT,
  sender_name TEXT,
  content TEXT,
  tagged_emails JSONB,
  document_links JSONB,
  read_by JSONB
);

ALTER TABLE public.case_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.case_messages;
CREATE POLICY "Enable all for authenticated users" ON public.case_messages FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.case_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  case_id TEXT,
  case_title TEXT,
  case_type TEXT,
  client_name TEXT,
  assigned_lawyer TEXT,
  assigned_lawyer_name TEXT,
  outcome TEXT CHECK (outcome IN ('won', 'lost', 'settled', 'dismissed', 'withdrawn', 'ongoing')),
  outcome_date DATE,
  outcome_summary TEXT,
  settlement_amount NUMERIC,
  currency TEXT CHECK (currency IN ('GHS', 'NGN', 'SLL', 'USD')),
  duration_days NUMERIC,
  court_name TEXT,
  judge_name TEXT
);

ALTER TABLE public.case_outcomes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.case_outcomes;
CREATE POLICY "Enable all for authenticated users" ON public.case_outcomes FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.case_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  name TEXT,
  case_type TEXT CHECK (case_type IN ('civil', 'criminal', 'corporate', 'family', 'property', 'labor', 'tax', 'other')),
  stages JSONB,
  is_default BOOLEAN
);

ALTER TABLE public.case_pipelines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.case_pipelines;
CREATE POLICY "Enable all for authenticated users" ON public.case_pipelines FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.case_pipeline_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  case_id TEXT,
  case_title TEXT,
  pipeline_id TEXT,
  pipeline_name TEXT,
  current_stage_id TEXT,
  current_stage_name TEXT,
  stage_entered_at TEXT,
  stage_history JSONB
);

ALTER TABLE public.case_pipeline_states ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.case_pipeline_states;
CREATE POLICY "Enable all for authenticated users" ON public.case_pipeline_states FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  type TEXT CHECK (type IN ('individual', 'organization')),
  name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  id_number TEXT,
  status TEXT CHECK (status IN ('active', 'inactive', 'lead')),
  notes TEXT,
  total_cases NUMERIC,
  total_billed NUMERIC
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.clients;
CREATE POLICY "Enable all for authenticated users" ON public.clients FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.client_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  client_id TEXT,
  client_name TEXT,
  client_email TEXT,
  case_id TEXT,
  case_title TEXT,
  title TEXT,
  description TEXT,
  assigned_by TEXT,
  assigned_by_name TEXT,
  due_date DATE,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'waived')),
  completed_at TEXT,
  notes TEXT,
  document_id TEXT
);

ALTER TABLE public.client_checklists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.client_checklists;
CREATE POLICY "Enable all for authenticated users" ON public.client_checklists FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.client_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  case_id TEXT,
  case_title TEXT,
  sender_email TEXT,
  sender_name TEXT,
  sender_type TEXT CHECK (sender_type IN ('client', 'lawyer')),
  content TEXT,
  read_by_lawyer BOOLEAN,
  read_by_client BOOLEAN
);

ALTER TABLE public.client_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.client_messages;
CREATE POLICY "Enable all for authenticated users" ON public.client_messages FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  name TEXT,
  subdomain TEXT UNIQUE,
  email TEXT,
  phone TEXT,
  country TEXT CHECK (country IN ('Ghana', 'Nigeria', 'Sierra Leone')),
  city TEXT,
  address TEXT,
  logo_url TEXT,
  subscription_plan TEXT CHECK (subscription_plan IN ('free', 'starter', 'professional', 'firm_plus', 'enterprise')),
  subscription_status TEXT CHECK (subscription_status IN ('active', 'inactive', 'trial', 'expired')),
  max_users NUMERIC,
  max_cases NUMERIC,
  max_storage_gb NUMERIC,
  currency TEXT CHECK (currency IN ('GHS', 'NGN', 'SLL', 'USD')),
  admin_email TEXT,
  industry_type TEXT CHECK (industry_type IN ('law', 'school', 'hospital', 'hotel', 'church', 'insurance', 'retail', 'logistics', 'hr')),
  status TEXT CHECK (status IN ('active', 'suspended', 'pending'))
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.companies;
CREATE POLICY "Enable all for authenticated users" ON public.companies FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  name TEXT,
  file_url TEXT,
  file_type TEXT,
  file_size NUMERIC,
  case_id TEXT,
  case_title TEXT,
  client_id TEXT,
  client_name TEXT,
  category TEXT CHECK (category IN ('court_filing', 'pleading', 'court_order', 'evidence', 'contract', 'correspondence', 'scanned_document', 'id_document', 'invoice', 'other')),
  filing_date DATE,
  uploaded_by TEXT,
  notes TEXT,
  version NUMERIC,
  shared_with_client BOOLEAN
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.documents;
CREATE POLICY "Enable all for authenticated users" ON public.documents FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  case_id TEXT,
  case_title TEXT,
  client_id TEXT,
  client_name TEXT,
  description TEXT,
  category TEXT CHECK (category IN ('travel', 'filing_fees', 'court_costs', 'postage', 'printing', 'accommodation', 'expert_fees', 'translation', 'other')),
  amount NUMERIC,
  currency TEXT CHECK (currency IN ('GHS', 'NGN', 'SLL', 'USD')),
  expense_date DATE,
  receipt_url TEXT,
  logged_by TEXT,
  logged_by_name TEXT,
  billable BOOLEAN,
  billed BOOLEAN,
  invoice_id TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'billed')),
  notes TEXT
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.expenses;
CREATE POLICY "Enable all for authenticated users" ON public.expenses FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.firm_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  custom_case_types JSONB,
  custom_case_statuses JSONB,
  custom_task_types JSONB,
  custom_document_categories JSONB,
  custom_roles JSONB
);

ALTER TABLE public.firm_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.firm_settings;
CREATE POLICY "Enable all for authenticated users" ON public.firm_settings FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.hearings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  case_id TEXT,
  case_title TEXT,
  case_number TEXT,
  title TEXT,
  date DATE,
  time TEXT,
  court_name TEXT,
  judge_name TEXT,
  lawyer_email TEXT,
  lawyer_name TEXT,
  status TEXT CHECK (status IN ('scheduled', 'completed', 'adjourned', 'cancelled')),
  notes TEXT,
  outcome TEXT
);

ALTER TABLE public.hearings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.hearings;
CREATE POLICY "Enable all for authenticated users" ON public.hearings FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.h_r_complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  staff_email TEXT,
  staff_name TEXT,
  subject TEXT,
  description TEXT,
  category TEXT CHECK (category IN ('workplace_conduct', 'harassment', 'discrimination', 'salary', 'workload', 'management', 'safety', 'other')),
  against_email TEXT,
  against_name TEXT,
  status TEXT CHECK (status IN ('open', 'under_review', 'resolved', 'dismissed')),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
  resolution_notes TEXT,
  resolved_by TEXT,
  resolved_at TEXT,
  is_anonymous BOOLEAN
);

ALTER TABLE public.h_r_complaints ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.h_r_complaints;
CREATE POLICY "Enable all for authenticated users" ON public.h_r_complaints FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  invoice_number TEXT,
  client_id TEXT,
  client_name TEXT,
  case_id TEXT,
  case_title TEXT,
  items JSONB,
  subtotal NUMERIC,
  tax_rate NUMERIC,
  tax_amount NUMERIC,
  total_amount NUMERIC,
  currency TEXT CHECK (currency IN ('GHS', 'NGN', 'SLL', 'USD')),
  status TEXT CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  due_date DATE,
  paid_date DATE,
  payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'mobile_money', 'cash', 'card', 'other')),
  notes TEXT
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.invoices;
CREATE POLICY "Enable all for authenticated users" ON public.invoices FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  organization TEXT,
  case_type TEXT CHECK (case_type IN ('civil', 'criminal', 'corporate', 'family', 'property', 'labor', 'tax', 'other')),
  case_description TEXT,
  urgency TEXT CHECK (urgency IN ('low', 'medium', 'high', 'urgent')),
  source TEXT,
  status TEXT CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  assigned_to TEXT,
  notes TEXT,
  preferred_contact TEXT CHECK (preferred_contact IN ('email', 'phone', 'whatsapp'))
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.leads;
CREATE POLICY "Enable all for authenticated users" ON public.leads FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  staff_id TEXT,
  staff_email TEXT,
  staff_name TEXT,
  leave_type TEXT CHECK (leave_type IN ('annual', 'sick', 'maternity', 'paternity', 'bereavement', 'unpaid', 'other')),
  start_date DATE,
  end_date DATE,
  days_requested NUMERIC,
  reason TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  reviewed_by TEXT,
  reviewed_at TEXT,
  review_notes TEXT
);

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.leave_requests;
CREATE POLICY "Enable all for authenticated users" ON public.leave_requests FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.legal_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  case_number TEXT,
  title TEXT,
  description TEXT,
  case_type TEXT CHECK (case_type IN ('civil', 'criminal', 'corporate', 'family', 'property', 'labor', 'tax', 'other')),
  status TEXT CHECK (status IN ('open', 'in_progress', 'pending_hearing', 'closed', 'archived')),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  client_id TEXT,
  client_name TEXT,
  assigned_lawyer TEXT,
  assigned_lawyer_name TEXT,
  court_name TEXT,
  judge_name TEXT,
  opposing_party TEXT,
  opposing_counsel TEXT,
  filing_date DATE,
  next_hearing_date DATE,
  notes TEXT,
  tags JSONB
);

ALTER TABLE public.legal_cases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.legal_cases;
CREATE POLICY "Enable all for authenticated users" ON public.legal_cases FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.linked_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  subject TEXT,
  from_email TEXT,
  from_name TEXT,
  to_email TEXT,
  body TEXT,
  email_date DATE,
  case_id TEXT,
  case_title TEXT,
  client_id TEXT,
  client_name TEXT,
  logged_by TEXT,
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  tags JSONB,
  notes TEXT
);

ALTER TABLE public.linked_emails ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.linked_emails;
CREATE POLICY "Enable all for authenticated users" ON public.linked_emails FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  recipient_email TEXT,
  recipient_name TEXT,
  type TEXT CHECK (type IN ('hearing_reminder', 'invoice_overdue')),
  title TEXT,
  message TEXT,
  related_id TEXT,
  is_read BOOLEAN,
  email_sent BOOLEAN
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.notifications;
CREATE POLICY "Enable all for authenticated users" ON public.notifications FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.payroll_slips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  staff_email TEXT,
  staff_name TEXT,
  staff_role TEXT,
  department TEXT,
  pay_period TEXT,
  basic_salary NUMERIC,
  allowances JSONB,
  deductions JSONB,
  gross_salary NUMERIC,
  total_deductions NUMERIC,
  net_salary NUMERIC,
  currency TEXT CHECK (currency IN ('GHS', 'NGN', 'SLL', 'USD')),
  leave_days_taken NUMERIC,
  status TEXT CHECK (status IN ('draft', 'approved', 'paid')),
  notes TEXT,
  approved_by TEXT,
  approved_at TEXT,
  paid_at TEXT
);

ALTER TABLE public.payroll_slips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.payroll_slips;
CREATE POLICY "Enable all for authenticated users" ON public.payroll_slips FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  staff_email TEXT,
  staff_name TEXT,
  from_role TEXT,
  to_role TEXT,
  from_salary NUMERIC,
  to_salary NUMERIC,
  currency TEXT CHECK (currency IN ('GHS', 'NGN', 'SLL', 'USD')),
  effective_date DATE,
  reason TEXT,
  approved_by TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT
);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.promotions;
CREATE POLICY "Enable all for authenticated users" ON public.promotions FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.retainers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  case_id TEXT,
  case_title TEXT,
  client_id TEXT,
  client_name TEXT,
  initial_deposit NUMERIC,
  current_balance NUMERIC,
  total_deducted NUMERIC,
  currency TEXT CHECK (currency IN ('GHS', 'NGN', 'SLL', 'USD')),
  alert_threshold NUMERIC,
  alert_triggered BOOLEAN,
  status TEXT CHECK (status IN ('active', 'depleted', 'closed')),
  notes TEXT
);

ALTER TABLE public.retainers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.retainers;
CREATE POLICY "Enable all for authenticated users" ON public.retainers FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.signature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  document_id TEXT,
  document_name TEXT,
  case_id TEXT,
  case_title TEXT,
  client_id TEXT,
  client_name TEXT,
  client_email TEXT,
  sent_by TEXT,
  sent_by_name TEXT,
  status TEXT CHECK (status IN ('draft', 'sent', 'opened', 'signed', 'declined', 'expired')),
  sent_at TEXT,
  opened_at TEXT,
  signed_at TEXT,
  signature_data TEXT,
  signature_ip TEXT,
  signature_token TEXT,
  message TEXT,
  expires_at TEXT
);

ALTER TABLE public.signature_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.signature_requests;
CREATE POLICY "Enable all for authenticated users" ON public.signature_requests FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.staff_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  staff_id TEXT,
  staff_email TEXT,
  staff_name TEXT,
  can_view_cases BOOLEAN,
  can_create_cases BOOLEAN,
  can_edit_cases BOOLEAN,
  can_delete_cases BOOLEAN,
  can_view_clients BOOLEAN,
  can_create_clients BOOLEAN,
  can_edit_clients BOOLEAN,
  can_delete_clients BOOLEAN,
  can_view_invoices BOOLEAN,
  can_create_invoices BOOLEAN,
  can_view_documents BOOLEAN,
  can_upload_documents BOOLEAN,
  can_delete_documents BOOLEAN,
  can_view_tasks BOOLEAN,
  can_create_tasks BOOLEAN,
  can_view_team BOOLEAN,
  can_view_reports BOOLEAN,
  can_manage_leave BOOLEAN
);

ALTER TABLE public.staff_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.staff_permissions;
CREATE POLICY "Enable all for authenticated users" ON public.staff_permissions FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.staff_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  user_email TEXT,
  full_name TEXT,
  role TEXT CHECK (role IN ('company_admin', 'lawyer', 'paralegal', 'hr', 'finance', 'support')),
  department TEXT,
  phone TEXT,
  hire_date DATE,
  status TEXT CHECK (status IN ('active', 'inactive', 'on_leave')),
  salary NUMERIC,
  currency TEXT CHECK (currency IN ('GHS', 'NGN', 'SLL', 'USD')),
  leave_balance NUMERIC,
  bar_number TEXT
);

ALTER TABLE public.staff_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.staff_records;
CREATE POLICY "Enable all for authenticated users" ON public.staff_records FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.subscription_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  company_name TEXT,
  admin_email TEXT,
  plan TEXT,
  plan_name TEXT,
  amount_usd NUMERIC,
  billing_period TEXT,
  due_date DATE,
  paid_date DATE,
  status TEXT CHECK (status IN ('pending', 'sent', 'paid', 'overdue', 'cancelled')),
  payment_method TEXT,
  reminder_count NUMERIC,
  last_reminder_at TEXT,
  notes TEXT
);

ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.subscription_invoices;
CREATE POLICY "Enable all for authenticated users" ON public.subscription_invoices FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  title TEXT,
  description TEXT,
  case_id TEXT,
  case_title TEXT,
  assigned_to TEXT,
  assigned_to_name TEXT,
  assigned_by TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date DATE,
  completed_date DATE,
  category TEXT CHECK (category IN ('legal', 'admin', 'finance', 'hr', 'other'))
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.tasks;
CREATE POLICY "Enable all for authenticated users" ON public.tasks FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  case_id TEXT,
  case_title TEXT,
  case_number TEXT,
  client_id TEXT,
  client_name TEXT,
  lawyer_email TEXT,
  lawyer_name TEXT,
  description TEXT,
  start_time TEXT,
  end_time TEXT,
  duration_minutes NUMERIC,
  hourly_rate NUMERIC,
  billable_amount NUMERIC,
  currency TEXT CHECK (currency IN ('GHS', 'NGN', 'SLL', 'USD')),
  is_billable BOOLEAN,
  billed BOOLEAN,
  invoice_id TEXT,
  category TEXT CHECK (category IN ('legal_research', 'court_appearance', 'client_meeting', 'document_drafting', 'correspondence', 'consultation', 'other'))
);

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.time_entries;
CREATE POLICY "Enable all for authenticated users" ON public.time_entries FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  role TEXT CHECK (role IN ('super_admin', 'company_admin', 'lawyer', 'paralegal', 'hr', 'finance', 'support')),
  company_id TEXT,
  company_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  department TEXT,
  bar_number TEXT
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.profiles;
CREATE POLICY "Enable all for authenticated users" ON public.profiles FOR ALL USING (auth.role() = 'authenticated');

