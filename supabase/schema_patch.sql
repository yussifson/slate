-- 1. Support multiple currencies and manual exchange rates in invoices
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC DEFAULT 1.0;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS due_time TEXT;

-- 2. Create the case timeline diary table
CREATE TABLE IF NOT EXISTS public.case_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  case_id TEXT,
  case_title TEXT,
  title TEXT,
  description TEXT,
  activity_type TEXT,
  logged_by_name TEXT
);

-- Enable RLS for case_timeline
ALTER TABLE public.case_timeline ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.case_timeline;
CREATE POLICY "Enable all for authenticated users" ON public.case_timeline FOR ALL USING (auth.role() = 'authenticated');
