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

  // Replace blue palette hexes back to Deep Teal / Teal / Gold brand theme
  // #0b0f19 -> #006065 (Deep Teal)
  // #0066ff -> #00beac (Teal Action Button) or #006065 (if surface)
  // #0ea5e9 -> #fad503 (Gold Accent)

  // Explicit replacements for Tailwind arbitrary classes
  content = content.replace(/bg-\[\#0b0f19\]/g, 'bg-[#006065]');
  content = content.replace(/text-\[\#0b0f19\]/g, 'text-[#006065]');
  content = content.replace(/border-\[\#0b0f19\]/g, 'border-white/10');
  content = content.replace(/\#0b0f19/gi, '#006065');

  content = content.replace(/bg-\[\#0066ff\]/g, 'bg-[#00beac]');
  content = content.replace(/text-\[\#0066ff\]/g, 'text-[#00beac]');
  content = content.replace(/border-\[\#0066ff\]/g, 'border-[#00beac]');
  content = content.replace(/\#0066ff/gi, '#00beac');

  content = content.replace(/bg-\[\#0ea5e9\]/g, 'bg-[#fad503]');
  content = content.replace(/text-\[\#0ea5e9\]/g, 'text-[#fad503]');
  content = content.replace(/border-\[\#0ea5e9\]/g, 'border-[#fad503]');
  content = content.replace(/\#0ea5e9/gi, '#fad503');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    changedCount++;
    console.log(`Updated: ${path.relative(srcDir, filePath)}`);
  }
});

console.log(`\nFinished updating ${changedCount} files to Deep Teal / Teal / Gold.`);
