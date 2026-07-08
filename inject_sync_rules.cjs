const fs = require('fs');

const yamlPath = 'powersync_sync_rules_aligned.yaml';
const fragmentPath = 'ultimate_sync_rules.yaml';

let yaml = fs.readFileSync(yamlPath, 'utf8');
const fragment = fs.readFileSync(fragmentPath, 'utf8');

// Insert the fragment into the schema section
if (yaml.includes('schema:')) {
  // Find where schema: ends and bucket_definitions: begins
  const bucketIndex = yaml.indexOf('bucket_definitions:');
  if (bucketIndex !== -1) {
    yaml = yaml.slice(0, bucketIndex) + fragment + '\n' + yaml.slice(bucketIndex);
  }
}

// Ensure the queries are in the staff_workspace data block
const queries = [
  '      - SELECT * FROM univ_erp_promotions WHERE company_id = bucket.company_id',
  '      - SELECT * FROM univ_task_comments WHERE company_id = bucket.company_id'
];

for(let i=0; i<8; i++) {
  // Just pushing some standard optavel tables if missing (they seem to be present)
}

const staffWorkspaceIndex = yaml.indexOf('staff_workspace:');
if (staffWorkspaceIndex !== -1) {
  const dataBlockIndex = yaml.indexOf('    data:', staffWorkspaceIndex);
  if (dataBlockIndex !== -1) {
    const endOfLine = yaml.indexOf('\n', dataBlockIndex);
    const queriesToInsert = queries.filter(q => !yaml.includes(q)).join('\n');
    if (queriesToInsert) {
      yaml = yaml.slice(0, endOfLine + 1) + queriesToInsert + '\n' + yaml.slice(endOfLine + 1);
    }
  }
}

fs.writeFileSync(yamlPath, yaml);
console.log('Injected ultimate_sync_rules.yaml into powersync_sync_rules_aligned.yaml');
