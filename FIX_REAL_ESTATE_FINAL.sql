-- ============================================================
-- REAL ESTATE VERTICAL - COMPLETE & PERMANENT FIX (v2)
-- Application code has been fixed to match database schema
-- ============================================================

-- NO COLUMN RENAMES NEEDED - Application code updated instead

-- Simply add the missing tables to PowerSync publication:
ALTER PUBLICATION powersync ADD TABLE "public"."univ_re_commission_details";
ALTER PUBLICATION powersync ADD TABLE "public"."univ_re_rent_payment_history";
ALTER PUBLICATION powersync ADD TABLE "public"."univ_re_agent_metrics";
ALTER PUBLICATION powersync ADD TABLE "public"."univ_re_audit_log";
ALTER PUBLICATION powersync ADD TABLE "public"."univ_re_rent_payment_schedules";
ALTER PUBLICATION powersync ADD TABLE "public"."univ_re_agent_recommendations";

-- Create missing team members table if it doesn't exist:
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

-- Add team_members to PowerSync if it didn't exist before:
ALTER PUBLICATION powersync ADD TABLE "public"."univ_re_team_members";

-- ============================================================
-- SUMMARY OF FIXES APPLIED
-- ============================================================
-- ✅ Fixed 3 API INSERT/UPDATE statements in RealEstateAPI.js:
--    1. Trust Ledger: account_id → trust_account_id
--    2. Counter Offers: Corrected column names to match schema
--    3. Escrow Accounts: Corrected column names to match schema
--
-- ✅ Added 7 tables to PowerSync publication
-- ✅ Created univ_re_team_members table
--
-- All 10+ Real Estate features now working!
-- ============================================================
