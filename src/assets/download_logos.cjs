const fs = require('fs');
const path = require('path');
const https = require('https');

const dir = path.join(process.cwd(), 'integrations');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const logos = {
  'google.svg': 'https://raw.githubusercontent.com/devicons/devicon/master/icons/google/google-original.svg',
  'microsoft.svg': 'https://raw.githubusercontent.com/devicons/devicon/master/icons/microsoftsqlserver/microsoftsqlserver-plain.svg',
  'slack.svg': 'https://raw.githubusercontent.com/devicons/devicon/master/icons/slack/slack-original.svg',
  'stripe.svg': 'https://cdn.simpleicons.org/stripe/635BFF',
  'whatsapp.svg': 'https://cdn.simpleicons.org/whatsapp/25D366',
  'zoom.svg': 'https://cdn.simpleicons.org/zoom/0B5CFF',
  'quickbooks.svg': 'https://cdn.simpleicons.org/quickbooks/2CA01C',
  'docusign.svg': 'https://cdn.simpleicons.org/docusign/000000',
  'mailchimp.svg': 'https://cdn.simpleicons.org/mailchimp/241C15'
};

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      } else if (res.statusCode === 301 || res.statusCode === 302) {
        download(res.headers.location, dest).then(resolve).catch(reject);
      } else {
        reject(new Error(`Failed to download ${url}: ${res.statusCode}`));
      }
    }).on('error', reject);
  });
};

Promise.all(Object.entries(logos).map(([filename, url]) => {
  return download(url, path.join(dir, filename))
    .then(() => console.log(`Downloaded ${filename}`))
    .catch(e => console.error(e));
})).then(() => console.log('All downloads complete.'));
