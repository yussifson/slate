-- Advanced Logistics Schema Extensions
-- Run this migration in your Supabase project

-- 1. ROUTE OPTIMIZATION & AUTO-ASSIGNMENT
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
  route_status VARCHAR(50) DEFAULT 'planned', -- planned, in-progress, completed, cancelled
  priority INTEGER DEFAULT 5, -- 1-10, higher = more urgent
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

CREATE INDEX idx_routes_company ON routes(company_id);
CREATE INDEX idx_routes_vehicle ON routes(vehicle_id);
CREATE INDEX idx_routes_driver ON routes(driver_id);
CREATE INDEX idx_routes_status ON routes(route_status);

-- 2. REAL-TIME GPS TRACKING
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
  heading INTEGER, -- 0-360 degrees
  accuracy_meters DECIMAL(10, 2),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  source VARCHAR(50) DEFAULT 'mobile', -- mobile, gps-device, api
  battery_level INTEGER -- for mobile devices
);

CREATE INDEX idx_gps_shipment ON gps_tracking(shipment_id, timestamp DESC);
CREATE INDEX idx_gps_vehicle ON gps_tracking(vehicle_id, timestamp DESC);
CREATE INDEX idx_gps_driver ON gps_tracking(driver_id, timestamp DESC);
CREATE INDEX idx_gps_timestamp ON gps_tracking(timestamp DESC);

-- 3. PROOF OF DELIVERY (POD)
CREATE TABLE IF NOT EXISTS pod_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  shipment_id UUID NOT NULL,
  driver_id UUID NOT NULL,
  recipient_name VARCHAR(255),
  recipient_phone VARCHAR(20),
  recipient_email VARCHAR(255),
  signature_url VARCHAR(500),
  pod_photos UUID[] DEFAULT '{}', -- array of blob storage IDs
  pod_video_url VARCHAR(500),
  delivery_notes TEXT,
  temperature_celsius DECIMAL(5, 2), -- for cold chain
  humidity_percent DECIMAL(5, 2),
  condition_notes VARCHAR(500),
  is_damaged BOOLEAN DEFAULT FALSE,
  damage_description TEXT,
  pod_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

CREATE INDEX idx_pod_shipment ON pod_records(shipment_id);
CREATE INDEX idx_pod_driver ON pod_records(driver_id);
CREATE INDEX idx_pod_company ON pod_records(company_id);

-- 4. DELIVERY WINDOWS & SLA
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

CREATE INDEX idx_delivery_windows_shipment ON delivery_windows(shipment_id);
CREATE INDEX idx_delivery_windows_company ON delivery_windows(company_id);

CREATE TABLE IF NOT EXISTS sla_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  shipment_id UUID NOT NULL,
  sla_type VARCHAR(50), -- delivery_time, delivery_window, temperature_range
  sla_target JSONB, -- flexible structure for different SLA types
  expected_completion TIMESTAMP,
  actual_completion TIMESTAMP,
  is_breached BOOLEAN DEFAULT FALSE,
  breach_reason VARCHAR(255),
  penalty_amount DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sla_shipment ON sla_tracking(shipment_id);
CREATE INDEX idx_sla_breached ON sla_tracking(is_breached);
CREATE INDEX idx_sla_company ON sla_tracking(company_id);

-- 5. INVENTORY SYNC
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  warehouse_id UUID,
  shipment_id UUID,
  movement_type VARCHAR(50), -- inbound, outbound, adjustment, return
  sku VARCHAR(100),
  quantity_change INTEGER,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  recorded_by UUID,
  notes TEXT,
  metadata JSONB
);

CREATE INDEX idx_inventory_warehouse ON inventory_movements(warehouse_id);
CREATE INDEX idx_inventory_shipment ON inventory_movements(shipment_id);
CREATE INDEX idx_inventory_company ON inventory_movements(company_id);

-- 6. DAMAGE REPORTS & INCIDENT TRACKING
CREATE TABLE IF NOT EXISTS incident_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  shipment_id UUID,
  vehicle_id UUID,
  driver_id UUID,
  incident_type VARCHAR(50), -- damage, accident, weather, theft, other
  severity VARCHAR(20), -- critical, high, medium, low
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
  status VARCHAR(50) DEFAULT 'open', -- open, under_review, resolved, closed
  metadata JSONB
);

CREATE INDEX idx_incident_shipment ON incident_reports(shipment_id);
CREATE INDEX idx_incident_vehicle ON incident_reports(vehicle_id);
CREATE INDEX idx_incident_company ON incident_reports(company_id);

-- 7. RETURN MANAGEMENT & REVERSE LOGISTICS
CREATE TABLE IF NOT EXISTS return_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  original_shipment_id UUID,
  return_reason VARCHAR(255) NOT NULL,
  return_status VARCHAR(50) DEFAULT 'requested', -- requested, approved, rejected, in_transit, received, processed
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

CREATE INDEX idx_returns_company ON return_orders(company_id);
CREATE INDEX idx_returns_original_shipment ON return_orders(original_shipment_id);
CREATE INDEX idx_returns_status ON return_orders(return_status);

CREATE TABLE IF NOT EXISTS return_shipments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  return_order_id UUID NOT NULL REFERENCES return_orders(id),
  return_route_id UUID REFERENCES routes(id),
  vehicle_id UUID,
  driver_id UUID,
  shipment_status VARCHAR(50) DEFAULT 'pending', -- pending, picked_up, in_transit, delivered
  pickup_timestamp TIMESTAMP,
  delivery_timestamp TIMESTAMP,
  pod_record_id UUID REFERENCES pod_records(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_return_shipments_order ON return_shipments(return_order_id);

-- 8. PERFORMANCE METRICS & ANALYTICS
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
  customer_rating DECIMAL(3, 2), -- 1.0-5.0
  efficiency_score DECIMAL(5, 2), -- 0-100
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_driver_metrics_driver ON driver_metrics(driver_id, metric_date DESC);
CREATE INDEX idx_driver_metrics_company ON driver_metrics(company_id, metric_date DESC);

CREATE TABLE IF NOT EXISTS fleet_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  vehicle_id UUID NOT NULL,
  metric_date DATE,
  total_trips INTEGER DEFAULT 0,
  total_distance_km DECIMAL(10, 2),
  total_fuel_consumed DECIMAL(10, 2),
  maintenance_hours DECIMAL(10, 2),
  operational_efficiency DECIMAL(5, 2), -- 0-100
  utilization_rate DECIMAL(5, 2), -- 0-100
  vehicle_condition_score DECIMAL(5, 2), -- 0-100
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fleet_metrics_vehicle ON fleet_metrics(vehicle_id, metric_date DESC);
CREATE INDEX idx_fleet_metrics_company ON fleet_metrics(company_id, metric_date DESC);

-- TRIGGERS for auto-updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_routes_timestamp BEFORE UPDATE ON routes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sla_tracking_timestamp BEFORE UPDATE ON sla_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_return_orders_timestamp BEFORE UPDATE ON return_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
