# Real Estate Vertical - Visual Integration Guide

## Admin Toggle Control Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUPER ADMIN DASHBOARD                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Global Rollout Manager                                         │
│  ───────────────────────────────────────────────────────────    │
│                                                                 │
│  Feature Flags:                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ OrbitBuild Studio                       ✓ GLOBAL_ON    │   │
│  │ Enable the visual workflow builder                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ AI Legal Strategy                      ⊙ COHORT        │   │
│  │ Enable LLaMa-3 case prediction                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Real Estate Vertical               ✓ GLOBAL_ON [TOGGLE]│   │
│  │ Complete real estate management suite with properties, │   │
│  │ clients, viewings, transactions & leases             │   │
│  │                                                         │   │
│  │ Scope: All Tenants                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ HR Dashboard                           ✓ GLOBAL_ON    │   │
│  │ Enable employee management                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Toggle States & Effects

```
┌────────────────────────────────────────────────────────────────┐
│              REAL ESTATE TOGGLE STATES                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  State 1: GLOBAL_ON (✓ Green)                                 │
│  ─────────────────────────────                                │
│  ├─ Real Estate visible in onboarding dropdown               │
│  ├─ All new workspaces can select it                         │
│  ├─ Industry filter: industry_type = 'real_estate'           │
│  └─ Scope: All Tenants                                       │
│                                                                │
│  ───────────────────────────────────────────────────────────  │
│         [Click Power Button ↓]                               │
│  ───────────────────────────────────────────────────────────  │
│                                                                │
│  State 2: COHORT (⊙ Amber)                                    │
│  ─────────────────                                            │
│  ├─ Real Estate visible to SELECTED organizations            │
│  ├─ Admin chooses which companies see it                     │
│  ├─ Scope: Selected Cohorts                                  │
│  └─ Non-selected users see: "Feature not available"          │
│                                                                │
│  ───────────────────────────────────────────────────────────  │
│         [Click Power Button ↓]                               │
│  ───────────────────────────────────────────────────────────  │
│                                                                │
│  State 3: GLOBAL_OFF (✗ Red)                                  │
│  ──────────────────────────                                   │
│  ├─ Real Estate removed from dropdown                        │
│  ├─ Cannot create new Real Estate workspaces                 │
│  ├─ Existing workspaces continue to function                 │
│  └─ Scope: None                                              │
│                                                                │
│  ───────────────────────────────────────────────────────────  │
│         [Click Power Button ↓]                               │
│  ───────────────────────────────────────────────────────────  │
│                                                                │
│  Returns to State 1: GLOBAL_ON ✓                              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Onboarding Flow with Real Estate

```
┌──────────────────────────────────────────────────────────────────┐
│                     ONBOARDING WIZARD                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 1: Select Industry                                        │
│  ──────────────────────────                                     │
│                                                                  │
│  "Choose your industry type to customize your workspace:"       │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ SELECT WORKSLATE TYPE:                            ▼    │    │
│  │                                                          │    │
│  │ ○ Law Firm                                             │    │
│  │ ○ Retail / POS                                         │    │
│  │ ○ Real Estate                 ← NEW OPTION            │    │
│  │ ○ School & Education                                   │    │
│  │ ○ Hospital & Healthcare                                │    │
│  │ ○ Hotel & Hospitality                                  │    │
│  │ ○ Insurance Agency                                     │    │
│  │ ○ HR & ERP                                             │    │
│  │ ○ Religious Organization                               │    │
│  │ ○ Logistics & Delivery                                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  [User selects: Real Estate] ✓                                  │
│                                                                  │
│  ──────────────────────────────────────────────────────────    │
│                                                                  │
│  Step 2: Choose Setup Mode                                      │
│  ───────────────────────────                                    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ○ Build with Template (Recommended)                     │   │
│  │   Initializes dashboard with all standard predefined    │   │
│  │   pages and slates for a Real Estate business.         │   │
│  │                                                          │   │
│  │ ○ Build with Orbit (AI Powered)                        │   │
│  │   Start with blank slate. Use AI to generate custom    │   │
│  │   pages and databases exactly how you want them.       │   │
│  │                                                          │   │
│  │ ○ Build with Custom                                    │   │
│  │   Build your workspace completely from scratch.        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  [User selects: Build with Template] ✓                          │
│                                                                  │
│  ──────────────────────────────────────────────────────────    │
│                                                                  │
│  Step 3: Complete Profile                                       │
│  ──────────────────────                                         │
│                                                                  │
│  Company Name: [My Real Estate Co]                             │
│  Subdomain: [realestate-co]                                    │
│  Country: [United States]                                      │
│  Currency: [USD]                                               │
│                                                                  │
│  ──────────────────────────────────────────────────────────    │
│                                                                  │
│  Step 4: Select Plan                                            │
│  ──────────────────                                             │
│                                                                  │
│  Free Trial  │  Professional  │  Enterprise                    │
│                                                                  │
│  [User selects plan] ✓                                          │
│                                                                  │
│  ══════════════════════════════════════════════════════════    │
│                                                                  │
│  DATABASE UPDATES:                                              │
│  ─────────────────                                              │
│  INSERT INTO companies VALUES (                                │
│    id: 'uuid-123',                                             │
│    name: 'My Real Estate Co',                                  │
│    industry_type: 'real_estate',    ← KEY IDENTIFIER          │
│    subdomain: 'realestate-co',                                 │
│    currency: 'USD',                                            │
│    country: 'United States',                                   │
│    subscription_plan: 'professional'                           │
│  );                                                             │
│                                                                  │
│  UPDATE profiles SET                                            │
│    company_id: 'uuid-123',                                     │
│    industry_type: 'real_estate',                               │
│    role: 'company_admin'                                       │
│  WHERE id = 'user-uuid';                                       │
│                                                                  │
│  ══════════════════════════════════════════════════════════    │
│                                                                  │
│  ✓ INITIALIZATION COMPLETE                                      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Dashboard Auto-Detection & Load

```
┌──────────────────────────────────────────────────────────────────┐
│              WORKSPACE DASHBOARD INITIALIZATION                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User Logs In                                               │
│  ──────────────────                                            │
│     └─→ AuthContext fetches user + company profile            │
│                                                                  │
│  2. Detect Industry                                            │
│  ──────────────────                                            │
│     const activeIndustry = user?.company_industry              │
│     └─→ activeIndustry = 'real_estate'                         │
│                                                                  │
│  3. Check Industries Config                                    │
│  ───────────────────────────                                   │
│     const industryData = INDUSTRIES['real_estate']             │
│     └─→ Loads Real Estate configuration                        │
│         - Roles: Broker, Agent, Property Manager, etc.         │
│         - Navigation: 19 menu items                            │
│         - Terminology: Client, Property, Agent, etc.           │
│                                                                  │
│  4. Load Dashboard Component                                   │
│  ──────────────────────────                                    │
│     switch(activeIndustry) {                                   │
│       case 'real_estate':                                      │
│         └─→ Render <RealEstateDashboard />                     │
│       case 'retail':                                           │
│         └─→ Render <RetailDashboard />                         │
│       default:                                                 │
│         └─→ Render <LawDashboard />                            │
│     }                                                           │
│                                                                  │
│  5. Initialize Intelligence Engine                            │
│  ────────────────────────────────                              │
│     const engine = new RealEstateIntelligenceEngine()          │
│     └─→ Loads predictive models:                               │
│         - Property Valuation Prediction                        │
│         - Buyer Readiness Scoring                              │
│         - Agent Performance Analytics                          │
│         - Lease Renewal Risk Detection                         │
│         - Maintenance Priority Analysis                        │
│                                                                  │
│  6. Sync PowerSync Data                                       │
│  ─────────────────────                                         │
│     await powerSync.sync()                                     │
│     └─→ Downloads offline-available tables:                    │
│         - Properties                                           │
│         - Clients                                              │
│         - Viewings                                             │
│         - Leases                                               │
│         - Maintenance Requests                                 │
│                                                                  │
│  7. Render Sidebar Navigation                                 │
│  ──────────────────────────                                    │
│     const nav = INDUSTRIES['real_estate'].nav                  │
│     └─→ Generates menu with 19 items:                          │
│         Dashboard                                              │
│         Properties                                             │
│         Clients                                                │
│         Viewings                                               │
│         Offers                                                 │
│         Transactions                                           │
│         Commissions                                            │
│         Leases                                                 │
│         Rent Payments                                          │
│         Maintenance                                            │
│         ...                                                    │
│                                                                  │
│  8. Display Real Estate Dashboard                             │
│  ────────────────────────────────                              │
│     ┌──────────────────────────────────────────────────────┐   │
│     │ My Real Estate Co                                    │   │
│     ├──────────────────────────────────────────────────────┤   │
│     │                                                      │   │
│     │  Real Estate Dashboard                              │   │
│     │                                                      │   │
│     │  KPIs:                                               │   │
│     │  ┌─────────────┐  ┌──────────────┐                 │   │
│     │  │ 24          │  │ 8            │                 │   │
│     │  │ Properties  │  │ Viewings     │                 │   │
│     │  └─────────────┘  └──────────────┘                 │   │
│     │  ┌──────────────┐  ┌──────────────┐                 │   │
│     │  │ 3            │  │ $12,500      │                 │   │
│     │  │ Pending Offers          Monthly Revenue  │                 │   │
│     │  └──────────────┘  └──────────────┘                 │   │
│     │                                                      │   │
│     │  Intelligence Insights:                             │   │
│     │  • Property valuation trends ↑ 8% YoY              │   │
│     │  • John Smith: Highest performer (5 sales)         │   │
│     │  • 2 leases expiring next month - renewal alerts   │   │
│     │  • 1 critical maintenance item - priority: HIGH    │   │
│     │                                                      │   │
│     └──────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Architecture Pattern Comparison

```
┌─────────────────────────────────────────────────────────────────┐
│         HOW REAL ESTATE MATCHES OTHER VERTICALS                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  LAYER              LAW FIRM         RETAIL         REAL EST    │
│  ──────             ─────────         ──────         ────────   │
│                                                                 │
│  Admin Toggle       f_ai              f_retail       f_re       │
│  Industry Key       law               retail         real_est   │
│  Dashboard          LawDashboard      RetailDB       RealEstD   │
│  Intelligence       LawIntel          RetailIntel    REIntel    │
│  API Handler        LawAPI            RetailAPI      REAPI      │
│  Pages              4-8 pages         5+ pages       4+ pages   │
│  DB Tables          10+ tables        10+ tables     10 tables  │
│  Notifications      Novu (12 tmpl)    Novu (15 tmpl) Novu (15)  │
│  Payments           Paystack (fees)   Paystack       Paystack   │
│  Offline Sync       ✓ Configured      ✓ Configured   ✓ Config   │
│  RBAC               ✓ Enabled         ✓ Enabled      ✓ Enabled  │
│  Audit Logging      ✓ Implemented     ✓ Implemented  ✓ Impl     │
│                                                                 │
│  ✓ ALL FEATURES IDENTICAL PATTERN                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow During Selection

```
┌────────────────────────────────────────────────────────────────────┐
│                REAL ESTATE SELECTION DATA FLOW                     │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  1. ADMIN TOGGLE ENABLED                                          │
│     └─ f_real_estate: status = 'global_on'                        │
│                                                                    │
│  2. USER ONBOARDING                                               │
│     └─ Selects "Real Estate" from dropdown                        │
│        └─ Sets state: industry = 'real_estate'                    │
│                                                                    │
│  3. BACKEND PROCESSING                                            │
│     ├─ Create company record:                                     │
│     │  industry_type = 'real_estate'                              │
│     │  └─ Stored in: companies.industry_type                      │
│     │                                                              │
│     ├─ Create PowerSync tables:                                   │
│     │  ├─ univ_re_properties                                      │
│     │  ├─ univ_re_clients                                         │
│     │  ├─ univ_re_viewings                                        │
│     │  ├─ univ_re_offers                                          │
│     │  ├─ univ_re_transactions                                    │
│     │  ├─ univ_re_commissions                                     │
│     │  ├─ univ_re_documents                                       │
│     │  ├─ univ_re_leases                                          │
│     │  ├─ univ_re_rent_payments                                   │
│     │  └─ univ_re_maintenance_requests                            │
│     │                                                              │
│     └─ Register Novu templates:                                   │
│        ├─ Viewing Scheduled                                       │
│        ├─ Viewing Completed                                       │
│        ├─ Offer Submitted                                         │
│        ├─ Offer Accepted                                          │
│        ├─ Transaction Completed                                   │
│        ├─ Commission Earned                                       │
│        ├─ Lease Expiring Soon                                     │
│        └─ Rent Payment Overdue                                    │
│                                                                    │
│  4. USER DASHBOARD LOAD                                           │
│     ├─ Lookup: company.industry_type = 'real_estate'              │
│     ├─ Load: INDUSTRIES['real_estate']                            │
│     ├─ Render: <RealEstateDashboard />                            │
│     ├─ Initialize: RealEstateIntelligenceEngine                   │
│     ├─ Sync: PowerSync offline tables                             │
│     └─ Display: Real Estate navigation menu                       │
│                                                                    │
│  5. USER OPERATES SYSTEM                                          │
│     ├─ Add properties via Properties page                         │
│     ├─ Manage clients via Clients page                            │
│     ├─ Schedule viewings                                          │
│     ├─ Track commissions                                          │
│     ├─ Receive notifications (Novu)                               │
│     ├─ Process payments (Paystack)                                │
│     ├─ Sync offline when disconnected                             │
│     └─ View intelligence insights                                 │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

## Files Organized by Function

```
┌─────────────────────────────────────────────────────────────────┐
│              REAL ESTATE MODULE STRUCTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CONFIG & SETUP                                                 │
│  ─────────────                                                  │
│  └─ src/config/industries.js                                    │
│     └─ INDUSTRIES['real_estate'] configuration                  │
│                                                                  │
│  ADMIN CONTROLS                                                 │
│  ──────────────                                                 │
│  └─ src/pages/admin/AdminRollout.jsx                            │
│     └─ Feature toggle UI & state management                     │
│                                                                  │
│  ONBOARDING                                                     │
│  ──────────                                                     │
│  └─ src/pages/OnboardingWizard.jsx                              │
│     └─ Industry dropdown with Real Estate option                │
│                                                                  │
│  DATABASE SCHEMA                                                │
│  ────────────────                                               │
│  └─ src/api/AppSchema.js                                        │
│     └─ 10 PowerSync table definitions                           │
│                                                                  │
│  API LAYER                                                      │
│  ─────────                                                      │
│  └─ src/api/RealEstateAPI.js                                    │
│     └─ CRUD operations for all entities                         │
│                                                                  │
│  INTELLIGENCE                                                   │
│  ────────────                                                   │
│  └─ src/lib/intelligence/engines/real-estate.js                 │
│     └─ Predictive models & analytics                            │
│                                                                  │
│  UI COMPONENTS                                                  │
│  ──────────────                                                 │
│  └─ src/pages/real-estate/                                      │
│     ├─ RealEstateDashboard.jsx                                  │
│     ├─ Properties.jsx                                           │
│     ├─ Clients.jsx                                              │
│     ├─ Leases.jsx                                               │
│     └─ [Viewings, Offers, Transactions, Maintenance]            │
│                                                                  │
│  INTEGRATIONS                                                   │
│  ────────────                                                   │
│  └─ src/api/RealEstateIntegrations.js                           │
│     ├─ Novu notification templates                              │
│     ├─ Paystack payment processing                              │
│     └─ Automation triggers                                      │
│                                                                  │
│  OFFLINE SYNC                                                   │
│  ─────────────                                                  │
│  └─ src/api/RealEstateOfflineSync.js                            │
│     └─ Sync configuration & conflict resolution                 │
│                                                                  │
│  MODULE EXPORTS                                                 │
│  ───────────────                                                │
│  └─ src/lib/realEstateModule.js                                 │
│     └─ Unified exports for other modules                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Reference Card

```
╔═════════════════════════════════════════════════════════════════╗
║              REAL ESTATE VERTICAL - QUICK REF                  ║
╠═════════════════════════════════════════════════════════════════╣
║                                                                 ║
║  ADMIN TOGGLE                                                   ║
║  ────────────────                                              ║
║  Feature ID:    f_real_estate                                  ║
║  Status:        global_on (can toggle to cohort/off)           ║
║  Default:       Enabled (GLOBAL_ON)                            ║
║  Location:      Admin Dashboard > Global Rollout Manager       ║
║                                                                 ║
║  INDUSTRY SELECTION                                             ║
║  ──────────────────                                            ║
║  Key:           real_estate                                    ║
║  Display:       "Real Estate"                                  ║
║  Icon:          🏠                                             ║
║  Onboarding:    ✓ Visible in dropdown                          ║
║                                                                 ║
║  ROLES (6)                                                      ║
║  ──────────                                                     ║
║  • Broker / Owner        • Finance Officer                     ║
║  • Real Estate Agent     • Office Administrator                ║
║  • Property Manager                                            ║
║                                                                 ║
║  NAVIGATION MENU (19 items)                                    ║
║  ────────────────────────                                      ║
║  Dashboard, Properties, Clients, Viewings, Offers,             ║
║  Transactions, Commissions, Leases, Rent Payments,             ║
║  Maintenance, Documents, Analytics, Reports, Tasks,            ║
║  HR & Leave, Integrations, Automations, Roles,                 ║
║  Departments, Settings                                         ║
║                                                                 ║
║  DATABASE TABLES (10)                                          ║
║  ──────────────────                                            ║
║  Offline: properties, clients, viewings, leases, maintenance   ║
║  Real-time: offers, transactions, commissions,                 ║
║             rent_payments, documents                           ║
║                                                                 ║
║  INTELLIGENCE MODELS (5)                                       ║
║  ──────────────────────                                        ║
║  • Property Valuation Prediction                               ║
║  • Buyer Readiness Scoring                                     ║
║  • Agent Performance Analytics                                 ║
║  • Lease Renewal Risk Detection                                ║
║  • Maintenance Priority Analysis                               ║
║                                                                 ║
║  INTEGRATIONS                                                   ║
║  ────────────                                                  ║
║  • Novu: 15 notification templates                             ║
║  • Paystack: Commission & rent payments                        ║
║  • Automations: Renewal reminders, payment alerts              ║
║                                                                 ║
║  TEST CHECKLIST                                                 ║
║  ──────────────                                                ║
║  ✓ Admin toggle controls feature availability                  ║
║  ✓ Real Estate appears in onboarding dropdown                  ║
║  ✓ User can select Real Estate industry                        ║
║  ✓ Dashboard loads with Real Estate nav                        ║
║  ✓ Intelligence engine shows insights                          ║
║  ✓ Offline sync works for 5 tables                             ║
║  ✓ Novu notifications trigger correctly                        ║
║  ✓ Paystack integration ready                                  ║
║                                                                 ║
╚═════════════════════════════════════════════════════════════════╝
```

---

**Status**: ✓ Production Ready | ✓ Fully Integrated | ✓ Admin Controllable | ✓ User Selectable
