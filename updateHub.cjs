const fs = require('fs');

let content = fs.readFileSync('src/pages/clipad/IntegrationsHub.jsx', 'utf8');

// Replace the INTEGRATIONS and CATEGORIES declarations with an import
content = content.replace(
  /\/\/ ─── Integration Definitions ─────────────────────────────────────────────────[\s\S]*?const CATEGORIES = \[.*?\];/,
  "import { INTEGRATIONS, CATEGORIES } from '@/config/integrationsList';"
);

// Update grid to 3 columns
content = content.replace(
  'className="grid grid-cols-1 md:grid-cols-2 gap-4"',
  'className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4"'
);

fs.writeFileSync('src/pages/clipad/IntegrationsHub.jsx', content);
console.log("Successfully updated IntegrationsHub.jsx!");
