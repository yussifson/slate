-- PHARMACY VERTICAL - COMPLETE ERROR-FREE SQL
-- Run this in Supabase SQL Editor
-- No UUID/TEXT mismatches - all IDs are TEXT type with proper type casting

BEGIN;

-- ========================================
-- 1. DRUGS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS univ_pharmacy_drugs (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  drug_name TEXT NOT NULL,
  generic_name TEXT,
  strength TEXT,
  unit_of_measurement TEXT,
  drug_form TEXT,
  manufacturer TEXT,
  ndc_code TEXT UNIQUE,
  therapeutic_category TEXT,
  unit_price NUMERIC(12,2) DEFAULT 0,
  discount_percentage NUMERIC(5,2) DEFAULT 0,
  reorder_level INTEGER DEFAULT 50,
  maximum_stock INTEGER DEFAULT 500,
  barcode TEXT,
  is_controlled BOOLEAN DEFAULT FALSE,
  requires_prescription BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_drugs_company ON univ_pharmacy_drugs(company_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_drugs_active ON univ_pharmacy_drugs(is_active);
CREATE INDEX IF NOT EXISTS idx_pharmacy_drugs_barcode ON univ_pharmacy_drugs(barcode);

ALTER TABLE univ_pharmacy_drugs ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 2. INVENTORY TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS univ_pharmacy_inventory (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  drug_id TEXT NOT NULL,
  batch_number TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  quantity_in_stock INTEGER DEFAULT 0,
  quantity_reserved INTEGER DEFAULT 0,
  quantity_available INTEGER GENERATED ALWAYS AS (quantity_in_stock - quantity_reserved) STORED,
  cost_per_unit NUMERIC(12,2) DEFAULT 0,
  total_cost NUMERIC(15,2) DEFAULT 0,
  storage_location TEXT,
  warehouse_section TEXT,
  shelf_number TEXT,
  received_date DATE,
  received_by TEXT,
  is_quarantined BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (drug_id) REFERENCES univ_pharmacy_drugs(id),
  UNIQUE(batch_number, drug_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_company ON univ_pharmacy_inventory(company_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_drug ON univ_pharmacy_inventory(drug_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_expiry ON univ_pharmacy_inventory(expiry_date);
CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_available ON univ_pharmacy_inventory(quantity_available);

ALTER TABLE univ_pharmacy_inventory ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 3. CUSTOMERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS univ_pharmacy_customers (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_type TEXT,
  phone TEXT,
  email TEXT,
  date_of_birth DATE,
  gender TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  insurance_provider TEXT,
  insurance_id TEXT,
  loyalty_points INTEGER DEFAULT 0,
  total_spent NUMERIC(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_customers_company ON univ_pharmacy_customers(company_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_customers_phone ON univ_pharmacy_customers(phone);
CREATE INDEX IF NOT EXISTS idx_pharmacy_customers_email ON univ_pharmacy_customers(email);

ALTER TABLE univ_pharmacy_customers ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 4. SALES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS univ_pharmacy_sales (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  receipt_number TEXT NOT NULL UNIQUE,
  customer_id TEXT,
  sale_date TIMESTAMPTZ DEFAULT NOW(),
  total_items INTEGER DEFAULT 0,
  subtotal NUMERIC(15,2) DEFAULT 0,
  tax_amount NUMERIC(15,2) DEFAULT 0,
  discount_amount NUMERIC(15,2) DEFAULT 0,
  grand_total NUMERIC(15,2) DEFAULT 0,
  amount_paid NUMERIC(15,2) DEFAULT 0,
  change_amount NUMERIC(15,2) DEFAULT 0,
  payment_method TEXT,
  cashier_id TEXT,
  shift_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (customer_id) REFERENCES univ_pharmacy_customers(id)
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_sales_company ON univ_pharmacy_sales(company_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_sales_date ON univ_pharmacy_sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_pharmacy_sales_receipt ON univ_pharmacy_sales(receipt_number);

ALTER TABLE univ_pharmacy_sales ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 5. SALE ITEMS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS univ_pharmacy_sale_items (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  sale_id TEXT NOT NULL,
  drug_id TEXT NOT NULL,
  drug_name TEXT NOT NULL,
  quantity_sold INTEGER DEFAULT 1,
  unit_price NUMERIC(12,2) DEFAULT 0,
  line_total NUMERIC(15,2) DEFAULT 0,
  batch_number TEXT,
  inventory_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (sale_id) REFERENCES univ_pharmacy_sales(id),
  FOREIGN KEY (drug_id) REFERENCES univ_pharmacy_drugs(id),
  FOREIGN KEY (inventory_id) REFERENCES univ_pharmacy_inventory(id)
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_sale_items_company ON univ_pharmacy_sale_items(company_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_sale_items_sale ON univ_pharmacy_sale_items(sale_id);

ALTER TABLE univ_pharmacy_sale_items ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 6. PRESCRIPTIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS univ_pharmacy_prescriptions (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  prescription_number TEXT NOT NULL UNIQUE,
  customer_id TEXT NOT NULL,
  physician_name TEXT NOT NULL,
  physician_license_number TEXT,
  prescription_date DATE NOT NULL,
  prescribed_drug_id TEXT NOT NULL,
  drug_name TEXT NOT NULL,
  quantity_prescribed INTEGER DEFAULT 0,
  dosage TEXT,
  frequency TEXT,
  duration_days INTEGER DEFAULT 30,
  refills_allowed INTEGER DEFAULT 0,
  prescription_status TEXT DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (customer_id) REFERENCES univ_pharmacy_customers(id),
  FOREIGN KEY (prescribed_drug_id) REFERENCES univ_pharmacy_drugs(id)
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_prescriptions_company ON univ_pharmacy_prescriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_prescriptions_customer ON univ_pharmacy_prescriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_prescriptions_status ON univ_pharmacy_prescriptions(prescription_status);

ALTER TABLE univ_pharmacy_prescriptions ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 7. SUPPLIERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS univ_pharmacy_suppliers (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  payment_terms TEXT,
  lead_time_days INTEGER DEFAULT 5,
  is_preferred BOOLEAN DEFAULT FALSE,
  credit_limit NUMERIC(15,2) DEFAULT 0,
  current_balance NUMERIC(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_suppliers_company ON univ_pharmacy_suppliers(company_id);

ALTER TABLE univ_pharmacy_suppliers ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 8. PURCHASE ORDERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS univ_pharmacy_purchase_orders (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  po_number TEXT NOT NULL UNIQUE,
  supplier_id TEXT NOT NULL,
  po_date DATE NOT NULL,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  total_amount NUMERIC(15,2) DEFAULT 0,
  po_status TEXT DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (supplier_id) REFERENCES univ_pharmacy_suppliers(id)
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_po_company ON univ_pharmacy_purchase_orders(company_id);

ALTER TABLE univ_pharmacy_purchase_orders ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 9. INSURANCE CLAIMS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS univ_pharmacy_insurance_claims (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  claim_number TEXT NOT NULL UNIQUE,
  sale_id TEXT,
  customer_id TEXT,
  insurance_provider TEXT NOT NULL,
  insurance_id TEXT,
  claim_amount NUMERIC(15,2) DEFAULT 0,
  approval_amount NUMERIC(15,2) DEFAULT 0,
  claim_status TEXT DEFAULT 'Submitted',
  submission_date TIMESTAMPTZ DEFAULT NOW(),
  approval_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (sale_id) REFERENCES univ_pharmacy_sales(id),
  FOREIGN KEY (customer_id) REFERENCES univ_pharmacy_customers(id)
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_claims_company ON univ_pharmacy_insurance_claims(company_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_claims_status ON univ_pharmacy_insurance_claims(claim_status);

ALTER TABLE univ_pharmacy_insurance_claims ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 10. CONTROLLED SUBSTANCES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS univ_pharmacy_controlled_substances (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  drug_id TEXT NOT NULL,
  dea_schedule TEXT,
  registration_number TEXT,
  quantity_on_hand INTEGER DEFAULT 0,
  last_verified_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (drug_id) REFERENCES univ_pharmacy_drugs(id)
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_controlled_company ON univ_pharmacy_controlled_substances(company_id);

ALTER TABLE univ_pharmacy_controlled_substances ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 11. EXPIRY ALERTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS univ_pharmacy_expiry_alerts (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  inventory_id TEXT NOT NULL,
  drug_id TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  days_until_expiry INTEGER,
  alert_status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (inventory_id) REFERENCES univ_pharmacy_inventory(id),
  FOREIGN KEY (drug_id) REFERENCES univ_pharmacy_drugs(id)
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_expiry_company ON univ_pharmacy_expiry_alerts(company_id);

ALTER TABLE univ_pharmacy_expiry_alerts ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 12. SHIFTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS univ_pharmacy_shifts (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  shift_date DATE NOT NULL,
  cashier_id TEXT NOT NULL,
  shift_start TIMESTAMPTZ NOT NULL,
  shift_end TIMESTAMPTZ,
  opening_balance NUMERIC(15,2) DEFAULT 0,
  closing_balance NUMERIC(15,2) DEFAULT 0,
  total_sales NUMERIC(15,2) DEFAULT 0,
  shift_status TEXT DEFAULT 'Open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_shifts_company ON univ_pharmacy_shifts(company_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_shifts_date ON univ_pharmacy_shifts(shift_date);

ALTER TABLE univ_pharmacy_shifts ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 13. RECONCILIATION TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS univ_pharmacy_reconciliations (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  reconciliation_date DATE NOT NULL,
  expected_amount NUMERIC(15,2) DEFAULT 0,
  actual_amount NUMERIC(15,2) DEFAULT 0,
  variance NUMERIC(15,2) DEFAULT 0,
  variance_reason TEXT,
  reconciliation_status TEXT DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_reconciliation_company ON univ_pharmacy_reconciliations(company_id);

ALTER TABLE univ_pharmacy_reconciliations ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 14. ANALYTICS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS univ_pharmacy_analytics (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  metric_type TEXT,
  metric_date DATE NOT NULL,
  total_sales NUMERIC(15,2) DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  low_stock_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_analytics_company ON univ_pharmacy_analytics(company_id);

ALTER TABLE univ_pharmacy_analytics ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 15. AUDIT LOG TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS univ_pharmacy_audit_log (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  performer_id TEXT,
  old_value JSONB,
  new_value JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_audit_company ON univ_pharmacy_audit_log(company_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_audit_entity ON univ_pharmacy_audit_log(entity_type, entity_id);

ALTER TABLE univ_pharmacy_audit_log ENABLE ROW LEVEL SECURITY;

-- ========================================
-- RLS POLICIES - PHARMACY DRUGS
-- ========================================
DROP POLICY IF EXISTS "pharmacy_drugs_select" ON univ_pharmacy_drugs;
DROP POLICY IF EXISTS "pharmacy_drugs_insert" ON univ_pharmacy_drugs;
DROP POLICY IF EXISTS "pharmacy_drugs_update" ON univ_pharmacy_drugs;
DROP POLICY IF EXISTS "pharmacy_drugs_delete" ON univ_pharmacy_drugs;

CREATE POLICY "pharmacy_drugs_select" ON univ_pharmacy_drugs
  FOR SELECT USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_drugs_insert" ON univ_pharmacy_drugs
  FOR INSERT WITH CHECK (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_drugs_update" ON univ_pharmacy_drugs
  FOR UPDATE USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_drugs_delete" ON univ_pharmacy_drugs
  FOR DELETE USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

-- ========================================
-- RLS POLICIES - PHARMACY INVENTORY
-- ========================================
DROP POLICY IF EXISTS "pharmacy_inventory_select" ON univ_pharmacy_inventory;
DROP POLICY IF EXISTS "pharmacy_inventory_insert" ON univ_pharmacy_inventory;
DROP POLICY IF EXISTS "pharmacy_inventory_update" ON univ_pharmacy_inventory;
DROP POLICY IF EXISTS "pharmacy_inventory_delete" ON univ_pharmacy_inventory;

CREATE POLICY "pharmacy_inventory_select" ON univ_pharmacy_inventory
  FOR SELECT USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_inventory_insert" ON univ_pharmacy_inventory
  FOR INSERT WITH CHECK (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_inventory_update" ON univ_pharmacy_inventory
  FOR UPDATE USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_inventory_delete" ON univ_pharmacy_inventory
  FOR DELETE USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

-- ========================================
-- RLS POLICIES - PHARMACY SALES
-- ========================================
DROP POLICY IF EXISTS "pharmacy_sales_select" ON univ_pharmacy_sales;
DROP POLICY IF EXISTS "pharmacy_sales_insert" ON univ_pharmacy_sales;
DROP POLICY IF EXISTS "pharmacy_sales_update" ON univ_pharmacy_sales;
DROP POLICY IF EXISTS "pharmacy_sales_delete" ON univ_pharmacy_sales;

CREATE POLICY "pharmacy_sales_select" ON univ_pharmacy_sales
  FOR SELECT USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_sales_insert" ON univ_pharmacy_sales
  FOR INSERT WITH CHECK (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_sales_update" ON univ_pharmacy_sales
  FOR UPDATE USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_sales_delete" ON univ_pharmacy_sales
  FOR DELETE USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

-- ========================================
-- RLS POLICIES - PHARMACY SALE ITEMS
-- ========================================
DROP POLICY IF EXISTS "pharmacy_sale_items_select" ON univ_pharmacy_sale_items;
DROP POLICY IF EXISTS "pharmacy_sale_items_insert" ON univ_pharmacy_sale_items;
DROP POLICY IF EXISTS "pharmacy_sale_items_update" ON univ_pharmacy_sale_items;
DROP POLICY IF EXISTS "pharmacy_sale_items_delete" ON univ_pharmacy_sale_items;

CREATE POLICY "pharmacy_sale_items_select" ON univ_pharmacy_sale_items
  FOR SELECT USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_sale_items_insert" ON univ_pharmacy_sale_items
  FOR INSERT WITH CHECK (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_sale_items_update" ON univ_pharmacy_sale_items
  FOR UPDATE USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_sale_items_delete" ON univ_pharmacy_sale_items
  FOR DELETE USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

-- ========================================
-- RLS POLICIES - PHARMACY PRESCRIPTIONS
-- ========================================
DROP POLICY IF EXISTS "pharmacy_prescriptions_select" ON univ_pharmacy_prescriptions;
DROP POLICY IF EXISTS "pharmacy_prescriptions_insert" ON univ_pharmacy_prescriptions;
DROP POLICY IF EXISTS "pharmacy_prescriptions_update" ON univ_pharmacy_prescriptions;
DROP POLICY IF EXISTS "pharmacy_prescriptions_delete" ON univ_pharmacy_prescriptions;

CREATE POLICY "pharmacy_prescriptions_select" ON univ_pharmacy_prescriptions
  FOR SELECT USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_prescriptions_insert" ON univ_pharmacy_prescriptions
  FOR INSERT WITH CHECK (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_prescriptions_update" ON univ_pharmacy_prescriptions
  FOR UPDATE USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_prescriptions_delete" ON univ_pharmacy_prescriptions
  FOR DELETE USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

-- ========================================
-- RLS POLICIES - PHARMACY CUSTOMERS
-- ========================================
DROP POLICY IF EXISTS "pharmacy_customers_select" ON univ_pharmacy_customers;
DROP POLICY IF EXISTS "pharmacy_customers_insert" ON univ_pharmacy_customers;
DROP POLICY IF EXISTS "pharmacy_customers_update" ON univ_pharmacy_customers;
DROP POLICY IF EXISTS "pharmacy_customers_delete" ON univ_pharmacy_customers;

CREATE POLICY "pharmacy_customers_select" ON univ_pharmacy_customers
  FOR SELECT USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_customers_insert" ON univ_pharmacy_customers
  FOR INSERT WITH CHECK (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_customers_update" ON univ_pharmacy_customers
  FOR UPDATE USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_customers_delete" ON univ_pharmacy_customers
  FOR DELETE USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

-- ========================================
-- RLS POLICIES - PHARMACY SUPPLIERS
-- ========================================
DROP POLICY IF EXISTS "pharmacy_suppliers_select" ON univ_pharmacy_suppliers;
DROP POLICY IF EXISTS "pharmacy_suppliers_insert" ON univ_pharmacy_suppliers;
DROP POLICY IF EXISTS "pharmacy_suppliers_update" ON univ_pharmacy_suppliers;
DROP POLICY IF EXISTS "pharmacy_suppliers_delete" ON univ_pharmacy_suppliers;

CREATE POLICY "pharmacy_suppliers_select" ON univ_pharmacy_suppliers
  FOR SELECT USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_suppliers_insert" ON univ_pharmacy_suppliers
  FOR INSERT WITH CHECK (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_suppliers_update" ON univ_pharmacy_suppliers
  FOR UPDATE USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_suppliers_delete" ON univ_pharmacy_suppliers
  FOR DELETE USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

-- ========================================
-- RLS POLICIES - PHARMACY PURCHASE ORDERS
-- ========================================
DROP POLICY IF EXISTS "pharmacy_po_select" ON univ_pharmacy_purchase_orders;
DROP POLICY IF EXISTS "pharmacy_po_insert" ON univ_pharmacy_purchase_orders;
DROP POLICY IF EXISTS "pharmacy_po_update" ON univ_pharmacy_purchase_orders;
DROP POLICY IF EXISTS "pharmacy_po_delete" ON univ_pharmacy_purchase_orders;

CREATE POLICY "pharmacy_po_select" ON univ_pharmacy_purchase_orders
  FOR SELECT USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_po_insert" ON univ_pharmacy_purchase_orders
  FOR INSERT WITH CHECK (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_po_update" ON univ_pharmacy_purchase_orders
  FOR UPDATE USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_po_delete" ON univ_pharmacy_purchase_orders
  FOR DELETE USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

-- ========================================
-- RLS POLICIES - PHARMACY INSURANCE CLAIMS
-- ========================================
DROP POLICY IF EXISTS "pharmacy_claims_select" ON univ_pharmacy_insurance_claims;
DROP POLICY IF EXISTS "pharmacy_claims_insert" ON univ_pharmacy_insurance_claims;
DROP POLICY IF EXISTS "pharmacy_claims_update" ON univ_pharmacy_insurance_claims;
DROP POLICY IF EXISTS "pharmacy_claims_delete" ON univ_pharmacy_insurance_claims;

CREATE POLICY "pharmacy_claims_select" ON univ_pharmacy_insurance_claims
  FOR SELECT USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_claims_insert" ON univ_pharmacy_insurance_claims
  FOR INSERT WITH CHECK (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_claims_update" ON univ_pharmacy_insurance_claims
  FOR UPDATE USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_claims_delete" ON univ_pharmacy_insurance_claims
  FOR DELETE USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

-- ========================================
-- RLS POLICIES - CONTROLLED SUBSTANCES
-- ========================================
DROP POLICY IF EXISTS "pharmacy_controlled_select" ON univ_pharmacy_controlled_substances;
DROP POLICY IF EXISTS "pharmacy_controlled_insert" ON univ_pharmacy_controlled_substances;
DROP POLICY IF EXISTS "pharmacy_controlled_update" ON univ_pharmacy_controlled_substances;
DROP POLICY IF EXISTS "pharmacy_controlled_delete" ON univ_pharmacy_controlled_substances;

CREATE POLICY "pharmacy_controlled_select" ON univ_pharmacy_controlled_substances
  FOR SELECT USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_controlled_insert" ON univ_pharmacy_controlled_substances
  FOR INSERT WITH CHECK (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_controlled_update" ON univ_pharmacy_controlled_substances
  FOR UPDATE USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_controlled_delete" ON univ_pharmacy_controlled_substances
  FOR DELETE USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

-- ========================================
-- RLS POLICIES - EXPIRY ALERTS
-- ========================================
DROP POLICY IF EXISTS "pharmacy_expiry_select" ON univ_pharmacy_expiry_alerts;
DROP POLICY IF EXISTS "pharmacy_expiry_insert" ON univ_pharmacy_expiry_alerts;
DROP POLICY IF EXISTS "pharmacy_expiry_update" ON univ_pharmacy_expiry_alerts;
DROP POLICY IF EXISTS "pharmacy_expiry_delete" ON univ_pharmacy_expiry_alerts;

CREATE POLICY "pharmacy_expiry_select" ON univ_pharmacy_expiry_alerts
  FOR SELECT USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_expiry_insert" ON univ_pharmacy_expiry_alerts
  FOR INSERT WITH CHECK (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_expiry_update" ON univ_pharmacy_expiry_alerts
  FOR UPDATE USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_expiry_delete" ON univ_pharmacy_expiry_alerts
  FOR DELETE USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

-- ========================================
-- RLS POLICIES - SHIFTS
-- ========================================
DROP POLICY IF EXISTS "pharmacy_shifts_select" ON univ_pharmacy_shifts;
DROP POLICY IF EXISTS "pharmacy_shifts_insert" ON univ_pharmacy_shifts;
DROP POLICY IF EXISTS "pharmacy_shifts_update" ON univ_pharmacy_shifts;
DROP POLICY IF EXISTS "pharmacy_shifts_delete" ON univ_pharmacy_shifts;

CREATE POLICY "pharmacy_shifts_select" ON univ_pharmacy_shifts
  FOR SELECT USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_shifts_insert" ON univ_pharmacy_shifts
  FOR INSERT WITH CHECK (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_shifts_update" ON univ_pharmacy_shifts
  FOR UPDATE USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_shifts_delete" ON univ_pharmacy_shifts
  FOR DELETE USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

-- ========================================
-- RLS POLICIES - RECONCILIATION
-- ========================================
DROP POLICY IF EXISTS "pharmacy_reconciliation_select" ON univ_pharmacy_reconciliations;
DROP POLICY IF EXISTS "pharmacy_reconciliation_insert" ON univ_pharmacy_reconciliations;
DROP POLICY IF EXISTS "pharmacy_reconciliation_update" ON univ_pharmacy_reconciliations;
DROP POLICY IF EXISTS "pharmacy_reconciliation_delete" ON univ_pharmacy_reconciliations;

CREATE POLICY "pharmacy_reconciliation_select" ON univ_pharmacy_reconciliations
  FOR SELECT USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_reconciliation_insert" ON univ_pharmacy_reconciliations
  FOR INSERT WITH CHECK (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_reconciliation_update" ON univ_pharmacy_reconciliations
  FOR UPDATE USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_reconciliation_delete" ON univ_pharmacy_reconciliations
  FOR DELETE USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

-- ========================================
-- RLS POLICIES - ANALYTICS
-- ========================================
DROP POLICY IF EXISTS "pharmacy_analytics_select" ON univ_pharmacy_analytics;
DROP POLICY IF EXISTS "pharmacy_analytics_insert" ON univ_pharmacy_analytics;
DROP POLICY IF EXISTS "pharmacy_analytics_update" ON univ_pharmacy_analytics;
DROP POLICY IF EXISTS "pharmacy_analytics_delete" ON univ_pharmacy_analytics;

CREATE POLICY "pharmacy_analytics_select" ON univ_pharmacy_analytics
  FOR SELECT USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_analytics_insert" ON univ_pharmacy_analytics
  FOR INSERT WITH CHECK (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_analytics_update" ON univ_pharmacy_analytics
  FOR UPDATE USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_analytics_delete" ON univ_pharmacy_analytics
  FOR DELETE USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

-- ========================================
-- RLS POLICIES - AUDIT LOG
-- ========================================
DROP POLICY IF EXISTS "pharmacy_audit_select" ON univ_pharmacy_audit_log;
DROP POLICY IF EXISTS "pharmacy_audit_insert" ON univ_pharmacy_audit_log;

CREATE POLICY "pharmacy_audit_select" ON univ_pharmacy_audit_log
  FOR SELECT USING (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

CREATE POLICY "pharmacy_audit_insert" ON univ_pharmacy_audit_log
  FOR INSERT WITH CHECK (company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text);

COMMIT;
