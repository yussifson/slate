-- ==========================================
-- HOTEL AI SCHEMA ADDITIONS
-- ==========================================

-- 1. Create Tables
CREATE TABLE IF NOT EXISTS public.univ_hotel_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    company_id UUID NOT NULL,
    reservation_id TEXT,
    guest_name TEXT,
    rating INTEGER,
    comment TEXT,
    sentiment TEXT,
    themes TEXT,
    status TEXT DEFAULT 'Unread'
);

CREATE TABLE IF NOT EXISTS public.univ_hotel_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    company_id UUID NOT NULL,
    item_name TEXT,
    category TEXT,
    quantity INTEGER,
    unit TEXT,
    expiry_date TIMESTAMP WITH TIME ZONE,
    status TEXT,
    supplier TEXT
);

-- 2. Enable RLS
ALTER TABLE public.univ_hotel_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.univ_hotel_inventory ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies
DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN SELECT unnest(ARRAY[
        'univ_hotel_feedback',
        'univ_hotel_inventory'
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
        'univ_hotel_feedback',
        'univ_hotel_inventory'
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
