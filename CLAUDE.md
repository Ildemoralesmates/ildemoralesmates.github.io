# Convencions del lloc

- Cada pàgina HTML nova ha de portar, just abans de `</head>`, el comptador de visites:
  `<script data-goatcounter="https://ildemoralesmates.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>`
- Afegir cada recurs nou a `index.html` (targeta) i a `sitemap.xml`.
- **Últimes pàgines afegides:** la portada mostra les 8 pàgines amb la data més recent de `novetats.json` (un bloc que el llig amb `fetch`; sense el fitxer no apareix). Cada vegada que s'afegeix un recurs nou **o es retoca** un d'existent, cal actualitzar-lo: `python3 tools/novetats.py <slug>` (retocat: data = avui i puja al capdamunt) o `python3 tools/novetats.py <slug> --t "Títol" --d "Descripció breu" --cat <id>` (nou). La data és la del dia en què es fa el canvi, no la de modificació del fitxer. La descripció és d'una frase (~100 caràcters). Només compta un canvi de contingut: no s'actualitza per canvis massius de manteniment (llicència, comptador, estils comuns). `python3 tools/novetats.py --check` avisa de recursos de la portada que falten al JSON.
- Cada entrada de `RES` a `index.html` du metadades per als filtres de la portada, just després de `href`:
  - `niv`: llista de nivells entre `Primària`, `1r ESO`, `2n ESO`, `3r ESO`, `4t ESO`, `Batxillerat`. Si s'omet o és `[]`, el recurs és general i apareix en tots els nivells d'ESO i Batxillerat (no en Primària).
  - `bloc`: només per als recursos de mates, un dels blocs del currículum: `Numèric`, `Algebraic`, `Funcions`, `Espacial i geometria`.
  - `tipus`: llista entre `Simulador`, `Full de treball`, `Línia del temps`, `Joc`, `Aventura`.
  - El buscador de la portada indexa `t`, `d`, `tag`, `sub`, nom de categoria, `niv`, `bloc` i `tipus` (sense accents ni majúscules): convé que el text de la targeta continga els mots que un company buscaria.
  - Si cal un valor nou, afegir-lo també a les constants `NIVELLS`, `BLOCS` o `TIPUS` del script de la portada; si no, el filtre no el mostrarà.
  - `ic`: nom de la icona de la targeta, una clau de l'objecte `IC` del script de la portada (icones de línia, `viewBox` 24, trac 2). Cada recurs en du una de pròpia; si falta, la targeta mostra el `glyph`. Per a una icona nova, afegir-ne el contingut SVG a `IC`.
- La portada té una pestanya per matèria (`CATS`), cadascuna amb el seu color (`--c-<id>`, `--t-<id>`, també en mode fosc) i la seua icona: Matemàtiques, Física, Química, Biologia, Geologia, Geografia (`id: 'geo'`), Cultura (`id: 'curio'`) i Contes (`id: 'misc'`; aventures per a xiquets). Els ids no es canvien per no trencar enllaços (`#cat=misc`). Una matèria nova necessita color, icona i entrada a `CATS`.
- Els subtítols (`sub`) només es mostren quan agrupen més d'una targeta dins de la matèria.

# Versions en castellà (`es/`)

- L'original valencià (`<recurs>/index.html`) és l'única font. **No s'edita mai `es/` a mà.**
- Les traduccions estan en `i18n/es/<recurs>.json` com a parells `[text valencià exacte, text castellà]`.
- Després de canviar un original o una traducció: `python3 tools/genera_es.py` (regenera `es/` i el sitemap; avisa de textos no trobats o de restes de valencià).
- Per a traduir un recurs nou: a l'original, afegir els `<link rel="alternate" hreflang>` (ca, es, x-default), embolicar l'enllaç `.back` en `<nav class="navtop">` amb `<a class="lang" href="../es/<recurs>/" hreflang="es" lang="es">Castellano</a>` i els estils `.navtop`/`.lang` (vegeu `thales/`), crear el JSON i executar l'script.

# Simuladors bilingües (Punnett, models atòmics, lleis dels gasos, selecció natural)

- Estan en `genetica-punnett/`, `models-atomics/`, `lleis-gasos/`, `seleccio-natural/` i en `es/<mateix nom>/`. **No s'editen a mà**: són generats.
- La font és `tools/simuladors/src/` (`*.src.html` + `common.css`/`common.js`); cada simulador du un diccionari `I18N` amb `ca` i `es`.
- Després de canviar una font: `python3 tools/simuladors/genera.py` (cal Playwright). Escriu les dues versions amb el text també en l'HTML estàtic, `canonical` i `hreflang`.
- El sitemap d'aquestes 8 URLs es manté a mà (ja hi són). `tools/genera_es.py` no els toca.

# Regla general per a TOTS els recursos interactius nous (simuladors i animacions)

- Sempre bilingües: valencià (`/<slug>/`) i castellà (`/es/<slug>/`), amb **URL pròpia per idioma**, text escrit també en l'HTML estàtic (no només omplit per JS), `canonical`, `hreflang` ca/es/x-default i les dues URLs al `sitemap.xml`. Un selector que només canvia el text dins la pàgina no posiciona en Google.
- El text es redacta **una sola vegada** per idioma, dins un diccionari `I18N = {ca:{…}, es:{…}}` de la font; no es dupliquen parells en JSON a banda.
- Les fonts viuen a `tools/simuladors/src/` i les pàgines es generen amb `python3 tools/simuladors/genera.py` (afegir el nou recurs al `MAP` de `genera.py`). Mai s'editen les pàgines generades a mà.
- Per a cada recurs nou: targeta a `index.html`, les dues URLs al `sitemap.xml`, comptador GoatCounter, enllaç de tornada a la portada i verificar amb Playwright (sense errors de JS, text estàtic = text renderitzat, mode fosc i mòbil de 390 px).
- **Maquetació:** el dibuix (canvas) a l'esquerra i els números, missatges i càlculs en un panell a la dreta, perquè es vegen alhora sense fer scroll en un portàtil de 1366 × 768 o a la pissarra digital. Patró de referència: `.simgrid` / `.side` de `tools/simuladors/src/rectangles.src.html` (columnes `minmax(0,1.45fr) minmax(15rem,1fr)`; per davall de 820 px el panell passa baix del dibuix).
- Les pàgines estàtiques sense JS poden seguir el flux antic de `tools/genera_es.py` (JSON de parells).

# Animacions amb passos i predicció (meiosi, osmosi-difusio, fotosintesi-respiracio)

- Fonts a `tools/simuladors/src/` (`meiosi.src.html`, `osmosi.src.html`, `fotosintesi.src.html`) amb el motor de passos compartit `steps.js`/`steps.css` (es crida des de `build.py` amb `/*@STEPS_JS@*/` i `/*@STEPS_CSS@*/`). Cada pas té text, pregunta de predicció (`<id>.q/.o0../.why`) i pregunta per a pensar (`<id>.tq/.th`) dins el diccionari `I18N`. Es generen amb `python3 tools/simuladors/genera.py`; no s'editen les pàgines generades.
- Les targetes i les 6 URLs del sitemap es mantenen a mà (ja hi són).

# Química interactiva (estats-materia, ajust-reaccions, dissolucions, mescles-separacio)

- Pàgines generades (va + es) amb `python3 tools/quimica/publica.py`; font a `tools/quimica/` (`sims/<slug>/strings.json` amb `va`/`es`, `body.html`, `sim.js`, `sim.css`). **No s'editen a mà.** Comptador GoatCounter i `base_url` ja configurats a `tools/quimica/config.json`.
- Les targetes i les 8 URLs del sitemap es mantenen a mà (ja hi són); `tools/genera_es.py` no els toca.

# Secció «Raona-ho» (activitats de raonament dins l'animació)

- Motor compartit: `tools/simuladors/src/raona.js` + `raona.css` (es criden des de `build.py` amb `/*@RAONA_JS@*/`, `/*@RAONA_CSS@*/` i `<!--@RAONA@-->`; el marcat va després de la targeta del simulador). Ja el fan servir engranatges, zoom, potències, arrel, rebaixes i  i tir parabòlic (`tir.src.html`), lleis de Kepler (`kepler.src.html`) i muntanya russa (`muntanya.src.html`, amb el seu motor de física i preguntes de la vagoneta) (`rectangles.src.html` du la mateixa idea escrita a mà).
- Cada animació només aporta contingut: `RZ.init({F, sim, M, S, E, D})` abans de `const QDATA` i les cadenes al seu `I18N` (ca i es). Quatre pestanyes: **M** missions inverses (`chk(v)` torna `null` o `{k,p}`), **S** sempre/de vegades/mai (`ans` `S|D|M`; si és `D` demana contraexemple amb `f`+`cx`), **E** qui té raó (`who` 0/1/2/3 i la raó correcta sempre és `w0`; ordre barrejat en pantalla), **D** decideix (camps `f`, opcions `chips`).
- Claus per tasca `<id>`: `.q`, `.more`, `.h`/`.e` (S), `.ctx .n0 .n1 .s0 .s1 .w0 .w1 .w2 .frame .model` (E), `.l0..` (camps de D). Els textos comuns (títols, «Missió», «Mostra-ho al simulador»…) els posa el motor; no es repeteixen.
- Cada tasca amb botó «Mostra-ho al simulador» ha de carregar el cas al dibuix (`sim`). Regles de contingut: respostes úniques o rangs comprovables per codi, errors típics reals d'1r ESO, una pregunta `.more` que obligue a generalitzar. Es prova amb Playwright: cada tasca bé i mal, ca i es, sense claus sense traduir.

# Tecnologia (pestanya `tecno`, 8 animacions `tec-*`)

- Fonts a `tools/simuladors/src/tec-*.src.html` (engr, mec, pal, circ, sim, res, rob, vist) amb ajudes compartides `tec.js` (`TEC.cv`, `TEC.loop`, `TEC.seg`, `TEC.gear`…) i `tec.css` (`.simgrid`, `.side`, `.kv`…), cridades des de `build.py` amb `/*@TEC_JS@*/` i `/*@TEC_CSS@*/`. Es generen amb `python3 tools/simuladors/genera.py`; no s'editen les pàgines generades.
- **Totes porten «Raona-ho»** (regla general: cada animació nova, siga de la matèria que siga). La funció `ld(...)` de cada font carrega un cas al simulador des de les tasques; es prova amb Playwright (cada tasca bé i mal, ca i es, sense claus sense traduir).
- Les targetes (matèria `tecno`) i les 16 URLs del sitemap es mantenen a mà (ja hi són).


# Puzle del mapa d'Espanya (`puzle-mapa-espanya`, matèria `geo`)

- Font: `tools/simuladors/src/mapa.src.html` (amb «Raona-ho»); es genera amb `python3 tools/simuladors/genera.py` com els altres simuladors.
- La geometria és `tools/simuladors/src/mapa.geo.js`, generada (no s'edita a mà) per `python3 tools/simuladors/geo/mapa_espanya.py <ne_10m_admin_1_states_provinces.geojson>` a partir de Natural Earth (domini públic). `build.py` l'insereix amb `/*@INC:mapa.geo.js@*/` (qualsevol font pot incloure un fitxer de `src/` així).
- La targeta i les 2 URLs del sitemap es mantenen a mà (ja hi són).

# Portada en castellà (`es/index.html`)

- `es/index.html` és generat: **no s'edita a mà**. Es crea amb `python3 tools/genera_portada_es.py` a partir de `index.html` (estructura, filtres i codi) i `i18n/portada-es.json` (matèries `cats`, subtítols `subs` i, per recurs, `t`, `d`, `tag` i `nv`). `--check` només comprova si cal regenerar.
- Només hi apareixen els recursos que tenen `es/<recurs>/`; Cultura i Contes no tenen pestanya fins que hi haja un recurs en castellà. Un recurs castellà nou **sense** entrada al JSON no apareix i l'script ho avisa.
- Cada vegada que es canvie `index.html` (targetes, filtres, text) o s'afegisca/traduïsca un recurs: actualitzar `i18n/portada-es.json` si cal i executar l'script. També actualitza el sitemap (portada ca + es amb `hreflang`).
- `nv` és la frase curta del bloc «Últimes pàgines» en castellà; si es canvia la descripció a `novetats.json`, convé revisar-la.
