// Build pro Vercel.
// Vyrenderuje stránku do statického HTML a vedle ní zkopíruje všechno,
// co se má nasadit. Vercel to spustí sám po každém pushi na GitHub.

const fs = require('fs');
const path = require('path');
const { render } = require('./lib/render');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

// Co se kopíruje beze změny. Co tu není, se na web nedostane.
const KOPIROVAT = [
  'assets',
  '404.html',
  'cookies.html',
  'ochrana-udaju.html',
  'robots.txt',
  'sitemap.xml'
];

function smaz(cesta) {
  if (fs.existsSync(cesta)) fs.rmSync(cesta, { recursive: true, force: true });
}

function kopiruj(odkud, kam) {
  if (!fs.existsSync(odkud)) return false;
  fs.cpSync(odkud, kam, { recursive: true });
  return true;
}

function velikost(cesta) {
  if (!fs.existsSync(cesta)) return 0;
  const s = fs.statSync(cesta);
  if (s.isFile()) return s.size;
  return fs.readdirSync(cesta).reduce((n, f) => n + velikost(path.join(cesta, f)), 0);
}

console.log('Skládám stránku...');

smaz(DIST);
fs.mkdirSync(DIST, { recursive: true });

// 1. Hlavní stránka
const html = render(ROOT);

const zbyleTokeny = html.match(/\{\{[A-Z_]+\}\}/g);
if (zbyleTokeny) {
  console.error('Chyba: v šabloně zůstaly nenahrazené značky: ' + zbyleTokeny.join(', '));
  process.exit(1);
}

fs.writeFileSync(path.join(DIST, 'index.html'), html);
console.log('  index.html  ' + (html.length / 1024).toFixed(1) + ' kB');

// 2. Statické soubory
for (const polozka of KOPIROVAT) {
  const ok = kopiruj(path.join(ROOT, polozka), path.join(DIST, polozka));
  if (ok) {
    console.log('  ' + polozka.padEnd(20) + (velikost(path.join(DIST, polozka)) / 1024).toFixed(1) + ' kB');
  } else {
    console.log('  ' + polozka.padEnd(20) + 'přeskočeno, soubor neexistuje');
  }
}

console.log('Hotovo. Celkem ' + (velikost(DIST) / 1024).toFixed(1) + ' kB ve složce dist/');
