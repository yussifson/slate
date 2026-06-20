CREATE TABLE IF NOT EXISTS public.univ_trust_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    company_id UUID NOT NULL,
    client_id UUID NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal')),
    amount NUMERIC(15, 2) NOT NULL,
    date TEXT NOT NULL,
    description TEXT
);

ALTER TABLE public.univ_trust_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_isolation_select" ON public.univ_trust_transactions
FOR SELECT USING (company_id::text IN (SELECT user_company_ids()));

CREATE POLICY "company_isolation_insert" ON public.univ_trust_transactions
FOR INSERT WITH CHECK (company_id::text IN (SELECT user_company_ids()));

CREATE POLICY "company_isolation_update" ON public.univ_trust_transactions
FOR UPDATE USING (company_id::text IN (SELECT user_company_ids()));

CREATE POLICY "company_isolation_delete" ON public.univ_trust_transactions
FOR DELETE USING (company_id::text IN (SELECT user_company_ids()));


CREATE TABLE IF NOT EXISTS public.univ_case_deadlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    company_id UUID NOT NULL,
    case_id UUID NOT NULL,
    title TEXT NOT NULL,
    deadline_date TEXT NOT NULL,
    is_critical BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'pending'
);

ALTER TABLE public.univ_case_deadlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_isolation_select" ON public.univ_case_deadlines
FOR SELECT USING (company_id::text IN (SELECT user_company_ids()));

CREATE POLICY "company_isolation_insert" ON public.univ_case_deadlines
FOR INSERT WITH CHECK (company_id::text IN (SELECT user_company_ids()));

CREATE POLICY "company_isolation_update" ON public.univ_case_deadlines
FOR UPDATE USING (company_id::text IN (SELECT user_company_ids()));

CREATE POLICY "company_isolation_delete" ON public.univ_case_deadlines
FOR DELETE USING (company_id::text IN (SELECT user_company_ids()));
