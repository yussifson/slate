import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

async function apply() {
  const client = new Client({
    user: 'postgres',
    password: '1948@yajkUweb3.0',
    host: 'db.wmabgiafwamxkcgxyhee.supabase.co',
    port: 5432,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to Supabase DB!");
    
    const schemaPath = path.join(process.cwd(), 'supabase', 'schema_online.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log("Applying online module schema...");
    await client.query(sql);
    console.log("Online schema applied successfully!");
    
  } catch (err) {
    console.error("Error applying schema:", err);
  } finally {
    await client.end();
  }
}

apply();
