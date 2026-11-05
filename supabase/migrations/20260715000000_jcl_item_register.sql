CREATE TABLE IF NOT EXISTS public.jcl_item_register (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL,
  person_id UUID NOT NULL,
  person_name TEXT NOT NULL,
  item_name TEXT NOT NULL,
  description TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expected_return_at TIMESTAMPTZ,
  actual_return_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'returned')),
  issued_by_id UUID,
  issued_by_name TEXT,
  returned_to_name TEXT,
  return_condition TEXT,
  return_notes TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.jcl_item_register_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL,
  item_id UUID NOT NULL REFERENCES public.jcl_item_register(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  changed_by_id UUID,
  changed_by_name TEXT,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS jcl_item_register_company_idx ON public.jcl_item_register(company_id, issued_at DESC);
CREATE INDEX IF NOT EXISTS jcl_item_register_history_item_idx ON public.jcl_item_register_history(item_id, changed_at DESC);

ALTER TABLE public.jcl_item_register ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jcl_item_register_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company members manage item register" ON public.jcl_item_register FOR ALL USING (company_id = public.current_company_id()) WITH CHECK (company_id = public.current_company_id());
CREATE POLICY "company members read item history" ON public.jcl_item_register_history FOR ALL USING (company_id = public.current_company_id()) WITH CHECK (company_id = public.current_company_id());
