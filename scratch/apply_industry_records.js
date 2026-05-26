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
    
    // Read the industry_records SQL script
    const schemaPath = path.join(process.cwd(), 'scratch', 'industry_records.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log("Applying industry_records schema...");
    await client.query(sql);
    console.log("Schema applied successfully!");
    
  } catch (err) {
    console.error("Error applying schema:", err);
  } finally {
    await client.end();
  }
}

apply();
