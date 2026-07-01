const pngToIco = require('png-to-ico');
const fs = require('fs');
pngToIco('public/slate-logo.png')
  .then(buf => {
    fs.writeFileSync('public/slate-logo.ico', buf);
    console.log('Icon converted successfully!');
  })
  .catch(console.error);
