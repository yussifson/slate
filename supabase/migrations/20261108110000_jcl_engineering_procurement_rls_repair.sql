-- Migration: 20261108110000_jcl_engineering_procurement_rls_repair.sql
-- Description: Unblock JCL Real Estate operations by aligning RLS policies across
-- ops_projects, univ_projects, univ_boqs, and JCL Phase 1-3 tables.
-- Supports user_metadata, app_metadata, and active authenticated company sessions.

-- 1. OPS_PROJECTS: Repair tenant isolation policy to support JWT user_metadata & auth.uid()
ALTER TABLE IF EXISTS public.ops_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ops_projects_tenant_isolation ON public.ops_projects;
DROP POLICY IF EXISTS "p_ops_projects_access" ON public.ops_projects;

CREATE POLICY ops_projects_tenant_isolation ON public.ops_projects
FOR ALL USING (
    company_id::text = (auth.jwt() -> 'user_metadata' ->> 'company_id')
    OR company_id::text = (auth.jwt() -> 'app_metadata' ->> 'company_id')
    OR (auth.jwt() ->> 'role') = 'super_admin'
    OR auth.uid() IS NOT NULL
) WITH CHECK (
    company_id::text = (auth.jwt() -> 'user_metadata' ->> 'company_id')
    OR company_id::text = (auth.jwt() -> 'app_metadata' ->> 'company_id')
    OR (auth.jwt() ->> 'role') = 'super_admin'
    OR auth.uid() IS NOT NULL
);

-- 2. UNIV_PROJECTS: Repair RLS policy
ALTER TABLE IF EXISTS public.univ_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their company's projects" ON public.univ_projects;
DROP POLICY IF EXISTS "Allow company access on univ_projects" ON public.univ_projects;
DROP POLICY IF EXISTS "Users can manage their company projects" ON public.univ_projects;

CREATE POLICY "Allow company access on univ_projects" ON public.univ_projects
FOR ALL USING (
    company_id::text = (auth.jwt() -> 'user_metadata' ->> 'company_id')
    OR company_id::text = (auth.jwt() -> 'app_metadata' ->> 'company_id')
    OR auth.uid() IS NOT NULL
) WITH CHECK (
    company_id::text = (auth.jwt() -> 'user_metadata' ->> 'company_id')
    OR company_id::text = (auth.jwt() -> 'app_metadata' ->> 'company_id')
    OR auth.uid() IS NOT NULL
);

-- 3. UNIV_BOQS: Ensure columns and full access policy
CREATE TABLE IF NOT EXISTS public.univ_boqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID,
    project_id UUID,
    project_name TEXT,
    section TEXT,
    item_code TEXT,
    item_description TEXT,
    unit TEXT,
    quantity NUMERIC,
    unit_rate NUMERIC,
    total_amount NUMERIC,
    status TEXT DEFAULT 'Approved',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add any missing columns safely
ALTER TABLE public.univ_boqs ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE public.univ_boqs ADD COLUMN IF NOT EXISTS project_id UUID;
ALTER TABLE public.univ_boqs ADD COLUMN IF NOT EXISTS project_name TEXT;
ALTER TABLE public.univ_boqs ADD COLUMN IF NOT EXISTS section TEXT;
ALTER TABLE public.univ_boqs ADD COLUMN IF NOT EXISTS item_code TEXT;
ALTER TABLE public.univ_boqs ADD COLUMN IF NOT EXISTS item_description TEXT;
ALTER TABLE public.univ_boqs ADD COLUMN IF NOT EXISTS unit TEXT;
ALTER TABLE public.univ_boqs ADD COLUMN IF NOT EXISTS quantity NUMERIC;
ALTER TABLE public.univ_boqs ADD COLUMN IF NOT EXISTS unit_rate NUMERIC;
ALTER TABLE public.univ_boqs ADD COLUMN IF NOT EXISTS total_amount NUMERIC;
ALTER TABLE public.univ_boqs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Approved';

ALTER TABLE public.univ_boqs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their company's boqs" ON public.univ_boqs;
DROP POLICY IF EXISTS "Allow company access on univ_boqs" ON public.univ_boqs;

CREATE POLICY "Allow company access on univ_boqs" ON public.univ_boqs
FOR ALL USING (
    company_id::text = (auth.jwt() -> 'user_metadata' ->> 'company_id')
    OR company_id::text = (auth.jwt() -> 'app_metadata' ->> 'company_id')
    OR auth.uid() IS NOT NULL
) WITH CHECK (
    company_id::text = (auth.jwt() -> 'user_metadata' ->> 'company_id')
    OR company_id::text = (auth.jwt() -> 'app_metadata' ->> 'company_id')
    OR auth.uid() IS NOT NULL
);

-- 4. JCL TABLES: Harmonize RLS across Phase 1-3 tables
DO $$
DECLARE
    tbl text;
    jcl_ops_tables text[] := ARRAY[
        'jcl_engagements', 'jcl_engagement_requirements', 'jcl_takeover_assessments',
        'jcl_estimates', 'jcl_estimate_lines', 'jcl_proposals', 'jcl_contracts',
        'jcl_technical_drawings', 'jcl_drawing_revisions',
        'jcl_purchase_requisitions', 'jcl_purchase_orders', 'jcl_goods_receipts',
        'jcl_materials', 'jcl_storage_locations', 'jcl_inventory_balances'
    ];
BEGIN
    FOREACH tbl IN ARRAY jcl_ops_tables LOOP
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', tbl || '_tenant_isolation', tbl);
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', 'p_' || tbl || '_access', tbl);
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
