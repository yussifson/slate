const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/pages/school');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Regex to find the inner modal div that doesn't have overflow/max-h
  // We look for: <div className="bg-card rounded-2xl shadow-2xl w-full max-w-... p-6 ... border border-border">
  const regex = /(<div className="[^"]*bg-card rounded-2xl shadow-2xl w-full max-w-[a-z]+ p-[0-9]+[^"]*?)(".*?>)/g;
  
  content = content.replace(regex, (match, p1, p2) => {
    if (match.includes('max-h-') || match.includes('overflow-y-auto')) {
      return match;
    }
    changed = true;
    return p1 + ' max-h-[90vh] overflow-y-auto custom-scrollbar' + p2;
  });

  // For Students.jsx and Parents.jsx which have different structures (flex flex-col)
  // we just make sure they have custom-scrollbar
  if (content.includes('max-h-[90vh]') && !content.includes('custom-scrollbar') && !content.includes('flex flex-col max-h-[90vh]')) {
     // handle edge cases manually below or let the regex catch most
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated modals in ${path.basename(filePath)}`);
  }
}

function walkDir(currentDir) {
  const files = fs.readdirSync(currentDir);
  for (const file of files) {
    const fullPath = path.join(currentDir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      processFile(fullPath);
    }
  }
}

walkDir(dir);
console.log('Done fixing modals');
