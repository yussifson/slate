const fs = require('fs');
let content = fs.readFileSync('src/pages/clipad/ClipadChat.jsx', 'utf-8');

// Fix 1: Add ArrowLeft to lucide import
if (!content.includes('ArrowLeft')) {
  content = content.replace(
    'PanelLeftClose, PanelLeftOpen, Settings} from "lucide-react";',
    'PanelLeftClose, PanelLeftOpen, Settings, ArrowLeft} from "lucide-react";'
  );
  console.log('ArrowLeft import added');
} else {
  console.log('ArrowLeft already present');
}

// Fix 2: The file ends with div balance=5, need 5 more closing divs
// Find the tail of the return and replace it
const tailPattern = '  </div>\r\n   {/* Mobile Nav */}\r\n   <ClipadMobileNav />\r\n   </div>\r\n   );\r\n}';
const tailPatternLF = '  </div>\n   {/* Mobile Nav */}\n   <ClipadMobileNav />\n   </div>\n   );\n}';

const newTail = '  </div>{/* close active/empty state */}\n  </div>{/* close main chat area */}\n  </div>{/* close main layout */}\n  </div>{/* close sidebar */}\n  {/* Mobile Nav */}\n  <ClipadMobileNav />\n  </div>{/* close root */}\n  );\n}';

if (content.includes(tailPattern)) {
  content = content.replace(tailPattern, newTail);
  console.log('Tail replaced (CRLF)');
} else if (content.includes(tailPatternLF)) {
  content = content.replace(tailPatternLF, newTail);
  console.log('Tail replaced (LF)');
} else {
  // fallback: find last </div> before ); and insert extra closes
  console.log('Pattern not found, using fallback');
  // Look for the ending pattern with regex
  content = content.replace(
    /(\s*<\/div>\r?\n\s*\{\s*\/\*\s*Mobile Nav\s*\*\/\s*\}\r?\n\s*<ClipadMobileNav\s*\/>\r?\n\s*<\/div>\r?\n\s*\);\r?\n\})/,
    '\n  </div>{/* close active/empty state */}\n  </div>{/* close main chat area */}\n  </div>{/* close main layout */}\n  </div>{/* close sidebar */}\n  {/* Mobile Nav */}\n  <ClipadMobileNav />\n  </div>{/* close root */}\n  );\n}'
  );
  console.log('Fallback applied');
}

// Verify div balance
const lines = content.split('\n');
let divCount = 0;
for (let l of lines) {
  divCount += (l.match(/<div(?=[\s>\/])/g)||[]).length - (l.match(/<\/div>/g)||[]).length;
}
const importLine = lines[3] || '';
console.log('Lines: ' + lines.length + ', div balance: ' + divCount + ' (need 0)');
console.log('ArrowLeft in import:', importLine.includes('ArrowLeft'));
console.log('Last 8 lines:');
lines.slice(-9).forEach((l, i) => console.log((lines.length - 8 + i) + ': ' + l));

fs.writeFileSync('src/pages/clipad/ClipadChat.jsx', content);
console.log('File written successfully');
