-- AI Route Optimization Tables

CREATE TABLE IF NOT EXISTS public.logistics_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    status TEXT DEFAULT 'draft'
);

CREATE TABLE IF NOT EXISTS public.logistics_route_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID NOT NULL REFERENCES public.logistics_routes(id) ON DELETE CASCADE,
    company_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    address TEXT NOT NULL,
    lat REAL,
    lng REAL,
    sequence_number INTEGER,
    status TEXT DEFAULT 'pending'
);

CREATE INDEX IF NOT EXISTS idx_logistics_routes_company_id ON public.logistics_routes(company_id);
CREATE INDEX IF NOT EXISTS idx_logistics_route_stops_route_id ON public.logistics_route_stops(route_id);
CREATE INDEX IF NOT EXISTS idx_logistics_route_stops_company_id ON public.logistics_route_stops(company_id);
