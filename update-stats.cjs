const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src', 'pages');

function traverseAndReplace(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverseAndReplace(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;

      // Pattern for template literal stats cards
      // e.g. className={`bg-card rounded-xl border ${s.border} p-4 flex items-center gap-3`}
      content = content.replace(/className=\{`bg-card rounded-xl border([^`]+)p-4/g, "className={`stat-card-premium bg-card rounded-xl border$1p-4");

      // Pattern for string literal stats cards
      // e.g. className="bg-card rounded-xl border border-border p-4 shadow-sm flex items-center
      content = content.replace(/className="bg-card rounded-xl border border-border([^"]+)p-4 shadow-sm flex items-center/g, 'className="stat-card-premium bg-card rounded-xl border border-border$1p-4 shadow-sm flex items-center');

      // Another common pattern: border-l-4
      content = content.replace(/className="bg-card rounded-xl border border-border border-l-4([^"]+)p-4 shadow-sm flex items-center/g, 'className="stat-card-premium bg-card rounded-xl border border-border border-l-4$1p-4 shadow-sm flex items-center');

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated:', fullPath);
      }
    }
  });
}

traverseAndReplace(directoryPath);
console.log('Finished updating stats cards.');
