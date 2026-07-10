const fs = require('fs');

let current = fs.readFileSync('src/pages/MeetLandingPage.jsx', 'utf8');

// Wrap return in fragment
current = current.replace('return (\n    <div className="min-h-screen', 'return (\n    <>\n    <div className="min-h-screen');

// We know the end of the file looks like:
//       </Dialog>
//     </div>
//   );
// }

const fileEndRegex = /<\/Dialog>\s*<\/div>\s*\);\s*\}/;
current = current.replace(fileEndRegex, '</Dialog>\n    </div>\n    </>\n  );\n}');

fs.writeFileSync('src/pages/MeetLandingPage.jsx', current);
console.log('Syntax fix applied cleanly.');
