-- ============================================================================
-- SLATE V2: PHASE 5 — FINAL INTEGRITY & COMPOSITE TENANT ISOLATION
-- Migration: 20261031125600_slate_v2_phase5_integrity_hardening.sql
-- Timestamp: 2026-10-31 12:56:00
-- Description:
--   Strengthens Phase 5 operational tables with composite unique constraints
--   and foreign keys to enforce tenant consistency at the database engine level.
--   Prevents assigning a party or team from Company A to a project in Company B.
-- ============================================================================

-- 1. Ensure composite unique constraints exist on referenced tables
ALTER TABLE public.ops_teams ADD CONSTRAINT uq_ops_teams_company_id UNIQUE (company_id, id);
ALTER TABLE public.ops_projects ADD CONSTRAINT uq_ops_projects_company_id UNIQUE (company_id, id);
ALTER TABLE public.ops_work_orders ADD CONSTRAINT uq_ops_work_orders_company_id UNIQUE (company_id, id);
ALTER TABLE public.ops_project_milestones ADD CONSTRAINT uq_ops_milestones_company_id UNIQUE (company_id, id);

-- 2. Add composite foreign key constraints to ops_projects
ALTER TABLE public.ops_projects 
    ADD CONSTRAINT fk_ops_projects_client_party_tenant 
    FOREIGN KEY (company_id, client_party_id) 
    REFERENCES public.core_parties(company_id, id) ON DELETE SET NULL;

ALTER TABLE public.ops_projects 
    ADD CONSTRAINT fk_ops_projects_lead_party_tenant 
    FOREIGN KEY (company_id, lead_party_id) 
    REFERENCES public.core_parties(company_id, id) ON DELETE SET NULL;

ALTER TABLE public.ops_projects 
    ADD CONSTRAINT fk_ops_projects_team_tenant 
    FOREIGN KEY (company_id, team_id) 
    REFERENCES public.ops_teams(company_id, id) ON DELETE SET NULL;

-- 3. Add composite foreign key constraints to ops_team_members
ALTER TABLE public.ops_team_members 
    ADD CONSTRAINT fk_ops_team_members_team_tenant 
    FOREIGN KEY (company_id, team_id) 
    REFERENCES public.ops_teams(company_id, id) ON DELETE CASCADE;

ALTER TABLE public.ops_team_members 
    ADD CONSTRAINT fk_ops_team_members_party_tenant 
    FOREIGN KEY (company_id, party_id) 
    REFERENCES public.core_parties(company_id, id) ON DELETE CASCADE;

-- 4. Add composite foreign key constraints to ops_project_tasks
ALTER TABLE public.ops_project_tasks 
    ADD CONSTRAINT fk_ops_project_tasks_project_tenant 
    FOREIGN KEY (company_id, project_id) 
    REFERENCES public.ops_projects(company_id, id) ON DELETE CASCADE;

ALTER TABLE public.ops_project_tasks 
    ADD CONSTRAINT fk_ops_project_tasks_assignee_tenant 
    FOREIGN KEY (company_id, assigned_to_party_id) 
    REFERENCES public.core_parties(company_id, id) ON DELETE SET NULL;

-- 5. Add composite foreign key constraints to ops_work_orders
ALTER TABLE public.ops_work_orders 
    ADD CONSTRAINT fk_ops_work_orders_assignee_tenant 
    FOREIGN KEY (company_id, assigned_party_id) 
    REFERENCES public.core_parties(company_id, id) ON DELETE SET NULL;

ALTER TABLE public.ops_work_orders 
    ADD CONSTRAINT fk_ops_work_orders_team_tenant 
    FOREIGN KEY (company_id, assigned_team_id) 
    REFERENCES public.ops_teams(company_id, id) ON DELETE SET NULL;

-- 6. Add composite foreign key constraints to ops_issues
ALTER TABLE public.ops_issues 
    ADD CONSTRAINT fk_ops_issues_assignee_tenant 
    FOREIGN KEY (company_id, assigned_to_party_id) 
    REFERENCES public.core_parties(company_id, id) ON DELETE SET NULL;

ALTER TABLE public.ops_issues 
    ADD CONSTRAINT fk_ops_issues_team_tenant 
    FOREIGN KEY (company_id, escalated_to_team_id) 
    REFERENCES public.ops_teams(company_id, id) ON DELETE SET NULL;
