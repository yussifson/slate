const fs = require('fs');
const filePath = 'supabase/functions/integration-sync/index.ts';
let content = fs.readFileSync(filePath, 'utf8');

const imports = `
// --- Batch 2 Syncers ---
import { syncSAP } from './syncers/sap.ts';
import { syncOracle } from './syncers/oracle.ts';
import { syncServiceNow } from './syncers/servicenow.ts';
import { syncPipedrive } from './syncers/pipedrive.ts';
`;

if (!content.includes('syncers/sap.ts')) {
  const importBlockEnd = content.indexOf('// --- Batch 1 Syncers ---');
  if (importBlockEnd !== -1) {
    content = content.slice(0, importBlockEnd) + imports + '\n' + content.slice(importBlockEnd);
  }
}

const batch2 = ['syncSAP', 'syncOracle', 'syncServiceNow', 'syncPipedrive'];

for (const fn of batch2) {
  const regex = new RegExp(`async function ${fn}\\(integration: any, supabase: any, lastSynced: Date \\| null\\) \\{[\\s\\S]*?return imported;\\n\\}`, 'g');
  content = content.replace(regex, `// ${fn} has been moved to ./syncers/${fn.replace('sync', '').toLowerCase()}.ts`);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Batch 2 integration successful');
