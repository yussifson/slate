const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'pages', 'hospital');

function processDir(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('return res.rows._array;')) {
        content = content.replaceAll('return res.rows._array;', 'return res.rows._array || Array.from(res.rows);');
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Fixed', file);
      }
    }
  }
}

processDir(dir);
console.log('Done');
