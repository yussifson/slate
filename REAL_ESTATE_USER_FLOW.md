# Real Estate Vertical - User Selection & Initialization Flow

## Overview
This document describes exactly what happens when a user selects Real Estate during onboarding, and how the system treats it like other verticals (Retail, Hotel, Law, etc.).

## Step-by-Step User Flow

### Step 1: Onboarding Wizard - Industry Selection
**Location**: `/onboarding` → Step 1

**What Happens:**
1. New user sees industry dropdown with all available verticals
2. Real Estate appears as an option alongside:
   - Law Firm
   - Retail / POS
   - **Real Estate** ← NEW
   - School & Education
   - Hospital & Healthcare
   - Hotel & Hospitality
   - Logistics & Delivery
   - Insurance Agency
   - Religious Organization
   - HR & ERP

**Code Logic** (`OnboardingWizard.jsx`):
```javascript
const [industry, setIndustry] = useState(user?.company_industry || 'law');
// ... later in UI:
<SelectItem value="real_estate">{t("real_estate", "Real Estate")}</SelectItem>
```

### Step 2: User Selects Real Estate

**What Happens:**
1. State updates to: `industry = 'real_estate'`
2. Setup mode options appear:
   - **Build with Template** - Initializes with pre-built Real Estate dashboard
   - **Build with Orbit** - Uses AI to generate custom pages
   - **Build with Custom** - Start from blank slate

**What User Sees:**
```
Workslate: [Dropdown ▼]
  Law Firm
  Retail / POS
  Real Estate    ← Selected
  School & Education
  ...

Setup Mode Options:
○ Build with Template
  Initializes your dashboard with all standard predefined pages and slates 
  for a Real Estate business. Recommended for quick starts.

○ Build with Orbit
  Start fresh with a blank slate. Use Orbit AI to dynamically generate 
  custom pages and databases exactly how you want them.

○ Build with Custom
  Manually build your workspace from scratch.
```

### Step 3: Workspace Initialization

**When User Completes Onboarding:**

The system executes this initialization logic:

```javascript
let finalIndustry = industry; // 'real_estate'
if (setupMode === 'orbit') {
  finalIndustry = 'orbit_build'; // Override if Orbit mode
}

const compPayload = {
  id: crypto.randomUUID(),
  name: workspaceName,
  subdomain: finalSubdomain,
  email: user.email,
  industry_type: finalIndustry || 'law', // Sets to 'real_estate'
  country: country,
  currency: currency,
  status: 'active',
  subscription_plan: selectedPlan.name.toLowerCase().replace(/\s/g, ''),
  subscription_status: selectedPlan.price_monthly > 0 ? 'active' : 'trial'
};

// Insert into companies table
await supabase.from('companies').insert(compPayload).select().single();

// Update user profile
await supabase.from('profiles').update({
  company_id: companyIdToUse,
  company_name: workspaceName,
  role: 'company_admin',
  industry_type: 'real_estate' // Stored in profile for faster lookup
}).eq('id', user.id);
```

**Database Result:**
```sql
-- companies table
INSERT INTO companies (
  id, name, subdomain, email, industry_type, country, 
  currency, status, subscription_plan, subscription_status
) VALUES (
  'uuid-123', 'My Real Estate Co', 'realestate-agent', 
  'user@example.com', 'real_estate', 'United States',
  'USD', 'active', 'professional', 'active'
);

-- profiles table
UPDATE profiles SET 
  company_id = 'uuid-123',
  company_name = 'My Real Estate Co',
  industry_type = 'real_estate',
  role = 'company_admin'
WHERE id = 'user-uuid';
```

### Step 4: Dashboard Load

**When Dashboard Loads** (`AppLayout.jsx`):

1. **Sidebar Detects Industry**
   ```javascript
   const activeIndustry = sessionStorage.getItem('slate_industry_override') 
     || impersonatedCompany?.industry 
     || impersonatedCompany?.industry_type 
     || user?.company_industry 
     || 'law';
   
   // Result: activeIndustry = 'real_estate'
   ```

2. **Navigation Menu Generated**
   ```javascript
   const industryData = INDUSTRIES[activeIndustry] || INDUSTRIES.law;
   // Fetches: INDUSTRIES['real_estate']
   
   // Returns 19 menu items:
   // - Dashboard
   // - Properties
   // - Clients
   // - Viewings
   // - Offers
   // - Transactions
   // - Commissions
   // - Leases
   // - Rent Payments
   // - Maintenance
   // - Documents
   // - Analytics
   // - Reports
   // - Tasks
   // - HR & Leave
   // - Integrations
   // - Automations
   // - Roles
   // - Settings
   ```

3. **Dashboard Component Selected**
   ```javascript
   if (activeIndustry === 'real_estate') {
     // Load RealEstateDashboard component
     // Shows real estate specific KPIs:
     // - Total Properties
     // - Active Viewings
     // - Pending Offers
     // - Monthly Revenue
     // - Agent Performance
     // - Market Trends
   }
   ```

4. **Intelligence Engine Activated**
   ```javascript
   // Loads src/lib/intelligence/engines/real-estate.js
   const engine = new RealEstateIntelligenceEngine(powerSync, companyId);
   
   // Enables:
   // - Property Valuation Prediction
   // - Buyer Readiness Scoring
   // - Agent Performance Analytics
   // - Lease Renewal Risk Detection
   // - Maintenance Priority Analysis
   ```

### Step 5: Complete Initialization

**What User Sees After Onboarding:**

```
┌─────────────────────────────────────────┐
│  My Real Estate Co                      │
│  Dashboard | Real Estate                │
├─────────────────────────────────────────┤
│ SIDEBAR                   │ CONTENT      │
├─────────────────────────┬─┤              │
│ Dashboard              │ │              │
│ Properties            │ │ Real Estate  │
│ Clients               │ │ Dashboard    │
│ Viewings              │ │              │
│ Offers                │ │ KPIs:        │
│ Transactions          │ │ • 24 Properties
│ Commissions           │ │ • 8 Viewings
│ Leases                │ │ • 3 Pending Offers
│ Rent Payments         │ │ • $12,500 Monthly Rev
│ Maintenance           │ │              │
│ ───────────────────── │ │ Agent Performance:
│ Documents             │ │ • John Smith: 5 sales
│ Analytics             │ │ • Sarah Jones: 3 sales
│ Reports               │ │              │
│ ───────────────────── │ │ Market Trends:
│ Tasks                 │ │ • Avg Price: $450k
│ HR & Leave            │ │              │
│ ───────────────────── │ │              │
│ Integrations          │ │              │
│ Automations           │ │              │
│ Roles                 │ │              │
│ Settings              │ │              │
│                       │ │              │
└───────────────────────┴─┴──────────────┘
```

**Data Loaded:**
- PowerSync syncs offline-available tables:
  - Properties (properties, prices, features)
  - Clients (contacts, preferences, budgets)
  - Viewings (schedule, feedback)
  - Leases (rental agreements, tenants)
  - Maintenance (requests, status)

- Real-time tables accessed on demand:
  - Offers (conditional on online)
  - Transactions (conditional on online)
  - Commissions (conditional on online)
  - Rent Payments (conditional on online)
  - Documents (conditional on online)

## How It Matches Other Verticals

### Comparison with Retail Selection

**If User Selects Retail:**
1. industry = 'retail'
2. Onboarding creates company with industry_type = 'retail'
3. Dashboard loads RetailDashboard component
4. Sidebar shows 20+ retail menu items
5. Retail Intelligence Engine activates

**If User Selects Real Estate:**
1. industry = 'real_estate'
2. Onboarding creates company with industry_type = 'real_estate'
3. Dashboard loads RealEstateDashboard component ← NEW
4. Sidebar shows 19 real estate menu items ← NEW
5. Real Estate Intelligence Engine activates ← NEW

**Code Pattern - Identical:**
```javascript
// Both follow same pattern:
if (activeIndustry === 'retail') { /* Load retail */ }
if (activeIndustry === 'real_estate') { /* Load real estate */ }

// Same for navigation:
INDUSTRIES['retail'].nav → Retail menu
INDUSTRIES['real_estate'].nav → Real Estate menu

// Same for intelligence:
retailIntelligenceEngine
realEstateIntelligenceEngine
```

## Admin Control

### What Admins Can Control

In **Admin Dashboard → Global Rollout Manager**:

**Real Estate Vertical Toggle:**
```
Name: Real Estate Vertical
Description: Complete real estate management suite...

Status: GLOBAL_ON ← Can toggle to COHORT or GLOBAL_OFF
Scope: All Tenants

[Power Button] [Cogwheel]
```

**When Toggled to Different States:**

1. **GLOBAL_ON** (Green)
   - Real Estate available to ALL new workspaces
   - Appears in onboarding dropdown for everyone
   - Super admins can assign to specific companies

2. **COHORT** (Amber)
   - Real Estate available to SELECTED organizations only
   - Admin can choose which companies see it
   - Doesn't appear for others in onboarding

3. **GLOBAL_OFF** (Red)
   - Real Estate disabled completely
   - Doesn't appear in onboarding dropdown
   - Existing Real Estate workspaces still function (backwards compatible)
   - New workspaces cannot select Real Estate

## Setup Modes Explained

### Template Mode (Default)
```javascript
if (setupMode === 'template') {
  // Loads pre-built Real Estate dashboard with:
  // ✓ RealEstateDashboard component
  // ✓ Properties page with sample data
  // ✓ Clients directory
  // ✓ Leases management
  // ✓ Pre-configured Novu templates
  // ✓ PowerSync offline sync enabled
}
```

### Orbit AI Mode
```javascript
if (setupMode === 'orbit') {
  finalIndustry = 'orbit_build'; // Override to Orbit
  // User enters custom prompt
  // Generates custom pages using AI
  // Creates custom databases
  // Can still select 'real_estate' as context
}
```

### Custom Mode
```javascript
if (setupMode === 'custom') {
  // User starts with completely blank dashboard
  // Can manually build their own pages
  // Still has Real Estate intelligence engine available
  // Real Estate tables still created in PowerSync
}
```

## Data Persistence

**Company Record** (companies table):
```javascript
{
  id: 'uuid',
  name: 'User's Company Name',
  industry_type: 'real_estate', // ← Identifies this as Real Estate workspace
  subscription_plan: 'professional',
  currency: 'USD',
  country: 'United States',
  created_at: '2024-06-23T...',
  updated_at: '2024-06-23T...'
}
```

**Profile Record** (profiles table):
```javascript
{
  id: 'user-uuid',
  company_id: 'company-uuid',
  industry_type: 'real_estate', // ← Fast lookup for dashboard
  role: 'company_admin',
  company_name: 'User\'s Company Name',
  created_at: '2024-06-23T...'
}
```

**Session Storage** (Frontend):
```javascript
sessionStorage.setItem('slate_industry_override', 'real_estate');
// Used for quick industry detection without database lookup
```

## Verification Steps

After user completes onboarding with Real Estate selected:

✓ Company created with `industry_type = 'real_estate'`
✓ Profile updated with `industry_type = 'real_estate'`
✓ Session storage contains 'real_estate'
✓ Dashboard component loads correctly
✓ Navigation menu shows Real Estate items
✓ Intelligence engine is active
✓ PowerSync tables are synced
✓ Novu templates are configured
✓ Paystack integration is ready

## Troubleshooting User Issues

**"Real Estate isn't showing in my industry list"**
- Admin toggle is set to GLOBAL_OFF
- Contact admin to enable it
- Workaround: Create workspace as Retail, then change industry_type manually

**"I selected Real Estate but see Law Firm dashboard"**
- Browser cache issue
- Solution: Hard refresh (Ctrl+Shift+R)
- Or: Check that company.industry_type is actually 'real_estate'

**"Real Estate pages return 404"**
- Pages not deployed yet
- Check that RealEstateDashboard.jsx, Properties.jsx files exist
- Verify routing is configured

**"Intelligence insights not showing for real estate"**
- Intelligence engine not loaded
- Check browser console for errors
- Verify real-estate.js engine exists in /lib/intelligence/engines/

For more technical details, see:
- `REAL_ESTATE_IMPLEMENTATION.md` - Architecture and database schema
- `REAL_ESTATE_ADMIN_GUIDE.md` - Admin controls and toggles
- `REAL_ESTATE_QUICK_START.md` - Developer quick reference
