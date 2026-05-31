-- Run this in your Supabase SQL Editor to create the Dynamic Modules tables

CREATE TABLE IF NOT EXISTS public.module_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  company_id TEXT,
  name TEXT,
  description TEXT,
  icon TEXT,
  is_active TEXT
);
ALTER TABLE public.module_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.module_definitions;
CREATE POLICY "Enable all for authenticated users" ON public.module_definitions FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  module_id UUID,
  company_id TEXT,
  name TEXT,
  field_type TEXT,
  options JSONB,
  is_required BOOLEAN,
  order_index INTEGER
);
ALTER TABLE public.field_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.field_definitions;
CREATE POLICY "Enable all for authenticated users" ON public.field_definitions FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.dynamic_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  module_id UUID,
  company_id TEXT,
  data JSONB
);
ALTER TABLE public.dynamic_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.dynamic_records;
CREATE POLICY "Enable all for authenticated users" ON public.dynamic_records FOR ALL USING (auth.role() = 'authenticated');
