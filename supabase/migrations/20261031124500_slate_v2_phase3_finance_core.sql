-- SLATE V2: Phase 3 Finance, Double-Entry Accounting & Financial Operations
-- Migration: 20261031124500_slate_v2_phase3_finance_core.sql
-- Description: Establishes authoritative double-entry general ledger, chart of accounts,
--              balanced journal entries, accounts receivable & payable, bills, payments,
--              and immutable financial audit controls with strict RLS and tenant isolation.

-- 1. Chart of Accounts (General Ledger Accounts)
CREATE TABLE IF NOT EXISTS fin_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    account_code VARCHAR(32) NOT NULL,
    name VARCHAR(128) NOT NULL,
    account_type VARCHAR(32) NOT NULL CHECK (account_type IN ('Asset', 'Liability', 'Equity', 'Revenue', 'Expense')),
    category VARCHAR(64) NOT NULL, -- e.g. 'Current Asset', 'Operating Expense', 'Direct Revenue'
    currency VARCHAR(8) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    parent_account_id UUID REFERENCES fin_accounts(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, account_code),
    UNIQUE(company_id, id)
);

CREATE INDEX IF NOT EXISTS idx_fin_accounts_lookup ON fin_accounts(company_id, account_code);
CREATE INDEX IF NOT EXISTS idx_fin_accounts_type ON fin_accounts(company_id, account_type);

ALTER TABLE fin_accounts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'fin_accounts' AND policyname = 'fin_accounts_tenant_isolation'
    ) THEN
        CREATE POLICY fin_accounts_tenant_isolation ON fin_accounts
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

-- 2. General Ledger Journal Entries (Header)
CREATE TABLE IF NOT EXISTS fin_journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    entry_number VARCHAR(64) NOT NULL,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    period VARCHAR(16) NOT NULL, -- 'YYYY-MM'
    memo TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'reversed')),
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    source_document_type VARCHAR(64), -- 'invoice', 'bill', 'payment', 'manual_journal', 'expense'
    source_document_id VARCHAR(128),
    reversal_of_entry_id UUID REFERENCES fin_journal_entries(id) ON DELETE SET NULL,
    posted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    posted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, entry_number),
    UNIQUE(company_id, id)
);

CREATE INDEX IF NOT EXISTS idx_fin_journal_entries_date ON fin_journal_entries(company_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_fin_journal_entries_status ON fin_journal_entries(company_id, status);

ALTER TABLE fin_journal_entries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'fin_journal_entries' AND policyname = 'fin_journal_entries_tenant_isolation'
    ) THEN
        CREATE POLICY fin_journal_entries_tenant_isolation ON fin_journal_entries
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

-- 3. Journal Entry Lines (Debit / Credit Detail)
CREATE TABLE IF NOT EXISTS fin_journal_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    journal_entry_id UUID NOT NULL,
    account_id UUID NOT NULL,
    party_id UUID, -- Optional Core Party link
    line_type VARCHAR(16) NOT NULL CHECK (line_type IN ('debit', 'credit')),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_fin_journal_lines_entry FOREIGN KEY (company_id, journal_entry_id)
        REFERENCES fin_journal_entries(company_id, id) ON DELETE CASCADE,
    CONSTRAINT fk_fin_journal_lines_account FOREIGN KEY (company_id, account_id)
        REFERENCES fin_accounts(company_id, id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_fin_journal_lines_lookup ON fin_journal_lines(company_id, journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_fin_journal_lines_account ON fin_journal_lines(company_id, account_id);

ALTER TABLE fin_journal_lines ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'fin_journal_lines' AND policyname = 'fin_journal_lines_tenant_isolation'
    ) THEN
        CREATE POLICY fin_journal_lines_tenant_isolation ON fin_journal_lines
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

-- Database-level immutability trigger preventing modification of posted journal entries
CREATE OR REPLACE FUNCTION trg_prevent_posted_journal_mutation()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'posted' AND (TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.status <> 'reversed')) THEN
        RAISE EXCEPTION 'Accounting Integrity Violation: Posted journal entries are immutable. You must post a reversal journal entry instead.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_guard_posted_journals ON fin_journal_entries;
CREATE TRIGGER trg_guard_posted_journals
    BEFORE UPDATE OR DELETE ON fin_journal_entries
    FOR EACH ROW EXECUTE FUNCTION trg_prevent_posted_journal_mutation();

-- 4. Supplier Bills (Accounts Payable)
CREATE TABLE IF NOT EXISTS fin_supplier_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    supplier_party_id UUID NOT NULL,
    bill_number VARCHAR(64) NOT NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    currency VARCHAR(8) DEFAULT 'USD',
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    amount_paid NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(32) NOT NULL DEFAULT 'unpaid' CHECK (status IN ('draft', 'unpaid', 'partially_paid', 'paid', 'voided')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, bill_number),
    CONSTRAINT fk_fin_bills_supplier FOREIGN KEY (company_id, supplier_party_id)
        REFERENCES core_parties(company_id, id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_fin_supplier_bills_lookup ON fin_supplier_bills(company_id, supplier_party_id);
CREATE INDEX IF NOT EXISTS idx_fin_supplier_bills_status ON fin_supplier_bills(company_id, status);

ALTER TABLE fin_supplier_bills ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'fin_supplier_bills' AND policyname = 'fin_supplier_bills_tenant_isolation'
    ) THEN
        CREATE POLICY fin_supplier_bills_tenant_isolation ON fin_supplier_bills
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

-- 5. Payments (Accounts Receivable & Accounts Payable Settlements)
CREATE TABLE IF NOT EXISTS fin_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    payment_number VARCHAR(64) NOT NULL,
    party_id UUID NOT NULL,
    payment_type VARCHAR(16) NOT NULL CHECK (payment_type IN ('inbound', 'outbound')), -- inbound = AR customer receipt, outbound = AP vendor payout
    payment_method VARCHAR(32) NOT NULL, -- 'bank_transfer', 'stripe', 'paystack', 'cash', 'check'
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reference VARCHAR(128),
    provider_transaction_id VARCHAR(128),
    status VARCHAR(32) NOT NULL DEFAULT 'settled' CHECK (status IN ('pending', 'settled', 'failed', 'refunded')),
    reconciled BOOLEAN DEFAULT false,
    notes TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, payment_number),
    CONSTRAINT fk_fin_payments_party FOREIGN KEY (company_id, party_id)
        REFERENCES core_parties(company_id, id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_fin_payments_lookup ON fin_payments(company_id, party_id);
CREATE INDEX IF NOT EXISTS idx_fin_payments_date ON fin_payments(company_id, payment_date DESC);

ALTER TABLE fin_payments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'fin_payments' AND policyname = 'fin_payments_tenant_isolation'
    ) THEN
        CREATE POLICY fin_payments_tenant_isolation ON fin_payments
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
