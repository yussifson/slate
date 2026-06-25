-- ============================================================
-- PHASE 1: DATABASE SCHEMA FIXES - ALL MISSING COLUMNS
-- ============================================================
-- This script adds all missing columns that the application code expects

-- FIX 1: audit_logs - Add missing user_id column (11 APIs depend on this)
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_id TEXT;
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- FIX 2: univ_re_commission_rules - Add missing description column
ALTER TABLE univ_re_commission_rules ADD COLUMN IF NOT EXISTS description TEXT;

-- FIX 3: univ_re_rent_payment_schedules - Add missing columns
ALTER TABLE univ_re_rent_payment_schedules ADD COLUMN IF NOT EXISTS late_fee_type VARCHAR(50);
ALTER TABLE univ_re_rent_payment_schedules ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE univ_re_rent_payment_schedules ADD COLUMN IF NOT EXISTS recurring_start_date DATE;
ALTER TABLE univ_re_rent_payment_schedules ADD COLUMN IF NOT EXISTS recurring_end_date DATE;

-- FIX 4: univ_re_lease_renewals - Add missing tenant_id column
ALTER TABLE univ_re_lease_renewals ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE univ_re_lease_renewals ADD COLUMN IF NOT EXISTS renewal_lease_document_url TEXT;
ALTER TABLE univ_re_lease_renewals ADD COLUMN IF NOT EXISTS renewal_lease_id TEXT;

-- FIX 5: univ_re_escrow_accounts - Verify conditions_for_release exists
ALTER TABLE univ_re_escrow_accounts ADD COLUMN IF NOT EXISTS conditions_for_release JSONB;

-- FIX 6: univ_re_properties - Add missing columns for API operations
ALTER TABLE univ_re_properties ADD COLUMN IF NOT EXISTS listing_price DECIMAL(15, 2);
ALTER TABLE univ_re_properties ADD COLUMN IF NOT EXISTS estimated_value DECIMAL(15, 2);
ALTER TABLE univ_re_properties ADD COLUMN IF NOT EXISTS occupancy_status VARCHAR(50);

-- FIX 7: univ_re_trust_accounts - Add missing columns
ALTER TABLE univ_re_trust_accounts ADD COLUMN IF NOT EXISTS account_balance DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE univ_re_trust_accounts ADD COLUMN IF NOT EXISTS account_status VARCHAR(50) DEFAULT 'active';
ALTER TABLE univ_re_trust_accounts ADD COLUMN IF NOT EXISTS broker_id TEXT;

-- FIX 8: univ_re_trust_ledger - Add missing columns
ALTER TABLE univ_re_trust_ledger ADD COLUMN IF NOT EXISTS trust_account_id TEXT;
ALTER TABLE univ_re_trust_ledger ADD COLUMN IF NOT EXISTS running_balance DECIMAL(15, 2);

-- FIX 9: univ_re_comparable_properties - Add missing columns
ALTER TABLE univ_re_comparable_properties ADD COLUMN IF NOT EXISTS notes TEXT;

-- FIX 10: univ_re_agent_recommendations - Add missing columns
ALTER TABLE univ_re_agent_recommendations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

-- FIX 11: Create missing entity_behaviour_profiles table
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

-- FIX 12: Create missing univ_re_team_members table
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

-- Verification: Print all univ_re_* tables that should have company_id for PowerSync
-- This confirms the schema structure for the next phase
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'univ_re_%' 
ORDER BY table_name;
