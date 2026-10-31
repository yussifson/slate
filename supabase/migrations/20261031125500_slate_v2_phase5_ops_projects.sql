-- ============================================================================
-- SLATE V2: PHASE 5 — PROJECTS, PEOPLE, OPERATIONS & COMMAND CENTER
-- Migration: 20261031125500_slate_v2_phase5_ops_projects.sql
-- Timestamp: 2026-10-31 12:55:00 (Sequenced after Phase 4 12:50:00 and before Phase 6 13:00:00)
-- Description:
--   Establishes tenant-isolated Projects, Teams, Operations & Work Orders:
--   - ops_projects: Connected projects with ownership, budget, party/CRM links
--   - ops_project_milestones: Project milestones and target delivery dates
--   - ops_project_tasks: Extended tasks with dependencies, priorities, assignments
--   - ops_teams & ops_team_members: Department and cross-functional teams linked to core_parties
--   - ops_work_orders: Operational service requests, checklists, and execution logs
--   - ops_issues: Incident and operational issue tracking with escalations
-- ============================================================================

-- 1. TEAMS & DEPARTMENTS
CREATE TABLE IF NOT EXISTS public.ops_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    department TEXT,
    lead_party_id UUID REFERENCES public.core_parties(id) ON DELETE SET NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_ops_teams_name UNIQUE (company_id, name)
);

-- 2. TEAM MEMBERSHIPS
CREATE TABLE IF NOT EXISTS public.ops_team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.ops_teams(id) ON DELETE CASCADE,
    party_id UUID NOT NULL REFERENCES public.core_parties(id) ON DELETE CASCADE,
    role_in_team TEXT NOT NULL DEFAULT 'member', -- lead, specialist, member
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_ops_team_party UNIQUE (company_id, team_id, party_id)
);

-- 3. PROJECTS
CREATE TABLE IF NOT EXISTS public.ops_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    project_code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'on_hold', 'completed', 'cancelled')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    client_party_id UUID REFERENCES public.core_parties(id) ON DELETE SET NULL,
    opportunity_id UUID REFERENCES public.crm_opportunities(id) ON DELETE SET NULL,
    lead_party_id UUID REFERENCES public.core_parties(id) ON DELETE SET NULL,
    team_id UUID REFERENCES public.ops_teams(id) ON DELETE SET NULL,
    start_date DATE,
    target_end_date DATE,
    actual_end_date DATE,
    budget_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (budget_amount >= 0),
    actual_cost NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (actual_cost >= 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    progress_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_ops_project_code UNIQUE (company_id, project_code)
);

-- 4. PROJECT MILESTONES
CREATE TABLE IF NOT EXISTS public.ops_project_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.ops_projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'delayed')),
    completed_at TIMESTAMPTZ,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. PROJECT & OPERATIONAL TASKS
CREATE TABLE IF NOT EXISTS public.ops_project_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.ops_projects(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES public.ops_project_milestones(id) ON DELETE SET NULL,
    parent_task_id UUID REFERENCES public.ops_project_tasks(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done', 'blocked')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to_party_id UUID REFERENCES public.core_parties(id) ON DELETE SET NULL,
    estimated_hours NUMERIC(8,2) DEFAULT 0.00 CHECK (estimated_hours >= 0),
    actual_hours NUMERIC(8,2) DEFAULT 0.00 CHECK (actual_hours >= 0),
    start_date DATE,
    due_date DATE,
    completed_at TIMESTAMPTZ,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. OPERATIONAL WORK ORDERS
CREATE TABLE IF NOT EXISTS public.ops_work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    work_order_type TEXT NOT NULL DEFAULT 'service' CHECK (work_order_type IN ('service', 'maintenance', 'inspection', 'fulfillment', 'internal')),
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'scheduled', 'in_progress', 'completed', 'cancelled')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    client_party_id UUID REFERENCES public.core_parties(id) ON DELETE SET NULL,
    assigned_team_id UUID REFERENCES public.ops_teams(id) ON DELETE SET NULL,
    assigned_party_id UUID REFERENCES public.core_parties(id) ON DELETE SET NULL,
    project_id UUID REFERENCES public.ops_projects(id) ON DELETE SET NULL,
    scheduled_start TIMESTAMPTZ,
    scheduled_end TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    checklist JSONB NOT NULL DEFAULT '[]'::jsonb, -- array of { id, text, checked }
    resolution_notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_ops_work_order_number UNIQUE (company_id, order_number)
);

-- 7. OPERATIONAL ISSUES & INCIDENTS
CREATE TABLE IF NOT EXISTS public.ops_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    issue_code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
    project_id UUID REFERENCES public.ops_projects(id) ON DELETE SET NULL,
    work_order_id UUID REFERENCES public.ops_work_orders(id) ON DELETE SET NULL,
    reported_by_party_id UUID REFERENCES public.core_parties(id) ON DELETE SET NULL,
    assigned_to_party_id UUID REFERENCES public.core_parties(id) ON DELETE SET NULL,
    escalated_to_team_id UUID REFERENCES public.ops_teams(id) ON DELETE SET NULL,
    resolution_summary TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_ops_issue_code UNIQUE (company_id, issue_code)
);

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_ops_teams_company ON public.ops_teams(company_id);
CREATE INDEX IF NOT EXISTS idx_ops_team_members_party ON public.ops_team_members(company_id, party_id);
CREATE INDEX IF NOT EXISTS idx_ops_projects_company ON public.ops_projects(company_id, status);
CREATE INDEX IF NOT EXISTS idx_ops_projects_client ON public.ops_projects(client_party_id);
CREATE INDEX IF NOT EXISTS idx_ops_project_tasks_proj ON public.ops_project_tasks(project_id, status);
CREATE INDEX IF NOT EXISTS idx_ops_project_tasks_assignee ON public.ops_project_tasks(company_id, assigned_to_party_id);
CREATE INDEX IF NOT EXISTS idx_ops_work_orders_company ON public.ops_work_orders(company_id, status);
CREATE INDEX IF NOT EXISTS idx_ops_work_orders_assignee ON public.ops_work_orders(assigned_party_id);
CREATE INDEX IF NOT EXISTS idx_ops_issues_company ON public.ops_issues(company_id, status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.ops_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_issues ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS ops_teams_tenant_isolation ON public.ops_teams;
    DROP POLICY IF EXISTS ops_team_members_tenant_isolation ON public.ops_team_members;
    DROP POLICY IF EXISTS ops_projects_tenant_isolation ON public.ops_projects;
    DROP POLICY IF EXISTS ops_milestones_tenant_isolation ON public.ops_project_milestones;
    DROP POLICY IF EXISTS ops_tasks_tenant_isolation ON public.ops_project_tasks;
    DROP POLICY IF EXISTS ops_work_orders_tenant_isolation ON public.ops_work_orders;
    DROP POLICY IF EXISTS ops_issues_tenant_isolation ON public.ops_issues;
END $$;

CREATE POLICY ops_teams_tenant_isolation ON public.ops_teams
    FOR ALL USING (company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid);

CREATE POLICY ops_team_members_tenant_isolation ON public.ops_team_members
    FOR ALL USING (company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid);

CREATE POLICY ops_projects_tenant_isolation ON public.ops_projects
    FOR ALL USING (company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid);

CREATE POLICY ops_milestones_tenant_isolation ON public.ops_project_milestones
    FOR ALL USING (company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid);

CREATE POLICY ops_tasks_tenant_isolation ON public.ops_project_tasks
    FOR ALL USING (company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid);

CREATE POLICY ops_work_orders_tenant_isolation ON public.ops_work_orders
    FOR ALL USING (company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid);

CREATE POLICY ops_issues_tenant_isolation ON public.ops_issues
    FOR ALL USING (company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid);
