-- COMPLETE SQL REFERENCE - ADVANCED LOGISTICS SYSTEM
-- Production-Ready SQL for Supabase
-- Copy and paste this entire file into Supabase SQL Editor

-- ============================================================
-- PART 1: CREATE ALL TABLES (11 NEW TABLES)
-- ============================================================

-- TABLE 1: Routes (Route Optimization)
CREATE TABLE IF NOT EXISTS routes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  shipment_ids UUID[] DEFAULT '{}',
  vehicle_id UUID,
  driver_id UUID,
  route_name VARCHAR(255),
  origin_location JSONB,
  destination_location JSONB,
  waypoints JSONB[] DEFAULT '{}',
  optimized_distance DECIMAL,
  estimated_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  route_status VARCHAR(50) DEFAULT 'planned',
  priority INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_routes_company ON routes(company_id);
CREATE INDEX IF NOT EXISTS idx_routes_vehicle ON routes(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_routes_driver ON routes(driver_id);
CREATE INDEX IF NOT EXISTS idx_routes_status ON routes(route_status);

-- TABLE 2: GPS Tracking (Real-time Location)
CREATE TABLE IF NOT EXISTS gps_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  shipment_id UUID,
  vehicle_id UUID,
  driver_id UUID,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  altitude DECIMAL(10, 2),
  speed_kmh DECIMAL(10, 2),
  heading INTEGER,
  accuracy_meters DECIMAL(10, 2),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  source VARCHAR(50) DEFAULT 'mobile',
  battery_level INTEGER
);

CREATE INDEX IF NOT EXISTS idx_gps_shipment ON gps_tracking(shipment_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_gps_vehicle ON gps_tracking(vehicle_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_gps_driver ON gps_tracking(driver_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_gps_timestamp ON gps_tracking(timestamp DESC);

-- TABLE 3: POD Records (Proof of Delivery)
CREATE TABLE IF NOT EXISTS pod_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  shipment_id UUID NOT NULL,
  driver_id UUID NOT NULL,
  recipient_name VARCHAR(255),
  recipient_phone VARCHAR(20),
  recipient_email VARCHAR(255),
  signature_url VARCHAR(500),
  pod_photos UUID[] DEFAULT '{}',
  pod_video_url VARCHAR(500),
  delivery_notes TEXT,
  temperature_celsius DECIMAL(5, 2),
  humidity_percent DECIMAL(5, 2),
  condition_notes VARCHAR(500),
  is_damaged BOOLEAN DEFAULT FALSE,
  damage_description TEXT,
  pod_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_pod_shipment ON pod_records(shipment_id);
CREATE INDEX IF NOT EXISTS idx_pod_driver ON pod_records(driver_id);
CREATE INDEX IF NOT EXISTS idx_pod_company ON pod_records(company_id);

-- TABLE 4: Delivery Windows (Time Window Preferences)
CREATE TABLE IF NOT EXISTS delivery_windows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  shipment_id UUID NOT NULL,
  preferred_date DATE,
  time_window_start TIME,
  time_window_end TIME,
  customer_timezone VARCHAR(50),
  is_flexible BOOLEAN DEFAULT FALSE,
  penalty_per_hour DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_delivery_windows_shipment ON delivery_windows(shipment_id);
CREATE INDEX IF NOT EXISTS idx_delivery_windows_company ON delivery_windows(company_id);

-- TABLE 5: SLA Tracking (Service Level Agreements)
CREATE TABLE IF NOT EXISTS sla_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  shipment_id UUID NOT NULL,
  sla_type VARCHAR(50),
  sla_target JSONB,
  expected_completion TIMESTAMP,
  actual_completion TIMESTAMP,
  is_breached BOOLEAN DEFAULT FALSE,
  breach_reason VARCHAR(255),
  penalty_amount DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sla_shipment ON sla_tracking(shipment_id);
CREATE INDEX IF NOT EXISTS idx_sla_breached ON sla_tracking(is_breached);
CREATE INDEX IF NOT EXISTS idx_sla_company ON sla_tracking(company_id);

-- TABLE 6: Inventory Movements (Warehouse Sync)
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  warehouse_id UUID,
  shipment_id UUID,
  movement_type VARCHAR(50),
  sku VARCHAR(100),
  quantity_change INTEGER,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  recorded_by UUID,
  notes TEXT,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_inventory_warehouse ON inventory_movements(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_shipment ON inventory_movements(shipment_id);
CREATE INDEX IF NOT EXISTS idx_inventory_company ON inventory_movements(company_id);

-- TABLE 7: Incident Reports (Damage & Accidents)
CREATE TABLE IF NOT EXISTS incident_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  shipment_id UUID,
  vehicle_id UUID,
  driver_id UUID,
  incident_type VARCHAR(50),
  severity VARCHAR(20),
  description TEXT NOT NULL,
  incident_location JSONB,
  incident_timestamp TIMESTAMP NOT NULL,
  reported_by UUID,
  reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolution_notes TEXT,
  resolved_at TIMESTAMP,
  evidence_photos UUID[] DEFAULT '{}',
  evidence_video_url VARCHAR(500),
  insurance_claim_id VARCHAR(100),
  status VARCHAR(50) DEFAULT 'open',
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_incident_shipment ON incident_reports(shipment_id);
CREATE INDEX IF NOT EXISTS idx_incident_vehicle ON incident_reports(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_incident_company ON incident_reports(company_id);

-- TABLE 8: Return Orders (Reverse Logistics)
CREATE TABLE IF NOT EXISTS return_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  original_shipment_id UUID,
  return_reason VARCHAR(255) NOT NULL,
  return_status VARCHAR(50) DEFAULT 'requested',
  customer_id UUID,
  return_location JSONB,
  original_delivery_address JSONB,
  pickup_scheduled_date DATE,
  estimated_return_date DATE,
  actual_return_date DATE,
  refund_amount DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_returns_company ON return_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_returns_original_shipment ON return_orders(original_shipment_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON return_orders(return_status);

-- TABLE 9: Return Shipments (Return Tracking)
CREATE TABLE IF NOT EXISTS return_shipments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  return_order_id UUID NOT NULL REFERENCES return_orders(id),
  return_route_id UUID REFERENCES routes(id),
  vehicle_id UUID,
  driver_id UUID,
  shipment_status VARCHAR(50) DEFAULT 'pending',
  pickup_timestamp TIMESTAMP,
  delivery_timestamp TIMESTAMP,
  pod_record_id UUID REFERENCES pod_records(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_return_shipments_order ON return_shipments(return_order_id);

-- TABLE 10: Driver Metrics (Driver Performance)
CREATE TABLE IF NOT EXISTS driver_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  driver_id UUID NOT NULL,
  metric_date DATE,
  total_deliveries INTEGER DEFAULT 0,
  successful_deliveries INTEGER DEFAULT 0,
  failed_deliveries INTEGER DEFAULT 0,
  on_time_deliveries INTEGER DEFAULT 0,
  sla_breaches INTEGER DEFAULT 0,
  avg_delivery_time_minutes DECIMAL(10, 2),
  total_distance_km DECIMAL(10, 2),
  fuel_efficiency_km_per_liter DECIMAL(10, 2),
  safety_incidents INTEGER DEFAULT 0,
  customer_rating DECIMAL(3, 2),
  efficiency_score DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_driver_metrics_driver ON driver_metrics(driver_id, metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_driver_metrics_company ON driver_metrics(company_id, metric_date DESC);

-- TABLE 11: Fleet Metrics (Vehicle Performance)
CREATE TABLE IF NOT EXISTS fleet_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  vehicle_id UUID NOT NULL,
  metric_date DATE,
  total_trips INTEGER DEFAULT 0,
  total_distance_km DECIMAL(10, 2),
  total_fuel_consumed DECIMAL(10, 2),
  maintenance_hours DECIMAL(10, 2),
  operational_efficiency DECIMAL(5, 2),
  utilization_rate DECIMAL(5, 2),
  vehicle_condition_score DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fleet_metrics_vehicle ON fleet_metrics(vehicle_id, metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_fleet_metrics_company ON fleet_metrics(company_id, metric_date DESC);

-- ============================================================
-- PART 2: CREATE UPDATE TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_routes_timestamp ON routes;
CREATE TRIGGER update_routes_timestamp BEFORE UPDATE ON routes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sla_tracking_timestamp ON sla_tracking;
CREATE TRIGGER update_sla_tracking_timestamp BEFORE UPDATE ON sla_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_return_orders_timestamp ON return_orders;
CREATE TRIGGER update_return_orders_timestamp BEFORE UPDATE ON return_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- PART 3: ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE pod_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_metrics ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PART 4: CREATE ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Routes Policy
DROP POLICY IF EXISTS routes_company_access ON routes;
CREATE POLICY routes_company_access ON routes
  FOR ALL USING (company_id = auth.uid());

-- GPS Tracking Policy
DROP POLICY IF EXISTS gps_tracking_company_access ON gps_tracking;
CREATE POLICY gps_tracking_company_access ON gps_tracking
  FOR ALL USING (company_id = auth.uid());

-- POD Records Policy
DROP POLICY IF EXISTS pod_records_company_access ON pod_records;
CREATE POLICY pod_records_company_access ON pod_records
  FOR ALL USING (company_id = auth.uid());

-- Delivery Windows Policy
DROP POLICY IF EXISTS delivery_windows_company_access ON delivery_windows;
CREATE POLICY delivery_windows_company_access ON delivery_windows
  FOR ALL USING (company_id = auth.uid());

-- SLA Tracking Policy
DROP POLICY IF EXISTS sla_tracking_company_access ON sla_tracking;
CREATE POLICY sla_tracking_company_access ON sla_tracking
  FOR ALL USING (company_id = auth.uid());

-- Inventory Movements Policy
DROP POLICY IF EXISTS inventory_movements_company_access ON inventory_movements;
CREATE POLICY inventory_movements_company_access ON inventory_movements
  FOR ALL USING (company_id = auth.uid());

-- Incident Reports Policy
DROP POLICY IF EXISTS incident_reports_company_access ON incident_reports;
CREATE POLICY incident_reports_company_access ON incident_reports
  FOR ALL USING (company_id = auth.uid());

-- Return Orders Policy
DROP POLICY IF EXISTS return_orders_company_access ON return_orders;
CREATE POLICY return_orders_company_access ON return_orders
  FOR ALL USING (company_id = auth.uid());

-- Return Shipments Policy
DROP POLICY IF EXISTS return_shipments_company_access ON return_shipments;
CREATE POLICY return_shipments_company_access ON return_shipments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM return_orders WHERE id = return_order_id AND company_id = auth.uid())
  );

-- Driver Metrics Policy
DROP POLICY IF EXISTS driver_metrics_company_access ON driver_metrics;
CREATE POLICY driver_metrics_company_access ON driver_metrics
  FOR ALL USING (company_id = auth.uid());

-- Fleet Metrics Policy
DROP POLICY IF EXISTS fleet_metrics_company_access ON fleet_metrics;
CREATE POLICY fleet_metrics_company_access ON fleet_metrics
  FOR ALL USING (company_id = auth.uid());

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Verify all tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'routes', 'gps_tracking', 'pod_records', 'delivery_windows', 'sla_tracking',
  'inventory_movements', 'incident_reports', 'return_orders', 'return_shipments',
  'driver_metrics', 'fleet_metrics'
)
ORDER BY table_name;

-- Verify all indexes created
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN (
  'routes', 'gps_tracking', 'pod_records', 'delivery_windows', 'sla_tracking',
  'inventory_movements', 'incident_reports', 'return_orders', 'return_shipments',
  'driver_metrics', 'fleet_metrics'
)
ORDER BY indexname;

-- Verify RLS enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'routes', 'gps_tracking', 'pod_records', 'delivery_windows', 'sla_tracking',
  'inventory_movements', 'incident_reports', 'return_orders', 'return_shipments',
  'driver_metrics', 'fleet_metrics'
)
ORDER BY tablename;

-- ============================================================
-- END OF SQL SCRIPT
-- ============================================================
