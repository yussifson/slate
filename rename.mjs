import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (!filePath.includes('node_modules') && !filePath.includes('.git') && !filePath.includes('dist')) {
        results = results.concat(walk(filePath));
      }
    } else {
      if (
        filePath.endsWith('.jsx') || 
        filePath.endsWith('.js') || 
        filePath.endsWith('.html') || 
        filePath.endsWith('.json') || 
        filePath.endsWith('.md')
      ) {
        results.push(filePath);
      }
    }
  }
  return results;
}

const files = walk('c:/Users/USER/OneDrive/Documents/airflake');

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  let newContent = content.replace(/Airzyle/g, 'Optalflow');
  newContent = newContent.replace(/airzyle/g, 'optalflow');
  
  if (newContent !== content) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated ${file}`);
  }
}
console.log('Done!');
