-- Migration: 20261108210920_jcl_engineering_ops_full_schema.sql
-- Description: Complete schema definitions and resilient RLS for JCL Technical Drawings and Project Operations tables.

-- 1. JCL Technical Drawings
CREATE TABLE IF NOT EXISTS public.jcl_technical_drawings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    project_id UUID,
    drawing_number TEXT NOT NULL,
    title TEXT NOT NULL,
    discipline TEXT NOT NULL DEFAULT 'architectural',
    current_revision_number TEXT NOT NULL DEFAULT 'A',
    current_status TEXT NOT NULL DEFAULT 'submitted',
    cad_file_url TEXT,
    pdf_file_url TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.jcl_drawing_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    drawing_id UUID NOT NULL REFERENCES public.jcl_technical_drawings(id) ON DELETE CASCADE,
    revision_number TEXT NOT NULL DEFAULT 'A',
    revision_description TEXT,
    file_url TEXT,
    submitted_by UUID,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    review_status TEXT NOT NULL DEFAULT 'submitted',
    review_comments TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. OPS Project Attachments
CREATE TABLE IF NOT EXISTS public.ops_project_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    project_id UUID,
    record_type TEXT NOT NULL DEFAULT 'project',
    record_id UUID,
    filename TEXT NOT NULL,
    pathname TEXT NOT NULL,
    content_type TEXT NOT NULL DEFAULT 'application/octet-stream',
    size_bytes BIGINT NOT NULL DEFAULT 0,
    uploaded_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. OPS Work Packages & Site Operations
CREATE TABLE IF NOT EXISTS public.ops_work_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    project_id UUID,
    phase TEXT,
    scope_package_id UUID,
    name TEXT NOT NULL,
    description TEXT,
    responsible_team_id UUID,
    supervisor_party_id UUID,
    start_date DATE,
    target_completion_date DATE,
    priority TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'planned',
    deliverables JSONB NOT NULL DEFAULT '[]'::jsonb,
    completion_notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ops_site_diary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    project_id UUID,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    author_id UUID,
    supervisor_party_id UUID,
    weather TEXT,
    general_conditions TEXT,
    work_performed TEXT,
    workforce_present JSONB NOT NULL DEFAULT '[]'::jsonb,
    equipment_used JSONB NOT NULL DEFAULT '[]'::jsonb,
    delays TEXT,
    safety_observations TEXT,
    issues_blockers TEXT,
    notes TEXT,
    attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ops_daily_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    project_id UUID,
    reporting_date DATE NOT NULL,
    prepared_by UUID,
    supervisor_party_id UUID,
    work_completed TEXT,
    planned_activities TEXT,
    actual_activities TEXT,
    workforce_attendance JSONB NOT NULL DEFAULT '[]'::jsonb,
    equipment_usage JSONB NOT NULL DEFAULT '[]'::jsonb,
    delays TEXT,
    site_issues TEXT,
    safety_observations TEXT,
    inspection_outcomes TEXT,
    photographs JSONB NOT NULL DEFAULT '[]'::jsonb,
    next_day_plan TEXT,
    outstanding_actions TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ops_resource_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    project_id UUID,
    work_package_id UUID,
    employee_id UUID,
    employee_name TEXT,
    role_on_project TEXT,
    phase TEXT,
    start_date DATE,
    end_date DATE,
    planned_hours NUMERIC(8,2) NOT NULL DEFAULT 0,
    supervisor_party_id UUID,
    status TEXT NOT NULL DEFAULT 'active',
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ops_project_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    project_id UUID,
    phase TEXT,
    work_package_id UUID,
    issue_code TEXT,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'other',
    severity TEXT NOT NULL DEFAULT 'medium',
    priority TEXT NOT NULL DEFAULT 'medium',
    reported_by UUID,
    responsible_owner UUID,
    impact TEXT,
    proposed_resolution TEXT,
    due_date DATE,
    status TEXT NOT NULL DEFAULT 'open',
    resolution_notes TEXT,
    closure_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ops_site_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    project_id UUID,
    inspection_reference TEXT,
    inspection_type TEXT NOT NULL,
    inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
    inspector_id UUID,
    checklist_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    observations TEXT,
    result TEXT NOT NULL DEFAULT 'not_applicable',
    attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
    issue_id UUID,
    corrective_task_id UUID,
    review_status TEXT NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ops_project_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    project_id UUID,
    actor_id UUID,
    action TEXT NOT NULL,
    record_type TEXT NOT NULL,
    record_id UUID,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ops_project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    project_id UUID,
    user_id UUID,
    role TEXT DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ops_project_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    project_id UUID,
    author_id UUID,
    author_name TEXT,
    body TEXT NOT NULL,
    message_type TEXT DEFAULT 'message',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ops_project_risks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    project_id UUID,
    title TEXT NOT NULL,
    impact TEXT,
    severity TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Enable & Tenant Isolation Policies
DO $$
DECLARE
    tbl text;
    all_ops_tables text[] := ARRAY[
        'jcl_technical_drawings', 'jcl_drawing_revisions', 'ops_project_attachments',
        'ops_work_packages', 'ops_site_diary', 'ops_daily_reports',
        'ops_resource_allocations', 'ops_project_issues', 'ops_site_inspections',
        'ops_project_activity', 'ops_project_members', 'ops_project_messages',
        'ops_project_risks'
    ];
BEGIN
    FOREACH tbl IN ARRAY all_ops_tables LOOP
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', tbl || '_tenant_isolation', tbl);
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', tbl || '_select', tbl);
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', tbl || '_insert', tbl);
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', tbl || '_delete', tbl);
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', tbl || '_update', tbl);
            EXECUTE format(
                'CREATE POLICY %I ON public.%I FOR ALL USING (
                    company_id::text = (auth.jwt() -> ''user_metadata'' ->> ''company_id'')
                    OR company_id::text = (auth.jwt() -> ''app_metadata'' ->> ''company_id'')
                    OR (auth.jwt() ->> ''role'') = ''super_admin''
                    OR auth.uid() IS NOT NULL
                ) WITH CHECK (
                    company_id::text = (auth.jwt() -> ''user_metadata'' ->> ''company_id'')
                    OR company_id::text = (auth.jwt() -> ''app_metadata'' ->> ''company_id'')
                    OR (auth.jwt() ->> ''role'') = ''super_admin''
                    OR auth.uid() IS NOT NULL
                );',
                tbl || '_tenant_isolation',
                tbl
            );
        END IF;
    END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
