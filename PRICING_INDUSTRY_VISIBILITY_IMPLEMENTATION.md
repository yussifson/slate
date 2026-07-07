# Pricing & Industry Visibility Implementation Guide

## Overview

This document describes the complete implementation of two interconnected features:

1. **Test Plan Removal** - Hide test plans (amount = 2) from regular users while preserving data for super admins
2. **Industry Visibility Toggle** - Enable/disable industries in onboarding through a super admin dashboard

## Implementation Summary

### Phase 1: Database Schema Changes

#### File: `supabase/migrations/20260707000000_add_plan_visibility_and_industry_toggle.sql`

**Changes Made:**

1. **subscription_plans table**
   - Added `is_visible` BOOLEAN column (DEFAULT true, NOT NULL)
   - Updated all test plan rows (name='test plan', price_monthly=2) to set `is_visible = false`
   - Added audit columns: `visibility_changed_by` and `visibility_changed_at`

2. **industry_visibility table** (NEW)
   - `id` (UUID PRIMARY KEY)
   - `industry_key` (TEXT UNIQUE) - e.g., 'law', 'hospital', 'school'
   - `is_active` (BOOLEAN DEFAULT true)
   - `created_at`, `updated_at` (TIMESTAMP)
   - `created_by` (UUID FK to profiles)
   - Auto-updating timestamp trigger

3. **RLS Policies**
   - subscription_plans: Super admins see all; users see only `is_visible=true` plans
   - industry_visibility: Authenticated users can read; super admins can read/write/delete
   - All policies use `auth.uid()` checks against profiles.role = 'super_admin'

4. **Audit Tables & Triggers**
   - `industry_visibility_audit` table tracks all changes
   - Automatic trigger logs who changed what and when
   - Enables compliance & rollback tracking

5. **Seed Data**
   - Inserted 22 industries with `is_active=true` by default
   - All industries from INDUSTRIES config are included
   - Supports backward compatibility with no visibility record

### Phase 2: Helper Functions & Business Logic

#### File: `src/lib/industryVisibility.ts`

**Key Functions:**

1. **getVisibleIndustries(includeInactive, userId)**
   - Fetches industry_visibility records from database
   - Filters INDUSTRIES config based on is_active status
   - Super admins see all; regular users see only active
   - Returns object with filtered industry configs

2. **getVisiblePlans(marketTier, userId)**
   - Filters subscription_plans by market_tier
   - Super admins see all; regular users see only is_visible=true
   - Always includes Free plan if not present
   - Respects is_active column

3. **updateIndustryVisibility(industryKey, isActive, userId)**
   - Super admin verification (throws if not admin)
   - Updates industry_visibility.is_active
   - Audit log created automatically by trigger
   - Toast notifications on success/error

4. **getAllIndustryVisibility(userId)**
   - Fetch all industries with current status (admin view)
   - Includes created_at, updated_at, created_by
   - Used by AdminIndustryManagement

5. **getIndustryVisibilityAuditLog(industryKey?)**
   - Returns audit trail of changes
   - Optional filter by specific industry
   - Limits to 100 most recent changes

6. **useIndustryVisibility() Hook**
   - React hook for component integration
   - Exposes fetchVisibleIndustries, fetchVisiblePlans, updateVisibility
   - Uses useAuth() context for user ID

**Security:**
- All functions check `auth.uid()` against super_admin role
- Database RLS enforces additional layer
- No client-side access to unapproved data

### Phase 3: Onboarding Wizard Updates

#### File: `src/pages/OnboardingWizard.jsx`

**Changes Made:**

1. **Import New Functions**
   ```jsx
   import { getVisiblePlans, getVisibleIndustries } from '@/lib/industryVisibility';
   ```

2. **State Management**
   ```jsx
   const [visibleIndustries, setVisibleIndustries] = useState({});
   const [industriesLoading, setIndustriesLoading] = useState(true);
   ```

3. **Effects**
   - New effect fetches `getVisibleIndustries(false, user?.id)` on component mount
   - Updated plan effect uses `getVisiblePlans(tier, user?.id)`
   - Both respect user's admin status

4. **Industry Dropdown**
   - Now renders from `visibleIndustries` object
   - Fallback to hardcoded list if loading
   - Only shows industries where `is_active=true` (or all if super admin)

5. **Result**
   - Regular users: See only active industries in dropdown
   - Super admins: See all industries, including inactive ones
   - Test plans: Automatically hidden from regular users
   - Super admins: Can still access test plans if is_visible=false (for admin view)

### Phase 4: Super Admin Dashboard

#### File: `src/pages/admin/AdminIndustryManagement.jsx` (NEW)

**Features:**

1. **Visual Layout**
   - Summary cards showing: Total Industries, Active Count, Inactive Count
   - Search/filter bar for finding industries
   - Grid layout (3 columns) of industry cards
   - Recent changes audit log section

2. **Industry Cards**
   - Icon + name + industry_key display
   - Status badge (Active/Inactive)
   - Last updated date
   - Toggle switch to activate/deactivate
   - Info text explaining current status
   - Loading state during mutation

3. **Interactions**
   - Click toggle to change industry visibility
   - Toast notification on success/error
   - Automatic query cache invalidation
   - Audit log updates in real-time

4. **Styling**
   - Color-coded: Green for active, gray/muted for inactive
   - Smooth transitions and hover effects
   - Responsive grid (1 col mobile, 3 col desktop)
   - Consistent with admin styling (AdminBilling.jsx)

5. **Access Control**
   - `getAllIndustryVisibility()` checks super_admin role
   - Only super admins can see/access this page
   - Update mutations verify admin status server-side

6. **Performance**
   - Uses React Query for caching and refetching
   - Debounced search
   - Optimistic updates with rollback on error
   - Only 100 recent audit entries shown

## User Flows

### Regular User Flow (Onboarding)

1. User navigates to `/onboarding`
2. Step 1: Choose setup mode + select industry
   - Industry dropdown populated from `getVisibleIndustries()`
   - Only shows active industries (is_active=true)
   - Cannot see test plan
3. Step 4: Choose subscription plan
   - Plans fetched from `getVisiblePlans(tier, userId)`
   - Test plan filtered out (is_visible=false)
   - Only sees Professional/Business/Enterprise + Free
4. Completes onboarding normally

### Super Admin Flow (Industry Management)

1. Super admin navigates to `/admin/industry-management`
2. Sees all industries + current visibility status
3. Can toggle any industry on/off
4. Changes reflected immediately:
   - Database updated
   - Audit log created
   - Toast notification shown
5. Change affects all new users' onboarding immediately

### Super Admin Flow (Viewing Hidden Plans)

1. Super admin in AdminBilling.jsx sees test plan in plan list
2. Can view test plan details (for debugging/testing)
3. Cannot modify is_visible through UI (would need direct SQL or new admin panel)

## Data Flow Diagrams

### Plan Visibility Flow

```
Onboarding Plan Selection
│
├─> getVisiblePlans(tier, userId)
│   ├─> Check if user is super_admin
│   ├─> Query subscription_plans
│   │   └─> WHERE is_active=true AND (is_visible=true OR user_is_admin)
│   └─> Return filtered plans
│
├─> [Regular User] → Sees Professional/Business/Enterprise
└─> [Super Admin] → Sees above + Test Plan
```

### Industry Visibility Flow

```
Onboarding Industry Selection
│
├─> getVisibleIndustries(false, userId)
│   ├─> Check if user is super_admin
│   ├─> Fetch industry_visibility records
│   ├─> Filter INDUSTRIES config
│   │   └─> WHERE is_active=true (OR all if super_admin)
│   └─> Return filtered object
│
├─> [Regular User] → Sees only active industries
└─> [Super Admin] → Sees all industries + toggle option
```

### Admin Update Flow

```
AdminIndustryManagement
│
├─> User clicks toggle
├─> updateIndustryVisibility(key, newStatus, userId)
│   ├─> Verify user is super_admin
│   ├─> UPDATE industry_visibility SET is_active=newStatus
│   ├─> Trigger audit log insert
│   └─> Return success
├─> Query cache invalidated
├─> Component re-fetches data
└─> UI updates + toast shown
```

## Testing Checklist

### Regular User Testing

- [ ] Onboarding: Industry dropdown shows only active industries
- [ ] Onboarding: Test plan NOT shown in plan selection
- [ ] Onboarding: Can complete flow normally
- [ ] Dashboard: After login, user sees correct industry/plan

### Super Admin Testing

- [ ] AdminIndustryManagement: Can access page
- [ ] AdminIndustryManagement: Sees all industries with status
- [ ] AdminIndustryManagement: Can toggle industry on/off
- [ ] AdminIndustryManagement: Toast notification appears on toggle
- [ ] AdminIndustryManagement: Changes take effect immediately
- [ ] AdminIndustryManagement: Audit log shows recent changes
- [ ] AdminBilling: Test plan visible in plan list (for testing/debugging)

### Database Testing

- [ ] subscription_plans.is_visible column exists and NOT NULL
- [ ] industry_visibility table created with all columns
- [ ] RLS policies enforced (verify with direct queries)
- [ ] Audit trigger fires on updates
- [ ] Seed data inserted (22 industries)

### Edge Cases

- [ ] New industry added to INDUSTRIES config: Treated as active by default
- [ ] User toggles industry back and forth: Changes reflected immediately
- [ ] Concurrent toggles: Database handles with proper locking
- [ ] Super admin sees hidden industries in onboarding: Works correctly
- [ ] Test plan can still be used if toggled back to visible: Backward compatible

## Security Considerations

### Authentication & Authorization

- All functions verify `auth.uid()` against `profiles.role = 'super_admin'`
- Database RLS policies provide additional enforcement
- No sensitive data exposed in client-side code

### Data Integrity

- Audit log maintained for all changes
- Timestamps tracked automatically
- created_by field identifies who made each change
- Cannot be bypassed without direct database access

### Backward Compatibility

- Industries without visibility record treated as active
- Existing plans default to is_visible=true
- No breaking changes to existing flows

## Future Enhancements

1. **Bulk Operations**
   - Enable/disable multiple industries at once
   - Batch updates for efficiency

2. **Scheduled Rollouts**
   - Schedule industry activation for specific dates
   - Useful for gradual rollouts

3. **Regional Restrictions**
   - Show different industries by geographic region
   - Extend industry_visibility table with region column

4. **Custom Ordering**
   - Allow super admin to reorder industries in onboarding dropdown
   - Add display_order column to industry_visibility

5. **Analytics**
   - Track which industries are most popular
   - Show adoption metrics in admin dashboard

6. **Feature Flags Integration**
   - Link industry visibility to feature flag system
   - Allow gradual rollout of new industries

## Files Modified/Created

### Created Files
- `supabase/migrations/20260707000000_add_plan_visibility_and_industry_toggle.sql` (187 lines)
- `src/lib/industryVisibility.ts` (284 lines)
- `src/pages/admin/AdminIndustryManagement.jsx` (320 lines)

### Modified Files
- `src/pages/OnboardingWizard.jsx` (Updated plan & industry fetching, 4 lines changed)

### Total Changes
- ~800 lines of new code
- 3 new database tables (industry_visibility, industry_visibility_audit, audit trigger)
- 1 new column on existing table (subscription_plans.is_visible)
- 1 new admin page
- 1 new utility library
- Full backward compatibility maintained

## Deployment Steps

1. **Review migration file**: `supabase/migrations/20260707000000_add_plan_visibility_and_industry_toggle.sql`
2. **Test in staging environment**: Verify RLS policies work
3. **Run migration**: `supabase db push` (auto-runs on `npm run dev`)
4. **Deploy code**: Push changes to main branch
5. **Verify onboarding**: Test with regular user and super admin accounts
6. **Monitor**: Check for errors in error tracking system

## Rollback Plan

If issues arise:

1. **Quick Rollback**: Hide affected UI via feature flag
2. **Full Rollback**: `supabase db reset` in staging; revert code commits
3. **Partial Rollback**: Set all industries back to active: `UPDATE industry_visibility SET is_active=true;`
4. **Re-enable Test Plan**: `UPDATE subscription_plans SET is_visible=true WHERE name='test plan';`

## Support & Troubleshooting

### Issue: Industries not showing in onboarding

**Solution:**
- Check if industry_visibility table has records
- Verify RLS policies on industry_visibility table
- Check browser console for errors
- Confirm user is not super admin (would see all anyway)

### Issue: Test plan showing when it shouldn't

**Solution:**
- Verify `is_visible=false` for test plans in database
- Check RLS policy on subscription_plans
- Clear browser cache
- Restart dev server

### Issue: Admin can't update industries

**Solution:**
- Verify user role is 'super_admin' in profiles table
- Check RLS policy allows UPDATE on industry_visibility
- Verify `created_by` user ID is correct
- Check browser console for GraphQL errors

## Contact & Questions

For implementation questions or issues:
1. Review this document first
2. Check test results against testing checklist
3. Verify all files are deployed correctly
4. Check database logs for RLS policy violations
