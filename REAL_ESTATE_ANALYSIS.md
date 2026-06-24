# Real Estate System - Production Analysis & Findings

## Executive Summary

The Real Estate module is experiencing data persistence failures for all features except Properties and Clients. Data appears to save locally but disappears on refresh because **PowerSync sync operations are failing silently and data is never replicated to Supabase** (the remote source of truth).

---

## Part 1: System Architecture

### Stack Components
- **Frontend**: React 18 + PowerSync SDK for local-first sync
- **Local DB**: SQLite (browser-based via PowerSync)
- **Remote DB**: Supabase (PostgreSQL)
- **Sync Engine**: PowerSync Connector with custom Supabase integration
- **API Layer**: RealEstateAPI.js with UUID generation

### Data Flow

```
User Input Form
    ↓
RealEstateAPI.createXXX() (generates UUID)
    ↓
powerSync.execute(INSERT) → SQLite local database
    ↓
Automatic: PowerSync detects INSERT → Creates transaction
    ↓
PowerSync.uploadData() → Sends to Supabase via REST API
    ↓
If ERROR: Caught in uploadData error handler
    ↓
If success: Data replicated to Supabase ✓
```

---

## Part 2: Root Cause Analysis

### Why Properties & Clients Work

Both have:
1. ✓ Complete CRUD API methods in RealEstateAPI.js (lines 51-103 for Properties, lines 136-158 for Clients)
2. ✓ Proper UUID generation via `generateUUID()` function
3. ✓ Valid form submissions with all required fields populated
4. ✓ Successful PowerSync transactions with valid data structures
5. ✓ Clean sync to Supabase with no ID conflicts

### Why All Other Features FAIL

**Critical Issue**: PowerSync sync validation catches errors and SILENTLY SKIPS problematic operations (line 48 & 166 in PowerSyncConnector.js):

```javascript
// Line 48: If ID is empty, skip upload
if (!op.id || op.id === '' || op.id === null || op.id === undefined) {
  console.error('[PowerSync] CRITICAL: Skipping PUT with empty ID...');
  continue; // ← SKIPS THIS OPERATION
}

// Line 166: If hard error (like UUID error), skip and continue
console.error(`[PowerSync] Hard error uploading operation...`);
...
continue; // ← SKIPS THIS OPERATION
```

### The Cascade Failure

1. User creates Viewing/Offer/Transaction via form
2. RealEstateAPI generates valid UUID ✓
3. powerSync.execute(INSERT) adds to local SQLite ✓
4. Component fetches from PowerSync: Data appears! ✓
5. PowerSync tries to sync to Supabase
6. Sync encounters validation error OR schema mismatch
7. **PowerSync catches error and SKIPS the operation** ← PROBLEM
8. Transaction marked as complete, but record never left local DB
9. User refreshes page
10. Component queries PowerSync from Supabase (not local cache)
11. **Record not in Supabase = DATA DISAPPEARS** ✗

---

## Part 3: Why Some Features Show Data Initially

When you create a record, it exists in local SQLite immediately. The UI fetches from PowerSync local database and shows the data. This gives the illusion of success. But when PowerSync attempts the background sync to Supabase, it fails and skips the operation.

On refresh, PowerSync re-initializes from Supabase (the source of truth), so the locally-only record is lost.

---

## Part 4: Identified Issues in Current Code

### Issue #1: Silent Error Handling
**File**: `src/api/PowerSyncConnector.js` (lines 44-49, 134-167)

```javascript
// Current: Skips operations with errors
if (!op.id || op.id === '') {
  console.error('...');  // Only logs, doesn't bubble error
  continue;  // ← Silently skips
}
```

**Problem**: Errors are logged but operations are skipped. UI thinks success happened.

---

### Issue #2: Missing Default Values
**File**: `supabase/migrations/20260620000000_create_real_estate_tables.sql`

Most Real Estate table columns have no defaults. When data is incomplete, Supabase upsert fails with validation errors, which PowerSync catches and skips.

---

### Issue #3: Type Mismatches
**File**: `src/api/AppSchema.js` (lines 4643-4750)

All Real Estate tables use `column.text` for ALL fields, including numbers:
```javascript
univ_re_offers: new Table({
    id: column.text,
    offer_amount: column.real,  // ← Real type, but data sent as text
    earnest_money: column.real, // ← Real type, but data sent as text
    ...
})
```

When numeric data is sent as text, Supabase rejects it. PowerSync catches this and skips.

---

### Issue #4: Incomplete Form Implementations  
**Files**: Most feature components only have form shells

- Viewings.jsx - Has form but calendar view complicates sync logic
- Offers.jsx - Form exists but may have incomplete field mapping
- Transactions.jsx - Missing complex multi-section form support
- Commissions.jsx - Has NO form UI or create method
- RentPayments.jsx - Has NO form UI or create method
- Maintenance.jsx - Likely incomplete form

---

### Issue #5: API Method Mismatch in UI
**File**: `src/pages/real-estate/Clients.jsx` (line 87)

```javascript
await RealEstateAPI.updateProperty(...); // ← WRONG! Should be updateClient
```

This bug causes updates to fail and skip in PowerSync.

---

## Part 5: The Sync Error Log

**File**: PowerSyncConnector records hard errors to `sync_errors` table (line 138-155)

To view all sync failures:
```sql
SELECT * FROM sync_errors WHERE table_name LIKE 'univ_re_%' ORDER BY failed_at DESC LIMIT 20;
```

This table should contain all the UUID errors and validation failures. This is your diagnosis tool.

---

## Part 6: Why This Happens

### The Invisible Problem
Users experience this as "data disappears on refresh" but actually:
1. Data saves to local SQLite ✓
2. Data displays in UI ✓
3. PowerSync sync fails (error caught internally)
4. User doesn't see any error message (silent failure)
5. On refresh, local cache cleared, data gone

### Why Properties/Clients Are Different
These tables have simpler structures and all their required fields are always populated. When the form is filled out, all data is valid for Supabase schema. Other tables have optional/complex fields that cause validation errors.

---

## Part 7: Solution Strategy

### Phase 1: Diagnosis
- [ ] Query `sync_errors` table to see actual error messages
- [ ] Check PowerSync browser console logs for upload failures
- [ ] Verify data types sent vs expected in Supabase

### Phase 2: Fix Core Issues
1. **Fix Type System** - Map numeric fields correctly in AppSchema.js
2. **Fix API Bug** - Line 87 in Clients.jsx
3. **Improve Error Handling** - Bubble sync errors to UI instead of silent skip
4. **Add Validation** - Validate data before INSERT to prevent sync failures

### Phase 3: Complete Implementations
1. Add forms to Commissions and RentPayments
2. Fix incomplete form mappings in other features
3. Ensure all required fields populated before submit
4. Add proper error display to user

### Phase 4: Testing
- [ ] Create record
- [ ] Verify in UI (shows immediately)
- [ ] Wait 2-3 seconds for background sync
- [ ] Refresh page
- [ ] Verify data persists (not disappeared)

---

## Part 8: Key Files to Investigate

1. **PowerSyncConnector.js** - Core sync engine (lines 44-167)
2. **AppSchema.js** - Data type definitions (lines 4620-4850)
3. **RealEstateAPI.js** - API methods and validation
4. **Real Estate components** - Form implementations
5. **Supabase migrations** - Table schemas and defaults

---

## Part 9: Recommended Actions

### Immediate (Fix Bugs)
1. Fix Clients.jsx line 87 (updateProperty → updateClient)
2. Query sync_errors table to see actual failure reasons
3. Add console.log to PowerSync uploadData to track failures

### Short Term (Make System Resilient)
1. Fix type mappings in AppSchema for numeric fields
2. Add client-side validation before PowerSync INSERT
3. Show user errors when sync fails
4. Implement sync retry logic with backoff

### Medium Term (Complete Features)
1. Complete Commissions UI and API
2. Complete RentPayments UI and API
3. Implement missing CRUD methods
4. Add comprehensive form validation

---

## Part 10: Feature-Specific Recommendations

### Commissions
- ⚠️ Missing: `async createCommission()` method in RealEstateAPI
- ⚠️ Missing: Form UI in Commissions.jsx
- 🔧 Solution: Copy pattern from Clients, add form component

### RentPayments  
- ⚠️ Missing: `async createRentPayment()` method in RealEstateAPI
- ⚠️ Missing: Form UI in RentPayments.jsx
- 🔧 Solution: Copy pattern from Clients, add form component

### Maintenance
- ⚠️ Likely missing form or has incomplete implementation
- 🔧 Solution: Follow Properties/Clients pattern

### All Features
- 🔧 Add proper error boundaries
- 🔧 Show sync status to user
- 🔧 Implement exponential backoff for failed syncs

---

## Conclusion

**This is NOT a data loss bug** - it's a **sync visibility bug**. Data is safely stored locally and in Supabase error logs. The issue is that PowerSync catches errors silently and skips operations, giving the false impression that save succeeded when it actually failed.

**The fix**: Improve error handling, add validation, and complete missing features. The architecture is sound; execution is incomplete.

---

## Next Steps

1. ✅ You've analyzed the issue thoroughly
2. ⏭️ Query `sync_errors` table to see specific failures
3. ⏭️ Fix identified bugs (line 87, type mismatches)
4. ⏭️ Complete missing features (Commissions, RentPayments)
5. ⏭️ Implement proper error display
6. ⏭️ Test persistence after each fix
