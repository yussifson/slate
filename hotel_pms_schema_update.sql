-- ==========================================
-- HOTEL PMS SCHEMA ADDITIONS
-- ==========================================

-- 1. Create Tables
CREATE TABLE IF NOT EXISTS public.univ_hotel_maintenance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    company_id UUID NOT NULL,
    room_number TEXT,
    issue_type TEXT,
    description TEXT,
    status TEXT DEFAULT 'Pending',
    priority TEXT DEFAULT 'Medium',
    reported_by TEXT,
    assigned_to TEXT
);

CREATE TABLE IF NOT EXISTS public.univ_hotel_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    company_id UUID NOT NULL,
    event_name TEXT,
    hall_name TEXT,
    event_date TIMESTAMP WITH TIME ZONE,
    attendees INTEGER,
    total_price NUMERIC,
    status TEXT DEFAULT 'Draft',
    client_name TEXT
);

CREATE TABLE IF NOT EXISTS public.univ_hotel_lost_found (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    company_id UUID NOT NULL,
    item_name TEXT,
    description TEXT,
    location_found TEXT,
    date_found TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'Unclaimed',
    claimant_name TEXT
);

-- 2. Enable RLS
ALTER TABLE public.univ_hotel_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.univ_hotel_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.univ_hotel_lost_found ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies
DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN SELECT unnest(ARRAY[
        'univ_hotel_maintenance',
        'univ_hotel_events',
        'univ_hotel_lost_found'
    ])
    LOOP
        EXECUTE format('
            DROP POLICY IF EXISTS "Enable ALL for users based on company_id" ON public.%I;
            CREATE POLICY "Enable ALL for users based on company_id" ON public.%I FOR ALL USING (
                auth.uid() IN (
                    SELECT id::uuid FROM public.profiles WHERE company_id::text = %I.company_id::text
                )
            );
        ', table_name, table_name, table_name);
    END LOOP;
END $$;

-- 4. Add to PowerSync Publication
DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN SELECT unnest(ARRAY[
        'univ_hotel_maintenance',
        'univ_hotel_events',
        'univ_hotel_lost_found'
    ])
    LOOP
        IF NOT EXISTS (
            SELECT 1
            FROM pg_publication_tables
            WHERE pubname = 'powersync' AND tablename = table_name
        ) THEN
            EXECUTE format('ALTER PUBLICATION powersync ADD TABLE public.%I', table_name);
        END IF;
    END LOOP;
END $$;
