-- AI-Powered Dynamic Module Tables

CREATE TABLE IF NOT EXISTS public.module_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  name TEXT,
  description TEXT,
  icon TEXT,
  config JSONB DEFAULT '{}'::jsonb,
  industry_type TEXT,
  status TEXT DEFAULT 'published',
  is_active BOOLEAN DEFAULT true
);

ALTER TABLE public.module_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.module_definitions;
CREATE POLICY "Enable all for authenticated users" ON public.module_definitions FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  company_id TEXT,
  module_id TEXT,
  name TEXT NOT NULL,
  field_type TEXT NOT NULL,
  options JSONB DEFAULT '[]'::jsonb,
  is_required BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0
);

ALTER TABLE public.field_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.field_definitions;
CREATE POLICY "Enable all for authenticated users" ON public.field_definitions FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.dynamic_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  module_id TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'active'
);

ALTER TABLE public.dynamic_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.dynamic_records;
CREATE POLICY "Enable all for authenticated users" ON public.dynamic_records FOR ALL USING (auth.role() = 'authenticated');
