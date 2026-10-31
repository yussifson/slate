-- ============================================================================
-- SLATE V2: PHASE 4 — CRM, SALES & COMMERCIAL PIPELINE
-- Migration: 20261031125000_slate_v2_phase4_crm_sales.sql
-- Timestamp: 2026-10-31 12:50:00 (Sequenced after Phase 3 12:45:00 and before Phase 6 13:00:00)
-- Description:
--   Establishes tenant-isolated CRM and Commercial capability:
--   - crm_pipelines & crm_pipeline_stages: Configurable sales pipelines
--   - crm_opportunities: Deals, expected revenue, stage tracking, win/loss reasons
--   - crm_activities: Calls, meetings, notes, tasks with timeline aggregation
--   - crm_quotations & crm_quotation_lines: Quotes with discounts, taxes, and validity
--   - crm_proposals: Commercial proposals, customer association, scope, revisions
--   - crm_sales_orders & crm_sales_order_lines: Commercial orders linked to quotes and Finance A/R
-- ============================================================================

-- 1. CRM PIPELINES
CREATE TABLE IF NOT EXISTS public.crm_pipelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. CRM PIPELINE STAGES
CREATE TABLE IF NOT EXISTS public.crm_pipeline_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    pipeline_id UUID NOT NULL REFERENCES public.crm_pipelines(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    stage_order INTEGER NOT NULL DEFAULT 0,
    probability_percentage NUMERIC(5,2) NOT NULL DEFAULT 10.00 CHECK (probability_percentage >= 0 AND probability_percentage <= 100),
    is_won BOOLEAN NOT NULL DEFAULT false,
    is_lost BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_pipeline_stage_order UNIQUE(company_id, pipeline_id, stage_order)
);

-- 3. CRM OPPORTUNITIES (DEALS)
CREATE TABLE IF NOT EXISTS public.crm_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    party_id UUID REFERENCES public.core_parties(id) ON DELETE SET NULL,
    pipeline_id UUID NOT NULL REFERENCES public.crm_pipelines(id) ON DELETE RESTRICT,
    stage_id UUID NOT NULL REFERENCES public.crm_pipeline_stages(id) ON DELETE RESTRICT,
    expected_revenue NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (expected_revenue >= 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    probability_override NUMERIC(5,2) CHECK (probability_override >= 0 AND probability_override <= 100),
    expected_close_date DATE,
    actual_close_date DATE,
    assigned_to UUID,
    source TEXT,
    competitors TEXT,
    loss_reason TEXT,
    win_reason TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost', 'abandoned')),
    custom_attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. CRM ACTIVITIES & INTERACTIONS
CREATE TABLE IF NOT EXISTS public.crm_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    party_id UUID REFERENCES public.core_parties(id) ON DELETE CASCADE,
    opportunity_id UUID REFERENCES public.crm_opportunities(id) ON DELETE SET NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('call', 'meeting', 'task', 'note', 'email', 'follow_up')),
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    assigned_to UUID,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. CRM QUOTATIONS
CREATE TABLE IF NOT EXISTS public.crm_quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    quote_number TEXT NOT NULL,
    title TEXT NOT NULL,
    party_id UUID NOT NULL REFERENCES public.core_parties(id) ON DELETE RESTRICT,
    opportunity_id UUID REFERENCES public.crm_opportunities(id) ON DELETE SET NULL,
    version INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'sent', 'accepted', 'rejected', 'expired')),
    currency TEXT NOT NULL DEFAULT 'USD',
    subtotal_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (subtotal_amount >= 0),
    discount_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    total_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE,
    terms_conditions TEXT,
    notes TEXT,
    created_by UUID,
    approved_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_quotation_number UNIQUE (company_id, quote_number, version)
);

-- 6. CRM QUOTATION LINES
CREATE TABLE IF NOT EXISTS public.crm_quotation_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    quotation_id UUID NOT NULL REFERENCES public.crm_quotations(id) ON DELETE CASCADE,
    item_description TEXT NOT NULL,
    quantity NUMERIC(12,4) NOT NULL DEFAULT 1.0000 CHECK (quantity > 0),
    unit_price NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (unit_price >= 0),
    discount_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (tax_rate >= 0),
    line_total NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (line_total >= 0),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. CRM PROPOSALS
CREATE TABLE IF NOT EXISTS public.crm_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    proposal_number TEXT NOT NULL,
    title TEXT NOT NULL,
    party_id UUID NOT NULL REFERENCES public.core_parties(id) ON DELETE RESTRICT,
    opportunity_id UUID REFERENCES public.crm_opportunities(id) ON DELETE SET NULL,
    quotation_id UUID REFERENCES public.crm_quotations(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'sent', 'accepted', 'declined')),
    scope_of_work TEXT,
    commercial_terms TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_proposal_number UNIQUE (company_id, proposal_number, version)
);

-- 8. CRM SALES ORDERS
CREATE TABLE IF NOT EXISTS public.crm_sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL,
    party_id UUID NOT NULL REFERENCES public.core_parties(id) ON DELETE RESTRICT,
    quotation_id UUID REFERENCES public.crm_quotations(id) ON DELETE SET NULL,
    opportunity_id UUID REFERENCES public.crm_opportunities(id) ON DELETE SET NULL,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    currency TEXT NOT NULL DEFAULT 'USD',
    subtotal_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (subtotal_amount >= 0),
    discount_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    total_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'processing', 'fulfilled', 'invoiced', 'cancelled')),
    shipping_address TEXT,
    billing_address TEXT,
    invoice_id UUID,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_sales_order_number UNIQUE (company_id, order_number)
);

-- 9. CRM SALES ORDER LINES
CREATE TABLE IF NOT EXISTS public.crm_sales_order_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    sales_order_id UUID NOT NULL REFERENCES public.crm_sales_orders(id) ON DELETE CASCADE,
    item_description TEXT NOT NULL,
    quantity NUMERIC(12,4) NOT NULL DEFAULT 1.0000 CHECK (quantity > 0),
    unit_price NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (unit_price >= 0),
    discount_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (tax_rate >= 0),
    line_total NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (line_total >= 0),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INDEXES FOR PERFORMANCE & REPORTING
CREATE INDEX IF NOT EXISTS idx_crm_pipelines_company ON public.crm_pipelines(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_stages_pipeline ON public.crm_pipeline_stages(pipeline_id, stage_order);
CREATE INDEX IF NOT EXISTS idx_crm_opps_party ON public.crm_opportunities(company_id, party_id);
CREATE INDEX IF NOT EXISTS idx_crm_opps_stage ON public.crm_opportunities(pipeline_id, stage_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_party ON public.crm_activities(company_id, party_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_opp ON public.crm_activities(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_crm_quotes_party ON public.crm_quotations(company_id, party_id);
CREATE INDEX IF NOT EXISTS idx_crm_orders_party ON public.crm_sales_orders(company_id, party_id);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.crm_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_quotation_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_sales_order_lines ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS crm_pipelines_tenant_isolation ON public.crm_pipelines;
    DROP POLICY IF EXISTS crm_stages_tenant_isolation ON public.crm_pipeline_stages;
    DROP POLICY IF EXISTS crm_opportunities_tenant_isolation ON public.crm_opportunities;
    DROP POLICY IF EXISTS crm_activities_tenant_isolation ON public.crm_activities;
    DROP POLICY IF EXISTS crm_quotations_tenant_isolation ON public.crm_quotations;
    DROP POLICY IF EXISTS crm_quotation_lines_tenant_isolation ON public.crm_quotation_lines;
    DROP POLICY IF EXISTS crm_proposals_tenant_isolation ON public.crm_proposals;
    DROP POLICY IF EXISTS crm_sales_orders_tenant_isolation ON public.crm_sales_orders;
    DROP POLICY IF EXISTS crm_sales_order_lines_tenant_isolation ON public.crm_sales_order_lines;
END $$;

CREATE POLICY crm_pipelines_tenant_isolation ON public.crm_pipelines
    FOR ALL USING (company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid);

CREATE POLICY crm_stages_tenant_isolation ON public.crm_pipeline_stages
    FOR ALL USING (company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid);

CREATE POLICY crm_opportunities_tenant_isolation ON public.crm_opportunities
    FOR ALL USING (company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid);

CREATE POLICY crm_activities_tenant_isolation ON public.crm_activities
    FOR ALL USING (company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid);

CREATE POLICY crm_quotations_tenant_isolation ON public.crm_quotations
    FOR ALL USING (company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid);

CREATE POLICY crm_quotation_lines_tenant_isolation ON public.crm_quotation_lines
    FOR ALL USING (company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid);

CREATE POLICY crm_proposals_tenant_isolation ON public.crm_proposals
    FOR ALL USING (company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid);

CREATE POLICY crm_sales_orders_tenant_isolation ON public.crm_sales_orders
    FOR ALL USING (company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid);

CREATE POLICY crm_sales_order_lines_tenant_isolation ON public.crm_sales_order_lines
    FOR ALL USING (company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid);
