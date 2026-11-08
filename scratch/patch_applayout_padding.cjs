const fs = require('fs');

let s = fs.readFileSync('src/components/layout/AppLayout.jsx', 'utf8');
s = s.replace(/\r\n/g, '\n');

const oldLine = `: "overflow-y-auto -webkit-overflow-scrolling-touch overscroll-y-auto px-2 sm:px-4 md:px-6 pt-2 sm:pt-4 md:pt-5 pb-[calc(60px+env(safe-area-inset-bottom))] md:pb-6"`;

const newLine = `: "overflow-y-auto -webkit-overflow-scrolling-touch overscroll-y-auto px-3 sm:px-4 md:px-6 pt-4 sm:pt-5 md:pt-6 pb-[calc(76px+env(safe-area-inset-bottom))] md:pb-8"`;

if (s.includes(oldLine)) {
  s = s.replace(oldLine, newLine);
  fs.writeFileSync('src/components/layout/AppLayout.jsx', s, 'utf8');
  console.log('AppLayout mobile padding fixed!');
} else {
  console.error('oldLine not found in AppLayout.jsx');
  process.exit(1);
}
