# 04 — VERCEL FRONTEND DEPLOYMENT GUIDE

**Project:** Slate V2 Frontend  
**Repository:** `yussifson/slate`  
**Authoritative Production Branch:** `main`  
**Target Domain:** `https://airflake.vercel.app`  
**Vercel Project:** `airflake` (`prj_zlUN1JoveVFAB0iJrWsLwubZDWNx`)  
**Vercel Team:** `team_9NDTU6A0szTiUisKsBmcpH4Q`  

---

## 1. Investigation of Deployment Restriction

During automated deployment verification, probing `https://airflake.vercel.app` returned:
```
HTTP 402 Payment Required
DEPLOYMENT_DISABLED
fra1::hq9p8-1793456176183-884dcca4d82e
```

### Root Cause
This error code indicates that the Vercel team account has a billing or subscription restriction (e.g., past due invoice, expired card, or paused team usage). This is an account-level restriction and is independent of the codebase or Git branch configuration.

---

## 2. Resolving the Billing Restriction

1. Log in to Vercel at:  
   `https://vercel.com`
2. Select team: **`team_9NDTU6A0szTiUisKsBmcpH4Q`** (or your primary organization team).
3. Navigate to **Team Settings** → **Billing**:  
   `https://vercel.com/teams/team_9NDTU6A0szTiUisKsBmcpH4Q/settings/billing`
4. Review any pending invoices or update the active payment method.
5. Once payment is processed, Vercel will immediately lift the `DEPLOYMENT_DISABLED` restriction.

---

## 3. Verifying Repository & Production Branch Configuration

Our production architecture policy mandates **one centralized production branch: `main`**.

1. Navigate to:  
   `https://vercel.com/team_9NDTU6A0szTiUisKsBmcpH4Q/airflake/settings/git`
2. Confirm the Git settings:
   - **Connected Repository:** `yussifson/slate` (ensure it points to the authoritative GitHub repo).
   - **Production Branch:** `main` (do **not** set to any feature branch).

---

## 4. Environment Variables Checklist in Vercel

Under **Project Settings** → **Environment Variables**, ensure the following variables are present for the **Production** environment:

| Variable Name | Value / Format | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://wmabgiafwamxkcgxyhee.supabase.co` | Supabase endpoint |
| `VITE_SUPABASE_ANON_KEY` | *(Production anon JWT key)* | Client Supabase access |
| `VITE_PAYSTACK_PUBLIC_KEY` | `pk_live_...` or test key | Client payment initiation |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_...` or test key | Client card collection |

*(Never add secret keys like `SUPABASE_SERVICE_ROLE_KEY` or `STRIPE_SECRET_KEY` with a `VITE_` prefix).*

---

## 5. Triggering Production Deployment

Once billing is reactivated:

### Option A: Via GitHub Push (Automatic)
The latest release commit (`57b17d17`) is already pushed to GitHub `main`.
If automatic deployments are enabled on Git push, unfreezing the account may automatically queue the build, or pushing an empty commit will trigger it:
```bash
git commit --allow-empty -m "chore: trigger production vercel build"
git push origin main
```

### Option B: Via Vercel Dashboard (Instant)
1. Go to: `https://vercel.com/team_9NDTU6A0szTiUisKsBmcpH4Q/airflake/deployments`
2. Click **Create Deployment**.
3. Select branch: `main`.
4. Click **Deploy**.

---

## 6. Verification After Deployment

1. Visit: `https://airflake.vercel.app`
2. Confirm that the site returns HTTP `200 OK` and loads the Slate V2 application shell.
3. Test a route refresh (e.g. `/v2/command-center` or `/v2/crm`) to verify SPA rewrites configured in `vercel.json` are functioning without 404 errors.
