CREATE TABLE IF NOT EXISTS public.insurance_reinsurance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    treaty_name TEXT NOT NULL,
    reinsurer TEXT NOT NULL,
    ceded_premium REAL,
    coverage_limit REAL,
    effective_date TEXT,
    expiry_date TEXT,
    status TEXT
);

ALTER TABLE public.insurance_reinsurance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view insurance_reinsurance" ON public.insurance_reinsurance;
CREATE POLICY "Users can view insurance_reinsurance"
    ON public.insurance_reinsurance FOR SELECT
    USING (company_id IN (
        SELECT company_id FROM public.company_users WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can insert insurance_reinsurance" ON public.insurance_reinsurance;
CREATE POLICY "Users can insert insurance_reinsurance"
    ON public.insurance_reinsurance FOR INSERT
    WITH CHECK (company_id IN (
        SELECT company_id FROM public.company_users WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can update insurance_reinsurance" ON public.insurance_reinsurance;
CREATE POLICY "Users can update insurance_reinsurance"
    ON public.insurance_reinsurance FOR UPDATE
    USING (company_id IN (
        SELECT company_id FROM public.company_users WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can delete insurance_reinsurance" ON public.insurance_reinsurance;
CREATE POLICY "Users can delete insurance_reinsurance"
    ON public.insurance_reinsurance FOR DELETE
    USING (company_id IN (
        SELECT company_id FROM public.company_users WHERE user_id = auth.uid()
    ));
