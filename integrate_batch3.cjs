const fs = require('fs');
const filePath = 'supabase/functions/integration-sync/index.ts';
let content = fs.readFileSync(filePath, 'utf8');

const imports = `
// --- Batch 3 Syncers ---
import { syncWorkday } from './syncers/workday.ts';
import { syncBambooHR } from './syncers/bamboohr.ts';
import { syncDocuSign } from './syncers/docusign.ts';
import { syncCalendly } from './syncers/calendly.ts';
`;

if (!content.includes('syncers/workday.ts')) {
  const importBlockEnd = content.indexOf('// --- Batch 2 Syncers ---');
  if (importBlockEnd !== -1) {
    content = content.slice(0, importBlockEnd) + imports + '\n' + content.slice(importBlockEnd);
  }
}

const batch3 = ['syncWorkday', 'syncBambooHR', 'syncDocuSign', 'syncCalendly'];

for (const fn of batch3) {
  const regex = new RegExp(`async function ${fn}\\(integration: any, supabase: any, lastSynced: Date \\| null\\) \\{[\\s\\S]*?return imported;\\n\\}`, 'g');
  content = content.replace(regex, `// ${fn} has been moved to ./syncers/${fn.replace('sync', '').toLowerCase()}.ts`);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Batch 3 integration successful');
