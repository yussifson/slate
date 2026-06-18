-- Freight Matching / Load Board Tables

CREATE TABLE IF NOT EXISTS public.logistics_loads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    weight_lbs REAL,
    equipment_required TEXT,
    price REAL,
    status TEXT DEFAULT 'open'
);

CREATE TABLE IF NOT EXISTS public.logistics_load_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    load_id UUID NOT NULL REFERENCES public.logistics_loads(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL,
    company_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    match_score INTEGER,
    reasoning TEXT,
    status TEXT DEFAULT 'proposed'
);

CREATE INDEX IF NOT EXISTS idx_logistics_loads_company_id ON public.logistics_loads(company_id);
CREATE INDEX IF NOT EXISTS idx_logistics_load_matches_load_id ON public.logistics_load_matches(load_id);
CREATE INDEX IF NOT EXISTS idx_logistics_load_matches_company_id ON public.logistics_load_matches(company_id);
