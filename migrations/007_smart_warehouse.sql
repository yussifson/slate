-- Smart Warehouse Tables

CREATE TABLE IF NOT EXISTS public.logistics_warehouse_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sku TEXT NOT NULL,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    location TEXT,
    barcode TEXT
);

CREATE TABLE IF NOT EXISTS public.logistics_warehouse_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    item_id UUID NOT NULL REFERENCES public.logistics_warehouse_inventory(id) ON DELETE CASCADE,
    scan_type TEXT NOT NULL, -- 'inbound', 'outbound', 'audit'
    quantity_change INTEGER NOT NULL,
    scanned_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_log_wh_inv_company ON public.logistics_warehouse_inventory(company_id);
CREATE INDEX IF NOT EXISTS idx_log_wh_inv_sku ON public.logistics_warehouse_inventory(sku);
CREATE INDEX IF NOT EXISTS idx_log_wh_scans_item ON public.logistics_warehouse_scans(item_id);
CREATE INDEX IF NOT EXISTS idx_log_wh_scans_company ON public.logistics_warehouse_scans(company_id);
