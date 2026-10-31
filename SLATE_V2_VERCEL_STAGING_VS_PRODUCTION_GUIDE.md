# SLATE V2 — DUAL-ENVIRONMENT VERCEL DEPLOYMENT ARCHITECTURE
## Live Staging ("Test in Prod") vs. Stable Production

**Repository:** `yussifson/slate`  
**Production Branch:** `main`  
**Staging / Test Branch:** `staging`  
**Purpose:** Enable live, production-grade testing of all new builds and features without affecting the stable live production user base.

---

## 1. Architectural Overview

To ensure that new features are tested in the **exact same live environment** (real Supabase PostgreSQL, real authentication, real PowerSync replication) without risking the stable production system, we establish a **Two-Tier Vercel Deployment Strategy**:

```
[Developer / Agents]
        │
        ├── Push feature changes
        ▼
   [Branch: `staging`]
        │
        ▼ (Automatic Vercel Build & Deploy)
 🌐 STAGING ENVIRONMENT (Live Testing)
    URL: https://slate-staging.vercel.app (or custom staging domain)
    - Connected to live Supabase / PowerSync
    - Used for QA, end-to-end verification, stakeholder review
    - Isolated from live production customers
        │
        ├── Once 100% verified & approved
        ▼ (PR or Fast-Forward Merge)
   [Branch: `main`]
        │
        ▼ (Automatic Vercel Production Build)
 🚀 STABLE PRODUCTION ENVIRONMENT
    URL: https://airflake.vercel.app (or https://slate.airflake.com)
    - Receives only verified, battle-tested code
    - Zero unexpected broken builds or downtime
```

Both environments are **live**, running the exact same build pipeline (`vite build`), connecting to live cloud services, but separated by branch and deployment URL.

---

## 2. Branch Roles & Rules

| Branch | Environment | Deployment Trigger | Primary URL | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **`staging`** | **Staging (Preview/Test in Prod)** | Every push to `staging` | `https://<project-name>-staging.vercel.app` (or Preview URL) | Live interactive testing, regression testing, QA sign-off. |
| **`main`** | **Production (Live Stable)** | Merge from `staging` into `main` | `https://airflake.vercel.app` (or custom domain) | Customer-facing, high-availability, stable production. |

### Golden Rule:
> **Never push experimental or unverified changes directly to `main`. Always deploy to `staging` first, test live, and only merge to `main` when verified.**

---

## 3. How to Set This Up in Vercel (One-Time Setup)

You have two simple options in Vercel to manage this:

### Option A: Single Vercel Project with Custom Staging Domain (Recommended)
1. Go to your existing Vercel Project (**`airflake`**).
2. Go to **Settings** -> **Git**:
   - **Production Branch:** Leave as `main`.
3. Go to **Settings** -> **Domains**:
   - Add your production domain (e.g. `slate.airflake.com` or `airflake.vercel.app`) assigned to **Production** (`main`).
   - Add a staging domain (e.g. `staging.slate.airflake.com` or `airflake-staging.vercel.app`) and select **Branch:** `staging`.
4. **Result:**
   - Pushes to `staging` automatically deploy to the staging domain.
   - Pushes to `main` automatically deploy to the production domain.

### Option B: Two Separate Vercel Projects (Complete Isolation)
1. In Vercel, keep project **`slate-production`** connected to branch `main`.
2. Click **Add New...** -> **Project**, select `yussifson/slate`, and name it **`slate-staging`**.
3. Under **Build & Development Settings**, set **Production Branch** to `staging`.
4. Configure identical environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
5. **Result:** Two completely independent Vercel projects with dedicated dashboards, analytics, and URLs.

---

## 4. Standard Daily Workflow for You and Agents

### Step 1: Build & Deploy to Staging
When new work or fixes are ready:
```bash
git checkout staging
git merge <feature-branch>
git push origin staging
```
Vercel immediately builds and deploys to the **Live Staging URL**.

### Step 2: Test Live on Staging
Open your staging URL (e.g. `https://slate-staging.vercel.app/v2`).
- Test login, projects, finance, CRM, and Orbit.
- Verify everything works against the live database without fear of breaking customer traffic.

### Step 3: Promote to Stable Production
Once you are confident and say *"Yes, this build is 100% complete and working"*:
```bash
git checkout main
git merge staging --ff-only
git push origin main
```
Vercel automatically detects the update on `main` and deploys the verified build to the **Live Production URL**.

---

## 5. Current Git Status

- **`origin/main`:** Commit `080f08e3` (Stable production baseline with all 10 phases and database migrations applied).
- **`origin/staging`:** Pushed and tracking identical to `main`. Ready for Vercel staging deployment connection.
