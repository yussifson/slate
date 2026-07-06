const fs = require('fs');
const content = fs.readFileSync('src/api/AppSchema.js', 'utf8');

let sql = '-- Augment missing columns based on AppSchema.js\n\n';

// Use a regex that captures the table name and the columns block
const tableMatches = content.matchAll(/(\w+):\s*new Table\(\{([^}]*)\}\)/g);

for (const match of tableMatches) {
    const tableName = match[1];
    const columnsText = match[2];
    
    // Process all tables
    sql += `DO $$\nBEGIN\n`;
    
    const colLines = columnsText.split(',\n');
    colLines.forEach(cLine => {
        if (!cLine.trim()) return;
        // handle things like "id: column.text,"
        const colParts = cLine.split(':');
        if (colParts.length < 2) return;
        
        const colName = colParts[0].trim();
        const colTypeStr = colParts[1].trim();
        
        if (!colName || !colTypeStr.startsWith('column.')) return;
        
        let sqlType = 'TEXT';
        if (colTypeStr.includes('integer')) sqlType = 'INTEGER';
        if (colTypeStr.includes('real')) sqlType = 'DECIMAL(15,2)';
        
        sql += `    BEGIN\n`;
        sql += `        ALTER TABLE public.${tableName} ADD COLUMN IF NOT EXISTS ${colName} ${sqlType};\n`;
        sql += `    EXCEPTION WHEN undefined_table THEN\n`;
        sql += `        -- Ignore if table does not exist\n`;
        sql += `    END;\n`;
    });
    
    // Special case for workspace_modules missing company_id in AppSchema
    if (tableName === 'workspace_modules') {
        sql += `    BEGIN\n`;
        sql += `        ALTER TABLE public.workspace_modules ADD COLUMN IF NOT EXISTS company_id TEXT;\n`;
        sql += `    EXCEPTION WHEN undefined_table THEN\n`;
        sql += `        -- Ignore\n`;
        sql += `    END;\n`;
    }
    
    sql += `END $$;\n\n`;
}

fs.writeFileSync('SYNC_SCHEMA_AUGMENT.sql', sql);
console.log('SYNC_SCHEMA_AUGMENT.sql generated successfully for ALL tables.');
