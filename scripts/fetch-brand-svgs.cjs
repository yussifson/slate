const https = require('https');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'src', 'assets', 'integrations');

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        if ([301, 302, 307, 308].includes(res.statusCode)) {
          return get(res.headers.location).then(resolve).catch(reject);
        }
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () =>
          res.statusCode === 200
            ? resolve(data)
            : reject(new Error(`${url} -> ${res.statusCode}`))
        );
      })
      .on('error', reject);
  });
}

const sources = [
  {
    file: 'mailchimp.svg',
    url: 'https://raw.githubusercontent.com/simple-icons/simple-icons/11.14.0/icons/mailchimp.svg',
    normalize: (svg) =>
      svg.replace(/<svg /, '<svg fill="#FFE01B" ').replace(/fill="[^"]*"/, 'fill="#FFE01B"'),
  },
  {
    file: 'shipstation.svg',
    url: 'https://cdn.worldvectorlogo.com/logos/shipstation.svg',
  },
  {
    file: 'shipstation-alt.svg',
    url: 'https://www.vectorlogo.zone/logos/shipstation/shipstation-icon.svg',
  },
];

(async () => {
  for (const { file, url, normalize } of sources) {
    try {
      let body = await get(url);
      if (normalize) body = normalize(body);
      const out = path.join(dir, file);
      fs.writeFileSync(out, body);
      console.log('saved', file, body.length);
    } catch (e) {
      console.error('failed', file, e.message);
    }
  }
})();
