-- Pharmacy Vertical - PowerSync Configuration
-- Register pharmacy tables for offline sync with proper type casting

-- ========================================
-- POWERSYNC TABLE REGISTRATION
-- ========================================

-- Only sync essential tables for offline access (4 tables)
-- All queries use ::text casting for UUID fields to prevent type mismatches

-- 1. Drugs - read-only catalog
-- SELECT * FROM univ_pharmacy_drugs 
-- WHERE company_id = bucket.user_company_id::text

-- 2. Inventory - critical for availability checking
-- SELECT * FROM univ_pharmacy_inventory 
-- WHERE company_id = bucket.user_company_id::text

-- 3. Sales - transaction history
-- SELECT * FROM univ_pharmacy_sales 
-- WHERE company_id = bucket.user_company_id::text

-- 4. Sale Items - line items for transactions
-- SELECT * FROM univ_pharmacy_sale_items 
-- WHERE company_id = bucket.user_company_id::text

-- Extended tables for full offline access (if needed):
-- Prescriptions - for verification
-- SELECT * FROM univ_pharmacy_prescriptions 
-- WHERE company_id = bucket.user_company_id::text

-- Customers - for customer lookup
-- SELECT * FROM univ_pharmacy_customers 
-- WHERE company_id = bucket.user_company_id::text

-- ========================================
-- SUPABASE ROW LEVEL SECURITY POLICIES
-- ========================================

-- Drugs Table
ALTER TABLE univ_pharmacy_drugs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pharmacy_drugs_read" ON univ_pharmacy_drugs
  FOR SELECT USING (company_id = auth.jwt() ->> 'company_id' OR
    EXISTS (SELECT 1 FROM companies WHERE id::text = company_id AND id::text = auth.jwt() ->> 'company_id'));

CREATE POLICY "pharmacy_drugs_write" ON univ_pharmacy_drugs
  FOR INSERT WITH CHECK (company_id = auth.jwt() ->> 'company_id' OR
    EXISTS (SELECT 1 FROM companies WHERE id::text = company_id AND admin_user_id::text = auth.uid()));

CREATE POLICY "pharmacy_drugs_update" ON univ_pharmacy_drugs
  FOR UPDATE USING (company_id = auth.jwt() ->> 'company_id' OR
    EXISTS (SELECT 1 FROM companies WHERE id::text = company_id AND admin_user_id::text = auth.uid()));

-- Inventory Table
ALTER TABLE univ_pharmacy_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pharmacy_inventory_read" ON univ_pharmacy_inventory
  FOR SELECT USING (company_id = auth.jwt() ->> 'company_id' OR
    EXISTS (SELECT 1 FROM companies WHERE id::text = company_id AND id::text = auth.jwt() ->> 'company_id'));

CREATE POLICY "pharmacy_inventory_write" ON univ_pharmacy_inventory
  FOR INSERT WITH CHECK (company_id = auth.jwt() ->> 'company_id' OR
    EXISTS (SELECT 1 FROM companies WHERE id::text = company_id AND admin_user_id::text = auth.uid()));

CREATE POLICY "pharmacy_inventory_update" ON univ_pharmacy_inventory
  FOR UPDATE USING (company_id = auth.jwt() ->> 'company_id' OR
    EXISTS (SELECT 1 FROM companies WHERE id::text = company_id AND admin_user_id::text = auth.uid()));

-- Sales Table
ALTER TABLE univ_pharmacy_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pharmacy_sales_read" ON univ_pharmacy_sales
  FOR SELECT USING (company_id = auth.jwt() ->> 'company_id');

CREATE POLICY "pharmacy_sales_write" ON univ_pharmacy_sales
  FOR INSERT WITH CHECK (company_id = auth.jwt() ->> 'company_id');

CREATE POLICY "pharmacy_sales_update" ON univ_pharmacy_sales
  FOR UPDATE USING (company_id = auth.jwt() ->> 'company_id');

-- Sale Items Table
ALTER TABLE univ_pharmacy_sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pharmacy_sale_items_read" ON univ_pharmacy_sale_items
  FOR SELECT USING (company_id = auth.jwt() ->> 'company_id');

CREATE POLICY "pharmacy_sale_items_write" ON univ_pharmacy_sale_items
  FOR INSERT WITH CHECK (company_id = auth.jwt() ->> 'company_id');

-- Prescriptions Table
ALTER TABLE univ_pharmacy_prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pharmacy_prescriptions_read" ON univ_pharmacy_prescriptions
  FOR SELECT USING (company_id = auth.jwt() ->> 'company_id');

CREATE POLICY "pharmacy_prescriptions_write" ON univ_pharmacy_prescriptions
  FOR INSERT WITH CHECK (company_id = auth.jwt() ->> 'company_id');

-- Customers Table
ALTER TABLE univ_pharmacy_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pharmacy_customers_read" ON univ_pharmacy_customers
  FOR SELECT USING (company_id = auth.jwt() ->> 'company_id');

CREATE POLICY "pharmacy_customers_write" ON univ_pharmacy_customers
  FOR INSERT WITH CHECK (company_id = auth.jwt() ->> 'company_id');

-- Suppliers Table
ALTER TABLE univ_pharmacy_suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pharmacy_suppliers_read" ON univ_pharmacy_suppliers
  FOR SELECT USING (company_id = auth.jwt() ->> 'company_id');

CREATE POLICY "pharmacy_suppliers_write" ON univ_pharmacy_suppliers
  FOR INSERT WITH CHECK (company_id = auth.jwt() ->> 'company_id');

-- Purchase Orders Table
ALTER TABLE univ_pharmacy_purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pharmacy_po_read" ON univ_pharmacy_purchase_orders
  FOR SELECT USING (company_id = auth.jwt() ->> 'company_id');

CREATE POLICY "pharmacy_po_write" ON univ_pharmacy_purchase_orders
  FOR INSERT WITH CHECK (company_id = auth.jwt() ->> 'company_id');

-- Insurance Claims Table
ALTER TABLE univ_pharmacy_insurance_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pharmacy_claims_read" ON univ_pharmacy_insurance_claims
  FOR SELECT USING (company_id = auth.jwt() ->> 'company_id');

CREATE POLICY "pharmacy_claims_write" ON univ_pharmacy_insurance_claims
  FOR INSERT WITH CHECK (company_id = auth.jwt() ->> 'company_id');

-- Controlled Substances Table
ALTER TABLE univ_pharmacy_controlled_substances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pharmacy_controlled_read" ON univ_pharmacy_controlled_substances
  FOR SELECT USING (company_id = auth.jwt() ->> 'company_id');

CREATE POLICY "pharmacy_controlled_write" ON univ_pharmacy_controlled_substances
  FOR INSERT WITH CHECK (company_id = auth.jwt() ->> 'company_id');

-- Shifts Table
ALTER TABLE univ_pharmacy_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pharmacy_shifts_read" ON univ_pharmacy_shifts
  FOR SELECT USING (company_id = auth.jwt() ->> 'company_id');

CREATE POLICY "pharmacy_shifts_write" ON univ_pharmacy_shifts
  FOR INSERT WITH CHECK (company_id = auth.jwt() ->> 'company_id');

-- Reconciliations Table
ALTER TABLE univ_pharmacy_reconciliations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pharmacy_reconciliations_read" ON univ_pharmacy_reconciliations
  FOR SELECT USING (company_id = auth.jwt() ->> 'company_id');

CREATE POLICY "pharmacy_reconciliations_write" ON univ_pharmacy_reconciliations
  FOR INSERT WITH CHECK (company_id = auth.jwt() ->> 'company_id');

-- Expiry Alerts Table
ALTER TABLE univ_pharmacy_expiry_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pharmacy_expiry_read" ON univ_pharmacy_expiry_alerts
  FOR SELECT USING (company_id = auth.jwt() ->> 'company_id');

CREATE POLICY "pharmacy_expiry_write" ON univ_pharmacy_expiry_alerts
  FOR INSERT WITH CHECK (company_id = auth.jwt() ->> 'company_id');

-- Audit Log Table
ALTER TABLE univ_pharmacy_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pharmacy_audit_read" ON univ_pharmacy_audit_log
  FOR SELECT USING (company_id = auth.jwt() ->> 'company_id');

CREATE POLICY "pharmacy_audit_write" ON univ_pharmacy_audit_log
  FOR INSERT WITH CHECK (company_id = auth.jwt() ->> 'company_id');

-- Analytics Table
ALTER TABLE univ_pharmacy_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pharmacy_analytics_read" ON univ_pharmacy_analytics
  FOR SELECT USING (company_id = auth.jwt() ->> 'company_id');

CREATE POLICY "pharmacy_analytics_write" ON univ_pharmacy_analytics
  FOR INSERT WITH CHECK (company_id = auth.jwt() ->> 'company_id');
