const fs = require('fs');
import { SCHEMA_COLUMNS } from './src/api/schemaColumns.js';

const out = ['import { column, Schema, Table } from \'@powersync/web\';\n\nexport const AppSchema = new Schema({'];
Object.keys(SCHEMA_COLUMNS).forEach(table => {
    out.push(`    ${table}: new Table({`);
    SCHEMA_COLUMNS[table].forEach(col => out.push(`        ${col}: column.text,`));
    out.push('    }),');
});
out.push('});\n');
fs.writeFileSync('./src/api/AppSchema.js', out.join('\n'));
console.log('Done!');
