# 05 — POWERSYNC PRODUCTION CONFIGURATION GUIDE

**Project:** Slate V2 Offline Replication  
**Target PowerSync Instance:** Production Project  
**Reference File:** `powersync_sync_rules_aligned.yaml`  

---

## 1. Overview & Sync Scope

PowerSync replicates server PostgreSQL data to client SQLite databases (OPFS in browsers and SQLite on mobile/desktop), enabling offline-first operation.

For Slate V2, the sync rules encompass:
- Core Parties & Identity Mappings (`core_parties`, `core_party_roles`, `core_relationships`, `party_identity_mappings`)
- Financial Operations (`finance_accounts`, `finance_journal_entries`, `finance_invoices`, `finance_payments`)
- Commercial CRM (`crm_leads`, `crm_deals`, `crm_quotes`, `crm_orders`)
- Operations & Projects (`ops_projects`, `ops_milestones`, `ops_tasks`, `ops_teams`)
- Action Center & Exceptions (`action_center_items`, `business_exceptions`)

---

## 2. PowerSync Dashboard Configuration

1. Log in to the PowerSync Dashboard at:  
   `https://powersync.journeyapps.com`
2. Select your production project.
3. Navigate to **Sync Rules**.
4. Open [`powersync_sync_rules_aligned.yaml`](../powersync_sync_rules_aligned.yaml) in your repository and copy the complete content.
5. Paste into the PowerSync Dashboard Sync Rules editor.
6. Click **Validate** to verify syntax and table matching.
7. Click **Deploy Changes**.

---

## 3. Postgres Publication Verification

In the Supabase SQL Editor (`https://supabase.com/dashboard/project/wmabgiafwamxkcgxyhee/sql`), verify that the `powersync` publication includes the required Slate V2 tables:

```sql
-- Check current tables in the publication
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'powersync';

-- If any new Slate V2 tables are not yet present, add them:
ALTER PUBLICATION powersync ADD TABLE 
  core_parties,
  core_party_roles,
  core_relationships,
  party_identity_mappings,
  finance_accounts,
  finance_invoices,
  finance_payments,
  crm_leads,
  crm_deals,
  crm_quotes,
  crm_orders,
  ops_projects,
  ops_milestones,
  ops_tasks,
  ops_teams,
  action_center_items,
  business_exceptions;
```

---

## 4. Verification

1. Open the PowerSync Dashboard **Diagnostics** / **Connected Clients** tab.
2. Log in to the application as an authenticated tenant user.
3. Confirm that the client connects, syncs buckets, and populates the local SQLite database without `PGRST204` or sync error alerts.
