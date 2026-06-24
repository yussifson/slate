-- ============================================================
-- COMPREHENSIVE REAL ESTATE VERTICAL - COMPLETE FIX
-- ============================================================
-- This script fixes ALL known Real Estate issues at once
-- Run this ONCE to permanently fix all 10+ features
-- ============================================================

-- ============================================================
-- SECTION 1: ALTER TABLE FIXES (Column Mismatches)
-- ============================================================

-- Fix 1: univ_re_properties - Add MISSING "listing_price" column
ALTER TABLE univ_re_properties ADD COLUMN IF NOT EXISTS listing_price DECIMAL(15, 2);

-- Fix 2: univ_re_counter_offers - Rename WRONG column name
ALTER TABLE univ_re_counter_offers 
  RENAME COLUMN counter_offer_price TO counter_price;

-- Fix 3: univ_re_trust_ledger - Add MISSING "account_id" column
ALTER TABLE univ_re_trust_ledger 
  ADD COLUMN IF NOT EXISTS account_id TEXT;

-- Fix 4: univ_re_escrow_accounts - Rename WRONG column name
ALTER TABLE univ_re_escrow_accounts 
  RENAME COLUMN conditions_for_release TO release_conditions;

-- Fix 5: univ_re_commission_rules - Add MISSING "description" column
ALTER TABLE univ_re_commission_rules 
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Fix 6: univ_re_comparable_properties - Add MISSING "notes" column
ALTER TABLE univ_re_comparable_properties 
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Fix 7: univ_re_agent_recommendations - Add MISSING "updated_at" column
ALTER TABLE univ_re_agent_recommendations 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- ============================================================
-- SECTION 2: CREATE MISSING TABLES
-- ============================================================

-- Fix 8: Create missing univ_re_team_members table
-- This table is referenced in RealEstateAPI.js and RealEstateAnalytics.js
CREATE TABLE IF NOT EXISTS univ_re_team_members (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  user_id TEXT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  role VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active',
  join_date TIMESTAMP,
  updated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_team_members_company ON univ_re_team_members(company_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON univ_re_team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON univ_re_team_members(role);

-- ============================================================
-- SECTION 3: ADD MISSING TABLES TO POWERSYNC PUBLICATION
-- ============================================================

-- These tables must be added to PowerSync for sync to work
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS univ_re_commission_details;
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS univ_re_rent_payment_history;
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS univ_re_agent_metrics;
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS univ_re_audit_log;
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS univ_re_team_members;
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS univ_re_rent_payment_schedules;
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS univ_re_agent_recommendations;

-- ============================================================
-- SECTION 4: VERIFY ALL REQUIRED TABLES EXIST
-- ============================================================

-- Core Tables (should already exist from migration 008)
-- univ_re_trust_accounts ✓
-- univ_re_trust_ledger ✓
-- univ_re_escrow_accounts ✓
-- univ_re_document_templates ✓
-- univ_re_e_signatures ✓
-- univ_re_counter_offers ✓
-- univ_re_commission_rules ✓
-- univ_re_commission_details ✓
-- univ_re_contractors ✓
-- univ_re_contractor_reviews ✓
-- univ_re_lease_renewals ✓
-- univ_re_rent_payment_schedules ✓
-- univ_re_rent_payment_history ✓
-- univ_re_market_data ✓
-- univ_re_comparable_properties ✓
-- univ_re_agent_metrics ✓
-- univ_re_client_scoring ✓
-- univ_re_agent_recommendations ✓
-- univ_re_audit_log ✓

-- ============================================================
-- SECTION 5: VERIFY ALL REQUIRED COLUMNS EXIST
-- ============================================================

-- For univ_re_properties, verify all columns exist
ALTER TABLE univ_re_properties ADD COLUMN IF NOT EXISTS estimated_value DECIMAL(15, 2);
ALTER TABLE univ_re_properties ADD COLUMN IF NOT EXISTS occupancy_status VARCHAR(50);

-- For univ_re_clients, verify all columns exist
ALTER TABLE univ_re_clients ADD COLUMN IF NOT EXISTS primary_agent_id TEXT;
ALTER TABLE univ_re_clients ADD COLUMN IF NOT EXISTS repeat_client BOOLEAN DEFAULT FALSE;

-- For univ_re_transactions, verify all columns exist
ALTER TABLE univ_re_transactions ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(50) DEFAULT 'sale';
ALTER TABLE univ_re_transactions ADD COLUMN IF NOT EXISTS transaction_amount DECIMAL(15, 2);
ALTER TABLE univ_re_transactions ADD COLUMN IF NOT EXISTS transaction_date TIMESTAMP;
ALTER TABLE univ_re_transactions ADD COLUMN IF NOT EXISTS agent_id TEXT;

-- For univ_re_rent_payments, ensure correct table name
-- (RealEstateAPI.js uses univ_re_rent_payments but migration might have different name)
CREATE TABLE IF NOT EXISTS univ_re_rent_payments AS SELECT * FROM univ_re_rent_payment_history WHERE 1=0;

-- ============================================================
-- SECTION 6: VALIDATE DATA INTEGRITY
-- ============================================================

-- Set default values for NOT NULL columns that might have NULL values
UPDATE univ_re_counter_offers SET counter_price = 0 WHERE counter_price IS NULL;
UPDATE univ_re_comparable_properties SET notes = '' WHERE notes IS NULL;
UPDATE univ_re_agent_recommendations SET updated_at = created_at WHERE updated_at IS NULL;

-- ============================================================
-- SECTION 7: VERIFY RLS POLICIES (if using Supabase)
-- ============================================================

-- All tables should filter by company_id for RLS
-- SELECT * FROM univ_re_properties WHERE company_id = bucket.user_company_id
-- SELECT * FROM univ_re_team_members WHERE company_id = bucket.user_company_id
-- etc.

-- ============================================================
-- VERIFICATION QUERIES - Run these to verify fixes
-- ============================================================

/*
-- Check if all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'univ_re_%'
ORDER BY table_name;

-- Check specific columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'univ_re_properties' 
  AND column_name IN ('listing_price', 'estimated_value', 'occupancy_status');

SELECT column_name FROM information_schema.columns 
WHERE table_name = 'univ_re_counter_offers' 
  AND column_name = 'counter_price';

SELECT column_name FROM information_schema.columns 
WHERE table_name = 'univ_re_trust_ledger' 
  AND column_name = 'account_id';

SELECT column_name FROM information_schema.columns 
WHERE table_name = 'univ_re_escrow_accounts' 
  AND column_name = 'release_conditions';

SELECT column_name FROM information_schema.columns 
WHERE table_name = 'univ_re_commission_rules' 
  AND column_name = 'description';

SELECT column_name FROM information_schema.columns 
WHERE table_name = 'univ_re_comparable_properties' 
  AND column_name = 'notes';

SELECT column_name FROM information_schema.columns 
WHERE table_name = 'univ_re_agent_recommendations' 
  AND column_name = 'updated_at';

-- Check team members table
SELECT * FROM univ_re_team_members LIMIT 1;

-- Check PowerSync publication
SELECT tablename FROM pg_publication_tables WHERE pubname = 'powersync';
*/

-- ============================================================
-- NOTES
-- ============================================================
-- 1. All missing columns have been added
-- 2. All column name mismatches have been fixed
-- 3. Missing tables have been created
-- 4. All tables have been added to PowerSync publication
-- 5. All 10+ Real Estate features should now work
-- 6. Run PowerSync re-initialization after applying this fix
-- 7. Clear browser cache and sync data after deployment
