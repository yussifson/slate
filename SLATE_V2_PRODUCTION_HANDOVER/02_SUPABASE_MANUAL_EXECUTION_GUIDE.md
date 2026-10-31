# 02 — SUPABASE MANUAL DATABASE EXECUTION GUIDE

**Project:** Slate V2  
**Target Supabase Project:** `wmabgiafwamxkcgxyhee` (`slate`)  
**Database URL:** `https://supabase.com/dashboard/project/wmabgiafwamxkcgxyhee`  
**Migration Directory:** `SLATE_V2_PRODUCTION_HANDOVER/sql_migrations/`  

---

## 1. Overview & Context

During automated deployment via the Supabase CLI (`supabase db push`), the tool detected that the remote migration history contains 20 legacy records that do not exist locally. Because repairing remote CLI migration tables requires the direct database password, the most reliable and transparent method to apply the 10 Slate V2 migrations is using the **Supabase Cloud SQL Editor**.

Every migration file is designed to be completely idempotent:
- `CREATE TABLE IF NOT EXISTS`
- `CREATE INDEX IF NOT EXISTS`
- Idempotent `DO $$ BEGIN ... END $$;` blocks for RLS policies
- Complete preservation of existing tables (including CliPad tables and profiles)

---

## 2. Pre-Execution Backup Check

1. Open your browser and navigate to:  
   `https://supabase.com/dashboard/project/wmabgiafwamxkcgxyhee/database/backups/scheduled`
2. Confirm that daily automated backups are active and a recent point-in-time snapshot exists.
3. If desired, take a manual table snapshot by running:
   ```sql
   -- Optional safety snapshot of companies and profiles
   CREATE TABLE IF NOT EXISTS _backup_companies_pre_slate_v2 AS SELECT * FROM companies;
   CREATE TABLE IF NOT EXISTS _backup_profiles_pre_slate_v2 AS SELECT * FROM profiles;
   ```

---

## 3. Step-by-Step SQL Execution Order

Open the **SQL Editor** in the Supabase Dashboard:  
`https://supabase.com/dashboard/project/wmabgiafwamxkcgxyhee/sql/new`

Execute the 10 SQL files located in `SLATE_V2_PRODUCTION_HANDOVER/sql_migrations/` in exact sequential order:

### Migration 1: Platform Foundation
- **File:** `20261031120000_slate_v2_phase1_foundation.sql`
- **Objects Created:** `core_parties`, `core_party_roles`, `core_relationships`, `platform_schemas`, `platform_attributes`, `platform_metadata_entries`, `platform_events`, `platform_event_subscribers`, `platform_roles`, `platform_user_roles`, `platform_permissions`.
- **Expected Result:** `Success. No rows returned.`

### Migration 2: Entity Integration & Identity Resolution
- **File:** `20261031123000_slate_v2_phase2_entity_integration.sql`
- **Objects Created:** `party_identity_mappings`, `party_activity_history`.
- **Expected Result:** `Success. No rows returned.`

### Migration 3: Finance & Accounting Core
- **File:** `20261031124500_slate_v2_phase3_finance_core.sql`
- **Objects Created:** `finance_accounts`, `finance_journal_entries`, `finance_invoices`, `finance_payments`.
- **Expected Result:** `Success. No rows returned.`

### Migration 4: CRM & Commercial Operations
- **File:** `20261031125000_slate_v2_phase4_crm_sales.sql`
- **Objects Created:** `crm_leads`, `crm_deals`, `crm_quotes`, `crm_quote_items`, `crm_orders`, `crm_order_items`.
- **Expected Result:** `Success. No rows returned.`

### Migration 5: Projects & Operations
- **File:** `20261031125500_slate_v2_phase5_ops_projects.sql`
- **Objects Created:** `ops_projects`, `ops_milestones`, `ops_tasks`, `ops_teams`, `ops_team_members`, `ops_work_orders`, `ops_issues`.
- **Expected Result:** `Success. No rows returned.`

### Migration 6: Operations Integrity Hardening
- **File:** `20261031125600_slate_v2_phase5_integrity_hardening.sql`
- **Objects Created:** Tenant cross-reference validation triggers, composite key constraints.
- **Expected Result:** `Success. No rows returned.`

### Migration 7: Workflow Engine
- **File:** `20261031130000_slate_v2_phase6_workflow_engine.sql`
- **Objects Created:** `workflow_definitions`, `workflow_executions`, `workflow_step_executions`, `workflow_dead_letters`.
- **Expected Result:** `Success. No rows returned.`

### Migration 8: Business Blueprint & Action Center
- **File:** `20261031140000_slate_v2_phase7_blueprint_action_center.sql`
- **Objects Created:** `business_blueprints`, `action_center_items`.
- **Expected Result:** `Success. No rows returned.`

### Migration 9: Industry Extensions
- **File:** `20261031150000_slate_v2_phase8_industry_extensions.sql`
- **Objects Created:** `industry_extensions`, `industry_extension_attributes`.
- **Expected Result:** `Success. No rows returned.`

### Migration 10: Universal Intelligence & Trigram Indexes
- **File:** `20261031160000_slate_v2_phase9_universal_intelligence.sql`
- **Objects Created:** `business_exceptions`, `business_activity_timeline`, trigram search extension and indexes on `core_parties`.
- **Expected Result:** `Success. No rows returned.`

---

## 4. Verification Queries

After applying all 10 scripts, paste and run the following verification query in the SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'core_parties',
    'party_identity_mappings',
    'finance_accounts',
    'crm_leads',
    'ops_projects',
    'workflow_executions',
    'business_blueprints',
    'action_center_items',
    'industry_extensions',
    'business_exceptions'
  )
ORDER BY table_name;
```

**Expected Result:** All 10 table names must be returned in the results grid.

---

## 5. Forward Recovery & Support

- If any statement errors with `relation already exists`, it is safe to proceed because tables are defined with `IF NOT EXISTS`.
- If a constraint or policy reports a conflict, the scripts use defensive `DO $$ BEGIN ... END $$;` blocks that silently handle existing policies without throwing fatal abort errors.
