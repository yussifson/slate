const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

for (const file of files) {
  const filePath = path.join(migrationsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find all CREATE POLICY statements
  const policyRegex = /CREATE POLICY\s+"([^"]+)"\s+ON\s+public\.([a-zA-Z0-9_]+)/g;
  
  let match;
  let modifications = [];
  while ((match = policyRegex.exec(content)) !== null) {
    const policyName = match[1];
    const tableName = match[2];
    const dropStmt = `DROP POLICY IF EXISTS "${policyName}" ON public.${tableName};\n`;
    
    const index = match.index;
    const before = content.substring(Math.max(0, index - 100), index);
    if (!before.includes(dropStmt.trim())) {
      modifications.push({ index: index, stmt: dropStmt });
    }
  }

  // Find all CREATE TRIGGER statements
  const triggerRegex = /CREATE TRIGGER\s+([a-zA-Z0-9_]+)\s+BEFORE\s+UPDATE\s+ON\s+public\.([a-zA-Z0-9_]+)/g;
  while ((match = triggerRegex.exec(content)) !== null) {
    const triggerName = match[1];
    const tableName = match[2];
    const dropStmt = `DROP TRIGGER IF EXISTS ${triggerName} ON public.${tableName};\n`;
    
    const index = match.index;
    const before = content.substring(Math.max(0, index - 100), index);
    if (!before.includes(dropStmt.trim())) {
      modifications.push({ index: index, stmt: dropStmt });
    }
  }
  
  modifications.sort((a,b) => a.index - b.index);
  
  // Apply from back to front to preserve indices
  modifications.reverse().forEach(mod => {
    content = content.substring(0, mod.index) + mod.stmt + content.substring(mod.index);
  });
  
  if (modifications.length > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file} with ${modifications.length} DROP statements.`);
  }
}
