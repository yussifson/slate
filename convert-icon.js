import pngToIco from 'png-to-ico';
import fs from 'fs';
pngToIco('public/slate-logo.png')
  .then(buf => {
    fs.writeFileSync('public/slate-logo.ico', buf);
    console.log('Icon converted successfully!');
  })
  .catch(console.error);
