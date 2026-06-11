const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

let totalReplacements = 0;

for (const file of files) {
  const filePath = path.join(migrationsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('uuid_generate_v4()')) {
    content = content.split('uuid_generate_v4()').join('gen_random_uuid()');
    fs.writeFileSync(filePath, content, 'utf8');
    totalReplacements++;
    console.log(`Replaced uuid_generate_v4 in ${file}`);
  }
}

console.log(`Finished fixing UUID generation in ${totalReplacements} files.`);
