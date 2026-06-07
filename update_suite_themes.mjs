import fs from 'fs';

let content = fs.readFileSync('src/index.css', 'utf8');

// 1. Theme School replacements
content = content.replace(/rgba\(30,\s*58,\s*138/g, 'rgba(16, 185, 129'); // Deep Blue to Emerald
content = content.replace(/rgba\(59,\s*130,\s*246/g, 'rgba(16, 185, 129'); // Bright Blue to Emerald
content = content.replace(/#1E3A8A/g, '#10B981'); // Deep Blue to Emerald
content = content.replace(/#1e3070/g, '#059669'); // Deep Blue Hover to Emerald Hover
content = content.replace(/#3B82F6/g, '#10B981'); // Bright Blue to Emerald

// School gradients & backgrounds
content = content.replace(/#F0F4FF/g, '#F6FFF9'); // Light Blue to Light Emerald
content = content.replace(/#E8EEFF/g, '#E6F8F0');
content = content.replace(/rgba\(240,\s*244,\s*255,\s*0\.4\)/g, 'rgba(246, 255, 249, 0.4)');

// 2. Theme University replacements
content = content.replace(/hsl\(158\s+68%\s+38%/g, 'hsl(152 76% 41%'); // Light mode University green to Optavel Emerald
content = content.replace(/hsl\(158\s+68%\s+38%\s*\/\s*0\.(\d+)\)/g, 'hsl(152 76% 41% / 0.$1)');
content = content.replace(/--chart-1:\s*158\s+68%\s+38%/g, '--chart-1: 152 76% 41%');

content = content.replace(/\.dark\s+body\.theme-university\s*\{[\s\S]*?(?=\n\n|\n\/\*)/, (match) => {
    let newMatch = match.replace(/152 76% 41%/g, '152 76% 50%');
    newMatch = newMatch.replace(/158 68% 38%/g, '152 76% 50%');
    return newMatch;
});

// Update Accent to Orange in University
content = content.replace(/--color-accent-primary:\s*hsl\(152\s+76%\s+41%\);/g, '--color-accent-primary: hsl(25 95% 53%);');
content = content.replace(/--color-accent-primary:\s*hsl\(152\s+76%\s+50%\);/g, '--color-accent-primary: hsl(25 95% 53%);');
content = content.replace(/--color-accent-subtle:\s*hsl\(152\s+76%\s+41%\s*\/\s*([^)]+)\);/g, '--color-accent-subtle: hsl(25 95% 53% / $1);');
content = content.replace(/--color-accent-subtle:\s*hsl\(152\s+76%\s+50%\s*\/\s*([^)]+)\);/g, '--color-accent-subtle: hsl(25 95% 53% / $1);');

// 3. Theme Online replacements
content = content.replace(/hsl\(213\s+89%\s+50%/g, 'hsl(152 76% 41%'); // Light mode Online blue to Optavel Emerald
content = content.replace(/hsl\(213\s+89%\s+50%\s*\/\s*0\.(\d+)\)/g, 'hsl(152 76% 41% / 0.$1)');

content = content.replace(/\.dark\s+body\.theme-online\s*\{[\s\S]*?(?=\n\n|\n\/\*|$)/, (match) => {
    let newMatch = match.replace(/152 76% 41%/g, '152 76% 50%');
    newMatch = newMatch.replace(/213 89% 50%/g, '152 76% 50%');
    return newMatch;
});

// Update Accent to Orange in Online
// Update Surface colors in Online
content = content.replace(/\.theme-online\s*\{[\s\S]*?\}/, (match) => {
    let newMatch = match.replace(/#F0F4FF/g, '#F6FFF9');
    newMatch = newMatch.replace(/#E8EEFF/g, '#E6F8F0');
    newMatch = newMatch.replace(/#DBEAFE/g, '#D1F0E1');
    newMatch = newMatch.replace(/--color-accent-primary:\s*hsl\(152\s+76%\s+41%\);/g, '--color-accent-primary: hsl(25 95% 53%);');
    newMatch = newMatch.replace(/--color-accent-subtle:\s*hsl\(152\s+76%\s+41%\s*\/\s*([^)]+)\);/g, '--color-accent-subtle: hsl(25 95% 53% / $1);');
    return newMatch;
});

content = content.replace(/\.dark\s+body\.theme-online\s*\{[\s\S]*?\}/, (match) => {
    let newMatch = match.replace(/--color-accent-primary:\s*hsl\(152\s+76%\s+50%\);/g, '--color-accent-primary: hsl(25 95% 53%);');
    newMatch = newMatch.replace(/--color-accent-subtle:\s*hsl\(152\s+76%\s+50%\s*\/\s*([^)]+)\);/g, '--color-accent-subtle: hsl(25 95% 53% / $1);');
    return newMatch;
});

fs.writeFileSync('src/index.css', content, 'utf8');
console.log('Successfully updated index.css suite themes');
