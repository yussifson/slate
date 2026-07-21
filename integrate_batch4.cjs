const fs = require('fs');
const filePath = 'supabase/functions/integration-sync/index.ts';
let content = fs.readFileSync(filePath, 'utf8');

const imports = `
// --- Batch 4 Syncers ---
import { syncMailchimp } from './syncers/mailchimp.ts';
import { syncStripe } from './syncers/stripe.ts';
import { syncQuickbooks } from './syncers/quickbooks.ts';
import { syncCanva } from './syncers/canva.ts';
import { syncWhatsApp } from './syncers/whatsapp.ts';
import { syncTelegram } from './syncers/telegram.ts';
import { syncAirtable } from './syncers/airtable.ts';
`;

if (!content.includes('syncers/mailchimp.ts')) {
  const importBlockEnd = content.indexOf('// --- Batch 3 Syncers ---');
  if (importBlockEnd !== -1) {
    content = content.slice(0, importBlockEnd) + imports + '\n' + content.slice(importBlockEnd);
  }
}

const batch4 = ['syncMailchimp', 'syncStripe', 'syncQuickbooks', 'syncCanva', 'syncWhatsApp', 'syncTelegram', 'syncAirtable'];

for (const fn of batch4) {
  const regex = new RegExp(`async function ${fn}\\(integration: any, supabase: any, lastSynced: Date \\| null\\) \\{[\\s\\S]*?return imported;\\n\\}`, 'g');
  content = content.replace(regex, `// ${fn} has been moved to ./syncers/${fn.replace('sync', '').toLowerCase()}.ts`);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Batch 4 integration successful');
