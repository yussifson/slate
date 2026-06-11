import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const vars = {};
env.split('\n').forEach(line => {
  const [k, v] = line.split('=');
  if (k && v) vars[k.trim()] = v.trim();
});

async function getColumns() {
  const url = `${vars.VITE_SUPABASE_URL}/rest/v1/`;
  const res = await fetch(url, {
    headers: {
      'apikey': vars.VITE_SUPABASE_ANON_KEY
    }
  });
  const schema = await res.json();
  console.log("Schema keys:", Object.keys(schema));
  if (schema.definitions) {
    console.log("Definitions keys:", Object.keys(schema.definitions));
  } else {
    console.log("Full response:", schema);
  }
}

getColumns();
