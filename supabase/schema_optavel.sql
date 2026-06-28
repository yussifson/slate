-- ==========================================
-- OPTAVEL INTERNAL OS SCHEMA
-- ==========================================
-- All tables are associated with a company_id to leverage existing multi-tenant architecture and RLS.

-- 1. EXECUTIVE & CORE
CREATE TABLE IF NOT EXISTS public.optavel_okrs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'on_track',
    progress INTEGER DEFAULT 0,
    owner_id UUID REFERENCES public.profiles(id),
    quarter TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.optavel_okrs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "optavel_okrs_policy" ON public.optavel_okrs FOR ALL USING (company_id = (SELECT company_id::uuid FROM profiles WHERE id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.optavel_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    context TEXT,
    outcome TEXT,
    status TEXT DEFAULT 'pending',
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.optavel_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "optavel_decisions_policy" ON public.optavel_decisions FOR ALL USING (company_id = (SELECT company_id::uuid FROM profiles WHERE id = auth.uid()));

-- 2. MARKETING
CREATE TABLE IF NOT EXISTS public.optavel_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT,
    budget NUMERIC DEFAULT 0,
    spent NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'planned',
    roi NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.optavel_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "optavel_campaigns_policy" ON public.optavel_campaigns FOR ALL USING (company_id = (SELECT company_id::uuid FROM profiles WHERE id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.optavel_marketing_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.optavel_campaigns(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT,
    uploaded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.optavel_marketing_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "optavel_marketing_reports_policy" ON public.optavel_marketing_reports FOR ALL USING (company_id = (SELECT company_id::uuid FROM profiles WHERE id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.optavel_seo_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    rank INTEGER,
    volume INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.optavel_seo_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "optavel_seo_tracking_policy" ON public.optavel_seo_tracking FOR ALL USING (company_id = (SELECT company_id::uuid FROM profiles WHERE id = auth.uid()));

-- 3. PRODUCT & ENGINEERING
CREATE TABLE IF NOT EXISTS public.optavel_sprints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    velocity INTEGER,
    status TEXT DEFAULT 'active'
);
ALTER TABLE public.optavel_sprints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "optavel_sprints_policy" ON public.optavel_sprints FOR ALL USING (company_id = (SELECT company_id::uuid FROM profiles WHERE id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.optavel_bugs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    severity TEXT DEFAULT 'low',
    status TEXT DEFAULT 'open',
    product TEXT,
    reporter_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.optavel_bugs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "optavel_bugs_policy" ON public.optavel_bugs FOR ALL USING (company_id = (SELECT company_id::uuid FROM profiles WHERE id = auth.uid()));

-- 4. SALES & FINANCE
CREATE TABLE IF NOT EXISTS public.optavel_deal_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    lead_name TEXT NOT NULL,
    value NUMERIC DEFAULT 0,
    stage TEXT DEFAULT 'lead',
    probability INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.optavel_deal_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "optavel_deal_rooms_policy" ON public.optavel_deal_rooms FOR ALL USING (company_id = (SELECT company_id::uuid FROM profiles WHERE id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.optavel_commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES public.profiles(id),
    amount NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'unpaid',
    month TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.optavel_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "optavel_commissions_policy" ON public.optavel_commissions FOR ALL USING (company_id = (SELECT company_id::uuid FROM profiles WHERE id = auth.uid()));

-- 5. PARTNERSHIPS & HR
CREATE TABLE IF NOT EXISTS public.optavel_cap_table (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id),
    equity_percentage NUMERIC DEFAULT 0,
    vested_percentage NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.optavel_cap_table ENABLE ROW LEVEL SECURITY;
CREATE POLICY "optavel_cap_table_policy" ON public.optavel_cap_table FOR ALL USING (company_id = (SELECT company_id::uuid FROM profiles WHERE id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.optavel_summit_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    company TEXT,
    ticket_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.optavel_summit_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "optavel_summit_registrations_policy" ON public.optavel_summit_registrations FOR ALL USING (company_id = (SELECT company_id::uuid FROM profiles WHERE id = auth.uid()));

-- ==========================================
-- STORAGE BUCKETS
-- ==========================================

-- Marketing Assets Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('optavel_marketing_assets', 'optavel_marketing_assets', true, 52428800, '{"image/*","application/pdf"}')
ON CONFLICT (id) DO NOTHING;

-- RLS for marketing assets bucket
CREATE POLICY "optavel_marketing_assets_select" ON storage.objects FOR SELECT USING (bucket_id = 'optavel_marketing_assets');
CREATE POLICY "optavel_marketing_assets_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'optavel_marketing_assets');
CREATE POLICY "optavel_marketing_assets_update" ON storage.objects FOR UPDATE USING (bucket_id = 'optavel_marketing_assets');
CREATE POLICY "optavel_marketing_assets_delete" ON storage.objects FOR DELETE USING (bucket_id = 'optavel_marketing_assets');

-- Enable realtime for new tables
DO $$
DECLARE
    tbl_name text;
BEGIN
    FOR tbl_name IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'optavel_%'
    LOOP
        BEGIN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I;', tbl_name);
        EXCEPTION WHEN duplicate_object THEN
            -- Table already in publication
        END;
    END LOOP;
END $$;

-- 5. NEW FEATURES
CREATE TABLE IF NOT EXISTS public.optavel_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo',
    priority TEXT DEFAULT 'medium',
    assignee_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.optavel_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "optavel_tasks_policy" ON public.optavel_tasks FOR ALL USING (company_id = (SELECT company_id::uuid FROM profiles WHERE id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.optavel_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL,
    category TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.optavel_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "optavel_transactions_policy" ON public.optavel_transactions FOR ALL USING (company_id = (SELECT company_id::uuid FROM profiles WHERE id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.optavel_deal_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES public.optavel_deal_rooms(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.optavel_deal_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "optavel_deal_activities_policy" ON public.optavel_deal_activities FOR ALL USING (company_id = (SELECT company_id::uuid FROM profiles WHERE id = auth.uid()));
