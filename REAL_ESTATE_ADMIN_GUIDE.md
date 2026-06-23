# Real Estate Vertical - Admin & Integration Guide

## Overview
The Real Estate vertical has been fully integrated into Slate's multi-vertical architecture, with admin toggle controls and onboarding support matching existing verticals (Law, Retail, Hotel, etc.).

## What Was Added

### 1. Industry Configuration (`src/config/industries.js`)
Added complete Real Estate industry definition with:
- **Icon**: 🏠
- **Roles**: Broker/Owner, Agent, Property Manager, Accountant, Finance Officer, Admin
- **Navigation Menu**: 19 menu items covering properties, clients, viewings, offers, transactions, commissions, leases, rent payments, maintenance, analytics, and more
- **Departments**: Standard (Admin, Finance, HR, Operations, Tech)
- **Terminology**: Customized for real estate (Client, Property, Agent, Office, Viewing)

### 2. Admin Rollout Toggle (`src/pages/admin/AdminRollout.jsx`)
Added Real Estate as a toggleable feature flag:
- **Feature ID**: `f_real_estate`
- **Name**: Real Estate Vertical
- **Description**: Complete real estate management suite with properties, clients, viewings, transactions & leases
- **Default Status**: `global_on` (enabled across all tenants)
- **Scope**: All Tenants

**How to Use:**
- Navigate to Admin Dashboard → Global Rollout Manager
- Find "Real Estate Vertical" in the feature flags list
- Click the power button to toggle between:
  - **Global ON** (green): Available to all tenants
  - **Cohort** (amber): Available to selected organizations only
  - **Global OFF** (red): Disabled for all tenants

### 3. Onboarding Integration (`src/pages/OnboardingWizard.jsx`)
Real Estate added to the industry selection dropdown during onboarding:
- Users can now select "Real Estate" when creating a new workspace
- Works identically to other verticals (Law, Retail, Hotel, School, etc.)
- Supports all setup modes: Template, Orbit AI, and Custom
- Properly initializes company industry type as `real_estate`

## Real Estate Module Components

### Database Tables (10 PowerSync Tables)
All added to `src/api/AppSchema.js`:

**Offline-Synced Tables** (available offline):
- `univ_re_properties` - Property listings with details, pricing, agent assignment
- `univ_re_clients` - Buyer/Seller/Tenant/Landlord management with preferences
- `univ_re_viewings` - Viewing appointments with feedback tracking
- `univ_re_leases` - Rental agreements with terms and payment schedules
- `univ_re_maintenance_requests` - Property maintenance issue tracking

**Real-Time Tables** (require online access):
- `univ_re_offers` - Purchase/rental offers with contingencies
- `univ_re_transactions` - Completed sales/rentals with closing details
- `univ_re_commissions` - Agent commission tracking and payments
- `univ_re_rent_payments` - Rent payment history and status
- `univ_re_documents` - Document storage with file URLs and permissions

### API Layer (`src/api/RealEstateAPI.js`)
Complete CRUD operations with:
- PowerSync sync/unsync capability
- RBAC permission checking
- Audit logging for all operations
- 40+ methods covering all entity types

### Intelligence Engine (`src/lib/intelligence/engines/real-estate.js`)
Predictive analytics modules:
- Property Valuation Prediction - Price anomaly detection
- Buyer Readiness Scoring - Client engagement + budget analysis
- Agent Performance Analytics - Sales metrics and benchmarking
- Lease Renewal Risk - 30-day expiration alerts
- Maintenance Priority Analysis - Critical issue identification

### UI Pages (`src/pages/real-estate/`)
- **RealEstateDashboard.jsx** - KPI cards, charts, quick actions
- **Properties.jsx** - Full CRUD with search/filter
- **Clients.jsx** - Client database with role-based filtering
- **Leases.jsx** - Lease management with expiration tracking

### Integrations (`src/api/RealEstateIntegrations.js`)
- **Novu**: 15 notification templates (viewings, offers, leases, rent, maintenance)
- **Paystack**: Commission payments + rent collection
- **Automation**: Viewing reminders, lease renewal alerts, rent overdue notifications

### Offline Sync Configuration (`src/api/RealEstateOfflineSync.js`)
- Sync strategy with conflict resolution
- Offline table availability settings
- Automatic sync on reconnect

## How It Works in Admin Dashboard

### Toggling the Real Estate Vertical

1. **Access Admin Rollout Manager**
   ```
   Admin Dashboard > Global Rollout Manager
   ```

2. **Locate "Real Estate Vertical" Flag**
   - Displayed alongside other features (OrbitBuild, AI Legal Strategy, HR Dashboard)

3. **Toggle Feature Status**
   - **Power Button** cycles through states:
     - Green (Global ON) → Amber (Cohort) → Red (Global OFF) → Green
   - **Scope Badge** updates to show current scope

4. **Verify in Onboarding**
   - When Real Estate is enabled, users see it in the industry dropdown
   - Selection creates a company with `industry_type: 'real_estate'`

### User Experience When Enabled

**During Onboarding:**
1. User creates new workspace
2. Selects "Real Estate" from industry dropdown
3. Chooses setup mode (Template/Orbit/Custom)
4. Completes profile and subscription
5. Workspace initializes with Real Estate dashboard and navigation menu

**In Dashboard:**
1. Real Estate navigation menu appears in sidebar
2. Dashboard shows real estate specific KPIs
3. All Real Estate pages accessible
4. Intelligence insights auto-generated

## Configuration Reference

### Industry Key
```javascript
real_estate: {
  name: 'Real Estate',
  icon: '🏠',
  // ... roles, departments, nav menu
}
```

### Feature Flag
```javascript
{
  id: 'f_real_estate',
  name: 'Real Estate Vertical',
  status: 'global_on',
  scope: 'All Tenants'
}
```

### Navigation Menu Structure
The Real Estate vertical includes 19 menu items following Slate's standardized pattern:
- Primary sections (Dashboard, Properties, Clients, etc.)
- Secondary options (Analytics, Reports, HR & Leave)
- System settings (Roles, Departments, Settings)

## Matching Existing Patterns

Real Estate vertical fully mirrors the implementation of other Slate verticals:

| Feature | Real Estate | Law Firm | Retail | Hotel |
|---------|-----------|---------|--------|-------|
| Admin Toggle | ✓ | ✓ | ✓ | ✓ |
| Onboarding Support | ✓ | ✓ | ✓ | ✓ |
| Industry Config | ✓ | ✓ | ✓ | ✓ |
| DB Tables | ✓ | ✓ | ✓ | ✓ |
| API Handlers | ✓ | ✓ | ✓ | ✓ |
| Intelligence Engine | ✓ | ✓ | ✓ | ✓ |
| UI Pages | ✓ | ✓ | ✓ | ✓ |
| Novu Integration | ✓ | ✓ | ✓ | ✓ |

## Testing Checklist

1. **Admin Toggle Test**
   - [ ] Navigate to Admin Rollout Manager
   - [ ] Find "Real Estate Vertical" flag
   - [ ] Verify toggle states cycle correctly
   - [ ] Verify scope updates with each state

2. **Onboarding Test**
   - [ ] Create new workspace
   - [ ] Verify "Real Estate" appears in industry dropdown
   - [ ] Select Real Estate industry
   - [ ] Complete onboarding flow
   - [ ] Verify dashboard loads with Real Estate nav

3. **Feature Access Test**
   - [ ] Login to Real Estate workspace
   - [ ] Verify all Real Estate menu items visible
   - [ ] Verify dashboard shows Real Estate KPIs
   - [ ] Verify can navigate to Properties, Clients, Leases, etc.

## Troubleshooting

**Q: Real Estate doesn't appear in onboarding**
- A: Ensure the toggle is set to `global_on` in Admin Rollout Manager

**Q: Real Estate option greyed out in admin**
- A: Toggle state is controlled by admin. Check feature flag status.

**Q: Dashboard shows wrong navigation**
- A: Clear browser cache and refresh. Verify `industry_type` is set to `real_estate` in database.

**Q: Intelligence insights not showing**
- A: Ensure Real Estate Intelligence Engine is loaded. Check console for errors.

## Next Steps

1. **Customize Roles** - Add industry-specific roles as needed
2. **Extend Navigation** - Add custom menu items per organization
3. **Configure Notifications** - Set up Novu templates for your use case
4. **Setup Automation** - Configure payment automation with Paystack

For detailed technical documentation, see `REAL_ESTATE_IMPLEMENTATION.md` and `REAL_ESTATE_QUICK_START.md`.
