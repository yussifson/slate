-- Migration: Create Secretary & Front Desk Operations Tables
-- Tables: univ_frontdesk_visitors, univ_frontdesk_staff_logs, univ_office_custody_items

CREATE TABLE IF NOT EXISTS public.univ_frontdesk_visitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    visitor_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    organization TEXT,
    host_staff_name TEXT,
    purpose TEXT NOT NULL,
    id_type TEXT DEFAULT 'National ID',
    id_number TEXT,
    check_in_time TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    check_out_time TIMESTAMPTZ,
    status TEXT DEFAULT 'in_office' CHECK (status IN ('in_office', 'checked_out', 'scheduled', 'cancelled')),
    badge_number TEXT,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS public.univ_frontdesk_staff_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    staff_name TEXT NOT NULL,
    staff_email TEXT,
    department TEXT,
    movement_type TEXT NOT NULL DEFAULT 'out_on_field' CHECK (movement_type IN ('out_on_field', 'site_inspection', 'client_meeting', 'official_errand', 'lunch_break', 'checked_in', 'checked_out')),
    destination TEXT,
    purpose TEXT,
    time_out TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    time_in TIMESTAMPTZ,
    status TEXT DEFAULT 'out' CHECK (status IN ('out', 'returned')),
    remarks TEXT
);

CREATE TABLE IF NOT EXISTS public.univ_office_custody_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    category TEXT DEFAULT 'Keys' CHECK (category IN ('Keys', 'Vehicle Keys', 'Site Equipment', 'Office Tech', 'Document File', 'Tools', 'Stationery', 'Other')),
    item_code TEXT,
    taken_by_name TEXT NOT NULL,
    taken_by_email TEXT,
    department TEXT,
    date_taken TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expected_return_date TIMESTAMPTZ,
    returned_date TIMESTAMPTZ,
    status TEXT DEFAULT 'checked_out' CHECK (status IN ('checked_out', 'returned', 'overdue', 'damaged')),
    condition_out TEXT DEFAULT 'Good',
    condition_in TEXT,
    purpose TEXT,
    received_by_secretary TEXT,
    notes TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_univ_frontdesk_visitors_company ON public.univ_frontdesk_visitors(company_id);
CREATE INDEX IF NOT EXISTS idx_univ_frontdesk_staff_logs_company ON public.univ_frontdesk_staff_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_univ_office_custody_items_company ON public.univ_office_custody_items(company_id);

-- RLS policies
ALTER TABLE public.univ_frontdesk_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.univ_frontdesk_staff_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.univ_office_custody_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "frontdesk_visitors_company_access" ON public.univ_frontdesk_visitors
  FOR ALL USING (company_id::text = (SELECT company_id::text FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id::text = (SELECT company_id::text FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "frontdesk_staff_logs_company_access" ON public.univ_frontdesk_staff_logs
  FOR ALL USING (company_id::text = (SELECT company_id::text FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id::text = (SELECT company_id::text FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "office_custody_items_company_access" ON public.univ_office_custody_items
  FOR ALL USING (company_id::text = (SELECT company_id::text FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id::text = (SELECT company_id::text FROM public.profiles WHERE id = auth.uid()));
