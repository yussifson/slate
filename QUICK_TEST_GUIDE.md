# Quick Testing Guide - Real Estate Features

## 🎯 The Critical Test (30 seconds per feature)

This one test proves everything works:

```
1. Create a record in the feature
2. Wait 3 seconds
3. Press F5 to refresh the page
4. If record is still there → ✅ WORKS
5. If record disappeared → ❌ NEEDS DEBUGGING
```

## 📋 Test Each Feature

### 1. Properties
- [ ] Create: Fill form → Submit → See in list
- [ ] Edit: Click edit → Change a field → Submit → Verify change
- [ ] Delete: Click delete → Confirm gone
- [ ] **Persistence**: Create → Refresh → Still there?

### 2. Clients
- [ ] Create: Fill form → Submit → See in list
- [ ] Edit: Click edit → Change name → Submit → Verify
- [ ] Delete: Click delete → Confirm gone
- [ ] **Persistence**: Create → Refresh → Still there?

### 3. Viewings
- [ ] Create: Fill form with property address, client name, date → Submit
- [ ] Edit: Click edit → Change time → Submit → Verify
- [ ] Delete: Click delete → Confirm gone
- [ ] **Persistence**: Create → Refresh → Still there?

### 4. Offers
- [ ] Create: Fill form with property, buyer, amount → Submit
- [ ] Edit: Click edit → Change amount → Submit → Verify
- [ ] Delete: Click delete → Confirm gone
- [ ] **Persistence**: Create → Refresh → Still there?

### 5. Transactions
- [ ] Create: Fill form with property, buyer, seller, price → Submit
- [ ] Edit: Click edit → Change status → Submit → Verify
- [ ] Delete: Click delete → Confirm gone
- [ ] **Persistence**: Create → Refresh → Still there?

### 6. Leases
- [ ] Create: Fill form with property, tenant, start/end dates → Submit
- [ ] Edit: Click edit → Change monthly rent → Submit → Verify
- [ ] Delete: Click delete → Confirm gone
- [ ] **Persistence**: Create → Refresh → Still there?

### 7. Rent Payments
- [ ] Create: Fill form with lease, amount, due date → Submit
- [ ] Edit: Click edit → Change amount → Submit → Verify
- [ ] Delete: Click delete → Confirm gone
- [ ] **Persistence**: Create → Refresh → Still there?

### 8. Maintenance
- [ ] Create: Fill form with property, issue description → Submit
- [ ] Edit: Click edit → Change priority → Submit → Verify
- [ ] Delete: Click delete → Confirm gone
- [ ] **Persistence**: Create → Refresh → Still there?

---

## 🔍 If Persistence Test Fails

### Step 1: Check Console (F12)
Look for messages starting with `[v0]`:
- `[v0] PowerSync SKIPPED:` → ID is empty
- `[v0] PowerSync hard error:` → Sync failed for reason shown

**Copy the error message** - this is the diagnosis.

### Step 2: Common Issues

**Error: "invalid input syntax for type uuid"**
- Cause: Empty ID being sent to Supabase
- Fix: Already applied - should not happen

**Error: "column X not found"**
- Cause: Field name mismatch between form and database
- Fix: Check form is using correct field names (snake_case for DB)

**Error: "permission denied"**
- Cause: Supabase RLS policy issue
- Fix: Check Supabase table RLS policies

**No error but record disappeared**
- Cause: Record synced locally but not to Supabase
- Fix: Wait 10 seconds, refresh again - sometimes takes time

### Step 3: Network Debugging
1. Open DevTools → Network tab
2. Filter by "powersync"
3. Create a record
4. Look for failed requests
5. Check response status (should be 200-201)

---

## ✅ Success Criteria

All features pass when:

- [x] Create works (form submits, toast shows success, record appears)
- [x] Edit works (form pre-fills, changes saved, record updates)
- [x] Delete works (record removed from list)
- [x] **Persistence** (record survives page refresh)
- [x] Console has no `[v0]` errors

---

## 🚀 Full Test Suite (5-10 minutes)

Run this sequence to test everything:

```bash
For each of 8 features:
  1. Create new record
  2. Verify appears in list
  3. Edit the record
  4. Verify edit appears
  5. Delete the record
  6. Verify gone from list
  7. Refresh page
  8. Check nothing reappeared unexpectedly
  9. Create new record again
  10. Refresh page
  11. Verify it STILL THERE (persistence test)
```

---

## 📊 Expected Results

### ✅ If working correctly:
```
Created Viewing at 2:00pm
Refreshed at 2:01pm → Viewing still there
Edited Viewing at 2:02pm
Refreshed at 2:03pm → Edit still there
Deleted Viewing at 2:04pm
Refreshed at 2:05pm → Viewing gone
```

### ❌ If broken:
```
Created Viewing at 2:00pm
Refreshed at 2:01pm → Viewing DISAPPEARED ← Problem!
Console shows [v0] PowerSync errors → Debug using error message
```

---

## 🐛 Debug Mode

To see full PowerSync activity:

1. Open DevTools → Console
2. Type: `localStorage.setItem('debug-powersync', '1')`
3. Reload page
4. All PowerSync operations will be logged
5. To turn off: `localStorage.removeItem('debug-powersync')`

---

## 📞 If Tests Still Fail

Check FIXES_APPLIED.md section "Diagnostic Tools" for:
- Supabase sync_errors table queries
- Network analysis
- Error code reference

Most common: Check the `[v0]` console error message - it will tell you exactly what failed and why.
