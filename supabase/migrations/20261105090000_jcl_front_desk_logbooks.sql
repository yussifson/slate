-- JCL Real Estate secretary desk: visitor and staff presence registers.
CREATE TABLE IF NOT EXISTS public.jcl_visitor_logbook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  visitor_name TEXT NOT NULL,
  visitor_company TEXT,
  host_name TEXT NOT NULL,
  purpose TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'checked_in' CHECK (status IN ('checked_in', 'checked_out')),
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  checked_out_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jcl_visitor_logbook_company_time ON public.jcl_visitor_logbook(company_id, checked_in_at DESC);
ALTER TABLE public.jcl_visitor_logbook ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS jcl_visitor_logbook_company_access ON public.jcl_visitor_logbook;
CREATE POLICY jcl_visitor_logbook_company_access ON public.jcl_visitor_logbook FOR ALL TO authenticated
USING (company_id::text IN (SELECT company_id::text FROM public.profiles WHERE id = auth.uid()))
WITH CHECK (company_id::text IN (SELECT company_id::text FROM public.profiles WHERE id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.jcl_staff_logbook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  staff_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  staff_name TEXT NOT NULL,
  staff_email TEXT,
  status TEXT NOT NULL DEFAULT 'checked_in' CHECK (status IN ('checked_in', 'checked_out')),
  logged_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  logged_out_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jcl_staff_logbook_company_time ON public.jcl_staff_logbook(company_id, logged_in_at DESC);
ALTER TABLE public.jcl_staff_logbook ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS jcl_staff_logbook_company_access ON public.jcl_staff_logbook;
CREATE POLICY jcl_staff_logbook_company_access ON public.jcl_staff_logbook FOR ALL TO authenticated
USING (company_id::text IN (SELECT company_id::text FROM public.profiles WHERE id = auth.uid()))
WITH CHECK (company_id::text IN (SELECT company_id::text FROM public.profiles WHERE id = auth.uid()));

DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION powersync ADD TABLE public.jcl_visitor_logbook';
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL;
END $$;
DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION powersync ADD TABLE public.jcl_staff_logbook';
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL;
END $$;
