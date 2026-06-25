-- ============================================================
-- PHASE 2: POWERSYNC PUBLICATION FIXES
-- ============================================================
-- Register all new/missing tables with PowerSync for syncing

-- Add entity_behaviour_profiles to PowerSync
ALTER PUBLICATION powersync ADD TABLE "public"."entity_behaviour_profiles";

-- Add univ_re_team_members to PowerSync
ALTER PUBLICATION powersync ADD TABLE "public"."univ_re_team_members";

-- Add audit_logs to PowerSync (if not already there)
ALTER PUBLICATION powersync ADD TABLE "public"."audit_logs";

-- Force refresh of all Real Estate tables in PowerSync
-- These should already be there, but this ensures schema cache is fresh
-- Note: If these fail with "already member", that means they're already syncing - which is good!
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS "public"."univ_re_properties";
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS "public"."univ_re_clients";
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS "public"."univ_re_viewings";
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS "public"."univ_re_offers";
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS "public"."univ_re_transactions";
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS "public"."univ_re_commissions";
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS "public"."univ_re_documents";
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS "public"."univ_re_leases";
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS "public"."univ_re_rent_payments";
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS "public"."univ_re_maintenance_requests";
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS "public"."univ_re_commission_rules";
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS "public"."univ_re_trust_accounts";
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS "public"."univ_re_trust_ledger";
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS "public"."univ_re_document_templates";
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS "public"."univ_re_counter_offers";
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS "public"."univ_re_rent_payment_schedules";
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS "public"."univ_re_escrow_accounts";
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS "public"."univ_re_market_data";
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS "public"."univ_re_comparable_properties";
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS "public"."univ_re_contractors";
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS "public"."univ_re_contractor_reviews";
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS "public"."univ_re_lease_renewals";
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS "public"."univ_re_client_scoring";
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS "public"."univ_re_agent_recommendations";
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS "public"."univ_re_e_signatures";
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS "public"."univ_re_commission_details";
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS "public"."univ_re_rent_payment_history";
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS "public"."univ_re_agent_metrics";
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS "public"."univ_re_audit_log";
