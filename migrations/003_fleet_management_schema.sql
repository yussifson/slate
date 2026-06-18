-- Fleet Management Comprehensive Schema
-- Tables for vehicle registration, insurance, maintenance, breakdowns, tire management, fuel, spare parts, utilization, downtime, and inspections

-- Vehicle Registration & Licensing
CREATE TABLE IF NOT EXISTS vehicle_registrations (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  vehicle_id UUID NOT NULL,
  registration_number VARCHAR(100) NOT NULL UNIQUE,
  registration_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  issuing_authority VARCHAR(255),
  registration_status VARCHAR(50) DEFAULT 'active',
  tax_paid BOOLEAN DEFAULT FALSE,
  tax_expiry_date DATE,
  permit_number VARCHAR(100),
  permit_type VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle Insurance Records
CREATE TABLE IF NOT EXISTS vehicle_insurance (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  vehicle_id UUID NOT NULL,
  provider_name VARCHAR(255) NOT NULL,
  policy_number VARCHAR(100) NOT NULL UNIQUE,
  policy_start_date DATE NOT NULL,
  policy_expiry_date DATE NOT NULL,
  coverage_type VARCHAR(100),
  coverage_amount DECIMAL(12, 2),
  premium_amount DECIMAL(12, 2),
  last_payment_date DATE,
  insurance_status VARCHAR(50) DEFAULT 'active',
  claim_history TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle Licensing Records
CREATE TABLE IF NOT EXISTS vehicle_licenses (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  vehicle_id UUID NOT NULL,
  license_type VARCHAR(100),
  license_issue_date DATE NOT NULL,
  license_expiry_date DATE NOT NULL,
  issuing_country VARCHAR(100),
  vehicle_class VARCHAR(100),
  weight_category VARCHAR(50),
  dimensions TEXT,
  max_passengers INT,
  fuel_type VARCHAR(50),
  emission_standard VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle Service Records
CREATE TABLE IF NOT EXISTS vehicle_service_records (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  vehicle_id UUID NOT NULL,
  service_date DATE NOT NULL,
  service_type VARCHAR(100),
  service_provider VARCHAR(255),
  mileage_at_service INT,
  parts_replaced TEXT,
  cost DECIMAL(10, 2),
  next_service_date DATE,
  service_status VARCHAR(50),
  service_notes TEXT,
  attachments_urls TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Maintenance Scheduling
CREATE TABLE IF NOT EXISTS maintenance_schedules (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  vehicle_id UUID NOT NULL,
  maintenance_type VARCHAR(100),
  scheduled_date DATE NOT NULL,
  scheduled_mileage INT,
  priority_level VARCHAR(50),
  assigned_to VARCHAR(255),
  estimated_duration INT,
  estimated_cost DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'scheduled',
  completed_date DATE,
  actual_cost DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Preventive Maintenance Plans
CREATE TABLE IF NOT EXISTS preventive_maintenance_plans (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  vehicle_id UUID NOT NULL,
  plan_name VARCHAR(255) NOT NULL,
  frequency_months INT,
  last_performed_date DATE,
  next_due_date DATE,
  maintenance_items TEXT[],
  estimated_cost DECIMAL(10, 2),
  contractor_name VARCHAR(255),
  plan_status VARCHAR(50) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Breakdown & Incident Management
CREATE TABLE IF NOT EXISTS vehicle_breakdowns (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  vehicle_id UUID NOT NULL,
  breakdown_date TIMESTAMP NOT NULL,
  location_gps TEXT,
  breakdown_type VARCHAR(100),
  severity VARCHAR(50),
  breakdown_description TEXT,
  assigned_mechanic VARCHAR(255),
  parts_needed TEXT[],
  estimated_repair_time INT,
  actual_repair_time INT,
  repair_cost DECIMAL(10, 2),
  downtime_hours INT,
  status VARCHAR(50) DEFAULT 'reported',
  resolved_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tire Management
CREATE TABLE IF NOT EXISTS tire_management (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  vehicle_id UUID NOT NULL,
  tire_position VARCHAR(50),
  tire_brand VARCHAR(100),
  tire_model VARCHAR(100),
  tire_size VARCHAR(50),
  installation_date DATE NOT NULL,
  tread_depth_mm DECIMAL(4, 2),
  last_rotated_date DATE,
  next_rotation_due_date DATE,
  condition_status VARCHAR(50),
  estimated_replacement_date DATE,
  replacement_cost DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fuel Management
CREATE TABLE IF NOT EXISTS fuel_management (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  vehicle_id UUID NOT NULL,
  fuel_date TIMESTAMP NOT NULL,
  fuel_type VARCHAR(50),
  quantity_liters DECIMAL(10, 2),
  cost_per_liter DECIMAL(10, 4),
  total_cost DECIMAL(12, 2),
  fuel_station VARCHAR(255),
  odometer_reading INT,
  fuel_efficiency_kmpl DECIMAL(6, 2),
  payment_method VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Spare Parts Management
CREATE TABLE IF NOT EXISTS spare_parts_inventory (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  part_name VARCHAR(255) NOT NULL,
  part_code VARCHAR(100),
  part_type VARCHAR(100),
  vehicle_make VARCHAR(100),
  vehicle_model VARCHAR(100),
  quantity_on_hand INT DEFAULT 0,
  reorder_level INT,
  unit_cost DECIMAL(10, 2),
  supplier_name VARCHAR(255),
  supplier_contact VARCHAR(255),
  warehouse_location VARCHAR(255),
  last_restock_date DATE,
  expiry_date DATE,
  status VARCHAR(50) DEFAULT 'in-stock',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Asset Tracking
CREATE TABLE IF NOT EXISTS asset_tracking (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  vehicle_id UUID NOT NULL,
  asset_name VARCHAR(255) NOT NULL,
  asset_type VARCHAR(100),
  serial_number VARCHAR(100),
  asset_value DECIMAL(12, 2),
  installation_date DATE,
  maintenance_interval_months INT,
  last_maintained_date DATE,
  depreciation_rate DECIMAL(5, 2),
  current_condition VARCHAR(50),
  location_on_vehicle VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle Utilization Analytics
CREATE TABLE IF NOT EXISTS vehicle_utilization (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  vehicle_id UUID NOT NULL,
  date_period DATE NOT NULL,
  total_kilometers INT,
  trips_completed INT,
  hours_in_use INT,
  idle_time_hours INT,
  utilization_percentage DECIMAL(5, 2),
  revenue_generated DECIMAL(12, 2),
  operating_cost DECIMAL(12, 2),
  profit_loss DECIMAL(12, 2),
  fuel_consumed_liters DECIMAL(10, 2),
  avg_speed_kmh DECIMAL(6, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle Downtime Monitoring
CREATE TABLE IF NOT EXISTS vehicle_downtime (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  vehicle_id UUID NOT NULL,
  downtime_start TIMESTAMP NOT NULL,
  downtime_end TIMESTAMP,
  downtime_reason VARCHAR(100),
  downtime_category VARCHAR(100),
  duration_hours DECIMAL(10, 2),
  cost_of_downtime DECIMAL(12, 2),
  status VARCHAR(50) DEFAULT 'ongoing',
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle Inspection Management
CREATE TABLE IF NOT EXISTS vehicle_inspections (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  vehicle_id UUID NOT NULL,
  inspection_date DATE NOT NULL,
  inspection_type VARCHAR(100),
  inspector_name VARCHAR(255),
  inspection_status VARCHAR(50),
  overall_condition VARCHAR(50),
  body_condition VARCHAR(50),
  engine_condition VARCHAR(50),
  transmission_condition VARCHAR(50),
  electrical_condition VARCHAR(50),
  safety_equipment_check BOOLEAN,
  tire_condition VARCHAR(50),
  brake_system_check BOOLEAN,
  suspension_check BOOLEAN,
  lights_check BOOLEAN,
  issues_found TEXT[],
  repair_recommendations TEXT[],
  follow_up_date DATE,
  inspection_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_vehicle_registrations_vehicle_id ON vehicle_registrations(vehicle_id);
CREATE INDEX idx_vehicle_registrations_company_id ON vehicle_registrations(company_id);
CREATE INDEX idx_vehicle_insurance_vehicle_id ON vehicle_insurance(vehicle_id);
CREATE INDEX idx_vehicle_insurance_company_id ON vehicle_insurance(company_id);
CREATE INDEX idx_vehicle_licenses_vehicle_id ON vehicle_licenses(vehicle_id);
CREATE INDEX idx_vehicle_service_records_vehicle_id ON vehicle_service_records(vehicle_id);
CREATE INDEX idx_maintenance_schedules_vehicle_id ON maintenance_schedules(vehicle_id);
CREATE INDEX idx_maintenance_schedules_status ON maintenance_schedules(status);
CREATE INDEX idx_vehicle_breakdowns_vehicle_id ON vehicle_breakdowns(vehicle_id);
CREATE INDEX idx_vehicle_breakdowns_status ON vehicle_breakdowns(status);
CREATE INDEX idx_tire_management_vehicle_id ON tire_management(vehicle_id);
CREATE INDEX idx_fuel_management_vehicle_id ON fuel_management(vehicle_id);
CREATE INDEX idx_fuel_management_date ON fuel_management(fuel_date);
CREATE INDEX idx_spare_parts_inventory_company_id ON spare_parts_inventory(company_id);
CREATE INDEX idx_spare_parts_inventory_status ON spare_parts_inventory(status);
CREATE INDEX idx_asset_tracking_vehicle_id ON asset_tracking(vehicle_id);
CREATE INDEX idx_vehicle_utilization_vehicle_id ON vehicle_utilization(vehicle_id);
CREATE INDEX idx_vehicle_utilization_date ON vehicle_utilization(date_period);
CREATE INDEX idx_vehicle_downtime_vehicle_id ON vehicle_downtime(vehicle_id);
CREATE INDEX idx_vehicle_downtime_status ON vehicle_downtime(status);
CREATE INDEX idx_vehicle_inspections_vehicle_id ON vehicle_inspections(vehicle_id);
CREATE INDEX idx_vehicle_inspections_date ON vehicle_inspections(inspection_date);
