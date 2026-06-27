const fs = require('fs');
const path = require('path');

const reDir = path.join(__dirname, 'src', 'pages', 'real-estate');
const files = fs.readdirSync(reDir).filter(f => f.endsWith('.jsx'));

let totalModified = 0;

files.forEach(file => {
  const filePath = path.join(reDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Refactor Card container class
  // Match any <Card ... className="something"> and replace className
  content = content.replace(
    /(<Card\b[^>]*className=["'])([^"']*)(["'])/g,
    (match, p1, p2, p3) => {
      // If it already looks like the new one, skip, but we want to standardize everything
      return p1 + "bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col" + p3;
    }
  );

  // 2. Refactor CardHeader
  content = content.replace(
    /(<CardHeader\b[^>]*className=["'])([^"']*)(["'])/g,
    (match, p1, p2, p3) => {
      return p1 + "relative p-6 border-b border-slate-100 dark:border-slate-800/50 bg-transparent overflow-hidden" + p3;
    }
  );

  // 3. Refactor CardContent
  content = content.replace(
    /(<CardContent\b[^>]*className=["'])([^"']*)(["'])/g,
    (match, p1, p2, p3) => {
      return p1 + "p-6 flex-1 flex flex-col relative z-10 bg-transparent" + p3;
    }
  );

  // 4. Strip the ugly inner grid boxes (bg-slate-50, border-slate-100, shadows, rounded corners)
  // We look for divs inside CardContent that have these bulky classes.
  content = content.replace(
    /className=["'][^"']*(?:bg-slate-50|bg-slate-100|bg-gray-50|bg-gradient-to-br)[^"']*border-slate-100[^"']*["']/g,
    'className="flex flex-col mb-4"'
  );

  // Strip gradient blobs specifically (from my last bad script)
  content = content.replace(
    /className=["']p-4 bg-gradient-to-br from-emerald-50 to-teal-50\/50 dark:from-emerald-950\/30 dark:to-teal-900\/10 rounded-xl border border-emerald-100\/50 dark:border-emerald-800\/30["']/g,
    'className="flex flex-col mb-5 pb-5 border-b border-slate-100 dark:border-slate-800/50"'
  );
  
  // Clean up any remaining text-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:border-primary/30 transition-colors shadow-sm
  content = content.replace(
    /className=["']text-center p-2\.5 rounded-xl bg-slate-50 dark:bg-slate-800\/50 border border-slate-100 dark:border-slate-700\/50 hover:border-primary\/30 transition-colors shadow-sm["']/g,
    'className="flex flex-col"'
  );

  // Also clean up any generalized thick blocks
  content = content.replace(
    /className=["'][^"']*bg-slate-50 dark:bg-slate-800\/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700\/50[^"']*["']/g,
    'className="flex flex-col"'
  );

  // Ensure labels look extremely crisp (replace messy uppercase classes with standardized ones)
  content = content.replace(
    /className=["']text-\[10px\] text-muted-foreground uppercase tracking-widest font-bold mb-1["']/g,
    'className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-semibold mb-1"'
  );
  
  content = content.replace(
    /className=["']text-xs text-emerald-600\/70 dark:text-emerald-400\/70 font-semibold uppercase tracking-wider mb-1["']/g,
    'className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-semibold mb-1"'
  );

  // Ensure values look crisp
  content = content.replace(
    /className=["']font-extrabold text-foreground text-lg["']/g,
    'className="text-lg font-bold text-slate-900 dark:text-white"'
  );
  
  content = content.replace(
    /className=["']text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 tracking-tight["']/g,
    'className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight"'
  );

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    totalModified++;
    console.log(`Updated ${file}`);
  }
});

console.log(`\nSuccessfully refactored ${totalModified} files to premium enterprise standard.`);
