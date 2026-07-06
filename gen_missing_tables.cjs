const fs = require('fs');

const missingTables = [
  'univ_re_mls_listings',
  'univ_re_comparable_analysis',
  'univ_re_market_trends',
  'univ_re_leads',
  'univ_re_lead_activities',
  'univ_re_agentic_conversations'
];

const schemaContent = fs.readFileSync('src/api/AppSchema.js', 'utf8');

let sql = `-- Create missing real estate tables\n\n`;

for (const t of missingTables) {
  const tableRegex = new RegExp(`${t}:\\s*new\\s+Table\\(\\{([\\s\\S]*?)\\}\\)`, 'i');
  const match = schemaContent.match(tableRegex);
  
  if (match) {
    const columnsBlock = match[1];
    const columnLines = columnsBlock.split(',\\n').map(l => l.trim()).filter(l => l);
    
    let createSql = `CREATE TABLE IF NOT EXISTS ${t} (\n`;
    
    const sqlCols = [];
    for (const colLine of columnLines) {
      // e.g. "id: column.text" or "price: column.real"
      const [colNameRaw, colTypeRaw] = colLine.split(':').map(s => s.trim());
      if (!colNameRaw || !colTypeRaw) continue;
      
      let sqlType = 'TEXT';
      if (colTypeRaw.includes('column.integer')) sqlType = 'INTEGER';
      else if (colTypeRaw.includes('column.real')) sqlType = 'NUMERIC';
      else if (colTypeRaw.includes('column.boolean')) sqlType = 'BOOLEAN';
      
      if (colNameRaw === 'id') {
        sqlCols.push(`  id UUID PRIMARY KEY DEFAULT gen_random_uuid()`);
      } else if (colNameRaw === 'company_id') {
        sqlCols.push(`  company_id UUID`);
      } else if (colNameRaw === 'created_at' || colNameRaw === 'updated_at') {
        sqlCols.push(`  ${colNameRaw} TIMESTAMP WITH TIME ZONE DEFAULT NOW()`);
      } else {
        sqlCols.push(`  ${colNameRaw} ${sqlType}`);
      }
    }
    
    createSql += sqlCols.join(',\n');
    createSql += `\n);\n\n`;
    
    sql += createSql;
  }
}

fs.writeFileSync('CREATE_MISSING_TABLES.sql', sql);
console.log('Created CREATE_MISSING_TABLES.sql');
