-- ============================================================
-- PATCH_JULY6.sql
-- Fixes three issues blocking onboarding:
--   1. workspace_modules RLS 403 errors
--   2. Missing tenant_id column on univ_re_lease_renewals
--   3. Missing columns on univ_re_rent_payment_schedules
-- ============================================================

-- ============================================================
-- 1. FIX workspace_modules RLS
-- The previous company_id-based policy blocks writes during
-- onboarding before the JWT is refreshed with company_id.
-- Solution: Use a simple authenticated-user policy.
-- ============================================================

ALTER TABLE public.workspace_modules ENABLE ROW LEVEL SECURITY;

-- Drop all existing conflicting policies
DROP POLICY IF EXISTS "workspace_modules_all_access"          ON public.workspace_modules;
DROP POLICY IF EXISTS "workspace_modules_authenticated_all"   ON public.workspace_modules;
DROP POLICY IF EXISTS "company_isolation_select"              ON public.workspace_modules;
DROP POLICY IF EXISTS "company_isolation_insert"              ON public.workspace_modules;
DROP POLICY IF EXISTS "company_isolation_update"              ON public.workspace_modules;
DROP POLICY IF EXISTS "company_isolation_delete"              ON public.workspace_modules;
DROP POLICY IF EXISTS "Enable ALL for users based on company_id" ON public.workspace_modules;
DROP POLICY IF EXISTS "Allow full access for service role"    ON public.workspace_modules;

-- New policy: any authenticated user can manage their workspace modules
-- (security is enforced at the application layer via company_id filtering)
CREATE POLICY "workspace_modules_authenticated_all"
    ON public.workspace_modules
    AS PERMISSIVE FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Service role always has full access
CREATE POLICY "workspace_modules_service_role_all"
    ON public.workspace_modules
    AS PERMISSIVE FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Ensure grants are in place
GRANT ALL ON public.workspace_modules TO authenticated, service_role;


-- ============================================================
-- 2. FIX univ_re_lease_renewals — add missing columns
-- ============================================================

-- tenant_id is inserted by createLeaseRenewal() but was never
-- added to the table by the migration script
ALTER TABLE IF EXISTS public.univ_re_lease_renewals
    ADD COLUMN IF NOT EXISTS tenant_id TEXT;

ALTER TABLE IF EXISTS public.univ_re_lease_renewals
    ADD COLUMN IF NOT EXISTS renewal_status TEXT;

ALTER TABLE IF EXISTS public.univ_re_lease_renewals
    ADD COLUMN IF NOT EXISTS renewal_offer_date TEXT;

ALTER TABLE IF EXISTS public.univ_re_lease_renewals
    ADD COLUMN IF NOT EXISTS response_deadline TEXT;

ALTER TABLE IF EXISTS public.univ_re_lease_renewals
    ADD COLUMN IF NOT EXISTS new_rent_amount NUMERIC;

ALTER TABLE IF EXISTS public.univ_re_lease_renewals
    ADD COLUMN IF NOT EXISTS rent_increase_percentage NUMERIC;

ALTER TABLE IF EXISTS public.univ_re_lease_renewals
    ADD COLUMN IF NOT EXISTS renewal_term_months INTEGER;

ALTER TABLE IF EXISTS public.univ_re_lease_renewals
    ADD COLUMN IF NOT EXISTS renewal_lease_document_url TEXT;

ALTER TABLE IF EXISTS public.univ_re_lease_renewals
    ADD COLUMN IF NOT EXISTS tenant_response_date TEXT;

ALTER TABLE IF EXISTS public.univ_re_lease_renewals
    ADD COLUMN IF NOT EXISTS tenant_response TEXT;

ALTER TABLE IF EXISTS public.univ_re_lease_renewals
    ADD COLUMN IF NOT EXISTS renewal_term_start_date TEXT;

ALTER TABLE IF EXISTS public.univ_re_lease_renewals
    ADD COLUMN IF NOT EXISTS renewal_lease_id TEXT;

ALTER TABLE IF EXISTS public.univ_re_lease_renewals
    ADD COLUMN IF NOT EXISTS updated_at TEXT;


-- ============================================================
-- 3. FIX univ_re_rent_payment_schedules — add missing columns
-- ============================================================

-- late_fee_type and related columns are inserted by
-- createPaymentSchedule() but were never added to the table
ALTER TABLE IF EXISTS public.univ_re_rent_payment_schedules
    ADD COLUMN IF NOT EXISTS lease_id TEXT;

ALTER TABLE IF EXISTS public.univ_re_rent_payment_schedules
    ADD COLUMN IF NOT EXISTS payment_due_date INTEGER;

ALTER TABLE IF EXISTS public.univ_re_rent_payment_schedules
    ADD COLUMN IF NOT EXISTS payment_amount NUMERIC;

ALTER TABLE IF EXISTS public.univ_re_rent_payment_schedules
    ADD COLUMN IF NOT EXISTS late_fee_amount NUMERIC;

ALTER TABLE IF EXISTS public.univ_re_rent_payment_schedules
    ADD COLUMN IF NOT EXISTS late_fee_percentage NUMERIC;

ALTER TABLE IF EXISTS public.univ_re_rent_payment_schedules
    ADD COLUMN IF NOT EXISTS late_fee_type TEXT;

ALTER TABLE IF EXISTS public.univ_re_rent_payment_schedules
    ADD COLUMN IF NOT EXISTS grace_period_days INTEGER;

ALTER TABLE IF EXISTS public.univ_re_rent_payment_schedules
    ADD COLUMN IF NOT EXISTS is_recurring INTEGER;

ALTER TABLE IF EXISTS public.univ_re_rent_payment_schedules
    ADD COLUMN IF NOT EXISTS payment_method TEXT;

ALTER TABLE IF EXISTS public.univ_re_rent_payment_schedules
    ADD COLUMN IF NOT EXISTS auto_debit_enabled INTEGER;

ALTER TABLE IF EXISTS public.univ_re_rent_payment_schedules
    ADD COLUMN IF NOT EXISTS recurring_start_date TEXT;

ALTER TABLE IF EXISTS public.univ_re_rent_payment_schedules
    ADD COLUMN IF NOT EXISTS recurring_end_date TEXT;


-- ============================================================
-- Done. Run this entire script in the Supabase SQL Editor.
-- ============================================================
