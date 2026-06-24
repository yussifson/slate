-- Real Estate Vertical Enhancements
-- Comprehensive schema for trust accounting, documents, contractors, intelligence, and more
-- Run this migration in your Supabase project

-- ========================================
-- 1. TRUST ACCOUNTING & ESCROW MANAGEMENT
-- ========================================

CREATE TABLE IF NOT EXISTS univ_re_trust_accounts (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  account_type VARCHAR(50) NOT NULL, -- client_trust, company_operating, earnest_money, security_deposit
  bank_name VARCHAR(255),
  account_number VARCHAR(50), -- encrypted
  routing_number VARCHAR(20), -- encrypted
  account_holder_name VARCHAR(255),
  account_holder_id TEXT, -- agent/broker id
  balance DECIMAL(15, 2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  reconciliation_status VARCHAR(50) DEFAULT 'pending', -- pending, reconciled, discrepancy
  last_reconciliation_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

CREATE INDEX idx_trust_accounts_company ON univ_re_trust_accounts(company_id);
CREATE INDEX idx_trust_accounts_holder ON univ_re_trust_accounts(account_holder_id);
CREATE INDEX idx_trust_accounts_type ON univ_re_trust_accounts(account_type);

CREATE TABLE IF NOT EXISTS univ_re_trust_ledger (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  trust_account_id TEXT NOT NULL REFERENCES univ_re_trust_accounts(id),
  transaction_type VARCHAR(50) NOT NULL, -- deposit, withdrawal, transfer, interest, fee
  amount DECIMAL(15, 2) NOT NULL,
  related_entity_type VARCHAR(50), -- transaction, offer, lease, commission, security_deposit
  related_entity_id TEXT,
  description TEXT,
  transaction_date TIMESTAMP NOT NULL,
  cleared_date TIMESTAMP,
  reference_number VARCHAR(100),
  created_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

CREATE INDEX idx_trust_ledger_account ON univ_re_trust_ledger(trust_account_id);
CREATE INDEX idx_trust_ledger_company ON univ_re_trust_ledger(company_id);
CREATE INDEX idx_trust_ledger_type ON univ_re_trust_ledger(transaction_type);
CREATE INDEX idx_trust_ledger_date ON univ_re_trust_ledger(transaction_date);

CREATE TABLE IF NOT EXISTS univ_re_escrow_accounts (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  transaction_id TEXT NOT NULL REFERENCES univ_re_transactions(id),
  buyer_id TEXT NOT NULL REFERENCES univ_re_clients(id),
  seller_id TEXT NOT NULL REFERENCES univ_re_clients(id),
  agent_id TEXT,
  property_id TEXT NOT NULL REFERENCES univ_re_properties(id),
  escrow_amount DECIMAL(15, 2) NOT NULL,
  escrow_type VARCHAR(50) NOT NULL, -- earnest_money, deposit, closing_costs, other
  escrow_agent_company VARCHAR(255),
  escrow_agent_name VARCHAR(255),
  escrow_agent_email VARCHAR(255),
  escrow_agent_phone VARCHAR(20),
  conditions_for_release JSONB, -- array of conditions to be met before release
  release_status VARCHAR(50) DEFAULT 'held', -- held, conditional_hold, released, forfeited
  release_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_escrow_transaction ON univ_re_escrow_accounts(transaction_id);
CREATE INDEX idx_escrow_company ON univ_re_escrow_accounts(company_id);
CREATE INDEX idx_escrow_property ON univ_re_escrow_accounts(property_id);

-- ========================================
-- 2. DOCUMENTS & DIGITAL TRANSACTIONS
-- ========================================

CREATE TABLE IF NOT EXISTS univ_re_document_templates (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  template_name VARCHAR(255) NOT NULL,
  document_type VARCHAR(50) NOT NULL, -- contract, offer, lease, disclosure, inspection_report, appraisal
  document_category VARCHAR(50), -- purchase, sale, rental, legal
  template_content TEXT NOT NULL, -- HTML or markdown template
  template_variables JSONB, -- array of placeholder variables
  required_signatures INTEGER DEFAULT 0,
  created_by TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_doc_templates_company ON univ_re_document_templates(company_id);
CREATE INDEX idx_doc_templates_type ON univ_re_document_templates(document_type);

CREATE TABLE IF NOT EXISTS univ_re_documents (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  property_id TEXT REFERENCES univ_re_properties(id),
  transaction_id TEXT REFERENCES univ_re_transactions(id),
  lease_id TEXT REFERENCES univ_re_leases(id),
  document_type VARCHAR(50) NOT NULL, -- contract, offer, lease, disclosure, inspection_report, appraisal
  document_title VARCHAR(255) NOT NULL,
  document_url VARCHAR(500), -- blob storage URL
  document_size_bytes INTEGER,
  mime_type VARCHAR(50),
  generated_from_template_id TEXT REFERENCES univ_re_document_templates(id),
  version INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'draft', -- draft, sent_for_signature, signed, executed, archived
  created_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_company ON univ_re_documents(company_id);
CREATE INDEX idx_documents_property ON univ_re_documents(property_id);
CREATE INDEX idx_documents_transaction ON univ_re_documents(transaction_id);
CREATE INDEX idx_documents_type ON univ_re_documents(document_type);

CREATE TABLE IF NOT EXISTS univ_re_e_signatures (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  document_id TEXT NOT NULL REFERENCES univ_re_documents(id),
  signer_id TEXT, -- user ID or client ID
  signer_name VARCHAR(255) NOT NULL,
  signer_email VARCHAR(255) NOT NULL,
  signer_phone VARCHAR(20),
  signature_date TIMESTAMP,
  signature_url VARCHAR(500), -- blob storage URL
  signature_status VARCHAR(50) DEFAULT 'pending', -- pending, signed, declined, expired
  signing_ip_address VARCHAR(45),
  signing_timestamp TIMESTAMP,
  expiration_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_e_signatures_document ON univ_re_e_signatures(document_id);
CREATE INDEX idx_e_signatures_signer ON univ_re_e_signatures(signer_id);

-- ========================================
-- 3. ENHANCED OFFERS & COMMISSION SYSTEM
-- ========================================

CREATE TABLE IF NOT EXISTS univ_re_counter_offers (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  original_offer_id TEXT NOT NULL REFERENCES univ_re_offers(id),
  counter_offer_by TEXT NOT NULL, -- buyer_id or seller_id
  counter_offer_price DECIMAL(15, 2),
  closing_date DATE,
  contingencies JSONB, -- array of contingencies
  inspection_period_days INTEGER,
  appraisal_contingency BOOLEAN,
  financing_contingency BOOLEAN,
  earnest_money_change DECIMAL(15, 2),
  additional_terms JSONB,
  counter_offer_status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, rejected, expired, withdrawn
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_counter_offers_original ON univ_re_counter_offers(original_offer_id);
CREATE INDEX idx_counter_offers_company ON univ_re_counter_offers(company_id);

CREATE TABLE IF NOT EXISTS univ_re_commission_rules (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  rule_name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(50), -- percentage_based, flat_fee, tiered, property_type_based
  property_types TEXT[], -- array of property types this rule applies to
  price_range_min DECIMAL(15, 2),
  price_range_max DECIMAL(15, 2),
  commission_percentage DECIMAL(5, 2),
  flat_fee DECIMAL(15, 2),
  tier_config JSONB, -- tiered structure if applicable
  applies_to_buyer_side BOOLEAN DEFAULT TRUE,
  applies_to_seller_side BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_commission_rules_company ON univ_re_commission_rules(company_id);

CREATE TABLE IF NOT EXISTS univ_re_commission_details (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  transaction_id TEXT NOT NULL REFERENCES univ_re_transactions(id),
  commission_rule_id TEXT REFERENCES univ_re_commission_rules(id),
  buyer_agent_id TEXT REFERENCES univ_re_clients(id),
  seller_agent_id TEXT REFERENCES univ_re_clients(id),
  sale_price DECIMAL(15, 2) NOT NULL,
  buyer_commission_percentage DECIMAL(5, 2),
  seller_commission_percentage DECIMAL(5, 2),
  buyer_commission_amount DECIMAL(15, 2),
  seller_commission_amount DECIMAL(15, 2),
  total_commission_amount DECIMAL(15, 2),
  broker_commission DECIMAL(15, 2),
  agent_commission DECIMAL(15, 2),
  adjustments JSONB, -- array of adjustment entries
  payout_status VARCHAR(50) DEFAULT 'pending', -- pending, scheduled, paid, rejected
  payout_date TIMESTAMP,
  trust_account_id TEXT REFERENCES univ_re_trust_accounts(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_commission_details_transaction ON univ_re_commission_details(transaction_id);
CREATE INDEX idx_commission_details_company ON univ_re_commission_details(company_id);
CREATE INDEX idx_commission_details_payout_status ON univ_re_commission_details(payout_status);

-- ========================================
-- 4. CONTRACTORS & VENDOR MANAGEMENT
-- ========================================

CREATE TABLE IF NOT EXISTS univ_re_contractors (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  contractor_name VARCHAR(255) NOT NULL,
  contractor_type VARCHAR(50) NOT NULL, -- inspector, appraiser, electrician, plumber, general, other
  service_categories TEXT[], -- array of service categories
  business_license_number VARCHAR(100),
  business_license_expiration DATE,
  insurance_type VARCHAR(100), -- e.g., general_liability, workers_comp
  insurance_expiration DATE,
  is_licensed BOOLEAN DEFAULT FALSE,
  is_insured BOOLEAN DEFAULT FALSE,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  website VARCHAR(500),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  average_rating DECIMAL(3, 2),
  total_reviews INTEGER DEFAULT 0,
  total_jobs_completed INTEGER DEFAULT 0,
  hourly_rate DECIMAL(10, 2),
  is_verified BOOLEAN DEFAULT FALSE,
  verification_date TIMESTAMP,
  verified_by TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contractors_company ON univ_re_contractors(company_id);
CREATE INDEX idx_contractors_type ON univ_re_contractors(contractor_type);
CREATE INDEX idx_contractors_licensed ON univ_re_contractors(is_licensed);

CREATE TABLE IF NOT EXISTS univ_re_contractor_reviews (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  contractor_id TEXT NOT NULL REFERENCES univ_re_contractors(id),
  reviewer_id TEXT, -- user/agent who hired
  maintenance_request_id TEXT REFERENCES univ_re_maintenance_requests(id),
  rating INTEGER NOT NULL, -- 1-5
  review_title VARCHAR(255),
  review_text TEXT,
  punctuality_rating INTEGER, -- 1-5
  quality_rating INTEGER, -- 1-5
  professionalism_rating INTEGER, -- 1-5
  would_rehire BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contractor_reviews_contractor ON univ_re_contractor_reviews(contractor_id);
CREATE INDEX idx_contractor_reviews_company ON univ_re_contractor_reviews(company_id);

-- ========================================
-- 5. ENHANCED LEASE MANAGEMENT
-- ========================================

CREATE TABLE IF NOT EXISTS univ_re_lease_renewals (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  lease_id TEXT NOT NULL REFERENCES univ_re_leases(id),
  renewal_status VARCHAR(50) DEFAULT 'pending', -- pending, offered, accepted, declined, expired
  renewal_offer_date TIMESTAMP,
  response_deadline TIMESTAMP,
  new_rent_amount DECIMAL(15, 2),
  rent_increase_percentage DECIMAL(5, 2),
  renewal_term_months INTEGER,
  renewal_lease_document_url VARCHAR(500),
  tenant_response_date TIMESTAMP,
  renewal_lease_id TEXT, -- new lease ID if accepted
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lease_renewals_lease ON univ_re_lease_renewals(lease_id);
CREATE INDEX idx_lease_renewals_company ON univ_re_lease_renewals(company_id);

CREATE TABLE IF NOT EXISTS univ_re_rent_payment_schedules (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  lease_id TEXT NOT NULL REFERENCES univ_re_leases(id),
  payment_due_date INTEGER DEFAULT 1, -- day of month (1-31)
  payment_amount DECIMAL(15, 2) NOT NULL,
  late_fee_amount DECIMAL(15, 2),
  late_fee_percentage DECIMAL(5, 2),
  grace_period_days INTEGER DEFAULT 5,
  is_recurring BOOLEAN DEFAULT TRUE,
  payment_method VARCHAR(50), -- bank_transfer, check, paystack, cash
  auto_debit_enabled BOOLEAN DEFAULT FALSE,
  recurring_start_date DATE,
  recurring_end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rent_schedules_lease ON univ_re_rent_payment_schedules(lease_id);
CREATE INDEX idx_rent_schedules_company ON univ_re_rent_payment_schedules(company_id);

CREATE TABLE IF NOT EXISTS univ_re_rent_payment_history (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  lease_id TEXT NOT NULL REFERENCES univ_re_leases(id),
  scheduled_payment_id TEXT REFERENCES univ_re_rent_payment_schedules(id),
  payment_date TIMESTAMP,
  payment_due_date DATE,
  amount_due DECIMAL(15, 2),
  amount_paid DECIMAL(15, 2),
  payment_method VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, overdue, partial
  transaction_reference VARCHAR(100),
  late_fee_charged DECIMAL(15, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rent_history_lease ON univ_re_rent_payment_history(lease_id);
CREATE INDEX idx_rent_history_company ON univ_re_rent_payment_history(company_id);
CREATE INDEX idx_rent_history_status ON univ_re_rent_payment_history(payment_status);
CREATE INDEX idx_rent_history_date ON univ_re_rent_payment_history(payment_due_date);

-- ========================================
-- 6. MARKET INTELLIGENCE & DATA
-- ========================================

CREATE TABLE IF NOT EXISTS univ_re_market_data (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  market_region VARCHAR(255) NOT NULL, -- city, neighborhood, zip code, etc.
  market_level VARCHAR(50) NOT NULL, -- neighborhood, city, county, state
  data_date DATE NOT NULL,
  average_price DECIMAL(15, 2),
  median_price DECIMAL(15, 2),
  price_per_sqft DECIMAL(10, 2),
  days_on_market_average INTEGER,
  sold_listings_count INTEGER,
  active_listings_count INTEGER,
  price_change_month_percentage DECIMAL(5, 2),
  price_change_year_percentage DECIMAL(5, 2),
  market_trend VARCHAR(50), -- appreciation, depreciation, stable
  market_absorption_rate DECIMAL(5, 2), -- months
  inventory_level VARCHAR(50), -- low, normal, high
  data_source VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_market_data_region ON univ_re_market_data(market_region, data_date);
CREATE INDEX idx_market_data_company ON univ_re_market_data(company_id);

CREATE TABLE IF NOT EXISTS univ_re_comparable_properties (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  subject_property_id TEXT NOT NULL REFERENCES univ_re_properties(id),
  comparable_property_id TEXT REFERENCES univ_re_properties(id),
  comparable_address VARCHAR(500), -- for external comparables
  price DECIMAL(15, 2),
  price_per_sqft DECIMAL(10, 2),
  square_footage DECIMAL(10, 2),
  bedrooms INTEGER,
  bathrooms DECIMAL(4, 1),
  lot_size DECIMAL(15, 2),
  year_built INTEGER,
  days_on_market INTEGER,
  sale_date DATE,
  similarity_score DECIMAL(3, 2), -- 0-1 rating
  price_adjustment_reason TEXT,
  adjustments JSONB, -- array of adjustments made
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comparable_subject ON univ_re_comparable_properties(subject_property_id);
CREATE INDEX idx_comparable_company ON univ_re_comparable_properties(company_id);

-- ========================================
-- 7. AGENT & CLIENT INTELLIGENCE
-- ========================================

CREATE TABLE IF NOT EXISTS univ_re_agent_metrics (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  agent_id TEXT NOT NULL REFERENCES univ_re_clients(id),
  metric_period VARCHAR(50) NOT NULL, -- month, quarter, year
  metric_date DATE NOT NULL,
  listings_taken_count INTEGER DEFAULT 0,
  listings_sold_count INTEGER DEFAULT 0,
  sales_volume DECIMAL(15, 2) DEFAULT 0,
  average_sale_price DECIMAL(15, 2),
  average_days_on_market DECIMAL(10, 2),
  commission_earned DECIMAL(15, 2) DEFAULT 0,
  client_count INTEGER DEFAULT 0,
  return_client_rate DECIMAL(5, 2), -- percentage
  average_client_rating DECIMAL(3, 2),
  response_time_hours DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_agent_metrics_agent ON univ_re_agent_metrics(agent_id);
CREATE INDEX idx_agent_metrics_company ON univ_re_agent_metrics(company_id);
CREATE INDEX idx_agent_metrics_period ON univ_re_agent_metrics(metric_date);

CREATE TABLE IF NOT EXISTS univ_re_client_scoring (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  client_id TEXT NOT NULL REFERENCES univ_re_clients(id),
  score INTEGER DEFAULT 0, -- 0-100
  score_category VARCHAR(50), -- hot, warm, cold, inactive
  score_breakdown JSONB, -- component scores
  purchase_propensity DECIMAL(3, 2), -- 0-1
  engagement_level VARCHAR(50), -- high, medium, low
  transaction_history_count INTEGER,
  last_interaction_date TIMESTAMP,
  days_since_last_contact INTEGER,
  recommended_agent_id TEXT,
  recommendation_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_client_scoring_client ON univ_re_client_scoring(client_id);
CREATE INDEX idx_client_scoring_company ON univ_re_client_scoring(company_id);
CREATE INDEX idx_client_scoring_category ON univ_re_client_scoring(score_category);

CREATE TABLE IF NOT EXISTS univ_re_agent_recommendations (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  client_id TEXT NOT NULL REFERENCES univ_re_clients(id),
  recommended_agent_id TEXT REFERENCES univ_re_clients(id),
  recommendation_type VARCHAR(50), -- new_listings, buyer_match, investment_opportunity
  recommendation_reason TEXT,
  recommendation_score DECIMAL(5, 2), -- 0-100
  property_id TEXT REFERENCES univ_re_properties(id),
  recommendation_date TIMESTAMP,
  client_action VARCHAR(50), -- viewed, contacted, interested, not_interested
  action_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recommendations_client ON univ_re_agent_recommendations(client_id);
CREATE INDEX idx_recommendations_agent ON univ_re_agent_recommendations(recommended_agent_id);
CREATE INDEX idx_recommendations_company ON univ_re_agent_recommendations(company_id);

-- ========================================
-- 8. AUDIT & COMPLIANCE LOGGING
-- ========================================

CREATE TABLE IF NOT EXISTS univ_re_audit_log (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  user_id TEXT,
  action VARCHAR(50) NOT NULL, -- create, update, delete, view, export, sign
  resource_type VARCHAR(50), -- property, transaction, document, etc.
  resource_id TEXT,
  changes JSONB, -- before/after values
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_company ON univ_re_audit_log(company_id);
CREATE INDEX idx_audit_log_user ON univ_re_audit_log(user_id);
CREATE INDEX idx_audit_log_resource ON univ_re_audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_log_date ON univ_re_audit_log(created_at);

-- ========================================
-- 9. MAINTENANCE & SERVICE TRACKING
-- ========================================

CREATE TABLE IF NOT EXISTS univ_re_maintenance_requests (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  property_id TEXT NOT NULL REFERENCES univ_re_properties(id),
  lease_id TEXT REFERENCES univ_re_leases(id),
  tenant_id TEXT REFERENCES univ_re_clients(id),
  request_type VARCHAR(50) NOT NULL, -- routine, emergency, preventive, repair
  service_category VARCHAR(50), -- plumbing, electrical, hvac, appliance, structural, other
  description TEXT NOT NULL,
  priority_level VARCHAR(20) DEFAULT 'normal', -- low, normal, high, emergency
  status VARCHAR(50) DEFAULT 'open', -- open, assigned, in_progress, completed, closed, cancelled
  contractor_id TEXT REFERENCES univ_re_contractors(id),
  contractor_quote_amount DECIMAL(15, 2),
  contractor_actual_amount DECIMAL(15, 2),
  scheduled_date TIMESTAMP,
  completion_date TIMESTAMP,
  completion_notes TEXT,
  request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_maintenance_property ON univ_re_maintenance_requests(property_id);
CREATE INDEX idx_maintenance_company ON univ_re_maintenance_requests(company_id);
CREATE INDEX idx_maintenance_status ON univ_re_maintenance_requests(status);
CREATE INDEX idx_maintenance_date ON univ_re_maintenance_requests(request_date);

-- Add foreign key constraints for real estate base tables if they don't exist
ALTER TABLE univ_re_documents
ADD CONSTRAINT fk_documents_transaction
FOREIGN KEY (transaction_id) REFERENCES univ_re_transactions(id) ON DELETE SET NULL;

ALTER TABLE univ_re_documents
ADD CONSTRAINT fk_documents_lease
FOREIGN KEY (lease_id) REFERENCES univ_re_leases(id) ON DELETE SET NULL;

-- ========================================
-- FINAL: GRANT PERMISSIONS
-- ========================================

-- Ensure RLS is enabled on all tables (if using Supabase)
-- Run these in the Supabase SQL editor to enable row level security:
-- ALTER TABLE univ_re_trust_accounts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE univ_re_trust_ledger ENABLE ROW LEVEL SECURITY;
-- ... and so on for all new tables
