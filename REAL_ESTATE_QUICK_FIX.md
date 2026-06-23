# Real Estate - Quick Fix Reference

## The Problem
Data disappears on refresh because Real Estate tables weren't in Supabase database.

## The Solution (3 Steps)

### ✅ Step 1: Create Tables in Supabase (5 min)
```
1. Go to: app.supabase.com → Your Project → SQL Editor
2. New Query
3. Copy & paste entire SQL from:
   /vercel/share/v0-project/supabase/migrations/20260620000000_create_real_estate_tables.sql
4. Click "Run"
5. Verify no errors
```

### ✅ Step 2: Deploy PowerSync Rules (5 min)
```
1. Go to: dashboard.powersync.journeyapps.com
2. Select Slate workspace
3. Sync Rules → Edit
4. Replace with the Real Estate section from:
   /vercel/share/v0-project/powersync_sync_rules_dynamic.yaml
5. Find these 10 lines (around line 158):
   - univ_re_properties
   - univ_re_clients
   - univ_re_viewings
   - univ_re_offers
   - univ_re_transactions
   - univ_re_commissions
   - univ_re_documents
   - univ_re_leases
   - univ_re_rent_payments
   - univ_re_maintenance_requests
6. Click "Save & Deploy"
```

### ✅ Step 3: Clear Cache & Test (2 min)
```
1. Open Slate app
2. Press F12 → Application → IndexedDB → slate → Delete
3. Refresh page
4. Create test property
5. Save
6. Refresh page
7. ✓ Data still there = SUCCESS
```

## What Was Done

| What | Location | Status |
|------|----------|--------|
| Database Tables | supabase/migrations/20260620000000_create_real_estate_tables.sql | ✓ Created |
| PowerSync Rules | powersync_sync_rules_dynamic.yaml | ✓ Updated |
| PowerSync Connector | src/api/PowerSyncConnector.js | ✓ Updated |
| UI Pages | src/pages/real-estate/*.jsx | ✓ 8 pages |
| Admin Toggle | src/config/industries.js | ✓ Configured |
| Integrations | RealEstateIntegrations.js | ✓ Ready |

## What Happens After Setup

```
Supabase Database ← → PowerSync Sync Rules ← → Local Browser
    (Cloud)              (Real-time sync)         (Offline-first)
```

1. User saves data in Real Estate page
2. Saved to local browser database (works offline)
3. PowerSync syncs to Supabase (when online)
4. Data persists across refreshes
5. Works offline - syncs when connection restored

## Tables Created

1. univ_re_properties - Property listings
2. univ_re_clients - Buyers/sellers
3. univ_re_viewings - Appointments
4. univ_re_offers - Purchase offers
5. univ_re_transactions - Sales
6. univ_re_commissions - Agent pay
7. univ_re_documents - Files
8. univ_re_leases - Rentals
9. univ_re_rent_payments - Rent tracking
10. univ_re_maintenance_requests - Maintenance

## Files You Need to Use

| File | Action |
|------|--------|
| supabase/migrations/20260620000000_create_real_estate_tables.sql | Copy & Run in Supabase SQL Editor |
| powersync_sync_rules_dynamic.yaml | Update in PowerSync Dashboard |
| (Code is auto-updated) | Already done - no code changes needed |

## Verification Checklist

- [ ] SQL migration ran without errors in Supabase
- [ ] PowerSync rules deployed successfully
- [ ] Browser cache cleared (IndexedDB deleted)
- [ ] Page refreshed after cache clear
- [ ] Created test property in Real Estate
- [ ] Clicked Save button
- [ ] Refreshed page with Ctrl+F5
- [ ] Property data still visible
- [ ] Checked console for "App is ready for offline use"
- [ ] No "Hard error uploading operation" messages

## Support

If data still disappears:
1. Check browser console for error messages
2. Verify SQL executed without errors
3. Verify PowerSync sync rules deployed
4. Check that company_id matches between local data and database
5. Try clearing IndexedDB and restarting browser
