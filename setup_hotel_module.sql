-- ==========================================
-- MASTER HOTEL MODULE SCHEMA
-- ==========================================

-- 1. Create Tables
CREATE TABLE IF NOT EXISTS public.univ_hotel_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    company_id UUID NOT NULL,
    reservation_id TEXT,
    guest_name TEXT,
    guest_phone TEXT,
    guest_email TEXT,
    room_number TEXT,
    room_type TEXT,
    check_in TEXT,
    check_out TEXT,
    nights INTEGER,
    total_amount NUMERIC,
    status TEXT,
    channel_source TEXT DEFAULT 'direct',
    ota_reservation_id TEXT,
    channel_commission NUMERIC DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.univ_hotel_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    company_id UUID NOT NULL,
    room_number TEXT,
    type TEXT,
    rate NUMERIC,
    floor TEXT,
    status TEXT,
    amenities TEXT,
    ota_room_code TEXT
);

CREATE TABLE IF NOT EXISTS public.univ_hotel_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    company_id UUID NOT NULL,
    room TEXT,
    type TEXT,
    detail TEXT,
    time TEXT,
    status TEXT
);

CREATE TABLE IF NOT EXISTS public.univ_hotel_menu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    company_id UUID NOT NULL,
    name TEXT,
    category TEXT,
    price NUMERIC,
    status TEXT
);

CREATE TABLE IF NOT EXISTS public.univ_hotel_restaurant_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    company_id UUID NOT NULL,
    order_id TEXT,
    items TEXT,
    total NUMERIC,
    room_number TEXT,
    payment_method TEXT,
    status TEXT
);

CREATE TABLE IF NOT EXISTS public.univ_hotel_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    booking_hotel_id TEXT,
    expedia_hotel_id TEXT,
    airbnb_host_id TEXT,
    channex_property_id TEXT,
    mock_mode BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Enable RLS
ALTER TABLE public.univ_hotel_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.univ_hotel_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.univ_hotel_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.univ_hotel_menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.univ_hotel_restaurant_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.univ_hotel_settings ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies
DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN SELECT unnest(ARRAY[
        'univ_hotel_reservations',
        'univ_hotel_rooms',
        'univ_hotel_requests',
        'univ_hotel_menu',
        'univ_hotel_restaurant_orders',
        'univ_hotel_settings'
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
        'univ_hotel_reservations',
        'univ_hotel_rooms',
        'univ_hotel_requests',
        'univ_hotel_menu',
        'univ_hotel_restaurant_orders',
        'univ_hotel_settings'
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
