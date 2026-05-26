const fs = require('fs');

const schemaStr = fs.readFileSync('supabase/schema.sql', 'utf8');

const tables = {};
const tableRegex = /CREATE TABLE IF NOT EXISTS public\.(\w+)\s*\(([\s\S]*?)\);/g;

let match;
while ((match = tableRegex.exec(schemaStr)) !== null) {
  const tableName = match[1];
  const columnsBlock = match[2];
  
  // split by newlines, extract first word of each line (which is the column name)
  const columns = [];
  const lines = columnsBlock.split('\n');
  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('--') || line.startsWith('UNIQUE') || line.startsWith('PRIMARY')) continue;
    
    const words = line.split(/\s+/);
    if (words.length > 0) {
      const colName = words[0];
      // some basic filtering, just taking standard postgres columns
      if (colName && /^[a-z_]+$/.test(colName)) {
        columns.push(colName);
      }
    }
  }
  tables[tableName] = columns;
}

const jsContent = `export const SCHEMA_COLUMNS = ${JSON.stringify(tables, null, 2)};\n`;
fs.writeFileSync('src/api/schemaColumns.js', jsContent);
console.log('Schema columns extracted to src/api/schemaColumns.js');
