-- Real Estate Vertical Enhancements - FIXED VERSION
-- Comprehensive schema for trust accounting, documents, contractors, intelligence, and more

-- ========================================
-- 1. TRUST ACCOUNTING & ESCROW MANAGEMENT
-- ========================================

CREATE TABLE IF NOT EXISTS univ_re_trust_accounts (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  account_type VARCHAR(50) NOT NULL,
  bank_name VARCHAR(255),
  account_number VARCHAR(50),
  routing_number VARCHAR(20),
  account_holder_name VARCHAR(255),
  account_holder_id TEXT,
  balance DECIMAL(15, 2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  reconciliation_status VARCHAR(50) DEFAULT 'pending',
  last_reconciliation_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_trust_accounts_company ON univ_re_trust_accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_trust_accounts_holder ON univ_re_trust_accounts(account_holder_id);
CREATE INDEX IF NOT EXISTS idx_trust_accounts_type ON univ_re_trust_accounts(account_type);

CREATE TABLE IF NOT EXISTS univ_re_trust_ledger (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  trust_account_id TEXT NOT NULL,
  transaction_type VARCHAR(50) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  related_entity_type VARCHAR(50),
  related_entity_id TEXT,
  description TEXT,
  transaction_date TIMESTAMP NOT NULL,
  cleared_date TIMESTAMP,
  reference_number VARCHAR(100),
  created_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_trust_ledger_account ON univ_re_trust_ledger(trust_account_id);
CREATE INDEX IF NOT EXISTS idx_trust_ledger_company ON univ_re_trust_ledger(company_id);
CREATE INDEX IF NOT EXISTS idx_trust_ledger_type ON univ_re_trust_ledger(transaction_type);
CREATE INDEX IF NOT EXISTS idx_trust_ledger_date ON univ_re_trust_ledger(transaction_date);

CREATE TABLE IF NOT EXISTS univ_re_escrow_accounts (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  buyer_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  agent_id TEXT,
  property_id TEXT NOT NULL,
  escrow_amount DECIMAL(15, 2) NOT NULL,
  escrow_type VARCHAR(50) NOT NULL,
  escrow_agent_company VARCHAR(255),
  escrow_agent_name VARCHAR(255),
  escrow_agent_email VARCHAR(255),
  escrow_agent_phone VARCHAR(20),
  conditions_for_release JSONB,
  release_status VARCHAR(50) DEFAULT 'held',
  release_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_escrow_transaction ON univ_re_escrow_accounts(transaction_id);
CREATE INDEX IF NOT EXISTS idx_escrow_company ON univ_re_escrow_accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_escrow_property ON univ_re_escrow_accounts(property_id);

-- ========================================
-- 2. DOCUMENTS & DIGITAL TRANSACTIONS
-- ========================================

CREATE TABLE IF NOT EXISTS univ_re_document_templates (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  template_name VARCHAR(255) NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  document_category VARCHAR(50),
  template_content TEXT NOT NULL,
  template_variables JSONB,
  required_signatures INTEGER DEFAULT 0,
  created_by TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doc_templates_company ON univ_re_document_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_doc_templates_type ON univ_re_document_templates(document_type);

CREATE TABLE IF NOT EXISTS univ_re_e_signatures (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  document_id TEXT NOT NULL,
  signer_id TEXT NOT NULL,
  signer_name VARCHAR(255),
  signer_email VARCHAR(255),
  signer_phone VARCHAR(20),
  signature_date TIMESTAMP,
  signature_url TEXT,
  signature_status VARCHAR(50),
  signing_ip_address VARCHAR(45),
  signing_timestamp TIMESTAMP,
  expiration_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_e_signatures_document ON univ_re_e_signatures(document_id);
CREATE INDEX IF NOT EXISTS idx_e_signatures_signer ON univ_re_e_signatures(signer_id);

-- ========================================
-- 3. ENHANCED OFFERS & COMMISSIONS
-- ========================================

CREATE TABLE IF NOT EXISTS univ_re_counter_offers (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  original_offer_id TEXT NOT NULL,
  counter_offer_by TEXT NOT NULL,
  counter_offer_price DECIMAL(15, 2),
  closing_date TIMESTAMP,
  contingencies TEXT,
  inspection_period_days INTEGER,
  appraisal_contingency BOOLEAN,
  financing_contingency BOOLEAN,
  earnest_money_change DECIMAL(15, 2),
  additional_terms TEXT,
  counter_offer_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_counter_offers_original ON univ_re_counter_offers(original_offer_id);
CREATE INDEX IF NOT EXISTS idx_counter_offers_company ON univ_re_counter_offers(company_id);

CREATE TABLE IF NOT EXISTS univ_re_commission_rules (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  rule_name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(50),
  property_types TEXT,
  price_range_min DECIMAL(15, 2),
  price_range_max DECIMAL(15, 2),
  commission_percentage DECIMAL(5, 2),
  flat_fee DECIMAL(15, 2),
  tier_config JSONB,
  applies_to_buyer_side BOOLEAN,
  applies_to_seller_side BOOLEAN,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_commission_rules_company ON univ_re_commission_rules(company_id);

CREATE TABLE IF NOT EXISTS univ_re_commission_details (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  commission_rule_id TEXT,
  buyer_agent_id TEXT,
  seller_agent_id TEXT,
  sale_price DECIMAL(15, 2),
  buyer_commission_percentage DECIMAL(5, 2),
  seller_commission_percentage DECIMAL(5, 2),
  buyer_commission_amount DECIMAL(15, 2),
  seller_commission_amount DECIMAL(15, 2),
  total_commission_amount DECIMAL(15, 2),
  broker_commission DECIMAL(15, 2),
  agent_commission DECIMAL(15, 2),
  adjustments JSONB,
  payout_status VARCHAR(50),
  payout_date TIMESTAMP,
  trust_account_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_commission_details_transaction ON univ_re_commission_details(transaction_id);
CREATE INDEX IF NOT EXISTS idx_commission_details_company ON univ_re_commission_details(company_id);
CREATE INDEX IF NOT EXISTS idx_commission_details_payout_status ON univ_re_commission_details(payout_status);

-- ========================================
-- 4. CONTRACTORS & VENDORS
-- ========================================

CREATE TABLE IF NOT EXISTS univ_re_contractors (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  contractor_name VARCHAR(255) NOT NULL,
  contractor_type VARCHAR(50),
  service_categories TEXT,
  business_license_number VARCHAR(100),
  business_license_expiration TIMESTAMP,
  insurance_type VARCHAR(100),
  insurance_expiration TIMESTAMP,
  is_licensed BOOLEAN,
  is_insured BOOLEAN,
  email VARCHAR(255),
  phone VARCHAR(20),
  website VARCHAR(255),
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  average_rating DECIMAL(3, 2),
  total_reviews INTEGER DEFAULT 0,
  total_jobs_completed INTEGER DEFAULT 0,
  hourly_rate DECIMAL(10, 2),
  is_verified BOOLEAN,
  verification_date TIMESTAMP,
  verified_by TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contractors_company ON univ_re_contractors(company_id);
CREATE INDEX IF NOT EXISTS idx_contractors_type ON univ_re_contractors(contractor_type);
CREATE INDEX IF NOT EXISTS idx_contractors_licensed ON univ_re_contractors(is_licensed);

CREATE TABLE IF NOT EXISTS univ_re_contractor_reviews (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  contractor_id TEXT NOT NULL,
  reviewer_id TEXT NOT NULL,
  maintenance_request_id TEXT,
  rating INTEGER,
  review_title VARCHAR(255),
  review_text TEXT,
  punctuality_rating INTEGER,
  quality_rating INTEGER,
  professionalism_rating INTEGER,
  would_rehire BOOLEAN,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contractor_reviews_contractor ON univ_re_contractor_reviews(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_reviews_company ON univ_re_contractor_reviews(company_id);

-- ========================================
-- 5. LEASE MANAGEMENT
-- ========================================

CREATE TABLE IF NOT EXISTS univ_re_lease_renewals (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  lease_id TEXT NOT NULL,
  renewal_status VARCHAR(50),
  renewal_offer_date TIMESTAMP,
  response_deadline TIMESTAMP,
  new_rent_amount DECIMAL(15, 2),
  rent_increase_percentage DECIMAL(5, 2),
  renewal_term_months INTEGER,
  renewal_lease_document_url TEXT,
  tenant_response_date TIMESTAMP,
  renewal_lease_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lease_renewals_lease ON univ_re_lease_renewals(lease_id);
CREATE INDEX IF NOT EXISTS idx_lease_renewals_company ON univ_re_lease_renewals(company_id);

CREATE TABLE IF NOT EXISTS univ_re_rent_payment_schedules (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  lease_id TEXT NOT NULL,
  payment_due_date INTEGER,
  payment_amount DECIMAL(15, 2),
  late_fee_amount DECIMAL(15, 2),
  late_fee_percentage DECIMAL(5, 2),
  grace_period_days INTEGER,
  is_recurring BOOLEAN,
  payment_method VARCHAR(50),
  auto_debit_enabled BOOLEAN,
  recurring_start_date TIMESTAMP,
  recurring_end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rent_schedules_lease ON univ_re_rent_payment_schedules(lease_id);
CREATE INDEX IF NOT EXISTS idx_rent_schedules_company ON univ_re_rent_payment_schedules(company_id);

CREATE TABLE IF NOT EXISTS univ_re_rent_payment_history (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  lease_id TEXT NOT NULL,
  scheduled_payment_id TEXT,
  payment_date TIMESTAMP,
  payment_due_date TIMESTAMP,
  amount_due DECIMAL(15, 2),
  amount_paid DECIMAL(15, 2),
  payment_method VARCHAR(50),
  payment_status VARCHAR(50),
  transaction_reference VARCHAR(100),
  late_fee_charged DECIMAL(15, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rent_history_lease ON univ_re_rent_payment_history(lease_id);
CREATE INDEX IF NOT EXISTS idx_rent_history_company ON univ_re_rent_payment_history(company_id);
CREATE INDEX IF NOT EXISTS idx_rent_history_status ON univ_re_rent_payment_history(payment_status);
CREATE INDEX IF NOT EXISTS idx_rent_history_date ON univ_re_rent_payment_history(payment_due_date);

-- ========================================
-- 6. MARKET INTELLIGENCE
-- ========================================

CREATE TABLE IF NOT EXISTS univ_re_market_data (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  market_region VARCHAR(255),
  market_level VARCHAR(50),
  data_date TIMESTAMP,
  average_price DECIMAL(15, 2),
  median_price DECIMAL(15, 2),
  price_per_sqft DECIMAL(10, 2),
  days_on_market_average INTEGER,
  sold_listings_count INTEGER,
  active_listings_count INTEGER,
  price_change_month_percentage DECIMAL(5, 2),
  price_change_year_percentage DECIMAL(5, 2),
  market_trend VARCHAR(50),
  market_absorption_rate DECIMAL(5, 2),
  inventory_level VARCHAR(50),
  data_source VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_market_data_region ON univ_re_market_data(market_region, data_date);
CREATE INDEX IF NOT EXISTS idx_market_data_company ON univ_re_market_data(company_id);

CREATE TABLE IF NOT EXISTS univ_re_comparable_properties (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  subject_property_id TEXT NOT NULL,
  comparable_property_id TEXT,
  comparable_address VARCHAR(255),
  price DECIMAL(15, 2),
  price_per_sqft DECIMAL(10, 2),
  square_footage DECIMAL(10, 2),
  bedrooms INTEGER,
  bathrooms DECIMAL(3, 1),
  lot_size DECIMAL(10, 2),
  year_built INTEGER,
  days_on_market INTEGER,
  sale_date TIMESTAMP,
  similarity_score DECIMAL(5, 2),
  price_adjustment_reason TEXT,
  adjustments JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comparable_subject ON univ_re_comparable_properties(subject_property_id);
CREATE INDEX IF NOT EXISTS idx_comparable_company ON univ_re_comparable_properties(company_id);

-- ========================================
-- 7. AGENT & CLIENT INTELLIGENCE
-- ========================================

CREATE TABLE IF NOT EXISTS univ_re_agent_metrics (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  metric_period VARCHAR(50),
  metric_date TIMESTAMP,
  listings_taken_count INTEGER,
  listings_sold_count INTEGER,
  sales_volume DECIMAL(15, 2),
  average_sale_price DECIMAL(15, 2),
  average_days_on_market DECIMAL(5, 2),
  commission_earned DECIMAL(15, 2),
  client_count INTEGER,
  return_client_rate DECIMAL(5, 2),
  average_client_rating DECIMAL(3, 2),
  response_time_hours DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agent_metrics_agent ON univ_re_agent_metrics(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_company ON univ_re_agent_metrics(company_id);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_period ON univ_re_agent_metrics(metric_date);

CREATE TABLE IF NOT EXISTS univ_re_client_scoring (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  score INTEGER,
  score_category VARCHAR(50),
  score_breakdown JSONB,
  purchase_propensity DECIMAL(5, 2),
  engagement_level VARCHAR(50),
  transaction_history_count INTEGER,
  last_interaction_date TIMESTAMP,
  days_since_last_contact INTEGER,
  recommended_agent_id TEXT,
  recommendation_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_client_scoring_client ON univ_re_client_scoring(client_id);
CREATE INDEX IF NOT EXISTS idx_client_scoring_company ON univ_re_client_scoring(company_id);
CREATE INDEX IF NOT EXISTS idx_client_scoring_category ON univ_re_client_scoring(score_category);

CREATE TABLE IF NOT EXISTS univ_re_agent_recommendations (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  recommended_agent_id TEXT,
  recommendation_type VARCHAR(50),
  recommendation_reason TEXT,
  recommendation_score DECIMAL(5, 2),
  property_id TEXT,
  recommendation_date TIMESTAMP,
  client_action VARCHAR(50),
  action_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recommendations_client ON univ_re_agent_recommendations(client_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_agent ON univ_re_agent_recommendations(recommended_agent_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_company ON univ_re_agent_recommendations(company_id);

-- ========================================
-- 8. AUDIT LOGGING
-- ========================================

CREATE TABLE IF NOT EXISTS univ_re_audit_log (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  action VARCHAR(100),
  resource_type VARCHAR(100),
  resource_id TEXT,
  changes JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_log_company ON univ_re_audit_log(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON univ_re_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON univ_re_audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_date ON univ_re_audit_log(created_at);
