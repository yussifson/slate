const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'src', 'api', 'AppSchema.js');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');
const pagesDir = path.join(__dirname, 'src', 'pages', 'optavel');

// 1. Extract schema definitions
const schemaMap = {};
const regex = /(optavel_[a-z_]+):\s*new\s*Table\(\{\s*([\s\S]*?)\}\)/g;
let match;
while ((match = regex.exec(schemaContent)) !== null) {
  const tableName = match[1];
  const columnsStr = match[2];
  const columns = columnsStr.split(',').map(line => {
    const colName = line.split(':')[0].trim();
    return colName;
  }).filter(c => c);
  schemaMap[tableName] = new Set(columns);
}

// 2. Extract INSERT statements from React components
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));
let mismatches = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(pagesDir, file), 'utf8');
  // Match INSERT INTO table_name (col1, col2)
  const insertRegex = /INSERT\s+INTO\s+(optavel_[a-z_]+)\s*\(([^)]+)\)/g;
  let insertMatch;
  while ((insertMatch = insertRegex.exec(content)) !== null) {
    const tableName = insertMatch[1];
    const insertedCols = insertMatch[2].split(',').map(c => c.trim());

    if (!schemaMap[tableName]) {
      mismatches.push(`Table ${tableName} is inserted in ${file} but missing from AppSchema.js`);
      continue;
    }

    const schemaCols = schemaMap[tableName];
    const missingInSchema = insertedCols.filter(col => !schemaCols.has(col));
    
    if (missingInSchema.length > 0) {
      mismatches.push(`Table ${tableName} in ${file} inserts missing columns: ${missingInSchema.join(', ')}`);
    }
  }
}

if (mismatches.length === 0) {
  console.log("No mismatches found!");
} else {
  console.log("Mismatches Found:\n" + mismatches.join('\n'));
}
