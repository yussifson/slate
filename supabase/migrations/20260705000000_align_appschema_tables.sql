-- Migration for missing DB tables

CREATE TABLE IF NOT EXISTS public.automation_dlq (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.automation_dlq ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "automation_dlq_all_access" ON public.automation_dlq;

CREATE POLICY "automation_dlq_all_access" ON public.automation_dlq
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.automation_dlq TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.automation_rule_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.automation_rule_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "automation_rule_versions_all_access" ON public.automation_rule_versions;

CREATE POLICY "automation_rule_versions_all_access" ON public.automation_rule_versions
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.automation_rule_versions TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_all_access" ON public.audit_logs;

CREATE POLICY "audit_logs_all_access" ON public.audit_logs
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.audit_logs TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.case_emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.case_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "case_emails_all_access" ON public.case_emails;

CREATE POLICY "case_emails_all_access" ON public.case_emails
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.case_emails TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.case_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.case_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "case_messages_all_access" ON public.case_messages;

CREATE POLICY "case_messages_all_access" ON public.case_messages
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.case_messages TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.case_outcomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.case_outcomes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "case_outcomes_all_access" ON public.case_outcomes;

CREATE POLICY "case_outcomes_all_access" ON public.case_outcomes
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.case_outcomes TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.case_pipelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.case_pipelines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "case_pipelines_all_access" ON public.case_pipelines;

CREATE POLICY "case_pipelines_all_access" ON public.case_pipelines
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.case_pipelines TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.case_pipeline_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.case_pipeline_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "case_pipeline_states_all_access" ON public.case_pipeline_states;

CREATE POLICY "case_pipeline_states_all_access" ON public.case_pipeline_states
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.case_pipeline_states TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clients_all_access" ON public.clients;

CREATE POLICY "clients_all_access" ON public.clients
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.clients TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.client_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.client_checklists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_checklists_all_access" ON public.client_checklists;

CREATE POLICY "client_checklists_all_access" ON public.client_checklists
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.client_checklists TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.client_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.client_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_messages_all_access" ON public.client_messages;

CREATE POLICY "client_messages_all_access" ON public.client_messages
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.client_messages TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "companies_all_access" ON public.companies;

CREATE POLICY "companies_all_access" ON public.companies
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.companies TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "documents_all_access" ON public.documents;

CREATE POLICY "documents_all_access" ON public.documents
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.documents TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "expenses_all_access" ON public.expenses;

CREATE POLICY "expenses_all_access" ON public.expenses
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.expenses TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.firm_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.firm_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "firm_settings_all_access" ON public.firm_settings;

CREATE POLICY "firm_settings_all_access" ON public.firm_settings
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.firm_settings TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.hearings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.hearings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hearings_all_access" ON public.hearings;

CREATE POLICY "hearings_all_access" ON public.hearings
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.hearings TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.h_r_complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.h_r_complaints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "h_r_complaints_all_access" ON public.h_r_complaints;

CREATE POLICY "h_r_complaints_all_access" ON public.h_r_complaints
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.h_r_complaints TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoices_all_access" ON public.invoices;

CREATE POLICY "invoices_all_access" ON public.invoices
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.invoices TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leads_all_access" ON public.leads;

CREATE POLICY "leads_all_access" ON public.leads
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.leads TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leave_requests_all_access" ON public.leave_requests;

CREATE POLICY "leave_requests_all_access" ON public.leave_requests
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.leave_requests TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.legal_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.legal_cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "legal_cases_all_access" ON public.legal_cases;

CREATE POLICY "legal_cases_all_access" ON public.legal_cases
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.legal_cases TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.linked_emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.linked_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "linked_emails_all_access" ON public.linked_emails;

CREATE POLICY "linked_emails_all_access" ON public.linked_emails
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.linked_emails TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_all_access" ON public.notifications;

CREATE POLICY "notifications_all_access" ON public.notifications
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.notifications TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.payroll_slips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.payroll_slips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payroll_slips_all_access" ON public.payroll_slips;

CREATE POLICY "payroll_slips_all_access" ON public.payroll_slips
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.payroll_slips TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "promotions_all_access" ON public.promotions;

CREATE POLICY "promotions_all_access" ON public.promotions
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.promotions TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.retainers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.retainers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "retainers_all_access" ON public.retainers;

CREATE POLICY "retainers_all_access" ON public.retainers
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.retainers TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.signature_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.signature_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "signature_requests_all_access" ON public.signature_requests;

CREATE POLICY "signature_requests_all_access" ON public.signature_requests
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.signature_requests TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.staff_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.staff_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_permissions_all_access" ON public.staff_permissions;

CREATE POLICY "staff_permissions_all_access" ON public.staff_permissions
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.staff_permissions TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.staff_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.staff_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_records_all_access" ON public.staff_records;

CREATE POLICY "staff_records_all_access" ON public.staff_records
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.staff_records TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.module_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.module_definitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "module_definitions_all_access" ON public.module_definitions;

CREATE POLICY "module_definitions_all_access" ON public.module_definitions
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.module_definitions TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.field_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.field_definitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "field_definitions_all_access" ON public.field_definitions;

CREATE POLICY "field_definitions_all_access" ON public.field_definitions
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.field_definitions TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.dynamic_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.dynamic_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dynamic_records_all_access" ON public.dynamic_records;

CREATE POLICY "dynamic_records_all_access" ON public.dynamic_records
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.dynamic_records TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.subscription_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscription_invoices_all_access" ON public.subscription_invoices;

CREATE POLICY "subscription_invoices_all_access" ON public.subscription_invoices
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.subscription_invoices TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tasks_all_access" ON public.tasks;

CREATE POLICY "tasks_all_access" ON public.tasks
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.tasks TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "time_entries_all_access" ON public.time_entries;

CREATE POLICY "time_entries_all_access" ON public.time_entries
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.time_entries TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_opd_queues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_opd_queues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_opd_queues_all_access" ON public.univ_opd_queues;

CREATE POLICY "univ_opd_queues_all_access" ON public.univ_opd_queues
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_opd_queues TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_all_access" ON public.profiles;

CREATE POLICY "profiles_all_access" ON public.profiles
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.profiles TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.hospital_patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.hospital_patients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hospital_patients_all_access" ON public.hospital_patients;

CREATE POLICY "hospital_patients_all_access" ON public.hospital_patients
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.hospital_patients TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.hospital_admissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.hospital_admissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hospital_admissions_all_access" ON public.hospital_admissions;

CREATE POLICY "hospital_admissions_all_access" ON public.hospital_admissions
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.hospital_admissions TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.hospital_appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.hospital_appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hospital_appointments_all_access" ON public.hospital_appointments;

CREATE POLICY "hospital_appointments_all_access" ON public.hospital_appointments
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.hospital_appointments TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.hotel_guests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.hotel_guests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hotel_guests_all_access" ON public.hotel_guests;

CREATE POLICY "hotel_guests_all_access" ON public.hotel_guests
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.hotel_guests TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.hotel_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.hotel_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hotel_bookings_all_access" ON public.hotel_bookings;

CREATE POLICY "hotel_bookings_all_access" ON public.hotel_bookings
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.hotel_bookings TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.hotel_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.hotel_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hotel_reservations_all_access" ON public.hotel_reservations;

CREATE POLICY "hotel_reservations_all_access" ON public.hotel_reservations
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.hotel_reservations TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.insurance_policyholders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.insurance_policyholders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insurance_policyholders_all_access" ON public.insurance_policyholders;

CREATE POLICY "insurance_policyholders_all_access" ON public.insurance_policyholders
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.insurance_policyholders TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.insurance_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insurance_claims_all_access" ON public.insurance_claims;

CREATE POLICY "insurance_claims_all_access" ON public.insurance_claims
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.insurance_claims TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.insurance_underwriting (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.insurance_underwriting ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insurance_underwriting_all_access" ON public.insurance_underwriting;

CREATE POLICY "insurance_underwriting_all_access" ON public.insurance_underwriting
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.insurance_underwriting TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.insurance_reinsurance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.insurance_reinsurance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insurance_reinsurance_all_access" ON public.insurance_reinsurance;

CREATE POLICY "insurance_reinsurance_all_access" ON public.insurance_reinsurance
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.insurance_reinsurance TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.insurance_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.insurance_agents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insurance_agents_all_access" ON public.insurance_agents;

CREATE POLICY "insurance_agents_all_access" ON public.insurance_agents
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.insurance_agents TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.insurance_premiums (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.insurance_premiums ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insurance_premiums_all_access" ON public.insurance_premiums;

CREATE POLICY "insurance_premiums_all_access" ON public.insurance_premiums
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.insurance_premiums TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.insurance_meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.insurance_meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insurance_meetings_all_access" ON public.insurance_meetings;

CREATE POLICY "insurance_meetings_all_access" ON public.insurance_meetings
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.insurance_meetings TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.retail_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.retail_customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "retail_customers_all_access" ON public.retail_customers;

CREATE POLICY "retail_customers_all_access" ON public.retail_customers
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.retail_customers TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.retail_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.retail_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "retail_orders_all_access" ON public.retail_orders;

CREATE POLICY "retail_orders_all_access" ON public.retail_orders
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.retail_orders TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.retail_shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.retail_shifts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "retail_shifts_all_access" ON public.retail_shifts;

CREATE POLICY "retail_shifts_all_access" ON public.retail_shifts
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.retail_shifts TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.retail_cash_drawers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.retail_cash_drawers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "retail_cash_drawers_all_access" ON public.retail_cash_drawers;

CREATE POLICY "retail_cash_drawers_all_access" ON public.retail_cash_drawers
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.retail_cash_drawers TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.logistics_shippers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.logistics_shippers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "logistics_shippers_all_access" ON public.logistics_shippers;

CREATE POLICY "logistics_shippers_all_access" ON public.logistics_shippers
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.logistics_shippers TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.logistics_shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.logistics_shipments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "logistics_shipments_all_access" ON public.logistics_shipments;

CREATE POLICY "logistics_shipments_all_access" ON public.logistics_shipments
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.logistics_shipments TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.logistics_dispatches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.logistics_dispatches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "logistics_dispatches_all_access" ON public.logistics_dispatches;

CREATE POLICY "logistics_dispatches_all_access" ON public.logistics_dispatches
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.logistics_dispatches TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_imaging (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_imaging ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_imaging_all_access" ON public.univ_imaging;

CREATE POLICY "univ_imaging_all_access" ON public.univ_imaging
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_imaging TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.hr_employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.hr_employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hr_employees_all_access" ON public.hr_employees;

CREATE POLICY "hr_employees_all_access" ON public.hr_employees
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.hr_employees TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.hr_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.hr_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hr_projects_all_access" ON public.hr_projects;

CREATE POLICY "hr_projects_all_access" ON public.hr_projects
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.hr_projects TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.hr_interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.hr_interviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hr_interviews_all_access" ON public.hr_interviews;

CREATE POLICY "hr_interviews_all_access" ON public.hr_interviews
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.hr_interviews TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.online_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.online_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "online_assessments_all_access" ON public.online_assessments;

CREATE POLICY "online_assessments_all_access" ON public.online_assessments
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.online_assessments TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.online_assessment_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.online_assessment_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "online_assessment_results_all_access" ON public.online_assessment_results;

CREATE POLICY "online_assessment_results_all_access" ON public.online_assessment_results
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.online_assessment_results TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.online_certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.online_certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "online_certificates_all_access" ON public.online_certificates;

CREATE POLICY "online_certificates_all_access" ON public.online_certificates
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.online_certificates TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.online_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.online_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "online_notes_all_access" ON public.online_notes;

CREATE POLICY "online_notes_all_access" ON public.online_notes
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.online_notes TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.platform_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.platform_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_roles_all_access" ON public.platform_roles;

CREATE POLICY "platform_roles_all_access" ON public.platform_roles
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.platform_roles TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.platform_role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.platform_role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_role_permissions_all_access" ON public.platform_role_permissions;

CREATE POLICY "platform_role_permissions_all_access" ON public.platform_role_permissions
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.platform_role_permissions TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.platform_departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.platform_departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_departments_all_access" ON public.platform_departments;

CREATE POLICY "platform_departments_all_access" ON public.platform_departments
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.platform_departments TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_roles_all_access" ON public.univ_roles;

CREATE POLICY "univ_roles_all_access" ON public.univ_roles
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_roles TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_case_deadlines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_case_deadlines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_case_deadlines_all_access" ON public.univ_case_deadlines;

CREATE POLICY "univ_case_deadlines_all_access" ON public.univ_case_deadlines
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_case_deadlines TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_trust_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_trust_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_trust_transactions_all_access" ON public.univ_trust_transactions;

CREATE POLICY "univ_trust_transactions_all_access" ON public.univ_trust_transactions
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_trust_transactions TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_hr_departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_hr_departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_hr_departments_all_access" ON public.univ_hr_departments;

CREATE POLICY "univ_hr_departments_all_access" ON public.univ_hr_departments
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_hr_departments TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_hr_payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_hr_payroll ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_hr_payroll_all_access" ON public.univ_hr_payroll;

CREATE POLICY "univ_hr_payroll_all_access" ON public.univ_hr_payroll
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_hr_payroll TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_hr_leave (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_hr_leave ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_hr_leave_all_access" ON public.univ_hr_leave;

CREATE POLICY "univ_hr_leave_all_access" ON public.univ_hr_leave
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_hr_leave TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_hr_recruitment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_hr_recruitment ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_hr_recruitment_all_access" ON public.univ_hr_recruitment;

CREATE POLICY "univ_hr_recruitment_all_access" ON public.univ_hr_recruitment
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_hr_recruitment TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_hr_candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_hr_candidates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_hr_candidates_all_access" ON public.univ_hr_candidates;

CREATE POLICY "univ_hr_candidates_all_access" ON public.univ_hr_candidates
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_hr_candidates TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_hr_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_hr_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_hr_attendance_all_access" ON public.univ_hr_attendance;

CREATE POLICY "univ_hr_attendance_all_access" ON public.univ_hr_attendance
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_hr_attendance TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_reinsurance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_reinsurance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_reinsurance_all_access" ON public.univ_reinsurance;

CREATE POLICY "univ_reinsurance_all_access" ON public.univ_reinsurance
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_reinsurance TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_medicalclaims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_medicalclaims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_medicalclaims_all_access" ON public.univ_medicalclaims;

CREATE POLICY "univ_medicalclaims_all_access" ON public.univ_medicalclaims
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_medicalclaims TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_surgeries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_surgeries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_surgeries_all_access" ON public.univ_surgeries;

CREATE POLICY "univ_surgeries_all_access" ON public.univ_surgeries
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_surgeries TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_ambulance_dispatch (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_ambulance_dispatch ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_ambulance_dispatch_all_access" ON public.univ_ambulance_dispatch;

CREATE POLICY "univ_ambulance_dispatch_all_access" ON public.univ_ambulance_dispatch
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_ambulance_dispatch TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_pharmacy (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_pharmacy ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_pharmacy_all_access" ON public.univ_pharmacy;

CREATE POLICY "univ_pharmacy_all_access" ON public.univ_pharmacy
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_pharmacy TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_admissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_admissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_admissions_all_access" ON public.univ_admissions;

CREATE POLICY "univ_admissions_all_access" ON public.univ_admissions
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_admissions TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_medical_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_medical_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_medical_history_all_access" ON public.univ_medical_history;

CREATE POLICY "univ_medical_history_all_access" ON public.univ_medical_history
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_medical_history TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.workspace_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.workspace_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace_insights_all_access" ON public.workspace_insights;

CREATE POLICY "workspace_insights_all_access" ON public.workspace_insights
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.workspace_insights TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.intelligence_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.intelligence_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "intelligence_runs_all_access" ON public.intelligence_runs;

CREATE POLICY "intelligence_runs_all_access" ON public.intelligence_runs
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.intelligence_runs TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.entity_intelligence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.entity_intelligence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "entity_intelligence_all_access" ON public.entity_intelligence;

CREATE POLICY "entity_intelligence_all_access" ON public.entity_intelligence
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.entity_intelligence TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.insight_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.insight_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insight_feedback_all_access" ON public.insight_feedback;

CREATE POLICY "insight_feedback_all_access" ON public.insight_feedback
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.insight_feedback TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.engine_accuracy (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.engine_accuracy ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "engine_accuracy_all_access" ON public.engine_accuracy;

CREATE POLICY "engine_accuracy_all_access" ON public.engine_accuracy
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.engine_accuracy TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.component_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.component_registry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "component_registry_all_access" ON public.component_registry;

CREATE POLICY "component_registry_all_access" ON public.component_registry
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.component_registry TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.industry_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.industry_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "industry_templates_all_access" ON public.industry_templates;

CREATE POLICY "industry_templates_all_access" ON public.industry_templates
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.industry_templates TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.workspace_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.workspace_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace_modules_all_access" ON public.workspace_modules;

CREATE POLICY "workspace_modules_all_access" ON public.workspace_modules
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.workspace_modules TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.marketplace_review_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.marketplace_review_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketplace_review_requests_all_access" ON public.marketplace_review_requests;

CREATE POLICY "marketplace_review_requests_all_access" ON public.marketplace_review_requests
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.marketplace_review_requests TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.uni_departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.uni_departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "uni_departments_all_access" ON public.uni_departments;

CREATE POLICY "uni_departments_all_access" ON public.uni_departments
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.uni_departments TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.uni_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.uni_programs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "uni_programs_all_access" ON public.uni_programs;

CREATE POLICY "uni_programs_all_access" ON public.uni_programs
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.uni_programs TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.uni_staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.uni_staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "uni_staff_all_access" ON public.uni_staff;

CREATE POLICY "uni_staff_all_access" ON public.uni_staff
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.uni_staff TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.uni_students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.uni_students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "uni_students_all_access" ON public.uni_students;

CREATE POLICY "uni_students_all_access" ON public.uni_students
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.uni_students TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.uni_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.uni_courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "uni_courses_all_access" ON public.uni_courses;

CREATE POLICY "uni_courses_all_access" ON public.uni_courses
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.uni_courses TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.uni_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.uni_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "uni_enrollments_all_access" ON public.uni_enrollments;

CREATE POLICY "uni_enrollments_all_access" ON public.uni_enrollments
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.uni_enrollments TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.uni_lms_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.uni_lms_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "uni_lms_materials_all_access" ON public.uni_lms_materials;

CREATE POLICY "uni_lms_materials_all_access" ON public.uni_lms_materials
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.uni_lms_materials TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.uni_lms_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.uni_lms_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "uni_lms_assignments_all_access" ON public.uni_lms_assignments;

CREATE POLICY "uni_lms_assignments_all_access" ON public.uni_lms_assignments
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.uni_lms_assignments TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.uni_lms_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.uni_lms_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "uni_lms_submissions_all_access" ON public.uni_lms_submissions;

CREATE POLICY "uni_lms_submissions_all_access" ON public.uni_lms_submissions
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.uni_lms_submissions TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.uni_exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.uni_exams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "uni_exams_all_access" ON public.uni_exams;

CREATE POLICY "uni_exams_all_access" ON public.uni_exams
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.uni_exams TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.uni_grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.uni_grades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "uni_grades_all_access" ON public.uni_grades;

CREATE POLICY "uni_grades_all_access" ON public.uni_grades
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.uni_grades TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.uni_applicants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.uni_applicants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "uni_applicants_all_access" ON public.uni_applicants;

CREATE POLICY "uni_applicants_all_access" ON public.uni_applicants
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.uni_applicants TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.uni_fees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.uni_fees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "uni_fees_all_access" ON public.uni_fees;

CREATE POLICY "uni_fees_all_access" ON public.uni_fees
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.uni_fees TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.uni_hostel_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.uni_hostel_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "uni_hostel_rooms_all_access" ON public.uni_hostel_rooms;

CREATE POLICY "uni_hostel_rooms_all_access" ON public.uni_hostel_rooms
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.uni_hostel_rooms TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.uni_library_books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.uni_library_books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "uni_library_books_all_access" ON public.uni_library_books;

CREATE POLICY "uni_library_books_all_access" ON public.uni_library_books
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.uni_library_books TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.uni_research_grants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.uni_research_grants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "uni_research_grants_all_access" ON public.uni_research_grants;

CREATE POLICY "uni_research_grants_all_access" ON public.uni_research_grants
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.uni_research_grants TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.uni_alumni (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.uni_alumni ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "uni_alumni_all_access" ON public.uni_alumni;

CREATE POLICY "uni_alumni_all_access" ON public.uni_alumni
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.uni_alumni TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.revenue_forecasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.revenue_forecasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "revenue_forecasts_all_access" ON public.revenue_forecasts;

CREATE POLICY "revenue_forecasts_all_access" ON public.revenue_forecasts
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.revenue_forecasts TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_feature_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_feature_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_feature_requests_all_access" ON public.univ_feature_requests;

CREATE POLICY "univ_feature_requests_all_access" ON public.univ_feature_requests
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_feature_requests TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_feature_announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_feature_announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_feature_announcements_all_access" ON public.univ_feature_announcements;

CREATE POLICY "univ_feature_announcements_all_access" ON public.univ_feature_announcements
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_feature_announcements TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_company_feature_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_company_feature_decisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_company_feature_decisions_all_access" ON public.univ_company_feature_decisions;

CREATE POLICY "univ_company_feature_decisions_all_access" ON public.univ_company_feature_decisions
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_company_feature_decisions TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.optavel_deal_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.optavel_deal_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "optavel_deal_rooms_all_access" ON public.optavel_deal_rooms;

CREATE POLICY "optavel_deal_rooms_all_access" ON public.optavel_deal_rooms
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.optavel_deal_rooms TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.optavel_okrs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.optavel_okrs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "optavel_okrs_all_access" ON public.optavel_okrs;

CREATE POLICY "optavel_okrs_all_access" ON public.optavel_okrs
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.optavel_okrs TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.optavel_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.optavel_decisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "optavel_decisions_all_access" ON public.optavel_decisions;

CREATE POLICY "optavel_decisions_all_access" ON public.optavel_decisions
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.optavel_decisions TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.optavel_commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.optavel_commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "optavel_commissions_all_access" ON public.optavel_commissions;

CREATE POLICY "optavel_commissions_all_access" ON public.optavel_commissions
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.optavel_commissions TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.optavel_cap_table (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.optavel_cap_table ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "optavel_cap_table_all_access" ON public.optavel_cap_table;

CREATE POLICY "optavel_cap_table_all_access" ON public.optavel_cap_table
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.optavel_cap_table TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.optavel_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.optavel_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "optavel_campaigns_all_access" ON public.optavel_campaigns;

CREATE POLICY "optavel_campaigns_all_access" ON public.optavel_campaigns
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.optavel_campaigns TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.optavel_marketing_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.optavel_marketing_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "optavel_marketing_reports_all_access" ON public.optavel_marketing_reports;

CREATE POLICY "optavel_marketing_reports_all_access" ON public.optavel_marketing_reports
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.optavel_marketing_reports TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.optavel_seo_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.optavel_seo_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "optavel_seo_tracking_all_access" ON public.optavel_seo_tracking;

CREATE POLICY "optavel_seo_tracking_all_access" ON public.optavel_seo_tracking
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.optavel_seo_tracking TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.optavel_summit_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.optavel_summit_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "optavel_summit_registrations_all_access" ON public.optavel_summit_registrations;

CREATE POLICY "optavel_summit_registrations_all_access" ON public.optavel_summit_registrations
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.optavel_summit_registrations TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.optavel_bugs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.optavel_bugs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "optavel_bugs_all_access" ON public.optavel_bugs;

CREATE POLICY "optavel_bugs_all_access" ON public.optavel_bugs
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.optavel_bugs TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.optavel_sprints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.optavel_sprints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "optavel_sprints_all_access" ON public.optavel_sprints;

CREATE POLICY "optavel_sprints_all_access" ON public.optavel_sprints
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.optavel_sprints TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.optavel_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.optavel_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "optavel_tasks_all_access" ON public.optavel_tasks;

CREATE POLICY "optavel_tasks_all_access" ON public.optavel_tasks
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.optavel_tasks TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.optavel_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.optavel_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "optavel_transactions_all_access" ON public.optavel_transactions;

CREATE POLICY "optavel_transactions_all_access" ON public.optavel_transactions
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.optavel_transactions TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.optavel_deal_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.optavel_deal_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "optavel_deal_activities_all_access" ON public.optavel_deal_activities;

CREATE POLICY "optavel_deal_activities_all_access" ON public.optavel_deal_activities
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.optavel_deal_activities TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.email_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_sequences_all_access" ON public.email_sequences;

CREATE POLICY "email_sequences_all_access" ON public.email_sequences
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.email_sequences TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "accounts_all_access" ON public.accounts;

CREATE POLICY "accounts_all_access" ON public.accounts
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.accounts TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "journal_entries_all_access" ON public.journal_entries;

CREATE POLICY "journal_entries_all_access" ON public.journal_entries
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.journal_entries TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.payroll_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payroll_runs_all_access" ON public.payroll_runs;

CREATE POLICY "payroll_runs_all_access" ON public.payroll_runs
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.payroll_runs TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_support_tickets_all_access" ON public.univ_support_tickets;

CREATE POLICY "univ_support_tickets_all_access" ON public.univ_support_tickets
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_support_tickets TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.online_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.online_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "online_orders_all_access" ON public.online_orders;

CREATE POLICY "online_orders_all_access" ON public.online_orders
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.online_orders TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.online_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.online_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "online_settings_all_access" ON public.online_settings;

CREATE POLICY "online_settings_all_access" ON public.online_settings
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.online_settings TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.school_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.school_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "school_assignments_all_access" ON public.school_assignments;

CREATE POLICY "school_assignments_all_access" ON public.school_assignments
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.school_assignments TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.school_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.school_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "school_attendance_all_access" ON public.school_attendance;

CREATE POLICY "school_attendance_all_access" ON public.school_attendance
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.school_attendance TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.school_canteen (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.school_canteen ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "school_canteen_all_access" ON public.school_canteen;

CREATE POLICY "school_canteen_all_access" ON public.school_canteen
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.school_canteen TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.school_classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.school_classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "school_classes_all_access" ON public.school_classes;

CREATE POLICY "school_classes_all_access" ON public.school_classes
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.school_classes TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.school_complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.school_complaints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "school_complaints_all_access" ON public.school_complaints;

CREATE POLICY "school_complaints_all_access" ON public.school_complaints
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.school_complaints TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.school_exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.school_exams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "school_exams_all_access" ON public.school_exams;

CREATE POLICY "school_exams_all_access" ON public.school_exams
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.school_exams TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.school_fees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.school_fees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "school_fees_all_access" ON public.school_fees;

CREATE POLICY "school_fees_all_access" ON public.school_fees
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.school_fees TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.school_gamification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.school_gamification ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "school_gamification_all_access" ON public.school_gamification;

CREATE POLICY "school_gamification_all_access" ON public.school_gamification
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.school_gamification TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.school_grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.school_grades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "school_grades_all_access" ON public.school_grades;

CREATE POLICY "school_grades_all_access" ON public.school_grades
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.school_grades TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.school_hostel (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.school_hostel ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "school_hostel_all_access" ON public.school_hostel;

CREATE POLICY "school_hostel_all_access" ON public.school_hostel
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.school_hostel TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.school_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.school_library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "school_library_all_access" ON public.school_library;

CREATE POLICY "school_library_all_access" ON public.school_library
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.school_library TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.school_notices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.school_notices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "school_notices_all_access" ON public.school_notices;

CREATE POLICY "school_notices_all_access" ON public.school_notices
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.school_notices TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.school_parents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.school_parents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "school_parents_all_access" ON public.school_parents;

CREATE POLICY "school_parents_all_access" ON public.school_parents
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.school_parents TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.school_students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.school_students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "school_students_all_access" ON public.school_students;

CREATE POLICY "school_students_all_access" ON public.school_students
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.school_students TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.school_teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.school_teachers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "school_teachers_all_access" ON public.school_teachers;

CREATE POLICY "school_teachers_all_access" ON public.school_teachers
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.school_teachers TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.school_transport (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.school_transport ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "school_transport_all_access" ON public.school_transport;

CREATE POLICY "school_transport_all_access" ON public.school_transport
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.school_transport TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_allergies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_allergies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_allergies_all_access" ON public.univ_allergies;

CREATE POLICY "univ_allergies_all_access" ON public.univ_allergies
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_allergies TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_beds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_beds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_beds_all_access" ON public.univ_beds;

CREATE POLICY "univ_beds_all_access" ON public.univ_beds
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_beds TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_blood_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_blood_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_blood_requests_all_access" ON public.univ_blood_requests;

CREATE POLICY "univ_blood_requests_all_access" ON public.univ_blood_requests
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_blood_requests TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_consents_all_access" ON public.univ_consents;

CREATE POLICY "univ_consents_all_access" ON public.univ_consents
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_consents TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_discharges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_discharges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_discharges_all_access" ON public.univ_discharges;

CREATE POLICY "univ_discharges_all_access" ON public.univ_discharges
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_discharges TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_immunisations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_immunisations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_immunisations_all_access" ON public.univ_immunisations;

CREATE POLICY "univ_immunisations_all_access" ON public.univ_immunisations
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_immunisations TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_lab_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_lab_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_lab_results_all_access" ON public.univ_lab_results;

CREATE POLICY "univ_lab_results_all_access" ON public.univ_lab_results
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_lab_results TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_school_assignment_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_school_assignment_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_school_assignment_submissions_all_access" ON public.univ_school_assignment_submissions;

CREATE POLICY "univ_school_assignment_submissions_all_access" ON public.univ_school_assignment_submissions
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_school_assignment_submissions TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_school_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_school_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_school_assignments_all_access" ON public.univ_school_assignments;

CREATE POLICY "univ_school_assignments_all_access" ON public.univ_school_assignments
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_school_assignments TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_school_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_school_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_school_attendance_all_access" ON public.univ_school_attendance;

CREATE POLICY "univ_school_attendance_all_access" ON public.univ_school_attendance
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_school_attendance TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_school_course_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_school_course_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_school_course_registrations_all_access" ON public.univ_school_course_registrations;

CREATE POLICY "univ_school_course_registrations_all_access" ON public.univ_school_course_registrations
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_school_course_registrations TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_school_discipline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_school_discipline ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_school_discipline_all_access" ON public.univ_school_discipline;

CREATE POLICY "univ_school_discipline_all_access" ON public.univ_school_discipline
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_school_discipline TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_school_exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_school_exams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_school_exams_all_access" ON public.univ_school_exams;

CREATE POLICY "univ_school_exams_all_access" ON public.univ_school_exams
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_school_exams TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_school_grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_school_grades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_school_grades_all_access" ON public.univ_school_grades;

CREATE POLICY "univ_school_grades_all_access" ON public.univ_school_grades
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_school_grades TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_school_hostel (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_school_hostel ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_school_hostel_all_access" ON public.univ_school_hostel;

CREATE POLICY "univ_school_hostel_all_access" ON public.univ_school_hostel
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_school_hostel TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_school_library_books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_school_library_books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_school_library_books_all_access" ON public.univ_school_library_books;

CREATE POLICY "univ_school_library_books_all_access" ON public.univ_school_library_books
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_school_library_books TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_school_library_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_school_library_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_school_library_categories_all_access" ON public.univ_school_library_categories;

CREATE POLICY "univ_school_library_categories_all_access" ON public.univ_school_library_categories
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_school_library_categories TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_school_notices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_school_notices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_school_notices_all_access" ON public.univ_school_notices;

CREATE POLICY "univ_school_notices_all_access" ON public.univ_school_notices
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_school_notices TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_school_timetable (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_school_timetable ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_school_timetable_all_access" ON public.univ_school_timetable;

CREATE POLICY "univ_school_timetable_all_access" ON public.univ_school_timetable
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_school_timetable TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_school_transport (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_school_transport ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_school_transport_all_access" ON public.univ_school_transport;

CREATE POLICY "univ_school_transport_all_access" ON public.univ_school_transport
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_school_transport TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_staff_shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_staff_shifts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_staff_shifts_all_access" ON public.univ_staff_shifts;

CREATE POLICY "univ_staff_shifts_all_access" ON public.univ_staff_shifts
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_staff_shifts TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.univ_vitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.univ_vitals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "univ_vitals_all_access" ON public.univ_vitals;

CREATE POLICY "univ_vitals_all_access" ON public.univ_vitals
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

GRANT ALL ON public.univ_vitals TO authenticated, service_role;

