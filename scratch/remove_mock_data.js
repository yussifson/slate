import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dir = path.join(__dirname, '../src/components/universal');

const files = fs.readdirSync(dir).filter(f => f.startsWith('Univ') && f.endsWith('.jsx'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace the mock data fallback block
  const regex = /if\s*\(err\.code === '42P01'\)\s*\{\s*set[A-Z][a-zA-Z]*\(\[\s*\{[\s\S]*?\}\s*\]\);\s*\}/g;
  
  const newContent = content.replace(regex, "// Mock data removed for production empty states");
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log("Updated", file);
  }
});
