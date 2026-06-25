# PHARMACY VERTICAL - INTEGRATION STEPS

## STEP 1: RUN ERROR-FREE SQL

Run this SQL in your database (Supabase SQL Editor):

```sql
-- Copy entire SQL block from PHARMACY_SQL_COMPLETE.sql in this repo
-- Or paste the SQL provided in the chat directly
```

**What it does:**
- Creates 15 pharmacy tables with proper naming
- Sets up RLS policies
- Adds indexes for performance
- Enables company-scoped data isolation

---

## STEP 2: ADD PHARMACY TO PAGE CONTEXT

**File:** `src/components/AiAssistant.jsx`

Find the `PAGE_CONTEXT` object around line 38, and add this pharmacy block after Insurance:

```javascript
  // Pharmacy
  '/pharmacy/dashboard': { title: 'Pharmacy Dashboard', suite: 'Pharmacy', desc: 'pharmacy metrics and KPIs'},
  '/pharmacy/drugs': { title: 'Drug Catalog', suite: 'Pharmacy', desc: 'drug inventory management'},
  '/pharmacy/inventory': { title: 'Inventory', suite: 'Pharmacy', desc: 'stock and batch tracking'},
  '/pharmacy/pos': { title: 'Point of Sale', suite: 'Pharmacy', desc: 'pharmacy POS system'},
  '/pharmacy/prescriptions': { title: 'Prescriptions', suite: 'Pharmacy', desc: 'prescription management'},
  '/pharmacy/customers': { title: 'Customers', suite: 'Pharmacy', desc: 'patient database'},
  '/pharmacy/claims': { title: 'Insurance Claims', suite: 'Pharmacy', desc: 'insurance claim tracking'},
  '/pharmacy/reports': { title: 'Reports', suite: 'Pharmacy', desc: 'pharmacy analytics'},
```

---

## STEP 3: ADD PHARMACY DASHBOARD COMPONENT

**Create new file:** `src/components/dashboard/PharmacyDashboard.jsx`

This should follow the same pattern as other dashboards (Retail, Hotel, Insurance, etc).

---

## STEP 4: CREATE INDUSTRY SWITCHER LOGIC

**File:** Find where industry toggle/switch is located (likely in navbar or header)

Add pharmacy to the industry list. Pattern should be:
```javascript
const industries = [
  { id: 'retail', label: 'Retail' },
  { id: 'hotel', label: 'Hotel' },
  { id: 'real-estate', label: 'Real Estate' },
  { id: 'insurance', label: 'Insurance' },
  { id: 'pharmacy', label: 'Pharmacy' }  // ADD THIS
];
```

---

## STEP 5: UPDATE APP ROUTING

**File:** `src/App.jsx`

Add pharmacy routes:
```javascript
// Lazy load pharmacy pages
const PharmacyDashboard = React.lazy(() => import('@/pages/pharmacy/Dashboard'));
const PharmacyDrugs = React.lazy(() => import('@/pages/pharmacy/Drugs'));
const PharmacyInventory = React.lazy(() => import('@/pages/pharmacy/Inventory'));
const PharmacyPOS = React.lazy(() => import('@/pages/pharmacy/POS'));
const PharmacyPrescriptions = React.lazy(() => import('@/pages/pharmacy/Prescriptions'));
const PharmacyCustomers = React.lazy(() => import('@/pages/pharmacy/Customers'));
const PharmacyClaims = React.lazy(() => import('@/pages/pharmacy/Claims'));
const PharmacyReports = React.lazy(() => import('@/pages/pharmacy/Reports'));

// Add routes
<Route path="/pharmacy/dashboard" element={<PharmacyDashboard />} />
<Route path="/pharmacy/drugs" element={<PharmacyDrugs />} />
<Route path="/pharmacy/inventory" element={<PharmacyInventory />} />
<Route path="/pharmacy/pos" element={<PharmacyPOS />} />
<Route path="/pharmacy/prescriptions" element={<PharmacyPrescriptions />} />
<Route path="/pharmacy/customers" element={<PharmacyCustomers />} />
<Route path="/pharmacy/claims" element={<PharmacyClaims />} />
<Route path="/pharmacy/reports" element={<PharmacyReports />} />
```

---

## STEP 6: ADD TO ONBOARDING

**File:** Find onboarding/registration component (likely in `src/pages` or `src/components/onboarding`)

Add pharmacy option to industry selection:
```javascript
const industries = [
  'Retail',
  'Hotel',
  'Real Estate',
  'Insurance',
  'Pharmacy'  // ADD THIS
];
```

When user selects "Pharmacy" during onboarding:
1. Set their company industry to 'pharmacy'
2. Initialize pharmacy module access
3. Redirect to `/pharmacy/dashboard`

---

## STEP 7: FIX REAL ESTATE DATA PERSISTENCE ISSUE

**Problem:** Data saves but vanishes after refresh (PowerSync/DB issue)

**Root Cause:** Column naming mismatch in real-estate tables with PowerSync schema cache

**Solution:**

1. Check real-estate table schemas match PowerSync expectations
2. Verify all columns referenced in PowerSync rules exist in tables
3. Re-sync PowerSync schema cache

**Example:** The error mentions `counter_offer_price` missing from `univ_re_counter_offers`
- Verify column exists in database
- If missing, add it: `ALTER TABLE univ_re_counter_offers ADD COLUMN counter_offer_price NUMERIC(15,2);`

---

## STEP 8: ENSURE PHARMACY PRODUCTION READINESS

Verify the following:

- [ ] Database schema created (15 tables)
- [ ] RLS policies applied correctly
- [ ] PowerSync configured for 4 core tables
- [ ] All 8 pharmacy pages created and wired
- [ ] PharmacyAPI methods tested
- [ ] Pharmacy added to industry toggle
- [ ] Pharmacy added to onboarding flow
- [ ] Offline-first functionality working (PowerSync)
- [ ] Data persists after page refresh
- [ ] All audit logging working
- [ ] Company data properly isolated

---

## POWERSYNC CONFIGURATION CHECKLIST

PowerSync should sync these 4 tables:

1. **univ_pharmacy_drugs** - Product catalog (read-only offline)
2. **univ_pharmacy_inventory** - Stock levels
3. **univ_pharmacy_sales** - Transaction history  
4. **univ_pharmacy_sale_items** - Line items

Optional extensions:
5. **univ_pharmacy_prescriptions** - Rx records
6. **univ_pharmacy_customers** - Patient database

All queries use: `company_id::text = bucket.user_company_id::text`

---

## API INTEGRATION

PharmacyAPI.js methods available:

**Drug Management:**
- createDrug()
- getDrugs()
- updateDrug()

**Inventory:**
- addInventory()
- getInventory()
- updateInventoryQuantity()

**Sales:**
- createSale()
- getSales()

**Prescriptions:**
- createPrescription()
- getPrescriptions()

**Customers:**
- createCustomer()
- getCustomers()

**Suppliers:**
- createSupplier()
- getSuppliers()

**Analytics:**
- getAnalytics()
- generateDailyAnalytics()

---

## TESTING CHECKLIST

1. Test SuperAdmin toggle - can switch to pharmacy
2. Test onboarding - can select pharmacy as industry
3. Create drug in drugs catalog - should save
4. Refresh page - drug should still appear (data persistence)
5. Add inventory - should sync offline
6. Create POS sale - receipt should print
7. Verify all audit logs recorded
8. Check company isolation - other companies can't see pharmacy data

---

## DEPLOYMENT

After completing all steps:

```bash
1. Push all code changes to Git
2. Run migrations on production database
3. Verify PowerSync is configured
4. Test in staging environment
5. Deploy to production
6. Monitor for errors in console
```

---

## SUPPORT

If you encounter issues:

1. Check console for errors
2. Verify all tables exist: `SELECT * FROM information_schema.tables WHERE table_name LIKE 'univ_pharmacy_%';`
3. Verify RLS policies: `SELECT * FROM pg_policies WHERE tablename LIKE 'univ_pharmacy_%';`
4. Check PowerSync sync status
5. Verify company_id is correctly set in JWT

