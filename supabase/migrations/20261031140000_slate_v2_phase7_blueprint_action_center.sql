-- SLATE V2: Phase 7 Business Blueprint & Unified Action Center
-- Migration: 20261031140000_slate_v2_phase7_blueprint_action_center.sql
-- Description: Creates business blueprints, capability provisioning logs, approval policies,
--              unified action items, and action decisions with multi-tenant RLS.

-- 1. Business Blueprints Table (Interpreted organizational profile, structure, recommended capabilities & policies)
CREATE TABLE IF NOT EXISTS business_blueprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    business_name VARCHAR(256) NOT NULL,
    industry_category VARCHAR(64) NOT NULL,
    business_model VARCHAR(64) DEFAULT 'b2b',
    profile_summary TEXT,
    structure_data JSONB DEFAULT '{}'::jsonb, -- departments, teams, employee count, roles
    operational_requirements JSONB DEFAULT '{}'::jsonb,
    recommended_capabilities JSONB DEFAULT '[]'::jsonb, -- array of capability_ids with AI reasoning
    approval_requirements JSONB DEFAULT '[]'::jsonb, -- thresholds and approval policies recommended
    default_workflows JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(32) DEFAULT 'draft' CHECK (status IN ('draft', 'reviewing', 'approved', 'provisioned', 'archived')),
    version INT DEFAULT 1,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_blueprints_tenant ON business_blueprints(company_id, status);
ALTER TABLE business_blueprints ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'business_blueprints' AND policyname = 'business_blueprints_tenant_isolation'
    ) THEN
        CREATE POLICY business_blueprints_tenant_isolation ON business_blueprints
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

-- 2. Capability Provisioning Log (Audited record of Blueprint capability activations)
CREATE TABLE IF NOT EXISTS capability_provisioning_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    blueprint_id UUID REFERENCES business_blueprints(id) ON DELETE SET NULL,
    capability_id VARCHAR(64) NOT NULL REFERENCES platform_capabilities(id) ON DELETE CASCADE,
    action VARCHAR(32) NOT NULL CHECK (action IN ('activate', 'deactivate', 'configure')),
    status VARCHAR(32) DEFAULT 'success' CHECK (status IN ('success', 'failed', 'reverted')),
    details JSONB DEFAULT '{}'::jsonb,
    provisioned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provisioning_logs_tenant ON capability_provisioning_logs(company_id, capability_id);
ALTER TABLE capability_provisioning_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'capability_provisioning_logs' AND policyname = 'capability_provisioning_logs_tenant_isolation'
    ) THEN
        CREATE POLICY capability_provisioning_logs_tenant_isolation ON capability_provisioning_logs
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

-- 3. Approval Policies Table (Configurable thresholds and multi-level approval chains)
CREATE TABLE IF NOT EXISTS approval_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    key VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    module VARCHAR(64) NOT NULL, -- 'finance', 'purchases', 'expenses', 'contracts', 'hr', 'workflow'
    threshold_amount NUMERIC(15, 2) DEFAULT 0.00,
    currency VARCHAR(16) DEFAULT 'USD',
    approval_type VARCHAR(32) DEFAULT 'single' CHECK (approval_type IN ('single', 'sequential', 'parallel', 'consensus')),
    approver_roles JSONB DEFAULT '["admin"]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, key)
);

CREATE INDEX IF NOT EXISTS idx_approval_policies_tenant ON approval_policies(company_id, module, is_active);
ALTER TABLE approval_policies ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'approval_policies' AND policyname = 'approval_policies_tenant_isolation'
    ) THEN
        CREATE POLICY approval_policies_tenant_isolation ON approval_policies
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

-- 4. Unified Action Items Table (Consolidated queue for pending decisions across all modules)
CREATE TABLE IF NOT EXISTS unified_action_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    policy_id UUID REFERENCES approval_policies(id) ON DELETE SET NULL,
    workflow_execution_id UUID REFERENCES workflow_executions(id) ON DELETE SET NULL,
    workflow_step_id VARCHAR(64),
    origin_module VARCHAR(64) NOT NULL, -- 'finance', 'contracts', 'hr', 'workflows', 'operations'
    action_type VARCHAR(64) NOT NULL, -- 'invoice_approval', 'purchase_request', 'contract_signoff', 'workflow_pause'
    title VARCHAR(256) NOT NULL,
    description TEXT,
    priority VARCHAR(16) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    amount NUMERIC(15, 2),
    currency VARCHAR(16) DEFAULT 'USD',
    requesting_party_id UUID,
    requesting_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    assigned_role VARCHAR(64),
    assigned_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status VARCHAR(32) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'info_requested', 'escalated', 'expired')),
    supporting_context JSONB DEFAULT '{}'::jsonb,
    due_date TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_action_items_tenant_status ON unified_action_items(company_id, status, priority);
CREATE INDEX IF NOT EXISTS idx_action_items_assignee ON unified_action_items(assigned_user_id, status);
CREATE INDEX IF NOT EXISTS idx_action_items_wf ON unified_action_items(workflow_execution_id);

ALTER TABLE unified_action_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'unified_action_items' AND policyname = 'unified_action_items_tenant_isolation'
    ) THEN
        CREATE POLICY unified_action_items_tenant_isolation ON unified_action_items
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

-- 5. Action Decisions & Audit History Table (Immutable log of human approvals, rejections, and notes)
CREATE TABLE IF NOT EXISTS action_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_item_id UUID NOT NULL REFERENCES unified_action_items(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    decision VARCHAR(32) NOT NULL CHECK (decision IN ('approved', 'rejected', 'info_requested', 'delegated', 'escalated')),
    reason TEXT,
    decided_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    previous_status VARCHAR(32),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_action_decisions_item ON action_decisions(action_item_id, created_at DESC);
ALTER TABLE action_decisions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'action_decisions' AND policyname = 'action_decisions_tenant_isolation'
    ) THEN
        CREATE POLICY action_decisions_tenant_isolation ON action_decisions
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
