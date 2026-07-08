const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'pages', 'optavel');
const files = [
  'OptavelExecutive.jsx',
  'OptavelProductEng.jsx',
  'OptavelMarketing.jsx',
  'OptavelSales.jsx',
  'OptavelFinance.jsx',
  'OptavelHR.jsx',
  'OptavelSupport.jsx',
  'OptavelPartnerships.jsx',
  'OptavelCommandCenter.jsx'
];

for (const file of files) {
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Backgrounds
  content = content.replace(/style=\{\{\s*background:\s*\'radial-gradient[^\}]+\}\}/g, '');
  content = content.replace(/className="min-h-screen p-6 (md:p-[0-9]+)"/g, 'className="min-h-screen p-6 $1 bg-background text-foreground"');

  // CONSTANTS
  content = content.replace(/const CARD = 'bg-white\/5 backdrop-blur-xl border border-white\/10 rounded-2xl p-([^']+)';/g, "const CARD = 'bg-card border border-border rounded-2xl p-$1 shadow-sm';");
  content = content.replace(/const HEAD = 'text-lg font-bold text-white flex items-center gap-2 mb-5';/g, "const HEAD = 'text-lg font-bold text-foreground flex items-center gap-2 mb-5';");
  
  // Text colors
  content = content.replace(/text-white/g, 'text-foreground');
  content = content.replace(/text-slate-300/g, 'text-muted-foreground');
  content = content.replace(/text-slate-400/g, 'text-muted-foreground');
  content = content.replace(/text-slate-500/g, 'text-muted-foreground');
  
  // Background colors
  content = content.replace(/bg-white\/5/g, 'bg-muted');
  content = content.replace(/bg-white\/10/g, 'bg-muted/80');
  content = content.replace(/bg-white\/3/g, 'bg-muted/50');
  content = content.replace(/bg-\[\#0f172a\]/g, 'bg-background');
  
  // Border colors
  content = content.replace(/border-white\/10/g, 'border-border');
  content = content.replace(/border-white\/5/g, 'border-border');

  // Buttons - primary fallback
  content = content.replace(/bg-(blue|emerald|pink|amber|violet|red)-600 hover:bg-\1-700/g, 'bg-primary hover:bg-primary/90');
  
  // Specific icons / primary colors (replace header icon bg/text)
  // E.g., bg-blue-500/20 -> bg-primary/20
  content = content.replace(/bg-(blue|emerald|pink|amber|violet|red)-500\/20/g, 'bg-primary/10');
  // text-blue-400 -> text-primary
  // Be careful not to replace status colors (like done=emerald, open=red).
  // The header icons have class="w-7 h-7 text-xxx-400"
  content = content.replace(/w-7 h-7 text-(blue|emerald|pink|amber|violet|red)-400/g, 'w-7 h-7 text-primary');
  content = content.replace(/w-5 h-5 text-(blue|emerald|pink|amber|violet|red)-400/g, 'w-5 h-5 text-primary');

  // Replace text-foreground on buttons to text-primary-foreground (since we replaced text-white with text-foreground globally)
  content = content.replace(/bg-primary hover:bg-primary\/90 text-foreground/g, 'bg-primary hover:bg-primary/90 text-primary-foreground');

  // Command Center
  content = content.replace(/bg-gradient-to-r from-foreground to-muted-foreground/g, 'bg-gradient-to-r from-primary to-primary/60');
  content = content.replace(/hover:shadow-white\/5/g, 'hover:shadow-primary/5');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed', file);
}
