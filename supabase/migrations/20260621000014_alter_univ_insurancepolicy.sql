ALTER TABLE public.univ_insurancepolicy ADD COLUMN IF NOT EXISTS end_date TEXT;
ALTER TABLE public.univ_insurancepolicy ADD COLUMN IF NOT EXISTS sum_insured REAL;
