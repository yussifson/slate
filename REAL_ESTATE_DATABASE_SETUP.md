# Real Estate Vertical - Database & PowerSync Setup

## Problem Summary
The Real Estate vertical tables were defined in AppSchema.js but were not:
1. Created in the Supabase database
2. Added to PowerSync sync rules
3. Properly configured for offline sync

This caused data to be saved locally but not synced to the server, making it disappear on page refresh.

## Solution Implemented

### 1. Database Tables Created
A SQL migration file has been created: `supabase/migrations/20260620000000_create_real_estate_tables.sql`

This file creates the following 10 tables with proper indexes and RLS policies:
- `univ_re_properties` - Property listings
- `univ_re_clients` - Client/buyer/seller database
- `univ_re_viewings` - Appointment scheduling
- `univ_re_offers` - Purchase offers
- `univ_re_transactions` - Sale transactions
- `univ_re_commissions` - Agent commission tracking
- `univ_re_documents` - Document storage metadata
- `univ_re_leases` - Rental lease agreements
- `univ_re_rent_payments` - Rent collection tracking
- `univ_re_maintenance_requests` - Property maintenance

### 2. PowerSync Sync Rules Added
The `powersync_sync_rules_dynamic.yaml` file has been updated to include all 10 Real Estate tables:

```yaml
# Real Estate Module
- SELECT * FROM univ_re_properties WHERE company_id = bucket.company_id
- SELECT * FROM univ_re_clients WHERE company_id = bucket.company_id
- SELECT * FROM univ_re_viewings WHERE company_id = bucket.company_id
- SELECT * FROM univ_re_offers WHERE company_id = bucket.company_id
- SELECT * FROM univ_re_transactions WHERE company_id = bucket.company_id
- SELECT * FROM univ_re_commissions WHERE company_id = bucket.company_id
- SELECT * FROM univ_re_documents WHERE company_id = bucket.company_id
- SELECT * FROM univ_re_leases WHERE company_id = bucket.company_id
- SELECT * FROM univ_re_rent_payments WHERE company_id = bucket.company_id
- SELECT * FROM univ_re_maintenance_requests WHERE company_id = bucket.company_id
```

### 3. PowerSync Connector Updated
The `src/api/PowerSyncConnector.js` file has been updated to allow all fields for Real Estate tables during PUT/PATCH operations (no field filtering).

## Required Setup Steps

### Step 1: Run the SQL Migration in Supabase
1. Open Supabase Console for your project
2. Go to SQL Editor
3. Copy the entire contents of `supabase/migrations/20260620000000_create_real_estate_tables.sql`
4. Paste into the SQL editor
5. Click "Run" to execute all CREATE TABLE and RLS policy statements

### Step 2: Update PowerSync Backend Configuration
1. Log in to your PowerSync dashboard (https://dashboard.powersync.journeyapps.com)
2. Go to your Slate workspace
3. Go to "Sync Rules" section
4. Replace the sync rules with the updated `powersync_sync_rules_dynamic.yaml` file
5. Save and deploy the new rules

### Step 3: Clear Local Database & Resync
1. On your client application, open browser DevTools (F12)
2. Go to Application tab → Indexed DB
3. Delete the "slate.db" database
4. Refresh the page - this will trigger a full resync from PowerSync

### Step 4: Test Data Persistence
1. Navigate to Real Estate → Properties
2. Create a new property with test data
3. Fill in all fields and click Save
4. Verify the success message appears
5. Refresh the page (Ctrl+F5 or Cmd+Shift+R)
6. Navigate back to Properties
7. Verify the property data is still there

## Data Flow After Setup

```
Local Input → PowerSync Local DB → PowerSync Upload → Supabase (via sync rules) → PowerSync Sync → Local Refresh
```

1. **User saves data** in Real Estate page
2. **PowerSync stores locally** in SQLite (slate.db)
3. **PowerSyncConnector.uploadData()** sends data to Supabase via REST API
4. **PowerSync sync rules** validate company_id matches user's company
5. **Supabase stores** data in univ_re_* tables
6. **PowerSync sync** pulls data back to local database
7. **UI auto-refreshes** to show persisted data

## Troubleshooting

### Tables not syncing
- Verify SQL migration executed successfully in Supabase
- Check browser console for "Hard error uploading operation" messages
- Check that PowerSync sync rules are deployed and active

### Data disappears on refresh
- Clear browser cache and IndexedDB (Application tab in DevTools)
- Verify RLS policies are correctly allowing access to user's company_id
- Check PowerSync status - look for sync errors in console

### Sync errors in console
- Check that company_id matches between local data and profiles table
- Verify all required columns in tables match what's being saved
- Look for "PGRST205" errors - these indicate table name mismatches

## Files Modified/Created

1. **Created**: `supabase/migrations/20260620000000_create_real_estate_tables.sql` (253 lines)
2. **Modified**: `powersync_sync_rules_dynamic.yaml` (added 14 lines)
3. **Modified**: `src/api/PowerSyncConnector.js` (added Real Estate table handling)

## Next Steps

After completing the setup:
1. All Real Estate data will be automatically synced via PowerSync
2. Features work offline - data syncs when connection restored
3. UI automatically refreshes when PowerSync completes sync
4. Retail and other verticals remain fully functional
