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
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      results.push(file);
    }
  });
  return results;
}
const files = walk('./src');
let changedCount = 0;
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  // Replace 'Active' with 'active' in status fields
  const newContent = content.replace(/status:\s*(formData\.status\s*\|\|\s*)?['"]Active['"]/g, "status: $1'active'");
  if (content !== newContent) {
    fs.writeFileSync(f, newContent);
    changedCount++;
    console.log('Fixed ' + f);
  }
});
console.log('Total files fixed:', changedCount);
