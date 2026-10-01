const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else if (filePath.endsWith('.js') || filePath.endsWith('.jsx') || filePath.endsWith('.css')) {
      results.push(filePath);
    }
  });
  return results;
}

const files = walk(srcDir);
let changedCount = 0;

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace green theme hexes with Coolors.co palette
  // #006065 -> #0b0f19 (for dark surfaces/backgrounds) or #0066ff
  // #00beac -> #f8fafc or #0066ff
  // #fad503 -> #0066ff or #0ea5e9

  // Let's replace #006065 with #0b0f19 where used as bg or header, or #0066ff where used as button/accent
  // Specifically:
  // bg-[#006065] -> bg-[#0b0f19]
  // text-[#006065] -> text-[#0066ff]
  // border-[#006065] -> border-slate-800
  // #006065 -> #0b0f19

  content = content.replace(/bg-\[\#006065\]/g, 'bg-[#0b0f19]');
  content = content.replace(/text-\[\#006065\]/g, 'text-[#0066ff]');
  content = content.replace(/border-\[\#006065\]/g, 'border-slate-800');
  content = content.replace(/\#006065/gi, '#0b0f19');

  content = content.replace(/bg-\[\#00beac\]/g, 'bg-[#f8fafc]');
  content = content.replace(/text-\[\#00beac\]/g, 'text-[#0066ff]');
  content = content.replace(/border-\[\#00beac\]/g, 'border-slate-200');
  content = content.replace(/\#00beac/gi, '#0066ff');

  content = content.replace(/bg-\[\#fad503\]/g, 'bg-[#0066ff]');
  content = content.replace(/text-\[\#fad503\]/g, 'text-[#0ea5e9]');
  content = content.replace(/border-\[\#fad503\]/g, 'border-[#0066ff]');
  content = content.replace(/\#fad503/gi, '#0066ff');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    changedCount++;
    console.log(`Updated: ${path.relative(srcDir, filePath)}`);
  }
});

console.log(`\nFinished updating ${changedCount} files.`);
