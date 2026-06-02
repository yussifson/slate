const fs = require('fs');
const path = require('path');

const dir = 'src/components/hr';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Find components by looking for "function ComponentName("
  content = content.replace(/(function\s+[A-Z]\w*\s*\([^)]*\)\s*\{)/g, (match) => {
    return `${match}\n  const { t } = useTranslation();`;
  });

  // We might have duplicated useTranslation if it was already there. 
  // Let's clean up any double useTranslation lines.
  content = content.replace(/\s*const\s+\{\s*t\s*\}\s*=\s*useTranslation\(\);\s*const\s+\{\s*t\s*\}\s*=\s*useTranslation\(\);/g, '\n  const { t } = useTranslation();');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
}
