#!/usr/bin/env python3
"""Genera la portada en castellà (es/index.html) a partir de index.html (valencià).

  python3 tools/genera_portada_es.py          # escriu es/index.html i actualitza el sitemap
  python3 tools/genera_portada_es.py --check  # només comprova (eixida ≠ 0 si cal regenerar)

- L'original valencià (index.html) és l'única font de l'estructura, els filtres i el codi.
- Els textos castellans estan a i18n/portada-es.json: matèries (`cats`), subtítols (`subs`) i,
  per a cada recurs (clau = href), `t`, `d`, `tag` i `nv` (frase curta per al bloc de novetats).
- Només apareixen els recursos que tenen versió castellana (carpeta es/<slug>/) o una entrada amb "url" al JSON (pàgines bilingües en una sola URL, com ultima-senyal: s'obrin amb ?lang=es). Les matèries
  sense cap recurs castellà (Cultura, Contes) no tenen pestanya.
- Si un recurs té es/<slug>/ però no entrada al JSON, s'avisa i no apareix (cal traduir-lo).
- Les targetes i el bloc «Últimes pàgines» enllacen a /es/<slug>/.
"""
import json
import re
import sys
from datetime import date
from pathlib import Path

ARREL = Path(__file__).resolve().parent.parent
BASE = "https://ildemoralesmates.github.io"
CHECK = "--check" in sys.argv

src = (ARREL / "index.html").read_text(encoding="utf-8")
T = json.loads((ARREL / "i18n" / "portada-es.json").read_text(encoding="utf-8"))
avisos = []

NIV = {"Primària": "Primaria", "1r ESO": "1.º ESO", "2n ESO": "2.º ESO", "3r ESO": "3.º ESO",
       "4t ESO": "4.º ESO", "Batxillerat": "Bachillerato"}
BLOC = {"Numèric": "Numérico", "Algebraic": "Algebraico", "Funcions": "Funciones",
        "Espacial i geometria": "Espacial y geometría"}
TIPUS = {"Simulador": "Simulador", "Full de treball": "Hoja de trabajo", "Línia del temps": "Línea del tiempo",
         "Joc": "Juego", "Aventura": "Aventura"}
MESOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic"]


def js(s):
    return s.replace("\\", "\\\\").replace("'", "\\'")


def unjs(s):
    return re.sub(r"\\(.)", r"\1", s)


def un(a, b):
    """Substitueix exactament una vegada (si no, avisa)."""
    global out
    n = out.count(a)
    if n != 1:
        avisos.append(f"  ⚠ {n} coincidències (calia 1) per a: {a[:70]!r}")
        if n == 0:
            return
    out = out.replace(a, b)


def tot(s_old, s_new, vegades):
    global out
    n = out.count(s_old)
    if n != vegades:
        avisos.append(f"  ⚠ {n} coincidències (calia {vegades}) per a: {s_old[:70]!r}")
    out = out.replace(s_old, s_new)


def camp(linia, nom, nou):
    pat = re.compile(r"(?<=[ {,])" + nom + r": '((?:[^'\\]|\\.)*)'")
    if not pat.search(linia):
        return linia
    return pat.sub(lambda m: f"{nom}: '{js(nou)}'", linia, count=1)


def llista(linia, nom, mapa):
    pat = re.compile(nom + r": \[([^\]]*)\]")
    m = pat.search(linia)
    if not m:
        return linia
    vals = [unjs(v) for v in re.findall(r"'((?:[^'\\]|\\.)*)'", m.group(1))]
    for v in vals:
        if v not in mapa:
            avisos.append(f"  ⚠ valor sense traducció a {nom}: {v!r}")
    nou = ", ".join("'" + js(mapa.get(v, v)) + "'" for v in vals)
    return linia[:m.start()] + f"{nom}: [{nou}]" + linia[m.end():]


# ---------- RES ----------
a = src.index("const RES = [\n") + len("const RES = [\n")
b = src.index("\n];", a)
linies_res = []
cats_usades, esx = set(), {}
for l in src[a:b].split("\n"):
    if not l.strip().startswith("{ cat:"):
        continue  # comentaris i línies buides
    href = re.search(r"href: '([^']+)'", l).group(1)
    e = T["res"].get(href)
    if not (ARREL / "es" / href.rstrip("/") / "index.html").exists() and not (e and e.get("url")):
        continue  # sense versió castellana (ni pàgina bilingüe amb "url"): no apareix
    if not e:
        avisos.append(f"  ⚠ {href} té versió castellana però no entrada a i18n/portada-es.json (no apareix)")
        continue
    cat = re.search(r"cat: '([^']+)'", l).group(1)
    cats_usades.add(cat)
    sub = re.search(r"(?<=[ {,])sub: '((?:[^'\\]|\\.)*)'", l)
    if sub:
        s_ca = unjs(sub.group(1))
        if s_ca not in T["subs"]:
            avisos.append(f"  ⚠ subtítol sense traducció: {s_ca!r}")
        l = camp(l, "sub", T["subs"].get(s_ca, s_ca))
    l = camp(l, "t", e["t"])
    l = camp(l, "d", e["d"])
    l = camp(l, "tag", e["tag"])
    if e.get("url"):  # pàgina bilingüe en una sola URL: s'obri ja en castellà
        l = l.replace("{ cat:", "{ u: '" + js(e["url"]) + "', cat:", 1)
    l = llista(l, "niv", NIV)
    l = llista(l, "tipus", TIPUS)
    bl = re.search(r"bloc: '([^']+)'", l)
    if bl:
        l = camp(l, "bloc", BLOC.get(bl.group(1), bl.group(1)))
    linies_res.append(l)
    esx[href] = {"t": e["t"], "s": e["nv"]}
    if e.get("url"):
        esx[href]["u"] = e["url"]
res_js = "\n".join(linies_res)

# ---------- CATS ----------
a2 = src.index("const CATS = [\n") + len("const CATS = [\n")
b2 = src.index("\n];", a2)
linies_cats = []
for l in src[a2:b2].split("\n"):
    m = re.search(r"id: '([^']+)'", l)
    if not m or m.group(1) not in cats_usades:
        continue
    c = T["cats"][m.group(1)]
    l = camp(l, "n", c["n"])
    l = camp(l, "d", c["d"])
    linies_cats.append(l)
cats_js = "\n".join(linies_cats)

# ---------- Plantilla ----------
out = src[:a] + res_js + src[b:]
a2 = out.index("const CATS = [\n") + len("const CATS = [\n")
b2 = out.index("\n];", a2)
out = out[:a2] + cats_js + out[b2:]

# Comentaris CSS i de línia completa de JS (en valencià): fora
out = re.sub(r"/\*.*?\*/", "", out, flags=re.S)
out = re.sub(r"(?m)^[ \t]*//.*\n", "", out)

TIT_CA = "Aprendre jugant · Mates, ciències i cultura"
TIT_ES = "Aprender jugando · Matemáticas, ciencias y cultura"
DESC_CA = "Activitats interactives de mates, ciències i cultura per a l&#x27;alumnat: simulacions, línies del temps, jocs i fulls de treball."
DESC_ES = "Actividades interactivas de matemáticas, ciencias y cultura para el alumnado: simulaciones, juegos y actividades para razonar."

# --- <head> ---
un('<html lang="ca">', '<html lang="es">')
tot(TIT_CA, TIT_ES, 2)  # <title> i og:title
tot(DESC_CA, DESC_ES, 2)  # description i og:description
un(f'<link rel="canonical" href="{BASE}/">', f'<link rel="canonical" href="{BASE}/es/">')
un(f'<meta property="og:url" content="{BASE}/">', f'<meta property="og:url" content="{BASE}/es/">')
un('<meta property="og:locale" content="ca_ES">', '<meta property="og:locale" content="es_ES">')
un('<meta property="og:site_name" content="Aprendre jugant">', '<meta property="og:site_name" content="Aprender jugando">')
un("deed.ca", "deed.es") if out.count("deed.ca") == 1 else tot("deed.ca", "deed.es", out.count("deed.ca"))

# --- cos ---
un('<nav class="langnav" aria-label="Idioma"><a href="es/" hreflang="es" lang="es">Castellano</a></nav>',
   '<nav class="langnav" aria-label="Idioma"><a href="/" hreflang="ca" lang="ca-valencia">Valencià</a></nav>')
un("Ilde Morales · Mates, ciències i cultura", "Ilde Morales · Matemáticas, ciencias y cultura")
un("<h1>Aprendre <em>jugant</em></h1>", "<h1>Aprender <em>jugando</em></h1>")
un("Activitats interactives per a l'alumnat. Tria una matèria o entra directament en un recurs: cada pàgina funciona sola, al mòbil i a l'ordinador.",
   "Actividades interactivas para el alumnado. Elige una materia o entra directamente en un recurso: cada página funciona sola, en el móvil y en el ordenador.")
un('placeholder="Busca: Pitàgores, gasos, Kepler…" aria-label="Busca un recurs"',
   'placeholder="Busca: Pitágoras, gases, Kepler…" aria-label="Busca un recurso"')
un('aria-label="Esborra la cerca"', 'aria-label="Borrar búsqueda"')
un('role="tablist" aria-label="Matèries"', 'role="tablist" aria-label="Materias"')
out = re.sub(
    r"<footer>.*?</footer>",
    '<footer>\n'
    '    <p>Material propio de © Ilde Morales, publicado con licencia <a rel="license" href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.es">Creative Commons BY-NC-SA 4.0</a>: puedes usarlo y adaptarlo citando la autoría, sin uso comercial y compartiéndolo con la misma licencia. Las imágenes y materiales de terceros conservan su propia licencia.</p>\n'
    '    <p>Hay más recursos, algunos solo en valenciano, en la <a href="/" hreflang="ca" lang="ca-valencia">versión en valenciano</a>.</p>\n'
    '  </footer>',
    out, count=1, flags=re.S)

# --- script ---
un("const NIVELLS = ['Primària', '1r ESO', '2n ESO', '3r ESO', '4t ESO', 'Batxillerat'];",
   "const NIVELLS = " + json.dumps(list(NIV.values()), ensure_ascii=False).replace('"', "'") + ";")
un("const BLOCS = ['Numèric', 'Algebraic', 'Funcions', 'Espacial i geometria'];",
   "const BLOCS = " + json.dumps(list(BLOC.values()), ensure_ascii=False).replace('"', "'") + ";")
un("const TIPUS = ['Simulador', 'Full de treball', 'Línia del temps', 'Joc', 'Aventura'];",
   "const TIPUS = " + json.dumps(list(TIPUS.values()), ensure_ascii=False).replace('"', "'") + ";")
un("label: 'Nivell',", "label: 'Nivel',")
un("label: 'Bloc de mates',", "label: 'Bloque de mates',")
un("label: 'Tipus de recurs',", "label: 'Tipo de recurso',")
un("v !== 'Primària'", "v !== 'Primaria'")
un('href="${BASE}${r.href}"', 'href="${r.u || BASE + \'es/\' + r.href}"')
un('href="${BASE}${esc(x.href)}"', 'href="${ESX[x.href].u || BASE + \'es/\' + esc(x.href)}"')
un("Obri →", "Abrir →")
un("Cap recurs amb esta combinació de filtres. Prova de llevar-ne algun.",
   "Ningún recurso con esta combinación de filtros. Prueba a quitar alguno.")
tot("Resultats de la cerca", "Resultados de la búsqueda", 2)
un("${n === 1 ? 'resultat' : 'resultats'} a totes les matèries", "${n === 1 ? 'resultado' : 'resultados'} en todas las materias")
un("`Mostrant ${n} de ${total}`", "`Mostrando ${n} de ${total}`")
un("${g.length === 1 ? 'recurs' : 'recursos'}", "${g.length === 1 ? 'recurso' : 'recursos'}")
un("Aviat hi haurà recursos ací.", "Pronto habrá recursos aquí.")
un("Neteja els filtres", "Quitar filtros")
un('<span class="mtxt">Més filtres</span>', '<span class="mtxt">Más filtros</span>')
un("${svg('spark')}Últimes pàgines afegides</h2>", "${svg('spark')}Últimas páginas añadidas</h2>")
un("${nvOpen ? 'Mostra\\'n menys' : `Mostra'n ${items.length - 4} més`}", "${nvOpen ? 'Mostrar menos' : `Mostrar ${items.length - 4} más`}")
un("${nova ? 'Nova' : 'Retocada'}", "${nova ? 'Nueva' : 'Retocada'}")
un("const MESOS = ['gen', 'febr', 'març', 'abr', 'maig', 'juny', 'jul', 'ag', 'set', 'oct', 'nov', 'des'];",
   "const MESOS = " + json.dumps(MESOS, ensure_ascii=False).replace('"', "'") + ";")
# Bloc de novetats: títol i frase en castellà (només recursos amb versió castellana)
un('<span class="nt">${esc(x.t)}</span>', '<span class="nt">${esc(ESX[x.href].t)}</span>')
un("${esc(x.d || '')}", "${esc(ESX[x.href].s)}")
un("x && x.href && x.t && cat[x.cat] && ISO.test(x.data || '')", "x && x.href && x.t && ESX[x.href] && cat[x.cat] && ISO.test(x.data || '')")
un("const NV_N = 8;", "const ESX = " + json.dumps(esx, ensure_ascii=False) + ";\nconst NV_N = 8;")

# Marca de fitxer generat
un("<!doctype html>", "<!doctype html>\n<!-- Generat per tools/genera_portada_es.py a partir de index.html i i18n/portada-es.json. No s'edita a mà. -->")

# ---------- Eixida ----------
dest = ARREL / "es" / "index.html"
vell = dest.read_text(encoding="utf-8") if dest.exists() else None
canvi = vell != out
if avisos:
    print("\n".join(avisos))
print(f"{len(linies_res)} recursos · {len(linies_cats)} matèries · es/index.html {'canvia' if canvi else 'sense canvis'}")
if CHECK:
    sys.exit(1 if canvi or avisos else 0)
if canvi:
    dest.parent.mkdir(exist_ok=True)
    dest.write_text(out, encoding="utf-8")

# ---------- Sitemap: portada ca + es amb alternatives ----------
sm_p = ARREL / "sitemap.xml"
sm = sm_p.read_text(encoding="utf-8")
if "xmlns:xhtml" not in sm:
    sm = sm.replace('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
                    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">')
alt = (f'<xhtml:link rel="alternate" hreflang="ca" href="{BASE}/"/>'
       f'<xhtml:link rel="alternate" hreflang="es" href="{BASE}/es/"/>'
       f'<xhtml:link rel="alternate" hreflang="x-default" href="{BASE}/"/>')
m = re.search(rf"  <url><loc>{re.escape(BASE)}/</loc><lastmod>([^<]*)</lastmod>.*?</url>\n(  <url><loc>{re.escape(BASE)}/es/</loc>.*?</url>\n)?", sm)
if not m:
    print("⚠ No trobe l'entrada de la portada al sitemap; no el toque.")
else:
    lastmod = date.today().isoformat() if (canvi or not m.group(2)) else m.group(1)
    nou = (f"  <url><loc>{BASE}/</loc><lastmod>{lastmod}</lastmod>{alt}</url>\n"
           f"  <url><loc>{BASE}/es/</loc><lastmod>{lastmod}</lastmod>{alt}</url>\n")
    if m.group(0) != nou:
        sm = sm[:m.start()] + nou + sm[m.end():]
        sm_p.write_text(sm, encoding="utf-8")
        print("sitemap.xml actualitzat (portada ca + es).")
