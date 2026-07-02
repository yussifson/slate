const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.jsx')) results.push(file);
    }
  });
  return results;
}

let files = walk('./src');
let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace: style={{ background: "linear-gradient(...", minHeight: "100vh" }}
  // Including any preceding comma or spaces
  const regex = /,?\s*style=\{\{\s*background:\s*"linear-gradient[^}]+\}\}/g;
  let newContent = content.replace(regex, '');
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    changedCount++;
    console.log('Cleaned:', file);
  }
});

console.log('Total files cleaned:', changedCount);
