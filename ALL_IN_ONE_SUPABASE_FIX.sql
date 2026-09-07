-- ============================================================================
-- SLATE ENTERPRISE & JCL REAL ESTATE - COMPLETE DATABASE SCHEMA SETUP
-- Paste and Run this entire script in Supabase Dashboard -> SQL Editor -> Run
-- ============================================================================

-- 1. REAL ESTATE LEADS & CRM TABLES
CREATE TABLE IF NOT EXISTS public.univ_re_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    source TEXT DEFAULT 'website',
    property_interest TEXT,
    budget_min NUMERIC DEFAULT 0,
    budget_max NUMERIC DEFAULT 0,
    lead_type TEXT DEFAULT 'buyer',
    status TEXT DEFAULT 'new',
    stage TEXT DEFAULT 'awareness',
    assigned_agent_id TEXT,
    lead_score INTEGER DEFAULT 0,
    next_followup TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'website';
ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS property_interest TEXT;
ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS budget_min NUMERIC DEFAULT 0;
ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS budget_max NUMERIC DEFAULT 0;
ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS lead_type TEXT DEFAULT 'buyer';
ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new';
ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'awareness';
ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS assigned_agent_id TEXT;
ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0;
ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS next_followup TIMESTAMPTZ;
ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.univ_re_leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 2. CRM LEAD ACTIVITIES
CREATE TABLE IF NOT EXISTS public.univ_re_lead_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    lead_id UUID,
    activity_type TEXT DEFAULT 'call',
    subject TEXT,
    description TEXT,
    notes TEXT,
    duration_minutes INTEGER DEFAULT 0,
    outcome TEXT,
    next_action TEXT,
    agent_id TEXT,
    logged_by TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.univ_re_lead_activities ADD COLUMN IF NOT EXISTS lead_id UUID;
ALTER TABLE public.univ_re_lead_activities ADD COLUMN IF NOT EXISTS activity_type TEXT DEFAULT 'call';
ALTER TABLE public.univ_re_lead_activities ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE public.univ_re_lead_activities ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.univ_re_lead_activities ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.univ_re_lead_activities ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 0;
ALTER TABLE public.univ_re_lead_activities ADD COLUMN IF NOT EXISTS outcome TEXT;
ALTER TABLE public.univ_re_lead_activities ADD COLUMN IF NOT EXISTS next_action TEXT;
ALTER TABLE public.univ_re_lead_activities ADD COLUMN IF NOT EXISTS agent_id TEXT;
ALTER TABLE public.univ_re_lead_activities ADD COLUMN IF NOT EXISTS logged_by TEXT;
ALTER TABLE public.univ_re_lead_activities ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.univ_re_lead_activities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 3. CLIENTS
CREATE TABLE IF NOT EXISTS public.univ_re_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    type TEXT DEFAULT 'buyer',
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'Ghana',
    budget NUMERIC DEFAULT 0,
    preferences TEXT,
    status TEXT DEFAULT 'active',
    assigned_agent TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.univ_re_clients ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.univ_re_clients ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.univ_re_clients ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.univ_re_clients ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'buyer';
ALTER TABLE public.univ_re_clients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.univ_re_clients ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.univ_re_clients ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.univ_re_clients ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Ghana';
ALTER TABLE public.univ_re_clients ADD COLUMN IF NOT EXISTS budget NUMERIC DEFAULT 0;
ALTER TABLE public.univ_re_clients ADD COLUMN IF NOT EXISTS preferences TEXT;
ALTER TABLE public.univ_re_clients ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.univ_re_clients ADD COLUMN IF NOT EXISTS assigned_agent TEXT;
ALTER TABLE public.univ_re_clients ADD COLUMN IF NOT EXISTS notes TEXT;

-- 4. UNIVERSAL LAND MANAGEMENT TABLES
CREATE TABLE IF NOT EXISTS public.univ_land_parcels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    company_id UUID NOT NULL,
    parcel_name TEXT NOT NULL,
    plot_number TEXT,
    cadastral_ref TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'Ghana',
    zip_code TEXT,
    lot_size_acres NUMERIC DEFAULT 0,
    square_feet NUMERIC DEFAULT 0,
    zoning TEXT DEFAULT 'residential',
    topography TEXT DEFAULT 'flat',
    title_type TEXT DEFAULT 'C_of_O',
    price NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'available',
    description TEXT,
    agent_name TEXT,
    documents JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS public.univ_land_ownership (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    company_id UUID NOT NULL,
    parcel_id UUID REFERENCES public.univ_land_parcels(id) ON DELETE CASCADE,
    owner_name TEXT NOT NULL,
    percentage NUMERIC DEFAULT 100,
    interest_type TEXT DEFAULT 'Freehold',
    deed_ref TEXT,
    phone TEXT,
    email TEXT,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS public.univ_land_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    company_id UUID NOT NULL,
    parcel_id UUID REFERENCES public.univ_land_parcels(id) ON DELETE CASCADE,
    client_id UUID,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    allocation_date DATE DEFAULT CURRENT_DATE,
    expiry_date DATE,
    deposit_amount NUMERIC DEFAULT 0,
    total_agreed_price NUMERIC DEFAULT 0,
    payment_terms TEXT DEFAULT 'outright',
    allocation_status TEXT DEFAULT 'active_reserved',
    notes TEXT
);

CREATE TABLE IF NOT EXISTS public.univ_land_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    company_id UUID NOT NULL,
    parcel_id UUID REFERENCES public.univ_land_parcels(id) ON DELETE CASCADE,
    survey_number TEXT NOT NULL,
    surveyor_name TEXT,
    survey_date DATE,
    boundary_coordinates JSONB DEFAULT '[]'::jsonb,
    plan_url TEXT,
    status TEXT DEFAULT 'approved',
    notes TEXT
);

-- 5. ENABLE ROW LEVEL SECURITY & OPEN POLICIES
ALTER TABLE public.univ_re_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.univ_re_lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.univ_re_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.univ_land_parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.univ_land_ownership ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.univ_land_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.univ_land_surveys ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow authenticated full access to univ_re_leads" ON public.univ_re_leads;
    CREATE POLICY "Allow authenticated full access to univ_re_leads" ON public.univ_re_leads FOR ALL TO authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow authenticated full access to univ_re_lead_activities" ON public.univ_re_lead_activities;
    CREATE POLICY "Allow authenticated full access to univ_re_lead_activities" ON public.univ_re_lead_activities FOR ALL TO authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow authenticated full access to univ_re_clients" ON public.univ_re_clients;
    CREATE POLICY "Allow authenticated full access to univ_re_clients" ON public.univ_re_clients FOR ALL TO authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow authenticated full access to univ_land_parcels" ON public.univ_land_parcels;
    CREATE POLICY "Allow authenticated full access to univ_land_parcels" ON public.univ_land_parcels FOR ALL TO authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow authenticated full access to univ_land_ownership" ON public.univ_land_ownership;
    CREATE POLICY "Allow authenticated full access to univ_land_ownership" ON public.univ_land_ownership FOR ALL TO authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow authenticated full access to univ_land_allocations" ON public.univ_land_allocations;
    CREATE POLICY "Allow authenticated full access to univ_land_allocations" ON public.univ_land_allocations FOR ALL TO authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow authenticated full access to univ_land_surveys" ON public.univ_land_surveys;
    CREATE POLICY "Allow authenticated full access to univ_land_surveys" ON public.univ_land_surveys FOR ALL TO authenticated USING (true) WITH CHECK (true);
END $$;

GRANT ALL ON public.univ_re_leads TO authenticated, service_role, anon;
GRANT ALL ON public.univ_re_lead_activities TO authenticated, service_role, anon;
GRANT ALL ON public.univ_re_clients TO authenticated, service_role, anon;
GRANT ALL ON public.univ_land_parcels TO authenticated, service_role, anon;
GRANT ALL ON public.univ_land_ownership TO authenticated, service_role, anon;
GRANT ALL ON public.univ_land_allocations TO authenticated, service_role, anon;
GRANT ALL ON public.univ_land_surveys TO authenticated, service_role, anon;

-- 6. JCL ROYAL GROUP LAND DATA MIGRATION (Copy-Only, Strictly Scoped by company_id)
DO $$
DECLARE
    r RECORD;
    jcl_company_id UUID;
    features_json JSONB;
    owner_item JSONB;
    alloc_item JSONB;
BEGIN
    FOR jcl_company_id IN 
        SELECT id FROM public.companies 
        WHERE industry_type = 'real_estate_jcl' 
           OR name ILIKE '%JCL%' 
           OR custom_domain ILIKE '%jcl%'
    LOOP
        FOR r IN 
            SELECT * FROM public.univ_re_properties 
            WHERE company_id::text = jcl_company_id::text 
              AND property_type IN ('land', 'parcel')
        LOOP
            BEGIN
                features_json := r.features::jsonb;
            EXCEPTION WHEN OTHERS THEN
                features_json := '{}'::jsonb;
            END;

            INSERT INTO public.univ_land_parcels (
                id,
                created_at,
                updated_at,
                company_id,
                parcel_name,
                plot_number,
                cadastral_ref,
                address,
                city,
                state,
                country,
                zip_code,
                lot_size_acres,
                square_feet,
                zoning,
                topography,
                title_type,
                price,
                status,
                description,
                agent_name,
                documents
            ) VALUES (
                r.id,
                r.created_at,
                r.created_at,
                r.company_id::uuid,
                COALESCE(features_json->>'parcelName', r.address, 'Land Parcel'),
                COALESCE(features_json->>'plotNumber', ''),
                COALESCE(features_json->>'cadastralRef', ''),
                r.address,
                r.city,
                r.state,
                COALESCE(r.country, 'Ghana'),
                r.zip_code,
                COALESCE(NULLIF(features_json->>'lotSizeAcres', '')::numeric, r.lot_size, 0),
                COALESCE(r.square_feet, 0),
                COALESCE(features_json->>'zoning', 'residential'),
                COALESCE(features_json->>'topography', 'flat'),
                COALESCE(features_json->>'titleType', 'C_of_O'),
                COALESCE(r.price, 0),
                COALESCE(r.status, 'available'),
                r.description,
                r.agent_name,
                COALESCE(features_json->'documents', '[]'::jsonb)
            )
            ON CONFLICT (id) DO NOTHING;

            IF features_json ? 'ownershipInterests' AND jsonb_typeof(features_json->'ownershipInterests') = 'array' THEN
                FOR owner_item IN SELECT * FROM jsonb_array_elements(features_json->'ownershipInterests')
                LOOP
                    INSERT INTO public.univ_land_ownership (
                        company_id,
                        parcel_id,
                        owner_name,
                        percentage,
                        interest_type,
                        deed_ref,
                        phone,
                        email
                    ) VALUES (
                        r.company_id::uuid,
                        r.id,
                        COALESCE(owner_item->>'ownerName', 'Owner'),
                        COALESCE(NULLIF(owner_item->>'percentage', '')::numeric, 100),
                        COALESCE(owner_item->>'interestType', 'Freehold'),
                        owner_item->>'deedRef',
                        owner_item->>'phone',
                        owner_item->>'email'
                    );
                END LOOP;
            END IF;

            IF features_json ? 'allocation' AND jsonb_typeof(features_json->'allocation') = 'object' AND features_json->'allocation' != 'null'::jsonb THEN
                alloc_item := features_json->'allocation';
                INSERT INTO public.univ_land_allocations (
                    company_id,
                    parcel_id,
                    customer_name,
                    customer_email,
                    customer_phone,
                    allocation_date,
                    expiry_date,
                    deposit_amount,
                    total_agreed_price,
                    payment_terms,
                    allocation_status,
                    notes
                ) VALUES (
                    r.company_id::uuid,
                    r.id,
                    COALESCE(alloc_item->>'customerName', 'Client Allocation'),
                    alloc_item->>'customerEmail',
                    alloc_item->>'customerPhone',
                    COALESCE(NULLIF(alloc_item->>'allocationDate', '')::date, CURRENT_DATE),
                    NULLIF(alloc_item->>'expiryDate', '')::date,
                    COALESCE(NULLIF(alloc_item->>'depositAmount', '')::numeric, 0),
                    COALESCE(NULLIF(alloc_item->>'totalAgreedPrice', '')::numeric, r.price, 0),
                    COALESCE(alloc_item->>'paymentTerms', 'outright'),
                    COALESCE(alloc_item->>'allocationStatus', 'active_reserved'),
                    alloc_item->>'notes'
                );
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- 7. REFRESH SUPABASE SCHEMA CACHE
NOTIFY pgrst, 'reload schema';

-- 8. VERIFICATION QUERIES
SELECT 'univ_land_parcels' AS table_name, COUNT(*) AS total_rows FROM public.univ_land_parcels
UNION ALL
SELECT 'univ_land_ownership' AS table_name, COUNT(*) AS total_rows FROM public.univ_land_ownership
UNION ALL
SELECT 'univ_land_allocations' AS table_name, COUNT(*) AS total_rows FROM public.univ_land_allocations
UNION ALL
SELECT 'univ_re_leads' AS table_name, COUNT(*) AS total_rows FROM public.univ_re_leads;

