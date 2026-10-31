-- SLATE V2: Phase 1 Platform Foundation & Core Party Graph
-- Migration: 20261031120000_slate_v2_phase1_foundation.sql
-- Description: Creates Platform Capabilities, Company Capabilities, Core Party Graph, 
--              Metadata Engine, and Transactional Outbox foundation with strict RLS and tenant isolation.

-- 1. Capability Registry (Platform-level catalog)
CREATE TABLE IF NOT EXISTS platform_capabilities (
    id VARCHAR(64) PRIMARY KEY,
    category VARCHAR(16) NOT NULL CHECK (category IN ('core', 'standard', 'industry')),
    name VARCHAR(128) NOT NULL,
    description TEXT,
    icon VARCHAR(64) DEFAULT 'Boxes',
    default_enabled BOOLEAN DEFAULT false,
    dependencies JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    version VARCHAR(32) DEFAULT '2.0.0',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for platform_capabilities: Public read for authenticated users, super_admin write
ALTER TABLE platform_capabilities ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'platform_capabilities' AND policyname = 'platform_capabilities_read'
    ) THEN
        CREATE POLICY platform_capabilities_read ON platform_capabilities
            FOR SELECT TO authenticated USING (true);
    END IF;
END $$;

-- 2. Company Capabilities (Tenant activation & configuration)
CREATE TABLE IF NOT EXISTS company_capabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    capability_id VARCHAR(64) NOT NULL REFERENCES platform_capabilities(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}'::jsonb,
    activated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    enabled_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, capability_id)
);

CREATE INDEX IF NOT EXISTS idx_company_capabilities_lookup ON company_capabilities(company_id, capability_id);
ALTER TABLE company_capabilities ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'company_capabilities' AND policyname = 'company_capabilities_tenant_isolation'
    ) THEN
        CREATE POLICY company_capabilities_tenant_isolation ON company_capabilities
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

-- 3. Core Parties (Unified identity foundation)
CREATE TABLE IF NOT EXISTS core_parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    party_type VARCHAR(32) NOT NULL CHECK (party_type IN ('individual', 'organization')),
    primary_name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    tax_identifier VARCHAR(64),
    email VARCHAR(255),
    phone VARCHAR(64),
    website VARCHAR(255),
    status VARCHAR(32) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived', 'lead')),
    custom_attributes JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, id) -- Enables composite foreign key enforcement
);

CREATE INDEX IF NOT EXISTS idx_core_parties_company_id ON core_parties(company_id);
CREATE INDEX IF NOT EXISTS idx_core_parties_email ON core_parties(company_id, email);
CREATE INDEX IF NOT EXISTS idx_core_parties_name ON core_parties(company_id, primary_name);
ALTER TABLE core_parties ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'core_parties' AND policyname = 'core_parties_tenant_isolation'
    ) THEN
        CREATE POLICY core_parties_tenant_isolation ON core_parties
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

-- 4. Core Party Roles (Multiple roles per party)
CREATE TABLE IF NOT EXISTS core_party_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    party_id UUID NOT NULL,
    role_type VARCHAR(64) NOT NULL, -- e.g., 'client', 'vendor', 'contractor', 'tenant', 'patient', 'student', 'employee'
    role_status VARCHAR(32) DEFAULT 'active' CHECK (role_status IN ('active', 'suspended', 'terminated')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, party_id, role_type),
    -- Composite foreign key guarantees party_id belongs to the same company_id at database level
    CONSTRAINT fk_core_party_roles_party FOREIGN KEY (company_id, party_id)
        REFERENCES core_parties(company_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_core_party_roles_lookup ON core_party_roles(company_id, role_type);
ALTER TABLE core_party_roles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'core_party_roles' AND policyname = 'core_party_roles_tenant_isolation'
    ) THEN
        CREATE POLICY core_party_roles_tenant_isolation ON core_party_roles
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

-- 5. Core Party Relationships (Cross-party connections)
CREATE TABLE IF NOT EXISTS core_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    from_party_id UUID NOT NULL,
    to_party_id UUID NOT NULL,
    relationship_type VARCHAR(64) NOT NULL, -- 'subsidiary_of', 'employed_by', 'guarantor_of', 'represents', 'partner_of'
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Database-level check preventing a party from relating to itself
    CONSTRAINT chk_core_relationships_not_self CHECK (from_party_id <> to_party_id),
    -- Composite foreign keys guarantee BOTH from_party_id and to_party_id belong to the owning company_id
    CONSTRAINT fk_core_relationships_from_party FOREIGN KEY (company_id, from_party_id)
        REFERENCES core_parties(company_id, id) ON DELETE CASCADE,
    CONSTRAINT fk_core_relationships_to_party FOREIGN KEY (company_id, to_party_id)
        REFERENCES core_parties(company_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_core_relationships_lookup ON core_relationships(company_id, from_party_id, to_party_id);
ALTER TABLE core_relationships ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'core_relationships' AND policyname = 'core_relationships_tenant_isolation'
    ) THEN
        CREATE POLICY core_relationships_tenant_isolation ON core_relationships
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

-- 6. Meta Objects (Governed Entity Types)
CREATE TABLE IF NOT EXISTS meta_objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE, -- NULL indicates platform-level system object
    key VARCHAR(64) NOT NULL,
    display_name VARCHAR(128) NOT NULL,
    description TEXT,
    icon VARCHAR(64) DEFAULT 'FileText',
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, key)
);

ALTER TABLE meta_objects ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'meta_objects' AND policyname = 'meta_objects_tenant_isolation'
    ) THEN
        CREATE POLICY meta_objects_tenant_isolation ON meta_objects
            FOR ALL TO authenticated
            USING (
                company_id IS NULL OR
                company_id IN (
                    SELECT company_id::uuid FROM profiles WHERE id = auth.uid()
                ) OR EXISTS (
                    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
                )
            );
    END IF;
END $$;

-- 7. Meta Fields (Governed Typed Attributes)
CREATE TABLE IF NOT EXISTS meta_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    object_id UUID NOT NULL REFERENCES meta_objects(id) ON DELETE CASCADE,
    field_key VARCHAR(64) NOT NULL,
    label VARCHAR(128) NOT NULL,
    field_type VARCHAR(32) NOT NULL CHECK (field_type IN ('text', 'number', 'currency', 'date', 'boolean', 'select', 'multiselect', 'party_reference')),
    is_required BOOLEAN DEFAULT false,
    options JSONB DEFAULT '[]'::jsonb,
    validation_rules JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, object_id, field_key)
);

ALTER TABLE meta_fields ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'meta_fields' AND policyname = 'meta_fields_tenant_isolation'
    ) THEN
        CREATE POLICY meta_fields_tenant_isolation ON meta_fields
            FOR ALL TO authenticated
            USING (
                company_id IS NULL OR
                company_id IN (
                    SELECT company_id::uuid FROM profiles WHERE id = auth.uid()
                ) OR EXISTS (
                    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
                )
            );
    END IF;
END $$;

-- 8. Transactional Outbox (Foundational event registry for reliable event-driven delivery)
CREATE TABLE IF NOT EXISTS platform_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    event_type VARCHAR(128) NOT NULL,
    aggregate_type VARCHAR(64) NOT NULL,
    aggregate_id VARCHAR(64) NOT NULL,
    payload JSONB NOT NULL,
    idempotency_key VARCHAR(128) UNIQUE,
    status VARCHAR(32) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    retry_count INT DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_platform_events_dispatch ON platform_events(status, created_at);
ALTER TABLE platform_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'platform_events' AND policyname = 'platform_events_tenant_isolation'
    ) THEN
        CREATE POLICY platform_events_tenant_isolation ON platform_events
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

-- Seed Standard Platform Capabilities
INSERT INTO platform_capabilities (id, category, name, description, icon, default_enabled, version)
VALUES
    ('core_foundation', 'core', 'Core Business Foundation', 'Identity, Party Graph, and Organization Management', 'ShieldCheck', true, '2.0.0'),
    ('finance', 'standard', 'Finance & Accounting', 'General Ledger, Invoicing, Tax, and Cash Flow', 'DollarSign', true, '2.0.0'),
    ('crm', 'standard', 'Customer Relationship Management', 'Pipeline, Leads, Contact Management, and Interactions', 'Users', true, '2.0.0'),
    ('projects', 'standard', 'Projects & Operations', 'Task coordination, workload allocation, and deadlines', 'CheckSquare', true, '2.0.0'),
    ('documents', 'standard', 'Document Vault & E-Sign', 'Contracts, templates, versioning, and digital signing', 'FileText', true, '2.0.0'),
    ('legal_practice', 'industry', 'Legal Practice Management', 'Matters, court calendar, conflict checks, and billable hours', 'Scale', false, '2.0.0'),
    ('real_estate', 'industry', 'Real Estate & Properties', 'Properties, tenant leases, trust accounting, and contractors', 'Building2', false, '2.0.0'),
    ('healthcare', 'industry', 'Healthcare & Clinical Administration', 'Patient records, clinical appointments, and encounters', 'HeartPulse', false, '2.0.0'),
    ('education', 'industry', 'Academic & Student Management', 'Student records, attendance, terms, and grade reporting', 'GraduationCap', false, '2.0.0')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    version = EXCLUDED.version;
