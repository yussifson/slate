const fs = require('fs');

const content = fs.readFileSync('src/api/AppSchema.js', 'utf8');
const tables = [...content.matchAll(/\s*([a-zA-Z0-9_]+):\s*new Table\(\{/g)].map(m => m[1]);

let sql = `
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

`;

// Generate policies for each table
tables.forEach(table => {
  // Skip tables that don't have company_id in standard pattern, but we'll assume they do or handle it
  if (['role_permissions', 'company_security_settings', 'data_subject_requests'].includes(table)) return;

  sql += `
-- Table: ${table}
ALTER TABLE IF EXISTS public."${table}" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='${table}' AND column_name='company_id') THEN
      -- SELECT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = '${table}' AND policyname = 'company_isolation_select') THEN
          CREATE POLICY "company_isolation_select" ON public."${table}"
          FOR SELECT USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'read')
          );
      END IF;

      -- INSERT POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = '${table}' AND policyname = 'company_isolation_insert') THEN
          CREATE POLICY "company_isolation_insert" ON public."${table}"
          FOR INSERT WITH CHECK (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'create')
          );
      END IF;

      -- UPDATE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = '${table}' AND policyname = 'company_isolation_update') THEN
          CREATE POLICY "company_isolation_update" ON public."${table}"
          FOR UPDATE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'update')
          );
      END IF;

      -- DELETE POLICY
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = '${table}' AND policyname = 'company_isolation_delete') THEN
          CREATE POLICY "company_isolation_delete" ON public."${table}"
          FOR DELETE USING (
            company_id IN (SELECT user_company_ids())
            AND has_role_permission(company_id, 'delete')
          );
      END IF;
  END IF;
END $$;
`;
});

fs.writeFileSync('rls_migration.sql', sql);
console.log('Successfully generated rls_migration.sql');
