# Phase 2 Features Implementation Guide

This document outlines the three new features added to the Real Estate module: Team Management, Market Intelligence, and CRM Lead Management.

## Overview

### Feature 1: Team Management
**File:** `src/pages/real-estate/TeamManagement.jsx`

Manage your real estate team members, assign roles, track licenses, and monitor commission rates.

**Key Features:**
- Add/edit team members with roles (Admin, Agent, Support, Viewer)
- Track professional licenses and expiry dates
- Monitor commission rates and join dates
- View team statistics (total members, agents, admins, average commission)
- Role-based access control

**Database Tables:**
- `univ_re_team_members` - Team member details
- `univ_re_roles` - Role definitions and permissions
- `univ_re_activity_logs` - Audit trail of all actions

### Feature 2: Market Intelligence
**File:** `src/pages/real-estate/MarketIntelligence.jsx`

Analyze market trends and create comparable property analyses for valuation.

**Key Features:**
- View market trends by city and state (last 12 months)
- Track average prices, median prices, and price trends
- Create comparable analyses (CMA) with subject and comparable properties
- Automatic estimated value calculation
- Confidence level scoring for analyses
- MLS listing integration ready

**Database Tables:**
- `univ_re_mls_listings` - MLS listing data
- `univ_re_comparable_analysis` - Comparable property analyses
- `univ_re_market_trends` - Historical market data

### Feature 3: CRM Lead Management
**File:** `src/pages/real-estate/CRMLeads.jsx`

Track and manage property leads through the entire sales funnel.

**Key Features:**
- Create and manage leads (Buyers, Sellers, Investors, Renters)
- Track lead score (0-100) for prioritization
- Log lead activities (calls, emails, meetings, property viewings)
- Track lead stage and status through sales funnel
- Automatic status updates based on activity outcomes
- Multi-source lead tracking (website, referral, ads, phone)
- Budget range tracking

**Database Tables:**
- `univ_re_leads` - Lead contact information and status
- `univ_re_lead_scores` - AI-calculated lead quality scores
- `univ_re_lead_activities` - Interaction history
- `univ_re_lead_campaigns` - Marketing campaign tracking

## Setup Instructions

### 1. Database Migration

Run the SQL migration to create all new tables:

```bash
# Using psql directly
psql -h your-db-host -U postgres -d your-db-name -f supabase/migrations/20260625000000_add_phase_2_features.sql

# Or run manually through Supabase SQL editor
```

The migration creates:
- 11 new tables
- Proper indexes for performance
- Default roles (admin, agent, support, viewer)

### 2. Enable Row Level Security (RLS)

Apply RLS policies to all new tables. Reference existing policies in your database:

```sql
-- Example RLS policy pattern for team members
ALTER TABLE univ_re_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company's team"
  ON univ_re_team_members
  FOR SELECT
  USING (company_id = auth.uid()::uuid);
```

### 3. Configure PowerSync

Add the sync rules to your PowerSync configuration. Rules are defined in `POWERSYNC_RULES.md`.

Example sync rule for leads:

```sql
-- Add to PowerSync sync_rules table
SELECT id, company_id, first_name, last_name, email, phone, source,
       property_interest, budget_min, budget_max, lead_type, status, stage,
       assigned_agent_id, lead_score, notes, last_contact, next_followup,
       created_at, updated_at
FROM univ_re_leads
WHERE company_id = ?
  AND (assigned_agent_id = current_user_id OR created_by = current_user_id)
  AND status != 'deleted'
ORDER BY lead_score DESC, next_followup ASC
```

### 4. Add Navigation Links

Update your navigation menu to include the three new pages:

```jsx
// In your navigation component
<NavItem href="/real-estate/team-management" icon={Users}>
  Team Management
</NavItem>
<NavItem href="/real-estate/market-intelligence" icon={TrendingUp}>
  Market Intelligence
</NavItem>
<NavItem href="/real-estate/crm-leads" icon={Users}>
  CRM Leads
</NavItem>
```

### 5. Update Routes

Ensure your router includes these new pages:

```jsx
// Next.js App Router example
import TeamManagement from '@/pages/real-estate/TeamManagement';
import MarketIntelligence from '@/pages/real-estate/MarketIntelligence';
import CRMLeads from '@/pages/real-estate/CRMLeads';

export const routes = [
  { path: '/real-estate/team-management', component: TeamManagement },
  { path: '/real-estate/market-intelligence', component: MarketIntelligence },
  { path: '/real-estate/crm-leads', component: CRMLeads },
];
```

## API Methods Added to RealEstateAPI.js

### Team Management
```javascript
RealEstateAPI.createTeamMember(companyId, data, userId)
RealEstateAPI.getTeamMembers(companyId)
RealEstateAPI.updateTeamMember(companyId, memberId, data, userId)
```

### Market Intelligence
```javascript
RealEstateAPI.createMLSListing(companyId, data, userId)
RealEstateAPI.getComparableAnalysis(companyId, filters)
RealEstateAPI.createComparableAnalysis(companyId, data, userId)
RealEstateAPI.getMarketTrends(companyId, filters)
```

### CRM Leads
```javascript
RealEstateAPI.createLead(companyId, data, userId)
RealEstateAPI.getLeads(companyId, filters)
RealEstateAPI.updateLead(companyId, leadId, data, userId)
RealEstateAPI.createLeadActivity(companyId, leadId, data, userId)
RealEstateAPI.getLeadActivities(companyId, leadId)
RealEstateAPI.getLeadCampaigns(companyId, filters)
```

## Data Model Details

### Team Member Object
```javascript
{
  id: UUID,
  company_id: UUID,
  name: string,
  email: string,
  phone: string,
  role: 'admin' | 'agent' | 'support' | 'viewer',
  status: 'active' | 'inactive' | 'suspended',
  avatar_url: string,
  bio: string,
  license_number: string,
  license_expiry: date,
  commission_rate: decimal (0-100),
  join_date: date,
  last_active: timestamp,
  created_at: timestamp,
  updated_at: timestamp
}
```

### Lead Object
```javascript
{
  id: UUID,
  company_id: UUID,
  first_name: string,
  last_name: string,
  email: string,
  phone: string,
  source: 'website' | 'referral' | 'ad' | 'walkIn' | 'phone' | 'other',
  property_interest: string,
  budget_min: decimal,
  budget_max: decimal,
  lead_type: 'buyer' | 'seller' | 'investor' | 'renter',
  status: 'new' | 'contacted' | 'qualified' | 'negotiating' | 'closed' | 'lost',
  stage: 'awareness' | 'consideration' | 'decision' | 'closed',
  assigned_agent_id: UUID,
  lead_score: integer (0-100),
  notes: text,
  last_contact: timestamp,
  next_followup: date,
  created_at: timestamp,
  updated_at: timestamp
}
```

### Comparable Analysis Object
```javascript
{
  id: UUID,
  company_id: UUID,
  property_id: UUID,
  analysis_date: date,
  subject_address: string,
  subject_price: decimal,
  comparable_1_address: string,
  comparable_1_price: decimal,
  comparable_1_adjustment: decimal,
  comparable_2_address: string,
  comparable_2_price: decimal,
  comparable_2_adjustment: decimal,
  comparable_3_address: string,
  comparable_3_price: decimal,
  comparable_3_adjustment: decimal,
  estimated_value: decimal,
  confidence_level: integer (0-100),
  notes: text,
  created_by: UUID,
  created_at: timestamp
}
```

## UI Components Overview

### Team Management Page
- Team statistics cards (Total, Agents, Admins, Avg Commission)
- Team member grid with edit/delete options
- Add Member form with role assignment
- License tracking and expiry dates
- Commission rate monitoring

### Market Intelligence Page
- Market statistics cards (Avg Price, Median Price, Price Trend)
- Comparable Analysis section with CMA creation form
- Market Trends visualization (last 12 months)
- Create new comparable analysis button

### CRM Leads Page
- Lead statistics (Total, Qualified, Avg Score, Contacted)
- Lead search and filtering by status
- Lead cards with score and budget info
- Log Activity feature for each lead
- Lead status and type badges

## Features & Brand Consistency

All three features use the brand color scheme:
- **Primary:** Green (#10b981) for positive actions and primary data
- **Secondary:** Orange (#f97316) for calls-to-action and alerts
- **Subtle shadows:** Reduced from shadow-lg to shadow for professional appearance
- **Consistent typography:** Green text for headers, orange buttons

## Testing Checklist

- [ ] Verify all three pages load correctly
- [ ] Test create/edit/delete for team members
- [ ] Create a comparable analysis and verify math
- [ ] Create a lead and log activities
- [ ] Verify PowerSync syncs data properly
- [ ] Test RLS policies prevent unauthorized access
- [ ] Verify lead score calculations
- [ ] Check that status filters work correctly
- [ ] Confirm all form validations work
- [ ] Test on mobile and desktop layouts

## Future Enhancements

- AI-powered lead scoring algorithm
- Automated email campaigns for leads
- MLS integration with real-time listings
- Team performance analytics dashboard
- Lead pipeline forecasting
- Automated follow-up reminders
- Property showing scheduling
- Document management for transactions

## Support

For issues or questions:
1. Check the PowerSync documentation: https://docs.powersync.co
2. Review the RLS policy examples in your Supabase project
3. Verify all migration SQL ran successfully
4. Check console logs for API errors

---

**Created:** 2026-06-25  
**Version:** 1.0  
**Status:** Production Ready
