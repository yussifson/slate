const fs = require('fs');

const yamlPath = 'powersync_sync_rules_aligned.yaml';
let yaml = fs.readFileSync(yamlPath, 'utf8');

const tablesToQuery = [
  'optavel_deal_rooms',
  'optavel_okrs',
  'optavel_decisions',
  'optavel_commissions',
  'optavel_cap_table',
  'optavel_campaigns',
  'optavel_marketing_reports',
  'optavel_seo_tracking',
  'optavel_summit_registrations',
  'optavel_bugs',
  'optavel_sprints',
  'optavel_tasks',
  'optavel_transactions',
  'optavel_deal_activities',
  'optavel_employees',
  'optavel_leave_requests',
  'optavel_support_tickets',
  'optavel_nps_responses',
  'optavel_partners',
  'univ_erp_candidates',
  'univ_erp_interviews',
  'univ_erp_onboarding',
  'univ_erp_okrs',
  'univ_erp_reviews',
  'univ_erp_courses',
  'univ_erp_expenses',
  'univ_erp_benefits',
  'univ_erp_announcements',
  'univ_erp_surveys',
  'univ_erp_promotions'
];

let queriesToInsert = [];
for (const table of tablesToQuery) {
  const query = `      - SELECT * FROM ${table} WHERE company_id = bucket.company_id`;
  if (!yaml.includes(`FROM ${table} `) && !yaml.includes(`FROM ${table}\n`)) {
    queriesToInsert.push(query);
  }
}

const staffWorkspaceIndex = yaml.indexOf('staff_workspace:');
if (staffWorkspaceIndex !== -1) {
  const dataBlockIndex = yaml.indexOf('    data:', staffWorkspaceIndex);
  if (dataBlockIndex !== -1) {
    const endOfLine = yaml.indexOf('\n', dataBlockIndex);
    if (queriesToInsert.length > 0) {
      yaml = yaml.slice(0, endOfLine + 1) + queriesToInsert.join('\n') + '\n' + yaml.slice(endOfLine + 1);
      console.log(`Injected ${queriesToInsert.length} queries into staff_workspace`);
    } else {
      console.log('All queries already present.');
    }
  } else {
    console.log('Could not find data: block inside staff_workspace');
  }
} else {
  console.log('Could not find staff_workspace: block');
}

fs.writeFileSync(yamlPath, yaml);
console.log('Done.');
