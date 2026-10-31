-- SLATE V2: Phase 8 Industry Extension Framework
-- Migration: 20261031150000_slate_v2_phase8_industry_extensions.sql
-- Description: Creates industry extensions registry, tenant industry installations, 
--              industry lifecycle history, matter-level legal privacy, and clinical confidentiality controls.

-- 1. Industry Extensions Catalog (Platform level verified industry packs)
CREATE TABLE IF NOT EXISTS industry_extensions (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    version VARCHAR(32) DEFAULT '2.0.0',
    icon VARCHAR(64) DEFAULT 'Boxes',
    required_capabilities JSONB DEFAULT '["core_foundation"]'::jsonb,
    optional_capabilities JSONB DEFAULT '[]'::jsonb,
    manifest JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE industry_extensions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'industry_extensions' AND policyname = 'industry_extensions_read'
    ) THEN
        CREATE POLICY industry_extensions_read ON industry_extensions
            FOR SELECT TO authenticated USING (true);
    END IF;
END $$;

-- 2. Company Industry Installations (Tenant industry pack activations & lifecycle)
CREATE TABLE IF NOT EXISTS company_industry_installations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    industry_id VARCHAR(64) NOT NULL REFERENCES industry_extensions(id) ON DELETE CASCADE,
    status VARCHAR(32) DEFAULT 'installed' CHECK (status IN ('installed', 'configured', 'active', 'suspended', 'uninstalled')),
    config JSONB DEFAULT '{}'::jsonb,
    installed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    installed_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, industry_id)
);

CREATE INDEX IF NOT EXISTS idx_company_industry_lookup ON company_industry_installations(company_id, industry_id, status);
ALTER TABLE company_industry_installations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'company_industry_installations' AND policyname = 'company_industry_tenant_isolation'
    ) THEN
        CREATE POLICY company_industry_tenant_isolation ON company_industry_installations
            FOR ALL TO authenticated
            USING (
                company_id IN (
                    SELECT company_id::uuid FROM profiles WHERE id = auth.uid()
                ) OR EXISTS (
                    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
                )
            );
    END IF;
END $$;

-- 3. Matter Access Grants (Record-level legal confidentiality protection)
CREATE TABLE IF NOT EXISTS legal_matter_access_grants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    matter_id UUID NOT NULL, -- references cases/matters
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    access_level VARCHAR(32) DEFAULT 'viewer' CHECK (access_level IN ('viewer', 'contributor', 'lead_counsel')),
    granted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, matter_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_matter_access_lookup ON legal_matter_access_grants(company_id, matter_id, user_id);
ALTER TABLE legal_matter_access_grants ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'legal_matter_access_grants' AND policyname = 'matter_access_tenant_isolation'
    ) THEN
        CREATE POLICY matter_access_tenant_isolation ON legal_matter_access_grants
            FOR ALL TO authenticated
            USING (
                company_id IN (
                    SELECT company_id::uuid FROM profiles WHERE id = auth.uid()
                ) OR EXISTS (
                    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
                )
            );
    END IF;
END $$;

-- 4. Clinical Confidentiality Logs (Healthcare patient access auditing)
CREATE TABLE IF NOT EXISTS clinical_access_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL,
    actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    access_action VARCHAR(64) NOT NULL, -- 'view_encounter', 'update_prescription', 'export_records'
    reason TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinical_audit_lookup ON clinical_access_audit_logs(company_id, patient_id, created_at DESC);
ALTER TABLE clinical_access_audit_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'clinical_access_audit_logs' AND policyname = 'clinical_audit_tenant_isolation'
    ) THEN
        CREATE POLICY clinical_audit_tenant_isolation ON clinical_access_audit_logs
            FOR ALL TO authenticated
            USING (
                company_id IN (
                    SELECT company_id::uuid FROM profiles WHERE id = auth.uid()
                ) OR EXISTS (
                    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
                )
            );
    END IF;
END $$;

-- Seed Priority Industry Extension Packs
INSERT INTO industry_extensions (id, name, description, version, icon, required_capabilities, optional_capabilities, manifest)
VALUES
    (
        'legal_practice',
        'Legal Practice Management',
        'Matter lifecycle, proceedings, hearing schedules, retainer trust accounts, and confidential conflict checks.',
        '2.0.0',
        'Scale',
        '["core_foundation", "documents"]'::jsonb,
        '["finance", "crm"]'::jsonb,
        '{
            "entities": ["matters", "hearings", "retainers", "conflict_checks"],
            "terminology": {"account": "Client", "deal": "Matter", "task": "Legal Deliverable"},
            "default_workflows": ["hearing_reminder", "matter_intake"]
        }'::jsonb
    ),
    (
        'real_estate',
        'Real Estate & Properties',
        'Properties, units, tenancy leases, rent schedules, maintenance orders, inspections, and trust accounting.',
        '2.0.0',
        'Building2',
        '["core_foundation", "documents"]'::jsonb,
        '["finance", "crm"]'::jsonb,
        '{
            "entities": ["properties", "leases", "rent_payments", "maintenance_tickets"],
            "terminology": {"account": "Tenant / Landlord", "deal": "Lease Agreement"},
            "default_workflows": ["lease_expiry_reminder", "overdue_rent_escalation"]
        }'::jsonb
    ),
    (
        'healthcare',
        'Healthcare Operations',
        'Patient registration, clinical encounters, appointment scheduling, referrals, and administrative billing.',
        '2.0.0',
        'HeartPulse',
        '["core_foundation"]'::jsonb,
        '["finance", "documents"]'::jsonb,
        '{
            "entities": ["patients", "appointments", "encounters", "prescriptions"],
            "terminology": {"account": "Patient", "deal": "Episode of Care"},
            "default_workflows": ["appointment_reminder", "prescription_refill_request"]
        }'::jsonb
    ),
    (
        'education',
        'Academic & Student Management',
        'Student records, enrollments, courses, terms, class timetables, attendance tracking, and tuition billing.',
        '2.0.0',
        'GraduationCap',
        '["core_foundation"]'::jsonb,
        '["finance", "documents"]'::jsonb,
        '{
            "entities": ["students", "courses", "enrollments", "attendance_records"],
            "terminology": {"account": "Student / Guardian", "deal": "Course Enrollment"},
            "default_workflows": ["attendance_alert", "tuition_fee_reminder"]
        }'::jsonb
    ),
    (
        'logistics',
        'Logistics & Fleet Operations',
        'Fleet vehicles, drivers, shipments, dispatch orders, warehouse storage, route tracking, and proof of delivery.',
        '2.0.0',
        'Truck',
        '["core_foundation"]'::jsonb,
        '["finance", "projects"]'::jsonb,
        '{
            "entities": ["vehicles", "drivers", "shipments", "proof_of_deliveries"],
            "terminology": {"account": "Shipper / Consignee", "deal": "Freight Order"},
            "default_workflows": ["dispatch_notification", "delivery_exception_escalation"]
        }'::jsonb
    )
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    version = EXCLUDED.version,
    manifest = EXCLUDED.manifest;
