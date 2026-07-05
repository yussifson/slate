const fs = require('fs');

const missingInApp = fs.readFileSync('missing_in_app.txt', 'utf8').split('\n').filter(Boolean);
let appSchemaCode = fs.readFileSync('src/api/AppSchema.js', 'utf8');

const insertPos = appSchemaCode.lastIndexOf('});');
if (insertPos === -1) throw new Error('Could not find end of AppSchema');

let newCode = '';
for (const table of missingInApp) {
  newCode += `,\n    ${table}: new Table({\n`;
  newCode += `        id: column.text,\n`;
  newCode += `        company_id: column.text,\n`;
  newCode += `        created_at: column.text,\n`;
  newCode += `        updated_at: column.text\n`;
  newCode += `    })`;
}
newCode += '\n';

appSchemaCode = appSchemaCode.substring(0, insertPos) + newCode + appSchemaCode.substring(insertPos);

fs.writeFileSync('src/api/AppSchema.js', appSchemaCode);
console.log('AppSchema.js updated successfully with', missingInApp.length, 'new tables.');
