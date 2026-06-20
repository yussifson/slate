ALTER TABLE public.insurance_premiums ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.insurance_premiums ADD COLUMN IF NOT EXISTS receipt_number TEXT;
ALTER TABLE public.insurance_premiums ADD COLUMN IF NOT EXISTS paid_date TEXT;
