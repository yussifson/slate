# PowerSync Sync Rules for Phase 2 Features

## Team Management Tables

```sql
-- univ_re_team_members
SELECT 
  id, company_id, user_id, name, email, phone, role, status, avatar_url, bio,
  license_number, license_expiry, commission_rate, join_date, last_active, 
  created_at, updated_at
FROM univ_re_team_members
WHERE company_id = ?
  AND status != 'deleted'
  AND (role IN ('admin', 'agent', 'support') OR user_id = current_user_id)
UNION ALL
-- Sync all team members for admin viewing
SELECT 
  id, company_id, user_id, name, email, phone, role, status, avatar_url, bio,
  license_number, license_expiry, commission_rate, join_date, last_active,
  created_at, updated_at
FROM univ_re_team_members
WHERE company_id = ? AND status != 'deleted'

-- univ_re_roles
SELECT id, company_id, role_name, description, permissions, created_at
FROM univ_re_roles
WHERE company_id = ?

-- univ_re_activity_logs
SELECT id, company_id, user_id, action, entity_type, entity_id, 
       old_values, new_values, ip_address, user_agent, created_at
FROM univ_re_activity_logs
WHERE company_id = ?
  AND (user_id = current_user_id OR created_at > NOW() - INTERVAL '30 days')
ORDER BY created_at DESC
LIMIT 1000
```

## Market Intelligence Tables

```sql
-- univ_re_mls_listings
SELECT id, company_id, mls_id, property_address, city, state, zip_code,
       price, list_date, sold_date, days_on_market, bedrooms, bathrooms,
       square_feet, lot_size, property_type, status, agent_name, brokerage,
       description, images, source, last_updated, created_at
FROM univ_re_mls_listings
WHERE company_id = ?
  AND (city = ? OR state = ?)  -- Filter by agent's service area
  AND status IN ('active', 'pending', 'sold')
ORDER BY last_updated DESC

-- univ_re_comparable_analysis
SELECT id, company_id, property_id, analysis_date, subject_address,
       subject_price, comparable_1_address, comparable_1_price,
       comparable_1_adjustment, comparable_2_address, comparable_2_price,
       comparable_2_adjustment, comparable_3_address, comparable_3_price,
       comparable_3_adjustment, estimated_value, confidence_level, notes,
       created_by, created_at
FROM univ_re_comparable_analysis
WHERE company_id = ?
  AND (created_by = current_user_id OR property_id IN (
    SELECT id FROM univ_re_properties WHERE company_id = ?
  ))

-- univ_re_market_trends
SELECT id, company_id, city, state, metric_date, avg_price, median_price,
       list_count, sold_count, avg_days_on_market, price_change_percent,
       inventory_level, market_condition, created_at
FROM univ_re_market_trends
WHERE company_id = ?
  AND metric_date >= NOW()::DATE - INTERVAL '12 months'
ORDER BY metric_date DESC
```

## CRM Lead Management Tables

```sql
-- univ_re_leads
SELECT id, company_id, first_name, last_name, email, phone, source,
       property_interest, budget_min, budget_max, lead_type, status, stage,
       assigned_agent_id, lead_score, notes, last_contact, next_followup,
       created_at, updated_at
FROM univ_re_leads
WHERE company_id = ?
  AND (assigned_agent_id = current_user_id OR created_by = current_user_id)
  AND status != 'deleted'
ORDER BY lead_score DESC, next_followup ASC

-- univ_re_lead_scores
SELECT id, company_id, lead_id, engagement_score, responsiveness_score,
       budget_score, timeline_score, behavior_score, overall_score,
       calculated_at
FROM univ_re_lead_scores
WHERE company_id = ?
  AND lead_id IN (
    SELECT id FROM univ_re_leads WHERE company_id = ?
      AND (assigned_agent_id = current_user_id OR created_by = current_user_id)
  )

-- univ_re_lead_activities
SELECT id, company_id, lead_id, activity_type, subject, description,
       duration_minutes, outcome, next_action, agent_id, created_at
FROM univ_re_lead_activities
WHERE company_id = ?
  AND (agent_id = current_user_id OR lead_id IN (
    SELECT id FROM univ_re_leads WHERE company_id = ?
      AND (assigned_agent_id = current_user_id)
  ))
ORDER BY created_at DESC

-- univ_re_lead_campaigns
SELECT id, company_id, campaign_name, campaign_type, lead_source, status,
       target_audience, sent_count, open_count, click_count, conversion_count,
       roi, start_date, end_date, created_by, created_at, updated_at
FROM univ_re_lead_campaigns
WHERE company_id = ?
  AND (created_by = current_user_id OR status IN ('active', 'completed'))
ORDER BY created_at DESC
```

## Setup Instructions

1. Run the SQL migration against your Supabase database:
   ```bash
   psql -h [DB_HOST] -U postgres -f supabase/migrations/20260625000000_add_phase_2_features.sql
   ```

2. Enable Row Level Security (RLS) on all new tables:
   ```sql
   ALTER TABLE univ_re_team_members ENABLE ROW LEVEL SECURITY;
   ALTER TABLE univ_re_roles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE univ_re_activity_logs ENABLE ROW LEVEL SECURITY;
   ALTER TABLE univ_re_mls_listings ENABLE ROW LEVEL SECURITY;
   ALTER TABLE univ_re_comparable_analysis ENABLE ROW LEVEL SECURITY;
   ALTER TABLE univ_re_market_trends ENABLE ROW LEVEL SECURITY;
   ALTER TABLE univ_re_leads ENABLE ROW LEVEL SECURITY;
   ALTER TABLE univ_re_lead_scores ENABLE ROW LEVEL SECURITY;
   ALTER TABLE univ_re_lead_activities ENABLE ROW LEVEL SECURITY;
   ALTER TABLE univ_re_lead_campaigns ENABLE ROW LEVEL SECURITY;
   ```

3. Create RLS policies for each table (refer to existing policies in your database for consistency)

4. Configure PowerSync by adding the sync rules above to your `PowerSync SDK configuration` in the backend
