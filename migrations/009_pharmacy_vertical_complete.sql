-- Pharmacy Vertical - Complete Schema
-- Comprehensive system for drug management, inventory, POS, prescriptions, and compliance

-- ========================================
-- 1. DRUG CATALOG & PRODUCTS
-- ========================================

CREATE TABLE IF NOT EXISTS univ_pharmacy_drugs (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  drug_name VARCHAR(255) NOT NULL,
  generic_name VARCHAR(255),
  strength VARCHAR(100),
  unit_of_measurement VARCHAR(50),
  drug_form VARCHAR(100),
  manufacturer VARCHAR(255),
  ndc_code VARCHAR(11) UNIQUE,
  therapeutic_category VARCHAR(100),
  unit_price DECIMAL(10, 2),
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  reorder_level INTEGER DEFAULT 50,
  maximum_stock INTEGER DEFAULT 500,
  barcode VARCHAR(100),
  is_controlled BOOLEAN DEFAULT FALSE,
  requires_prescription BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_drugs_company ON univ_pharmacy_drugs(company_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_drugs_ndc ON univ_pharmacy_drugs(ndc_code);
CREATE INDEX IF NOT EXISTS idx_pharmacy_drugs_barcode ON univ_pharmacy_drugs(barcode);
CREATE INDEX IF NOT EXISTS idx_pharmacy_drugs_controlled ON univ_pharmacy_drugs(is_controlled);

-- ========================================
-- 2. INVENTORY MANAGEMENT
-- ========================================

CREATE TABLE IF NOT EXISTS univ_pharmacy_inventory (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  drug_id TEXT NOT NULL REFERENCES univ_pharmacy_drugs(id),
  batch_number VARCHAR(100) NOT NULL,
  expiry_date DATE NOT NULL,
  quantity_in_stock INTEGER DEFAULT 0,
  quantity_reserved INTEGER DEFAULT 0,
  quantity_available INTEGER GENERATED ALWAYS AS (quantity_in_stock - quantity_reserved) STORED,
  cost_per_unit DECIMAL(10, 2),
  total_cost DECIMAL(15, 2),
  storage_location VARCHAR(100),
  warehouse_section VARCHAR(50),
  shelf_number VARCHAR(50),
  received_date DATE,
  received_by TEXT,
  is_quarantined BOOLEAN DEFAULT FALSE,
  quarantine_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_company ON univ_pharmacy_inventory(company_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_drug ON univ_pharmacy_inventory(drug_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_batch ON univ_pharmacy_inventory(batch_number);
CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_expiry ON univ_pharmacy_inventory(expiry_date);

-- ========================================
-- 3. SUPPLIERS & PURCHASING
-- ========================================

CREATE TABLE IF NOT EXISTS univ_pharmacy_suppliers (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  supplier_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  payment_terms VARCHAR(100),
  lead_time_days INTEGER DEFAULT 5,
  is_preferred BOOLEAN DEFAULT FALSE,
  credit_limit DECIMAL(15, 2),
  current_balance DECIMAL(15, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_suppliers_company ON univ_pharmacy_suppliers(company_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_suppliers_preferred ON univ_pharmacy_suppliers(is_preferred);

-- ========================================
-- 4. PURCHASE ORDERS
-- ========================================

CREATE TABLE IF NOT EXISTS univ_pharmacy_purchase_orders (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  supplier_id TEXT NOT NULL REFERENCES univ_pharmacy_suppliers(id),
  po_number VARCHAR(50) UNIQUE NOT NULL,
  order_date DATE NOT NULL,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  order_status VARCHAR(50) DEFAULT 'Pending',
  total_amount DECIMAL(15, 2),
  tax_amount DECIMAL(15, 2),
  shipping_cost DECIMAL(15, 2),
  grand_total DECIMAL(15, 2),
  payment_status VARCHAR(50) DEFAULT 'Unpaid',
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_po_company ON univ_pharmacy_purchase_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_po_supplier ON univ_pharmacy_purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_po_number ON univ_pharmacy_purchase_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_pharmacy_po_status ON univ_pharmacy_purchase_orders(order_status);

-- ========================================
-- 5. CUSTOMERS
-- ========================================

CREATE TABLE IF NOT EXISTS univ_pharmacy_customers (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_type VARCHAR(50),
  phone VARCHAR(20),
  email VARCHAR(100),
  date_of_birth DATE,
  gender VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  insurance_provider VARCHAR(255),
  insurance_id VARCHAR(100),
  loyalty_points INTEGER DEFAULT 0,
  total_spent DECIMAL(15, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_customers_company ON univ_pharmacy_customers(company_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_customers_phone ON univ_pharmacy_customers(phone);
CREATE INDEX IF NOT EXISTS idx_pharmacy_customers_email ON univ_pharmacy_customers(email);

-- ========================================
-- 6. PRESCRIPTIONS
-- ========================================

CREATE TABLE IF NOT EXISTS univ_pharmacy_prescriptions (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  prescription_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id TEXT NOT NULL REFERENCES univ_pharmacy_customers(id),
  physician_name VARCHAR(255),
  physician_license_number VARCHAR(50),
  prescription_date DATE NOT NULL,
  prescribed_drug_id TEXT REFERENCES univ_pharmacy_drugs(id),
  drug_name VARCHAR(255),
  quantity_prescribed INTEGER,
  dosage VARCHAR(100),
  frequency VARCHAR(100),
  duration_days INTEGER,
  refills_allowed INTEGER DEFAULT 0,
  refills_used INTEGER DEFAULT 0,
  prescription_status VARCHAR(50) DEFAULT 'Pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_prescriptions_company ON univ_pharmacy_prescriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_prescriptions_customer ON univ_pharmacy_prescriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_prescriptions_number ON univ_pharmacy_prescriptions(prescription_number);
CREATE INDEX IF NOT EXISTS idx_pharmacy_prescriptions_status ON univ_pharmacy_prescriptions(prescription_status);

-- ========================================
-- 7. SALES & TRANSACTIONS
-- ========================================

CREATE TABLE IF NOT EXISTS univ_pharmacy_sales (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  receipt_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id TEXT REFERENCES univ_pharmacy_customers(id),
  sale_date TIMESTAMP NOT NULL,
  total_items INTEGER,
  subtotal DECIMAL(15, 2),
  tax_amount DECIMAL(15, 2),
  discount_amount DECIMAL(15, 2),
  grand_total DECIMAL(15, 2),
  amount_paid DECIMAL(15, 2),
  change_amount DECIMAL(15, 2),
  payment_method VARCHAR(50),
  cashier_id TEXT,
  shift_id TEXT,
  notes TEXT,
  is_refunded BOOLEAN DEFAULT FALSE,
  refund_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_sales_company ON univ_pharmacy_sales(company_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_sales_customer ON univ_pharmacy_sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_sales_receipt ON univ_pharmacy_sales(receipt_number);
CREATE INDEX IF NOT EXISTS idx_pharmacy_sales_date ON univ_pharmacy_sales(sale_date);

-- ========================================
-- 8. SALE LINE ITEMS
-- ========================================

CREATE TABLE IF NOT EXISTS univ_pharmacy_sale_items (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  sale_id TEXT NOT NULL REFERENCES univ_pharmacy_sales(id),
  drug_id TEXT REFERENCES univ_pharmacy_drugs(id),
  drug_name VARCHAR(255),
  quantity_sold INTEGER,
  unit_price DECIMAL(10, 2),
  line_total DECIMAL(15, 2),
  batch_number VARCHAR(100),
  inventory_id TEXT REFERENCES univ_pharmacy_inventory(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_sale_items_company ON univ_pharmacy_sale_items(company_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_sale_items_sale ON univ_pharmacy_sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_sale_items_drug ON univ_pharmacy_sale_items(drug_id);

-- ========================================
-- 9. CONTROLLED SUBSTANCES TRACKING
-- ========================================

CREATE TABLE IF NOT EXISTS univ_pharmacy_controlled_substances (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  drug_id TEXT NOT NULL REFERENCES univ_pharmacy_drugs(id),
  dea_schedule VARCHAR(50),
  quantity_dispensed INTEGER,
  quantity_wasted INTEGER DEFAULT 0,
  waste_reason TEXT,
  waste_authorized_by TEXT,
  last_reconciliation_date DATE,
  reconciliation_notes TEXT,
  balance_in_record INTEGER,
  balance_actual INTEGER,
  variance INTEGER,
  is_reconciled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_cs_company ON univ_pharmacy_controlled_substances(company_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_cs_drug ON univ_pharmacy_controlled_substances(drug_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_cs_schedule ON univ_pharmacy_controlled_substances(dea_schedule);

-- ========================================
-- 10. INSURANCE CLAIMS
-- ========================================

CREATE TABLE IF NOT EXISTS univ_pharmacy_insurance_claims (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  claim_number VARCHAR(50) UNIQUE NOT NULL,
  sale_id TEXT REFERENCES univ_pharmacy_sales(id),
  customer_id TEXT REFERENCES univ_pharmacy_customers(id),
  insurance_provider VARCHAR(255),
  claim_amount DECIMAL(15, 2),
  approval_amount DECIMAL(15, 2),
  claim_status VARCHAR(50) DEFAULT 'Submitted',
  submission_date TIMESTAMP,
  approval_date TIMESTAMP,
  denial_reason TEXT,
  claim_reference_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_claims_company ON univ_pharmacy_insurance_claims(company_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_claims_customer ON univ_pharmacy_insurance_claims(customer_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_claims_sale ON univ_pharmacy_insurance_claims(sale_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_claims_status ON univ_pharmacy_insurance_claims(claim_status);

-- ========================================
-- 11. SHIFTS & STAFF
-- ========================================

CREATE TABLE IF NOT EXISTS univ_pharmacy_shifts (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  staff_id TEXT NOT NULL,
  shift_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  shift_type VARCHAR(50),
  opening_balance DECIMAL(15, 2),
  closing_balance DECIMAL(15, 2),
  total_sales DECIMAL(15, 2),
  notes TEXT,
  shift_status VARCHAR(50) DEFAULT 'Open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_shifts_company ON univ_pharmacy_shifts(company_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_shifts_staff ON univ_pharmacy_shifts(staff_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_shifts_date ON univ_pharmacy_shifts(shift_date);

-- ========================================
-- 12. INVENTORY RECONCILIATION
-- ========================================

CREATE TABLE IF NOT EXISTS univ_pharmacy_reconciliations (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  reconciliation_date DATE NOT NULL,
  reconciled_by TEXT,
  total_drugs_counted INTEGER,
  total_drugs_in_system INTEGER,
  variance_count INTEGER,
  variance_value DECIMAL(15, 2),
  reconciliation_status VARCHAR(50) DEFAULT 'Pending',
  approval_date DATE,
  approved_by TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_reconciliations_company ON univ_pharmacy_reconciliations(company_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_reconciliations_date ON univ_pharmacy_reconciliations(reconciliation_date);

-- ========================================
-- 13. ALERTS & EXPIRY TRACKING
-- ========================================

CREATE TABLE IF NOT EXISTS univ_pharmacy_expiry_alerts (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  inventory_id TEXT NOT NULL REFERENCES univ_pharmacy_inventory(id),
  drug_name VARCHAR(255),
  batch_number VARCHAR(100),
  expiry_date DATE,
  days_to_expiry INTEGER,
  quantity_expiring INTEGER,
  alert_type VARCHAR(50),
  is_resolved BOOLEAN DEFAULT FALSE,
  resolution_date TIMESTAMP,
  action_taken TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_expiry_company ON univ_pharmacy_expiry_alerts(company_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_expiry_inventory ON univ_pharmacy_expiry_alerts(inventory_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_expiry_type ON univ_pharmacy_expiry_alerts(alert_type);

-- ========================================
-- 14. AUDIT LOG
-- ========================================

CREATE TABLE IF NOT EXISTS univ_pharmacy_audit_log (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  action VARCHAR(255),
  entity_type VARCHAR(50),
  entity_id TEXT,
  user_id TEXT,
  old_value TEXT,
  new_value TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_audit_company ON univ_pharmacy_audit_log(company_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_audit_entity ON univ_pharmacy_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_audit_timestamp ON univ_pharmacy_audit_log(timestamp);

-- ========================================
-- 15. ANALYTICS & INTELLIGENCE
-- ========================================

CREATE TABLE IF NOT EXISTS univ_pharmacy_analytics (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  metric_type VARCHAR(100),
  metric_date DATE,
  total_sales DECIMAL(15, 2),
  total_transactions INTEGER,
  average_transaction_value DECIMAL(10, 2),
  total_items_sold INTEGER,
  top_selling_drug_id TEXT,
  low_stock_count INTEGER,
  expiring_soon_count INTEGER,
  controlled_variance_count INTEGER,
  insurance_claims_pending INTEGER,
  customer_count INTEGER,
  new_customers INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_analytics_company ON univ_pharmacy_analytics(company_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_analytics_date ON univ_pharmacy_analytics(metric_date);
CREATE INDEX IF NOT EXISTS idx_pharmacy_analytics_metric ON univ_pharmacy_analytics(metric_type);
