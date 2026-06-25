-- ============================================================
-- POWERSYNC MIGRATION - ADD ALL MISSING TABLES TO PUBLICATION
-- ============================================================
-- Run this to ensure all tables are synced with PowerSync

-- Add entity_behaviour_profiles to PowerSync
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS entity_behaviour_profiles;

-- Add all other missing tables
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS audit_logs;

-- Real Estate - All tables (ensure they're all added)
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS univ_re_properties;
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS univ_re_clients;
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS univ_re_viewings;
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS univ_re_offers;
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS univ_re_transactions;
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS univ_re_commissions;
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS univ_re_documents;
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS univ_re_leases;
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS univ_re_rent_payments;
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS univ_re_maintenance_requests;
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS univ_re_trust_accounts;
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS univ_re_trust_ledger;
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS univ_re_escrow_accounts;
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS univ_re_counter_offers;
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS univ_re_commission_rules;
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS univ_re_commission_details;
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS univ_re_document_templates;
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS univ_re_e_signatures;
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS univ_re_contractors;
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS univ_re_contractor_reviews;
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS univ_re_lease_renewals;
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS univ_re_rent_payment_schedules;
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS univ_re_rent_payment_history;
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS univ_re_market_data;
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS univ_re_comparable_properties;
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS univ_re_agent_metrics;
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS univ_re_client_scoring;
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS univ_re_agent_recommendations;
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS univ_re_audit_log;
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS univ_re_team_members;

-- Verify all tables are in publication (useful for debugging)
-- SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'univ_re_%';
-- SELECT * FROM pg_publication_tables WHERE pubname = 'powersync';
