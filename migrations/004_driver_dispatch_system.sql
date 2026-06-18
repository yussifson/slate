-- Driver and Dispatch Operations Management System
-- Comprehensive tables for driver management and dispatch operations

-- ============================================
-- DRIVER MANAGEMENT TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS driver_licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    driver_id UUID NOT NULL,
    license_number VARCHAR(50) NOT NULL,
    license_type VARCHAR(20),
    country_issued VARCHAR(50),
    issue_date DATE,
    expiry_date DATE,
    restrictions TEXT,
    verification_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, driver_id, license_number)
);

CREATE TABLE IF NOT EXISTS driver_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    driver_id UUID NOT NULL,
    certification_name VARCHAR(100) NOT NULL,
    certification_type VARCHAR(50),
    issuing_body VARCHAR(100),
    issue_date DATE,
    expiry_date DATE,
    verification_document_url TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS driver_training_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    driver_id UUID NOT NULL,
    training_type VARCHAR(100),
    training_provider VARCHAR(100),
    training_date DATE,
    completion_date DATE,
    duration_hours NUMERIC,
    score NUMERIC,
    certificate_url TEXT,
    status VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS driver_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    driver_id UUID NOT NULL,
    attendance_date DATE NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20),
    working_hours NUMERIC,
    location VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, driver_id, attendance_date)
);

CREATE TABLE IF NOT EXISTS driver_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    driver_id UUID NOT NULL,
    schedule_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    assigned_route VARCHAR(255),
    vehicle_id UUID,
    status VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, driver_id, schedule_date)
);

CREATE TABLE IF NOT EXISTS driver_payroll (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    driver_id UUID NOT NULL,
    payroll_period_start DATE NOT NULL,
    payroll_period_end DATE NOT NULL,
    base_salary NUMERIC,
    bonus NUMERIC,
    deductions NUMERIC,
    net_pay NUMERIC,
    payment_status VARCHAR(20),
    payment_date DATE,
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, driver_id, payroll_period_start)
);

CREATE TABLE IF NOT EXISTS driver_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    driver_id UUID NOT NULL,
    evaluation_date DATE NOT NULL,
    safety_rating NUMERIC,
    delivery_efficiency NUMERIC,
    customer_feedback_score NUMERIC,
    vehicle_condition_score NUMERIC,
    punctuality_score NUMERIC,
    overall_rating NUMERIC,
    evaluator_id UUID,
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS driver_safety_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    driver_id UUID NOT NULL,
    incident_date TIMESTAMP WITH TIME ZONE NOT NULL,
    incident_type VARCHAR(50),
    severity VARCHAR(20),
    location VARCHAR(255),
    description TEXT,
    witness_details TEXT,
    damage_assessment TEXT,
    corrective_action TEXT,
    status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS driver_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    driver_id UUID NOT NULL,
    violation_date DATE NOT NULL,
    violation_type VARCHAR(100),
    severity_level VARCHAR(20),
    description TEXT,
    penalty_points NUMERIC,
    fine_amount NUMERIC,
    citation_number VARCHAR(50),
    status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS driver_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    driver_id UUID NOT NULL,
    reward_date DATE NOT NULL,
    reward_type VARCHAR(100),
    reward_points NUMERIC,
    reward_amount NUMERIC,
    reason TEXT,
    status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS driver_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    driver_id UUID NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    document_name VARCHAR(255),
    document_url TEXT NOT NULL,
    expiry_date DATE,
    verification_status VARCHAR(20),
    upload_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- DISPATCH OPERATIONS TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS dispatch_centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    center_name VARCHAR(255) NOT NULL,
    center_code VARCHAR(50),
    location VARCHAR(255),
    latitude NUMERIC,
    longitude NUMERIC,
    capacity_daily NUMERIC,
    operating_hours_start TIME,
    operating_hours_end TIME,
    contact_person VARCHAR(100),
    contact_phone VARCHAR(20),
    email VARCHAR(100),
    status VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, center_code)
);

CREATE TABLE IF NOT EXISTS trip_planning (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    trip_id VARCHAR(50) NOT NULL,
    origin_location VARCHAR(255),
    destination_location VARCHAR(255),
    origin_lat NUMERIC,
    origin_lon NUMERIC,
    dest_lat NUMERIC,
    dest_lon NUMERIC,
    planned_distance NUMERIC,
    planned_duration NUMERIC,
    planned_start_time TIMESTAMP WITH TIME ZONE,
    planned_end_time TIMESTAMP WITH TIME ZONE,
    trip_status VARCHAR(20),
    planned_by UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, trip_id)
);

CREATE TABLE IF NOT EXISTS trip_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    trip_id UUID NOT NULL,
    driver_id UUID NOT NULL,
    vehicle_id UUID,
    assignment_date TIMESTAMP WITH TIME ZONE,
    dispatch_center_id UUID,
    assignment_status VARCHAR(20),
    assigned_by UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, trip_id, driver_id)
);

CREATE TABLE IF NOT EXISTS load_management (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    trip_id UUID NOT NULL,
    load_item_number VARCHAR(50),
    shipment_id VARCHAR(100),
    origin_address VARCHAR(500),
    destination_address VARCHAR(500),
    weight_kg NUMERIC,
    volume_m3 NUMERIC,
    commodity_type VARCHAR(100),
    handling_instructions TEXT,
    load_status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS route_planning (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    route_id VARCHAR(50) NOT NULL,
    route_name VARCHAR(255),
    trip_id UUID,
    waypoint_sequence NUMERIC,
    waypoint_latitude NUMERIC,
    waypoint_longitude NUMERIC,
    waypoint_address VARCHAR(500),
    waypoint_type VARCHAR(50),
    estimated_arrival_time TIMESTAMP WITH TIME ZONE,
    estimated_departure_time TIMESTAMP WITH TIME ZONE,
    route_status VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dispatch_calendar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    calendar_date DATE NOT NULL,
    trip_id UUID,
    driver_id UUID,
    vehicle_id UUID,
    dispatch_center_id UUID,
    event_type VARCHAR(50),
    event_time TIMESTAMP WITH TIME ZONE,
    event_description TEXT,
    status VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dispatch_board (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    board_date DATE NOT NULL,
    total_trips_planned NUMERIC,
    total_trips_assigned NUMERIC,
    total_trips_completed NUMERIC,
    total_trips_delayed NUMERIC,
    fleet_utilization_percentage NUMERIC,
    on_time_delivery_rate NUMERIC,
    resource_availability TEXT,
    status_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, board_date)
);

CREATE TABLE IF NOT EXISTS real_time_monitoring (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    trip_id UUID NOT NULL,
    driver_id UUID,
    vehicle_id UUID,
    current_latitude NUMERIC,
    current_longitude NUMERIC,
    current_speed NUMERIC,
    heading NUMERIC,
    total_distance_traveled NUMERIC,
    remaining_distance NUMERIC,
    estimated_time_arrival TIMESTAMP WITH TIME ZONE,
    last_update_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS multi_stop_optimization (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    optimization_id VARCHAR(50) NOT NULL,
    trip_id UUID,
    total_stops NUMERIC,
    optimization_algorithm VARCHAR(100),
    total_distance_km NUMERIC,
    total_duration_hours NUMERIC,
    fuel_consumption_liters NUMERIC,
    cost_saving_percentage NUMERIC,
    stop_sequence JSON,
    optimization_status VARCHAR(20),
    optimized_by UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, optimization_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_driver_licenses_driver ON driver_licenses(company_id, driver_id);
CREATE INDEX idx_driver_licenses_expiry ON driver_licenses(expiry_date);
CREATE INDEX idx_driver_certifications_driver ON driver_certifications(company_id, driver_id);
CREATE INDEX idx_driver_training_driver ON driver_training_records(company_id, driver_id);
CREATE INDEX idx_driver_attendance_date ON driver_attendance(company_id, attendance_date);
CREATE INDEX idx_driver_schedules_date ON driver_schedules(company_id, schedule_date);
CREATE INDEX idx_driver_payroll_period ON driver_payroll(company_id, payroll_period_start);
CREATE INDEX idx_driver_performance_date ON driver_performance(company_id, evaluation_date);
CREATE INDEX idx_driver_incidents_date ON driver_safety_incidents(company_id, incident_date);
CREATE INDEX idx_driver_violations_date ON driver_violations(company_id, violation_date);
CREATE INDEX idx_driver_documents_type ON driver_documents(company_id, document_type);

CREATE INDEX idx_dispatch_centers_company ON dispatch_centers(company_id);
CREATE INDEX idx_trip_planning_status ON trip_planning(company_id, trip_status);
CREATE INDEX idx_trip_assignments_driver ON trip_assignments(company_id, driver_id);
CREATE INDEX idx_trip_assignments_trip ON trip_assignments(company_id, trip_id);
CREATE INDEX idx_load_management_trip ON load_management(company_id, trip_id);
CREATE INDEX idx_route_planning_trip ON route_planning(company_id, trip_id);
CREATE INDEX idx_dispatch_calendar_date ON dispatch_calendar(company_id, calendar_date);
CREATE INDEX idx_real_time_monitoring_trip ON real_time_monitoring(company_id, trip_id);
CREATE INDEX idx_multi_stop_optimization_trip ON multi_stop_optimization(company_id, trip_id);

-- ============================================
-- ROW LEVEL SECURITY (Optional - Enable in production)
-- ============================================

-- ALTER TABLE driver_licenses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE driver_certifications ENABLE ROW LEVEL SECURITY;
-- ... (enable RLS for other tables as needed)
