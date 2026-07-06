-- Create missing real estate tables

CREATE TABLE IF NOT EXISTS univ_re_mls_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE IF NOT EXISTS univ_re_comparable_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE IF NOT EXISTS univ_re_market_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE IF NOT EXISTS univ_re_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE IF NOT EXISTS univ_re_lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE IF NOT EXISTS univ_re_agentic_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

