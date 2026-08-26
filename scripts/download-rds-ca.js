const https = require('https');
const fs = require('fs');
const path = require('path');

const url = process.env.RDS_CA_URL || 'https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem';
const out = process.env.POSTGRES_CA_PATH || path.resolve(process.cwd(), 'global-bundle.pem');

console.log(`Downloading RDS CA bundle from ${url} to ${out}`);

const file = fs.createWriteStream(out);
https.get(url, (res) => {
  if (res.statusCode !== 200) {
    console.error('Failed to download CA bundle, status:', res.statusCode);
    process.exit(1);
  }
  res.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Saved CA bundle to', out);
  });
}).on('error', (err) => {
  fs.unlinkSync(out, { force: true });
  console.error('Download error:', err.message);
  process.exit(1);
});
