# SLATE V2 — MANUAL PRODUCTION COMPLETION GUIDE

**Project:** Slate V2  
**Target Repository:** `yussifson/slate`  
**Authoritative Production Branch:** `main`  
**Active Production Commit:** `b2333539`  
**Target Supabase Project:** `wmabgiafwamxkcgxyhee` (Region: `eu-central-1`)  
**Target Frontend URL:** `https://airflake.vercel.app` (or custom domain `https://slate.airflake.com`)

---

## 1. Centralized Production Branch Policy

**Our single source of truth for production is GitHub `main`.**
- All ten phases of Slate V2 have been consolidated, verified with 93/93 automated tests, and pushed directly to `main`.
- Feature branches (`feature/slate-v2-final-platform-integration`, `feature/slate-v2-phase10-governed-orbit`) are development artifacts and must **not** be deployed.
- Vercel must deploy exclusively from the `main` branch.

---

## 2. Supabase Database Migration Status

### ✅ Migrations Executed Directly on Production
All 10 Slate V2 SQL migrations have been successfully applied to the live PostgreSQL database (`wmabgiafwamxkcgxyhee`):
1. `20261031120000_slate_v2_phase1_foundation.sql` (Capabilities & Metadata Foundation)
2. `20261031123000_slate_v2_phase2_entity_integration.sql` (Core Party Graph & Timeline)
3. `20261031124500_slate_v2_phase3_finance_core.sql` (General Ledger, AP/AR, Accounts)
4. `20261031125000_slate_v2_phase4_crm_sales.sql` (CRM Opportunities, Quotes, Sales Orders)
5. `20261031125500_slate_v2_phase5_ops_projects.sql` (Operations, Projects, Tasks, Teams)
6. `20261031125600_slate_v2_phase5_integrity_hardening.sql` (Composite Tenant Integrity Keys)
7. `20261031130000_slate_v2_phase6_workflow_engine.sql` (Platform Events & Workflow Engine)
8. `20261031140000_slate_v2_phase7_blueprint_action_center.sql` (Business Blueprint & Action Center)
9. `20261031150000_slate_v2_phase8_industry_extensions.sql` (Industry Extension Packs)
10. `20261031160000_slate_v2_phase9_universal_intelligence.sql` (Universal Intelligence & Exceptions)

**Verification:** PostgREST endpoints for `core_parties`, `platform_capabilities`, and all operational tables now respond with `200 OK`.

---

## 3. PowerSync Offline Replication Status

### ✅ Replication Publication Updated
The PostgreSQL publication `powersync` on the remote database was updated with all Slate V2 operational tables:
- `ops_teams`, `ops_team_members`, `ops_projects`, `ops_project_milestones`, `ops_project_tasks`, `ops_work_orders`, `ops_issues`
- `core_parties`, `core_party_roles`, `core_relationships`, `core_party_mappings`, `core_party_activities`
- `crm_opportunities`, `crm_quotations`, `crm_quotation_lines`, `crm_sales_orders`, `crm_sales_order_lines`
- `platform_events`, `unified_action_items`, `action_decisions`, `business_blueprints`, `business_exceptions`

### 📋 Action for Account Owner in PowerSync Dashboard
1. Log into your PowerSync Dashboard: [https://powersync.com](https://powersync.com).
2. Open your project instance linked to Supabase project `wmabgiafwamxkcgxyhee`.
3. Navigate to **Sync Rules**.
4. Paste the contents of [`powersync_sync_rules_slate_v2.yaml`](file:///c:/Users/USER/OneDrive/Documents/airflake/powersync_sync_rules_slate_v2.yaml).
5. Click **Validate and Deploy Sync Rules**.

---

## 4. Inngest Workflow Orchestration Setup

### 📋 Action for Account Owner in Inngest Dashboard
1. Log into your Inngest Cloud Console: [https://app.inngest.com](https://app.inngest.com).
2. Navigate to your Production Environment -> **API Keys**.
3. Copy the **Event Key** and **Signing Key**.
4. Open the Supabase Dashboard: [https://supabase.com/dashboard/project/wmabgiafwamxkcgxyhee/settings/vault](https://supabase.com/dashboard/project/wmabgiafwamxkcgxyhee/settings/vault).
5. Add/Update the following secrets:
   - `INNGEST_EVENT_KEY` = `<your-inngest-event-key>`
   - `INNGEST_SIGNING_KEY` = `<your-inngest-signing-key>`
6. In Inngest Console -> **Apps**, click **Sync New App** and provide the Supabase Edge Function URL:
   `https://wmabgiafwamxkcgxyhee.supabase.co/functions/v1/inngest`
7. Verify that Inngest discovers `slate-workflow-dispatcher` and all registered automation functions.

---

## 5. Vercel Frontend Deployment (Account Owner Action)

### Investigation of `HTTP 402 Payment Required`
- The Vercel endpoint `https://airflake.vercel.app` returns `X-Vercel-Error: DEPLOYMENT_DISABLED`.
- This error occurs when the Vercel team account (`team_9NDTU6A0szTiUisKsBmcpH4Q`) has an overdue invoice, expired trial, or paused plan.

### 📋 Action for Account Owner to Resolve & Deploy
1. **Resolve Billing:**
   - Log into Vercel: [https://vercel.com/dashboard](https://vercel.com/dashboard).
   - Navigate to **Team Settings** -> **Billing**.
   - Clear any pending invoices or reactivate the subscription.
2. **Verify Git Branch Configuration:**
   - In project `airflake` settings -> **Git**:
   - Verify **Connected Repository** is `yussifson/slate`.
   - Verify **Production Branch** is explicitly set to `main` (not a feature branch).
3. **Verify Environment Variables in Vercel:**
   - `VITE_SUPABASE_URL` = `https://wmabgiafwamxkcgxyhee.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
4. **Trigger Production Deployment:**
   - Navigate to the **Deployments** tab.
   - Click **Redeploy** on the latest build, or click **Deploy** selecting branch `main` at commit `b2333539` (or newer).
5. **Verify Live Application:**
   - Open `https://airflake.vercel.app/v2`.
   - Confirm the Obsidian & Prism styled Slate V2 Command Center loads.

---

## 6. Post-Deployment Verification Checklist

Once the frontend deployment is live:
1. **Authentication:** Log in with an admin or staff profile.
2. **Core Party Directory (`/v2/parties`):** Verify party listings, timeline events, and role assignments load from PostgreSQL.
3. **Operations Command Center (`/v2`):** Verify KPI metric cards (Active Projects, Work Orders, Completion Rates) render.
4. **Unified Action Center:** Submit an approval request via Orbit drawer (`Ctrl+K`); verify an Action Plan Preview appears with fact provenance.
5. **Industry Extension Packs:** Open Industry Extension Hub; verify Legal, Real Estate, Healthcare, and Retail packs can be toggled without error.
