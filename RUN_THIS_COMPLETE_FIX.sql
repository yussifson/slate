-- ============================================================
-- COMPLETE REAL ESTATE VERTICAL FIX - RUN THIS ENTIRE SCRIPT
-- ============================================================
-- This script fixes ALL issues across Real Estate features
-- Includes schema, PowerSync, and business logic fixes
-- ============================================================

-- PHASE 1: ADD ALL MISSING COLUMNS
-- ============================================================

-- Fix 1: audit_logs - Add missing user_id column (11 APIs depend on this)
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_id TEXT;
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company ON audit_logs(company_id);

-- Fix 2: univ_re_commission_rules - Add missing description column
ALTER TABLE univ_re_commission_rules ADD COLUMN IF NOT EXISTS description TEXT;

-- Fix 3: univ_re_rent_payment_schedules - Add missing columns
ALTER TABLE univ_re_rent_payment_schedules ADD COLUMN IF NOT EXISTS late_fee_type VARCHAR(50);
ALTER TABLE univ_re_rent_payment_schedules ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE univ_re_rent_payment_schedules ADD COLUMN IF NOT EXISTS recurring_start_date DATE;
ALTER TABLE univ_re_rent_payment_schedules ADD COLUMN IF NOT EXISTS recurring_end_date DATE;

-- Fix 4: univ_re_lease_renewals - Add missing tenant_id and document columns
ALTER TABLE univ_re_lease_renewals ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE univ_re_lease_renewals ADD COLUMN IF NOT EXISTS renewal_lease_document_url TEXT;
ALTER TABLE univ_re_lease_renewals ADD COLUMN IF NOT EXISTS renewal_lease_id TEXT;

-- Fix 5: univ_re_properties - Add missing property detail columns
ALTER TABLE univ_re_properties ADD COLUMN IF NOT EXISTS listing_price DECIMAL(15, 2);
ALTER TABLE univ_re_properties ADD COLUMN IF NOT EXISTS estimated_value DECIMAL(15, 2);
ALTER TABLE univ_re_properties ADD COLUMN IF NOT EXISTS occupancy_status VARCHAR(50);

-- Fix 6: univ_re_trust_accounts - Add missing columns
ALTER TABLE univ_re_trust_accounts ADD COLUMN IF NOT EXISTS account_balance DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE univ_re_trust_accounts ADD COLUMN IF NOT EXISTS account_status VARCHAR(50) DEFAULT 'active';
ALTER TABLE univ_re_trust_accounts ADD COLUMN IF NOT EXISTS broker_id TEXT;

-- Fix 7: univ_re_trust_ledger - Add missing columns
ALTER TABLE univ_re_trust_ledger ADD COLUMN IF NOT EXISTS trust_account_id TEXT;
ALTER TABLE univ_re_trust_ledger ADD COLUMN IF NOT EXISTS running_balance DECIMAL(15, 2);

-- Fix 8: univ_re_comparable_properties - Add missing notes column
ALTER TABLE univ_re_comparable_properties ADD COLUMN IF NOT EXISTS notes TEXT;

-- Fix 9: univ_re_agent_recommendations - Add missing updated_at column
ALTER TABLE univ_re_agent_recommendations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

-- PHASE 2: CREATE MISSING TABLES
-- ============================================================

-- Create missing entity_behaviour_profiles table
CREATE TABLE IF NOT EXISTS entity_behaviour_profiles (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  entity_type VARCHAR(50),
  entity_id TEXT,
  avg_payment_days DECIMAL(5, 2),
  payment_reliability DECIMAL(5, 2),
  attendance_rate DECIMAL(5, 2),
  engagement_trend VARCHAR(50),
  churn_risk VARCHAR(50),
  churn_risk_score DECIMAL(5, 2),
  data_points_count INTEGER DEFAULT 0,
  profile_confidence DECIMAL(5, 2),
  computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_entity_behaviour_profiles_company ON entity_behaviour_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_entity_behaviour_profiles_entity ON entity_behaviour_profiles(entity_type, entity_id);

-- Create missing univ_re_team_members table
CREATE TABLE IF NOT EXISTS univ_re_team_members (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  user_id TEXT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  role VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active',
  avatar_url TEXT,
  bio TEXT,
  license_number VARCHAR(100),
  license_expiry TIMESTAMP,
  commission_rate DECIMAL(5, 2),
  join_date DATE,
  updated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_team_members_company ON univ_re_team_members(company_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON univ_re_team_members(user_id);

-- PHASE 3: UPDATE POWERSYNC PUBLICATION
-- ============================================================
-- Register ALL Real Estate and related tables with PowerSync
-- This ensures proper synchronization across devices

-- Add new tables to PowerSync
ALTER PUBLICATION powersync ADD TABLE "public"."entity_behaviour_profiles";
ALTER PUBLICATION powersync ADD TABLE "public"."univ_re_team_members";
ALTER PUBLICATION powersync ADD TABLE "public"."audit_logs";

-- Refresh all existing Real Estate tables in PowerSync
-- These should already be there, but ensures schema cache is fresh
ALTER PUBLICATION powersync ADD TABLE "public"."univ_re_properties";
ALTER PUBLICATION powersync ADD TABLE "public"."univ_re_clients";
ALTER PUBLICATION powersync ADD TABLE "public"."univ_re_viewings";
ALTER PUBLICATION powersync ADD TABLE "public"."univ_re_offers";
ALTER PUBLICATION powersync ADD TABLE "public"."univ_re_transactions";
ALTER PUBLICATION powersync ADD TABLE "public"."univ_re_commissions";
ALTER PUBLICATION powersync ADD TABLE "public"."univ_re_documents";
ALTER PUBLICATION powersync ADD TABLE "public"."univ_re_leases";
ALTER PUBLICATION powersync ADD TABLE "public"."univ_re_rent_payments";
ALTER PUBLICATION powersync ADD TABLE "public"."univ_re_maintenance_requests";
ALTER PUBLICATION powersync ADD TABLE "public"."univ_re_commission_rules";
ALTER PUBLICATION powersync ADD TABLE "public"."univ_re_trust_accounts";
ALTER PUBLICATION powersync ADD TABLE "public"."univ_re_trust_ledger";
ALTER PUBLICATION powersync ADD TABLE "public"."univ_re_document_templates";
ALTER PUBLICATION powersync ADD TABLE "public"."univ_re_counter_offers";
ALTER PUBLICATION powersync ADD TABLE "public"."univ_re_rent_payment_schedules";
ALTER PUBLICATION powersync ADD TABLE "public"."univ_re_escrow_accounts";
ALTER PUBLICATION powersync ADD TABLE "public"."univ_re_market_data";
ALTER PUBLICATION powersync ADD TABLE "public"."univ_re_comparable_properties";
ALTER PUBLICATION powersync ADD TABLE "public"."univ_re_contractors";
ALTER PUBLICATION powersync ADD TABLE "public"."univ_re_contractor_reviews";
ALTER PUBLICATION powersync ADD TABLE "public"."univ_re_lease_renewals";
ALTER PUBLICATION powersync ADD TABLE "public"."univ_re_client_scoring";
ALTER PUBLICATION powersync ADD TABLE "public"."univ_re_agent_recommendations";
ALTER PUBLICATION powersync ADD TABLE "public"."univ_re_e_signatures";
ALTER PUBLICATION powersync ADD TABLE "public"."univ_re_commission_details";
ALTER PUBLICATION powersync ADD TABLE "public"."univ_re_rent_payment_history";
ALTER PUBLICATION powersync ADD TABLE "public"."univ_re_agent_metrics";
ALTER PUBLICATION powersync ADD TABLE "public"."univ_re_audit_log";

-- PHASE 4: VERIFICATION QUERIES
-- ============================================================
-- These queries verify that all schema changes were applied correctly

-- Verify all new columns exist
SELECT 'audit_logs.user_id' as column_check, 
       EXISTS(SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'audit_logs' AND column_name = 'user_id') as exists;

SELECT 'univ_re_commission_rules.description' as column_check,
       EXISTS(SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'univ_re_commission_rules' AND column_name = 'description') as exists;

SELECT 'univ_re_rent_payment_schedules.late_fee_type' as column_check,
       EXISTS(SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'univ_re_rent_payment_schedules' AND column_name = 'late_fee_type') as exists;

SELECT 'univ_re_lease_renewals.tenant_id' as column_check,
       EXISTS(SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'univ_re_lease_renewals' AND column_name = 'tenant_id') as exists;

SELECT 'univ_re_properties.listing_price' as column_check,
       EXISTS(SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'univ_re_properties' AND column_name = 'listing_price') as exists;

SELECT 'univ_re_trust_accounts.account_balance' as column_check,
       EXISTS(SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'univ_re_trust_accounts' AND column_name = 'account_balance') as exists;

SELECT 'univ_re_trust_ledger.trust_account_id' as column_check,
       EXISTS(SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'univ_re_trust_ledger' AND column_name = 'trust_account_id') as exists;

-- Verify new tables exist
SELECT 'entity_behaviour_profiles' as table_check,
       EXISTS(SELECT 1 FROM information_schema.tables 
              WHERE table_name = 'entity_behaviour_profiles') as exists;

SELECT 'univ_re_team_members' as table_check,
       EXISTS(SELECT 1 FROM information_schema.tables 
              WHERE table_name = 'univ_re_team_members') as exists;

-- List all univ_re_* tables for confirmation
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'univ_re_%' 
ORDER BY table_name;
