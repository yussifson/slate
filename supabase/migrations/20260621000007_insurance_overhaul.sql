CREATE TABLE IF NOT EXISTS public.insurance_underwriting (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_id UUID NOT NULL,
    applicant_name TEXT,
    policy_type TEXT,
    risk_score TEXT,
    status TEXT,
    notes TEXT
);

ALTER TABLE public.insurance_underwriting ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_isolation_select" ON public.insurance_underwriting
    FOR SELECT USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "company_isolation_insert" ON public.insurance_underwriting
    FOR INSERT WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "company_isolation_update" ON public.insurance_underwriting
    FOR UPDATE USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "company_isolation_delete" ON public.insurance_underwriting
    FOR DELETE USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));


CREATE TABLE IF NOT EXISTS public.insurance_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_id UUID NOT NULL,
    agent_name TEXT,
    license_number TEXT,
    region TEXT,
    status TEXT
);

ALTER TABLE public.insurance_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_isolation_select" ON public.insurance_agents
    FOR SELECT USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "company_isolation_insert" ON public.insurance_agents
    FOR INSERT WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "company_isolation_update" ON public.insurance_agents
    FOR UPDATE USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "company_isolation_delete" ON public.insurance_agents
    FOR DELETE USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));


CREATE TABLE IF NOT EXISTS public.insurance_premiums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_id UUID NOT NULL,
    policy_number TEXT,
    client_name TEXT,
    amount REAL,
    due_date DATE,
    status TEXT
);

ALTER TABLE public.insurance_premiums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_isolation_select" ON public.insurance_premiums
    FOR SELECT USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "company_isolation_insert" ON public.insurance_premiums
    FOR INSERT WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "company_isolation_update" ON public.insurance_premiums
    FOR UPDATE USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "company_isolation_delete" ON public.insurance_premiums
    FOR DELETE USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
