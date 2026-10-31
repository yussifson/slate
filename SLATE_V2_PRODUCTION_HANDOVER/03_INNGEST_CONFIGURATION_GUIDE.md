# 03 — INNGEST PRODUCTION CONFIGURATION GUIDE

**Project:** Slate V2  
**Target Function:** `inngest` on Supabase (`wmabgiafwamxkcgxyhee`)  
**Inngest Dashboard:** `https://app.inngest.com`  

---

## 1. Overview & Current Status

The Slate V2 workflow automation engine uses Inngest to orchestrate background workflows, approvals, and transactional event dispatches.

- **Current Deployment Status:** The `inngest` Edge Function bundle has been successfully uploaded and compiled on Supabase project `wmabgiafwamxkcgxyhee`.
- **Runtime Requirement:** The Inngest Deno SDK requires two production environment variables at boot time. Until these are configured, invoking the endpoint yields `503 BOOT_ERROR`.

---

## 2. Where to Retrieve Production Inngest Credentials

1. Log in to your Inngest account at:  
   `https://app.inngest.com`
2. Select your production environment (e.g. `Production`).
3. Navigate to **Settings** → **API Keys** / **Signing Keys**:
   - **Event Key:** Copy the key prefixed with `inngest_` or your production event ingest key.
   - **Signing Key:** Copy the key prefixed with `signkey-prod-` or your production webhook signing key.

---

## 3. How to Configure the Secrets in Supabase

You can set these secrets either via the Supabase Dashboard or the CLI.

### Option A: Supabase Dashboard (Recommended)
1. Open your browser and go to:  
   `https://supabase.com/dashboard/project/wmabgiafwamxkcgxyhee/settings/functions`
2. Scroll to the **Secrets** section.
3. Click **Add new secret**:
   - Name: `INNGEST_EVENT_KEY`  
     Value: *(Paste your production event key)*
   - Name: `INNGEST_SIGNING_KEY`  
     Value: *(Paste your production signing key)*
4. Click **Save**.

### Option B: Supabase CLI
Run from your terminal:
```bash
npx supabase secrets set INNGEST_EVENT_KEY="<your_event_key>" INNGEST_SIGNING_KEY="<your_signing_key>" --project-ref wmabgiafwamxkcgxyhee
```

---

## 4. Registering the Endpoint in Inngest Cloud

1. In the Inngest Dashboard, navigate to **Apps** → **Create App** (or select your existing Slate app).
2. Set the **App ID**: `orbitflow-automation-engine` (matches `supabase/functions/inngest/client.ts`).
3. Set the **Webhook / Sync URL**:  
   `https://wmabgiafwamxkcgxyhee.supabase.co/functions/v1/inngest`
4. Click **Sync App** / **Verify**.

---

## 5. Verification Queries & Health Check

### Health Check (from terminal or browser):
```bash
curl -I https://wmabgiafwamxkcgxyhee.supabase.co/functions/v1/inngest
```
**Expected Output:** HTTP `200 OK` (with Inngest headers) instead of `503 BOOT_ERROR`.

### Function Discovery:
In the Inngest Dashboard under **Functions**, verify the following functions are registered:
- `slate-workflow-executor`
- `send-welcome-notification`
- `process-school-enrollment`
- `process-hospital-admission`
- `ai-workflow-step`
