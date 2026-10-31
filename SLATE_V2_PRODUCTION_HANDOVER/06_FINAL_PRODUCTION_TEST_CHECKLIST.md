# 06 — FINAL PRODUCTION TEST CHECKLIST

**Project:** Slate V2 Live Verification Checklist  
**Target:** Production Environment (`https://airflake.vercel.app` + `wmabgiafwamxkcgxyhee`)  

Execute the following live tests after applying the database migrations and reactivating the frontend:

---

## 1. Authentication & Tenant Boundary
- [ ] **Login:** Sign in with a valid tenant user account; confirm JWT token is issued and user profile loads.
- [ ] **Organization Session:** Confirm `company_id` is automatically set in application context deck.
- [ ] **Tenant Isolation (Security):** In the browser console, execute a Supabase query attempting to read rows with another company's ID:
  ```js
  const { data } = await supabase.from('core_parties').select('*').eq('company_id', '<other_tenant_id>');
  console.log(data); // Must return empty array []
  ```

---

## 2. Core Party & Universal Record Experience
- [ ] **Party Creation:** Navigate to `/v2/parties` and create a new Customer party (e.g. `Acme Holdings Ltd`).
- [ ] **Identity Mapping:** Verify party appears in `core_parties` and resolution entry exists in `party_identity_mappings`.
- [ ] **Universal Record Detail Drawer:** Click the party row; verify Overview, Timeline, and Relationships tabs render correctly without runtime exceptions.

---

## 3. Commercial-to-Operational End-to-End Flow
- [ ] **Lead to Deal:** In `/v2/crm`, create a Lead → Qualify to Deal.
- [ ] **Quotation & Order:** Create a Quote with line items → Issue Quote → Convert to Confirmed Order.
- [ ] **Project Handoff:** Click "Create Operational Project" from the Order.
- [ ] **Milestone & Tasks:** Confirm Project is created in `/v2/command-center` with corresponding auto-generated tasks.

---

## 4. Finance & Idempotency Invariants
- [ ] **Invoice Issuance:** Create and post an Invoice in `/v2/finance`.
- [ ] **General Ledger Entries:** Confirm balanced debit and credit entries are generated.
- [ ] **Duplicate Suppression:** Trigger a payment or status change twice with the same idempotency key; confirm system returns `{ duplicate: true }` or skips second transaction without double debiting.

---

## 5. Workflow Engine & Outbox Dispatch
- [ ] **Event Enqueue:** Perform a business action (e.g., status change); confirm record appears in `platform_events` with status `pending`.
- [ ] **Dispatch & Inngest:** Confirm dispatcher claims event, transitions status to `completed`, and Inngest dashboard displays execution run.

---

## 6. Governed Orbit & Action Center
- [ ] **Action Center Items:** Navigate to `/v2/action-center`; verify pending approvals appear in queue.
- [ ] **Governed Execution Gate:** In Governed Orbit, request a high-risk tool call (e.g., invoice reversal); confirm system stops at `APPROVAL_REQUIRED` until confirmed by authorized user.

---

## 7. CliPad Isolation
- [ ] **CliPad Navigation:** Navigate to `/clipad`; confirm CliPad dashboard, recordings, and workspace remain completely intact, operational, and unaffected by Slate V2.
