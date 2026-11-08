-- Migration: 20261108140000_jcl_targets_pettycash_calendars.sql
-- Adds Sales Targets, Petty Cash, Shared Calendars & Calendar Members

-- 1. Sales Targets
CREATE TABLE IF NOT EXISTS public.sales_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  title text NOT NULL,
  target_type text NOT NULL DEFAULT 'leads_closed', -- 'leads_closed' | 'revenue' | 'viewings'
  target_value numeric NOT NULL DEFAULT 10,
  period_start date NOT NULL DEFAULT CURRENT_DATE,
  period_end date NOT NULL DEFAULT (CURRENT_DATE + interval '30 days'),
  assigned_to text NOT NULL DEFAULT 'all', -- 'all' | 'selected' | 'single'
  assignee_ids jsonb NOT NULL DEFAULT '[]'::jsonb, -- array of user ids: [{id, name, email}]
  notes text,
  status text NOT NULL DEFAULT 'active', -- 'active' | 'completed' | 'archived'
  created_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for speed
CREATE INDEX IF NOT EXISTS idx_sales_targets_company ON public.sales_targets(company_id);

-- 2. Petty Cash
CREATE TABLE IF NOT EXISTS public.petty_cash (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'Office Supplies', -- 'Office Supplies' | 'Transport & Fuel' | 'Client Refreshments' | 'Repairs & Maintenance' | 'Utilities' | 'Other'
  amount numeric NOT NULL,
  transaction_type text NOT NULL DEFAULT 'expense', -- 'expense' | 'replenishment'
  paid_to text,
  receipt_ref text,
  balance_after numeric,
  recorded_by text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_petty_cash_company ON public.petty_cash(company_id);
CREATE INDEX IF NOT EXISTS idx_petty_cash_date ON public.petty_cash(transaction_date);

-- 3. Shared Calendars
CREATE TABLE IF NOT EXISTS public.calendars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  name text NOT NULL,
  description text,
  color text NOT NULL DEFAULT '#6366f1',
  visibility text NOT NULL DEFAULT 'public', -- 'public' | 'private' | 'hybrid'
  created_by text,
  created_by_email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendars_company ON public.calendars(company_id);

-- 4. Calendar Members (for Hybrid & Private Shared Calendars)
CREATE TABLE IF NOT EXISTS public.calendar_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id uuid REFERENCES public.calendars(id) ON DELETE CASCADE,
  company_id uuid,
  member_id text NOT NULL,
  member_name text,
  member_email text,
  can_edit boolean DEFAULT true,
  added_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendar_members_cal ON public.calendar_members(calendar_id);
CREATE INDEX IF NOT EXISTS idx_calendar_members_user ON public.calendar_members(member_id);

-- 5. Link events to calendar_id
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS calendar_id uuid REFERENCES public.calendars(id) ON DELETE SET NULL;
ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS calendar_id uuid REFERENCES public.calendars(id) ON DELETE SET NULL;

-- Enable RLS & open policies for company-level multi-tenancy
ALTER TABLE public.sales_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.petty_cash ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_members ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow company access sales_targets') THEN
    CREATE POLICY "Allow company access sales_targets" ON public.sales_targets FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow company access petty_cash') THEN
    CREATE POLICY "Allow company access petty_cash" ON public.petty_cash FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow company access calendars') THEN
    CREATE POLICY "Allow company access calendars" ON public.calendars FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow company access calendar_members') THEN
    CREATE POLICY "Allow company access calendar_members" ON public.calendar_members FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
