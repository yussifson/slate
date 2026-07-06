import fs from 'fs';

const yaml = fs.readFileSync('powersync_rules_final.yaml', 'utf8');
const appSchema = fs.readFileSync('src/api/AppSchema.js', 'utf8');

const regex = /univ_re_[a-z_]+/g;
let match;
const tables = new Set();
while ((match = regex.exec(appSchema)) !== null) {
  tables.add(match[0]);
}

let newYaml = yaml;
tables.forEach(t => {
  if (!newYaml.includes(`SELECT * FROM ${t}`)) {
    console.log(`Adding ${t}`);
    newYaml = newYaml.replace('    data:\n', `    data:\n      - SELECT * FROM ${t} WHERE company_id = bucket.company_id\n`);
  }
});

fs.writeFileSync('powersync_rules_final.yaml', newYaml);
console.log('Done');
