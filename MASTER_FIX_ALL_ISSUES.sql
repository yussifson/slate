-- ============================================================
-- MASTER FIX - ALL MODULES - COMPLETE SOLUTION
-- ============================================================
-- This script fixes ALL errors across Real Estate, audit logs, and PowerSync

-- ============================================================
-- PART 1: FIX REAL ESTATE TABLES - MISSING COLUMNS
-- ============================================================

ALTER TABLE univ_re_commission_rules ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE univ_re_lease_renewals ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE univ_re_rent_payment_schedules ADD COLUMN IF NOT EXISTS late_fee_type VARCHAR(50);

-- ============================================================
-- PART 2: FIX AUDIT_LOGS TABLE
-- ============================================================

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_id TEXT;

-- ============================================================
-- PART 3: ENSURE ENTITY_BEHAVIOUR_PROFILES EXISTS
-- ============================================================

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
  data_points_count INTEGER,
  profile_confidence DECIMAL(5, 2),
  computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_entity_behaviour_profiles_company ON entity_behaviour_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_entity_behaviour_profiles_entity ON entity_behaviour_profiles(entity_type, entity_id);
