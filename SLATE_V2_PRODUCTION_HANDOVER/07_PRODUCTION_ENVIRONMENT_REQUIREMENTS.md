# 07 — PRODUCTION ENVIRONMENT REQUIREMENTS & SECRETS AUDIT

**Project:** Slate V2  
**Target Environments:** Supabase (`wmabgiafwamxkcgxyhee`) & Vercel (`airflake`)  
**Security Invariant:** Zero secret values disclosed in this document.  

---

## 1. Summary of Environment Secrets Status

| Service / Domain | Secret / Variable Name | Target Scope | Current Status | Providing Provider |
|---|---|---|---|---|
| **Supabase Client** | `VITE_SUPABASE_URL` | Vercel Client (Public) | **Configured** | Supabase Project Settings |
| **Supabase Client** | `VITE_SUPABASE_ANON_KEY` | Vercel Client (Public) | **Configured** | Supabase Project API Keys |
| **Supabase Server** | `SUPABASE_SERVICE_ROLE_KEY` | Supabase Functions (Secret) | **Configured** | Supabase Project API Keys |
| **Inngest Engine** | `INNGEST_EVENT_KEY` | Supabase Functions (Secret) | **MISSING** | [Inngest Dashboard](https://app.inngest.com) |
| **Inngest Engine** | `INNGEST_SIGNING_KEY` | Supabase Functions (Secret) | **MISSING** | [Inngest Dashboard](https://app.inngest.com) |
| **Paystack (Finance)** | `VITE_PAYSTACK_PUBLIC_KEY` | Vercel Client (Public) | **Configured** | Paystack Dashboard |
| **Paystack (Finance)** | `PAYSTACK_SECRET_KEY` | Supabase Functions (Secret) | **Configured** | Paystack Dashboard |
| **Stripe (Finance)** | `STRIPE_PUBLISHABLE_KEY` | Vercel Client (Public) | **Configured** | Stripe Dashboard |
| **Stripe (Finance)** | `STRIPE_CLIENT_ID` / Keys | Supabase Functions (Secret) | **Configured** | Stripe Dashboard |
| **Cloudflare AI** | `CLOUDFLARE_API_TOKEN` | Supabase Functions (Secret) | **Configured** | Cloudflare Dashboard |
| **Email Service** | `RESEND_API_KEY` | Supabase Functions (Secret) | **Configured** | Resend Dashboard |
| **Notifications** | `NOVU_API_KEY` | Supabase Functions (Secret) | **Configured** | Novu Dashboard |
| **Daily Video** | `DAILY_API_KEY` | Supabase Functions (Secret) | **Configured** | Daily.co Dashboard |

---

## 2. Missing Credentials Remediation Guide

Only **two credentials** require provisioning to achieve 100% backend configuration:

### 1. `INNGEST_EVENT_KEY`
- **Where to obtain:** Inngest Cloud Dashboard → Select Environment → **Manage Keys** → **Event Keys**.
- **Where to configure:** Supabase Project `wmabgiafwamxkcgxyhee` → **Edge Function Secrets**.
- **Scope:** Server-side secret (Never expose to client).
- **Verification method:** Inspect `npx supabase secrets list` for secret name `INNGEST_EVENT_KEY`.

### 2. `INNGEST_SIGNING_KEY`
- **Where to obtain:** Inngest Cloud Dashboard → Select Environment → **Manage Keys** → **Signing Key**.
- **Where to configure:** Supabase Project `wmabgiafwamxkcgxyhee` → **Edge Function Secrets**.
- **Scope:** Server-side secret (Never expose to client).
- **Verification method:** Once configured, `GET /functions/v1/inngest` boots successfully with HTTP 200 instead of HTTP 503.

---

## 3. Public vs. Secret Variable Guidelines
- Any key prefixed with `VITE_` is bundled into the client browser build and must **never** contain private API keys, database passwords, or signing secrets.
- Server-side secrets must reside exclusively in Supabase Edge Function Secrets or secure backend server runtimes.
