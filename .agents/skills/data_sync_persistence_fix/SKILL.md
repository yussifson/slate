---
name: data_sync_persistence_fix
description: >
  Memory and fix guide for when data is not saving or syncing permanently in any industry
  vertical (real estate, hospital, logistics, etc.). Covers PowerSync hard errors such as
  PGRST204 (Could not find column in schema cache) and 400 Bad Request on PUT/POST.
  Also covers Supabase schema cache refresh and PowerSync sync rules YAML updates.
  Trigger this skill whenever the user says "data not saving", "not persisting",
  "hard error PUT/POST", "PGRST204", or "schema cache".
---

# Data Sync & Persistence Fix Playbook

## What It Means

When the app shows errors like:
- `[v0] PowerSync hard error PUT on univ_re_xxx: {code: 'PGRST204', msg: "Could not find the 'xxx' column"}`
- `POST https://<project>.supabase.co/rest/v1/<table>?on_conflict=id 400 (Bad Request)`
- `Cloud Sync Failed: null value in column "xxx" violates not-null constraint`

…it means one or more of the following:
1. A **column exists in the app code** (PowerSync schema / TypeScript model) but **does not exist in Supabase DB** (missing migration)
2. A **column exists in Supabase DB** but is **missing from the PowerSync sync rules YAML** — so it's not synced
3. A **NOT NULL column** in Supabase is missing a default value, and the app is not sending it

---

## Fix Procedure

### Step 1 — Identify which tables/columns are broken

**From browser console errors**, extract every `Could not find the 'COLUMN' column of 'TABLE'` message.

Also run a schema comparison:
```js
// Check what columns the app expects vs what Supabase has
const { data } = await supabase
  .from('information_schema.columns')
  .select('table_name, column_name')
  .eq('table_schema', 'public')
  .in('table_name', ['your_table_list']);
```

### Step 2 — Add missing columns to Supabase

Write an `ALTER TABLE` migration for each missing column:
```sql
-- Pattern: Always use IF NOT EXISTS
ALTER TABLE univ_re_example ADD COLUMN IF NOT EXISTS missing_col TEXT;
ALTER TABLE univ_re_example ADD COLUMN IF NOT EXISTS another_col TIMESTAMPTZ DEFAULT now();
```

Run via: `npx supabase db query --linked --file fix_migration.sql`

### Step 3 — Add missing columns to PowerSync sync rules YAML

In `supabase/functions/powersync/sync_rules.yaml` (or the active YAML file), add each new column to the corresponding table's `columns:` list. Then **redeploy**:
```bash
npx supabase functions deploy powersync --linked
```

### Step 4 — Reload sync in the app

After deploying, the app needs to re-sync. Either:
- Clear the browser's local PowerSync DB (DevTools → Application → IndexedDB → clear), or
- Trigger a full re-sync by signing out and back in

---

## Common Patterns by Industry

All industry-specific tables follow this pattern:
- Table prefix: `univ_<industry>_<entity>` (e.g. `univ_re_contractor_reviews`)
- Required columns almost always: `id UUID PK`, `company_id UUID`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`
- Columns the app generates locally: often `reviewer_id`, `signing_order`, `subject_property_id`, `status`, `notes`

### Real Estate specific fixes applied (July 2026)
Tables that needed columns added:
- `univ_re_contractor_reviews` → needed `reviewer_id`, `created_at`, `updated_at`
- `univ_re_e_signatures` → needed `signing_order`, `updated_at`, `status`, `document_url`
- `univ_re_comparable_properties` → needed `subject_property_id`, `updated_at`, `price_per_sqft`, `market_conditions`
- `univ_re_document_templates` → needed `template_type`, `content`, `is_active`
- `univ_re_audit_trail` → needed `action`, `record_type`, `performed_by`, `changes`

### Kanban / Board column moves not persisting
Issue: Items appear to move on screen but revert on refresh.
Cause: The `stage`/`status` column update triggers an upsert that fails if `updated_at` doesn't exist.
Fix: Add `updated_at TIMESTAMPTZ DEFAULT now()` to the relevant kanban table.

---

## Platform-wide Rule

> **Before launching any industry**, run the schema comparison script:
> `src/scripts/compare_schema.js` — it checks every table the app references
> against Supabase's `information_schema.columns` and prints the diff.

This prevents batch failures when entering a new industry vertical.

---

## Memory Note for Future Sessions

When the user says any of:
- "things are not saving"
- "data not persisting"  
- "PGRST204"
- "hard error PUT on <table>"
- "sync not working for [industry]"

**Do NOT fix one at a time.** Instead:
1. Scan ALL console errors for every failing table
2. Run the comprehensive schema check across ALL tables for that industry
3. Generate one SQL migration file that fixes everything at once
4. Run it, deploy sync rules, verify

This saves significant time vs iterating table-by-table.
