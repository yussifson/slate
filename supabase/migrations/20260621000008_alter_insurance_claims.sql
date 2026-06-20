ALTER TABLE public.insurance_claims ADD COLUMN IF NOT EXISTS policy_number TEXT;
ALTER TABLE public.insurance_claims ADD COLUMN IF NOT EXISTS incident_date TEXT;
ALTER TABLE public.insurance_claims ADD COLUMN IF NOT EXISTS claim_amount REAL;
