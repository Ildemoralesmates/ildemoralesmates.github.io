# Convencions del lloc

- Cada pàgina HTML nova ha de portar, just abans de `</head>`, el comptador de visites:
  `<script data-goatcounter="https://ildemoralesmates.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>`
- Afegir cada recurs nou a `index.html` (targeta) i a `sitemap.xml`.

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
