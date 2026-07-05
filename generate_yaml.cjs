const fs = require('fs');
const missingSync = fs.readFileSync('missing_in_sync.txt', 'utf8').split('\n').filter(Boolean);
let yaml = fs.readFileSync('powersync_sync_rules_updated.yaml', 'utf8');

const insertPos = yaml.indexOf('  client_workspace:');
if (insertPos === -1) throw new Error('Could not find client_workspace');

let newLines = '';
for (const table of missingSync) {
  newLines += `      - SELECT * FROM ${table} WHERE company_id = bucket.company_id\n`;
}

yaml = yaml.substring(0, insertPos) + newLines + '\n' + yaml.substring(insertPos);
fs.writeFileSync('powersync_sync_rules_aligned.yaml', yaml);
console.log('Generated powersync_sync_rules_aligned.yaml successfully with', missingSync.length, 'new tables.');
