-- Create missing real estate tables

CREATE TABLE IF NOT EXISTS univ_re_mls_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE IF NOT EXISTS univ_re_comparable_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE IF NOT EXISTS univ_re_market_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE IF NOT EXISTS univ_re_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE IF NOT EXISTS univ_re_lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE IF NOT EXISTS univ_re_agentic_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);



-- Seed Component Registry

DO $$
BEGIN
  -- Ensure component_registry has RLS and allows reads
  ALTER TABLE IF EXISTS component_registry ENABLE ROW LEVEL SECURITY;
  
  BEGIN
    CREATE POLICY "Allow public read access" ON component_registry 
    FOR SELECT USING (true);
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN
    CREATE POLICY "Allow service role full access" ON component_registry 
    FOR ALL TO service_role USING (true) WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN NULL; END;

END $$;

INSERT INTO component_registry (id, module_key, display_name, description, category, applicable_industries, config_schema, required_tables, is_active, created_at)
VALUES 
(gen_random_uuid(), 'dashboard_analytics', 'Analytics Dashboard', 'Custom charts, KPI widgets, and data export', 'reporting', '["*"]', '{"fields": {"default_period": {"type": "string", "default": "last_30_days"}}}', '[]', true, now()),
(gen_random_uuid(), 'task_manager', 'Task Manager', 'Assign, track, and complete tasks with deadlines and priorities', 'operations', '["*"]', '{"fields": {"enable_kanban": {"type": "boolean", "default": true}}}', '[]', true, now()),
(gen_random_uuid(), 'team_messaging', 'Team Messaging', 'Internal chat with channels, direct messages, and file sharing', 'communication', '["*"]', '{}', '[]', true, now()),
(gen_random_uuid(), 'appointment_scheduler', 'Appointment Scheduler', 'Book, manage, and track appointments between staff and clients or customers', 'scheduling', '["*"]', '{"fields": {"appointment_duration_minutes": {"type": "number", "default": 30}, "allow_online_booking": {"type": "boolean", "default": true}}}', '[]', true, now()),
(gen_random_uuid(), 'room_booking', 'Room & Space Booking', 'Reserve rooms, halls, or spaces for events and meetings', 'scheduling', '["*"]', '{"fields": {"require_approval": {"type": "boolean", "default": false}}}', '[]', true, now()),
(gen_random_uuid(), 'shift_scheduler', 'Staff Shift Scheduler', 'Plan, assign, and track employee shifts and rosters', 'scheduling', '["*"]', '{}', '[]', true, now()),
(gen_random_uuid(), 'client_crm', 'Client CRM', 'Track client profiles, contact history, and relationship status', 'crm', '["*"]', '{"fields": {"track_lifetime_value": {"type": "boolean", "default": true}}}', '[]', true, now()),
(gen_random_uuid(), 'patient_records', 'Patient Records', 'Medical history, diagnoses, prescriptions, and visit notes', 'records', '["*"]', '{"fields": {"enable_telemedicine": {"type": "boolean", "default": false}}}', '[]', true, now()),
(gen_random_uuid(), 'student_profiles', 'Student Profiles', 'Academic records, attendance, grades, and parent contact', 'records', '["*"]', '{}', '[]', true, now()),
(gen_random_uuid(), 'guest_profiles', 'Guest Profiles', 'Hotel guest history, preferences, and stay records', 'records', '["*"]', '{}', '[]', true, now()),
(gen_random_uuid(), 'congregation_members', 'Congregation Members', 'Member directory, attendance, giving, and pastoral notes', 'records', '["*"]', '{}', '[]', true, now()),
(gen_random_uuid(), 'inventory_manager', 'Inventory Manager', 'Track stock levels, reorder points, and product catalog', 'inventory', '["*"]', '{"fields": {"enable_barcode": {"type": "boolean", "default": false}, "low_stock_threshold": {"type": "number", "default": 10}}}', '[]', true, now()),
(gen_random_uuid(), 'pharmacy_inventory', 'Pharmacy Inventory', 'Drug stock management with expiry tracking and reorder alerts', 'inventory', '["*"]', '{}', '[]', true, now()),
(gen_random_uuid(), 'invoicing', 'Invoicing & Billing', 'Create, send, and track invoices and payment status', 'finance', '["*"]', '{"fields": {"currency": {"type": "string", "default": "USD"}, "tax_rate": {"type": "number", "default": 0}}}', '[]', true, now()),
(gen_random_uuid(), 'payroll', 'Payroll Management', 'Calculate and process employee salaries, deductions, and benefits', 'finance', '["*"]', '{}', '[]', true, now()),
(gen_random_uuid(), 'donation_tracking', 'Donation & Giving Tracker', 'Record tithes, offerings, pledges, and mission giving', 'finance', '["*"]', '{}', '[]', true, now()),
(gen_random_uuid(), 'fee_management', 'Fee & Tuition Management', 'Manage student fee schedules, payments, and outstanding balances', 'finance', '["*"]', '{}', '[]', true, now()),
(gen_random_uuid(), 'employee_directory', 'Employee Directory', 'Staff profiles, departments, roles, and contact information', 'hr', '["*"]', '{}', '[]', true, now()),
(gen_random_uuid(), 'leave_management', 'Leave & Time-off Management', 'Leave requests, approvals, balances, and calendar visibility', 'hr', '["*"]', '{"fields": {"auto_approve_under_days": {"type": "number", "default": 0}}}', '[]', true, now()),
(gen_random_uuid(), 'performance_reviews', 'Performance Reviews', 'Schedule, conduct, and track employee performance evaluations', 'hr', '["*"]', '{"fields": {"review_cycle_months": {"type": "number", "default": 12}}}', '[]', true, now()),
(gen_random_uuid(), 'recruitment', 'Recruitment Pipeline', 'Job postings, candidate tracking, interviews, and offers', 'hr', '["*"]', '{}', '[]', true, now()),
(gen_random_uuid(), 'fleet_management', 'Fleet Management', 'Vehicle tracking, maintenance schedules, and driver assignments', 'operations', '["*"]', '{}', '[]', true, now()),
(gen_random_uuid(), 'case_pipeline', 'Case Pipeline', 'Legal case intake, progression tracking, and outcome recording', 'operations', '["*"]', '{}', '[]', true, now()),
(gen_random_uuid(), 'claims_management', 'Claims Management', 'Insurance claim intake, processing, review, and settlement', 'operations', '["*"]', '{}', '[]', true, now()),
(gen_random_uuid(), 'audit_log_viewer', 'Audit Log', 'Immutable record of all system actions for compliance', 'reporting', '["*"]', '{}', '[]', true, now()),
(gen_random_uuid(), 'email_inbox', 'Email Inbox', 'Send and receive emails directly within the workspace', 'communication', '["*"]', '{}', '[]', true, now()),
(gen_random_uuid(), 'announcement_board', 'Announcement Board', 'Post notices, circulars, and updates for the team or congregation', 'communication', '["*"]', '{}', '[]', true, now())
ON CONFLICT (module_key) DO UPDATE 
SET display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    config_schema = EXCLUDED.config_schema,
    is_active = true;


-- Fix Real Estate Schema & RLS

DO $$
BEGIN

    -- univ_re_properties
    BEGIN
        ALTER TABLE IF EXISTS univ_re_properties ADD COLUMN IF NOT EXISTS company_id UUID;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE IF EXISTS univ_re_properties ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Enable ALL for users based on company_id" ON univ_re_properties;
        CREATE POLICY "Enable ALL for users based on company_id" ON univ_re_properties 
        AS PERMISSIVE FOR ALL 
        TO public 
        USING (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text)) 
        WITH CHECK (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text));
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Allow full access for service role" ON univ_re_properties;
        CREATE POLICY "Allow full access for service role" ON univ_re_properties 
        AS PERMISSIVE FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER PUBLICATION powersync ADD TABLE univ_re_properties;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- univ_re_clients
    BEGIN
        ALTER TABLE IF EXISTS univ_re_clients ADD COLUMN IF NOT EXISTS company_id UUID;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE IF EXISTS univ_re_clients ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Enable ALL for users based on company_id" ON univ_re_clients;
        CREATE POLICY "Enable ALL for users based on company_id" ON univ_re_clients 
        AS PERMISSIVE FOR ALL 
        TO public 
        USING (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text)) 
        WITH CHECK (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text));
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Allow full access for service role" ON univ_re_clients;
        CREATE POLICY "Allow full access for service role" ON univ_re_clients 
        AS PERMISSIVE FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER PUBLICATION powersync ADD TABLE univ_re_clients;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- univ_re_viewings
    BEGIN
        ALTER TABLE IF EXISTS univ_re_viewings ADD COLUMN IF NOT EXISTS company_id UUID;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE IF EXISTS univ_re_viewings ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Enable ALL for users based on company_id" ON univ_re_viewings;
        CREATE POLICY "Enable ALL for users based on company_id" ON univ_re_viewings 
        AS PERMISSIVE FOR ALL 
        TO public 
        USING (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text)) 
        WITH CHECK (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text));
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Allow full access for service role" ON univ_re_viewings;
        CREATE POLICY "Allow full access for service role" ON univ_re_viewings 
        AS PERMISSIVE FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER PUBLICATION powersync ADD TABLE univ_re_viewings;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- univ_re_offers
    BEGIN
        ALTER TABLE IF EXISTS univ_re_offers ADD COLUMN IF NOT EXISTS company_id UUID;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE IF EXISTS univ_re_offers ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Enable ALL for users based on company_id" ON univ_re_offers;
        CREATE POLICY "Enable ALL for users based on company_id" ON univ_re_offers 
        AS PERMISSIVE FOR ALL 
        TO public 
        USING (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text)) 
        WITH CHECK (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text));
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Allow full access for service role" ON univ_re_offers;
        CREATE POLICY "Allow full access for service role" ON univ_re_offers 
        AS PERMISSIVE FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER PUBLICATION powersync ADD TABLE univ_re_offers;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- univ_re_transactions
    BEGIN
        ALTER TABLE IF EXISTS univ_re_transactions ADD COLUMN IF NOT EXISTS company_id UUID;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE IF EXISTS univ_re_transactions ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Enable ALL for users based on company_id" ON univ_re_transactions;
        CREATE POLICY "Enable ALL for users based on company_id" ON univ_re_transactions 
        AS PERMISSIVE FOR ALL 
        TO public 
        USING (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text)) 
        WITH CHECK (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text));
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Allow full access for service role" ON univ_re_transactions;
        CREATE POLICY "Allow full access for service role" ON univ_re_transactions 
        AS PERMISSIVE FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER PUBLICATION powersync ADD TABLE univ_re_transactions;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- univ_re_commissions
    BEGIN
        ALTER TABLE IF EXISTS univ_re_commissions ADD COLUMN IF NOT EXISTS company_id UUID;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE IF EXISTS univ_re_commissions ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Enable ALL for users based on company_id" ON univ_re_commissions;
        CREATE POLICY "Enable ALL for users based on company_id" ON univ_re_commissions 
        AS PERMISSIVE FOR ALL 
        TO public 
        USING (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text)) 
        WITH CHECK (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text));
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Allow full access for service role" ON univ_re_commissions;
        CREATE POLICY "Allow full access for service role" ON univ_re_commissions 
        AS PERMISSIVE FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER PUBLICATION powersync ADD TABLE univ_re_commissions;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- univ_re_documents
    BEGIN
        ALTER TABLE IF EXISTS univ_re_documents ADD COLUMN IF NOT EXISTS company_id UUID;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE IF EXISTS univ_re_documents ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Enable ALL for users based on company_id" ON univ_re_documents;
        CREATE POLICY "Enable ALL for users based on company_id" ON univ_re_documents 
        AS PERMISSIVE FOR ALL 
        TO public 
        USING (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text)) 
        WITH CHECK (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text));
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Allow full access for service role" ON univ_re_documents;
        CREATE POLICY "Allow full access for service role" ON univ_re_documents 
        AS PERMISSIVE FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER PUBLICATION powersync ADD TABLE univ_re_documents;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- univ_re_leases
    BEGIN
        ALTER TABLE IF EXISTS univ_re_leases ADD COLUMN IF NOT EXISTS company_id UUID;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE IF EXISTS univ_re_leases ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Enable ALL for users based on company_id" ON univ_re_leases;
        CREATE POLICY "Enable ALL for users based on company_id" ON univ_re_leases 
        AS PERMISSIVE FOR ALL 
        TO public 
        USING (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text)) 
        WITH CHECK (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text));
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Allow full access for service role" ON univ_re_leases;
        CREATE POLICY "Allow full access for service role" ON univ_re_leases 
        AS PERMISSIVE FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER PUBLICATION powersync ADD TABLE univ_re_leases;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- univ_re_rent_payments
    BEGIN
        ALTER TABLE IF EXISTS univ_re_rent_payments ADD COLUMN IF NOT EXISTS company_id UUID;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE IF EXISTS univ_re_rent_payments ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Enable ALL for users based on company_id" ON univ_re_rent_payments;
        CREATE POLICY "Enable ALL for users based on company_id" ON univ_re_rent_payments 
        AS PERMISSIVE FOR ALL 
        TO public 
        USING (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text)) 
        WITH CHECK (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text));
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Allow full access for service role" ON univ_re_rent_payments;
        CREATE POLICY "Allow full access for service role" ON univ_re_rent_payments 
        AS PERMISSIVE FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER PUBLICATION powersync ADD TABLE univ_re_rent_payments;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- univ_re_maintenance_requests
    BEGIN
        ALTER TABLE IF EXISTS univ_re_maintenance_requests ADD COLUMN IF NOT EXISTS company_id UUID;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE IF EXISTS univ_re_maintenance_requests ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Enable ALL for users based on company_id" ON univ_re_maintenance_requests;
        CREATE POLICY "Enable ALL for users based on company_id" ON univ_re_maintenance_requests 
        AS PERMISSIVE FOR ALL 
        TO public 
        USING (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text)) 
        WITH CHECK (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text));
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Allow full access for service role" ON univ_re_maintenance_requests;
        CREATE POLICY "Allow full access for service role" ON univ_re_maintenance_requests 
        AS PERMISSIVE FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER PUBLICATION powersync ADD TABLE univ_re_maintenance_requests;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- univ_re_trust_accounts
    BEGIN
        ALTER TABLE IF EXISTS univ_re_trust_accounts ADD COLUMN IF NOT EXISTS company_id UUID;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE IF EXISTS univ_re_trust_accounts ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Enable ALL for users based on company_id" ON univ_re_trust_accounts;
        CREATE POLICY "Enable ALL for users based on company_id" ON univ_re_trust_accounts 
        AS PERMISSIVE FOR ALL 
        TO public 
        USING (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text)) 
        WITH CHECK (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text));
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Allow full access for service role" ON univ_re_trust_accounts;
        CREATE POLICY "Allow full access for service role" ON univ_re_trust_accounts 
        AS PERMISSIVE FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER PUBLICATION powersync ADD TABLE univ_re_trust_accounts;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- univ_re_trust_ledger
    BEGIN
        ALTER TABLE IF EXISTS univ_re_trust_ledger ADD COLUMN IF NOT EXISTS company_id UUID;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE IF EXISTS univ_re_trust_ledger ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Enable ALL for users based on company_id" ON univ_re_trust_ledger;
        CREATE POLICY "Enable ALL for users based on company_id" ON univ_re_trust_ledger 
        AS PERMISSIVE FOR ALL 
        TO public 
        USING (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text)) 
        WITH CHECK (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text));
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Allow full access for service role" ON univ_re_trust_ledger;
        CREATE POLICY "Allow full access for service role" ON univ_re_trust_ledger 
        AS PERMISSIVE FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER PUBLICATION powersync ADD TABLE univ_re_trust_ledger;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- univ_re_escrow_accounts
    BEGIN
        ALTER TABLE IF EXISTS univ_re_escrow_accounts ADD COLUMN IF NOT EXISTS company_id UUID;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE IF EXISTS univ_re_escrow_accounts ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Enable ALL for users based on company_id" ON univ_re_escrow_accounts;
        CREATE POLICY "Enable ALL for users based on company_id" ON univ_re_escrow_accounts 
        AS PERMISSIVE FOR ALL 
        TO public 
        USING (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text)) 
        WITH CHECK (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text));
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Allow full access for service role" ON univ_re_escrow_accounts;
        CREATE POLICY "Allow full access for service role" ON univ_re_escrow_accounts 
        AS PERMISSIVE FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER PUBLICATION powersync ADD TABLE univ_re_escrow_accounts;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- univ_re_document_templates
    BEGIN
        ALTER TABLE IF EXISTS univ_re_document_templates ADD COLUMN IF NOT EXISTS company_id UUID;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE IF EXISTS univ_re_document_templates ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Enable ALL for users based on company_id" ON univ_re_document_templates;
        CREATE POLICY "Enable ALL for users based on company_id" ON univ_re_document_templates 
        AS PERMISSIVE FOR ALL 
        TO public 
        USING (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text)) 
        WITH CHECK (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text));
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Allow full access for service role" ON univ_re_document_templates;
        CREATE POLICY "Allow full access for service role" ON univ_re_document_templates 
        AS PERMISSIVE FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER PUBLICATION powersync ADD TABLE univ_re_document_templates;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- univ_re_e_signatures
    BEGIN
        ALTER TABLE IF EXISTS univ_re_e_signatures ADD COLUMN IF NOT EXISTS company_id UUID;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE IF EXISTS univ_re_e_signatures ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Enable ALL for users based on company_id" ON univ_re_e_signatures;
        CREATE POLICY "Enable ALL for users based on company_id" ON univ_re_e_signatures 
        AS PERMISSIVE FOR ALL 
        TO public 
        USING (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text)) 
        WITH CHECK (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text));
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Allow full access for service role" ON univ_re_e_signatures;
        CREATE POLICY "Allow full access for service role" ON univ_re_e_signatures 
        AS PERMISSIVE FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER PUBLICATION powersync ADD TABLE univ_re_e_signatures;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- univ_re_counter_offers
    BEGIN
        ALTER TABLE IF EXISTS univ_re_counter_offers ADD COLUMN IF NOT EXISTS company_id UUID;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE IF EXISTS univ_re_counter_offers ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Enable ALL for users based on company_id" ON univ_re_counter_offers;
        CREATE POLICY "Enable ALL for users based on company_id" ON univ_re_counter_offers 
        AS PERMISSIVE FOR ALL 
        TO public 
        USING (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text)) 
        WITH CHECK (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text));
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Allow full access for service role" ON univ_re_counter_offers;
        CREATE POLICY "Allow full access for service role" ON univ_re_counter_offers 
        AS PERMISSIVE FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER PUBLICATION powersync ADD TABLE univ_re_counter_offers;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- univ_re_commission_rules
    BEGIN
        ALTER TABLE IF EXISTS univ_re_commission_rules ADD COLUMN IF NOT EXISTS company_id UUID;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE IF EXISTS univ_re_commission_rules ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Enable ALL for users based on company_id" ON univ_re_commission_rules;
        CREATE POLICY "Enable ALL for users based on company_id" ON univ_re_commission_rules 
        AS PERMISSIVE FOR ALL 
        TO public 
        USING (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text)) 
        WITH CHECK (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text));
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Allow full access for service role" ON univ_re_commission_rules;
        CREATE POLICY "Allow full access for service role" ON univ_re_commission_rules 
        AS PERMISSIVE FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER PUBLICATION powersync ADD TABLE univ_re_commission_rules;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- univ_re_commission_details
    BEGIN
        ALTER TABLE IF EXISTS univ_re_commission_details ADD COLUMN IF NOT EXISTS company_id UUID;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE IF EXISTS univ_re_commission_details ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Enable ALL for users based on company_id" ON univ_re_commission_details;
        CREATE POLICY "Enable ALL for users based on company_id" ON univ_re_commission_details 
        AS PERMISSIVE FOR ALL 
        TO public 
        USING (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text)) 
        WITH CHECK (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text));
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Allow full access for service role" ON univ_re_commission_details;
        CREATE POLICY "Allow full access for service role" ON univ_re_commission_details 
        AS PERMISSIVE FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER PUBLICATION powersync ADD TABLE univ_re_commission_details;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- univ_re_contractors
    BEGIN
        ALTER TABLE IF EXISTS univ_re_contractors ADD COLUMN IF NOT EXISTS company_id UUID;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE IF EXISTS univ_re_contractors ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Enable ALL for users based on company_id" ON univ_re_contractors;
        CREATE POLICY "Enable ALL for users based on company_id" ON univ_re_contractors 
        AS PERMISSIVE FOR ALL 
        TO public 
        USING (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text)) 
        WITH CHECK (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text));
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Allow full access for service role" ON univ_re_contractors;
        CREATE POLICY "Allow full access for service role" ON univ_re_contractors 
        AS PERMISSIVE FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER PUBLICATION powersync ADD TABLE univ_re_contractors;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- univ_re_contractor_reviews
    BEGIN
        ALTER TABLE IF EXISTS univ_re_contractor_reviews ADD COLUMN IF NOT EXISTS company_id UUID;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE IF EXISTS univ_re_contractor_reviews ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Enable ALL for users based on company_id" ON univ_re_contractor_reviews;
        CREATE POLICY "Enable ALL for users based on company_id" ON univ_re_contractor_reviews 
        AS PERMISSIVE FOR ALL 
        TO public 
        USING (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text)) 
        WITH CHECK (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text));
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Allow full access for service role" ON univ_re_contractor_reviews;
        CREATE POLICY "Allow full access for service role" ON univ_re_contractor_reviews 
        AS PERMISSIVE FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER PUBLICATION powersync ADD TABLE univ_re_contractor_reviews;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- univ_re_lease_renewals
    BEGIN
        ALTER TABLE IF EXISTS univ_re_lease_renewals ADD COLUMN IF NOT EXISTS company_id UUID;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE IF EXISTS univ_re_lease_renewals ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Enable ALL for users based on company_id" ON univ_re_lease_renewals;
        CREATE POLICY "Enable ALL for users based on company_id" ON univ_re_lease_renewals 
        AS PERMISSIVE FOR ALL 
        TO public 
        USING (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text)) 
        WITH CHECK (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text));
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Allow full access for service role" ON univ_re_lease_renewals;
        CREATE POLICY "Allow full access for service role" ON univ_re_lease_renewals 
        AS PERMISSIVE FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER PUBLICATION powersync ADD TABLE univ_re_lease_renewals;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- univ_re_rent_payment_schedules
    BEGIN
        ALTER TABLE IF EXISTS univ_re_rent_payment_schedules ADD COLUMN IF NOT EXISTS company_id UUID;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE IF EXISTS univ_re_rent_payment_schedules ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Enable ALL for users based on company_id" ON univ_re_rent_payment_schedules;
        CREATE POLICY "Enable ALL for users based on company_id" ON univ_re_rent_payment_schedules 
        AS PERMISSIVE FOR ALL 
        TO public 
        USING (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text)) 
        WITH CHECK (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text));
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Allow full access for service role" ON univ_re_rent_payment_schedules;
        CREATE POLICY "Allow full access for service role" ON univ_re_rent_payment_schedules 
        AS PERMISSIVE FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER PUBLICATION powersync ADD TABLE univ_re_rent_payment_schedules;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- univ_re_rent_payment_history
    BEGIN
        ALTER TABLE IF EXISTS univ_re_rent_payment_history ADD COLUMN IF NOT EXISTS company_id UUID;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE IF EXISTS univ_re_rent_payment_history ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Enable ALL for users based on company_id" ON univ_re_rent_payment_history;
        CREATE POLICY "Enable ALL for users based on company_id" ON univ_re_rent_payment_history 
        AS PERMISSIVE FOR ALL 
        TO public 
        USING (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text)) 
        WITH CHECK (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text));
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Allow full access for service role" ON univ_re_rent_payment_history;
        CREATE POLICY "Allow full access for service role" ON univ_re_rent_payment_history 
        AS PERMISSIVE FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER PUBLICATION powersync ADD TABLE univ_re_rent_payment_history;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- univ_re_market_data
    BEGIN
        ALTER TABLE IF EXISTS univ_re_market_data ADD COLUMN IF NOT EXISTS company_id UUID;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE IF EXISTS univ_re_market_data ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Enable ALL for users based on company_id" ON univ_re_market_data;
        CREATE POLICY "Enable ALL for users based on company_id" ON univ_re_market_data 
        AS PERMISSIVE FOR ALL 
        TO public 
        USING (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text)) 
        WITH CHECK (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text));
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Allow full access for service role" ON univ_re_market_data;
        CREATE POLICY "Allow full access for service role" ON univ_re_market_data 
        AS PERMISSIVE FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER PUBLICATION powersync ADD TABLE univ_re_market_data;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- univ_re_comparable_properties
    BEGIN
        ALTER TABLE IF EXISTS univ_re_comparable_properties ADD COLUMN IF NOT EXISTS company_id UUID;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE IF EXISTS univ_re_comparable_properties ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Enable ALL for users based on company_id" ON univ_re_comparable_properties;
        CREATE POLICY "Enable ALL for users based on company_id" ON univ_re_comparable_properties 
        AS PERMISSIVE FOR ALL 
        TO public 
        USING (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text)) 
        WITH CHECK (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text));
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Allow full access for service role" ON univ_re_comparable_properties;
        CREATE POLICY "Allow full access for service role" ON univ_re_comparable_properties 
        AS PERMISSIVE FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER PUBLICATION powersync ADD TABLE univ_re_comparable_properties;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- univ_re_agent_metrics
    BEGIN
        ALTER TABLE IF EXISTS univ_re_agent_metrics ADD COLUMN IF NOT EXISTS company_id UUID;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE IF EXISTS univ_re_agent_metrics ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Enable ALL for users based on company_id" ON univ_re_agent_metrics;
        CREATE POLICY "Enable ALL for users based on company_id" ON univ_re_agent_metrics 
        AS PERMISSIVE FOR ALL 
        TO public 
        USING (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text)) 
        WITH CHECK (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text));
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Allow full access for service role" ON univ_re_agent_metrics;
        CREATE POLICY "Allow full access for service role" ON univ_re_agent_metrics 
        AS PERMISSIVE FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER PUBLICATION powersync ADD TABLE univ_re_agent_metrics;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- univ_re_client_scoring
    BEGIN
        ALTER TABLE IF EXISTS univ_re_client_scoring ADD COLUMN IF NOT EXISTS company_id UUID;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE IF EXISTS univ_re_client_scoring ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Enable ALL for users based on company_id" ON univ_re_client_scoring;
        CREATE POLICY "Enable ALL for users based on company_id" ON univ_re_client_scoring 
        AS PERMISSIVE FOR ALL 
        TO public 
        USING (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text)) 
        WITH CHECK (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text));
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Allow full access for service role" ON univ_re_client_scoring;
        CREATE POLICY "Allow full access for service role" ON univ_re_client_scoring 
        AS PERMISSIVE FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER PUBLICATION powersync ADD TABLE univ_re_client_scoring;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- univ_re_agent_recommendations
    BEGIN
        ALTER TABLE IF EXISTS univ_re_agent_recommendations ADD COLUMN IF NOT EXISTS company_id UUID;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE IF EXISTS univ_re_agent_recommendations ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Enable ALL for users based on company_id" ON univ_re_agent_recommendations;
        CREATE POLICY "Enable ALL for users based on company_id" ON univ_re_agent_recommendations 
        AS PERMISSIVE FOR ALL 
        TO public 
        USING (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text)) 
        WITH CHECK (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text));
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Allow full access for service role" ON univ_re_agent_recommendations;
        CREATE POLICY "Allow full access for service role" ON univ_re_agent_recommendations 
        AS PERMISSIVE FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER PUBLICATION powersync ADD TABLE univ_re_agent_recommendations;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- univ_re_audit_log
    BEGIN
        ALTER TABLE IF EXISTS univ_re_audit_log ADD COLUMN IF NOT EXISTS company_id UUID;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE IF EXISTS univ_re_audit_log ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Enable ALL for users based on company_id" ON univ_re_audit_log;
        CREATE POLICY "Enable ALL for users based on company_id" ON univ_re_audit_log 
        AS PERMISSIVE FOR ALL 
        TO public 
        USING (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text)) 
        WITH CHECK (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text));
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Allow full access for service role" ON univ_re_audit_log;
        CREATE POLICY "Allow full access for service role" ON univ_re_audit_log 
        AS PERMISSIVE FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER PUBLICATION powersync ADD TABLE univ_re_audit_log;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- univ_re_team_members
    BEGIN
        ALTER TABLE IF EXISTS univ_re_team_members ADD COLUMN IF NOT EXISTS company_id UUID;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE IF EXISTS univ_re_team_members ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Enable ALL for users based on company_id" ON univ_re_team_members;
        CREATE POLICY "Enable ALL for users based on company_id" ON univ_re_team_members 
        AS PERMISSIVE FOR ALL 
        TO public 
        USING (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text)) 
        WITH CHECK (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text));
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Allow full access for service role" ON univ_re_team_members;
        CREATE POLICY "Allow full access for service role" ON univ_re_team_members 
        AS PERMISSIVE FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER PUBLICATION powersync ADD TABLE univ_re_team_members;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- univ_re_mls_listings
    BEGIN
        ALTER TABLE IF EXISTS univ_re_mls_listings ADD COLUMN IF NOT EXISTS company_id UUID;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE IF EXISTS univ_re_mls_listings ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Enable ALL for users based on company_id" ON univ_re_mls_listings;
        CREATE POLICY "Enable ALL for users based on company_id" ON univ_re_mls_listings 
        AS PERMISSIVE FOR ALL 
        TO public 
        USING (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text)) 
        WITH CHECK (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text));
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Allow full access for service role" ON univ_re_mls_listings;
        CREATE POLICY "Allow full access for service role" ON univ_re_mls_listings 
        AS PERMISSIVE FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER PUBLICATION powersync ADD TABLE univ_re_mls_listings;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- univ_re_comparable_analysis
    BEGIN
        ALTER TABLE IF EXISTS univ_re_comparable_analysis ADD COLUMN IF NOT EXISTS company_id UUID;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE IF EXISTS univ_re_comparable_analysis ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Enable ALL for users based on company_id" ON univ_re_comparable_analysis;
        CREATE POLICY "Enable ALL for users based on company_id" ON univ_re_comparable_analysis 
        AS PERMISSIVE FOR ALL 
        TO public 
        USING (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text)) 
        WITH CHECK (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text));
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Allow full access for service role" ON univ_re_comparable_analysis;
        CREATE POLICY "Allow full access for service role" ON univ_re_comparable_analysis 
        AS PERMISSIVE FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER PUBLICATION powersync ADD TABLE univ_re_comparable_analysis;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- univ_re_market_trends
    BEGIN
        ALTER TABLE IF EXISTS univ_re_market_trends ADD COLUMN IF NOT EXISTS company_id UUID;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE IF EXISTS univ_re_market_trends ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Enable ALL for users based on company_id" ON univ_re_market_trends;
        CREATE POLICY "Enable ALL for users based on company_id" ON univ_re_market_trends 
        AS PERMISSIVE FOR ALL 
        TO public 
        USING (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text)) 
        WITH CHECK (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text));
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Allow full access for service role" ON univ_re_market_trends;
        CREATE POLICY "Allow full access for service role" ON univ_re_market_trends 
        AS PERMISSIVE FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER PUBLICATION powersync ADD TABLE univ_re_market_trends;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- univ_re_leads
    BEGIN
        ALTER TABLE IF EXISTS univ_re_leads ADD COLUMN IF NOT EXISTS company_id UUID;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE IF EXISTS univ_re_leads ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Enable ALL for users based on company_id" ON univ_re_leads;
        CREATE POLICY "Enable ALL for users based on company_id" ON univ_re_leads 
        AS PERMISSIVE FOR ALL 
        TO public 
        USING (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text)) 
        WITH CHECK (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text));
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Allow full access for service role" ON univ_re_leads;
        CREATE POLICY "Allow full access for service role" ON univ_re_leads 
        AS PERMISSIVE FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER PUBLICATION powersync ADD TABLE univ_re_leads;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- univ_re_lead_activities
    BEGIN
        ALTER TABLE IF EXISTS univ_re_lead_activities ADD COLUMN IF NOT EXISTS company_id UUID;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE IF EXISTS univ_re_lead_activities ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Enable ALL for users based on company_id" ON univ_re_lead_activities;
        CREATE POLICY "Enable ALL for users based on company_id" ON univ_re_lead_activities 
        AS PERMISSIVE FOR ALL 
        TO public 
        USING (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text)) 
        WITH CHECK (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text));
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Allow full access for service role" ON univ_re_lead_activities;
        CREATE POLICY "Allow full access for service role" ON univ_re_lead_activities 
        AS PERMISSIVE FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER PUBLICATION powersync ADD TABLE univ_re_lead_activities;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- univ_re_agentic_conversations
    BEGIN
        ALTER TABLE IF EXISTS univ_re_agentic_conversations ADD COLUMN IF NOT EXISTS company_id UUID;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE IF EXISTS univ_re_agentic_conversations ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Enable ALL for users based on company_id" ON univ_re_agentic_conversations;
        CREATE POLICY "Enable ALL for users based on company_id" ON univ_re_agentic_conversations 
        AS PERMISSIVE FOR ALL 
        TO public 
        USING (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text)) 
        WITH CHECK (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text));
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Allow full access for service role" ON univ_re_agentic_conversations;
        CREATE POLICY "Allow full access for service role" ON univ_re_agentic_conversations 
        AS PERMISSIVE FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER PUBLICATION powersync ADD TABLE univ_re_agentic_conversations;
    EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
