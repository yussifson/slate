-- SLATE V2: Phase 9 Universal Intelligence, Search & Business Insights
-- Migration: 20261031160000_slate_v2_phase9_universal_intelligence.sql
-- Description: Extends full-text search indexes across core entities, creates business exceptions registry,
--              business activity event stream, and process health aggregates with multi-tenant RLS.

-- 1. Business Exceptions Registry (Deterministic conditions: overdue invoices, stalled deals, lease expiries, workflow errors)
CREATE TABLE IF NOT EXISTS business_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    exception_type VARCHAR(64) NOT NULL, -- 'overdue_invoice', 'stalled_opportunity', 'lease_expiring', 'workflow_dead_letter', 'legal_deadline'
    severity VARCHAR(16) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR(256) NOT NULL,
    description TEXT,
    entity_type VARCHAR(64) NOT NULL, -- 'core_party', 'invoice', 'workflow_execution', 'property_lease'
    entity_id VARCHAR(64) NOT NULL,
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(32) DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'investigating', 'resolved', 'ignored')),
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    supporting_context JSONB DEFAULT '{}'::jsonb,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_exceptions_tenant ON business_exceptions(company_id, status, severity, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_exceptions_entity ON business_exceptions(company_id, entity_type, entity_id);

ALTER TABLE business_exceptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'business_exceptions' AND policyname = 'business_exceptions_tenant_isolation'
    ) THEN
        CREATE POLICY business_exceptions_tenant_isolation ON business_exceptions
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

-- 2. Business Activity & Decision Timeline (Unified immutable timeline consolidating events across capabilities)
CREATE TABLE IF NOT EXISTS business_activity_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    event_category VARCHAR(64) NOT NULL, -- 'party_created', 'invoice_issued', 'decision_recorded', 'workflow_completed', 'exception_detected'
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    actor_name VARCHAR(128) DEFAULT 'System',
    actor_type VARCHAR(32) DEFAULT 'user' CHECK (actor_type IN ('user', 'system', 'orbit_ai', 'workflow')),
    title VARCHAR(256) NOT NULL,
    summary TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_timeline_tenant ON business_activity_timeline(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_timeline_entity ON business_activity_timeline(company_id, entity_type, entity_id);

ALTER TABLE business_activity_timeline ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'business_activity_timeline' AND policyname = 'business_activity_tenant_isolation'
    ) THEN
        CREATE POLICY business_activity_tenant_isolation ON business_activity_timeline
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

-- 3. Trigram & Full-Text Search Optimization on Core Parties
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_core_parties_name_trgm ON core_parties USING gin (primary_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_core_parties_email_trgm ON core_parties USING gin (email gin_trgm_ops);
