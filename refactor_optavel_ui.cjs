const fs = require('fs');
const path = require('path');

const dirPath = path.join(__dirname, 'src', 'pages', 'optavel');
const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.jsx'));

const replacements = [
    // Theme colors
    { regex: /bg-\[#0A0A0B\]/g, replacement: 'bg-white dark:bg-slate-950' },
    { regex: /bg-\[#111113\]/g, replacement: 'bg-slate-50 dark:bg-slate-900' },
    { regex: /bg-\[#1a111a\]/g, replacement: 'bg-slate-100 dark:bg-slate-800' },
    
    // Text colors
    { regex: /text-slate-200/g, replacement: 'text-slate-700 dark:text-slate-200' },
    { regex: /text-white/g, replacement: 'text-slate-900 dark:text-white' },
    { regex: /border-white\/5/g, replacement: 'border-slate-200 dark:border-white/5' },
    { regex: /border-white\/10/g, replacement: 'border-slate-300 dark:border-white/10' },
    { regex: /border-white\/20/g, replacement: 'border-slate-400 dark:border-white/20' },
    
    // Background overlays
    { regex: /bg-white\/5/g, replacement: 'bg-slate-100 dark:bg-white/5' },
    { regex: /bg-white\/10/g, replacement: 'bg-slate-200 dark:bg-white/10' },
    { regex: /bg-white\/15/g, replacement: 'bg-slate-300 dark:bg-white/15' },
    { regex: /bg-black\/40/g, replacement: 'bg-slate-50/80 dark:bg-black/40' },
    { regex: /bg-black\/50/g, replacement: 'bg-white dark:bg-black/50' },
    
    // Accent Colors mapping to Brand Colors (Orange & Emerald)
    { regex: /text-fuchsia-500/g, replacement: 'text-orange-500' },
    { regex: /text-fuchsia-400/g, replacement: 'text-orange-400' },
    { regex: /bg-fuchsia-500/g, replacement: 'bg-orange-500' },
    { regex: /hover:bg-fuchsia-600/g, replacement: 'hover:bg-orange-600' },
    { regex: /border-fuchsia-500\/20/g, replacement: 'border-orange-500/30' },
    { regex: /border-fuchsia-500/g, replacement: 'border-orange-500' },
    
    { regex: /text-rose-500/g, replacement: 'text-orange-500' },
    { regex: /text-rose-400/g, replacement: 'text-orange-400' },
    { regex: /bg-rose-500\/5/g, replacement: 'bg-orange-500/10' },
    { regex: /border-rose-500/g, replacement: 'border-orange-500' },
    { regex: /bg-rose-500/g, replacement: 'bg-orange-500' },
    { regex: /hover:bg-rose-600/g, replacement: 'hover:bg-orange-600' },
    { regex: /bg-rose-400\/10/g, replacement: 'bg-orange-400/10' },
    
    { regex: /text-blue-500/g, replacement: 'text-emerald-500' },
    { regex: /text-blue-400/g, replacement: 'text-emerald-400' },
    { regex: /bg-blue-500\/10/g, replacement: 'bg-emerald-500/10' },
    
    { regex: /text-indigo-500/g, replacement: 'text-emerald-500' },
    { regex: /text-indigo-400/g, replacement: 'text-emerald-400' },
    { regex: /bg-indigo-500/g, replacement: 'bg-emerald-500' },
    { regex: /bg-indigo-400\/10/g, replacement: 'bg-emerald-400/10' },
    
    // Additional generic fixes
    { regex: /bg-purple-900\/30/g, replacement: 'bg-orange-900/30' },
    { regex: /text-purple-400/g, replacement: 'text-orange-400' }
];

let totalModifications = 0;

for (const file of files) {
    const filePath = path.join(dirPath, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Apply styling replacements
    replacements.forEach(({ regex, replacement }) => {
        content = content.replace(regex, replacement);
    });

    // 1. Remove Marketing Mock Data
    if (file === 'OptavelMarketing.jsx') {
        const mockSeo = `{/* Demo Mock Data if none exists to ensure beautiful UI isn't empty */}
              {seoKeywords.length === 0 && !loadingSeo && (
                <>
                  <div className="flex justify-between items-center p-3 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/5">
                    <span className="text-sm">"SaaS OS"</span>
                    <span className="text-sm text-emerald-400 font-bold">#3</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/5">
                    <span className="text-sm">"Multi-vertical ERP"</span>
                    <span className="text-sm text-emerald-400 font-bold">#1</span>
                  </div>
                </>
              )}`;
        content = content.replace(mockSeo, '');
    }

    // 2. Remove Finance Mock Data
    if (file === 'OptavelFinance.jsx') {
        const mockFinance = `{capTable.length === 0 && (
                <>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-slate-900 dark:text-white">Founders Pool</span>
                      <span className="text-emerald-400">95%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-white/5 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                    </div>
                  </div>
                </>
              )}`;
        content = content.replace(mockFinance, '');
    }

    fs.writeFileSync(filePath, content, 'utf8');
    totalModifications++;
}

console.log(`Successfully refactored \${totalModifications} files in src/pages/optavel.`);
