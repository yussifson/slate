ALTER TABLE public.insurance_policyholders ADD COLUMN IF NOT EXISTS risk_profile TEXT;
ALTER TABLE public.insurance_policyholders ADD COLUMN IF NOT EXISTS lifetime_value REAL;
ALTER TABLE public.insurance_policyholders ADD COLUMN IF NOT EXISTS date_onboarded TEXT;
