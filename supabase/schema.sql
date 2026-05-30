
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
  email TEXT,
  phone TEXT,
  country TEXT CHECK (country IN ('Ghana', 'Nigeria', 'Sierra Leone')),
  city TEXT,
  address TEXT,
  logo_url TEXT,
  subscription_plan TEXT CHECK (subscription_plan IN ('free', 'starter', 'professional', 'firm_plus', 'enterprise')),
  subscription_status TEXT CHECK (subscription_status IN ('active', 'inactive', 'trial', 'expired')),
  trial_days NUMERIC DEFAULT 14,
  max_users NUMERIC,
  max_cases NUMERIC,
  max_storage_gb NUMERIC,
  currency TEXT CHECK (currency IN ('GHS', 'NGN', 'SLL', 'USD')),
  admin_email TEXT,
  status TEXT CHECK (status IN ('active', 'suspended', 'pending')),
  custom_email_domain TEXT,
  custom_email_verified BOOLEAN DEFAULT FALSE
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

 
 - -   S C H O O L   T A B L E S  
  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   p u b l i c . s c h o o l _ s t u d e n t s   (  
     i d   U U I D   P R I M A R Y   K E Y   D E F A U L T   g e n _ r a n d o m _ u u i d ( ) ,  
     c r e a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     u p d a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     c r e a t e d _ b y   T E X T ,  
     c o m p a n y _ i d   T E X T ,  
     t y p e   T E X T ,  
     n a m e   T E X T ,  
     e m a i l   T E X T ,  
     p h o n e   T E X T ,  
     a d d r e s s   T E X T ,  
     c i t y   T E X T ,  
     c o u n t r y   T E X T ,  
     i d _ n u m b e r   T E X T ,  
     s t a t u s   T E X T ,  
     n o t e s   T E X T ,  
     t o t a l _ c a s e s   N U M E R I C ,  
     t o t a l _ b i l l e d   N U M E R I C  
 ) ;  
 A L T E R   T A B L E   p u b l i c . s c h o o l _ s t u d e n t s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 D R O P   P O L I C Y   I F   E X I S T S   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . s c h o o l _ s t u d e n t s ;  
 C R E A T E   P O L I C Y   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . s c h o o l _ s t u d e n t s   F O R   A L L   U S I N G   ( a u t h . r o l e ( )   =   ' a u t h e n t i c a t e d ' ) ;  
  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   p u b l i c . s c h o o l _ c l a s s e s   (  
     i d   U U I D   P R I M A R Y   K E Y   D E F A U L T   g e n _ r a n d o m _ u u i d ( ) ,  
     c r e a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     u p d a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     c r e a t e d _ b y   T E X T ,  
     c o m p a n y _ i d   T E X T ,  
     c a s e _ n u m b e r   T E X T ,  
     t i t l e   T E X T ,  
     d e s c r i p t i o n   T E X T ,  
     c a s e _ t y p e   T E X T ,  
     s t a t u s   T E X T ,  
     p r i o r i t y   T E X T ,  
     c l i e n t _ i d   T E X T ,  
     c l i e n t _ n a m e   T E X T ,  
     a s s i g n e d _ s t a f f   T E X T ,  
     a s s i g n e d _ s t a f f _ n a m e   T E X T ,  
     s t a r t _ d a t e   D A T E ,  
     e n d _ d a t e   D A T E ,  
     n o t e s   T E X T ,  
     t a g s   J S O N B  
 ) ;  
 A L T E R   T A B L E   p u b l i c . s c h o o l _ c l a s s e s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 D R O P   P O L I C Y   I F   E X I S T S   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . s c h o o l _ c l a s s e s ;  
 C R E A T E   P O L I C Y   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . s c h o o l _ c l a s s e s   F O R   A L L   U S I N G   ( a u t h . r o l e ( )   =   ' a u t h e n t i c a t e d ' ) ;  
  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   p u b l i c . s c h o o l _ s e s s i o n s   (  
     i d   U U I D   P R I M A R Y   K E Y   D E F A U L T   g e n _ r a n d o m _ u u i d ( ) ,  
     c r e a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     u p d a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     c r e a t e d _ b y   T E X T ,  
     c o m p a n y _ i d   T E X T ,  
     c a s e _ i d   T E X T ,  
     c a s e _ t i t l e   T E X T ,  
     t i t l e   T E X T ,  
     d a t e   D A T E ,  
     t i m e   T E X T ,  
     v e n u e _ n a m e   T E X T ,  
     s t a f f _ e m a i l   T E X T ,  
     s t a f f _ n a m e   T E X T ,  
     s t a t u s   T E X T ,  
     n o t e s   T E X T ,  
     o u t c o m e   T E X T  
 ) ;  
 A L T E R   T A B L E   p u b l i c . s c h o o l _ s e s s i o n s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 D R O P   P O L I C Y   I F   E X I S T S   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . s c h o o l _ s e s s i o n s ;  
 C R E A T E   P O L I C Y   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . s c h o o l _ s e s s i o n s   F O R   A L L   U S I N G   ( a u t h . r o l e ( )   =   ' a u t h e n t i c a t e d ' ) ;  
  
 - -   H O S P I T A L   T A B L E S  
  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   p u b l i c . h o s p i t a l _ p a t i e n t s   (  
     i d   U U I D   P R I M A R Y   K E Y   D E F A U L T   g e n _ r a n d o m _ u u i d ( ) ,  
     c r e a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     u p d a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     c r e a t e d _ b y   T E X T ,  
     c o m p a n y _ i d   T E X T ,  
     t y p e   T E X T ,  
     n a m e   T E X T ,  
     e m a i l   T E X T ,  
     p h o n e   T E X T ,  
     a d d r e s s   T E X T ,  
     c i t y   T E X T ,  
     c o u n t r y   T E X T ,  
     i d _ n u m b e r   T E X T ,  
     s t a t u s   T E X T ,  
     n o t e s   T E X T ,  
     t o t a l _ c a s e s   N U M E R I C ,  
     t o t a l _ b i l l e d   N U M E R I C  
 ) ;  
 A L T E R   T A B L E   p u b l i c . h o s p i t a l _ p a t i e n t s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 D R O P   P O L I C Y   I F   E X I S T S   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . h o s p i t a l _ p a t i e n t s ;  
 C R E A T E   P O L I C Y   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . h o s p i t a l _ p a t i e n t s   F O R   A L L   U S I N G   ( a u t h . r o l e ( )   =   ' a u t h e n t i c a t e d ' ) ;  
  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   p u b l i c . h o s p i t a l _ a d m i s s i o n s   (  
     i d   U U I D   P R I M A R Y   K E Y   D E F A U L T   g e n _ r a n d o m _ u u i d ( ) ,  
     c r e a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     u p d a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     c r e a t e d _ b y   T E X T ,  
     c o m p a n y _ i d   T E X T ,  
     c a s e _ n u m b e r   T E X T ,  
     t i t l e   T E X T ,  
     d e s c r i p t i o n   T E X T ,  
     c a s e _ t y p e   T E X T ,  
     s t a t u s   T E X T ,  
     p r i o r i t y   T E X T ,  
     c l i e n t _ i d   T E X T ,  
     c l i e n t _ n a m e   T E X T ,  
     a s s i g n e d _ s t a f f   T E X T ,  
     a s s i g n e d _ s t a f f _ n a m e   T E X T ,  
     s t a r t _ d a t e   D A T E ,  
     e n d _ d a t e   D A T E ,  
     n o t e s   T E X T ,  
     t a g s   J S O N B  
 ) ;  
 A L T E R   T A B L E   p u b l i c . h o s p i t a l _ a d m i s s i o n s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 D R O P   P O L I C Y   I F   E X I S T S   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . h o s p i t a l _ a d m i s s i o n s ;  
 C R E A T E   P O L I C Y   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . h o s p i t a l _ a d m i s s i o n s   F O R   A L L   U S I N G   ( a u t h . r o l e ( )   =   ' a u t h e n t i c a t e d ' ) ;  
  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   p u b l i c . h o s p i t a l _ a p p o i n t m e n t s   (  
     i d   U U I D   P R I M A R Y   K E Y   D E F A U L T   g e n _ r a n d o m _ u u i d ( ) ,  
     c r e a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     u p d a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     c r e a t e d _ b y   T E X T ,  
     c o m p a n y _ i d   T E X T ,  
     c a s e _ i d   T E X T ,  
     c a s e _ t i t l e   T E X T ,  
     t i t l e   T E X T ,  
     d a t e   D A T E ,  
     t i m e   T E X T ,  
     v e n u e _ n a m e   T E X T ,  
     s t a f f _ e m a i l   T E X T ,  
     s t a f f _ n a m e   T E X T ,  
     s t a t u s   T E X T ,  
     n o t e s   T E X T ,  
     o u t c o m e   T E X T  
 ) ;  
 A L T E R   T A B L E   p u b l i c . h o s p i t a l _ a p p o i n t m e n t s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 D R O P   P O L I C Y   I F   E X I S T S   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . h o s p i t a l _ a p p o i n t m e n t s ;  
 C R E A T E   P O L I C Y   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . h o s p i t a l _ a p p o i n t m e n t s   F O R   A L L   U S I N G   ( a u t h . r o l e ( )   =   ' a u t h e n t i c a t e d ' ) ;  
  
 - -   H O T E L   T A B L E S  
  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   p u b l i c . h o t e l _ g u e s t s   (  
     i d   U U I D   P R I M A R Y   K E Y   D E F A U L T   g e n _ r a n d o m _ u u i d ( ) ,  
     c r e a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     u p d a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     c r e a t e d _ b y   T E X T ,  
     c o m p a n y _ i d   T E X T ,  
     t y p e   T E X T ,  
     n a m e   T E X T ,  
     e m a i l   T E X T ,  
     p h o n e   T E X T ,  
     a d d r e s s   T E X T ,  
     c i t y   T E X T ,  
     c o u n t r y   T E X T ,  
     i d _ n u m b e r   T E X T ,  
     s t a t u s   T E X T ,  
     n o t e s   T E X T ,  
     t o t a l _ c a s e s   N U M E R I C ,  
     t o t a l _ b i l l e d   N U M E R I C  
 ) ;  
 A L T E R   T A B L E   p u b l i c . h o t e l _ g u e s t s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 D R O P   P O L I C Y   I F   E X I S T S   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . h o t e l _ g u e s t s ;  
 C R E A T E   P O L I C Y   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . h o t e l _ g u e s t s   F O R   A L L   U S I N G   ( a u t h . r o l e ( )   =   ' a u t h e n t i c a t e d ' ) ;  
  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   p u b l i c . h o t e l _ b o o k i n g s   (  
     i d   U U I D   P R I M A R Y   K E Y   D E F A U L T   g e n _ r a n d o m _ u u i d ( ) ,  
     c r e a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     u p d a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     c r e a t e d _ b y   T E X T ,  
     c o m p a n y _ i d   T E X T ,  
     c a s e _ n u m b e r   T E X T ,  
     t i t l e   T E X T ,  
     d e s c r i p t i o n   T E X T ,  
     c a s e _ t y p e   T E X T ,  
     s t a t u s   T E X T ,  
     p r i o r i t y   T E X T ,  
     c l i e n t _ i d   T E X T ,  
     c l i e n t _ n a m e   T E X T ,  
     a s s i g n e d _ s t a f f   T E X T ,  
     a s s i g n e d _ s t a f f _ n a m e   T E X T ,  
     s t a r t _ d a t e   D A T E ,  
     e n d _ d a t e   D A T E ,  
     n o t e s   T E X T ,  
     t a g s   J S O N B  
 ) ;  
 A L T E R   T A B L E   p u b l i c . h o t e l _ b o o k i n g s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 D R O P   P O L I C Y   I F   E X I S T S   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . h o t e l _ b o o k i n g s ;  
 C R E A T E   P O L I C Y   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . h o t e l _ b o o k i n g s   F O R   A L L   U S I N G   ( a u t h . r o l e ( )   =   ' a u t h e n t i c a t e d ' ) ;  
  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   p u b l i c . h o t e l _ r e s e r v a t i o n s   (  
     i d   U U I D   P R I M A R Y   K E Y   D E F A U L T   g e n _ r a n d o m _ u u i d ( ) ,  
     c r e a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     u p d a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     c r e a t e d _ b y   T E X T ,  
     c o m p a n y _ i d   T E X T ,  
     c a s e _ i d   T E X T ,  
     c a s e _ t i t l e   T E X T ,  
     t i t l e   T E X T ,  
     d a t e   D A T E ,  
     t i m e   T E X T ,  
     v e n u e _ n a m e   T E X T ,  
     s t a f f _ e m a i l   T E X T ,  
     s t a f f _ n a m e   T E X T ,  
     s t a t u s   T E X T ,  
     n o t e s   T E X T ,  
     o u t c o m e   T E X T  
 ) ;  
 A L T E R   T A B L E   p u b l i c . h o t e l _ r e s e r v a t i o n s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 D R O P   P O L I C Y   I F   E X I S T S   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . h o t e l _ r e s e r v a t i o n s ;  
 C R E A T E   P O L I C Y   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . h o t e l _ r e s e r v a t i o n s   F O R   A L L   U S I N G   ( a u t h . r o l e ( )   =   ' a u t h e n t i c a t e d ' ) ;  
  
 - -   C H U R C H   T A B L E S  
  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   p u b l i c . c h u r c h _ m e m b e r s   (  
     i d   U U I D   P R I M A R Y   K E Y   D E F A U L T   g e n _ r a n d o m _ u u i d ( ) ,  
     c r e a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     u p d a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     c r e a t e d _ b y   T E X T ,  
     c o m p a n y _ i d   T E X T ,  
     t y p e   T E X T ,  
     n a m e   T E X T ,  
     e m a i l   T E X T ,  
     p h o n e   T E X T ,  
     a d d r e s s   T E X T ,  
     c i t y   T E X T ,  
     c o u n t r y   T E X T ,  
     i d _ n u m b e r   T E X T ,  
     s t a t u s   T E X T ,  
     n o t e s   T E X T ,  
     t o t a l _ c a s e s   N U M E R I C ,  
     t o t a l _ b i l l e d   N U M E R I C  
 ) ;  
 A L T E R   T A B L E   p u b l i c . c h u r c h _ m e m b e r s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 D R O P   P O L I C Y   I F   E X I S T S   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . c h u r c h _ m e m b e r s ;  
 C R E A T E   P O L I C Y   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . c h u r c h _ m e m b e r s   F O R   A L L   U S I N G   ( a u t h . r o l e ( )   =   ' a u t h e n t i c a t e d ' ) ;  
  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   p u b l i c . c h u r c h _ m i n i s t r i e s   (  
     i d   U U I D   P R I M A R Y   K E Y   D E F A U L T   g e n _ r a n d o m _ u u i d ( ) ,  
     c r e a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     u p d a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     c r e a t e d _ b y   T E X T ,  
     c o m p a n y _ i d   T E X T ,  
     c a s e _ n u m b e r   T E X T ,  
     t i t l e   T E X T ,  
     d e s c r i p t i o n   T E X T ,  
     c a s e _ t y p e   T E X T ,  
     s t a t u s   T E X T ,  
     p r i o r i t y   T E X T ,  
     c l i e n t _ i d   T E X T ,  
     c l i e n t _ n a m e   T E X T ,  
     a s s i g n e d _ s t a f f   T E X T ,  
     a s s i g n e d _ s t a f f _ n a m e   T E X T ,  
     s t a r t _ d a t e   D A T E ,  
     e n d _ d a t e   D A T E ,  
     n o t e s   T E X T ,  
     t a g s   J S O N B  
 ) ;  
 A L T E R   T A B L E   p u b l i c . c h u r c h _ m i n i s t r i e s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 D R O P   P O L I C Y   I F   E X I S T S   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . c h u r c h _ m i n i s t r i e s ;  
 C R E A T E   P O L I C Y   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . c h u r c h _ m i n i s t r i e s   F O R   A L L   U S I N G   ( a u t h . r o l e ( )   =   ' a u t h e n t i c a t e d ' ) ;  
  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   p u b l i c . c h u r c h _ e v e n t s   (  
     i d   U U I D   P R I M A R Y   K E Y   D E F A U L T   g e n _ r a n d o m _ u u i d ( ) ,  
     c r e a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     u p d a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     c r e a t e d _ b y   T E X T ,  
     c o m p a n y _ i d   T E X T ,  
     c a s e _ i d   T E X T ,  
     c a s e _ t i t l e   T E X T ,  
     t i t l e   T E X T ,  
     d a t e   D A T E ,  
     t i m e   T E X T ,  
     v e n u e _ n a m e   T E X T ,  
     s t a f f _ e m a i l   T E X T ,  
     s t a f f _ n a m e   T E X T ,  
     s t a t u s   T E X T ,  
     n o t e s   T E X T ,  
     o u t c o m e   T E X T  
 ) ;  
 A L T E R   T A B L E   p u b l i c . c h u r c h _ e v e n t s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 D R O P   P O L I C Y   I F   E X I S T S   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . c h u r c h _ e v e n t s ;  
 C R E A T E   P O L I C Y   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . c h u r c h _ e v e n t s   F O R   A L L   U S I N G   ( a u t h . r o l e ( )   =   ' a u t h e n t i c a t e d ' ) ;  
  
 - -   I N S U R A N C E   T A B L E S  
  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   p u b l i c . i n s u r a n c e _ p o l i c y h o l d e r s   (  
     i d   U U I D   P R I M A R Y   K E Y   D E F A U L T   g e n _ r a n d o m _ u u i d ( ) ,  
     c r e a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     u p d a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     c r e a t e d _ b y   T E X T ,  
     c o m p a n y _ i d   T E X T ,  
     t y p e   T E X T ,  
     n a m e   T E X T ,  
     e m a i l   T E X T ,  
     p h o n e   T E X T ,  
     a d d r e s s   T E X T ,  
     c i t y   T E X T ,  
     c o u n t r y   T E X T ,  
     i d _ n u m b e r   T E X T ,  
     s t a t u s   T E X T ,  
     n o t e s   T E X T ,  
     t o t a l _ c a s e s   N U M E R I C ,  
     t o t a l _ b i l l e d   N U M E R I C  
 ) ;  
 A L T E R   T A B L E   p u b l i c . i n s u r a n c e _ p o l i c y h o l d e r s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 D R O P   P O L I C Y   I F   E X I S T S   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . i n s u r a n c e _ p o l i c y h o l d e r s ;  
 C R E A T E   P O L I C Y   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . i n s u r a n c e _ p o l i c y h o l d e r s   F O R   A L L   U S I N G   ( a u t h . r o l e ( )   =   ' a u t h e n t i c a t e d ' ) ;  
  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   p u b l i c . i n s u r a n c e _ c l a i m s   (  
     i d   U U I D   P R I M A R Y   K E Y   D E F A U L T   g e n _ r a n d o m _ u u i d ( ) ,  
     c r e a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     u p d a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     c r e a t e d _ b y   T E X T ,  
     c o m p a n y _ i d   T E X T ,  
     c a s e _ n u m b e r   T E X T ,  
     t i t l e   T E X T ,  
     d e s c r i p t i o n   T E X T ,  
     c a s e _ t y p e   T E X T ,  
     s t a t u s   T E X T ,  
     p r i o r i t y   T E X T ,  
     c l i e n t _ i d   T E X T ,  
     c l i e n t _ n a m e   T E X T ,  
     a s s i g n e d _ s t a f f   T E X T ,  
     a s s i g n e d _ s t a f f _ n a m e   T E X T ,  
     s t a r t _ d a t e   D A T E ,  
     e n d _ d a t e   D A T E ,  
     n o t e s   T E X T ,  
     t a g s   J S O N B  
 ) ;  
 A L T E R   T A B L E   p u b l i c . i n s u r a n c e _ c l a i m s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 D R O P   P O L I C Y   I F   E X I S T S   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . i n s u r a n c e _ c l a i m s ;  
 C R E A T E   P O L I C Y   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . i n s u r a n c e _ c l a i m s   F O R   A L L   U S I N G   ( a u t h . r o l e ( )   =   ' a u t h e n t i c a t e d ' ) ;  
  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   p u b l i c . i n s u r a n c e _ m e e t i n g s   (  
     i d   U U I D   P R I M A R Y   K E Y   D E F A U L T   g e n _ r a n d o m _ u u i d ( ) ,  
     c r e a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     u p d a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     c r e a t e d _ b y   T E X T ,  
     c o m p a n y _ i d   T E X T ,  
     c a s e _ i d   T E X T ,  
     c a s e _ t i t l e   T E X T ,  
     t i t l e   T E X T ,  
     d a t e   D A T E ,  
     t i m e   T E X T ,  
     v e n u e _ n a m e   T E X T ,  
     s t a f f _ e m a i l   T E X T ,  
     s t a f f _ n a m e   T E X T ,  
     s t a t u s   T E X T ,  
     n o t e s   T E X T ,  
     o u t c o m e   T E X T  
 ) ;  
 A L T E R   T A B L E   p u b l i c . i n s u r a n c e _ m e e t i n g s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 D R O P   P O L I C Y   I F   E X I S T S   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . i n s u r a n c e _ m e e t i n g s ;  
 C R E A T E   P O L I C Y   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . i n s u r a n c e _ m e e t i n g s   F O R   A L L   U S I N G   ( a u t h . r o l e ( )   =   ' a u t h e n t i c a t e d ' ) ;  
  
 - -   R E T A I L   T A B L E S  
  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   p u b l i c . r e t a i l _ c u s t o m e r s   (  
     i d   U U I D   P R I M A R Y   K E Y   D E F A U L T   g e n _ r a n d o m _ u u i d ( ) ,  
     c r e a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     u p d a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     c r e a t e d _ b y   T E X T ,  
     c o m p a n y _ i d   T E X T ,  
     t y p e   T E X T ,  
     n a m e   T E X T ,  
     e m a i l   T E X T ,  
     p h o n e   T E X T ,  
     a d d r e s s   T E X T ,  
     c i t y   T E X T ,  
     c o u n t r y   T E X T ,  
     i d _ n u m b e r   T E X T ,  
     s t a t u s   T E X T ,  
     n o t e s   T E X T ,  
     t o t a l _ c a s e s   N U M E R I C ,  
     t o t a l _ b i l l e d   N U M E R I C  
 ) ;  
 A L T E R   T A B L E   p u b l i c . r e t a i l _ c u s t o m e r s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 D R O P   P O L I C Y   I F   E X I S T S   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . r e t a i l _ c u s t o m e r s ;  
 C R E A T E   P O L I C Y   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . r e t a i l _ c u s t o m e r s   F O R   A L L   U S I N G   ( a u t h . r o l e ( )   =   ' a u t h e n t i c a t e d ' ) ;  
  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   p u b l i c . r e t a i l _ o r d e r s   (  
     i d   U U I D   P R I M A R Y   K E Y   D E F A U L T   g e n _ r a n d o m _ u u i d ( ) ,  
     c r e a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     u p d a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     c r e a t e d _ b y   T E X T ,  
     c o m p a n y _ i d   T E X T ,  
     c a s e _ n u m b e r   T E X T ,  
     t i t l e   T E X T ,  
     d e s c r i p t i o n   T E X T ,  
     c a s e _ t y p e   T E X T ,  
     s t a t u s   T E X T ,  
     p r i o r i t y   T E X T ,  
     c l i e n t _ i d   T E X T ,  
     c l i e n t _ n a m e   T E X T ,  
     a s s i g n e d _ s t a f f   T E X T ,  
     a s s i g n e d _ s t a f f _ n a m e   T E X T ,  
     s t a r t _ d a t e   D A T E ,  
     e n d _ d a t e   D A T E ,  
     n o t e s   T E X T ,  
     t a g s   J S O N B  
 ) ;  
 A L T E R   T A B L E   p u b l i c . r e t a i l _ o r d e r s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 D R O P   P O L I C Y   I F   E X I S T S   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . r e t a i l _ o r d e r s ;  
 C R E A T E   P O L I C Y   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . r e t a i l _ o r d e r s   F O R   A L L   U S I N G   ( a u t h . r o l e ( )   =   ' a u t h e n t i c a t e d ' ) ;  
  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   p u b l i c . r e t a i l _ s h i f t s   (  
     i d   U U I D   P R I M A R Y   K E Y   D E F A U L T   g e n _ r a n d o m _ u u i d ( ) ,  
     c r e a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     u p d a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     c r e a t e d _ b y   T E X T ,  
     c o m p a n y _ i d   T E X T ,  
     c a s e _ i d   T E X T ,  
     c a s e _ t i t l e   T E X T ,  
     t i t l e   T E X T ,  
     d a t e   D A T E ,  
     t i m e   T E X T ,  
     v e n u e _ n a m e   T E X T ,  
     s t a f f _ e m a i l   T E X T ,  
     s t a f f _ n a m e   T E X T ,  
     s t a t u s   T E X T ,  
     n o t e s   T E X T ,  
     o u t c o m e   T E X T  
 ) ;  
 A L T E R   T A B L E   p u b l i c . r e t a i l _ s h i f t s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 D R O P   P O L I C Y   I F   E X I S T S   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . r e t a i l _ s h i f t s ;  
 C R E A T E   P O L I C Y   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . r e t a i l _ s h i f t s   F O R   A L L   U S I N G   ( a u t h . r o l e ( )   =   ' a u t h e n t i c a t e d ' ) ;  
  
 - -   L O G I S T I C S   T A B L E S  
  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   p u b l i c . l o g i s t i c s _ s h i p p e r s   (  
     i d   U U I D   P R I M A R Y   K E Y   D E F A U L T   g e n _ r a n d o m _ u u i d ( ) ,  
     c r e a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     u p d a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     c r e a t e d _ b y   T E X T ,  
     c o m p a n y _ i d   T E X T ,  
     t y p e   T E X T ,  
     n a m e   T E X T ,  
     e m a i l   T E X T ,  
     p h o n e   T E X T ,  
     a d d r e s s   T E X T ,  
     c i t y   T E X T ,  
     c o u n t r y   T E X T ,  
     i d _ n u m b e r   T E X T ,  
     s t a t u s   T E X T ,  
     n o t e s   T E X T ,  
     t o t a l _ c a s e s   N U M E R I C ,  
     t o t a l _ b i l l e d   N U M E R I C  
 ) ;  
 A L T E R   T A B L E   p u b l i c . l o g i s t i c s _ s h i p p e r s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 D R O P   P O L I C Y   I F   E X I S T S   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . l o g i s t i c s _ s h i p p e r s ;  
 C R E A T E   P O L I C Y   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . l o g i s t i c s _ s h i p p e r s   F O R   A L L   U S I N G   ( a u t h . r o l e ( )   =   ' a u t h e n t i c a t e d ' ) ;  
  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   p u b l i c . l o g i s t i c s _ s h i p m e n t s   (  
     i d   U U I D   P R I M A R Y   K E Y   D E F A U L T   g e n _ r a n d o m _ u u i d ( ) ,  
     c r e a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     u p d a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     c r e a t e d _ b y   T E X T ,  
     c o m p a n y _ i d   T E X T ,  
     c a s e _ n u m b e r   T E X T ,  
     t i t l e   T E X T ,  
     d e s c r i p t i o n   T E X T ,  
     c a s e _ t y p e   T E X T ,  
     s t a t u s   T E X T ,  
     p r i o r i t y   T E X T ,  
     c l i e n t _ i d   T E X T ,  
     c l i e n t _ n a m e   T E X T ,  
     a s s i g n e d _ s t a f f   T E X T ,  
     a s s i g n e d _ s t a f f _ n a m e   T E X T ,  
     s t a r t _ d a t e   D A T E ,  
     e n d _ d a t e   D A T E ,  
     n o t e s   T E X T ,  
     t a g s   J S O N B  
 ) ;  
 A L T E R   T A B L E   p u b l i c . l o g i s t i c s _ s h i p m e n t s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 D R O P   P O L I C Y   I F   E X I S T S   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . l o g i s t i c s _ s h i p m e n t s ;  
 C R E A T E   P O L I C Y   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . l o g i s t i c s _ s h i p m e n t s   F O R   A L L   U S I N G   ( a u t h . r o l e ( )   =   ' a u t h e n t i c a t e d ' ) ;  
  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   p u b l i c . l o g i s t i c s _ d i s p a t c h e s   (  
     i d   U U I D   P R I M A R Y   K E Y   D E F A U L T   g e n _ r a n d o m _ u u i d ( ) ,  
     c r e a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     u p d a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     c r e a t e d _ b y   T E X T ,  
     c o m p a n y _ i d   T E X T ,  
     c a s e _ i d   T E X T ,  
     c a s e _ t i t l e   T E X T ,  
     t i t l e   T E X T ,  
     d a t e   D A T E ,  
     t i m e   T E X T ,  
     v e n u e _ n a m e   T E X T ,  
     s t a f f _ e m a i l   T E X T ,  
     s t a f f _ n a m e   T E X T ,  
     s t a t u s   T E X T ,  
     n o t e s   T E X T ,  
     o u t c o m e   T E X T  
 ) ;  
 A L T E R   T A B L E   p u b l i c . l o g i s t i c s _ d i s p a t c h e s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 D R O P   P O L I C Y   I F   E X I S T S   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . l o g i s t i c s _ d i s p a t c h e s ;  
 C R E A T E   P O L I C Y   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . l o g i s t i c s _ d i s p a t c h e s   F O R   A L L   U S I N G   ( a u t h . r o l e ( )   =   ' a u t h e n t i c a t e d ' ) ;  
  
 - -   H R   T A B L E S  
  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   p u b l i c . h r _ e m p l o y e e s   (  
     i d   U U I D   P R I M A R Y   K E Y   D E F A U L T   g e n _ r a n d o m _ u u i d ( ) ,  
     c r e a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     u p d a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     c r e a t e d _ b y   T E X T ,  
     c o m p a n y _ i d   T E X T ,  
     t y p e   T E X T ,  
     n a m e   T E X T ,  
     e m a i l   T E X T ,  
     p h o n e   T E X T ,  
     a d d r e s s   T E X T ,  
     c i t y   T E X T ,  
     c o u n t r y   T E X T ,  
     i d _ n u m b e r   T E X T ,  
     s t a t u s   T E X T ,  
     n o t e s   T E X T ,  
     t o t a l _ c a s e s   N U M E R I C ,  
     t o t a l _ b i l l e d   N U M E R I C  
 ) ;  
 A L T E R   T A B L E   p u b l i c . h r _ e m p l o y e e s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 D R O P   P O L I C Y   I F   E X I S T S   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . h r _ e m p l o y e e s ;  
 C R E A T E   P O L I C Y   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . h r _ e m p l o y e e s   F O R   A L L   U S I N G   ( a u t h . r o l e ( )   =   ' a u t h e n t i c a t e d ' ) ;  
  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   p u b l i c . h r _ p r o j e c t s   (  
     i d   U U I D   P R I M A R Y   K E Y   D E F A U L T   g e n _ r a n d o m _ u u i d ( ) ,  
     c r e a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     u p d a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     c r e a t e d _ b y   T E X T ,  
     c o m p a n y _ i d   T E X T ,  
     c a s e _ n u m b e r   T E X T ,  
     t i t l e   T E X T ,  
     d e s c r i p t i o n   T E X T ,  
     c a s e _ t y p e   T E X T ,  
     s t a t u s   T E X T ,  
     p r i o r i t y   T E X T ,  
     c l i e n t _ i d   T E X T ,  
     c l i e n t _ n a m e   T E X T ,  
     a s s i g n e d _ s t a f f   T E X T ,  
     a s s i g n e d _ s t a f f _ n a m e   T E X T ,  
     s t a r t _ d a t e   D A T E ,  
     e n d _ d a t e   D A T E ,  
     n o t e s   T E X T ,  
     t a g s   J S O N B  
 ) ;  
 A L T E R   T A B L E   p u b l i c . h r _ p r o j e c t s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 D R O P   P O L I C Y   I F   E X I S T S   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . h r _ p r o j e c t s ;  
 C R E A T E   P O L I C Y   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . h r _ p r o j e c t s   F O R   A L L   U S I N G   ( a u t h . r o l e ( )   =   ' a u t h e n t i c a t e d ' ) ;  
  
 C R E A T E   T A B L E   I F   N O T   E X I S T S   p u b l i c . h r _ i n t e r v i e w s   (  
     i d   U U I D   P R I M A R Y   K E Y   D E F A U L T   g e n _ r a n d o m _ u u i d ( ) ,  
     c r e a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     u p d a t e d _ d a t e   T I M E S T A M P T Z   D E F A U L T   n o w ( ) ,  
     c r e a t e d _ b y   T E X T ,  
     c o m p a n y _ i d   T E X T ,  
     c a s e _ i d   T E X T ,  
     c a s e _ t i t l e   T E X T ,  
     t i t l e   T E X T ,  
     d a t e   D A T E ,  
     t i m e   T E X T ,  
     v e n u e _ n a m e   T E X T ,  
     s t a f f _ e m a i l   T E X T ,  
     s t a f f _ n a m e   T E X T ,  
     s t a t u s   T E X T ,  
     n o t e s   T E X T ,  
     o u t c o m e   T E X T  
 ) ;  
 A L T E R   T A B L E   p u b l i c . h r _ i n t e r v i e w s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
 D R O P   P O L I C Y   I F   E X I S T S   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . h r _ i n t e r v i e w s ;  
 C R E A T E   P O L I C Y   " E n a b l e   a l l   f o r   a u t h e n t i c a t e d   u s e r s "   O N   p u b l i c . h r _ i n t e r v i e w s   F O R   A L L   U S I N G   ( a u t h . r o l e ( )   =   ' a u t h e n t i c a t e d ' ) ;  
 

-- SCHOOL TABLES

CREATE TABLE IF NOT EXISTS public.school_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  type TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  id_number TEXT,
  status TEXT,
  notes TEXT,
  total_cases NUMERIC,
  total_billed NUMERIC
);
ALTER TABLE public.school_students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.school_students;
CREATE POLICY "Enable all for authenticated users" ON public.school_students FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.school_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  case_number TEXT,
  title TEXT,
  description TEXT,
  case_type TEXT,
  status TEXT,
  priority TEXT,
  client_id TEXT,
  client_name TEXT,
  assigned_staff TEXT,
  assigned_staff_name TEXT,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  tags JSONB
);
ALTER TABLE public.school_classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.school_classes;
CREATE POLICY "Enable all for authenticated users" ON public.school_classes FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.school_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  case_id TEXT,
  case_title TEXT,
  title TEXT,
  date DATE,
  time TEXT,
  venue_name TEXT,
  staff_email TEXT,
  staff_name TEXT,
  status TEXT,
  notes TEXT,
  outcome TEXT
);
ALTER TABLE public.school_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.school_sessions;
CREATE POLICY "Enable all for authenticated users" ON public.school_sessions FOR ALL USING (auth.role() = 'authenticated');

-- HOSPITAL TABLES

CREATE TABLE IF NOT EXISTS public.hospital_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  type TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  id_number TEXT,
  status TEXT,
  notes TEXT,
  total_cases NUMERIC,
  total_billed NUMERIC
);
ALTER TABLE public.hospital_patients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.hospital_patients;
CREATE POLICY "Enable all for authenticated users" ON public.hospital_patients FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.hospital_admissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  case_number TEXT,
  title TEXT,
  description TEXT,
  case_type TEXT,
  status TEXT,
  priority TEXT,
  client_id TEXT,
  client_name TEXT,
  assigned_staff TEXT,
  assigned_staff_name TEXT,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  tags JSONB
);
ALTER TABLE public.hospital_admissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.hospital_admissions;
CREATE POLICY "Enable all for authenticated users" ON public.hospital_admissions FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.hospital_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  case_id TEXT,
  case_title TEXT,
  title TEXT,
  date DATE,
  time TEXT,
  venue_name TEXT,
  staff_email TEXT,
  staff_name TEXT,
  status TEXT,
  notes TEXT,
  outcome TEXT
);
ALTER TABLE public.hospital_appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.hospital_appointments;
CREATE POLICY "Enable all for authenticated users" ON public.hospital_appointments FOR ALL USING (auth.role() = 'authenticated');

-- HOTEL TABLES

CREATE TABLE IF NOT EXISTS public.hotel_guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  type TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  id_number TEXT,
  status TEXT,
  notes TEXT,
  total_cases NUMERIC,
  total_billed NUMERIC
);
ALTER TABLE public.hotel_guests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.hotel_guests;
CREATE POLICY "Enable all for authenticated users" ON public.hotel_guests FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.hotel_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  case_number TEXT,
  title TEXT,
  description TEXT,
  case_type TEXT,
  status TEXT,
  priority TEXT,
  client_id TEXT,
  client_name TEXT,
  assigned_staff TEXT,
  assigned_staff_name TEXT,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  tags JSONB
);
ALTER TABLE public.hotel_bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.hotel_bookings;
CREATE POLICY "Enable all for authenticated users" ON public.hotel_bookings FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.hotel_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  case_id TEXT,
  case_title TEXT,
  title TEXT,
  date DATE,
  time TEXT,
  venue_name TEXT,
  staff_email TEXT,
  staff_name TEXT,
  status TEXT,
  notes TEXT,
  outcome TEXT
);
ALTER TABLE public.hotel_reservations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.hotel_reservations;
CREATE POLICY "Enable all for authenticated users" ON public.hotel_reservations FOR ALL USING (auth.role() = 'authenticated');

-- CHURCH TABLES

CREATE TABLE IF NOT EXISTS public.church_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  type TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  id_number TEXT,
  status TEXT,
  notes TEXT,
  total_cases NUMERIC,
  total_billed NUMERIC
);
ALTER TABLE public.church_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.church_members;
CREATE POLICY "Enable all for authenticated users" ON public.church_members FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.church_ministries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  case_number TEXT,
  title TEXT,
  description TEXT,
  case_type TEXT,
  status TEXT,
  priority TEXT,
  client_id TEXT,
  client_name TEXT,
  assigned_staff TEXT,
  assigned_staff_name TEXT,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  tags JSONB
);
ALTER TABLE public.church_ministries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.church_ministries;
CREATE POLICY "Enable all for authenticated users" ON public.church_ministries FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.church_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  case_id TEXT,
  case_title TEXT,
  title TEXT,
  date DATE,
  time TEXT,
  venue_name TEXT,
  staff_email TEXT,
  staff_name TEXT,
  status TEXT,
  notes TEXT,
  outcome TEXT
);
ALTER TABLE public.church_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.church_events;
CREATE POLICY "Enable all for authenticated users" ON public.church_events FOR ALL USING (auth.role() = 'authenticated');

-- INSURANCE TABLES

CREATE TABLE IF NOT EXISTS public.insurance_policyholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  type TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  id_number TEXT,
  status TEXT,
  notes TEXT,
  total_cases NUMERIC,
  total_billed NUMERIC
);
ALTER TABLE public.insurance_policyholders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.insurance_policyholders;
CREATE POLICY "Enable all for authenticated users" ON public.insurance_policyholders FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.insurance_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  case_number TEXT,
  title TEXT,
  description TEXT,
  case_type TEXT,
  status TEXT,
  priority TEXT,
  client_id TEXT,
  client_name TEXT,
  assigned_staff TEXT,
  assigned_staff_name TEXT,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  tags JSONB
);
ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.insurance_claims;
CREATE POLICY "Enable all for authenticated users" ON public.insurance_claims FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.insurance_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  case_id TEXT,
  case_title TEXT,
  title TEXT,
  date DATE,
  time TEXT,
  venue_name TEXT,
  staff_email TEXT,
  staff_name TEXT,
  status TEXT,
  notes TEXT,
  outcome TEXT
);
ALTER TABLE public.insurance_meetings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.insurance_meetings;
CREATE POLICY "Enable all for authenticated users" ON public.insurance_meetings FOR ALL USING (auth.role() = 'authenticated');

-- RETAIL TABLES

CREATE TABLE IF NOT EXISTS public.retail_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  type TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  id_number TEXT,
  status TEXT,
  notes TEXT,
  total_cases NUMERIC,
  total_billed NUMERIC
);
ALTER TABLE public.retail_customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.retail_customers;
CREATE POLICY "Enable all for authenticated users" ON public.retail_customers FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.retail_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  case_number TEXT,
  title TEXT,
  description TEXT,
  case_type TEXT,
  status TEXT,
  priority TEXT,
  client_id TEXT,
  client_name TEXT,
  assigned_staff TEXT,
  assigned_staff_name TEXT,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  tags JSONB
);
ALTER TABLE public.retail_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.retail_orders;
CREATE POLICY "Enable all for authenticated users" ON public.retail_orders FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.retail_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  case_id TEXT,
  case_title TEXT,
  title TEXT,
  date DATE,
  time TEXT,
  venue_name TEXT,
  staff_email TEXT,
  staff_name TEXT,
  status TEXT,
  notes TEXT,
  outcome TEXT
);
ALTER TABLE public.retail_shifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.retail_shifts;
CREATE POLICY "Enable all for authenticated users" ON public.retail_shifts FOR ALL USING (auth.role() = 'authenticated');

-- LOGISTICS TABLES

CREATE TABLE IF NOT EXISTS public.logistics_shippers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  type TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  id_number TEXT,
  status TEXT,
  notes TEXT,
  total_cases NUMERIC,
  total_billed NUMERIC
);
ALTER TABLE public.logistics_shippers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.logistics_shippers;
CREATE POLICY "Enable all for authenticated users" ON public.logistics_shippers FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.logistics_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  case_number TEXT,
  title TEXT,
  description TEXT,
  case_type TEXT,
  status TEXT,
  priority TEXT,
  client_id TEXT,
  client_name TEXT,
  assigned_staff TEXT,
  assigned_staff_name TEXT,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  tags JSONB
);
ALTER TABLE public.logistics_shipments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.logistics_shipments;
CREATE POLICY "Enable all for authenticated users" ON public.logistics_shipments FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.logistics_dispatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  case_id TEXT,
  case_title TEXT,
  title TEXT,
  date DATE,
  time TEXT,
  venue_name TEXT,
  staff_email TEXT,
  staff_name TEXT,
  status TEXT,
  notes TEXT,
  outcome TEXT
);
ALTER TABLE public.logistics_dispatches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.logistics_dispatches;
CREATE POLICY "Enable all for authenticated users" ON public.logistics_dispatches FOR ALL USING (auth.role() = 'authenticated');

-- HR TABLES

CREATE TABLE IF NOT EXISTS public.hr_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  type TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  id_number TEXT,
  status TEXT,
  notes TEXT,
  total_cases NUMERIC,
  total_billed NUMERIC
);
ALTER TABLE public.hr_employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.hr_employees;
CREATE POLICY "Enable all for authenticated users" ON public.hr_employees FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.hr_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  case_number TEXT,
  title TEXT,
  description TEXT,
  case_type TEXT,
  status TEXT,
  priority TEXT,
  client_id TEXT,
  client_name TEXT,
  assigned_staff TEXT,
  assigned_staff_name TEXT,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  tags JSONB
);
ALTER TABLE public.hr_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.hr_projects;
CREATE POLICY "Enable all for authenticated users" ON public.hr_projects FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.hr_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  case_id TEXT,
  case_title TEXT,
  title TEXT,
  date DATE,
  time TEXT,
  venue_name TEXT,
  staff_email TEXT,
  staff_name TEXT,
  status TEXT,
  notes TEXT,
  outcome TEXT
);
ALTER TABLE public.hr_interviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.hr_interviews;
CREATE POLICY "Enable all for authenticated users" ON public.hr_interviews FOR ALL USING (auth.role() = 'authenticated');
