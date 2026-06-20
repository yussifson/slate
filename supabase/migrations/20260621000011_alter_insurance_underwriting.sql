ALTER TABLE public.insurance_underwriting ADD COLUMN IF NOT EXISTS application_id TEXT;
ALTER TABLE public.insurance_underwriting ADD COLUMN IF NOT EXISTS premium_quote REAL;
ALTER TABLE public.insurance_underwriting ADD COLUMN IF NOT EXISTS sum_insured_requested REAL;
ALTER TABLE public.insurance_underwriting ADD COLUMN IF NOT EXISTS submitted_date TEXT;
