-- Pharmacy Vertical - Enhanced PowerSync Rules with Type Casting
-- Fixes: UUID = TEXT type mismatches with proper ::text casting

-- ========================================
-- POWERSYNC SYNC CONFIGURATION
-- ========================================
-- Register pharmacy tables for offline sync
-- These 4 tables sync for offline POS access

-- Table 1: Drugs (Catalog Read-Only)
-- Enables offline product lookup and POS search
-- SELECT * FROM univ_pharmacy_drugs 
-- WHERE company_id::text = bucket.user_company_id::text

-- Table 2: Inventory (Stock Verification)
-- Critical for availability checks in POS
-- SELECT * FROM univ_pharmacy_inventory 
-- WHERE company_id::text = bucket.user_company_id::text

-- Table 3: Sales (Transaction History)
-- Enables receipt generation and transaction history
-- SELECT * FROM univ_pharmacy_sales 
-- WHERE company_id::text = bucket.user_company_id::text

-- Table 4: Sale Items (Line Items)
-- Details for each transaction
-- SELECT * FROM univ_pharmacy_sale_items 
-- WHERE company_id::text = bucket.user_company_id::text

-- ========================================
-- EXTENDED TABLES (Optional for fuller offline support)
-- ========================================

-- Table 5: Prescriptions
-- SELECT * FROM univ_pharmacy_prescriptions 
-- WHERE company_id::text = bucket.user_company_id::text

-- Table 6: Customers
-- SELECT * FROM univ_pharmacy_customers 
-- WHERE company_id::text = bucket.user_company_id::text

-- ========================================
-- CRITICAL RLS POLICIES - ALL TABLES
-- ========================================

-- All policies use ::text casting to prevent UUID = TEXT type errors
-- auth.jwt() ->> 'company_id' returns TEXT
-- company_id columns are TEXT
-- This ensures proper PostgreSQL type handling

-- Sales Table RLS
ALTER TABLE univ_pharmacy_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pharmacy_sales_read_v2" ON univ_pharmacy_sales
  FOR SELECT USING (
    company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text
  );

CREATE POLICY "pharmacy_sales_insert_v2" ON univ_pharmacy_sales
  FOR INSERT WITH CHECK (
    company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text
  );

CREATE POLICY "pharmacy_sales_update_v2" ON univ_pharmacy_sales
  FOR UPDATE USING (
    company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text
  );

-- Sale Items Table RLS
ALTER TABLE univ_pharmacy_sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pharmacy_sale_items_read_v2" ON univ_pharmacy_sale_items
  FOR SELECT USING (
    company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text
  );

CREATE POLICY "pharmacy_sale_items_insert_v2" ON univ_pharmacy_sale_items
  FOR INSERT WITH CHECK (
    company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text
  );

-- Inventory Table RLS
ALTER TABLE univ_pharmacy_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pharmacy_inventory_read_v2" ON univ_pharmacy_inventory
  FOR SELECT USING (
    company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text
  );

CREATE POLICY "pharmacy_inventory_insert_v2" ON univ_pharmacy_inventory
  FOR INSERT WITH CHECK (
    company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text
  );

CREATE POLICY "pharmacy_inventory_update_v2" ON univ_pharmacy_inventory
  FOR UPDATE USING (
    company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text
  );

-- Drugs Table RLS
ALTER TABLE univ_pharmacy_drugs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pharmacy_drugs_read_v2" ON univ_pharmacy_drugs
  FOR SELECT USING (
    company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text
  );

CREATE POLICY "pharmacy_drugs_insert_v2" ON univ_pharmacy_drugs
  FOR INSERT WITH CHECK (
    company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text
  );

CREATE POLICY "pharmacy_drugs_update_v2" ON univ_pharmacy_drugs
  FOR UPDATE USING (
    company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text
  );

-- Prescriptions Table RLS
ALTER TABLE univ_pharmacy_prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pharmacy_prescriptions_read_v2" ON univ_pharmacy_prescriptions
  FOR SELECT USING (
    company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text
  );

CREATE POLICY "pharmacy_prescriptions_insert_v2" ON univ_pharmacy_prescriptions
  FOR INSERT WITH CHECK (
    company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text
  );

-- Customers Table RLS
ALTER TABLE univ_pharmacy_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pharmacy_customers_read_v2" ON univ_pharmacy_customers
  FOR SELECT USING (
    company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text
  );

CREATE POLICY "pharmacy_customers_insert_v2" ON univ_pharmacy_customers
  FOR INSERT WITH CHECK (
    company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text
  );

-- Suppliers Table RLS
ALTER TABLE univ_pharmacy_suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pharmacy_suppliers_read_v2" ON univ_pharmacy_suppliers
  FOR SELECT USING (
    company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text
  );

CREATE POLICY "pharmacy_suppliers_insert_v2" ON univ_pharmacy_suppliers
  FOR INSERT WITH CHECK (
    company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text
  );

-- Purchase Orders Table RLS
ALTER TABLE univ_pharmacy_purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pharmacy_po_read_v2" ON univ_pharmacy_purchase_orders
  FOR SELECT USING (
    company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text
  );

CREATE POLICY "pharmacy_po_insert_v2" ON univ_pharmacy_purchase_orders
  FOR INSERT WITH CHECK (
    company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text
  );

-- Insurance Claims Table RLS
ALTER TABLE univ_pharmacy_insurance_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pharmacy_claims_read_v2" ON univ_pharmacy_insurance_claims
  FOR SELECT USING (
    company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text
  );

CREATE POLICY "pharmacy_claims_insert_v2" ON univ_pharmacy_insurance_claims
  FOR INSERT WITH CHECK (
    company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text
  );

-- Controlled Substances Table RLS
ALTER TABLE univ_pharmacy_controlled_substances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pharmacy_controlled_read_v2" ON univ_pharmacy_controlled_substances
  FOR SELECT USING (
    company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text
  );

CREATE POLICY "pharmacy_controlled_insert_v2" ON univ_pharmacy_controlled_substances
  FOR INSERT WITH CHECK (
    company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text
  );

-- Shifts Table RLS
ALTER TABLE univ_pharmacy_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pharmacy_shifts_read_v2" ON univ_pharmacy_shifts
  FOR SELECT USING (
    company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text
  );

CREATE POLICY "pharmacy_shifts_insert_v2" ON univ_pharmacy_shifts
  FOR INSERT WITH CHECK (
    company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text
  );

-- Reconciliations Table RLS
ALTER TABLE univ_pharmacy_reconciliations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pharmacy_reconciliations_read_v2" ON univ_pharmacy_reconciliations
  FOR SELECT USING (
    company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text
  );

CREATE POLICY "pharmacy_reconciliations_insert_v2" ON univ_pharmacy_reconciliations
  FOR INSERT WITH CHECK (
    company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text
  );

-- Expiry Alerts Table RLS
ALTER TABLE univ_pharmacy_expiry_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pharmacy_expiry_read_v2" ON univ_pharmacy_expiry_alerts
  FOR SELECT USING (
    company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text
  );

CREATE POLICY "pharmacy_expiry_insert_v2" ON univ_pharmacy_expiry_alerts
  FOR INSERT WITH CHECK (
    company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text
  );

-- Audit Log Table RLS
ALTER TABLE univ_pharmacy_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pharmacy_audit_read_v2" ON univ_pharmacy_audit_log
  FOR SELECT USING (
    company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text
  );

CREATE POLICY "pharmacy_audit_insert_v2" ON univ_pharmacy_audit_log
  FOR INSERT WITH CHECK (
    company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text
  );

-- Analytics Table RLS
ALTER TABLE univ_pharmacy_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pharmacy_analytics_read_v2" ON univ_pharmacy_analytics
  FOR SELECT USING (
    company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text
  );

CREATE POLICY "pharmacy_analytics_insert_v2" ON univ_pharmacy_analytics
  FOR INSERT WITH CHECK (
    company_id::text = COALESCE(auth.jwt() ->> 'company_id', '')::text
  );

-- ========================================
-- KEY FIXES APPLIED
-- ========================================
-- 1. All UUID/TEXT comparisons use ::text casting
-- 2. COALESCE handles null JWT values
-- 3. Removed complex subqueries that cause type issues
-- 4. Simplified to direct company_id comparisons
-- 5. All policies follow same pattern for consistency
