# Real Estate Vertical - Complete Issue Analysis & Fix

## Executive Summary

The Real Estate vertical has **5 critical database schema mismatches** that prevent data from being saved. The issues stem from column name discrepancies between:
1. Application code expectations
2. Database schema definitions
3. PowerSync sync rules

Additionally, there are **2 missing table references** in the sync rules that need correction.

---

## Issue #1: Counter Offers - Column Mismatch

**Error:** `table univ_re_counter_offers has no column named counter_price`

### Root Cause
- **Application expects:** `counter_price`
- **Database has:** `counter_offer_price`
- **Location:** Line 1 of errors

### Fix
Update database column name to match application expectations:
```sql
ALTER TABLE univ_re_counter_offers RENAME COLUMN counter_offer_price TO counter_price;
```

---

## Issue #2: Trust Ledger - Missing Account ID Column

**Error:** `table univ_re_trust_ledger has no column named account_id`

### Root Cause
- **Application expects:** `account_id`
- **Database has:** `trust_account_id`
- **Location:** Lines 48, 72, 95, 119 of errors

### Fix
Add missing column to match application expectations:
```sql
ALTER TABLE univ_re_trust_ledger ADD COLUMN account_id TEXT AFTER company_id;
```

Or better yet, update the application to use `trust_account_id` (which is already there).

---

## Issue #3: Escrow Accounts - Release Conditions Column

**Error:** `table univ_re_escrow_accounts has no column named release_conditions`

### Root Cause
- **Application expects:** `release_conditions`
- **Database has:** `conditions_for_release`
- **Location:** Lines 142, 166 of errors

### Fix
Add the missing column:
```sql
ALTER TABLE univ_re_escrow_accounts ADD COLUMN release_conditions JSONB AFTER escrow_agent_phone;
```

Or rename the existing column to match app expectations:
```sql
ALTER TABLE univ_re_escrow_accounts RENAME COLUMN conditions_for_release TO release_conditions;
```

---

## Issue #4: Commission Rules - Missing Description Column

**Error:** `table univ_re_commission_rules has no column named description`

### Root Cause
- **Application expects:** `description`
- **Database schema:** Does NOT include this column
- **Location:** Line 549 of errors

### Fix
Add the missing column:
```sql
ALTER TABLE univ_re_commission_rules ADD COLUMN description TEXT AFTER rule_type;
```

---

## Issue #5: NaN Parsing Errors

**Error:** `The specified value "NaN" cannot be parsed, or is out of range`

### Root Cause
- Numeric fields receiving invalid NaN values
- Likely from form calculations or API responses
- Multiple cascading errors in lines 189-548

### Fix
Application-level: Implement proper numeric validation
```typescript
// Before saving to database, ensure numeric fields are valid:
const escrowAmount = isNaN(amount) ? 0 : amount;
const commission = isNaN(commission) ? 0 : commission;
```

---

## Issue #6 & #7: Missing Table References in Sync Rules

**Error:** PowerSync cannot find references to tables that don't have corresponding tables:

### Missing Table 1: `univ_re_payment_schedules`
- **Location:** PowerSync rules line 327
- **Actual table in schema:** `univ_re_rent_payment_schedules`
- **Fix:** Update sync rules to use correct table name

### Missing Table 2: `univ_re_recommendations`
- **Location:** PowerSync rules line 335
- **Actual table in schema:** `univ_re_agent_recommendations`
- **Fix:** Update sync rules to use correct table name

---

## Complete SQL Fixes

Run these commands to fix all database issues:

```sql
-- Fix #1: Counter Offers column name
ALTER TABLE univ_re_counter_offers RENAME COLUMN counter_offer_price TO counter_price;

-- Fix #2: Trust Ledger - add account_id column
ALTER TABLE univ_re_trust_ledger ADD COLUMN account_id TEXT NOT NULL DEFAULT 'unknown' AFTER company_id;
-- Then add the foreign key constraint if needed
ALTER TABLE univ_re_trust_ledger ADD CONSTRAINT fk_trust_ledger_account FOREIGN KEY (account_id) REFERENCES univ_re_trust_accounts(id) ON DELETE CASCADE;

-- Fix #3: Escrow Accounts - rename conditions column
ALTER TABLE univ_re_escrow_accounts RENAME COLUMN conditions_for_release TO release_conditions;

-- Fix #4: Commission Rules - add description column
ALTER TABLE univ_re_commission_rules ADD COLUMN description TEXT AFTER rule_type;

-- Verify all tables exist and have correct columns
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'univ_re_%' 
ORDER BY table_name;

-- Check specific columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'univ_re_counter_offers';

SELECT column_name FROM information_schema.columns 
WHERE table_name = 'univ_re_trust_ledger';

SELECT column_name FROM information_schema.columns 
WHERE table_name = 'univ_re_escrow_accounts';

SELECT column_name FROM information_schema.columns 
WHERE table_name = 'univ_re_commission_rules';
```

---

## PowerSync Sync Rules - Corrections Needed

In your PowerSync sync rules YAML, make these corrections:

### Fix in sync rules around line 327:
**WRONG:**
```yaml
- SELECT * FROM univ_re_payment_schedules WHERE company_id = bucket.user_company_id
```

**CORRECT:**
```yaml
- SELECT * FROM univ_re_rent_payment_schedules WHERE company_id = bucket.user_company_id
```

### Fix in sync rules around line 335:
**WRONG:**
```yaml
- SELECT * FROM univ_re_recommendations WHERE company_id = bucket.user_company_id
```

**CORRECT:**
```yaml
- SELECT * FROM univ_re_agent_recommendations WHERE company_id = bucket.user_company_id
```

---

## Complete Corrected Real Estate Section for PowerSync

Here's the complete corrected sync rules for the Real Estate module:

```yaml
# REAL ESTATE MODULE - ALL TABLES (CORRECTED)
- SELECT * FROM univ_re_properties WHERE company_id = bucket.user_company_id
- SELECT * FROM univ_re_clients WHERE company_id = bucket.user_company_id
- SELECT * FROM univ_re_viewings WHERE company_id = bucket.user_company_id
- SELECT * FROM univ_re_offers WHERE company_id = bucket.user_company_id
- SELECT * FROM univ_re_transactions WHERE company_id = bucket.user_company_id
- SELECT * FROM univ_re_commissions WHERE company_id = bucket.user_company_id
- SELECT * FROM univ_re_documents WHERE company_id = bucket.user_company_id
- SELECT * FROM univ_re_leases WHERE company_id = bucket.user_company_id
- SELECT * FROM univ_re_rent_payments WHERE company_id = bucket.user_company_id
- SELECT * FROM univ_re_maintenance_requests WHERE company_id = bucket.user_company_id
- SELECT * FROM univ_re_commission_rules WHERE company_id = bucket.user_company_id
- SELECT * FROM univ_re_trust_accounts WHERE company_id = bucket.user_company_id
- SELECT * FROM univ_re_trust_ledger WHERE company_id = bucket.user_company_id
- SELECT * FROM univ_re_document_templates WHERE company_id = bucket.user_company_id
- SELECT * FROM univ_re_counter_offers WHERE company_id = bucket.user_company_id
- SELECT * FROM univ_re_rent_payment_schedules WHERE company_id = bucket.user_company_id
- SELECT * FROM univ_re_escrow_accounts WHERE company_id = bucket.user_company_id
- SELECT * FROM univ_re_market_data WHERE company_id = bucket.user_company_id
- SELECT * FROM univ_re_comparable_properties WHERE company_id = bucket.user_company_id
- SELECT * FROM univ_re_contractors WHERE company_id = bucket.user_company_id
- SELECT * FROM univ_re_contractor_reviews WHERE company_id = bucket.user_company_id
- SELECT * FROM univ_re_lease_renewals WHERE company_id = bucket.user_company_id
- SELECT * FROM univ_re_client_scoring WHERE company_id = bucket.user_company_id
- SELECT * FROM univ_re_agent_recommendations WHERE company_id = bucket.user_company_id
- SELECT * FROM univ_re_e_signatures WHERE company_id = bucket.user_company_id
- SELECT * FROM univ_re_commission_details WHERE company_id = bucket.user_company_id
- SELECT * FROM univ_re_rent_payment_history WHERE company_id = bucket.user_company_id
- SELECT * FROM univ_re_agent_metrics WHERE company_id = bucket.user_company_id
- SELECT * FROM univ_re_audit_log WHERE company_id = bucket.user_company_id
```

---

## Implementation Steps

### Step 1: Fix Database Schema
Execute all SQL ALTER statements above in your database

### Step 2: Fix Application Code
- Update all code that references the old column names:
  - `counter_offer_price` → `counter_price`
  - `trust_account_id` → `account_id` OR update queries to use `trust_account_id`
  - `conditions_for_release` → `release_conditions`
  - Add handling for `description` field in commission rules

### Step 3: Update PowerSync Rules
Replace your current sync rules with the corrected version above

### Step 4: Verify
1. Test creating counter offers
2. Test trust ledger entries
3. Test escrow account creation
4. Test commission rule creation
5. Verify all RE module features sync properly

---

## Prevention

To prevent similar issues in the future:

1. **Centralized Schema**: Keep a single source of truth for schema definitions
2. **Schema Validation**: Run schema validation against PowerSync before deployment
3. **Code Generation**: Use code generation tools to keep models in sync with database
4. **Naming Conventions**: Establish consistent naming (e.g., always use `account_id` not `trust_account_id`)
5. **Testing**: Create tests that verify all sync rules tables exist and match their actual database counterparts
