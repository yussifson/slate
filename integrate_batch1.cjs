const fs = require('fs');
const filePath = 'supabase/functions/integration-sync/index.ts';
let content = fs.readFileSync(filePath, 'utf8');

const imports = `
// --- Batch 1 Syncers ---
import { syncAWS } from './syncers/aws.ts';
import { syncAzure } from './syncers/azure.ts';
import { syncDatadog } from './syncers/datadog.ts';
import { syncSentry } from './syncers/sentry.ts';
import { syncPagerDuty } from './syncers/pagerduty.ts';
import { syncJenkins } from './syncers/jenkins.ts';
`;

if (!content.includes('syncers/aws.ts')) {
  // Insert imports at the top, after the standard library imports
  const importBlockEnd = content.indexOf('import { corsHeaders }');
  if (importBlockEnd !== -1) {
    content = content.slice(0, importBlockEnd) + imports + '\n' + content.slice(importBlockEnd);
  }
}

const batch1 = ['syncAWS', 'syncAzure', 'syncDatadog', 'syncSentry', 'syncPagerDuty', 'syncJenkins'];

for (const fn of batch1) {
  // Remove the old placeholder definition
  const regex = new RegExp(`async function ${fn}\\(integration: any, supabase: any, lastSynced: Date \\| null\\) \\{[\\s\\S]*?return imported;\\n\\}`, 'g');
  content = content.replace(regex, `// ${fn} has been moved to ./syncers/${fn.replace('sync', '').toLowerCase()}.ts`);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Batch 1 integration successful');
