# Convencions del lloc

- Cada pàgina HTML nova ha de portar, just abans de `</head>`, el comptador de visites:
  `<script data-goatcounter="https://ildemoralesmates.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>`
- Afegir cada recurs nou a `index.html` (targeta) i a `sitemap.xml`.
- Cada entrada de `RES` a `index.html` du metadades per als filtres de la portada, just després de `href`:
  - `niv`: llista de nivells entre `Primària`, `1r ESO`, `2n ESO`, `3r ESO`, `4t ESO`, `Batxillerat`. Si s'omet o és `[]`, el recurs és general i apareix en tots els nivells d'ESO i Batxillerat (no en Primària).
  - `bloc`: només per als recursos de mates, un dels blocs del currículum: `Numèric`, `Algebraic`, `Funcions`, `Espacial i geometria`.
  - `tipus`: llista entre `Simulador`, `Full de treball`, `Línia del temps`, `Joc`, `Aventura`.
  - El buscador de la portada indexa `t`, `d`, `tag`, `sub`, nom de categoria, `niv`, `bloc` i `tipus` (sense accents ni majúscules): convé que el text de la targeta continga els mots que un company buscaria.
  - Si cal un valor nou, afegir-lo també a les constants `NIVELLS`, `BLOCS` o `TIPUS` del script de la portada; si no, el filtre no el mostrarà.

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
- Les pàgines estàtiques sense JS poden seguir el flux antic de `tools/genera_es.py` (JSON de parells).

# Química interactiva (estats-materia, ajust-reaccions, dissolucions, mescles-separacio)

- Pàgines generades (va + es) amb `python3 tools/quimica/publica.py`; font a `tools/quimica/` (`sims/<slug>/strings.json` amb `va`/`es`, `body.html`, `sim.js`, `sim.css`). **No s'editen a mà.** Comptador GoatCounter i `base_url` ja configurats a `tools/quimica/config.json`.
- Les targetes i les 8 URLs del sitemap es mantenen a mà (ja hi són); `tools/genera_es.py` no els toca.
