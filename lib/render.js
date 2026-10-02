// Složení stránky ze šablony (templates/page.html) a obsahu (data/obsah.json).
// Tenhle soubor je jediné místo, kde se stránka skládá. Používá ho build.js
// při nasazení i .claude/dev-server.js při náhledu na počítači.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const POVOLENE_TYPY = ['jpg', 'jpeg', 'png', 'webp', 'avif'];

/** Ošetří text před vypsáním do HTML. */
const h = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

/**
 * Vykreslí obrázek podle názvu souboru z JSONu.
 * Název se bere vždycky jen jako název souboru, nikdy jako cesta, takže se
 * nedá vyskočit mimo složku s fotkami. Když soubor chybí, vrátí se označené
 * místo se jménem souboru, který tam patří.
 */
function obrazek(root, soubor, podslozka, popisek, pomer, prioritni, doGalerie) {
  const nazev = path.basename(String(soubor || '').trim());
  const pripona = path.extname(nazev).slice(1).toLowerCase();
  const slozka = path.join(root, 'assets/img', podslozka);
  const verejna = 'assets/img' + (podslozka ? '/' + podslozka : '');

  if (nazev && POVOLENE_TYPY.includes(pripona)) {
    const naDisku = path.join(slozka, nazev);

    if (naDisku.startsWith(slozka) && fs.existsSync(naDisku)) {
      const url = verejna + '/' + encodeURIComponent(nazev);
      const img = `<img src="${h(url)}" width="1200" height="900"`
        + ` alt="${h(popisek)}"${prioritni ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">`;

      if (!doGalerie) return img;

      return `<button class="foto-lze" type="button" data-lupa="${h(url)}" data-popis="${h(popisek)}">`
        + img
        + '<span class="zvetsit" aria-hidden="true"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/><path d="M7 5v4M5 7h4"/></svg></span>'
        + `<span class="sr">Zvětšit fotku: ${h(popisek)}</span></button>`;
    }
  }

  const ocekavany = nazev || 'nazev-souboru.jpg';
  return `<div class="chybi-foto chybi-foto--${h(pomer)}" role="img" aria-label="${h('Fotka zatím chybí: ' + popisek)}">`
    + '<span class="chybi-foto__t">Sem patří fotka</span>'
    + `<code class="chybi-foto__f">${h(verejna + '/' + ocekavany)}</code>`
    + '</div>';
}

/** Šipky k posuvnému listu. */
function sipky(co) {
  return '<div class="sipky">'
    + '<span class="sipky__poc" data-poc aria-hidden="true"></span>'
    + `<button class="sipka" type="button" data-smer="-1" aria-label="Předchozí ${h(co)}"><svg viewBox="0 0 20 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 6H2"/><path d="M7 1L2 6l5 5"/></svg></button>`
    + `<button class="sipka" type="button" data-smer="1" aria-label="Další ${h(co)}"><svg viewBox="0 0 20 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 6h17"/><path d="M13 1l5 5-5 5"/></svg></button>`
    + '</div>';
}

/** Povolí jen https odkaz na danou doménu, jinak vrátí její hlavní stránku. */
function bezpecnyOdkaz(url, domena) {
  try {
    const u = new URL(String(url));
    if (u.protocol === 'https:' && (u.hostname === domena || u.hostname.endsWith('.' + domena))) {
      return u.href;
    }
  } catch (e) { /* neplatná adresa, spadne to na výchozí hodnotu */ }
  return 'https://www.' + domena + '/';
}

/** Strukturovaná data pro vyhledávače. */
function schema(listK, listJ) {
  const polozky = [];

  for (const skupina of [listK, listJ]) {
    for (const m of skupina) {
      if (!m || !String(m.nazev || '').trim()) continue;
      const p = {
        '@type': 'MenuItem',
        name: String(m.nazev),
        description: String(m.popis || '')
      };
      if (typeof m.cena === 'number') {
        p.offers = { '@type': 'Offer', price: String(Math.trunc(m.cena)), priceCurrency: 'CZK' };
      }
      polozky.push(p);
    }
  }

  const s = {
    '@context': 'https://schema.org',
    '@type': 'CafeOrCoffeeShop',
    name: 'Kavárna Na Kopci',
    description: 'Milkshaky z pravé zmrzliny, výběrová káva a domácí snídaně v Třebíči.',
    url: 'https://www.kavarnanakopci.cz/',
    telephone: '+420 777 123 456',
    email: 'ahoj@kavarnanakopci.cz',
    priceRange: '$$',
    servesCuisine: 'Káva, milkshaky, snídaně',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Na Kopci 12',
      addressLocality: 'Třebíč',
      postalCode: '674 01',
      addressCountry: 'CZ'
    },
    geo: { '@type': 'GeoCoordinates', latitude: 49.2149, longitude: 15.8814 },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '07:30', closes: '18:00'
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Sunday', opens: '09:00', closes: '16:00'
      }
    ],
    sameAs: [
      'https://www.instagram.com/kavarnanakopci',
      'https://www.facebook.com/kavarnanakopci'
    ]
  };

  if (polozky.length) {
    s.hasMenu = {
      '@type': 'Menu',
      hasMenuSection: [{ '@type': 'MenuSection', name: 'Nabídka', hasMenuItem: polozky }]
    };
  }

  // Pojistka proti předčasnému ukončení <script> bloku.
  return JSON.stringify(s).replace(/</g, '\\u003C');
}

/** Složí celou stránku. Vrací hotové HTML. */
function render(root) {
  let data = null;
  let chyba = null;

  try {
    data = JSON.parse(fs.readFileSync(path.join(root, 'data/obsah.json'), 'utf8'));
  } catch (e) {
    chyba = e.code === 'ENOENT' ? 'chybi' : 'rozbity';
  }

  const p = (k) => (data && typeof data[k] === 'object' && data[k]) || {};
  const stav = p('stav');
  const hlaska = p('hlaska');
  const fotky = p('fotky');
  const oNas = p('o_nas');
  const koktejly = p('koktejly');
  const kava = p('kava');
  const kuchyne = p('kuchyne');
  const site = p('instagram');

  const listK = Array.isArray(koktejly.polozky) ? koktejly.polozky : [];
  const listJ = Array.isArray(kuchyne.polozky) ? kuchyne.polozky : [];
  const obr = (...a) => obrazek(root, ...a);

  /* Stav podniku */
  const jeOtevreno = stav.otevreno === true;
  const stavHtml = jeOtevreno
    ? '<span class="stav-dnes" data-stav><i aria-hidden="true"></i><span data-stav-text>Otevírací doba</span></span>'
    : `<span class="stav-dnes stav-dnes--brzy"><i aria-hidden="true"></i>${h(stav.kratce || 'Brzy otevíráme')}</span>`;
  const hodinyPozn = jeOtevreno
    ? 'Poslední kávu naléváme dvacet minut před zavírací dobou.'
    : (stav.poznamka || 'Otevírací doba platí od prvního dne.');

  /* Hláška v úvodu */
  const textHlasky = String(hlaska.text || '').trim();
  const pointa = String(hlaska.pointa || '').trim();
  const hlaskaHtml = (textHlasky || pointa)
    ? '<p class="hlaska">'
      + (textHlasky ? `<span>${h(textHlasky)}</span> ` : '')
      + (pointa ? `<b>${h(pointa)}</b>` : '')
      + '</p>'
    : '';

  /* O nás */
  let oNasHtml = '';
  if (!chyba && Object.keys(oNas).length) {
    const cisla = Array.isArray(oNas.cisla) ? oNas.cisla : [];
    oNasHtml = '<div class="onas"><div class="onas__text">'
      + `<h2 class="h2">${h(oNas.nadpis || 'O nás')}</h2>`
      + `<p class="onas__p">${h(oNas.text || '')}</p>`
      + (cisla.length
        ? '<dl class="cisla">' + cisla.map(c =>
          `<div><dt>${h(c.hodnota || '')}</dt><dd>${h(c.popis || '')}</dd></div>`).join('') + '</dl>'
        : '')
      + '</div><figure class="onas__foto">'
      + obr(fotky['o-nas'], '', 'Tým kavárny Na Kopci', '4x5', false, true)
      + '</figure></div>';
  }

  /* Milkshaky jako posuvný list */
  const kusy = [];
  kusy.push('<div class="sec__head sec__head--rada"><div>'
    + `<h2 class="h2">${h(koktejly.nadpis || 'Milkshaky')}</h2>`
    + `<p class="sec__lead">${h(koktejly.podnadpis || '')}</p></div>`
    + sipky('milkshake') + '</div>');

  if (chyba) {
    kusy.push('<p class="stav">Obsah se teď nedaří načíst. Aktuální nabídku vám rádi řekneme na baru nebo na telefonu. <a href="tel:+420777123456">+420 777 123 456</a></p>');
  } else if (!listK.length) {
    kusy.push('<p class="stav">Milkshaky právě ladíme a brzy je sem doplníme.</p>');
  } else {
    kusy.push('<ul class="rada rada--vysoka" data-rada>');
    for (const m of listK) {
      if (!m || !String(m.nazev || '').trim()) continue;
      const nazev = String(m.nazev).trim();
      const dostupny = m.dostupny !== false;
      const znacky = Array.isArray(m.znacky) ? m.znacky : [];

      kusy.push(`<li class="rada__i${dostupny ? '' : ' rada__i--pryc'}"><div class="rada__foto">`);
      kusy.push(obr(m.obrazek, 'milkshaky', 'Milkshake ' + nazev, '4x5', false, true));

      if (znacky.length || !dostupny) {
        kusy.push('<div class="rada__znacky">');
        if (!dostupny) kusy.push('<span class="znacka znacka--pryc">Zatím nemáme</span>');
        for (let z of znacky) {
          z = String(z).trim();
          if (z) kusy.push(`<span class="znacka">${h(z)}</span>`);
        }
        kusy.push('</div>');
      }

      kusy.push('</div><div class="rada__text">');
      kusy.push(`<h3 class="rada__n">${h(nazev)}</h3>`);
      if (String(m.popis || '').trim()) kusy.push(`<p class="rada__d">${h(String(m.popis).trim())}</p>`);
      if (typeof m.cena === 'number') kusy.push(`<p class="rada__p">${Math.trunc(m.cena)} <span>Kč</span></p>`);
      kusy.push('</div></li>');
    }
    kusy.push('</ul>');
  }

  /* Káva */
  let kavaHtml = '';
  if (!chyba && Object.keys(kava).length) {
    const zrno = kava.zrno_tydne || {};
    const cenik = Array.isArray(kava.cenik) ? kava.cenik : [];
    const chute = Array.isArray(zrno.chute) ? zrno.chute : [];

    kavaHtml = `<div class="sec__head"><h2 class="h2">${h(kava.nadpis || 'Káva')}</h2>`
      + `<p class="sec__lead">${h(kava.podnadpis || '')}</p></div><div class="kava">`;

    if (Object.keys(zrno).length) {
      kavaHtml += '<article class="zrno">'
        + `<p class="zrno__stitek"><i aria-hidden="true"></i>${h(zrno.stitek || 'Zrno týdne')}</p>`
        + `<h3 class="zrno__n">${h(zrno.nazev || '')}</h3>`
        + `<p class="zrno__p">${h(zrno.puvod || '')}</p>`
        + (chute.length ? '<ul class="zrno__chute">' + chute.map(c => `<li>${h(c)}</li>`).join('') + '</ul>' : '')
        + '<dl class="zrno__data">'
        + (zrno.vyska ? `<div><dt>Nadmořská výška</dt><dd>${h(zrno.vyska)}</dd></div>` : '')
        + (zrno.zpracovani ? `<div><dt>Zpracování</dt><dd>${h(zrno.zpracovani)}</dd></div>` : '')
        + '</dl>'
        + (zrno.poznamka ? `<p class="zrno__pozn">${h(zrno.poznamka)}</p>` : '')
        + '</article>';
    }

    if (cenik.length) {
      kavaHtml += '<ul class="menu-list">' + cenik.filter(c => c && c.nazev).map(c =>
        `<li><span class="menu-list__n">${h(c.nazev)}</span><span class="menu-list__p">${h(c.cena || '')}</span></li>`
      ).join('') + '</ul>';
    }

    kavaHtml += '</div>';
  }

  /* Kuchyně */
  let kuchyneHtml = '';
  if (!chyba && listJ.length) {
    kuchyneHtml = '<div class="sec__head sec__head--rada"><div>'
      + `<h2 class="h2">${h(kuchyne.nadpis || 'Kuchyně')}</h2>`
      + `<p class="sec__lead">${h(kuchyne.podnadpis || '')}</p></div>`
      + sipky('jídlo') + '</div><ul class="rada" data-rada>';

    for (const j of listJ) {
      if (!j || !String(j.nazev || '').trim()) continue;
      const nazev = String(j.nazev).trim();
      kuchyneHtml += '<li class="rada__i">'
        + `<div class="rada__foto">${obr(j.obrazek, 'kuchyne', nazev, '4x3', false, true)}</div>`
        + '<div class="rada__text">'
        + `<h3 class="rada__n">${h(nazev)}</h3>`
        + (String(j.popis || '').trim() ? `<p class="rada__d">${h(String(j.popis).trim())}</p>` : '')
        + (typeof j.cena === 'number' ? `<p class="rada__p">${Math.trunc(j.cena)} <span>Kč</span></p>` : '')
        + '</div></li>';
    }

    kuchyneHtml += '</ul>';
    if (kuchyne.poznamka) kuchyneHtml += `<p class="fine">${h(kuchyne.poznamka)}</p>`;
  }

  /* Sociální sítě */
  let siteHtml = '';
  if (!chyba && Object.keys(site).length) {
    const post = site.posledni_prispevek || {};
    const ucet = String(site.ucet || '').trim();
    const ig = bezpecnyOdkaz(site.odkaz_instagram, 'instagram.com');
    const fb = bezpecnyOdkaz(site.odkaz_facebook, 'facebook.com');

    siteHtml = '<div class="site"><div class="site__text">'
      + `<h2 class="h2">${h(site.nadpis || 'Sledujte nás')}</h2>`
      + `<p class="sec__lead">${h(site.text || '')}</p>`
      + '<div class="site__btn">'
      + `<a class="btn btn--fill" href="${h(ig)}" target="_blank" rel="noopener">Instagram${ucet ? ` <span>@${h(ucet)}</span>` : ''}</a>`
      + `<a class="btn btn--quiet" href="${h(fb)}" target="_blank" rel="noopener">Facebook</a>`
      + '</div></div>';

    if (Object.keys(post).length) {
      const odkaz = bezpecnyOdkaz(post.odkaz, 'instagram.com');
      let citelne = '';

      if (post.datum) {
        const d = new Date(post.datum);
        const mes = ['ledna', 'února', 'března', 'dubna', 'května', 'června',
          'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'];
        if (!isNaN(d)) citelne = `${d.getDate()}. ${mes[d.getMonth()]} ${d.getFullYear()}`;
      }

      siteHtml += `<a class="post" href="${h(odkaz)}" target="_blank" rel="noopener">`
        + `<span class="post__foto">${obr(post.obrazek, '', 'Poslední příspěvek na Instagramu', '1x1', false)}</span>`
        + '<span class="post__telo">'
        + `<span class="post__hlava">Poslední příspěvek${citelne ? ` <time datetime="${h(post.datum)}">${h(citelne)}</time>` : ''}</span>`
        + `<span class="post__t">${h(post.popisek || '')}</span>`
        + '<span class="post__cta">Otevřít na Instagramu<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12L12 4"/><path d="M6 4h6v6"/></svg></span>'
        + '</span></a>';
    }

    siteHtml += '</div>';
  }

  /* Bezpečnostní politika.
     Jediný vložený script na stránce jsou strukturovaná data. Spočítáme jeho
     otisk, takže politika může zůstat přísná a nemusíme povolovat 'unsafe-inline'. */
  const schemaJson = schema(listK, listJ);
  const otisk = crypto.createHash('sha256').update(schemaJson, 'utf8').digest('base64');
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'sha256-${otisk}'`,
    "style-src 'self'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'"
  ].join('; ');

  const sablona = fs.readFileSync(path.join(root, 'templates/page.html'), 'utf8');

  const znacky = {
    CSP: `<meta http-equiv="Content-Security-Policy" content="${h(csp)}">`,
    FOTO_UVOD: obr(fotky.uvod, '', 'Interiér kavárny Na Kopci', '1x1', true, true),
    FOTO_PROSTOR: obr(fotky.prostor, '', 'Terasa kavárny s výhledem na Třebíč', '16x9', false, true),
    O_NAS: oNasHtml,
    MILKSHAKY: kusy.join('\n'),
    KAVA: kavaHtml,
    KUCHYNE: kuchyneHtml,
    SITE: siteHtml,
    STAV: stavHtml,
    HLASKA: hlaskaHtml,
    HODINY_POZN: h(hodinyPozn),
    ROK: String(new Date().getFullYear()),
    SCHEMA: schemaJson
  };

  // Dosazujeme přes funkci. Kdybychom předali text přímo, JavaScript by v něm
  // vykládal sekvence jako $$ nebo $& jako příkazy a obsah by se poškodil.
  // Schema obsahuje "priceRange":"$$", takže to není teoretický problém.
  return sablona.replace(/\{\{([A-Z_]+)\}\}/g, (cele, klic) =>
    Object.prototype.hasOwnProperty.call(znacky, klic) ? znacky[klic] : cele
  );
}

module.exports = { render, h };
