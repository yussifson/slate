const fs = require('fs');
const path = require('path');

const migrationsDir = 'supabase/migrations';
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

const extraSqlFiles = ['.', 'scripts'].flatMap(dir => {
  try {
    return fs.readdirSync(dir).filter(f => f.endsWith('.sql')).map(f => path.join(dir, f));
  } catch(e) { return []; }
}).concat(files.map(f => path.join(migrationsDir, f)));

const dbTables = new Set();
// Improved regex to handle quotes like CREATE TABLE "public"."profiles"
const regex = /CREATE TABLE (?:IF NOT EXISTS )?(?:\"?public\"?\.)?\"?([a-zA-Z0-9_]+)\"?/gi;

for (const file of extraSqlFiles) {
  // skip my bad migration so it doesn't count
  if (file.includes('20260705000000_align_appschema_tables.sql')) continue;
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = regex.exec(content)) !== null) {
    dbTables.add(match[1].toLowerCase());
  }
}

const dbTablesArr = Array.from(dbTables);
console.log('Total True Database Tables:', dbTablesArr.length);
fs.writeFileSync('db_tables.txt', dbTablesArr.join('\n'));

const appTables = fs.readFileSync('appschema_tables.txt', 'utf8').split('\n').filter(Boolean);
const missingInDbFromApp = appTables.filter(t => !dbTables.has(t));
console.log('Missing True DB tables:', missingInDbFromApp.length);
fs.writeFileSync('missing_in_db.txt', missingInDbFromApp.join('\n'));
