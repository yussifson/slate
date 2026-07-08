const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'src', 'api', 'AppSchema.js');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

// Parse AppSchema.js
const schemaMap = {};
const regex = /([a-z_]+):\s*new\s*Table\(\{\s*([\s\S]*?)\}\)/g;
let match;
while ((match = regex.exec(schemaContent)) !== null) {
  const tableName = match[1];
  const columnsStr = match[2];
  const columns = columnsStr.split(',').map(line => {
    const parts = line.split(':');
    if(parts.length > 1) return parts[0].trim();
    return null;
  }).filter(c => c && !c.includes('//') && c !== 'id'); // id is implicit in PowerSync sync rules
  schemaMap[tableName] = columns;
}

// Generate full SQL for all optavel tables + recent univ_ tables
let sql = `-- Optavel OS and recent Univ tables Persistence Fix\n`;
const targetTables = Object.keys(schemaMap).filter(t => t.startsWith('optavel_') || t.startsWith('univ_erp_') || t === 'univ_task_comments');

for (const table of targetTables) {
  sql += `CREATE TABLE IF NOT EXISTS public.${table} (id UUID PRIMARY KEY DEFAULT uuid_generate_v4());\n`;
  for (const col of schemaMap[table]) {
    let type = 'TEXT';
    if(col.includes('price') || col.includes('amount') || col.includes('percentage') || col.includes('progress') || col.includes('salary') || col.includes('rating') || col.includes('value')) type = 'NUMERIC';
    if(col.includes('count') || col.includes('index') || col.includes('probability')) type = 'INTEGER';
    if(col.includes('date') || col.includes('_at')) type = 'TIMESTAMPTZ';
    sql += `ALTER TABLE public.${table} ADD COLUMN IF NOT EXISTS ${col} ${type};\n`;
  }
}

fs.writeFileSync('20260708_ultimate_persistence_fix.sql', sql);
console.log('Generated SQL migration: 20260708_ultimate_persistence_fix.sql');

// Generate YAML section
let yaml = ``;
for (const table of targetTables) {
  yaml += `  ${table}:\n`;
  yaml += `    view_name: ${table}\n`;
  yaml += `    columns:\n`;
  for (const col of schemaMap[table]) {
    yaml += `      - ${col}\n`;
  }
  yaml += `\n`;
}

fs.writeFileSync('ultimate_sync_rules.yaml', yaml);
console.log('Generated YAML fragment: ultimate_sync_rules.yaml');
