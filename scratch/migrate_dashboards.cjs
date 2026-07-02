const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/pages/*Dashboard*.jsx');
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  
  // 1. Reduce main wrapper padding
  content = content.replace(/className=\"p-[0-9]+ sm:p-[0-9]+ lg:p-[0-9]+ max-w-screen-xl mx-auto space-y-[0-9]+\"/g, 'className="p-3 md:p-6 max-w-screen-xl mx-auto space-y-4"');
  content = content.replace(/className=\"p-[0-9]+ sm:p-[0-9]+ max-w-screen-xl mx-auto space-y-[0-9]+ min-h-screen\"/g, 'className="p-3 md:p-6 max-w-screen-xl mx-auto space-y-4 min-h-screen"');
  content = content.replace(/p-6 sm:p-10 max-w-7xl/g, 'p-3 md:p-6 max-w-7xl');

  // 2. Convert grid-cols-2 or more to grid-cols-1 on mobile
  content = content.replace(/grid-cols-2 sm:grid-cols-4/g, 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4');
  content = content.replace(/grid-cols-2 md:grid-cols-4/g, 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4');
  content = content.replace(/grid-cols-2 md:grid-cols-3/g, 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3');
  content = content.replace(/grid-cols-1 md:grid-cols-2 lg:grid-cols-4/g, 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4');
  content = content.replace(/grid grid-cols-3/g, 'grid grid-cols-1 sm:grid-cols-3');
  content = content.replace(/grid grid-cols-2/g, 'grid grid-cols-1 sm:grid-cols-2');

  // 3. Tighter gaps on mobile
  content = content.replace(/gap-8/g, 'gap-4 md:gap-8');
  content = content.replace(/gap-6/g, 'gap-3 md:gap-6');
  
  // 4. Tighter card paddings
  content = content.replace(/p-6 rounded-2xl/g, 'p-4 md:p-6 rounded-2xl');
  content = content.replace(/p-6 rounded-xl/g, 'p-4 md:p-6 rounded-xl');
  content = content.replace(/p-8/g, 'p-5 md:p-8');

  fs.writeFileSync(f, content);
  console.log('Updated ' + f);
});
