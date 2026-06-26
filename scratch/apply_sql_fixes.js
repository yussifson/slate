import pkg from 'pg';
const { Client } = pkg;

const sql = `
-- 1. Create missing retail WMS tables
CREATE TABLE IF NOT EXISTS public.univ_retail_warehouse_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    company_id UUID NOT NULL,
    name TEXT NOT NULL,
    address TEXT
);

CREATE TABLE IF NOT EXISTS public.univ_retail_warehouse_bins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    company_id UUID NOT NULL,
    warehouse_id UUID NOT NULL REFERENCES public.univ_retail_warehouse_locations(id) ON DELETE CASCADE,
    bin_label TEXT NOT NULL,
    zone TEXT
);

-- 2. Configure permissive RLS policies for retail warehouse tables
ALTER TABLE public.univ_retail_warehouse_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.univ_retail_warehouse_bins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable ALL for authenticated users" ON public.univ_retail_warehouse_locations;
CREATE POLICY "Enable ALL for authenticated users" ON public.univ_retail_warehouse_locations
FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable ALL for authenticated users" ON public.univ_retail_warehouse_bins;
CREATE POLICY "Enable ALL for authenticated users" ON public.univ_retail_warehouse_bins
FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "company_isolation_select" ON public.univ_retail_warehouse_locations;
DROP POLICY IF EXISTS "company_isolation_insert" ON public.univ_retail_warehouse_locations;
DROP POLICY IF EXISTS "company_isolation_update" ON public.univ_retail_warehouse_locations;
DROP POLICY IF EXISTS "company_isolation_delete" ON public.univ_retail_warehouse_locations;

DROP POLICY IF EXISTS "company_isolation_select" ON public.univ_retail_warehouse_bins;
DROP POLICY IF EXISTS "company_isolation_insert" ON public.univ_retail_warehouse_bins;
DROP POLICY IF EXISTS "company_isolation_update" ON public.univ_retail_warehouse_bins;
DROP POLICY IF EXISTS "company_isolation_delete" ON public.univ_retail_warehouse_bins;

-- 3. Configure permissive RLS policies for all logistics tables
ALTER TABLE public.logistics_shippers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_warehouse_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_warehouse_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_load_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_smart_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_geofence_logs ENABLE ROW LEVEL SECURITY;

-- Apply permissive policies for logistics tables to ensure syncing doesn't violate RLS
DO $$
DECLARE
    tbl TEXT;
    tables TEXT[] := ARRAY[
        'logistics_shippers',
        'logistics_shipments',
        'logistics_dispatches',
        'logistics_warehouse_inventory',
        'logistics_warehouse_scans',
        'logistics_loads',
        'logistics_load_matches',
        'logistics_routes',
        'logistics_route_stops',
        'logistics_smart_docs',
        'logistics_geofences',
        'logistics_geofence_logs'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        EXECUTE format('DROP POLICY IF EXISTS "company_isolation_select" ON public.%I;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "company_isolation_insert" ON public.%I;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "company_isolation_update" ON public.%I;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "company_isolation_delete" ON public.%I;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Enable ALL for authenticated users" ON public.%I;', tbl);
        
        EXECUTE format('
            CREATE POLICY "Enable ALL for authenticated users" ON public.%I
            FOR ALL
            TO authenticated
            USING (true)
            WITH CHECK (true);
        ', tbl, tbl);
    END LOOP;
END $$;

-- 4. Add all these tables to the PowerSync publication
DO $$
DECLARE
    tbl TEXT;
    tables TEXT[] := ARRAY[
        'univ_retail_warehouse_locations',
        'univ_retail_warehouse_bins',
        'logistics_shippers',
        'logistics_shipments',
        'logistics_dispatches',
        'logistics_warehouse_inventory',
        'logistics_warehouse_scans',
        'logistics_loads',
        'logistics_load_matches',
        'logistics_routes',
        'logistics_route_stops',
        'logistics_smart_docs',
        'logistics_geofences',
        'logistics_geofence_logs'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'powersync' AND tablename = tbl) THEN
            EXECUTE format('ALTER PUBLICATION powersync ADD TABLE public.%I;', tbl);
        END IF;
    END LOOP;
END $$;
`;

async function run() {
  const client = new Client({
    user: 'postgres',
    password: '1948@yajkUweb3.o',
    host: 'db.wmabgiafwamxkcgxyhee.supabase.co',
    port: 5432,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to Supabase DB!");
    
    console.log("Executing schema and RLS fixes...");
    await client.query(sql);
    console.log("All tables and RLS policies updated successfully!");
  } catch (err) {
    console.error("Error executing queries:", err);
  } finally {
    await client.end();
  }
}

run();
