import fs from 'fs';
const url = `${process.env.VITE_SUPABASE_URL}/rest/v1/?apikey=${process.env.VITE_SUPABASE_ANON_KEY}`;
const res = await fetch(url);
const data = await res.json();
fs.writeFileSync('scratch/schema.json', JSON.stringify(data, null, 2));
