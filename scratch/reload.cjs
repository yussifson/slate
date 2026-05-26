const { Client } = require('pg');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [k, v] = line.split('=');
  if(k && v) acc[k.trim()] = v.trim();
  return acc;
}, {});

const connectionString = env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:54322/postgres';

async function reloadSchema() {
  const client = new Client({ connectionString });
  await client.connect();
  await client.query("NOTIFY pgrst, 'reload schema'");
  console.log("Schema reloaded!");
  await client.end();
}
reloadSchema().catch(console.error);
