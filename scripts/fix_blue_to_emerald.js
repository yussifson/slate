const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../../src/pages/school');

function processDir(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Replace Tailwind blue colors with emerald
      // Matches things like bg-blue-100, text-blue-500, border-blue-200, from-blue-50, etc.
      // Also handles dark:bg-blue-900 etc.
      content = content.replace(/([a-z]+)-blue-(\d{2,3})/g, '$1-emerald-$2');
      
      // Replace #2247fc with #10b981 (Emerald 500) if any still exist
      content = content.replace(/#2247fc/g, '#10b981');
      
      // If there are exact 'text-emerald-700 dark:text-blue-400' -> 'text-emerald-700 dark:text-emerald-400'
      // Already caught by the regex above!

      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

processDir(dir);
console.log('Done replacing blue with emerald in school pages.');
