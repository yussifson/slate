import fs from 'fs';

const content = fs.readFileSync('c:\\Users\\USER\\OneDrive\\Documents\\airflake\\supabase\\schema.sql', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('industry_records') || line.toLowerCase().includes('companies')) {
    console.log(`${idx + 1}: ${line}`);
  }
});
