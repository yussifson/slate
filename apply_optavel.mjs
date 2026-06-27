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
    console.log("Connected to Supabase DB for Optavel Schema!");
    
    const schemaPath = path.join(process.cwd(), 'supabase', 'schema_optavel.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log("Applying Optavel schema...");
    await client.query(sql);
    console.log("Optavel schema applied successfully!");
    
  } catch (err) {
    console.error("Error applying Optavel schema:", err);
  } finally {
    await client.end();
  }
}

apply();
