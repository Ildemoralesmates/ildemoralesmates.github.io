#!/usr/bin/env python3
"""Genera les versions en castellà (es/<recurs>/index.html) a partir dels originals en valencià.

L'original valencià és l'única font: no s'edita mai es/ a mà.
Per a cada fitxer i18n/es/<recurs>.json:
  1. llig <recurs>/index.html
  2. aplica els parells [valencià, castellà] (tots han d'aparéixer; si no, avisa)
  3. aplica els canvis estructurals (lang, canonical, og, enllaços relatius...)
  4. escriu es/<recurs>/index.html
  5. actualitza sitemap.xml amb la URL castellana i les alternatives hreflang
  6. avisa de restes de valencià que no s'han traduït

Ús:  python3 tools/genera_es.py            (tots els recursos)
     python3 tools/genera_es.py thales     (només un)
"""
import json, re, sys
from pathlib import Path

ARREL = Path(__file__).resolve().parent.parent
BASE = "https://ildemoralesmates.github.io"

# Textos que es repeteixen a totes les pàgines
COMUNS = [
    ["Recursos de matemàtiques", "Recursos de matemáticas"],
    ["Les imatges i materials de tercers conserven la seua pròpia llicència.",
     "Las imágenes y materiales de terceros conservan su propia licencia."],
]

# Indicis de valencià sense traduir (fora de <style>)
RESTES = re.compile(r"[àèòïç]|·l|\b(els|amb|és|dels|seua|quocients?|vèrtex)\b", re.I)


def estructurals(s, slug):
    url_va, url_es = f"{BASE}/{slug}/", f"{BASE}/es/{slug}/"
    canvis = [
        ('<html lang="ca">', '<html lang="es">'),
        (f'<link rel="canonical" href="{url_va}">', f'<link rel="canonical" href="{url_es}">'),
        (f'<meta property="og:url" content="{url_va}">', f'<meta property="og:url" content="{url_es}">'),
        ('<meta property="og:locale" content="ca_ES">', '<meta property="og:locale" content="es_ES">'),
        ("creativecommons.org/licenses/by-nc-sa/4.0/deed.ca", "creativecommons.org/licenses/by-nc-sa/4.0/deed.es"),
        # selector d'idioma: ara apunta a l'original
        (f'<a class="lang" href="../es/{slug}/" hreflang="es" lang="es">Castellano</a>',
         f'<a class="lang" href="../../{slug}/" hreflang="ca" lang="ca">Valencià</a>'),
        # la pàgina està un nivell més avall
        ('<a class="back" href="../">', '<a class="back" href="../../">'),
    ]
    for a, b in canvis:
        if a not in s and not a.startswith('<a class="back"'):
            print(f"  ⚠ estructura no trobada: {a[:70]}")
        s = s.replace(a, b)
    return s


def actualitza_sitemap(slugs):
    p = ARREL / "sitemap.xml"
    s = p.read_text(encoding="utf-8")
    if "xmlns:xhtml" not in s:
        s = s.replace('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
                      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
                      'xmlns:xhtml="http://www.w3.org/1999/xhtml">')
    for slug in slugs:
        va, es = f"{BASE}/{slug}/", f"{BASE}/es/{slug}/"
        alt = (f'<xhtml:link rel="alternate" hreflang="ca" href="{va}"/>'
               f'<xhtml:link rel="alternate" hreflang="es" href="{es}"/>')
        # entrada valenciana: hi afegeix les alternatives si no les té
        m = re.search(rf'  <url><loc>{re.escape(va)}</loc>(<lastmod>[^<]*</lastmod>)?(.*?)</url>\n', s)
        if not m:
            print(f"  ⚠ {va} no és al sitemap"); continue
        lastmod = m.group(1) or ""
        nova_va = f"  <url><loc>{va}</loc>{lastmod}{alt}</url>\n"
        nova_es = f"  <url><loc>{es}</loc>{lastmod}{alt}</url>\n"
        s = s.replace(m.group(0), nova_va)
        s = re.sub(rf'  <url><loc>{re.escape(es)}</loc>.*?</url>\n', '', s)
        s = s.replace(nova_va, nova_va + nova_es)
    p.write_text(s, encoding="utf-8")


def genera(slug):
    print(f"· {slug}")
    dades = json.loads((ARREL / "i18n" / "es" / f"{slug}.json").read_text(encoding="utf-8"))
    s = (ARREL / slug / "index.html").read_text(encoding="utf-8")
    for va, es in dades["parells"] + COMUNS:
        if va not in s:
            print(f"  ⚠ no trobat (l'original ha canviat?): {va[:70]}")
        s = s.replace(va, es)
    s = estructurals(s, slug)
    visible = re.sub(r"<style>.*?</style>", "", s, flags=re.S)
    visible = re.sub(r"/\*.*?\*/", "", visible, flags=re.S)
    for n, linia in enumerate(visible.splitlines(), 1):
        if RESTES.search(linia) and 'hreflang="ca"' not in linia:
            print(f"  ? possible valencià: {linia.strip()[:90]}")
    eixida = ARREL / "es" / slug / "index.html"
    eixida.parent.mkdir(parents=True, exist_ok=True)
    eixida.write_text(s, encoding="utf-8")
    return slug


if __name__ == "__main__":
    fitxers = sorted((ARREL / "i18n" / "es").glob("*.json"))
    slugs = [f.stem for f in fitxers if len(sys.argv) < 2 or f.stem in sys.argv[1:]]
    fets = [genera(s) for s in slugs]
    actualitza_sitemap(fets)
    print(f"Fet: {len(fets)} pàgina(es) en castellà.")
