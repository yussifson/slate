import fs from 'fs';
import path from 'path';

const hotelDir = 'src/pages/hotel';
const appSchemaPath = 'src/api/AppSchema.js';
const syncRulesPath = 'supabase/functions/powersync/sync_rules.yaml';

// Regex to find table names (assuming univ_hotel_...)
const tableRegex = /univ_hotel_[a-zA-Z0-9_]+/g;

function scanDir(dir) {
  let results = new Set();
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      const subResults = scanDir(fullPath);
      for (const res of subResults) results.add(res);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const matches = content.match(tableRegex);
      if (matches) {
        matches.forEach(m => results.add(m));
      }
    }
  }
  return Array.from(results);
}

const tables = scanDir(hotelDir);
console.log('Tables found in src/pages/hotel:', tables);

// We should also check AppSchema
const appSchemaContent = fs.readFileSync(appSchemaPath, 'utf-8');
const appSchemaTables = appSchemaContent.match(tableRegex);
console.log('Tables in AppSchema.js:', Array.from(new Set(appSchemaTables)));

const syncRulesContent = fs.readFileSync(syncRulesPath, 'utf-8');
const syncRulesTables = syncRulesContent.match(tableRegex);
console.log('Tables in sync_rules.yaml:', Array.from(new Set(syncRulesTables)));
