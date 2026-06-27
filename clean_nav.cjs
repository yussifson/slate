const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'config', 'industries.js');
let content = fs.readFileSync(filePath, 'utf8');

// Remove AI Intelligence
content = content.replace(/.*\{\s*(?:section:\s*'[^']+',\s*)?label:\s*'AI Intelligence',\s*path:\s*'\/intelligence',\s*icon:\s*'Brain'\s*\},?\n?/g, '');

// Remove Departments
content = content.replace(/.*\{\s*(?:section:\s*'[^']+',\s*)?label:\s*'Departments',\s*path:\s*'\/departments',\s*icon:\s*'Building'\s*\},?\n?/g, '');

// Remove Roles
content = content.replace(/.*\{\s*(?:section:\s*'[^']+',\s*)?label:\s*'Roles',\s*path:\s*'\/roles',\s*icon:\s*'ShieldCheck'\s*\},?\n?/g, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully removed nav items.');
