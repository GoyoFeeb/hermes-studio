const fs = require('fs');

const file = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/myprotein-newsletter.html';
const html = fs.readFileSync(file, 'utf8');

const re = /data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/=]+)/g;
let m, i = 0, ok = 0;
while ((m = re.exec(html)) !== null) {
  i++;
  const buf = Buffer.from(m[2], 'base64');
  const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  const isJpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const status = (m[1] === 'image/png' && isPng) || (m[1] === 'image/jpeg' && isJpeg) ? 'VALID' : 'BROKEN';
  if (status === 'VALID') ok++;
  console.log(`URI ${i}: ${m[1]} ${Math.round(buf.length / 1024)}KB magic=${status}`);
}
console.log(`\n${ok}/${i} URIs válidas`);
if (ok !== i) process.exit(1);
