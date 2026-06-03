const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');
let changedCount = 0;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  
  // Replace queryClient.invalidateQueries(['key', ...]) with queryClient.invalidateQueries({ queryKey: ['key', ...] })
  let newContent = content.replace(/queryClient\.invalidateQueries\(\s*(\[[^)]+?\])\s*\)/g, 'queryClient.invalidateQueries({ queryKey: $1 })');
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    changedCount++;
    console.log(`Updated ${file}`);
  }
});

console.log(`Finished updating ${changedCount} files.`);
