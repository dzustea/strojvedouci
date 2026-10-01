# Kavárna Na Kopci

Web pro výběrovou kavárnu v Třebíči. Celý obsah se upravuje v jednom JSON
souboru, žádná databáze a žádná administrace. Postaveno pro **webhosting
Vedos** (Apache + PHP).

---

## 1. Jak to funguje

Když někdo otevře web, `index.php` udělá tři věci:

1. načte `data/obsah.json`
2. načte `templates/page.html`
3. doplní obsah do šablony a výsledek pošle prohlížeči

Žádný build, žádná databáze, žádné přihlašování. Když chcete něco změnit,
upravíte JSON a nahrajete ho na FTP. Nic víc.

Obsah je tím pádem rovnou v HTML, takže ho vidí i Google. To je rozdíl oproti
řešením, která nabídku dokreslují až JavaScriptem.

| | velikost | po gzipu |
|---|---|---|
| `assets/styles.css` | 33 kB | 7,7 kB |
| `assets/app.js` | 12 kB | 3,8 kB |
| fonty (4 soubory woff2) | 92 kB | už komprimované |

Žádné knihovny. Žádný jQuery, žádný Tailwind z CDN, žádný externí widget.

---

## 2. Nasazení na Vedos

1. Nahrajte **obsah této složky** (ne složku samotnou) do kořene webu,
   u Vedosu obvykle `/www` nebo `/web`.
2. Nahrajte i soubor **`.htaccess`**. V FTP klientech bývá skrytý, protože
   začíná tečkou, takže zapněte zobrazení skrytých souborů.
3. **Nenahrávejte složku `.claude/`.** Je v ní jen pomocný server pro náhled
   na vlastním počítači.

```
/www
├── index.php            ← složí stránku
├── 404.html
├── .htaccess
├── robots.txt
├── sitemap.xml
├── data/
│   └── obsah.json       ← TOHLE upravujete
├── templates/
│   └── page.html        ← struktura stránky, běžně se nesahá
└── assets/
    ├── styles.css
    ├── app.js
    ├── fonts/           ← 4 soubory, nemazat
    └── img/
        ├── favicon.svg
        ├── uvod.jpg       ← fotka v záhlaví
        ├── prostor.jpg    ← fotka kavárny
        ├── o-nas.jpg      ← fotka k textu O nás
        ├── milkshaky/     ← fotky milkshaků
        └── kuchyne/       ← fotky snídaní
```

Vedos musí mít u domény zapnuté PHP 8.0 nebo novější. Bývá to výchozí
nastavení, zkontrolovat to jde v administraci hostingu.

---

## 3. Struktura stránky

1. **Úvod** se štítkem „Brzy otevíráme" a hláškou o schodech
2. **O nás** s textem a třemi čísly
3. **Milkshaky** z JSONu jako posuvný list se šipkami a počítadlem
4. **Káva** s kartou „Zrno týdne" a ceníkem
5. **Kuchyně** jako posuvný list s fotkami, které jdou rozkliknout
6. **Prostor** s fotkou přes celou šířku a tlačítkem do galerie
7. **Co je u nás nového** s odkazy na Instagram a Facebook a posledním příspěvkem
8. **Zastavte se** s otevírací dobou, adresou a kontakty

---

## 4. Úprava obsahu

Otevřete `data/obsah.json` v obyčejném textovém editoru (Poznámkový blok,
Notepad++, VS Code).

### Milkshaky a snídaně

Jedna položka vypadá takhle:

```json
{
  "nazev": "Slaný karamel",
  "popis": "Vanilková zmrzlina z Vysočiny a karamel vařený do tmava.",
  "cena": 139,
  "obrazek": "slany-karamel.jpg",
  "znacky": ["Nejprodávanější"],
  "dostupny": true
}
```

| Pole | Co dělá |
|---|---|
| `nazev` | Název na kartě. Bez něj se položka přeskočí. |
| `popis` | Text pod názvem. Klidně dvě tři věty, je na to místo. |
| `cena` | Jen číslo, bez „Kč". Když pole vynecháte, cena se nezobrazí. |
| `obrazek` | Název souboru. Viz kapitola 5. |
| `znacky` | Štítky přes fotku, například `["Novinka"]`. Prázdné: `[]` |
| `dostupny` | `false` = karta zešedne a dostane štítek „Zatím nemáme". |

U snídaní (`kuchyne`) se používají jen `nazev`, `popis`, `cena` a `obrazek`.

**Přidání:** zkopírujte celý blok od `{` do `}`, vložte ho do seznamu `polozky`
a nezapomeňte na čárku mezi bloky. Za posledním blokem čárka **není**.

**Odebrání:** smažte celý blok včetně čárky. Nebo u milkshaku nechte blok být
a dejte `"dostupny": false`.

**Pořadí:** pořadí v souboru je pořadí v listu.

### Než kavárna otevře

Web je nastavený na stav „ještě neotevřeno". Řídí to blok `stav` nahoře
v JSONu: `kratce` je štítek v záhlaví a `poznamka` je věta pod otevírací
dobou. Pole `hero_popis` a `termin` zůstávají v souboru pro případ, že
byste termín chtěli v úvodu zobrazit, teď se nepoužívají.

Pod tlačítky v úvodu je jedna věta z bloku `hlaska`. Má dvě části: `text`
se vysází normálně a `pointa` se zvýrazní barvou. Teď tam je „Třicet schodů
nahoru. Výtah neplánujeme." Klidně si ji vyměňte za vlastní, je to jediné
místo na webu, kde si kavárna dovolí vtip.

**Až otevřete**, přepněte `"otevreno": true`. Web pak místo štítku ukáže živý
stav spočítaný z reálného času („Teď otevřeno do 18:00", „Zavíráme za 20 min",
„Zavřeno, zítra od 7:30") a v otevírací době zvýrazní dnešní den.

Texty v `o_nas`, `milkshaky` a `kuchyne` jsou teď v budoucím čase
(„budeme péct", „míchat je budeme"). Ty přepište ručně na přítomný, to za vás
web neudělá.

### Zrno týdne

V bloku `kava.zrno_tydne` se mění karta v sekci o kávě. `chute` je seznam
štítků, klidně dva nebo čtyři.

### O nás

V bloku `o_nas` je nadpis, text a tři čísla (`cisla`). Čísla můžete nahradit
čímkoli, co dává smysl, třeba počtem druhů zrna.

> **Po úpravě si soubor nechte zkontrolovat.** Vložte obsah na
> <https://jsonlint.com> a klikněte na Validate. Když je někde chybějící čárka
> nebo uvozovka, web to pozná a místo nabídky ukáže slušnou hlášku s telefonem.
> Nerozbije se, ale obsah zmizí, takže je lepší to odchytit předem.

---

## 5. Přidání fotek

Fotka se nikam nenahrává přes web. Postup je vždycky stejný:

1. **Připravte soubor.** Nejlépe **WebP**, případně JPG. Šířka kolem 1200 px
   bohatě stačí, kvalita 75 až 80.
2. **Pojmenujte ho bez diakritiky a mezer.** Dobře: `slany-karamel.jpg`.
   Špatně: `Slaný karamel (1).JPG`.
3. **Nahrajte ho na FTP** do správné složky:
   - milkshaky do `assets/img/milkshaky/`
   - snídaně do `assets/img/kuchyne/`
   - úvod, prostor a o nás přímo do `assets/img/`
4. **Zapište název souboru do JSONu.** U milkshaků a snídaní do pole `obrazek`,
   u ostatních do bloku `fotky` nahoře:

```json
"fotky": {
  "uvod": "uvod.jpg",
  "prostor": "prostor.jpg",
  "o-nas": "o-nas.jpg"
}
```

**Když fotka chybí**, web se nerozbije. Na jejím místě se ukáže šrafované pole
s textem „Sem patří fotka" a cestou k souboru, který tam patří. Hned je vidět,
co doplnit. Teď je takových míst **patnáct**: úvod, o nás, prostor, šest milkshaků, pět snídaní a poslední příspěvek.

Povolené přípony jsou `jpg`, `jpeg`, `png`, `webp` a `avif`. Jiný soubor web
ignoruje a bere to, jako by fotka chyběla.

### Galerie

Všechny fotky na webu se automaticky spojí do jedné galerie. Návštěvník
klikne na kteroukoli fotku a může v ní listovat šipkami nebo klávesami vlevo
a vpravo. V sekci Prostor je navíc tlačítko **Prohlédnout fotky**, které
galerii otevře od začátku a ukazuje, kolik fotek celkem je.

Tlačítko se samo skryje, dokud nejsou nahrané žádné fotky, takže nikdy
neodkazuje do prázdna.

---

## 6. Poslední příspěvek z Instagramu

Teď to funguje tak, že příspěvek je v JSONu a vy ho při změně přepíšete:

```json
"posledni_prispevek": {
  "obrazek": "instagram-posledni.jpg",
  "popisek": "Zrno týdne je z Kirinyagy a chutná po rybízu.",
  "datum": "2026-09-29",
  "odkaz": "https://www.instagram.com/kavarnanakopci"
}
```

Je to pět minut práce, když dáváte příspěvek, a web kvůli tomu nepotřebuje
nic cizího. Pokud to chcete automaticky, jsou tři cesty zadarmo.

### A) Oficiální Instagram API (opravdu automatické, zdarma)

Pozor na starší návody na internetu: **Instagram Basic Display API skončilo
v prosinci 2024.** Nahradilo ho *Instagram API with Instagram Login*, které
je součástí Meta Graph API.

Co je potřeba:

1. Instagram účet přepnutý na **Business nebo Creator** (zdarma, v nastavení
   aplikace).
2. Aplikace v Meta for Developers a propojení s tím účtem.
3. Získat **dlouhodobý přístupový token**. Platí 60 dní a dá se obnovovat,
   takže si to musíte hlídat.
4. Malý PHP skript, který jednou za hodinu zavolá endpoint `me/media`
   s poli `caption, media_url, permalink, timestamp` a limitem 1,
   výsledek uloží do souboru a **fotku stáhne k sobě** do `assets/img/`.
   Web pak čte jen ten uložený soubor, ne Instagram.
5. Cron na Vedosu, který ten skript spouští. Když cron k dispozici není,
   skript si může hlídat stáří souboru a obnovit se sám při návštěvě,
   maximálně jednou za hodinu.

Proč stahovat fotku k sobě: adresy obrázků z Instagramu po čase expirují
a navíc by se kvůli nim musela povolit cizí doména v bezpečnostní hlavičce
(`Content-Security-Policy`), kterou web teď má zavřenou na vlastní doménu.

Nastavení zabere tak hodinu a pak se o to nemusíte starat, kromě obnovy
tokenu. Detaily v Meta dokumentaci se čas od času mění, takže si je před
nasazením projděte.

### B) Hotový widget zdarma (nejrychlejší, ale cizí kód)

Behold, SnapWidget, LightWidget, Elfsight nebo Curator mají bezplatné
tarify. Vložíte na stránku jejich skript a je to.

Nevýhody: na web se dostane cizí JavaScript, bezplatné tarify mívají limit
zobrazení a vlastní logo, načítání je pomalejší a kvůli GDPR se do zpracování
osobních údajů dostává další firma. Taky by se musela povolit jejich doména
v `Content-Security-Policy`.

### C) Oficiální vložení jednoho příspěvku

Instagram umí ke každému příspěvku dát „embed" kód. Je zdarma a je oficiální,
ale ukazuje **ten konkrétní příspěvek**, ne automaticky poslední. Takže by
se stejně musel při každém novém příspěvku vyměnit, jen místo textu v JSONu
byste měnili iframe. Oproti současnému řešení je to pomalejší a hůř to zapadá
do vzhledu webu.

### Doporučení

Nechte zatím **A) jako cíl a současné řešení jako výchozí**. Současný stav má
nula závislostí a nemůže se rozbít. Až bude Instagram přepnutý na Business
účet, doplním skript podle bodu A a vy přestanete řešit úplně.

Rozhodně bych nešel do B, pokud nemusíte. Pro pět minut práce měsíčně se
nevyplatí tahat na web cizí skript.

---

## 7. Co ještě doplnit před spuštěním

Texty jsou hotové, ale **kontaktní údaje jsou zástupné**.

| Co | Kde | Nynější hodnota |
|---|---|---|
| Adresa | `templates/page.html` (3 místa, z toho jedno v `data-kopirovat`) a `index.php` | Na Kopci 12, 674 01 Třebíč |
| Telefon | `templates/page.html`, `index.php` | +420 777 123 456 |
| E-mail | `templates/page.html`, `index.php` | ahoj@kavarnanakopci.cz |
| Doména | `templates/page.html`, `.htaccess`, `robots.txt`, `sitemap.xml` | www.kavarnanakopci.cz |
| Instagram, Facebook | `data/obsah.json` a `index.php` | @kavarnanakopci |
| GPS | `index.php` | 49.2149, 15.8814 |
| Otevírací doba | **tři místa**, viz níže | Po až So 7:30 do 18:00, Ne 9:00 do 16:00 |
| Ceny kávy | `data/obsah.json`, blok `kava.cenik` | orientační |

> **Otevírací doba je na třech místech:** strukturovaná data v `index.php`
> (kvůli Googlu), viditelná tabulka v `templates/page.html` a objekt `DOBA`
> v `assets/app.js`, odkud se počítá živý stav v záhlaví. Změňte všechna tři.

> **Adresa je i v tlačítku „Kopírovat adresu".** Hledejte `data-kopirovat`.

Chybí ještě **náhledový obrázek pro sociální sítě**: `assets/img/og.jpg`,
rozměr 1200 × 630 px. Do té doby se odkaz sdílí bez obrázku.

---

## 8. Design

**Paleta.** Světlá neutrální plocha a jedna akcentní barva. Nic jiného.

| Token | Hodnota | Použití |
|---|---|---|
| `--bg` | `#EBEBE8` | hlavní plocha |
| `--surface` | `#F7F7F5` | karty |
| `--ink` | `#17181B` | hlavní text |
| `--ink-2` | `#53555C` | popisy |
| `--ink-3` | `#5F6168` | drobné popisky |
| `--pop` | `#D21E5B` | tlačítka, štítky, značka |
| `--pop-ink` | `#A50F45` | ceny a drobný akcentní text |

Akcent je jediný a používá se všude stejně: tlačítka, ceny, štítky, čísla
v sekci O nás a aktivní prvky. Zbytek stránky je neutrální, takže červená
vždycky znamená "tohle je důležité nebo na tohle se dá kliknout".

**Web je vždycky světlý.** I když má návštěvník v telefonu zapnutý tmavý
režim, stránka se nepřebarví, drží to `color-scheme: light`.

**Typografie.** Geist na text, Geist Mono na čísla a ceny. Fonty jsou uložené
přímo na webu, netahají se z Google Fonts. Je to rychlejší a neodesílá to
IP adresy návštěvníků do USA, což bývá téma při GDPR auditu.

**Tvary.** Jeden rádius (12 px) na všem.

**Scrollování.** Posuvník je obarvený do firemní červené, nahoře běží tenký
ukazatel postupu. Fotky se při průchodu okem jemně posunou a pod nadpisem
každé sekce se nakreslí červená linka. Tyhle efekty jsou čistě v CSS přes
`animation-timeline`, takže nestojí ani jeden řádek JavaScriptu. V prohlížeči,
který je neumí, se prostě nic neděje a stránka vypadá normálně.

**Pohyb.** Obsah najíždí při scrollování, v navigaci se posouvá ukazatel
aktivní sekce, u snídaní se dá listovat šipkami, fotky se dají rozkliknout
a tečka u stavu „Otevřeno" jemně tepe. Všechno se vypne, když má návštěvník
v systému zapnuté omezení pohybu.

---

## 9. Rychlost, přístupnost, bezpečnost

**Rychlost**
- žádný framework, dohromady zhruba 11,5 kB kódu po kompresi
- fonty na vlastní doméně, s `font-display: swap` a předtahem
- obrázky mají `width` a `height`, takže stránka při načítání neposkakuje
- obrázky mimo první obrazovku se načítají až v okamžiku potřeby
- animace jen přes `transform` a `opacity`, žádné posluchače scrollu

**Přístupnost**
- kontrast textu ověřen měřením, **všech 42 kontrolovaných prvků splňuje
  WCAG AA**
- galerie je plně ovladatelná klávesnicí: Escape zavírá, šipky listují,
  po zavření se fokus vrátí na fotku, ze které se otvíralo
- odkaz „Přeskočit na obsah", viditelný focus, menu ovladatelné klávesnicí
- `prefers-reduced-motion` vypne veškerý pohyb
- pojistka: kdyby v nějakém prohlížeči nenaběhlo sledování scrollu, obsah se
  po chvíli odhalí sám, aby stránka nikdy nezůstala prázdná
- stavy navíc: chybějící fotka, nedostupný milkshake, prázdná nabídka
  i rozbitý JSON mají vlastní srozumitelné zobrazení

**Bezpečnost**
- web nepřijímá od návštěvníků žádný vstup, nemá formuláře ani přihlašování
- všechny texty z JSONu procházejí `htmlspecialchars`, takže ani překlep
  v datech nemůže do stránky propašovat kód
- název souboru s fotkou se bere jen jako název, nikdy jako cesta
  (`basename` plus kontrola přes `realpath`)
- odkazy na sociální sítě z JSONu se ověřují proti doméně, takže se tam
  nedá podstrčit cizí adresa
- `Content-Security-Policy` s nonce, dále `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy` a HSTS
- složky `data/` a `templates/` nejsou z prohlížeče přístupné
- chybové hlášky PHP jsou vypnuté, aby se ven nedostaly cesty na disku

---

## 10. Lokální náhled

Na počítači bez PHP se web zobrazí přes pomocný server v `.claude/`.
Čte stejnou šablonu i stejný JSON jako ostrá verze:

```bash
node .claude/dev-server.js
```

Pak otevřít `http://localhost:4321`. Na hosting tahle složka nepatří.
