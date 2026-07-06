import fs from 'fs';

const tables = [
  'univ_re_properties', 'univ_re_clients', 'univ_re_viewings', 'univ_re_offers', 
  'univ_re_transactions', 'univ_re_commissions', 'univ_re_documents', 'univ_re_leases', 
  'univ_re_rent_payments', 'univ_re_maintenance_requests', 'univ_re_trust_accounts', 
  'univ_re_trust_ledger', 'univ_re_escrow_accounts', 'univ_re_document_templates', 
  'univ_re_e_signatures', 'univ_re_counter_offers', 'univ_re_commission_rules', 
  'univ_re_commission_details', 'univ_re_contractors', 'univ_re_contractor_reviews', 
  'univ_re_lease_renewals', 'univ_re_rent_payment_schedules', 'univ_re_rent_payment_history', 
  'univ_re_market_data', 'univ_re_comparable_properties', 'univ_re_agent_metrics', 
  'univ_re_client_scoring', 'univ_re_agent_recommendations', 'univ_re_audit_log', 
  'univ_re_team_members', 'univ_re_mls_listings', 'univ_re_comparable_analysis', 
  'univ_re_market_trends', 'univ_re_leads', 'univ_re_lead_activities', 'univ_re_agentic_conversations'
];

let sql = `-- Fix Real Estate Schema & RLS\n\n`;
sql += `DO $$\nBEGIN\n`;

for (const t of tables) {
  sql += `
    -- ${t}
    BEGIN
        ALTER TABLE IF EXISTS ${t} ADD COLUMN IF NOT EXISTS company_id UUID;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE IF EXISTS ${t} ENABLE ROW LEVEL SECURITY;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Enable ALL for users based on company_id" ON ${t};
        CREATE POLICY "Enable ALL for users based on company_id" ON ${t} 
        AS PERMISSIVE FOR ALL 
        TO public 
        USING (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text)) 
        WITH CHECK (company_id::text = ((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text));
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        DROP POLICY IF EXISTS "Allow full access for service role" ON ${t};
        CREATE POLICY "Allow full access for service role" ON ${t} 
        AS PERMISSIVE FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
        ALTER PUBLICATION powersync ADD TABLE ${t};
    EXCEPTION WHEN OTHERS THEN NULL; END;
`;
}

sql += `END $$;\n`;

fs.writeFileSync('supabase/migrations/20260705110006_real_estate_schema_rls.sql', sql);
console.log('Created supabase/migrations/20260705110006_real_estate_schema_rls.sql');
