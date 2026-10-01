<?php
declare(strict_types=1);

/**
 * Kavárna Na Kopci
 * Složí stránku ze šablony (templates/page.html) a obsahu (data/obsah.json).
 * Žádná databáze, žádný build, žádný vstup od návštěvníka.
 */

ini_set('display_errors', '0');
error_reporting(E_ALL);
mb_internal_encoding('UTF-8');

const SOUBOR_DAT     = __DIR__ . '/data/obsah.json';
const SOUBOR_SABLONY = __DIR__ . '/templates/page.html';
const POVOLENE_TYPY  = ['jpg', 'jpeg', 'png', 'webp', 'avif'];

/** Ošetří text před vypsáním do HTML. */
function h(mixed $text): string
{
    return htmlspecialchars((string) $text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/**
 * Vykreslí obrázek podle názvu souboru z JSONu.
 *
 * Název se bere vždycky jen jako název souboru, nikdy jako cesta (basename
 * plus kontrola přes realpath), takže se nedá vyskočit mimo složku s fotkami.
 * Když soubor chybí, vrátí se označené prázdné místo se jménem souboru,
 * který tam patří. Layout se nerozsype a je vidět, co doplnit.
 */
function obrazek(
    string $nazevSouboru,
    string $podslozka,
    string $popisek,
    string $pomer,
    bool $prioritni = false,
    bool $doGalerie = false
): string {
    $nazevSouboru = basename(trim($nazevSouboru));
    $pripona      = strtolower(pathinfo($nazevSouboru, PATHINFO_EXTENSION));
    $slozka       = __DIR__ . '/assets/img' . ($podslozka !== '' ? '/' . $podslozka : '');
    $verejna      = 'assets/img' . ($podslozka !== '' ? '/' . $podslozka : '');

    if ($nazevSouboru !== '' && in_array($pripona, POVOLENE_TYPY, true)) {
        $realna = realpath($slozka . '/' . $nazevSouboru);
        $koren  = realpath($slozka);

        if ($realna !== false && $koren !== false && str_starts_with($realna, $koren) && is_file($realna)) {
            $rozmery = @getimagesize($realna);
            $cesta   = $verejna . '/' . rawurlencode($nazevSouboru);

            $img = '<img src="' . h($cesta) . '"'
                 . ' width="' . (int) ($rozmery[0] ?? 1200) . '" height="' . (int) ($rozmery[1] ?? 900) . '"'
                 . ' alt="' . h($popisek) . '"'
                 . ($prioritni ? ' fetchpriority="high"' : ' loading="lazy"')
                 . ' decoding="async">';

            if (!$doGalerie) {
                return $img;
            }

            // Fotka, kterou jde rozkliknout a dál v ní listovat.
            return '<button class="foto-lze" type="button"'
                 . ' data-lupa="' . h($cesta) . '" data-popis="' . h($popisek) . '">'
                 . $img
                 . '<span class="zvetsit" aria-hidden="true">'
                 . '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">'
                 . '<circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/><path d="M7 5v4M5 7h4"/></svg>'
                 . '</span>'
                 . '<span class="sr">Zvětšit fotku: ' . h($popisek) . '</span>'
                 . '</button>';
        }
    }

    $ocekavany = $nazevSouboru !== '' ? $nazevSouboru : 'nazev-souboru.jpg';

    return '<div class="chybi-foto chybi-foto--' . h($pomer) . '" role="img" aria-label="'
         . h('Fotka zatím chybí: ' . $popisek) . '">'
         . '<span class="chybi-foto__t">Sem patří fotka</span>'
         . '<code class="chybi-foto__f">' . h($verejna . '/' . $ocekavany) . '</code>'
         . '</div>';
}

/** Šipky k posuvnému listu. $co se doplní do popisku pro odečítače obrazovky. */
function sipky(string $co): string
{
    return '<div class="sipky">'
         . '<span class="sipky__poc" data-poc aria-hidden="true"></span>'
         . '<button class="sipka" type="button" data-smer="-1" aria-label="Předchozí ' . h($co) . '">'
         . '<svg viewBox="0 0 20 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 6H2"/><path d="M7 1L2 6l5 5"/></svg></button>'
         . '<button class="sipka" type="button" data-smer="1" aria-label="Další ' . h($co) . '">'
         . '<svg viewBox="0 0 20 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 6h17"/><path d="M13 1l5 5-5 5"/></svg></button>'
         . '</div>';
}

/** Povolí jen https odkaz na danou doménu, jinak vrátí její hlavní stránku. */
function bezpecnyOdkaz(string $url, string $domena): string
{
    $casti = parse_url($url);
    $host  = strtolower($casti['host'] ?? '');
    $ok    = ($casti['scheme'] ?? '') === 'https'
          && ($host === $domena || str_ends_with($host, '.' . $domena));

    return $ok ? $url : 'https://www.' . $domena . '/';
}

/* ---------- Načtení dat ---------- */

$data  = null;
$chyba = null;

if (!is_readable(SOUBOR_DAT)) {
    $chyba = 'chybi';
} else {
    $syrova = file_get_contents(SOUBOR_DAT);
    $data   = json_decode($syrova !== false ? $syrova : '', true);
    if (!is_array($data)) {
        $chyba = 'rozbity';
        $data  = null;
    }
}

/** Bezpečné vytažení podpole. */
function pole(?array $data, string $klic): array
{
    return is_array($data[$klic] ?? null) ? $data[$klic] : [];
}

$stav     = pole($data, 'stav');
$hlaska   = pole($data, 'hlaska');
$fotky    = pole($data, 'fotky');
$oNas     = pole($data, 'o_nas');
$koktejly = pole($data, 'koktejly');
$kava     = pole($data, 'kava');
$kuchyne  = pole($data, 'kuchyne');
$site     = pole($data, 'instagram');

$seznamKoktejlu = is_array($koktejly['polozky'] ?? null) ? $koktejly['polozky'] : [];
$seznamKuchyne  = is_array($kuchyne['polozky'] ?? null) ? $kuchyne['polozky'] : [];

/* ---------- Stav podniku ---------- */
/* Dokud kavárna neotevřela, nemá smysl počítat živé "teď otevřeno".
   Místo toho se ukáže pevný štítek a v úvodu termín otevření. */

$jeOtevreno = ($stav['otevreno'] ?? false) === true;

if ($jeOtevreno) {
    $stavHtml = '<span class="stav-dnes" data-stav><i aria-hidden="true"></i>'
              . '<span data-stav-text>Otevírací doba</span></span>';
    $hodinyPozn = 'Poslední kávu naléváme dvacet minut před zavírací dobou.';
} else {
    $stavHtml = '<span class="stav-dnes stav-dnes--brzy"><i aria-hidden="true"></i>'
              . h((string) ($stav['kratce'] ?? 'Brzy otevíráme')) . '</span>';
    $hodinyPozn = (string) ($stav['poznamka'] ?? 'Otevírací doba platí od prvního dne.');
}

/* ---------- Hláška v úvodu ---------- */

$textHlasky = trim((string) ($hlaska['text'] ?? ''));
$pointa     = trim((string) ($hlaska['pointa'] ?? ''));
$hlaskaHtml = '';

if ($textHlasky !== '' || $pointa !== '') {
    $hlaskaHtml = '<p class="hlaska">'
                . ($textHlasky !== '' ? '<span>' . h($textHlasky) . '</span> ' : '')
                . ($pointa !== '' ? '<b>' . h($pointa) . '</b>' : '')
                . '</p>';
}

/* ---------- O nás ---------- */

$oNasHtml = '';
if ($chyba === null && $oNas !== []) {
    $cisla = is_array($oNas['cisla'] ?? null) ? $oNas['cisla'] : [];

    $oNasHtml .= '<div class="onas">';
    $oNasHtml .= '<div class="onas__text">';
    $oNasHtml .= '<h2 class="h2">' . h((string) ($oNas['nadpis'] ?? 'O nás')) . '</h2>';
    $oNasHtml .= '<p class="onas__p">' . h((string) ($oNas['text'] ?? '')) . '</p>';

    if ($cisla !== []) {
        $oNasHtml .= '<dl class="cisla">';
        foreach ($cisla as $c) {
            if (!is_array($c)) {
                continue;
            }
            $oNasHtml .= '<div><dt>' . h((string) ($c['hodnota'] ?? '')) . '</dt>'
                       . '<dd>' . h((string) ($c['popis'] ?? '')) . '</dd></div>';
        }
        $oNasHtml .= '</dl>';
    }

    $oNasHtml .= '</div>';
    $oNasHtml .= '<figure class="onas__foto">'
               . obrazek((string) ($fotky['o-nas'] ?? ''), '', 'Tým kavárny Na Kopci', '4x5', false, true)
               . '</figure>';
    $oNasHtml .= '</div>';
}

/* ---------- Milkshaky ---------- */
/* Posuvný list. Šest karet pod sebou zabíralo na mobilu moc místa,
   takže se jimi listuje stejně jako u snídaní. */

$kusy = [];

$kusy[] = '<div class="sec__head sec__head--rada">';
$kusy[] = '<div>';
$kusy[] = '<h2 class="h2">' . h((string) ($koktejly['nadpis'] ?? 'Milkshaky')) . '</h2>';
$kusy[] = '<p class="sec__lead">' . h((string) ($koktejly['podnadpis'] ?? '')) . '</p>';
$kusy[] = '</div>';
$kusy[] = sipky('milkshake');
$kusy[] = '</div>';

if ($chyba !== null) {
    $kusy[] = '<p class="stav">Obsah se teď nedaří načíst. Aktuální nabídku vám rádi řekneme na baru nebo na telefonu. '
            . '<a href="tel:+420777123456">+420 777 123 456</a></p>';
} elseif ($seznamKoktejlu === []) {
    $kusy[] = '<p class="stav">Milkshaky právě ladíme a brzy je sem doplníme.</p>';
} else {
    $kusy[] = '<ul class="rada rada--vysoka" data-rada>';

    foreach ($seznamKoktejlu as $m) {
        if (!is_array($m)) {
            continue;
        }
        $nazev = trim((string) ($m['nazev'] ?? ''));
        if ($nazev === '') {
            continue;
        }

        $popis    = trim((string) ($m['popis'] ?? ''));
        $cena     = $m['cena'] ?? null;
        $dostupny = ($m['dostupny'] ?? true) !== false;
        $znacky   = is_array($m['znacky'] ?? null) ? $m['znacky'] : [];

        $kusy[] = '<li class="rada__i' . ($dostupny ? '' : ' rada__i--pryc') . '">';
        $kusy[] = '<div class="rada__foto">';
        $kusy[] = obrazek((string) ($m['obrazek'] ?? ''), 'milkshaky', 'Milkshake ' . $nazev, '4x5', false, true);

        if ($znacky !== [] || !$dostupny) {
            $kusy[] = '<div class="rada__znacky">';
            if (!$dostupny) {
                $kusy[] = '<span class="znacka znacka--pryc">Zatím nemáme</span>';
            }
            foreach ($znacky as $z) {
                $z = trim((string) $z);
                if ($z !== '') {
                    $kusy[] = '<span class="znacka">' . h($z) . '</span>';
                }
            }
            $kusy[] = '</div>';
        }

        $kusy[] = '</div>';
        $kusy[] = '<div class="rada__text">';
        $kusy[] = '<h3 class="rada__n">' . h($nazev) . '</h3>';
        if ($popis !== '') {
            $kusy[] = '<p class="rada__d">' . h($popis) . '</p>';
        }
        if (is_numeric($cena)) {
            $kusy[] = '<p class="rada__p">' . h((string) (int) $cena) . ' <span>Kč</span></p>';
        }
        $kusy[] = '</div>';
        $kusy[] = '</li>';
    }

    $kusy[] = '</ul>';
}

$koktejlyHtml = implode("
", $kusy);

/* ---------- Káva ---------- */

$kavaHtml = '';
if ($chyba === null && $kava !== []) {
    $zrno  = is_array($kava['zrno_tydne'] ?? null) ? $kava['zrno_tydne'] : [];
    $cenik = is_array($kava['cenik'] ?? null) ? $kava['cenik'] : [];
    $chute = is_array($zrno['chute'] ?? null) ? $zrno['chute'] : [];

    $kavaHtml .= '<div class="sec__head">';
    $kavaHtml .= '<h2 class="h2">' . h((string) ($kava['nadpis'] ?? 'Káva')) . '</h2>';
    $kavaHtml .= '<p class="sec__lead">' . h((string) ($kava['podnadpis'] ?? '')) . '</p>';
    $kavaHtml .= '</div>';

    $kavaHtml .= '<div class="kava">';

    if ($zrno !== []) {
        $kavaHtml .= '<article class="zrno">';
        $kavaHtml .= '<p class="zrno__stitek"><i aria-hidden="true"></i>'
                   . h((string) ($zrno['stitek'] ?? 'Zrno týdne')) . '</p>';
        $kavaHtml .= '<h3 class="zrno__n">' . h((string) ($zrno['nazev'] ?? '')) . '</h3>';
        $kavaHtml .= '<p class="zrno__p">' . h((string) ($zrno['puvod'] ?? '')) . '</p>';

        if ($chute !== []) {
            $kavaHtml .= '<ul class="zrno__chute">';
            foreach ($chute as $ch) {
                $ch = trim((string) $ch);
                if ($ch !== '') {
                    $kavaHtml .= '<li>' . h($ch) . '</li>';
                }
            }
            $kavaHtml .= '</ul>';
        }

        $kavaHtml .= '<dl class="zrno__data">';
        foreach ([['Nadmořská výška', $zrno['vyska'] ?? ''], ['Zpracování', $zrno['zpracovani'] ?? '']] as [$k, $v]) {
            if (trim((string) $v) !== '') {
                $kavaHtml .= '<div><dt>' . h($k) . '</dt><dd>' . h((string) $v) . '</dd></div>';
            }
        }
        $kavaHtml .= '</dl>';

        if (trim((string) ($zrno['poznamka'] ?? '')) !== '') {
            $kavaHtml .= '<p class="zrno__pozn">' . h((string) $zrno['poznamka']) . '</p>';
        }
        $kavaHtml .= '</article>';
    }

    if ($cenik !== []) {
        $kavaHtml .= '<ul class="menu-list">';
        foreach ($cenik as $p) {
            if (!is_array($p) || trim((string) ($p['nazev'] ?? '')) === '') {
                continue;
            }
            $kavaHtml .= '<li><span class="menu-list__n">' . h((string) $p['nazev']) . '</span>'
                       . '<span class="menu-list__p">' . h((string) ($p['cena'] ?? '')) . '</span></li>';
        }
        $kavaHtml .= '</ul>';
    }

    $kavaHtml .= '</div>';
}

/* ---------- Kuchyně ---------- */

$kuchyneHtml = '';
if ($chyba === null && $seznamKuchyne !== []) {
    $kuchyneHtml .= '<div class="sec__head sec__head--rada">';
    $kuchyneHtml .= '<div>';
    $kuchyneHtml .= '<h2 class="h2">' . h((string) ($kuchyne['nadpis'] ?? 'Kuchyně')) . '</h2>';
    $kuchyneHtml .= '<p class="sec__lead">' . h((string) ($kuchyne['podnadpis'] ?? '')) . '</p>';
    $kuchyneHtml .= '</div>';
    $kuchyneHtml .= sipky('jídlo');
    $kuchyneHtml .= '</div>';

    $kuchyneHtml .= '<ul class="rada" data-rada>';
    foreach ($seznamKuchyne as $p) {
        if (!is_array($p)) {
            continue;
        }
        $nazev = trim((string) ($p['nazev'] ?? ''));
        if ($nazev === '') {
            continue;
        }
        $popis = trim((string) ($p['popis'] ?? ''));
        $cena  = $p['cena'] ?? null;

        $kuchyneHtml .= '<li class="rada__i">';
        $kuchyneHtml .= '<div class="rada__foto">'
                      . obrazek((string) ($p['obrazek'] ?? ''), 'kuchyne', $nazev, '4x3', false, true)
                      . '</div>';
        $kuchyneHtml .= '<div class="rada__text">';
        $kuchyneHtml .= '<h3 class="rada__n">' . h($nazev) . '</h3>';
        if ($popis !== '') {
            $kuchyneHtml .= '<p class="rada__d">' . h($popis) . '</p>';
        }
        if (is_numeric($cena)) {
            $kuchyneHtml .= '<p class="rada__p">' . h((string) (int) $cena) . ' <span>Kč</span></p>';
        }
        $kuchyneHtml .= '</div>';
        $kuchyneHtml .= '</li>';
    }
    $kuchyneHtml .= '</ul>';

    if (trim((string) ($kuchyne['poznamka'] ?? '')) !== '') {
        $kuchyneHtml .= '<p class="fine">' . h((string) $kuchyne['poznamka']) . '</p>';
    }
}

/* ---------- Sociální sítě ---------- */

$siteHtml = '';
if ($chyba === null && $site !== []) {
    $post = is_array($site['posledni_prispevek'] ?? null) ? $site['posledni_prispevek'] : [];
    $ucet = trim((string) ($site['ucet'] ?? ''));
    $ig   = bezpecnyOdkaz((string) ($site['odkaz_instagram'] ?? ''), 'instagram.com');
    $fb   = bezpecnyOdkaz((string) ($site['odkaz_facebook'] ?? ''), 'facebook.com');

    $siteHtml .= '<div class="site">';
    $siteHtml .= '<div class="site__text">';
    $siteHtml .= '<h2 class="h2">' . h((string) ($site['nadpis'] ?? 'Sledujte nás')) . '</h2>';
    $siteHtml .= '<p class="sec__lead">' . h((string) ($site['text'] ?? '')) . '</p>';
    $siteHtml .= '<div class="site__btn">';
    $siteHtml .= '<a class="btn btn--fill" href="' . h($ig) . '" target="_blank" rel="noopener">Instagram'
               . ($ucet !== '' ? ' <span>@' . h($ucet) . '</span>' : '') . '</a>';
    $siteHtml .= '<a class="btn btn--quiet" href="' . h($fb) . '" target="_blank" rel="noopener">Facebook</a>';
    $siteHtml .= '</div>';
    $siteHtml .= '</div>';

    if ($post !== []) {
        $odkaz   = bezpecnyOdkaz((string) ($post['odkaz'] ?? ''), 'instagram.com');
        $datum   = trim((string) ($post['datum'] ?? ''));
        $citelne = '';

        if ($datum !== '') {
            $d = date_create($datum);
            if ($d !== false) {
                $mesice = [1 => 'ledna', 'února', 'března', 'dubna', 'května', 'června',
                           'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'];
                $citelne = (int) $d->format('j') . '. ' . ($mesice[(int) $d->format('n')] ?? '') . ' ' . $d->format('Y');
            }
        }

        $siteHtml .= '<a class="post" href="' . h($odkaz) . '" target="_blank" rel="noopener">';
        $siteHtml .= '<span class="post__foto">'
                   . obrazek((string) ($post['obrazek'] ?? ''), '', 'Poslední příspěvek na Instagramu', '1x1')
                   . '</span>';
        $siteHtml .= '<span class="post__telo">';
        $siteHtml .= '<span class="post__hlava">Poslední příspěvek'
                   . ($citelne !== '' ? ' <time datetime="' . h($datum) . '">' . h($citelne) . '</time>' : '')
                   . '</span>';
        $siteHtml .= '<span class="post__t">' . h((string) ($post['popisek'] ?? '')) . '</span>';
        $siteHtml .= '<span class="post__cta">Otevřít na Instagramu'
                   . '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12L12 4"/><path d="M6 4h6v6"/></svg>'
                   . '</span>';
        $siteHtml .= '</span>';
        $siteHtml .= '</a>';
    }

    $siteHtml .= '</div>';
}

/* ---------- Strukturovaná data ---------- */

$polozkyMenu = [];
foreach ([$seznamKoktejlu, $seznamKuchyne] as $skupina) {
    foreach ($skupina as $m) {
        if (!is_array($m) || trim((string) ($m['nazev'] ?? '')) === '') {
            continue;
        }
        $polozka = [
            '@type'       => 'MenuItem',
            'name'        => (string) $m['nazev'],
            'description' => (string) ($m['popis'] ?? ''),
        ];
        if (is_numeric($m['cena'] ?? null)) {
            $polozka['offers'] = [
                '@type'         => 'Offer',
                'price'         => (string) (int) $m['cena'],
                'priceCurrency' => 'CZK',
            ];
        }
        $polozkyMenu[] = $polozka;
    }
}

$schema = [
    '@context'      => 'https://schema.org',
    '@type'         => 'CafeOrCoffeeShop',
    'name'          => 'Kavárna Na Kopci',
    'description'   => 'Milkshaky z pravé zmrzliny, výběrová káva a domácí snídaně v Třebíči.',
    'url'           => 'https://www.kavarnanakopci.cz/',
    'telephone'     => '+420 777 123 456',
    'email'         => 'ahoj@kavarnanakopci.cz',
    'priceRange'    => '$$',
    'servesCuisine' => 'Káva, milkshaky, snídaně',
    'address'       => [
        '@type'           => 'PostalAddress',
        'streetAddress'   => 'Na Kopci 12',
        'addressLocality' => 'Třebíč',
        'postalCode'      => '674 01',
        'addressCountry'  => 'CZ',
    ],
    'geo' => ['@type' => 'GeoCoordinates', 'latitude' => 49.2149, 'longitude' => 15.8814],
    'openingHoursSpecification' => [
        [
            '@type'     => 'OpeningHoursSpecification',
            'dayOfWeek' => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            'opens'     => '07:30',
            'closes'    => '18:00',
        ],
        [
            '@type'     => 'OpeningHoursSpecification',
            'dayOfWeek' => 'Sunday',
            'opens'     => '09:00',
            'closes'    => '16:00',
        ],
    ],
    'sameAs' => [
        'https://www.instagram.com/kavarnanakopci',
        'https://www.facebook.com/kavarnanakopci',
    ],
];

if ($polozkyMenu !== []) {
    $schema['hasMenu'] = [
        '@type'          => 'Menu',
        'hasMenuSection' => [[
            '@type'       => 'MenuSection',
            'name'        => 'Nabídka',
            'hasMenuItem' => $polozkyMenu,
        ]],
    ];
}

$schemaJson = json_encode($schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
if ($schemaJson === false) {
    $schemaJson = '{}';
}
$schemaJson = str_replace('<', '<', $schemaJson);

/* ---------- Hlavičky ---------- */

$nonce = base64_encode(random_bytes(16));

header('Content-Type: text/html; charset=UTF-8');
header(
    "Content-Security-Policy: default-src 'self'; "
    . "script-src 'self' 'nonce-" . $nonce . "'; "
    . "style-src 'self'; "
    . "img-src 'self' data:; "
    . "font-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self'; "
    . "frame-ancestors 'self'; object-src 'none'"
);
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');

/* ---------- Složení stránky ---------- */

$sablona = @file_get_contents(SOUBOR_SABLONY);

if ($sablona === false) {
    http_response_code(500);
    echo '<!doctype html><html lang="cs"><meta charset="utf-8">'
       . '<title>Kavárna Na Kopci</title>'
       . '<p>Web je chvíli mimo provoz. Zavolejte nám na +420 777 123 456.</p>';
    exit;
}

echo strtr($sablona, [
    '{{FOTO_UVOD}}'          => obrazek((string) ($fotky['uvod'] ?? ''), '', 'Interiér kavárny Na Kopci', '1x1', true, true),
    '{{FOTO_PROSTOR}}'       => obrazek((string) ($fotky['prostor'] ?? ''), '', 'Terasa kavárny s výhledem na Třebíč', '16x9', false, true),
    '{{O_NAS}}'              => $oNasHtml,
    '{{MILKSHAKY}}'           => $koktejlyHtml,
    '{{KAVA}}'               => $kavaHtml,
    '{{KUCHYNE}}'            => $kuchyneHtml,
    '{{SITE}}'               => $siteHtml,
    '{{STAV}}'               => $stavHtml,
    '{{HLASKA}}'             => $hlaskaHtml,
    '{{HODINY_POZN}}'        => h($hodinyPozn),
    '{{ROK}}'                => date('Y'),
    '{{SCHEMA}}'             => $schemaJson,
    '{{NONCE}}'              => h($nonce),
]);
