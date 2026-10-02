// JEN PRO LOKÁLNÍ NÁHLED. Na hosting se tenhle soubor ani složka .claude nenahrává.
// Stránku skládá lib/render.js, úplně stejně jako build.js při nasazení.

const http = require('http');
const fs = require('fs');
const path = require('path');
const { render } = require('../lib/render');

const ROOT = path.resolve(__dirname, '..');

const TYPY = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif'
};

http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);

  if (p === '/' || p === '/index.php' || p === '/index.html') {
    try {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(render(ROOT));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Chyba náhledu: ' + e.message);
    }
    return;
  }

  // Čisté adresy, stejně jako je umí Vercel
  const soubor = fs.existsSync(path.join(ROOT, p)) && fs.statSync(path.join(ROOT, p)).isFile()
    ? path.join(ROOT, p)
    : path.join(ROOT, p + '.html');

  if (!soubor.startsWith(ROOT)) { res.writeHead(403).end(); return; }

  fs.readFile(soubor, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.readFile(path.join(ROOT, '404.html'), (e, d) => res.end(e ? 'Nenalezeno' : d));
      return;
    }
    res.writeHead(200, {
      'Content-Type': TYPY[path.extname(soubor).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(data);
  });
}).listen(4321, () => console.log('Náhled běží na http://localhost:4321'));
