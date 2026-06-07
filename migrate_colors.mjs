import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.match(/\.(jsx|js|tsx|ts)$/)) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');
let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // 1. Specific Orange Replacements for badges
  // bg-blue-100 text-blue-700 -> bg-orange-100 text-orange-700
  // text-blue-700 bg-blue-100 -> text-orange-700 bg-orange-100
  content = content.replace(/bg-blue-100\s+text-blue-700/g, 'bg-orange-100 text-orange-700');
  content = content.replace(/text-blue-700\s+bg-blue-100/g, 'text-orange-700 bg-orange-100');
  
  content = content.replace(/bg-blue-50\s+text-blue-700/g, 'bg-orange-50 text-orange-700');
  content = content.replace(/text-blue-700\s+bg-blue-50/g, 'text-orange-700 bg-orange-50');

  content = content.replace(/bg-blue-100\s+text-blue-800/g, 'bg-orange-100 text-orange-800');
  content = content.replace(/text-blue-800\s+bg-blue-100/g, 'text-orange-800 bg-orange-100');

  // 2. Global Emerald Replacements for all other blue Tailwind utility classes
  // e.g. text-blue-600 -> text-emerald-600
  content = content.replace(/\b(bg|text|border|ring|from|to|via|shadow|fill|stroke|decoration)-blue-(\d{2,3}(?:\/\d+)?)\b/g, '$1-emerald-$2');

  // Also catch 'blue' named colors in hover:bg-blue- etc. The \b boundary is safe.

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
    changedFiles++;
  }
});

console.log(`Done. Updated ${changedFiles} files.`);
