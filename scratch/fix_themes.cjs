const fs = require('fs');
const path = require('path');

const targetDirs = [
  'school', 'hospital', 'hotel', 'church', 
  'insurance', 'retail', 'logistics', 'hr'
];

const basePath = path.join(__dirname, '../src/pages');

const replacements = [
  { regex: /\bbg-white\b/g, replacement: 'bg-card' },
  { regex: /\btext-slate-900\b/g, replacement: 'text-card-foreground' },
  { regex: /\btext-slate-800\b/g, replacement: 'text-card-foreground' },
  { regex: /\btext-slate-700\b/g, replacement: 'text-foreground' },
  { regex: /\btext-slate-600\b/g, replacement: 'text-muted-foreground' },
  { regex: /\btext-slate-500\b/g, replacement: 'text-muted-foreground' },
  { regex: /\btext-slate-400\b/g, replacement: 'text-muted-foreground' },
  { regex: /\bbg-slate-50\/50\b/g, replacement: 'bg-muted/50' },
  { regex: /\bbg-slate-50\b/g, replacement: 'bg-muted' },
  { regex: /\bbg-slate-100\b/g, replacement: 'bg-muted' },
  { regex: /\bborder-slate-100\b/g, replacement: 'border-border' },
  { regex: /\bborder-slate-200\b/g, replacement: 'border-border' },
  { regex: /\bdivide-slate-50\b/g, replacement: 'divide-border' },
  { regex: /\bdivide-slate-100\b/g, replacement: 'divide-border' },
  { regex: /\bhover:bg-slate-50\/50\b/g, replacement: 'hover:bg-muted/50' },
  { regex: /\bhover:bg-slate-50\b/g, replacement: 'hover:bg-muted' },
  { regex: /\bhover:bg-slate-100\b/g, replacement: 'hover:bg-muted' },
];

targetDirs.forEach(dir => {
  const fullDir = path.join(basePath, dir);
  if (!fs.existsSync(fullDir)) return;
  
  const files = fs.readdirSync(fullDir);
  files.forEach(file => {
    if (file.endsWith('.jsx')) {
      const filePath = path.join(fullDir, file);
      let content = fs.readFileSync(filePath, 'utf8');
      
      replacements.forEach(({ regex, replacement }) => {
        content = content.replace(regex, replacement);
      });
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${dir}/${file}`);
    }
  });
});

console.log('Theme updates complete!');
