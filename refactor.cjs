const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// Regex to find static imports for pages
content = content.replace(/^import\s+([a-zA-Z0-9_]+)\s+from\s+['"](\.?\/?pages\/[^'"]+)['"];?$/gm, "const $1 = React.lazy(() => import('$2'));");
content = content.replace(/^import\s+([a-zA-Z0-9_]+)\s+from\s+['"](\.?\/?components\/universal\/[^'"]+)['"];?$/gm, "const $1 = React.lazy(() => import('$2'));");

fs.writeFileSync('src/App.jsx', content);
console.log('Done refactoring App.jsx');
