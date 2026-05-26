import fs from 'fs';
import path from 'path';

const dirs = [
  'school',
  'hospital',
  'hotel',
  'insurance',
  'retail',
  'logistics',
  'hrm',
  'church'
];

const baseDir = 'c:\\Users\\USER\\OneDrive\\Documents\\airflake\\src\\pages';

function removeFallback(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Find the pattern: const MOCK_XXX = dbRecords.length > 0 ? dbRecords.map(...) : MOCK_XXX_RAW;
  // We want to replace it with: const MOCK_XXX = dbRecords.map(r => ({ id: r.id, status: r.status || 'Active', ...r.data }));
  const fallbackRegex = /const\s+(MOCK_[A-Z0-9_]+)\s*=\s*dbRecords\.length\s*>\s*0\s*\?\s*dbRecords\.map\([\s\S]*?\)\s*:\s*MOCK_[A-Z0-9_]+_RAW;/g;
  
  if (fallbackRegex.test(content)) {
    console.log(`[REMOVING FALLBACK] in: ${filePath}`);
    content = content.replace(fallbackRegex, (match, p1) => {
      return `const ${p1} = dbRecords.map(r => ({ id: r.id, status: r.status || 'Active', ...r.data }));`;
    });
    
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

function run() {
  dirs.forEach(dir => {
    const dirPath = path.join(baseDir, dir);
    if (!fs.existsSync(dirPath)) return;
    
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
      if (file.endsWith('.jsx')) {
        removeFallback(path.join(dirPath, file));
      }
    });
  });
  console.log("Mock fallback removal completed successfully!");
}

run();
