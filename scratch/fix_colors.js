const fs = require('fs');

function fixFile(path) {
  let content = fs.readFileSync(path, 'utf8');

  // Fix API calls
  content = content.replace(/select\('id, name, industry, industry_type, subdomain, status, logo_url, subscription_plan'\)/g, "select('id, name, industry_type, subdomain, status, logo_url, subscription_plan')");
  content = content.replace(/industry:\s*industryKey,\s*industry_type:\s*industryKey/g, "industry_type: industryKey");
  content = content.replace(/industry_type:\s*industryKey,\s*industry:\s*industryKey/g, "industry_type: industryKey");

  // Fix background colors
  content = content.replace(/bg-\[#F4F6F8\] dark:bg-\[#0A101D\]/g, "bg-background");

  // Fix Emerald to Primary
  content = content.replace(/bg-emerald-600/g, 'bg-primary');
  content = content.replace(/hover:bg-emerald-700/g, 'hover:bg-primary/90');
  content = content.replace(/text-emerald-600/g, 'text-primary');
  content = content.replace(/text-emerald-700/g, 'text-primary');
  content = content.replace(/text-emerald-500/g, 'text-primary');
  content = content.replace(/bg-emerald-500/g, 'bg-primary');
  content = content.replace(/dark:text-emerald-400/g, 'dark:text-primary');
  content = content.replace(/dark:text-emerald-300/g, 'dark:text-primary');
  content = content.replace(/border-emerald-600/g, 'border-primary');
  content = content.replace(/border-emerald-500/g, 'border-primary');
  content = content.replace(/hover:border-emerald-500/g, 'hover:border-primary');
  content = content.replace(/hover:border-emerald-300/g, 'hover:border-primary/50');
  content = content.replace(/bg-emerald-100/g, 'bg-primary/10');
  content = content.replace(/bg-emerald-50/g, 'bg-primary/5');
  content = content.replace(/dark:bg-emerald-900\/30/g, 'dark:bg-primary/20');
  content = content.replace(/dark:bg-emerald-900\/40/g, 'dark:bg-primary/20');
  content = content.replace(/dark:bg-emerald-900\/20/g, 'dark:bg-primary/10');
  content = content.replace(/dark:bg-emerald-900\/10/g, 'dark:bg-primary/5');
  content = content.replace(/dark:bg-emerald-900\/50/g, 'dark:bg-primary/20');
  content = content.replace(/text-emerald-100/g, 'text-primary-foreground');
  content = content.replace(/text-emerald-200/g, 'text-primary-foreground/80');
  content = content.replace(/shadow-emerald-500\/20/g, 'shadow-primary/20');
  content = content.replace(/shadow-emerald-500\/10/g, 'shadow-primary/10');
  content = content.replace(/border-emerald-200/g, 'border-primary/20');
  content = content.replace(/border-emerald-400/g, 'border-primary/40');
  content = content.replace(/dark:border-emerald-800\/50/g, 'dark:border-primary/20');
  content = content.replace(/dark:border-emerald-800/g, 'dark:border-primary/20');
  content = content.replace(/bg-emerald-100\/50/g, 'bg-primary/10');
  
  fs.writeFileSync(path, content, 'utf8');
}

fixFile('src/pages/EnterpriseDashboard.jsx');
fixFile('src/pages/TowerManager.jsx');
console.log('Colors and API fixed.');
