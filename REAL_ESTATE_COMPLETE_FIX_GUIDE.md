# Real Estate Vertical - Complete Fix Guide & Analysis

## Overview

This document provides a complete analysis and permanent fixes for the Real Estate vertical data persistence issues. All 10+ features are failing due to **database schema mismatches** and **PowerSync sync rule errors**.

---

## Critical Issues Summary

| Issue | Type | Impact | Status |
|-------|------|--------|--------|
| Counter Offers - wrong column name | Schema Mismatch | Cannot create counter offers | FIXABLE |
| Trust Ledger - missing account_id column | Schema Mismatch | Cannot create trust entries | FIXABLE |
| Escrow Accounts - wrong column name | Schema Mismatch | Cannot create escrow accounts | FIXABLE |
| Commission Rules - missing description | Schema Mismatch | Cannot create commission rules | FIXABLE |
| NaN numeric errors | Data Validation | Cascading errors on all saves | FIXABLE |
| PowerSync: wrong table reference (payment_schedules) | Sync Rule Error | Cannot sync properly | FIXABLE |
| PowerSync: wrong table reference (recommendations) | Sync Rule Error | Cannot sync properly | FIXABLE |

---

## Detailed Issues & Root Causes

### Issue 1: Counter Offers - Column Name Mismatch

**Error Message:**
```
[RE API] createCounterOffer failed: Error: table univ_re_counter_offers has no column named counter_price
```

**Root Cause:**
- Application code attempts to INSERT into column `counter_price`
- Database schema defines column as `counter_offer_price`

**Current Schema:**
```sql
CREATE TABLE univ_re_counter_offers (
  ...
  counter_offer_price DECIMAL(15, 2),  -- WRONG NAME
  ...
);
```

**Expected by App:**
```sql
counter_price DECIMAL(15, 2)
```

**Solution:**
```sql
ALTER TABLE univ_re_counter_offers RENAME COLUMN counter_offer_price TO counter_price;
```

---

### Issue 2: Trust Ledger - Missing Account ID Column

**Error Message:**
```
[RE API] createTrustLedgerEntry failed: Error: table univ_re_trust_ledger has no column named account_id
```

**Root Cause:**
- Application expects `account_id` foreign key
- Database schema only has `trust_account_id`
- Either naming inconsistency or incomplete migration

**Current Schema:**
```sql
CREATE TABLE univ_re_trust_ledger (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  trust_account_id TEXT NOT NULL,  -- Has this
  -- MISSING: account_id
  ...
);
```

**Solution Option A (Add column):**
```sql
ALTER TABLE univ_re_trust_ledger 
ADD COLUMN account_id TEXT NOT NULL DEFAULT '' AFTER company_id;

-- Add foreign key constraint
ALTER TABLE univ_re_trust_ledger 
ADD CONSTRAINT fk_trust_ledger_account_id 
FOREIGN KEY (account_id) REFERENCES univ_re_trust_accounts(id) ON DELETE CASCADE;
```

**Solution Option B (Better - Update application code):**
Update code to use `trust_account_id` instead of `account_id` since it's already there with proper foreign key.

---

### Issue 3: Escrow Accounts - Wrong Column Name

**Error Message:**
```
[RE API] createEscrowAccount failed: Error: table univ_re_escrow_accounts has no column named release_conditions
```

**Root Cause:**
- Application expects `release_conditions`
- Database schema defines as `conditions_for_release`

**Current Schema:**
```sql
CREATE TABLE univ_re_escrow_accounts (
  ...
  conditions_for_release JSONB,  -- WRONG NAME
  release_status VARCHAR(50) DEFAULT 'held',
  ...
);
```

**Solution:**
```sql
ALTER TABLE univ_re_escrow_accounts 
RENAME COLUMN conditions_for_release TO release_conditions;
```

---

### Issue 4: Commission Rules - Missing Description Column

**Error Message:**
```
[RE API] createCommissionRule failed: Error: table univ_re_commission_rules has no column named description
```

**Root Cause:**
- Application requires `description` field for commission rules
- Column not defined in migration schema

**Current Schema:**
```sql
CREATE TABLE univ_re_commission_rules (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  rule_name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(50),  -- After this, description should be
  -- MISSING: description TEXT
  property_types TEXT,
  ...
);
```

**Solution:**
```sql
ALTER TABLE univ_re_commission_rules 
ADD COLUMN description TEXT AFTER rule_type;
```

---

### Issue 5: NaN Parsing Errors

**Error Message:**
```
The specified value "NaN" cannot be parsed, or is out of range.
```

**Root Cause:**
- Numeric calculations result in NaN values
- Database rejects NaN as invalid number
- Cascades across multiple form submissions

**Affected Fields:**
- Escrow amounts
- Commission calculations  
- Payment amounts
- Pricing fields

**Solution (Application-Level):**

In your TypeScript/React code, add validation before database inserts:

```typescript
// Utility function for safe numeric conversion
export const safeNumber = (value: any, defaultValue: number = 0): number => {
  const num = Number(value);
  return !isNaN(num) && isFinite(num) ? num : defaultValue;
};

// Before saving to database:
const escrowData = {
  escrow_amount: safeNumber(formData.escrowAmount),
  earnest_money_change: safeNumber(formData.earnestMoneyChange),
  commission_percentage: safeNumber(formData.commission),
  // ... other fields
};
```

In your SQL INSERT statements, add safety checks:

```sql
INSERT INTO univ_re_escrow_accounts (
  escrow_amount,
  earnest_money_change,
  ...
) VALUES (
  COALESCE(NULLIF($1, 'NaN')::DECIMAL, 0),
  COALESCE(NULLIF($2, 'NaN')::DECIMAL, 0),
  ...
);
```

---

### Issue 6 & 7: PowerSync Sync Rules - Wrong Table References

**Error Message:**
```
Table "public"."univ_re_payment_schedules" not found.
Table "public"."univ_re_recommendations" not found.
```

**Root Cause:**
- PowerSync sync rules reference tables that don't exist
- Actual tables have different names in database

**Current Sync Rules (WRONG):**
```yaml
- SELECT * FROM univ_re_payment_schedules WHERE company_id = bucket.user_company_id  # Line 327
- SELECT * FROM univ_re_recommendations WHERE company_id = bucket.user_company_id     # Line 335
```

**Actual Database Tables:**
```
univ_re_rent_payment_schedules  (for payment schedules)
univ_re_agent_recommendations  (for recommendations)
```

**Solution:**
```yaml
# CORRECTED:
- SELECT * FROM univ_re_rent_payment_schedules WHERE company_id = bucket.user_company_id
- SELECT * FROM univ_re_agent_recommendations WHERE company_id = bucket.user_company_id
```

---

## Complete Database Fixes

### Step 1: Rename/Add Columns

Execute these SQL commands in order:

```sql
-- Fix 1: Counter Offers - Rename column
ALTER TABLE univ_re_counter_offers 
RENAME COLUMN counter_offer_price TO counter_price;

-- Fix 2: Trust Ledger - Add missing account_id column
ALTER TABLE univ_re_trust_ledger 
ADD COLUMN account_id TEXT NOT NULL DEFAULT '' AFTER company_id;

-- Add foreign key for referential integrity
ALTER TABLE univ_re_trust_ledger 
ADD CONSTRAINT fk_trust_ledger_account 
FOREIGN KEY (account_id) REFERENCES univ_re_trust_accounts(id) ON DELETE CASCADE;

-- Fix 3: Escrow Accounts - Rename column
ALTER TABLE univ_re_escrow_accounts 
RENAME COLUMN conditions_for_release TO release_conditions;

-- Fix 4: Commission Rules - Add description column
ALTER TABLE univ_re_commission_rules 
ADD COLUMN description TEXT AFTER rule_type;

-- Verify all fixes
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_name LIKE 'univ_re_%' 
  AND (column_name LIKE '%counter%' 
       OR column_name LIKE '%account%' 
       OR column_name LIKE '%release%'
       OR column_name LIKE '%description%')
ORDER BY table_name, column_name;
```

### Step 2: Verify Tables Exist

```sql
-- List all Real Estate tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'univ_re_%'
ORDER BY table_name;

-- Expected output should include:
-- univ_re_agent_metrics
-- univ_re_agent_recommendations  (NOT: univ_re_recommendations)
-- univ_re_audit_log
-- univ_re_client_scoring
-- univ_re_comparable_properties
-- univ_re_commission_details
-- univ_re_commission_rules
-- univ_re_contractors
-- univ_re_contractor_reviews
-- univ_re_counter_offers
-- univ_re_document_templates
-- univ_re_e_signatures
-- univ_re_escrow_accounts
-- univ_re_lease_renewals
-- univ_re_market_data
-- univ_re_rent_payment_history
-- univ_re_rent_payment_schedules  (NOT: univ_re_payment_schedules)
-- univ_re_trust_accounts
-- univ_re_trust_ledger
```

---

## PowerSync Sync Rules - Complete Corrected Real Estate Section

Replace the Real Estate section of your PowerSync sync rules with this corrected version:

```yaml
# REAL ESTATE MODULE - COMPLETE & CORRECTED
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

## Implementation Checklist

- [ ] **Phase 1: Database Schema Fixes**
  - [ ] Run SQL ALTER statements (rename/add columns)
  - [ ] Verify all columns exist with correct names
  - [ ] Verify all Real Estate tables exist
  - [ ] Check data integrity after column renames

- [ ] **Phase 2: Application Code Updates**
  - [ ] Update Counter Offers code: `counter_offer_price` → `counter_price`
  - [ ] Update Trust Ledger code: verify using `account_id` OR `trust_account_id`
  - [ ] Update Escrow code: `conditions_for_release` → `release_conditions`
  - [ ] Update Commission Rules code: handle new `description` field
  - [ ] Add NaN validation for all numeric fields
  - [ ] Test counter offer creation
  - [ ] Test trust ledger entry creation
  - [ ] Test escrow account creation
  - [ ] Test commission rule creation

- [ ] **Phase 3: PowerSync Configuration**
  - [ ] Update PowerSync sync rules with corrected table names
  - [ ] Replace `univ_re_payment_schedules` → `univ_re_rent_payment_schedules`
  - [ ] Replace `univ_re_recommendations` → `univ_re_agent_recommendations`
  - [ ] Deploy new sync rules to PowerSync
  - [ ] Verify all Real Estate tables sync correctly

- [ ] **Phase 4: Testing & Validation**
  - [ ] Test each Real Estate feature:
    1. Properties (create, read, update, delete)
    2. Clients (create, read, update, delete)
    3. Viewings (create, read, update, delete)
    4. Offers (create, read, update, delete)
    5. Transactions (create, read, update, delete)
    6. Commissions (create, read, update, delete)
    7. Trust Accounting (create entries, reconcile)
    8. Escrow Accounts (create, manage, release)
    9. Commission Rules (create, apply)
    10. Counter Offers (create, respond)
    11. Lease Management (create renewals, track payments)
    12. Market Intelligence (view data, comparables)
  - [ ] Verify no NaN errors
  - [ ] Verify PowerSync sync completes without errors
  - [ ] Verify offline sync works correctly

---

## Testing Queries

After applying fixes, run these queries to verify:

```sql
-- Verify counter offers table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'univ_re_counter_offers' 
ORDER BY ordinal_position;

-- Verify trust ledger has both columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'univ_re_trust_ledger' 
ORDER BY ordinal_position;

-- Verify escrow accounts structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'univ_re_escrow_accounts' 
ORDER BY ordinal_position;

-- Verify commission rules has description
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'univ_re_commission_rules' 
ORDER BY ordinal_position;

-- Verify rent payment schedules exists (NOT payment_schedules)
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_name IN (
  'univ_re_rent_payment_schedules',
  'univ_re_agent_recommendations'
);
-- Should return 2
```

---

## Prevention Strategy

To prevent similar issues in the future:

### 1. **Schema Generation from Types**
```typescript
// Keep single source of truth in TypeScript
export interface CounterOfferData {
  id: string;
  counter_price: number;  // Single definition
  closing_date?: Date;
  // ...
}

// Generate SQL schema from this
```

### 2. **Automated Schema Validation**
```bash
# Add to CI/CD pipeline
npm run validate:schema
# Checks PowerSync rules against actual database
# Checks application types against schema
```

### 3. **PowerSync Rule Validation**
```typescript
// Before deploying PowerSync rules
const validateSyncRules = (rules: string) => {
  const tableMatches = rules.match(/FROM\s+(\w+)\s+WHERE/gi);
  const tables = new Set(tableMatches.map(m => m.match(/FROM\s+(\w+)/)[1]));
  
  // Check each table exists in database
  for (const table of tables) {
    const exists = await checkTableExists(table);
    if (!exists) throw new Error(`Table not found: ${table}`);
  }
};
```

### 4. **Column Name Consistency**
Establish and enforce naming conventions:
- Use `column_name` not `columnName` in database
- Use camelCase in TypeScript/application code
- Use mapping layer to translate between them
- Document all mappings

### 5. **Integration Tests**
```typescript
// Test that all table references work
describe('Real Estate Sync Rules', () => {
  it('should have valid table references', async () => {
    const syncRules = loadSyncRules();
    const tables = parseTables(syncRules);
    
    for (const table of tables) {
      const result = await db.query(`SELECT COUNT(*) FROM ${table} LIMIT 1`);
      expect(result).toBeDefined();
    }
  });
});
```

---

## Files Reference

1. **REAL_ESTATE_FIX_ANALYSIS.md** - Detailed technical analysis
2. **POWERSYNC_SYNC_RULES_CORRECTED.yaml** - Corrected sync rules (copy to PowerSync)
3. **REAL_ESTATE_COMPLETE_FIX_GUIDE.md** - This file

---

## Support & Troubleshooting

### If counter offers still fail after fixes:
```sql
SELECT * FROM univ_re_counter_offers LIMIT 1;
-- Check if counter_price column exists
-- Check if data types match application expectations
```

### If trust ledger still fails:
```sql
SELECT * FROM univ_re_trust_ledger LIMIT 1;
-- Verify account_id column exists and has data
-- Check foreign key constraints
```

### If PowerSync still shows errors:
1. Clear PowerSync cache
2. Redeploy sync rules
3. Check PowerSync logs for specific table errors
4. Verify database credentials in PowerSync config

---

## Summary

The Real Estate vertical failures are caused by:
1. **Column naming mismatches** (4 issues) - SOLVED with ALTER statements
2. **Missing columns** (1 issue) - SOLVED with ADD COLUMN
3. **Data validation gaps** (NaN errors) - SOLVED with application-level checks
4. **Wrong sync rule references** (2 issues) - SOLVED with corrected table names

All issues are **completely fixable** with no data loss required. Apply the SQL changes, update application code, and redeploy PowerSync rules.
