-- SLATE V2: Phase 2 Business Data Integration & Legacy Entity Mapping
-- Migration: 20261031123000_slate_v2_phase2_entity_integration.sql
-- Description: Adds core_party_id foreign key links, identity mapping tables,
--              concurrency-safe resolution RPC, and append-only activity immutability triggers.

-- 1. Identity Resolution Mappings Table
CREATE TABLE IF NOT EXISTS core_party_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    party_id UUID NOT NULL,
    source_table VARCHAR(64) NOT NULL, -- e.g. 'clients', 'staff_records', 'leads', 'univ_re_clients'
    source_record_id VARCHAR(128) NOT NULL,
    confidence_score NUMERIC(3, 2) DEFAULT 1.00, -- 1.00 = exact match / linked
    match_strategy VARCHAR(64) DEFAULT 'direct_link', -- 'direct_link', 'email_match', 'manual_link'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, source_table, source_record_id),
    CONSTRAINT fk_core_party_mappings_party FOREIGN KEY (company_id, party_id)
        REFERENCES core_parties(company_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_core_party_mappings_lookup 
    ON core_party_mappings(company_id, source_table, source_record_id);
CREATE INDEX IF NOT EXISTS idx_core_party_mappings_party 
    ON core_party_mappings(company_id, party_id);

ALTER TABLE core_party_mappings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'core_party_mappings' AND policyname = 'core_party_mappings_tenant_isolation'
    ) THEN
        CREATE POLICY core_party_mappings_tenant_isolation ON core_party_mappings
            FOR ALL TO authenticated
            USING (
                company_id IN (
                    SELECT company_id FROM profiles WHERE id = auth.uid()
                ) OR EXISTS (
                    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
                )
            );
    END IF;
END $$;

-- 2. Party Activity Log (Unified audit & record history with database-level immutability)
CREATE TABLE IF NOT EXISTS core_party_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    party_id UUID NOT NULL,
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    actor_name VARCHAR(255),
    activity_type VARCHAR(64) NOT NULL, -- 'created', 'updated', 'role_added', 'relationship_linked', 'domain_action'
    summary TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_core_party_activities_party FOREIGN KEY (company_id, party_id)
        REFERENCES core_parties(company_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_core_party_activities_timeline 
    ON core_party_activities(company_id, party_id, created_at DESC);

ALTER TABLE core_party_activities ENABLE ROW LEVEL SECURITY;

-- Append-only RLS: SELECT and INSERT permitted, UPDATE and DELETE strictly blocked
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'core_party_activities' AND policyname = 'core_party_activities_select'
    ) THEN
        CREATE POLICY core_party_activities_select ON core_party_activities
            FOR SELECT TO authenticated
            USING (
                company_id IN (
                    SELECT company_id FROM profiles WHERE id = auth.uid()
                ) OR EXISTS (
                    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'core_party_activities' AND policyname = 'core_party_activities_insert'
    ) THEN
        CREATE POLICY core_party_activities_insert ON core_party_activities
            FOR INSERT TO authenticated
            WITH CHECK (
                company_id IN (
                    SELECT company_id FROM profiles WHERE id = auth.uid()
                ) OR EXISTS (
                    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
                )
            );
    END IF;
END $$;

-- Database-level immutability trigger preventing UPDATE or DELETE on activities
CREATE OR REPLACE FUNCTION trg_core_party_activities_immutable()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit Integrity Violation: core_party_activities records are immutable and cannot be updated or deleted.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_activity_mutation ON core_party_activities;
CREATE TRIGGER trg_prevent_activity_mutation
    BEFORE UPDATE OR DELETE ON core_party_activities
    FOR EACH ROW EXECUTE FUNCTION trg_core_party_activities_immutable();

-- 3. Additive core_party_id links on existing domain tables (Non-destructive)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'core_party_id') THEN
            ALTER TABLE clients ADD COLUMN core_party_id UUID REFERENCES core_parties(id) ON DELETE SET NULL;
            CREATE INDEX IF NOT EXISTS idx_clients_core_party_id ON clients(core_party_id);
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'core_party_id') THEN
            ALTER TABLE leads ADD COLUMN core_party_id UUID REFERENCES core_parties(id) ON DELETE SET NULL;
            CREATE INDEX IF NOT EXISTS idx_leads_core_party_id ON leads(core_party_id);
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff_records') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_records' AND column_name = 'core_party_id') THEN
            ALTER TABLE staff_records ADD COLUMN core_party_id UUID REFERENCES core_parties(id) ON DELETE SET NULL;
            CREATE INDEX IF NOT EXISTS idx_staff_records_core_party_id ON staff_records(core_party_id);
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'univ_re_clients') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'univ_re_clients' AND column_name = 'core_party_id') THEN
            ALTER TABLE univ_re_clients ADD COLUMN core_party_id UUID REFERENCES core_parties(id) ON DELETE SET NULL;
            CREATE INDEX IF NOT EXISTS idx_univ_re_clients_core_party_id ON univ_re_clients(core_party_id);
        END IF;
    END IF;
END $$;
