-- Migration: 20261106160000_jcl_real_estate_production_backend_complete.sql
-- Description: Complete backend database schema, missing tables, missing columns, indexes, and RLS for all JCL Real Estate features.

-- 1. Create univ_re_esignatures (dual-named table for E-Signatures)
CREATE TABLE IF NOT EXISTS public.univ_re_esignatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    document_title TEXT NOT NULL,
    signer_name TEXT NOT NULL,
    signer_email TEXT NOT NULL,
    signer_role TEXT DEFAULT 'Client',
    status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'sent', 'viewed', 'signed', 'declined', 'expired')),
    sent_date TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    signed_date TIMESTAMPTZ,
    audit_hash TEXT,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_univ_re_esignatures_company ON public.univ_re_esignatures(company_id);
ALTER TABLE public.univ_re_esignatures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "jcl_re_esignatures_company_all" ON public.univ_re_esignatures;
CREATE POLICY "jcl_re_esignatures_company_all" ON public.univ_re_esignatures
    FOR ALL USING (company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid)
    WITH CHECK (company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid);

-- 2. Create univ_re_maintenance table
CREATE TABLE IF NOT EXISTS public.univ_re_maintenance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    lease_id UUID,
    property_id UUID,
    title TEXT NOT NULL,
    issue_type TEXT DEFAULT 'general',
    description TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'scheduled', 'resolved', 'closed', 'cancelled')),
    contractor_id UUID,
    cost NUMERIC DEFAULT 0,
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_univ_re_maintenance_company ON public.univ_re_maintenance(company_id);
ALTER TABLE public.univ_re_maintenance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "jcl_re_maintenance_company_all" ON public.univ_re_maintenance;
CREATE POLICY "jcl_re_maintenance_company_all" ON public.univ_re_maintenance
    FOR ALL USING (company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid)
    WITH CHECK (company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid);

-- 3. Add missing columns to univ_re_commissions
ALTER TABLE public.univ_re_commissions ADD COLUMN IF NOT EXISTS property_address TEXT;
ALTER TABLE public.univ_re_commissions ADD COLUMN IF NOT EXISTS sale_price NUMERIC DEFAULT 0;
ALTER TABLE public.univ_re_commissions ADD COLUMN IF NOT EXISTS brokerage_split_rate NUMERIC DEFAULT 0;
ALTER TABLE public.univ_re_commissions ADD COLUMN IF NOT EXISTS agent_payout_amount NUMERIC DEFAULT 0;
ALTER TABLE public.univ_re_commissions ADD COLUMN IF NOT EXISTS notes TEXT;

-- 4. Add missing columns to univ_re_counter_offers
ALTER TABLE public.univ_re_counter_offers ADD COLUMN IF NOT EXISTS property_address TEXT;
ALTER TABLE public.univ_re_counter_offers ADD COLUMN IF NOT EXISTS buyer_name TEXT;
ALTER TABLE public.univ_re_counter_offers ADD COLUMN IF NOT EXISTS original_price NUMERIC DEFAULT 0;
ALTER TABLE public.univ_re_counter_offers ADD COLUMN IF NOT EXISTS counter_price NUMERIC DEFAULT 0;
ALTER TABLE public.univ_re_counter_offers ADD COLUMN IF NOT EXISTS earnest_money NUMERIC DEFAULT 0;
ALTER TABLE public.univ_re_counter_offers ADD COLUMN IF NOT EXISTS expiration_date TIMESTAMPTZ;
ALTER TABLE public.univ_re_counter_offers ADD COLUMN IF NOT EXISTS contingencies TEXT;
ALTER TABLE public.univ_re_counter_offers ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.univ_re_counter_offers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- 5. Add missing columns to univ_re_contractor_reviews
ALTER TABLE public.univ_re_contractor_reviews ADD COLUMN IF NOT EXISTS contractor_name TEXT;
ALTER TABLE public.univ_re_contractor_reviews ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 5;
ALTER TABLE public.univ_re_contractor_reviews ADD COLUMN IF NOT EXISTS review_text TEXT;
ALTER TABLE public.univ_re_contractor_reviews ADD COLUMN IF NOT EXISTS reviewer_name TEXT;

-- 6. Add missing columns to univ_re_contractors
ALTER TABLE public.univ_re_contractors ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.univ_re_contractors ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.univ_re_contractors ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 5;

-- 7. Add missing columns to univ_re_escrow_accounts
ALTER TABLE public.univ_re_escrow_accounts ADD COLUMN IF NOT EXISTS buyer_name TEXT;
ALTER TABLE public.univ_re_escrow_accounts ADD COLUMN IF NOT EXISTS seller_name TEXT;
ALTER TABLE public.univ_re_escrow_accounts ADD COLUMN IF NOT EXISTS property_address TEXT;
ALTER TABLE public.univ_re_escrow_accounts ADD COLUMN IF NOT EXISTS escrow_agent_company TEXT;
ALTER TABLE public.univ_re_escrow_accounts ADD COLUMN IF NOT EXISTS release_status TEXT DEFAULT 'held';
ALTER TABLE public.univ_re_escrow_accounts ADD COLUMN IF NOT EXISTS release_conditions TEXT;

-- 8. Add missing columns to univ_re_lease_renewals
ALTER TABLE public.univ_re_lease_renewals ADD COLUMN IF NOT EXISTS tenant_name TEXT;
ALTER TABLE public.univ_re_lease_renewals ADD COLUMN IF NOT EXISTS property_address TEXT;
ALTER TABLE public.univ_re_lease_renewals ADD COLUMN IF NOT EXISTS current_rent NUMERIC DEFAULT 0;
ALTER TABLE public.univ_re_lease_renewals ADD COLUMN IF NOT EXISTS proposed_rent NUMERIC DEFAULT 0;
ALTER TABLE public.univ_re_lease_renewals ADD COLUMN IF NOT EXISTS expiration_date TIMESTAMPTZ;
ALTER TABLE public.univ_re_lease_renewals ADD COLUMN IF NOT EXISTS new_term_months INTEGER DEFAULT 12;
ALTER TABLE public.univ_re_lease_renewals ADD COLUMN IF NOT EXISTS notes TEXT;

-- 9. Add missing columns to univ_re_leases and univ_re_offers
ALTER TABLE public.univ_re_leases ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.univ_re_offers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 10. Add missing columns to univ_re_rent_payments
ALTER TABLE public.univ_re_rent_payments ADD COLUMN IF NOT EXISTS property_address TEXT;
ALTER TABLE public.univ_re_rent_payments ADD COLUMN IF NOT EXISTS tenant_name TEXT;

-- 11. Add missing columns to univ_re_trust_accounts and univ_re_trust_ledger
ALTER TABLE public.univ_re_trust_accounts ADD COLUMN IF NOT EXISTS routing_number TEXT;
ALTER TABLE public.univ_re_trust_accounts ADD COLUMN IF NOT EXISTS account_holder_name TEXT;
ALTER TABLE public.univ_re_trust_accounts ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

ALTER TABLE public.univ_re_trust_ledger ADD COLUMN IF NOT EXISTS reference_number TEXT;
ALTER TABLE public.univ_re_trust_ledger ADD COLUMN IF NOT EXISTS transaction_date TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.univ_re_trust_ledger ADD COLUMN IF NOT EXISTS created_by UUID;

-- 12. Ensure comprehensive RLS policies across all JCL real estate tables
DO $$
DECLARE
    tbl text;
    jcl_tables text[] := ARRAY[
        'univ_re_properties', 'univ_re_clients', 'univ_re_viewings', 'univ_re_offers',
        'univ_re_transactions', 'univ_re_leases', 'univ_re_rent_payments', 'univ_re_maintenance_requests',
        'univ_re_maintenance', 'univ_re_leads', 'univ_re_lead_activities', 'univ_re_trust_accounts',
        'univ_re_trust_ledger', 'univ_re_escrow_accounts', 'univ_re_document_templates', 'univ_re_esignatures',
        'univ_re_counter_offers', 'univ_re_commission_rules', 'univ_re_commissions', 'univ_re_contractors',
        'univ_re_contractor_reviews', 'univ_re_lease_renewals', 'univ_re_rent_payment_schedules',
        'univ_re_market_data', 'univ_re_comparable_properties', 'univ_re_agent_metrics', 'univ_re_audit_log',
        'univ_re_team_members', 'univ_frontdesk_visitors', 'univ_frontdesk_staff_logs', 'univ_office_custody_items'
    ];
BEGIN
    FOREACH tbl IN ARRAY jcl_tables LOOP
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', 'p_' || tbl || '_access', tbl);
            EXECUTE format(
                'CREATE POLICY %I ON public.%I FOR ALL USING (
                    company_id = (auth.jwt() -> ''app_metadata'' ->> ''company_id'')::uuid
                    OR (auth.jwt() ->> ''role'') = ''super_admin''
                ) WITH CHECK (
                    company_id = (auth.jwt() -> ''app_metadata'' ->> ''company_id'')::uuid
                    OR (auth.jwt() ->> ''role'') = ''super_admin''
                );',
                'p_' || tbl || '_access',
                tbl
            );
        END IF;
    END LOOP;
END $$;
