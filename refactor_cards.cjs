const fs = require('fs');
const path = require('path');

const dirPath = path.join(__dirname, 'src', 'pages', 'real-estate');
const files = fs.readdirSync(dirPath).filter(file => file.endsWith('.jsx'));

const standardCardClass = 'bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow transition-all duration-200 overflow-hidden flex flex-col';
const standardHeaderClass = 'relative p-5 border-b border-slate-100 dark:border-slate-800 bg-transparent overflow-hidden';
const standardContentClass = 'p-5 flex-1 flex flex-col relative z-10 bg-transparent';

let updatedCount = 0;

files.forEach(file => {
  const filePath = path.join(dirPath, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace <Card className="..."> (strict match on "Card")
  content = content.replace(/<Card\s+([^>]*)className="[^"]*"([^>]*)>/g, (match, p1, p2) => {
    return `<Card ${p1}className="${standardCardClass}"${p2}>`;
  });
  
  // Handle <Card> without className
  content = content.replace(/<Card(\s*|(\s+[^c>][^>]*))>/g, (match, p1) => {
    if (match.includes('className=')) return match;
    return `<Card className="${standardCardClass}"${p1}>`;
  });

  // Replace <CardHeader className="..."> (strict match)
  content = content.replace(/<CardHeader\s+([^>]*)className="[^"]*"([^>]*)>/g, (match, p1, p2) => {
    return `<CardHeader ${p1}className="${standardHeaderClass}"${p2}>`;
  });

  // Handle <CardHeader> without className
  content = content.replace(/<CardHeader(\s*|(\s+[^c>][^>]*))>/g, (match, p1) => {
    if (match.includes('className=')) return match;
    return `<CardHeader className="${standardHeaderClass}"${p1}>`;
  });

  // Replace <CardContent className="..."> (strict match)
  content = content.replace(/<CardContent\s+([^>]*)className="[^"]*"([^>]*)>/g, (match, p1, p2) => {
    return `<CardContent ${p1}className="${standardContentClass}"${p2}>`;
  });

  // Handle <CardContent> without className
  content = content.replace(/<CardContent(\s*|(\s+[^c>][^>]*))>/g, (match, p1) => {
    if (match.includes('className=')) return match;
    return `<CardContent className="${standardContentClass}"${p1}>`;
  });

  // Remove the decorative ugly blob: <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
  content = content.replace(/<div className="absolute[^"]*rounded-full[^"]*blur-[^"]*"><\/div>\s*/g, '');

  // Wait, I should also ensure we aren't breaking non-card classes.
  // The above strictly targets exactly `<Card `, `<CardHeader `, and `<CardContent `

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    updatedCount++;
    console.log(`Updated cards in ${file}`);
  }
});

console.log(`\nFinished refactoring cards. Updated ${updatedCount} files.`);
