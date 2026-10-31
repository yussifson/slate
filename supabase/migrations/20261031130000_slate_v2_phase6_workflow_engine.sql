-- SLATE V2: Phase 6 Event Infrastructure & Workflow Engine
-- Migration: 20261031130000_slate_v2_phase6_workflow_engine.sql
-- Description: Extends event processing, dead-letter outbox, durable workflow definitions,
--              workflow step executions, and audit log links with multi-tenant RLS.

-- 1. Workflow Definitions Table (Slate V2 Workflow Engine)
CREATE TABLE IF NOT EXISTS workflow_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    key VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    category VARCHAR(64) DEFAULT 'custom',
    trigger_type VARCHAR(32) NOT NULL CHECK (trigger_type IN ('event', 'schedule', 'manual', 'webhook')),
    trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT false,
    version INT DEFAULT 1,
    max_retries INT DEFAULT 3,
    timeout_seconds INT DEFAULT 300,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, key)
);

CREATE INDEX IF NOT EXISTS idx_workflow_definitions_tenant ON workflow_definitions(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_trigger ON workflow_definitions(trigger_type, is_active);

ALTER TABLE workflow_definitions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'workflow_definitions' AND policyname = 'workflow_definitions_tenant_isolation'
    ) THEN
        CREATE POLICY workflow_definitions_tenant_isolation ON workflow_definitions
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

-- 2. Workflow Executions Table (Durable Workflow Instance Records)
CREATE TABLE IF NOT EXISTS workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    trigger_event_id UUID REFERENCES platform_events(id) ON DELETE SET NULL,
    trigger_type VARCHAR(32) NOT NULL,
    idempotency_key VARCHAR(128) UNIQUE,
    status VARCHAR(32) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled', 'dead_letter')),
    input_payload JSONB DEFAULT '{}'::jsonb,
    output_payload JSONB DEFAULT '{}'::jsonb,
    current_step_index INT DEFAULT 0,
    steps_total INT DEFAULT 0,
    steps_completed INT DEFAULT 0,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    inngest_run_id VARCHAR(128),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_company ON workflow_executions(company_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_wf ON workflow_executions(workflow_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_idempotency ON workflow_executions(idempotency_key);

ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'workflow_executions' AND policyname = 'workflow_executions_tenant_isolation'
    ) THEN
        CREATE POLICY workflow_executions_tenant_isolation ON workflow_executions
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

-- 3. Workflow Step Logs / Executions Table (Fine-grained per-step tracing & branching history)
CREATE TABLE IF NOT EXISTS workflow_step_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    step_index INT NOT NULL,
    step_id VARCHAR(64) NOT NULL,
    step_name VARCHAR(128) NOT NULL,
    step_type VARCHAR(32) NOT NULL CHECK (step_type IN ('action', 'condition', 'branch', 'parallel', 'delay', 'webhook')),
    status VARCHAR(32) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped')),
    input_data JSONB DEFAULT '{}'::jsonb,
    output_data JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_step_exec ON workflow_step_executions(execution_id, step_index);
ALTER TABLE workflow_step_executions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'workflow_step_executions' AND policyname = 'workflow_step_executions_tenant_isolation'
    ) THEN
        CREATE POLICY workflow_step_executions_tenant_isolation ON workflow_step_executions
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

-- 4. Dead-Letter Queue (DLQ) Table for persistent failure quarantine & manual/automated replay
CREATE TABLE IF NOT EXISTS workflow_dead_letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    source_type VARCHAR(32) NOT NULL CHECK (source_type IN ('platform_event', 'workflow_execution')),
    source_id UUID NOT NULL,
    error_message TEXT NOT NULL,
    payload JSONB NOT NULL,
    retry_count INT DEFAULT 0,
    resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dead_letters_unresolved ON workflow_dead_letters(company_id, resolved, created_at DESC);
ALTER TABLE workflow_dead_letters ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'workflow_dead_letters' AND policyname = 'workflow_dead_letters_tenant_isolation'
    ) THEN
        CREATE POLICY workflow_dead_letters_tenant_isolation ON workflow_dead_letters
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
