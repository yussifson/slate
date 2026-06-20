
-- SECURITY IMPLEMENTATION - LAYER 1 & 2: RLS AND RBAC
-- Apply to all tables automatically

CREATE EXTENSION IF NOT EXISTS pgsodium;

-- Create the role_permissions table
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role            text NOT NULL,
  resource        text NOT NULL,
  action          text NOT NULL,
  conditions      jsonb,
  UNIQUE(role, resource, action)
);

-- Workspace Security Settings
CREATE TABLE IF NOT EXISTS public.company_security_settings (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id              text NOT NULL UNIQUE,
  require_mfa             boolean NOT NULL DEFAULT false,
  require_mfa_for_roles   text[]   NOT NULL DEFAULT ARRAY['owner','admin'],
  session_timeout_minutes integer  NOT NULL DEFAULT 480,
  allowed_ip_ranges       inet[],
  max_failed_logins       integer  NOT NULL DEFAULT 5,
  lockout_minutes         integer  NOT NULL DEFAULT 30,
  require_strong_password boolean  NOT NULL DEFAULT true,
  password_min_length     integer  NOT NULL DEFAULT 12,
  sso_only                boolean  NOT NULL DEFAULT false,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

-- Data Subject Requests
CREATE TABLE IF NOT EXISTS public.data_subject_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      text NOT NULL,
  request_type    text NOT NULL CHECK (request_type IN ('export', 'delete', 'rectify', 'restrict')),
  subject_email   text NOT NULL,
  subject_name    text,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
  requested_at    timestamptz NOT NULL DEFAULT now(),
  due_at          timestamptz NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  completed_at    timestamptz,
  completed_by    uuid,
  notes           text
);

-- Default Roles
INSERT INTO role_permissions (role, resource, action) VALUES
('owner', '*', '*'),
('admin', '*', '*'),
('manager', '*', 'read'),
('manager', '*', 'create'),
('manager', '*', 'update'),
('staff', '*', 'read'),
('viewer', '*', 'read')
ON CONFLICT DO NOTHING;

-- RLS Helper Function for performance
CREATE OR REPLACE FUNCTION user_company_ids()
RETURNS SETOF text AS $$
  SELECT company_id FROM staff_records WHERE user_email = auth.jwt() ->> 'email' AND status = 'active'
  UNION
  SELECT id FROM companies WHERE admin_email = auth.jwt() ->> 'email' OR created_by = auth.uid()::text
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- RLS Helper Function for RBAC checking
CREATE OR REPLACE FUNCTION has_role_permission(p_company_id text, p_action text)
RETURNS boolean AS $$
DECLARE
  v_role text;
BEGIN
  -- Get user role in this company
  SELECT role INTO v_role FROM staff_records 
  WHERE company_id = p_company_id AND user_email = auth.jwt() ->> 'email' AND status = 'active' LIMIT 1;
  
  -- Owners/admins (implicit from companies table)
  IF v_role IS NULL THEN
    IF EXISTS(SELECT 1 FROM companies WHERE id = p_company_id AND (admin_email = auth.jwt() ->> 'email' OR created_by = auth.uid()::text)) THEN
      RETURN true;
    END IF;
  END IF;

  -- Check role_permissions
  IF EXISTS(SELECT 1 FROM role_permissions WHERE role = v_role AND (action = p_action OR action = '*')) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- Table: industry_records
ALTER TABLE IF EXISTS public."industry_records" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='industry_records' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'industry_records' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."industry_records"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'industry_records' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."industry_records"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'industry_records' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."industry_records"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'industry_records' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."industry_records"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: automation_rules
ALTER TABLE IF EXISTS public."automation_rules" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='automation_rules' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automation_rules' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."automation_rules"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automation_rules' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."automation_rules"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automation_rules' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."automation_rules"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automation_rules' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."automation_rules"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: audit_logs
ALTER TABLE IF EXISTS public."audit_logs" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."audit_logs"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."audit_logs"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."audit_logs"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."audit_logs"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: case_emails
ALTER TABLE IF EXISTS public."case_emails" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='case_emails' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'case_emails' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."case_emails"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'case_emails' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."case_emails"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'case_emails' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."case_emails"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'case_emails' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."case_emails"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: case_messages
ALTER TABLE IF EXISTS public."case_messages" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='case_messages' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'case_messages' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."case_messages"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'case_messages' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."case_messages"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'case_messages' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."case_messages"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'case_messages' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."case_messages"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: case_outcomes
ALTER TABLE IF EXISTS public."case_outcomes" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='case_outcomes' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'case_outcomes' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."case_outcomes"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'case_outcomes' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."case_outcomes"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'case_outcomes' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."case_outcomes"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'case_outcomes' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."case_outcomes"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: case_pipelines
ALTER TABLE IF EXISTS public."case_pipelines" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='case_pipelines' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'case_pipelines' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."case_pipelines"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'case_pipelines' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."case_pipelines"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'case_pipelines' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."case_pipelines"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'case_pipelines' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."case_pipelines"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: case_pipeline_states
ALTER TABLE IF EXISTS public."case_pipeline_states" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='case_pipeline_states' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'case_pipeline_states' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."case_pipeline_states"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'case_pipeline_states' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."case_pipeline_states"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'case_pipeline_states' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."case_pipeline_states"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'case_pipeline_states' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."case_pipeline_states"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: clients
ALTER TABLE IF EXISTS public."clients" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clients' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."clients"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."clients"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."clients"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."clients"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: client_checklists
ALTER TABLE IF EXISTS public."client_checklists" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='client_checklists' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_checklists' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."client_checklists"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_checklists' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."client_checklists"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_checklists' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."client_checklists"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_checklists' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."client_checklists"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: client_messages
ALTER TABLE IF EXISTS public."client_messages" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='client_messages' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_messages' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."client_messages"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_messages' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."client_messages"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_messages' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."client_messages"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_messages' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."client_messages"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: companies
ALTER TABLE IF EXISTS public."companies" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='companies' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."companies"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."companies"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."companies"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."companies"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: documents
ALTER TABLE IF EXISTS public."documents" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."documents"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."documents"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."documents"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."documents"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: expenses
ALTER TABLE IF EXISTS public."expenses" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='expenses' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."expenses"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."expenses"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."expenses"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."expenses"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: firm_settings
ALTER TABLE IF EXISTS public."firm_settings" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='firm_settings' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'firm_settings' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."firm_settings"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'firm_settings' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."firm_settings"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'firm_settings' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."firm_settings"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'firm_settings' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."firm_settings"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: hearings
ALTER TABLE IF EXISTS public."hearings" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='hearings' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hearings' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."hearings"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hearings' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."hearings"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hearings' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."hearings"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hearings' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."hearings"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: h_r_complaints
ALTER TABLE IF EXISTS public."h_r_complaints" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='h_r_complaints' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'h_r_complaints' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."h_r_complaints"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'h_r_complaints' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."h_r_complaints"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'h_r_complaints' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."h_r_complaints"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'h_r_complaints' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."h_r_complaints"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: invoices
ALTER TABLE IF EXISTS public."invoices" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='invoices' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."invoices"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."invoices"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."invoices"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."invoices"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: leads
ALTER TABLE IF EXISTS public."leads" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."leads"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."leads"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."leads"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."leads"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: leave_requests
ALTER TABLE IF EXISTS public."leave_requests" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leave_requests' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leave_requests' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."leave_requests"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leave_requests' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."leave_requests"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leave_requests' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."leave_requests"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leave_requests' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."leave_requests"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: legal_cases
ALTER TABLE IF EXISTS public."legal_cases" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='legal_cases' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'legal_cases' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."legal_cases"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'legal_cases' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."legal_cases"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'legal_cases' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."legal_cases"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'legal_cases' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."legal_cases"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: linked_emails
ALTER TABLE IF EXISTS public."linked_emails" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='linked_emails' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'linked_emails' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."linked_emails"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'linked_emails' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."linked_emails"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'linked_emails' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."linked_emails"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'linked_emails' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."linked_emails"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: notifications
ALTER TABLE IF EXISTS public."notifications" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."notifications"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."notifications"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."notifications"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."notifications"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: automation_logs
ALTER TABLE IF EXISTS public."automation_logs" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='automation_logs' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automation_logs' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."automation_logs"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automation_logs' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."automation_logs"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automation_logs' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."automation_logs"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automation_logs' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."automation_logs"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: partner_applications
ALTER TABLE IF EXISTS public."partner_applications" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='partner_applications' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'partner_applications' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."partner_applications"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'partner_applications' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."partner_applications"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'partner_applications' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."partner_applications"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'partner_applications' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."partner_applications"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: payroll_slips
ALTER TABLE IF EXISTS public."payroll_slips" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payroll_slips' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payroll_slips' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."payroll_slips"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payroll_slips' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."payroll_slips"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payroll_slips' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."payroll_slips"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payroll_slips' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."payroll_slips"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: promotions
ALTER TABLE IF EXISTS public."promotions" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='promotions' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'promotions' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."promotions"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'promotions' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."promotions"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'promotions' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."promotions"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'promotions' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."promotions"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: retainers
ALTER TABLE IF EXISTS public."retainers" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='retainers' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'retainers' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."retainers"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'retainers' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."retainers"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'retainers' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."retainers"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'retainers' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."retainers"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: signature_requests
ALTER TABLE IF EXISTS public."signature_requests" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='signature_requests' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'signature_requests' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."signature_requests"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'signature_requests' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."signature_requests"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'signature_requests' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."signature_requests"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'signature_requests' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."signature_requests"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: staff_permissions
ALTER TABLE IF EXISTS public."staff_permissions" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='staff_permissions' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_permissions' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."staff_permissions"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_permissions' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."staff_permissions"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_permissions' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."staff_permissions"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_permissions' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."staff_permissions"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: staff_records
ALTER TABLE IF EXISTS public."staff_records" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='staff_records' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_records' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."staff_records"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_records' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."staff_records"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_records' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."staff_records"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_records' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."staff_records"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: module_definitions
ALTER TABLE IF EXISTS public."module_definitions" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='module_definitions' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'module_definitions' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."module_definitions"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'module_definitions' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."module_definitions"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'module_definitions' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."module_definitions"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'module_definitions' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."module_definitions"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: field_definitions
ALTER TABLE IF EXISTS public."field_definitions" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='field_definitions' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'field_definitions' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."field_definitions"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'field_definitions' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."field_definitions"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'field_definitions' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."field_definitions"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'field_definitions' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."field_definitions"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: dynamic_records
ALTER TABLE IF EXISTS public."dynamic_records" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='dynamic_records' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dynamic_records' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."dynamic_records"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dynamic_records' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."dynamic_records"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dynamic_records' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."dynamic_records"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dynamic_records' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."dynamic_records"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: subscription_invoices
ALTER TABLE IF EXISTS public."subscription_invoices" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='subscription_invoices' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscription_invoices' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."subscription_invoices"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscription_invoices' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."subscription_invoices"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscription_invoices' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."subscription_invoices"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscription_invoices' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."subscription_invoices"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: tasks
ALTER TABLE IF EXISTS public."tasks" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tasks' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."tasks"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."tasks"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."tasks"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."tasks"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: time_entries
ALTER TABLE IF EXISTS public."time_entries" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='time_entries' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'time_entries' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."time_entries"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'time_entries' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."time_entries"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'time_entries' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."time_entries"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'time_entries' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."time_entries"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: sync_errors
ALTER TABLE IF EXISTS public."sync_errors" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sync_errors' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sync_errors' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."sync_errors"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sync_errors' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."sync_errors"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sync_errors' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."sync_errors"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sync_errors' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."sync_errors"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: profiles
ALTER TABLE IF EXISTS public."profiles" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."profiles"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."profiles"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."profiles"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."profiles"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: hospital_patients
ALTER TABLE IF EXISTS public."hospital_patients" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='hospital_patients' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hospital_patients' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."hospital_patients"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hospital_patients' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."hospital_patients"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hospital_patients' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."hospital_patients"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hospital_patients' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."hospital_patients"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: hospital_admissions
ALTER TABLE IF EXISTS public."hospital_admissions" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='hospital_admissions' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hospital_admissions' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."hospital_admissions"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hospital_admissions' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."hospital_admissions"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hospital_admissions' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."hospital_admissions"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hospital_admissions' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."hospital_admissions"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: hospital_appointments
ALTER TABLE IF EXISTS public."hospital_appointments" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='hospital_appointments' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hospital_appointments' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."hospital_appointments"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hospital_appointments' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."hospital_appointments"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hospital_appointments' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."hospital_appointments"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hospital_appointments' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."hospital_appointments"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: hotel_guests
ALTER TABLE IF EXISTS public."hotel_guests" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='hotel_guests' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hotel_guests' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."hotel_guests"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hotel_guests' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."hotel_guests"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hotel_guests' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."hotel_guests"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hotel_guests' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."hotel_guests"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: hotel_bookings
ALTER TABLE IF EXISTS public."hotel_bookings" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='hotel_bookings' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hotel_bookings' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."hotel_bookings"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hotel_bookings' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."hotel_bookings"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hotel_bookings' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."hotel_bookings"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hotel_bookings' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."hotel_bookings"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: hotel_reservations
ALTER TABLE IF EXISTS public."hotel_reservations" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='hotel_reservations' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hotel_reservations' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."hotel_reservations"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hotel_reservations' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."hotel_reservations"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hotel_reservations' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."hotel_reservations"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hotel_reservations' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."hotel_reservations"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: religion_members
ALTER TABLE IF EXISTS public."religion_members" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='religion_members' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'religion_members' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."religion_members"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'religion_members' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."religion_members"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'religion_members' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."religion_members"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'religion_members' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."religion_members"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: religion_groups
ALTER TABLE IF EXISTS public."religion_groups" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='religion_groups' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'religion_groups' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."religion_groups"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'religion_groups' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."religion_groups"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'religion_groups' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."religion_groups"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'religion_groups' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."religion_groups"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: religion_events
ALTER TABLE IF EXISTS public."religion_events" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='religion_events' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'religion_events' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."religion_events"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'religion_events' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."religion_events"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'religion_events' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."religion_events"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'religion_events' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."religion_events"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: insurance_policyholders
ALTER TABLE IF EXISTS public."insurance_policyholders" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='insurance_policyholders' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'insurance_policyholders' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."insurance_policyholders"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'insurance_policyholders' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."insurance_policyholders"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'insurance_policyholders' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."insurance_policyholders"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'insurance_policyholders' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."insurance_policyholders"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: insurance_claims
ALTER TABLE IF EXISTS public."insurance_claims" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='insurance_claims' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'insurance_claims' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."insurance_claims"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'insurance_claims' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."insurance_claims"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'insurance_claims' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."insurance_claims"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'insurance_claims' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."insurance_claims"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: insurance_meetings
ALTER TABLE IF EXISTS public."insurance_meetings" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='insurance_meetings' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'insurance_meetings' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."insurance_meetings"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'insurance_meetings' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."insurance_meetings"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'insurance_meetings' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."insurance_meetings"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'insurance_meetings' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."insurance_meetings"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: retail_customers
ALTER TABLE IF EXISTS public."retail_customers" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='retail_customers' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'retail_customers' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."retail_customers"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'retail_customers' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."retail_customers"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'retail_customers' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."retail_customers"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'retail_customers' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."retail_customers"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: retail_orders
ALTER TABLE IF EXISTS public."retail_orders" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='retail_orders' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'retail_orders' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."retail_orders"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'retail_orders' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."retail_orders"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'retail_orders' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."retail_orders"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'retail_orders' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."retail_orders"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: retail_shifts
ALTER TABLE IF EXISTS public."retail_shifts" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='retail_shifts' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'retail_shifts' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."retail_shifts"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'retail_shifts' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."retail_shifts"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'retail_shifts' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."retail_shifts"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'retail_shifts' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."retail_shifts"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: logistics_shippers
ALTER TABLE IF EXISTS public."logistics_shippers" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='logistics_shippers' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_shippers' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."logistics_shippers"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_shippers' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."logistics_shippers"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_shippers' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."logistics_shippers"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_shippers' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."logistics_shippers"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: logistics_shipments
ALTER TABLE IF EXISTS public."logistics_shipments" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='logistics_shipments' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_shipments' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."logistics_shipments"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_shipments' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."logistics_shipments"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_shipments' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."logistics_shipments"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_shipments' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."logistics_shipments"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: logistics_dispatches
ALTER TABLE IF EXISTS public."logistics_dispatches" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='logistics_dispatches' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_dispatches' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."logistics_dispatches"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_dispatches' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."logistics_dispatches"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_dispatches' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."logistics_dispatches"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_dispatches' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."logistics_dispatches"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_imaging
ALTER TABLE IF EXISTS public."univ_imaging" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_imaging' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_imaging' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_imaging"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_imaging' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_imaging"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_imaging' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_imaging"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_imaging' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_imaging"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: logistics_warehouse_inventory
ALTER TABLE IF EXISTS public."logistics_warehouse_inventory" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='logistics_warehouse_inventory' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_warehouse_inventory' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."logistics_warehouse_inventory"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_warehouse_inventory' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."logistics_warehouse_inventory"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_warehouse_inventory' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."logistics_warehouse_inventory"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_warehouse_inventory' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."logistics_warehouse_inventory"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: logistics_warehouse_scans
ALTER TABLE IF EXISTS public."logistics_warehouse_scans" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='logistics_warehouse_scans' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_warehouse_scans' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."logistics_warehouse_scans"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_warehouse_scans' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."logistics_warehouse_scans"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_warehouse_scans' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."logistics_warehouse_scans"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_warehouse_scans' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."logistics_warehouse_scans"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: logistics_loads
ALTER TABLE IF EXISTS public."logistics_loads" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='logistics_loads' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_loads' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."logistics_loads"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_loads' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."logistics_loads"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_loads' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."logistics_loads"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_loads' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."logistics_loads"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: logistics_load_matches
ALTER TABLE IF EXISTS public."logistics_load_matches" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='logistics_load_matches' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_load_matches' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."logistics_load_matches"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_load_matches' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."logistics_load_matches"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_load_matches' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."logistics_load_matches"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_load_matches' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."logistics_load_matches"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: logistics_routes
ALTER TABLE IF EXISTS public."logistics_routes" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='logistics_routes' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_routes' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."logistics_routes"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_routes' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."logistics_routes"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_routes' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."logistics_routes"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_routes' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."logistics_routes"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: logistics_route_stops
ALTER TABLE IF EXISTS public."logistics_route_stops" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='logistics_route_stops' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_route_stops' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."logistics_route_stops"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_route_stops' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."logistics_route_stops"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_route_stops' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."logistics_route_stops"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_route_stops' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."logistics_route_stops"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: logistics_smart_docs
ALTER TABLE IF EXISTS public."logistics_smart_docs" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='logistics_smart_docs' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_smart_docs' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."logistics_smart_docs"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_smart_docs' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."logistics_smart_docs"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_smart_docs' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."logistics_smart_docs"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_smart_docs' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."logistics_smart_docs"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: logistics_geofences
ALTER TABLE IF EXISTS public."logistics_geofences" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='logistics_geofences' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_geofences' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."logistics_geofences"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_geofences' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."logistics_geofences"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_geofences' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."logistics_geofences"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_geofences' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."logistics_geofences"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: logistics_geofence_logs
ALTER TABLE IF EXISTS public."logistics_geofence_logs" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='logistics_geofence_logs' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_geofence_logs' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."logistics_geofence_logs"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_geofence_logs' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."logistics_geofence_logs"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_geofence_logs' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."logistics_geofence_logs"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'logistics_geofence_logs' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."logistics_geofence_logs"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: hr_employees
ALTER TABLE IF EXISTS public."hr_employees" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='hr_employees' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hr_employees' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."hr_employees"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hr_employees' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."hr_employees"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hr_employees' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."hr_employees"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hr_employees' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."hr_employees"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: hr_projects
ALTER TABLE IF EXISTS public."hr_projects" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='hr_projects' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hr_projects' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."hr_projects"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hr_projects' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."hr_projects"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hr_projects' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."hr_projects"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hr_projects' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."hr_projects"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: hr_interviews
ALTER TABLE IF EXISTS public."hr_interviews" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='hr_interviews' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hr_interviews' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."hr_interviews"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hr_interviews' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."hr_interviews"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hr_interviews' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."hr_interviews"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hr_interviews' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."hr_interviews"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: online_media
ALTER TABLE IF EXISTS public."online_media" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='online_media' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'online_media' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."online_media"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'online_media' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."online_media"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'online_media' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."online_media"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'online_media' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."online_media"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: online_courses
ALTER TABLE IF EXISTS public."online_courses" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='online_courses' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'online_courses' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."online_courses"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'online_courses' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."online_courses"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'online_courses' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."online_courses"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'online_courses' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."online_courses"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: online_lessons
ALTER TABLE IF EXISTS public."online_lessons" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='online_lessons' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'online_lessons' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."online_lessons"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'online_lessons' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."online_lessons"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'online_lessons' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."online_lessons"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'online_lessons' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."online_lessons"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: online_enrollments
ALTER TABLE IF EXISTS public."online_enrollments" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='online_enrollments' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'online_enrollments' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."online_enrollments"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'online_enrollments' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."online_enrollments"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'online_enrollments' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."online_enrollments"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'online_enrollments' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."online_enrollments"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: online_assessments
ALTER TABLE IF EXISTS public."online_assessments" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='online_assessments' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'online_assessments' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."online_assessments"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'online_assessments' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."online_assessments"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'online_assessments' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."online_assessments"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'online_assessments' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."online_assessments"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: online_assessment_results
ALTER TABLE IF EXISTS public."online_assessment_results" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='online_assessment_results' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'online_assessment_results' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."online_assessment_results"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'online_assessment_results' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."online_assessment_results"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'online_assessment_results' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."online_assessment_results"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'online_assessment_results' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."online_assessment_results"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: online_certificates
ALTER TABLE IF EXISTS public."online_certificates" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='online_certificates' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'online_certificates' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."online_certificates"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'online_certificates' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."online_certificates"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'online_certificates' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."online_certificates"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'online_certificates' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."online_certificates"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: online_notes
ALTER TABLE IF EXISTS public."online_notes" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='online_notes' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'online_notes' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."online_notes"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'online_notes' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."online_notes"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'online_notes' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."online_notes"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'online_notes' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."online_notes"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: connected_apps
ALTER TABLE IF EXISTS public."connected_apps" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='connected_apps' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'connected_apps' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."connected_apps"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'connected_apps' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."connected_apps"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'connected_apps' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."connected_apps"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'connected_apps' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."connected_apps"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: chat_rooms
ALTER TABLE IF EXISTS public."chat_rooms" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chat_rooms' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_rooms' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."chat_rooms"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_rooms' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."chat_rooms"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_rooms' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."chat_rooms"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_rooms' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."chat_rooms"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: chat_participants
ALTER TABLE IF EXISTS public."chat_participants" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chat_participants' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_participants' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."chat_participants"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_participants' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."chat_participants"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_participants' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."chat_participants"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_participants' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."chat_participants"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: chat_messages
ALTER TABLE IF EXISTS public."chat_messages" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='chat_messages' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."chat_messages"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."chat_messages"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."chat_messages"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."chat_messages"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: video_rooms
ALTER TABLE IF EXISTS public."video_rooms" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='video_rooms' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'video_rooms' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."video_rooms"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'video_rooms' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."video_rooms"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'video_rooms' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."video_rooms"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'video_rooms' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."video_rooms"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: platform_roles
ALTER TABLE IF EXISTS public."platform_roles" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='platform_roles' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'platform_roles' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."platform_roles"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'platform_roles' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."platform_roles"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'platform_roles' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."platform_roles"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'platform_roles' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."platform_roles"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: platform_role_permissions
ALTER TABLE IF EXISTS public."platform_role_permissions" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='platform_role_permissions' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'platform_role_permissions' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."platform_role_permissions"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'platform_role_permissions' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."platform_role_permissions"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'platform_role_permissions' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."platform_role_permissions"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'platform_role_permissions' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."platform_role_permissions"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: platform_departments
ALTER TABLE IF EXISTS public."platform_departments" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='platform_departments' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'platform_departments' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."platform_departments"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'platform_departments' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."platform_departments"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'platform_departments' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."platform_departments"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'platform_departments' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."platform_departments"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: subscription_plans
ALTER TABLE IF EXISTS public."subscription_plans" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='subscription_plans' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscription_plans' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."subscription_plans"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscription_plans' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."subscription_plans"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscription_plans' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."subscription_plans"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscription_plans' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."subscription_plans"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: company_subscriptions
ALTER TABLE IF EXISTS public."company_subscriptions" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='company_subscriptions' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'company_subscriptions' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."company_subscriptions"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'company_subscriptions' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."company_subscriptions"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'company_subscriptions' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."company_subscriptions"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'company_subscriptions' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."company_subscriptions"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: usage_metrics
ALTER TABLE IF EXISTS public."usage_metrics" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='usage_metrics' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'usage_metrics' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."usage_metrics"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'usage_metrics' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."usage_metrics"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'usage_metrics' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."usage_metrics"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'usage_metrics' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."usage_metrics"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: billing_transactions
ALTER TABLE IF EXISTS public."billing_transactions" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='billing_transactions' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'billing_transactions' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."billing_transactions"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'billing_transactions' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."billing_transactions"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'billing_transactions' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."billing_transactions"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'billing_transactions' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."billing_transactions"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_accesscontrols
ALTER TABLE IF EXISTS public."univ_accesscontrols" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_accesscontrols' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_accesscontrols' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_accesscontrols"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_accesscontrols' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_accesscontrols"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_accesscontrols' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_accesscontrols"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_accesscontrols' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_accesscontrols"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_adspend
ALTER TABLE IF EXISTS public."univ_adspend" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_adspend' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_adspend' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_adspend"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_adspend' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_adspend"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_adspend' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_adspend"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_adspend' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_adspend"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_advocacy
ALTER TABLE IF EXISTS public."univ_advocacy" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_advocacy' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_advocacy' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_advocacy"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_advocacy' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_advocacy"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_advocacy' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_advocacy"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_advocacy' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_advocacy"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_affiliateprogram
ALTER TABLE IF EXISTS public."univ_affiliateprogram" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_affiliateprogram' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_affiliateprogram' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_affiliateprogram"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_affiliateprogram' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_affiliateprogram"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_affiliateprogram' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_affiliateprogram"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_affiliateprogram' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_affiliateprogram"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_agentcommissions
ALTER TABLE IF EXISTS public."univ_agentcommissions" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_agentcommissions' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_agentcommissions' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_agentcommissions"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_agentcommissions' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_agentcommissions"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_agentcommissions' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_agentcommissions"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_agentcommissions' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_agentcommissions"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_allergylist
ALTER TABLE IF EXISTS public."univ_allergylist" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_allergylist' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_allergylist' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_allergylist"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_allergylist' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_allergylist"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_allergylist' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_allergylist"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_allergylist' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_allergylist"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_alumnis
ALTER TABLE IF EXISTS public."univ_alumnis" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_alumnis' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_alumnis' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_alumnis"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_alumnis' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_alumnis"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_alumnis' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_alumnis"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_alumnis' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_alumnis"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_apiintegrations
ALTER TABLE IF EXISTS public."univ_apiintegrations" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_apiintegrations' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_apiintegrations' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_apiintegrations"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_apiintegrations' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_apiintegrations"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_apiintegrations' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_apiintegrations"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_apiintegrations' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_apiintegrations"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_appointments
ALTER TABLE IF EXISTS public."univ_appointments" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_appointments' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_appointments' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_appointments"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_appointments' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_appointments"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_appointments' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_appointments"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_appointments' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_appointments"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_arbitration
ALTER TABLE IF EXISTS public."univ_arbitration" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_arbitration' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_arbitration' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_arbitration"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_arbitration' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_arbitration"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_arbitration' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_arbitration"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_arbitration' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_arbitration"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_assemblylines
ALTER TABLE IF EXISTS public."univ_assemblylines" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_assemblylines' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_assemblylines' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_assemblylines"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_assemblylines' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_assemblylines"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_assemblylines' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_assemblylines"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_assemblylines' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_assemblylines"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_assets
ALTER TABLE IF EXISTS public."univ_assets" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_assets' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_assets' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_assets"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_assets' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_assets"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_assets' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_assets"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_assets' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_assets"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_attendance
ALTER TABLE IF EXISTS public."univ_attendance" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_attendance' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_attendance' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_attendance"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_attendance' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_attendance"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_attendance' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_attendance"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_attendance' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_attendance"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_audittrails
ALTER TABLE IF EXISTS public."univ_audittrails" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_audittrails' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_audittrails' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_audittrails"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_audittrails' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_audittrails"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_audittrails' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_audittrails"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_audittrails' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_audittrails"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_bankreconciliations
ALTER TABLE IF EXISTS public."univ_bankreconciliations" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_bankreconciliations' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_bankreconciliations' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_bankreconciliations"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_bankreconciliations' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_bankreconciliations"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_bankreconciliations' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_bankreconciliations"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_bankreconciliations' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_bankreconciliations"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_beneficiarylist
ALTER TABLE IF EXISTS public."univ_beneficiarylist" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_beneficiarylist' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_beneficiarylist' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_beneficiarylist"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_beneficiarylist' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_beneficiarylist"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_beneficiarylist' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_beneficiarylist"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_beneficiarylist' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_beneficiarylist"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_benefitelection
ALTER TABLE IF EXISTS public."univ_benefitelection" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_benefitelection' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_benefitelection' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_benefitelection"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_benefitelection' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_benefitelection"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_benefitelection' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_benefitelection"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_benefitelection' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_benefitelection"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_billofladings
ALTER TABLE IF EXISTS public."univ_billofladings" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_billofladings' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_billofladings' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_billofladings"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_billofladings' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_billofladings"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_billofladings' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_billofladings"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_billofladings' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_billofladings"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_blueprints
ALTER TABLE IF EXISTS public."univ_blueprints" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_blueprints' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_blueprints' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_blueprints"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_blueprints' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_blueprints"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_blueprints' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_blueprints"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_blueprints' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_blueprints"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_boms
ALTER TABLE IF EXISTS public."univ_boms" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_boms' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_boms' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_boms"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_boms' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_boms"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_boms' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_boms"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_boms' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_boms"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_bookings
ALTER TABLE IF EXISTS public."univ_bookings" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_bookings' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_bookings' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_bookings"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_bookings' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_bookings"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_bookings' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_bookings"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_bookings' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_bookings"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_boqs
ALTER TABLE IF EXISTS public."univ_boqs" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_boqs' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_boqs' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_boqs"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_boqs' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_boqs"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_boqs' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_boqs"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_boqs' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_boqs"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_brandasset
ALTER TABLE IF EXISTS public."univ_brandasset" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_brandasset' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_brandasset' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_brandasset"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_brandasset' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_brandasset"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_brandasset' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_brandasset"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_brandasset' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_brandasset"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_briefs
ALTER TABLE IF EXISTS public."univ_briefs" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_briefs' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_briefs' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_briefs"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_briefs' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_briefs"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_briefs' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_briefs"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_briefs' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_briefs"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_budgetforecasts
ALTER TABLE IF EXISTS public."univ_budgetforecasts" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_budgetforecasts' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_budgetforecasts' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_budgetforecasts"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_budgetforecasts' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_budgetforecasts"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_budgetforecasts' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_budgetforecasts"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_budgetforecasts' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_budgetforecasts"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_budgetplans
ALTER TABLE IF EXISTS public."univ_budgetplans" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_budgetplans' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_budgetplans' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_budgetplans"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_budgetplans' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_budgetplans"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_budgetplans' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_budgetplans"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_budgetplans' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_budgetplans"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_calllogs
ALTER TABLE IF EXISTS public."univ_calllogs" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_calllogs' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_calllogs' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_calllogs"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_calllogs' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_calllogs"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_calllogs' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_calllogs"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_calllogs' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_calllogs"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_campaignmetric
ALTER TABLE IF EXISTS public."univ_campaignmetric" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_campaignmetric' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_campaignmetric' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_campaignmetric"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_campaignmetric' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_campaignmetric"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_campaignmetric' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_campaignmetric"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_campaignmetric' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_campaignmetric"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_campaignschedule
ALTER TABLE IF EXISTS public."univ_campaignschedule" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_campaignschedule' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_campaignschedule' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_campaignschedule"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_campaignschedule' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_campaignschedule"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_campaignschedule' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_campaignschedule"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_campaignschedule' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_campaignschedule"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_carrental
ALTER TABLE IF EXISTS public."univ_carrental" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_carrental' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_carrental' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_carrental"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_carrental' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_carrental"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_carrental' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_carrental"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_carrental' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_carrental"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_carriercontracts
ALTER TABLE IF EXISTS public."univ_carriercontracts" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_carriercontracts' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_carriercontracts' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_carriercontracts"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_carriercontracts' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_carriercontracts"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_carriercontracts' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_carriercontracts"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_carriercontracts' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_carriercontracts"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_cases
ALTER TABLE IF EXISTS public."univ_cases" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_cases' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_cases' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_cases"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_cases' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_cases"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_cases' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_cases"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_cases' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_cases"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_cashflows
ALTER TABLE IF EXISTS public."univ_cashflows" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_cashflows' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_cashflows' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_cashflows"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_cashflows' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_cashflows"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_cashflows' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_cashflows"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_cashflows' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_cashflows"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_changerequests
ALTER TABLE IF EXISTS public."univ_changerequests" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_changerequests' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_changerequests' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_changerequests"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_changerequests' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_changerequests"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_changerequests' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_changerequests"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_changerequests' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_changerequests"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_chattranscripts
ALTER TABLE IF EXISTS public."univ_chattranscripts" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_chattranscripts' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_chattranscripts' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_chattranscripts"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_chattranscripts' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_chattranscripts"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_chattranscripts' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_chattranscripts"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_chattranscripts' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_chattranscripts"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_churnrisks
ALTER TABLE IF EXISTS public."univ_churnrisks" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_churnrisks' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_churnrisks' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_churnrisks"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_churnrisks' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_churnrisks"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_churnrisks' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_churnrisks"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_churnrisks' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_churnrisks"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_class_attendance
ALTER TABLE IF EXISTS public."univ_class_attendance" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_class_attendance' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_class_attendance' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_class_attendance"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_class_attendance' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_class_attendance"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_class_attendance' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_class_attendance"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_class_attendance' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_class_attendance"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_clientledger
ALTER TABLE IF EXISTS public."univ_clientledger" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_clientledger' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_clientledger' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_clientledger"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_clientledger' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_clientledger"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_clientledger' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_clientledger"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_clientledger' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_clientledger"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_client_portal
ALTER TABLE IF EXISTS public."univ_client_portal" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_client_portal' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_client_portal' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_client_portal"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_client_portal' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_client_portal"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_client_portal' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_client_portal"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_client_portal' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_client_portal"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_coldchains
ALTER TABLE IF EXISTS public."univ_coldchains" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_coldchains' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_coldchains' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_coldchains"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_coldchains' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_coldchains"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_coldchains' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_coldchains"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_coldchains' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_coldchains"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_commissionstructure
ALTER TABLE IF EXISTS public."univ_commissionstructure" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_commissionstructure' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_commissionstructure' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_commissionstructure"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_commissionstructure' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_commissionstructure"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_commissionstructure' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_commissionstructure"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_commissionstructure' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_commissionstructure"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_competitorprices
ALTER TABLE IF EXISTS public."univ_competitorprices" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_competitorprices' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_competitorprices' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_competitorprices"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_competitorprices' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_competitorprices"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_competitorprices' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_competitorprices"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_competitorprices' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_competitorprices"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_concretetests
ALTER TABLE IF EXISTS public."univ_concretetests" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_concretetests' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_concretetests' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_concretetests"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_concretetests' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_concretetests"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_concretetests' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_concretetests"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_concretetests' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_concretetests"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_conflictcheck
ALTER TABLE IF EXISTS public."univ_conflictcheck" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_conflictcheck' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_conflictcheck' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_conflictcheck"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_conflictcheck' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_conflictcheck"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_conflictcheck' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_conflictcheck"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_conflictcheck' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_conflictcheck"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_consultation
ALTER TABLE IF EXISTS public."univ_consultation" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_consultation' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_consultation' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_consultation"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_consultation' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_consultation"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_consultation' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_consultation"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_consultation' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_consultation"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_contacts
ALTER TABLE IF EXISTS public."univ_contacts" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_contacts' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_contacts' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_contacts"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_contacts' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_contacts"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_contacts' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_contacts"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_contacts' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_contacts"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_contractmanagements
ALTER TABLE IF EXISTS public."univ_contractmanagements" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_contractmanagements' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_contractmanagements' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_contractmanagements"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_contractmanagements' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_contractmanagements"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_contractmanagements' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_contractmanagements"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_contractmanagements' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_contractmanagements"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_contractors
ALTER TABLE IF EXISTS public."univ_contractors" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_contractors' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_contractors' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_contractors"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_contractors' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_contractors"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_contractors' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_contractors"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_contractors' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_contractors"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_courses
ALTER TABLE IF EXISTS public."univ_courses" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_courses' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_courses' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_courses"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_courses' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_courses"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_courses' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_courses"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_courses' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_courses"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_court_calendar
ALTER TABLE IF EXISTS public."univ_court_calendar" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_court_calendar' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_court_calendar' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_court_calendar"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_court_calendar' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_court_calendar"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_court_calendar' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_court_calendar"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_court_calendar' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_court_calendar"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_crm_leads
ALTER TABLE IF EXISTS public."univ_crm_leads" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_crm_leads' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_crm_leads' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_crm_leads"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_crm_leads' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_crm_leads"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_crm_leads' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_crm_leads"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_crm_leads' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_crm_leads"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_crossdockings
ALTER TABLE IF EXISTS public."univ_crossdockings" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_crossdockings' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_crossdockings' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_crossdockings"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_crossdockings' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_crossdockings"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_crossdockings' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_crossdockings"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_crossdockings' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_crossdockings"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_customerjourneys
ALTER TABLE IF EXISTS public."univ_customerjourneys" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_customerjourneys' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_customerjourneys' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_customerjourneys"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_customerjourneys' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_customerjourneys"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_customerjourneys' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_customerjourneys"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_customerjourneys' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_customerjourneys"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_customerreviews
ALTER TABLE IF EXISTS public."univ_customerreviews" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_customerreviews' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_customerreviews' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_customerreviews"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_customerreviews' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_customerreviews"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_customerreviews' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_customerreviews"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_customerreviews' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_customerreviews"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_customersegments
ALTER TABLE IF EXISTS public."univ_customersegments" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_customersegments' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_customersegments' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_customersegments"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_customersegments' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_customersegments"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_customersegments' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_customersegments"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_customersegments' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_customersegments"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_customsdocs
ALTER TABLE IF EXISTS public."univ_customsdocs" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_customsdocs' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_customsdocs' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_customsdocs"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_customsdocs' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_customsdocs"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_customsdocs' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_customsdocs"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_customsdocs' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_customsdocs"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_damagedgoodss
ALTER TABLE IF EXISTS public."univ_damagedgoodss" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_damagedgoodss' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_damagedgoodss' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_damagedgoodss"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_damagedgoodss' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_damagedgoodss"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_damagedgoodss' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_damagedgoodss"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_damagedgoodss' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_damagedgoodss"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_databackups
ALTER TABLE IF EXISTS public."univ_databackups" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_databackups' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_databackups' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_databackups"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_databackups' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_databackups"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_databackups' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_databackups"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_databackups' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_databackups"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_deliveries
ALTER TABLE IF EXISTS public."univ_deliveries" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_deliveries' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_deliveries' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_deliveries"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_deliveries' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_deliveries"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_deliveries' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_deliveries"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_deliveries' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_deliveries"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_digitalassets
ALTER TABLE IF EXISTS public."univ_digitalassets" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_digitalassets' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_digitalassets' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_digitalassets"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_digitalassets' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_digitalassets"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_digitalassets' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_digitalassets"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_digitalassets' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_digitalassets"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_dining_orders
ALTER TABLE IF EXISTS public."univ_dining_orders" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_dining_orders' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_dining_orders' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_dining_orders"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_dining_orders' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_dining_orders"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_dining_orders' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_dining_orders"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_dining_orders' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_dining_orders"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_dischargesummary
ALTER TABLE IF EXISTS public."univ_dischargesummary" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_dischargesummary' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_dischargesummary' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_dischargesummary"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_dischargesummary' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_dischargesummary"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_dischargesummary' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_dischargesummary"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_dischargesummary' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_dischargesummary"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_disciplinary
ALTER TABLE IF EXISTS public."univ_disciplinary" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_disciplinary' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_disciplinary' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_disciplinary"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_disciplinary' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_disciplinary"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_disciplinary' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_disciplinary"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_disciplinary' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_disciplinary"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_discounts
ALTER TABLE IF EXISTS public."univ_discounts" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_discounts' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_discounts' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_discounts"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_discounts' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_discounts"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_discounts' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_discounts"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_discounts' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_discounts"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_dispatch
ALTER TABLE IF EXISTS public."univ_dispatch" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_dispatch' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_dispatch' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_dispatch"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_dispatch' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_dispatch"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_dispatch' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_dispatch"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_dispatch' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_dispatch"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_doctorschedules
ALTER TABLE IF EXISTS public."univ_doctorschedules" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_doctorschedules' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_doctorschedules' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_doctorschedules"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_doctorschedules' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_doctorschedules"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_doctorschedules' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_doctorschedules"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_doctorschedules' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_doctorschedules"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_documents
ALTER TABLE IF EXISTS public."univ_documents" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_documents' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_documents' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_documents"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_documents' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_documents"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_documents' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_documents"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_documents' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_documents"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_donationlog
ALTER TABLE IF EXISTS public."univ_donationlog" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_donationlog' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_donationlog' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_donationlog"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_donationlog' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_donationlog"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_donationlog' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_donationlog"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_donationlog' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_donationlog"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_donorprofile
ALTER TABLE IF EXISTS public."univ_donorprofile" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_donorprofile' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_donorprofile' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_donorprofile"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_donorprofile' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_donorprofile"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_donorprofile' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_donorprofile"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_donorprofile' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_donorprofile"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_employeeperformances
ALTER TABLE IF EXISTS public."univ_employeeperformances" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_employeeperformances' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_employeeperformances' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_employeeperformances"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_employeeperformances' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_employeeperformances"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_employeeperformances' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_employeeperformances"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_employeeperformances' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_employeeperformances"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_emr
ALTER TABLE IF EXISTS public."univ_emr" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_emr' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_emr' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_emr"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_emr' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_emr"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_emr' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_emr"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_emr' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_emr"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_enrollments
ALTER TABLE IF EXISTS public."univ_enrollments" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_enrollments' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_enrollments' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_enrollments"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_enrollments' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_enrollments"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_enrollments' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_enrollments"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_enrollments' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_enrollments"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_equipmentrentals
ALTER TABLE IF EXISTS public."univ_equipmentrentals" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_equipmentrentals' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_equipmentrentals' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_equipmentrentals"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_equipmentrentals' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_equipmentrentals"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_equipmentrentals' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_equipmentrentals"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_equipmentrentals' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_equipmentrentals"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_escrow
ALTER TABLE IF EXISTS public."univ_escrow" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_escrow' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_escrow' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_escrow"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_escrow' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_escrow"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_escrow' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_escrow"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_escrow' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_escrow"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_eventplanner
ALTER TABLE IF EXISTS public."univ_eventplanner" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_eventplanner' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_eventplanner' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_eventplanner"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_eventplanner' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_eventplanner"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_eventplanner' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_eventplanner"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_eventplanner' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_eventplanner"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_examschedules
ALTER TABLE IF EXISTS public."univ_examschedules" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_examschedules' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_examschedules' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_examschedules"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_examschedules' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_examschedules"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_examschedules' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_examschedules"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_examschedules' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_examschedules"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_exitinterview
ALTER TABLE IF EXISTS public."univ_exitinterview" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_exitinterview' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_exitinterview' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_exitinterview"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_exitinterview' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_exitinterview"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_exitinterview' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_exitinterview"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_exitinterview' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_exitinterview"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_expenseclaim
ALTER TABLE IF EXISTS public."univ_expenseclaim" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_expenseclaim' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_expenseclaim' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_expenseclaim"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_expenseclaim' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_expenseclaim"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_expenseclaim' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_expenseclaim"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_expenseclaim' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_expenseclaim"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_expensereports
ALTER TABLE IF EXISTS public."univ_expensereports" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_expensereports' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_expensereports' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_expensereports"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_expensereports' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_expensereports"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_expensereports' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_expensereports"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_expensereports' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_expensereports"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_expertwitness
ALTER TABLE IF EXISTS public."univ_expertwitness" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_expertwitness' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_expertwitness' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_expertwitness"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_expertwitness' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_expertwitness"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_expertwitness' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_expertwitness"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_expertwitness' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_expertwitness"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_extracurriculars
ALTER TABLE IF EXISTS public."univ_extracurriculars" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_extracurriculars' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_extracurriculars' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_extracurriculars"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_extracurriculars' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_extracurriculars"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_extracurriculars' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_extracurriculars"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_extracurriculars' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_extracurriculars"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_faculty
ALTER TABLE IF EXISTS public."univ_faculty" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_faculty' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_faculty' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_faculty"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_faculty' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_faculty"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_faculty' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_faculty"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_faculty' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_faculty"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_featurerequests
ALTER TABLE IF EXISTS public."univ_featurerequests" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_featurerequests' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_featurerequests' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_featurerequests"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_featurerequests' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_featurerequests"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_featurerequests' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_featurerequests"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_featurerequests' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_featurerequests"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_feedbacksurvey
ALTER TABLE IF EXISTS public."univ_feedbacksurvey" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_feedbacksurvey' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_feedbacksurvey' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_feedbacksurvey"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_feedbacksurvey' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_feedbacksurvey"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_feedbacksurvey' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_feedbacksurvey"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_feedbacksurvey' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_feedbacksurvey"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_fixedassets
ALTER TABLE IF EXISTS public."univ_fixedassets" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_fixedassets' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_fixedassets' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_fixedassets"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_fixedassets' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_fixedassets"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_fixedassets' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_fixedassets"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_fixedassets' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_fixedassets"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_fleet
ALTER TABLE IF EXISTS public."univ_fleet" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_fleet' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_fleet' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_fleet"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_fleet' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_fleet"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_fleet' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_fleet"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_fleet' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_fleet"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_forkliftmaintenances
ALTER TABLE IF EXISTS public."univ_forkliftmaintenances" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_forkliftmaintenances' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_forkliftmaintenances' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_forkliftmaintenances"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_forkliftmaintenances' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_forkliftmaintenances"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_forkliftmaintenances' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_forkliftmaintenances"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_forkliftmaintenances' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_forkliftmaintenances"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_gdprrequests
ALTER TABLE IF EXISTS public."univ_gdprrequests" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_gdprrequests' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_gdprrequests' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_gdprrequests"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_gdprrequests' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_gdprrequests"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_gdprrequests' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_gdprrequests"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_gdprrequests' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_gdprrequests"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_generalledgers
ALTER TABLE IF EXISTS public."univ_generalledgers" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_generalledgers' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_generalledgers' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_generalledgers"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_generalledgers' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_generalledgers"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_generalledgers' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_generalledgers"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_generalledgers' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_generalledgers"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_giftcards
ALTER TABLE IF EXISTS public."univ_giftcards" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_giftcards' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_giftcards' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_giftcards"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_giftcards' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_giftcards"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_giftcards' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_giftcards"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_giftcards' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_giftcards"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_gradebook
ALTER TABLE IF EXISTS public."univ_gradebook" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_gradebook' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_gradebook' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_gradebook"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_gradebook' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_gradebook"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_gradebook' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_gradebook"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_gradebook' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_gradebook"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_healthsafetys
ALTER TABLE IF EXISTS public."univ_healthsafetys" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_healthsafetys' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_healthsafetys' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_healthsafetys"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_healthsafetys' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_healthsafetys"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_healthsafetys' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_healthsafetys"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_healthsafetys' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_healthsafetys"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_hoas
ALTER TABLE IF EXISTS public."univ_hoas" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_hoas' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hoas' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_hoas"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hoas' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_hoas"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hoas' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_hoas"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hoas' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_hoas"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_hotelreview
ALTER TABLE IF EXISTS public."univ_hotelreview" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_hotelreview' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hotelreview' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_hotelreview"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hotelreview' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_hotelreview"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hotelreview' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_hotelreview"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hotelreview' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_hotelreview"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_housekeeping
ALTER TABLE IF EXISTS public."univ_housekeeping" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_housekeeping' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_housekeeping' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_housekeeping"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_housekeeping' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_housekeeping"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_housekeeping' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_housekeeping"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_housekeeping' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_housekeeping"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_hr_employees
ALTER TABLE IF EXISTS public."univ_hr_employees" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_hr_employees' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hr_employees' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_hr_employees"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hr_employees' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_hr_employees"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hr_employees' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_hr_employees"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hr_employees' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_hr_employees"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_hr_departments
ALTER TABLE IF EXISTS public."univ_hr_departments" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_hr_departments' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hr_departments' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_hr_departments"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hr_departments' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_hr_departments"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hr_departments' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_hr_departments"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hr_departments' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_hr_departments"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_hr_payroll
ALTER TABLE IF EXISTS public."univ_hr_payroll" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_hr_payroll' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hr_payroll' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_hr_payroll"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hr_payroll' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_hr_payroll"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hr_payroll' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_hr_payroll"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hr_payroll' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_hr_payroll"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_hr_leave
ALTER TABLE IF EXISTS public."univ_hr_leave" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_hr_leave' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hr_leave' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_hr_leave"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hr_leave' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_hr_leave"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hr_leave' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_hr_leave"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hr_leave' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_hr_leave"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_hr_recruitment
ALTER TABLE IF EXISTS public."univ_hr_recruitment" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_hr_recruitment' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hr_recruitment' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_hr_recruitment"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hr_recruitment' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_hr_recruitment"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hr_recruitment' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_hr_recruitment"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hr_recruitment' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_hr_recruitment"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_immunization
ALTER TABLE IF EXISTS public."univ_immunization" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_immunization' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_immunization' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_immunization"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_immunization' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_immunization"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_immunization' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_immunization"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_immunization' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_immunization"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_incidentreports
ALTER TABLE IF EXISTS public."univ_incidentreports" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_incidentreports' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_incidentreports' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_incidentreports"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_incidentreports' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_incidentreports"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_incidentreports' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_incidentreports"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_incidentreports' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_incidentreports"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_inkinddonation
ALTER TABLE IF EXISTS public."univ_inkinddonation" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_inkinddonation' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_inkinddonation' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_inkinddonation"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_inkinddonation' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_inkinddonation"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_inkinddonation' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_inkinddonation"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_inkinddonation' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_inkinddonation"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_insurancepolicy
ALTER TABLE IF EXISTS public."univ_insurancepolicy" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_insurancepolicy' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_insurancepolicy' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_insurancepolicy"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_insurancepolicy' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_insurancepolicy"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_insurancepolicy' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_insurancepolicy"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_insurancepolicy' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_insurancepolicy"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_reinsurance
ALTER TABLE IF EXISTS public."univ_reinsurance" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_reinsurance' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_reinsurance' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_reinsurance"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_reinsurance' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_reinsurance"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_reinsurance' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_reinsurance"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_reinsurance' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_reinsurance"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_inventory
ALTER TABLE IF EXISTS public."univ_inventory" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_inventory' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_inventory' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_inventory"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_inventory' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_inventory"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_inventory' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_inventory"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_inventory' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_inventory"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_invoices
ALTER TABLE IF EXISTS public."univ_invoices" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_invoices' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_invoices' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_invoices"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_invoices' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_invoices"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_invoices' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_invoices"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_invoices' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_invoices"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_ipaddresses
ALTER TABLE IF EXISTS public."univ_ipaddresses" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_ipaddresses' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_ipaddresses' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_ipaddresses"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_ipaddresses' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_ipaddresses"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_ipaddresses' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_ipaddresses"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_ipaddresses' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_ipaddresses"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_kanban_tasks
ALTER TABLE IF EXISTS public."univ_kanban_tasks" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_kanban_tasks' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_kanban_tasks' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_kanban_tasks"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_kanban_tasks' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_kanban_tasks"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_kanban_tasks' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_kanban_tasks"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_kanban_tasks' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_kanban_tasks"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_kbarticles
ALTER TABLE IF EXISTS public."univ_kbarticles" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_kbarticles' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_kbarticles' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_kbarticles"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_kbarticles' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_kbarticles"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_kbarticles' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_kbarticles"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_kbarticles' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_kbarticles"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_kpitrackers
ALTER TABLE IF EXISTS public."univ_kpitrackers" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_kpitrackers' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_kpitrackers' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_kpitrackers"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_kpitrackers' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_kpitrackers"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_kpitrackers' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_kpitrackers"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_kpitrackers' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_kpitrackers"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_labs
ALTER TABLE IF EXISTS public."univ_labs" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_labs' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_labs' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_labs"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_labs' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_labs"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_labs' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_labs"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_labs' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_labs"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_leadmagnets
ALTER TABLE IF EXISTS public."univ_leadmagnets" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_leadmagnets' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_leadmagnets' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_leadmagnets"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_leadmagnets' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_leadmagnets"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_leadmagnets' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_leadmagnets"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_leadmagnets' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_leadmagnets"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_lease
ALTER TABLE IF EXISTS public."univ_lease" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_lease' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_lease' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_lease"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_lease' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_lease"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_lease' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_lease"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_lease' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_lease"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_leave_management
ALTER TABLE IF EXISTS public."univ_leave_management" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_leave_management' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_leave_management' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_leave_management"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_leave_management' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_leave_management"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_leave_management' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_leave_management"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_leave_management' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_leave_management"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_legal_documents
ALTER TABLE IF EXISTS public."univ_legal_documents" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_legal_documents' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_legal_documents' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_legal_documents"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_legal_documents' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_legal_documents"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_legal_documents' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_legal_documents"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_legal_documents' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_legal_documents"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_librarybooks
ALTER TABLE IF EXISTS public."univ_librarybooks" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_librarybooks' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_librarybooks' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_librarybooks"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_librarybooks' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_librarybooks"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_librarybooks' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_librarybooks"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_librarybooks' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_librarybooks"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_listing
ALTER TABLE IF EXISTS public."univ_listing" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_listing' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_listing' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_listing"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_listing' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_listing"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_listing' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_listing"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_listing' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_listing"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_lms_lessons
ALTER TABLE IF EXISTS public."univ_lms_lessons" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_lms_lessons' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_lms_lessons' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_lms_lessons"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_lms_lessons' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_lms_lessons"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_lms_lessons' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_lms_lessons"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_lms_lessons' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_lms_lessons"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_loyaltypoints
ALTER TABLE IF EXISTS public."univ_loyaltypoints" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_loyaltypoints' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_loyaltypoints' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_loyaltypoints"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_loyaltypoints' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_loyaltypoints"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_loyaltypoints' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_loyaltypoints"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_loyaltypoints' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_loyaltypoints"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_luggageclaim
ALTER TABLE IF EXISTS public."univ_luggageclaim" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_luggageclaim' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_luggageclaim' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_luggageclaim"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_luggageclaim' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_luggageclaim"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_luggageclaim' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_luggageclaim"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_luggageclaim' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_luggageclaim"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_machines
ALTER TABLE IF EXISTS public."univ_machines" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_machines' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_machines' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_machines"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_machines' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_machines"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_machines' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_machines"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_machines' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_machines"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_maintenancerequest
ALTER TABLE IF EXISTS public."univ_maintenancerequest" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_maintenancerequest' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_maintenancerequest' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_maintenancerequest"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_maintenancerequest' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_maintenancerequest"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_maintenancerequest' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_maintenancerequest"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_maintenancerequest' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_maintenancerequest"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_medicalclaims
ALTER TABLE IF EXISTS public."univ_medicalclaims" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_medicalclaims' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_medicalclaims' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_medicalclaims"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_medicalclaims' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_medicalclaims"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_medicalclaims' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_medicalclaims"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_medicalclaims' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_medicalclaims"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_medicalbillings
ALTER TABLE IF EXISTS public."univ_medicalbillings" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_medicalbillings' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_medicalbillings' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_medicalbillings"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_medicalbillings' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_medicalbillings"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_medicalbillings' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_medicalbillings"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_medicalbillings' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_medicalbillings"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_meetingminutess
ALTER TABLE IF EXISTS public."univ_meetingminutess" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_meetingminutess' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_meetingminutess' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_meetingminutess"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_meetingminutess' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_meetingminutess"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_meetingminutess' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_meetingminutess"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_meetingminutess' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_meetingminutess"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_menus
ALTER TABLE IF EXISTS public."univ_menus" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_menus' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_menus' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_menus"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_menus' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_menus"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_menus' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_menus"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_menus' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_menus"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_newsletter
ALTER TABLE IF EXISTS public."univ_newsletter" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_newsletter' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_newsletter' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_newsletter"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_newsletter' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_newsletter"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_newsletter' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_newsletter"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_newsletter' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_newsletter"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_notifications
ALTER TABLE IF EXISTS public."univ_notifications" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_notifications' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_notifications' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_notifications"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_notifications' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_notifications"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_notifications' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_notifications"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_notifications' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_notifications"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_onboardingtask
ALTER TABLE IF EXISTS public."univ_onboardingtask" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_onboardingtask' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_onboardingtask' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_onboardingtask"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_onboardingtask' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_onboardingtask"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_onboardingtask' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_onboardingtask"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_onboardingtask' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_onboardingtask"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_operationtheater
ALTER TABLE IF EXISTS public."univ_operationtheater" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_operationtheater' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_operationtheater' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_operationtheater"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_operationtheater' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_operationtheater"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_operationtheater' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_operationtheater"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_operationtheater' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_operationtheater"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_orderregistrys
ALTER TABLE IF EXISTS public."univ_orderregistrys" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_orderregistrys' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_orderregistrys' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_orderregistrys"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_orderregistrys' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_orderregistrys"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_orderregistrys' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_orderregistrys"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_orderregistrys' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_orderregistrys"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_orgchart
ALTER TABLE IF EXISTS public."univ_orgchart" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_orgchart' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_orgchart' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_orgchart"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_orgchart' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_orgchart"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_orgchart' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_orgchart"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_orgchart' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_orgchart"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_pallettracker
ALTER TABLE IF EXISTS public."univ_pallettracker" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_pallettracker' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_pallettracker' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_pallettracker"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_pallettracker' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_pallettracker"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_pallettracker' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_pallettracker"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_pallettracker' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_pallettracker"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_parent_portal_access
ALTER TABLE IF EXISTS public."univ_parent_portal_access" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_parent_portal_access' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_parent_portal_access' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_parent_portal_access"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_parent_portal_access' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_parent_portal_access"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_parent_portal_access' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_parent_portal_access"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_parent_portal_access' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_parent_portal_access"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_patients
ALTER TABLE IF EXISTS public."univ_patients" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_patients' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_patients' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_patients"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_patients' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_patients"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_patients' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_patients"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_patients' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_patients"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_payments
ALTER TABLE IF EXISTS public."univ_payments" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_payments' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_payments' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_payments"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_payments' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_payments"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_payments' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_payments"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_payments' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_payments"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_payroll
ALTER TABLE IF EXISTS public."univ_payroll" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_payroll' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_payroll' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_payroll"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_payroll' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_payroll"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_payroll' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_payroll"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_payroll' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_payroll"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_permittrackers
ALTER TABLE IF EXISTS public."univ_permittrackers" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_permittrackers' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_permittrackers' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_permittrackers"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_permittrackers' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_permittrackers"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_permittrackers' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_permittrackers"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_permittrackers' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_permittrackers"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_pledge
ALTER TABLE IF EXISTS public."univ_pledge" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_pledge' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_pledge' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_pledge"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_pledge' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_pledge"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_pledge' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_pledge"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_pledge' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_pledge"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_pos
ALTER TABLE IF EXISTS public."univ_pos" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_pos' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_pos' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_pos"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_pos' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_pos"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_pos' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_pos"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_pos' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_pos"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_prescriptions
ALTER TABLE IF EXISTS public."univ_prescriptions" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_prescriptions' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_prescriptions' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_prescriptions"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_prescriptions' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_prescriptions"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_prescriptions' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_prescriptions"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_prescriptions' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_prescriptions"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_pressrelease
ALTER TABLE IF EXISTS public."univ_pressrelease" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_pressrelease' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_pressrelease' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_pressrelease"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_pressrelease' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_pressrelease"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_pressrelease' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_pressrelease"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_pressrelease' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_pressrelease"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_procurement
ALTER TABLE IF EXISTS public."univ_procurement" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_procurement' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_procurement' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_procurement"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_procurement' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_procurement"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_procurement' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_procurement"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_procurement' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_procurement"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_productcatalogs
ALTER TABLE IF EXISTS public."univ_productcatalogs" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_productcatalogs' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_productcatalogs' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_productcatalogs"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_productcatalogs' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_productcatalogs"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_productcatalogs' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_productcatalogs"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_productcatalogs' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_productcatalogs"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_production
ALTER TABLE IF EXISTS public."univ_production" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_production' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_production' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_production"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_production' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_production"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_production' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_production"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_production' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_production"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_productionschedules
ALTER TABLE IF EXISTS public."univ_productionschedules" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_productionschedules' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_productionschedules' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_productionschedules"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_productionschedules' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_productionschedules"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_productionschedules' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_productionschedules"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_productionschedules' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_productionschedules"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_projects
ALTER TABLE IF EXISTS public."univ_projects" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_projects' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_projects' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_projects"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_projects' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_projects"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_projects' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_projects"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_projects' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_projects"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_projectmilestones
ALTER TABLE IF EXISTS public."univ_projectmilestones" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_projectmilestones' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_projectmilestones' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_projectmilestones"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_projectmilestones' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_projectmilestones"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_projectmilestones' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_projectmilestones"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_projectmilestones' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_projectmilestones"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_property
ALTER TABLE IF EXISTS public."univ_property" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_property' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_property' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_property"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_property' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_property"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_property' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_property"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_property' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_property"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_propertyinspection
ALTER TABLE IF EXISTS public."univ_propertyinspection" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_propertyinspection' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_propertyinspection' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_propertyinspection"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_propertyinspection' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_propertyinspection"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_propertyinspection' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_propertyinspection"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_propertyinspection' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_propertyinspection"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_purchaseorders
ALTER TABLE IF EXISTS public."univ_purchaseorders" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_purchaseorders' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_purchaseorders' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_purchaseorders"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_purchaseorders' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_purchaseorders"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_purchaseorders' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_purchaseorders"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_purchaseorders' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_purchaseorders"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_quality_control
ALTER TABLE IF EXISTS public."univ_quality_control" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_quality_control' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_quality_control' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_quality_control"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_quality_control' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_quality_control"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_quality_control' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_quality_control"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_quality_control' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_quality_control"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_rawmaterials
ALTER TABLE IF EXISTS public."univ_rawmaterials" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_rawmaterials' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_rawmaterials' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_rawmaterials"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_rawmaterials' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_rawmaterials"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_rawmaterials' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_rawmaterials"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_rawmaterials' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_rawmaterials"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_recruitment
ALTER TABLE IF EXISTS public."univ_recruitment" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_recruitment' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_recruitment' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_recruitment"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_recruitment' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_recruitment"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_recruitment' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_recruitment"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_recruitment' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_recruitment"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_referrals
ALTER TABLE IF EXISTS public."univ_referrals" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_referrals' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_referrals' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_referrals"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_referrals' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_referrals"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_referrals' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_referrals"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_referrals' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_referrals"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_retainer
ALTER TABLE IF EXISTS public."univ_retainer" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_retainer' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_retainer' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_retainer"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_retainer' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_retainer"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_retainer' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_retainer"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_retainer' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_retainer"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_returnrefunds
ALTER TABLE IF EXISTS public."univ_returnrefunds" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_returnrefunds' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_returnrefunds' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_returnrefunds"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_returnrefunds' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_returnrefunds"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_returnrefunds' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_returnrefunds"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_returnrefunds' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_returnrefunds"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_riskregisters
ALTER TABLE IF EXISTS public."univ_riskregisters" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_riskregisters' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_riskregisters' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_riskregisters"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_riskregisters' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_riskregisters"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_riskregisters' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_riskregisters"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_riskregisters' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_riskregisters"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_rooms
ALTER TABLE IF EXISTS public."univ_rooms" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_rooms' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_rooms' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_rooms"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_rooms' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_rooms"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_rooms' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_rooms"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_rooms' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_rooms"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_routes
ALTER TABLE IF EXISTS public."univ_routes" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_routes' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_routes' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_routes"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_routes' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_routes"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_routes' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_routes"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_routes' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_routes"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_safety
ALTER TABLE IF EXISTS public."univ_safety" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_safety' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_safety' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_safety"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_safety' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_safety"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_safety' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_safety"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_safety' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_safety"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_salestargets
ALTER TABLE IF EXISTS public."univ_salestargets" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_salestargets' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_salestargets' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_salestargets"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_salestargets' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_salestargets"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_salestargets' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_salestargets"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_salestargets' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_salestargets"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_scholarships
ALTER TABLE IF EXISTS public."univ_scholarships" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_scholarships' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_scholarships' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_scholarships"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_scholarships' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_scholarships"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_scholarships' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_scholarships"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_scholarships' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_scholarships"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_scraprates
ALTER TABLE IF EXISTS public."univ_scraprates" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_scraprates' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_scraprates' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_scraprates"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_scraprates' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_scraprates"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_scraprates' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_scraprates"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_scraprates' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_scraprates"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_seokeyword
ALTER TABLE IF EXISTS public."univ_seokeyword" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_seokeyword' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_seokeyword' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_seokeyword"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_seokeyword' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_seokeyword"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_seokeyword' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_seokeyword"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_seokeyword' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_seokeyword"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_servermetrics
ALTER TABLE IF EXISTS public."univ_servermetrics" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_servermetrics' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_servermetrics' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_servermetrics"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_servermetrics' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_servermetrics"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_servermetrics' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_servermetrics"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_servermetrics' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_servermetrics"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_site_inspections
ALTER TABLE IF EXISTS public."univ_site_inspections" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_site_inspections' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_site_inspections' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_site_inspections"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_site_inspections' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_site_inspections"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_site_inspections' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_site_inspections"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_site_inspections' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_site_inspections"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_slaagreements
ALTER TABLE IF EXISTS public."univ_slaagreements" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_slaagreements' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_slaagreements' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_slaagreements"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_slaagreements' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_slaagreements"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_slaagreements' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_slaagreements"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_slaagreements' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_slaagreements"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_snaglists
ALTER TABLE IF EXISTS public."univ_snaglists" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_snaglists' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_snaglists' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_snaglists"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_snaglists' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_snaglists"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_snaglists' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_snaglists"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_snaglists' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_snaglists"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_softwarelicenses
ALTER TABLE IF EXISTS public."univ_softwarelicenses" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_softwarelicenses' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_softwarelicenses' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_softwarelicenses"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_softwarelicenses' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_softwarelicenses"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_softwarelicenses' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_softwarelicenses"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_softwarelicenses' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_softwarelicenses"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_sponsorship
ALTER TABLE IF EXISTS public."univ_sponsorship" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_sponsorship' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_sponsorship' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_sponsorship"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_sponsorship' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_sponsorship"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_sponsorship' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_sponsorship"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_sponsorship' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_sponsorship"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_sslcertificates
ALTER TABLE IF EXISTS public."univ_sslcertificates" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_sslcertificates' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_sslcertificates' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_sslcertificates"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_sslcertificates' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_sslcertificates"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_sslcertificates' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_sslcertificates"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_sslcertificates' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_sslcertificates"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_stockoptions
ALTER TABLE IF EXISTS public."univ_stockoptions" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_stockoptions' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_stockoptions' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_stockoptions"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_stockoptions' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_stockoptions"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_stockoptions' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_stockoptions"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_stockoptions' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_stockoptions"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_students
ALTER TABLE IF EXISTS public."univ_students" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_students' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_students' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_students"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_students' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_students"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_students' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_students"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_students' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_students"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_subscriptions
ALTER TABLE IF EXISTS public."univ_subscriptions" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_subscriptions' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_subscriptions' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_subscriptions"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_subscriptions' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_subscriptions"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_subscriptions' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_subscriptions"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_subscriptions' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_subscriptions"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_supplierdirectorys
ALTER TABLE IF EXISTS public."univ_supplierdirectorys" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_supplierdirectorys' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_supplierdirectorys' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_supplierdirectorys"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_supplierdirectorys' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_supplierdirectorys"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_supplierdirectorys' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_supplierdirectorys"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_supplierdirectorys' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_supplierdirectorys"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_supporttickets
ALTER TABLE IF EXISTS public."univ_supporttickets" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_supporttickets' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_supporttickets' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_supporttickets"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_supporttickets' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_supporttickets"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_supporttickets' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_supporttickets"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_supporttickets' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_supporttickets"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_tablereservation
ALTER TABLE IF EXISTS public."univ_tablereservation" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_tablereservation' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_tablereservation' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_tablereservation"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_tablereservation' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_tablereservation"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_tablereservation' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_tablereservation"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_tablereservation' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_tablereservation"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_taxfilings
ALTER TABLE IF EXISTS public."univ_taxfilings" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_taxfilings' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_taxfilings' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_taxfilings"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_taxfilings' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_taxfilings"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_taxfilings' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_taxfilings"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_taxfilings' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_taxfilings"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_telemedicine
ALTER TABLE IF EXISTS public."univ_telemedicine" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_telemedicine' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_telemedicine' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_telemedicine"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_telemedicine' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_telemedicine"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_telemedicine' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_telemedicine"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_telemedicine' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_telemedicine"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_surgeries
ALTER TABLE IF EXISTS public."univ_surgeries" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_surgeries' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_surgeries' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_surgeries"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_surgeries' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_surgeries"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_surgeries' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_surgeries"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_surgeries' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_surgeries"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_imaging
ALTER TABLE IF EXISTS public."univ_imaging" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_imaging' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_imaging' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_imaging"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_imaging' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_imaging"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_imaging' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_imaging"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_imaging' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_imaging"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_ambulance_dispatch
ALTER TABLE IF EXISTS public."univ_ambulance_dispatch" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_ambulance_dispatch' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_ambulance_dispatch' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_ambulance_dispatch"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_ambulance_dispatch' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_ambulance_dispatch"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_ambulance_dispatch' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_ambulance_dispatch"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_ambulance_dispatch' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_ambulance_dispatch"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_tenant
ALTER TABLE IF EXISTS public."univ_tenant" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_tenant' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_tenant' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_tenant"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_tenant' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_tenant"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_tenant' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_tenant"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_tenant' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_tenant"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_ticketsales
ALTER TABLE IF EXISTS public."univ_ticketsales" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_ticketsales' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_ticketsales' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_ticketsales"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_ticketsales' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_ticketsales"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_ticketsales' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_ticketsales"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_ticketsales' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_ticketsales"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_timebilling
ALTER TABLE IF EXISTS public."univ_timebilling" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_timebilling' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_timebilling' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_timebilling"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_timebilling' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_timebilling"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_timebilling' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_timebilling"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_timebilling' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_timebilling"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_timesheet
ALTER TABLE IF EXISTS public."univ_timesheet" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_timesheet' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_timesheet' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_timesheet"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_timesheet' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_timesheet"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_timesheet' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_timesheet"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_timesheet' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_timesheet"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_tourpackage
ALTER TABLE IF EXISTS public."univ_tourpackage" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_tourpackage' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_tourpackage' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_tourpackage"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_tourpackage' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_tourpackage"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_tourpackage' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_tourpackage"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_tourpackage' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_tourpackage"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_trademark
ALTER TABLE IF EXISTS public."univ_trademark" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_trademark' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_trademark' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_trademark"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_trademark' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_trademark"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_trademark' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_trademark"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_trademark' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_trademark"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_trainingrecords
ALTER TABLE IF EXISTS public."univ_trainingrecords" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_trainingrecords' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_trainingrecords' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_trainingrecords"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_trainingrecords' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_trainingrecords"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_trainingrecords' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_trainingrecords"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_trainingrecords' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_trainingrecords"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_triage
ALTER TABLE IF EXISTS public."univ_triage" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_triage' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_triage' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_triage"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_triage' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_triage"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_triage' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_triage"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_triage' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_triage"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_tuitions
ALTER TABLE IF EXISTS public."univ_tuitions" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_tuitions' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_tuitions' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_tuitions"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_tuitions' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_tuitions"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_tuitions' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_tuitions"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_tuitions' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_tuitions"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_utilitybills
ALTER TABLE IF EXISTS public."univ_utilitybills" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_utilitybills' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_utilitybills' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_utilitybills"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_utilitybills' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_utilitybills"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_utilitybills' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_utilitybills"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_utilitybills' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_utilitybills"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_vitalsigns
ALTER TABLE IF EXISTS public."univ_vitalsigns" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_vitalsigns' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_vitalsigns' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_vitalsigns"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_vitalsigns' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_vitalsigns"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_vitalsigns' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_vitalsigns"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_vitalsigns' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_vitalsigns"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_volunteerroster
ALTER TABLE IF EXISTS public."univ_volunteerroster" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_volunteerroster' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_volunteerroster' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_volunteerroster"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_volunteerroster' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_volunteerroster"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_volunteerroster' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_volunteerroster"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_volunteerroster' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_volunteerroster"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_vulnerabilities
ALTER TABLE IF EXISTS public."univ_vulnerabilities" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_vulnerabilities' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_vulnerabilities' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_vulnerabilities"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_vulnerabilities' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_vulnerabilities"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_vulnerabilities' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_vulnerabilities"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_vulnerabilities' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_vulnerabilities"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_wards
ALTER TABLE IF EXISTS public."univ_wards" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_wards' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_wards' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_wards"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_wards' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_wards"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_wards' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_wards"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_wards' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_wards"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_warehouses
ALTER TABLE IF EXISTS public."univ_warehouses" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_warehouses' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_warehouses' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_warehouses"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_warehouses' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_warehouses"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_warehouses' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_warehouses"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_warehouses' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_warehouses"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_wishlists
ALTER TABLE IF EXISTS public."univ_wishlists" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_wishlists' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_wishlists' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_wishlists"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_wishlists' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_wishlists"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_wishlists' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_wishlists"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_wishlists' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_wishlists"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_workorders
ALTER TABLE IF EXISTS public."univ_workorders" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_workorders' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_workorders' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_workorders"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_workorders' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_workorders"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_workorders' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_workorders"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_workorders' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_workorders"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: routes
ALTER TABLE IF EXISTS public."routes" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='routes' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'routes' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."routes"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'routes' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."routes"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'routes' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."routes"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'routes' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."routes"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: pod_records
ALTER TABLE IF EXISTS public."pod_records" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pod_records' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pod_records' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."pod_records"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pod_records' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."pod_records"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pod_records' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."pod_records"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pod_records' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."pod_records"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: return_orders
ALTER TABLE IF EXISTS public."return_orders" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='return_orders' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'return_orders' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."return_orders"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'return_orders' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."return_orders"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'return_orders' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."return_orders"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'return_orders' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."return_orders"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: incident_reports
ALTER TABLE IF EXISTS public."incident_reports" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='incident_reports' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'incident_reports' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."incident_reports"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'incident_reports' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."incident_reports"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'incident_reports' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."incident_reports"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'incident_reports' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."incident_reports"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: gps_tracking
ALTER TABLE IF EXISTS public."gps_tracking" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='gps_tracking' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gps_tracking' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."gps_tracking"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gps_tracking' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."gps_tracking"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gps_tracking' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."gps_tracking"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gps_tracking' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."gps_tracking"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: vehicle_registrations
ALTER TABLE IF EXISTS public."vehicle_registrations" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicle_registrations' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_registrations' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."vehicle_registrations"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_registrations' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."vehicle_registrations"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_registrations' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."vehicle_registrations"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_registrations' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."vehicle_registrations"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: vehicle_insurance
ALTER TABLE IF EXISTS public."vehicle_insurance" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicle_insurance' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_insurance' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."vehicle_insurance"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_insurance' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."vehicle_insurance"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_insurance' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."vehicle_insurance"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_insurance' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."vehicle_insurance"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: vehicle_licenses
ALTER TABLE IF EXISTS public."vehicle_licenses" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicle_licenses' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_licenses' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."vehicle_licenses"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_licenses' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."vehicle_licenses"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_licenses' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."vehicle_licenses"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_licenses' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."vehicle_licenses"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: vehicle_service_records
ALTER TABLE IF EXISTS public."vehicle_service_records" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicle_service_records' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_service_records' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."vehicle_service_records"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_service_records' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."vehicle_service_records"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_service_records' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."vehicle_service_records"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_service_records' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."vehicle_service_records"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: maintenance_schedules
ALTER TABLE IF EXISTS public."maintenance_schedules" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='maintenance_schedules' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'maintenance_schedules' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."maintenance_schedules"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'maintenance_schedules' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."maintenance_schedules"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'maintenance_schedules' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."maintenance_schedules"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'maintenance_schedules' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."maintenance_schedules"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: preventive_maintenance_plans
ALTER TABLE IF EXISTS public."preventive_maintenance_plans" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='preventive_maintenance_plans' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'preventive_maintenance_plans' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."preventive_maintenance_plans"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'preventive_maintenance_plans' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."preventive_maintenance_plans"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'preventive_maintenance_plans' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."preventive_maintenance_plans"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'preventive_maintenance_plans' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."preventive_maintenance_plans"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: vehicle_breakdowns
ALTER TABLE IF EXISTS public."vehicle_breakdowns" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicle_breakdowns' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_breakdowns' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."vehicle_breakdowns"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_breakdowns' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."vehicle_breakdowns"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_breakdowns' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."vehicle_breakdowns"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_breakdowns' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."vehicle_breakdowns"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: tire_management
ALTER TABLE IF EXISTS public."tire_management" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tire_management' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tire_management' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."tire_management"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tire_management' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."tire_management"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tire_management' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."tire_management"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tire_management' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."tire_management"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: fuel_management
ALTER TABLE IF EXISTS public."fuel_management" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fuel_management' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fuel_management' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."fuel_management"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fuel_management' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."fuel_management"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fuel_management' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."fuel_management"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fuel_management' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."fuel_management"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: spare_parts_inventory
ALTER TABLE IF EXISTS public."spare_parts_inventory" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='spare_parts_inventory' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'spare_parts_inventory' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."spare_parts_inventory"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'spare_parts_inventory' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."spare_parts_inventory"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'spare_parts_inventory' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."spare_parts_inventory"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'spare_parts_inventory' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."spare_parts_inventory"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: asset_tracking
ALTER TABLE IF EXISTS public."asset_tracking" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='asset_tracking' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'asset_tracking' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."asset_tracking"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'asset_tracking' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."asset_tracking"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'asset_tracking' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."asset_tracking"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'asset_tracking' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."asset_tracking"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: vehicle_utilization
ALTER TABLE IF EXISTS public."vehicle_utilization" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicle_utilization' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_utilization' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."vehicle_utilization"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_utilization' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."vehicle_utilization"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_utilization' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."vehicle_utilization"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_utilization' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."vehicle_utilization"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: vehicle_downtime
ALTER TABLE IF EXISTS public."vehicle_downtime" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicle_downtime' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_downtime' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."vehicle_downtime"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_downtime' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."vehicle_downtime"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_downtime' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."vehicle_downtime"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_downtime' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."vehicle_downtime"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: vehicle_inspections
ALTER TABLE IF EXISTS public."vehicle_inspections" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicle_inspections' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_inspections' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."vehicle_inspections"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_inspections' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."vehicle_inspections"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_inspections' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."vehicle_inspections"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_inspections' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."vehicle_inspections"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_pharmacy
ALTER TABLE IF EXISTS public."univ_pharmacy" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_pharmacy' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_pharmacy' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_pharmacy"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_pharmacy' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_pharmacy"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_pharmacy' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_pharmacy"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_pharmacy' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_pharmacy"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_admissions
ALTER TABLE IF EXISTS public."univ_admissions" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_admissions' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_admissions' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_admissions"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_admissions' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_admissions"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_admissions' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_admissions"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_admissions' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_admissions"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_medical_history
ALTER TABLE IF EXISTS public."univ_medical_history" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_medical_history' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_medical_history' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_medical_history"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_medical_history' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_medical_history"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_medical_history' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_medical_history"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_medical_history' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_medical_history"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_hotel_reservations
ALTER TABLE IF EXISTS public."univ_hotel_reservations" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_hotel_reservations' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hotel_reservations' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_hotel_reservations"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hotel_reservations' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_hotel_reservations"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hotel_reservations' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_hotel_reservations"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hotel_reservations' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_hotel_reservations"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_hotel_rooms
ALTER TABLE IF EXISTS public."univ_hotel_rooms" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_hotel_rooms' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hotel_rooms' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_hotel_rooms"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hotel_rooms' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_hotel_rooms"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hotel_rooms' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_hotel_rooms"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hotel_rooms' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_hotel_rooms"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_hotel_requests
ALTER TABLE IF EXISTS public."univ_hotel_requests" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_hotel_requests' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hotel_requests' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_hotel_requests"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hotel_requests' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_hotel_requests"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hotel_requests' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_hotel_requests"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hotel_requests' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_hotel_requests"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_hotel_menu
ALTER TABLE IF EXISTS public."univ_hotel_menu" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_hotel_menu' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hotel_menu' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_hotel_menu"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hotel_menu' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_hotel_menu"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hotel_menu' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_hotel_menu"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hotel_menu' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_hotel_menu"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: univ_hotel_restaurant_orders
ALTER TABLE IF EXISTS public."univ_hotel_restaurant_orders" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='univ_hotel_restaurant_orders' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hotel_restaurant_orders' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."univ_hotel_restaurant_orders"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hotel_restaurant_orders' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."univ_hotel_restaurant_orders"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hotel_restaurant_orders' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."univ_hotel_restaurant_orders"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'univ_hotel_restaurant_orders' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."univ_hotel_restaurant_orders"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: workspace_insights
ALTER TABLE IF EXISTS public."workspace_insights" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='workspace_insights' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_insights' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."workspace_insights"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_insights' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."workspace_insights"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_insights' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."workspace_insights"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_insights' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."workspace_insights"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: intelligence_runs
ALTER TABLE IF EXISTS public."intelligence_runs" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='intelligence_runs' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'intelligence_runs' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."intelligence_runs"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'intelligence_runs' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."intelligence_runs"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'intelligence_runs' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."intelligence_runs"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'intelligence_runs' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."intelligence_runs"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: entity_intelligence
ALTER TABLE IF EXISTS public."entity_intelligence" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='entity_intelligence' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'entity_intelligence' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."entity_intelligence"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'entity_intelligence' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."entity_intelligence"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'entity_intelligence' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."entity_intelligence"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'entity_intelligence' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."entity_intelligence"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: insight_feedback
ALTER TABLE IF EXISTS public."insight_feedback" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='insight_feedback' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'insight_feedback' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."insight_feedback"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'insight_feedback' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."insight_feedback"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'insight_feedback' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."insight_feedback"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'insight_feedback' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."insight_feedback"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: engine_accuracy
ALTER TABLE IF EXISTS public."engine_accuracy" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='engine_accuracy' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'engine_accuracy' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."engine_accuracy"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'engine_accuracy' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."engine_accuracy"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'engine_accuracy' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."engine_accuracy"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'engine_accuracy' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."engine_accuracy"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: component_registry
ALTER TABLE IF EXISTS public."component_registry" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='component_registry' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'component_registry' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."component_registry"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'component_registry' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."component_registry"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'component_registry' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."component_registry"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'component_registry' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."component_registry"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: industry_templates
ALTER TABLE IF EXISTS public."industry_templates" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='industry_templates' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'industry_templates' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."industry_templates"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'industry_templates' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."industry_templates"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'industry_templates' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."industry_templates"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'industry_templates' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."industry_templates"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: workspace_modules
ALTER TABLE IF EXISTS public."workspace_modules" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='workspace_modules' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_modules' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."workspace_modules"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_modules' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."workspace_modules"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_modules' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."workspace_modules"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_modules' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."workspace_modules"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: marketplace_review_requests
ALTER TABLE IF EXISTS public."marketplace_review_requests" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='marketplace_review_requests' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marketplace_review_requests' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."marketplace_review_requests"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marketplace_review_requests' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."marketplace_review_requests"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marketplace_review_requests' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."marketplace_review_requests"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marketplace_review_requests' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."marketplace_review_requests"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: uni_departments
ALTER TABLE IF EXISTS public."uni_departments" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='uni_departments' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_departments' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."uni_departments"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_departments' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."uni_departments"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_departments' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."uni_departments"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_departments' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."uni_departments"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: uni_programs
ALTER TABLE IF EXISTS public."uni_programs" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='uni_programs' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_programs' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."uni_programs"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_programs' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."uni_programs"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_programs' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."uni_programs"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_programs' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."uni_programs"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: uni_staff
ALTER TABLE IF EXISTS public."uni_staff" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='uni_staff' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_staff' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."uni_staff"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_staff' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."uni_staff"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_staff' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."uni_staff"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_staff' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."uni_staff"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: uni_students
ALTER TABLE IF EXISTS public."uni_students" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='uni_students' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_students' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."uni_students"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_students' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."uni_students"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_students' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."uni_students"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_students' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."uni_students"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: uni_courses
ALTER TABLE IF EXISTS public."uni_courses" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='uni_courses' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_courses' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."uni_courses"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_courses' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."uni_courses"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_courses' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."uni_courses"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_courses' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."uni_courses"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: uni_enrollments
ALTER TABLE IF EXISTS public."uni_enrollments" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='uni_enrollments' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_enrollments' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."uni_enrollments"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_enrollments' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."uni_enrollments"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_enrollments' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."uni_enrollments"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_enrollments' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."uni_enrollments"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: uni_lms_materials
ALTER TABLE IF EXISTS public."uni_lms_materials" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='uni_lms_materials' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_lms_materials' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."uni_lms_materials"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_lms_materials' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."uni_lms_materials"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_lms_materials' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."uni_lms_materials"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_lms_materials' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."uni_lms_materials"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: uni_lms_assignments
ALTER TABLE IF EXISTS public."uni_lms_assignments" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='uni_lms_assignments' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_lms_assignments' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."uni_lms_assignments"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_lms_assignments' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."uni_lms_assignments"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_lms_assignments' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."uni_lms_assignments"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_lms_assignments' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."uni_lms_assignments"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: uni_lms_submissions
ALTER TABLE IF EXISTS public."uni_lms_submissions" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='uni_lms_submissions' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_lms_submissions' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."uni_lms_submissions"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_lms_submissions' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."uni_lms_submissions"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_lms_submissions' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."uni_lms_submissions"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_lms_submissions' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."uni_lms_submissions"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: uni_exams
ALTER TABLE IF EXISTS public."uni_exams" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='uni_exams' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_exams' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."uni_exams"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_exams' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."uni_exams"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_exams' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."uni_exams"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_exams' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."uni_exams"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: uni_grades
ALTER TABLE IF EXISTS public."uni_grades" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='uni_grades' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_grades' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."uni_grades"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_grades' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."uni_grades"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_grades' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."uni_grades"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_grades' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."uni_grades"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: uni_applicants
ALTER TABLE IF EXISTS public."uni_applicants" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='uni_applicants' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_applicants' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."uni_applicants"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_applicants' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."uni_applicants"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_applicants' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."uni_applicants"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_applicants' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."uni_applicants"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: uni_fees
ALTER TABLE IF EXISTS public."uni_fees" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='uni_fees' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_fees' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."uni_fees"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_fees' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."uni_fees"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_fees' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."uni_fees"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_fees' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."uni_fees"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: uni_hostel_rooms
ALTER TABLE IF EXISTS public."uni_hostel_rooms" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='uni_hostel_rooms' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_hostel_rooms' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."uni_hostel_rooms"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_hostel_rooms' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."uni_hostel_rooms"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_hostel_rooms' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."uni_hostel_rooms"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_hostel_rooms' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."uni_hostel_rooms"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: uni_library_books
ALTER TABLE IF EXISTS public."uni_library_books" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='uni_library_books' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_library_books' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."uni_library_books"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_library_books' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."uni_library_books"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_library_books' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."uni_library_books"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_library_books' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."uni_library_books"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: uni_research_grants
ALTER TABLE IF EXISTS public."uni_research_grants" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='uni_research_grants' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_research_grants' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."uni_research_grants"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_research_grants' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."uni_research_grants"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_research_grants' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."uni_research_grants"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_research_grants' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."uni_research_grants"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: uni_alumni
ALTER TABLE IF EXISTS public."uni_alumni" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='uni_alumni' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_alumni' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."uni_alumni"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_alumni' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."uni_alumni"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_alumni' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."uni_alumni"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uni_alumni' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."uni_alumni"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: revenue_forecasts
ALTER TABLE IF EXISTS public."revenue_forecasts" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='revenue_forecasts' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'revenue_forecasts' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."revenue_forecasts"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'revenue_forecasts' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."revenue_forecasts"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'revenue_forecasts' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."revenue_forecasts"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'revenue_forecasts' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."revenue_forecasts"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;

-- Table: entity_behaviour_profiles
ALTER TABLE IF EXISTS public."entity_behaviour_profiles" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='entity_behaviour_profiles' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'entity_behaviour_profiles' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."entity_behaviour_profiles"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'entity_behaviour_profiles' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."entity_behaviour_profiles"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'entity_behaviour_profiles' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."entity_behaviour_profiles"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'entity_behaviour_profiles' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."entity_behaviour_profiles"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;
