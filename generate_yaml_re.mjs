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

let baseYaml = '';
try {
  baseYaml = fs.readFileSync('powersync_sync_rules_updated.yaml', 'utf8');
} catch (e) {
  try {
    baseYaml = fs.readFileSync('powersync_sync_rules_aligned.yaml', 'utf8');
  } catch (e2) {
    console.log("Could not find base yaml file.");
    process.exit(1);
  }
}

// Ensure the yaml has staff_workspace data block
const parts = baseYaml.split('  staff_workspace:');
if (parts.length < 2) {
  console.log("Could not find staff_workspace in yaml!");
  process.exit(1);
}

let staffWorkspaceSection = parts[1];
const dataKeywordIndex = staffWorkspaceSection.indexOf('    data:');
if (dataKeywordIndex === -1) {
  console.log("Could not find data: under staff_workspace!");
  process.exit(1);
}

// Split around the data section to inject our queries
// Find the end of staff_workspace (which is the next top-level or end of file)
let beforeData = staffWorkspaceSection.substring(0, dataKeywordIndex + 9); // include '    data:\\n'
let afterData = staffWorkspaceSection.substring(dataKeywordIndex + 9);

let queriesToAdd = '';
for (const t of tables) {
  // If not already there
  if (!baseYaml.includes(`SELECT * FROM ${t} WHERE company_id = bucket.company_id`)) {
    queriesToAdd += `      - SELECT * FROM ${t} WHERE company_id = bucket.company_id\n`;
  }
}

let finalYaml = parts[0] + '  staff_workspace:' + beforeData + queriesToAdd + afterData;

// Clean up the invalid buckets from the previous run if they exist
let lines = finalYaml.split('\n');
let cleanLines = [];
let skip = false;
for (let i = 0; i < lines.length; i++) {
  if (tables.some(t => lines[i].startsWith(`  ${t}:`))) {
    skip = true;
    continue;
  }
  if (skip && (lines[i].includes('data:') || lines[i].includes('request.jwt()'))) {
    continue;
  }
  if (skip && lines[i].trim() === '') {
    skip = false;
    continue;
  }
  if (skip && !lines[i].startsWith('  ')) {
    skip = false; // encountered next valid bucket
  }
  if (!skip) {
    cleanLines.push(lines[i]);
  }
}

fs.writeFileSync('powersync_rules_final.yaml', cleanLines.join('\n'));
console.log('Created powersync_rules_final.yaml');
