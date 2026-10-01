/* Kavárna Na Kopci - bez závislostí */
(function () {
  'use strict';

  var klidnyRezim = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Příchod obsahu při scrollu ---------- */
  if (!klidnyRezim && 'IntersectionObserver' in window) {
    var cile = document.querySelectorAll(
      '.hero__text, .hero__media, .sec__head, .onas__text, .onas__foto, .karta,'
      + ' .zrno, .menu-list, .rada__i, .scene__card, .site__text, .post, .info__b, .foot__row'
    );
    cile.forEach(function (el) { el.classList.add('reveal'); });

    var sledovac = new IntersectionObserver(function (zaznamy) {
      zaznamy.forEach(function (z) {
        if (z.isIntersecting) {
          z.target.classList.add('je-tu');
          sledovac.unobserve(z.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });

    cile.forEach(function (el) { sledovac.observe(el); });

    // Pojistka. Kdyby observer v nějakém prohlížeči nenaběhl, obsah by zůstal
    // neviditelný. Po chvíli ho proto odhalíme natvrdo.
    setTimeout(function () {
      if (document.querySelectorAll('.reveal.je-tu').length === 0) {
        sledovac.disconnect();
        cile.forEach(function (el) { el.classList.add('je-tu'); });
        return;
      }
      // Observer běží, ale něco mohl minout. Co je už v okně, odhalíme.
      cile.forEach(function (el) {
        if (el.classList.contains('je-tu')) return;
        if (el.getBoundingClientRect().top < innerHeight) {
          el.classList.add('je-tu');
          sledovac.unobserve(el);
        }
      });
    }, 1800);
  }

  /* ---------- 2. Linka pod lištou po odscrollování ---------- */
  if ('IntersectionObserver' in window) {
    var hlidka = document.createElement('div');
    hlidka.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:60px;pointer-events:none';
    document.body.prepend(hlidka);
    new IntersectionObserver(function (z) {
      document.body.classList.toggle('is-scrolled', !z[0].isIntersecting);
    }).observe(hlidka);
  }

  /* ---------- 3. Mobilní menu ---------- */
  var tlacitko = document.querySelector('.burger');
  var panel = document.getElementById('mobilni-menu');
  var casovac;

  function prepniMenu(otevrit) {
    tlacitko.setAttribute('aria-expanded', String(otevrit));
    document.body.classList.toggle('is-locked', otevrit);
    clearTimeout(casovac);

    if (otevrit) {
      panel.hidden = false;
      void panel.offsetWidth;
      panel.classList.add('is-open');
    } else {
      panel.classList.remove('is-open');
      casovac = setTimeout(function () { panel.hidden = true; }, 350);
    }
  }

  if (tlacitko && panel) {
    tlacitko.addEventListener('click', function () {
      prepniMenu(tlacitko.getAttribute('aria-expanded') !== 'true');
    });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) prepniMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && tlacitko.getAttribute('aria-expanded') === 'true') {
        prepniMenu(false);
        tlacitko.focus();
      }
    });
    matchMedia('(min-width: 1001px)').addEventListener('change', function (e) {
      if (e.matches && tlacitko.getAttribute('aria-expanded') === 'true') prepniMenu(false);
    });
  }

  /* ---------- 4. Navigace: ukazatel aktivní sekce ---------- */
  var odkazy = [].slice.call(document.querySelectorAll('.topbar__nav a'));
  var ukazatel = document.querySelector('.topbar__ind');

  if (odkazy.length && ukazatel && 'IntersectionObserver' in window) {
    var sekce = odkazy.map(function (a) {
      return document.querySelector(a.getAttribute('href'));
    });

    function posunUkazatel(a) {
      ukazatel.style.setProperty('--x', a.offsetLeft + 'px');
      ukazatel.style.setProperty('--w', a.offsetWidth + 'px');
      ukazatel.classList.add('je-videt');
    }

    var spy = new IntersectionObserver(function (zaznamy) {
      zaznamy.forEach(function (z) {
        if (!z.isIntersecting) return;
        var i = sekce.indexOf(z.target);
        if (i < 0) return;
        odkazy.forEach(function (a, n) { a.classList.toggle('je-tady', n === i); });
        posunUkazatel(odkazy[i]);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sekce.forEach(function (s) { if (s) spy.observe(s); });

    addEventListener('resize', function () {
      var aktivni = document.querySelector('.topbar__nav a.je-tady');
      if (aktivni) posunUkazatel(aktivni);
    }, { passive: true });
  }

  /* ---------- 5. Posuvné listy (koktejly, snídaně) ---------- */
  document.querySelectorAll('[data-karusel]').forEach(function (sekce) {
    var rada = sekce.querySelector('[data-rada]');
    var sipky = [].slice.call(sekce.querySelectorAll('.sipka'));
    var pocitadlo = sekce.querySelector('[data-poc]');
    if (!rada) return;

    var polozky = [].slice.call(rada.querySelectorAll('.rada__i'));

    function krok() {
      if (!polozky.length) return rada.clientWidth * 0.8;
      var mezera = parseFloat(getComputedStyle(rada).columnGap) || 16;
      return polozky[0].getBoundingClientRect().width + mezera;
    }

    function obnov() {
      var max = rada.scrollWidth - rada.clientWidth;
      // List má vnitřní odsazení, takže v klidu nestojí přesně na nule.
      // Tolerance podle šířky karty je spolehlivější než pevných pár pixelů.
      var tolerance = krok() * 0.5;

      sipky.forEach(function (s) {
        var smer = Number(s.getAttribute('data-smer'));
        s.disabled = smer < 0
          ? rada.scrollLeft < tolerance
          : rada.scrollLeft > max - tolerance;
      });

      if (pocitadlo && polozky.length) {
        // Na konci listu ukazujeme poslední číslo, i když je vidět víc karet najednou.
        var kde = rada.scrollLeft > max - tolerance
          ? polozky.length
          : Math.min(polozky.length, Math.round(rada.scrollLeft / krok()) + 1);
        pocitadlo.textContent = kde + ' / ' + polozky.length;
      }
    }

    sipky.forEach(function (s) {
      s.addEventListener('click', function () {
        rada.scrollBy({
          left: krok() * Number(s.getAttribute('data-smer')),
          behavior: klidnyRezim ? 'auto' : 'smooth'
        });
      });
    });

    rada.addEventListener('scroll', obnov, { passive: true });
    addEventListener('resize', obnov, { passive: true });
    obnov();
  });

  /* ---------- 6. Galerie fotek ---------- */
  var lupa = document.querySelector('.lupa');

  if (lupa && typeof lupa.showModal === 'function') {
    var fotky = [].slice.call(document.querySelectorAll('[data-lupa]'));
    var media = lupa.querySelector('.lupa__media');
    var popisEl = lupa.querySelector('.lupa__popis');
    var pocetEl = lupa.querySelector('.lupa__pocet');
    var zavrit = lupa.querySelector('.lupa__x');
    var zpet = lupa.querySelector('.lupa__sip--zpet');
    var vpred = lupa.querySelector('.lupa__sip--vpred');
    var tlacitkoGalerie = document.querySelector('[data-galerie]');
    var kde = 0;
    var odkud = null;

    function ukaz(i) {
      if (!fotky.length) return;
      kde = (i + fotky.length) % fotky.length;
      var zdroj = fotky[kde];
      var obr = new Image();
      obr.src = zdroj.getAttribute('data-lupa');
      obr.alt = zdroj.getAttribute('data-popis') || '';
      media.replaceChildren(obr);
      popisEl.textContent = zdroj.getAttribute('data-popis') || '';
      pocetEl.textContent = (kde + 1) + ' / ' + fotky.length;
      var jedna = fotky.length < 2;
      zpet.disabled = jedna;
      vpred.disabled = jedna;
    }

    function otevri(i, spoustec) {
      odkud = spoustec || null;
      ukaz(i);
      lupa.showModal();
    }

    fotky.forEach(function (f, i) {
      f.addEventListener('click', function () { otevri(i, f); });
    });

    if (tlacitkoGalerie && fotky.length) {
      tlacitkoGalerie.hidden = false;
      var pocitadlo = tlacitkoGalerie.querySelector('[data-galerie-pocet]');
      if (pocitadlo) pocitadlo.textContent = '(' + fotky.length + ')';
      tlacitkoGalerie.addEventListener('click', function () { otevri(0, tlacitkoGalerie); });
    }

    // Úklid děláme sami a ne v události close. Některé enginy ji nespustí
    // a fokus by zůstal viset na skrytém tlačítku.
    function zavri() {
      if (lupa.open) lupa.close();
      media.replaceChildren();
      if (odkud && document.contains(odkud)) {
        odkud.focus();
        odkud = null;
      }
    }

    zavrit.addEventListener('click', zavri);
    zpet.addEventListener('click', function () { ukaz(kde - 1); });
    vpred.addEventListener('click', function () { ukaz(kde + 1); });

    lupa.addEventListener('click', function (e) {
      if (e.target === lupa) zavri();
    });

    // Escape: zrušíme výchozí zavření a uděláme ho sami i s úklidem.
    lupa.addEventListener('cancel', function (e) {
      e.preventDefault();
      zavri();
    });

    lupa.addEventListener('close', zavri);

    lupa.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); ukaz(kde + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); ukaz(kde - 1); }
    });
  }

  /* ---------- 7. Hlášky ---------- */
  var hlaska = document.querySelector('.toast');
  var hlaskaCas;

  function ukazHlasku(text) {
    if (!hlaska) return;
    hlaska.textContent = text;
    hlaska.classList.add('je-videt');
    clearTimeout(hlaskaCas);
    hlaskaCas = setTimeout(function () { hlaska.classList.remove('je-videt'); }, 2600);
  }

  /* ---------- 8. Kopírování adresy ---------- */
  function zaloznaKopie(text) {
    var pole = document.createElement('textarea');
    pole.value = text;
    pole.setAttribute('readonly', '');
    pole.style.cssText = 'position:fixed;top:-100px;opacity:0';
    document.body.appendChild(pole);
    pole.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    document.body.removeChild(pole);
    return ok;
  }

  document.querySelectorAll('[data-kopirovat]').forEach(function (btn) {
    var popisek = btn.querySelector('.copy__t');
    var puvodni = popisek ? popisek.textContent : '';

    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-kopirovat');

      function hotovo(ok) {
        if (!ok) {
          ukazHlasku('Zkopírování se nepovedlo. Adresa je ' + text);
          return;
        }
        btn.classList.add('je-hotovo');
        if (popisek) popisek.textContent = 'Zkopírováno';
        ukazHlasku('Adresa zkopírována, vložte ji do map');
        setTimeout(function () {
          btn.classList.remove('je-hotovo');
          if (popisek) popisek.textContent = puvodni;
        }, 2600);
      }

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(
          function () { hotovo(true); },
          function () { hotovo(zaloznaKopie(text)); }
        );
      } else {
        hotovo(zaloznaKopie(text));
      }
    });
  });

  /* ---------- 9. Otevírací doba a živý stav ---------- */
  /* Minuty od půlnoci. Změnu doby promítněte i do šablony a do index.php. */
  var DOBA = {
    1: [450, 1080], 2: [450, 1080], 3: [450, 1080],
    4: [450, 1080], 5: [450, 1080], 6: [450, 1080],
    0: [540, 960]
  };

  function naCas(m) {
    return Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0');
  }

  var ted = new Date();
  var den = ted.getDay();
  var minuty = ted.getHours() * 60 + ted.getMinutes();
  var dnesni = DOBA[den];

  var dnesek = document.querySelector('[data-dnes]');

  // Dokud kavárna neotevřela, nic z toho nedává smysl. Značku "dnes" ani živý
  // stav proto ukazujeme, až když index.php vypíše prvky s data-dnes a data-stav.
  if (dnesek && dnesni) {
    dnesek.textContent = naCas(dnesni[0]) + ' - ' + naCas(dnesni[1]);

    document.querySelectorAll('.hours li[data-dny]').forEach(function (radek) {
      if (radek.getAttribute('data-dny').split(',').indexOf(String(den)) > -1) {
        radek.classList.add('je-dnes');
      }
    });
  }

  var stav = document.querySelector('[data-stav]');
  var stavText = document.querySelector('[data-stav-text]');

  if (stav && stavText && dnesni) {
    var otevreno = minuty >= dnesni[0] && minuty < dnesni[1];
    stav.classList.toggle('je-otevreno', otevreno);
    stav.classList.toggle('je-zavreno', !otevreno);

    if (otevreno) {
      var doZavreni = dnesni[1] - minuty;
      stavText.textContent = doZavreni <= 60
        ? 'Zavíráme za ' + doZavreni + ' min'
        : 'Teď otevřeno do ' + naCas(dnesni[1]);
    } else {
      var zitra = DOBA[(den + 1) % 7];
      stavText.textContent = minuty < dnesni[0]
        ? 'Otevíráme v ' + naCas(dnesni[0])
        : 'Zavřeno, zítra od ' + naCas(zitra[0]);
    }
  }
})();
