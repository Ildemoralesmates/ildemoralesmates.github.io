#!/usr/bin/env python3
"""Genera hexaciencia/index.html (valencià) i es/hexaciencia/index.html (castellà) a partir de
tools/hexaciencia/hexaciencia.src.html (HTML autònom del joc, amb diccionari I18N ca/es). NO s'editen les eixides a mà.
L'idioma inicial el fixa la URL; el selector VAL/CAS canvia el text sense perdre la partida i actualitza la URL.
El text de la pantalla inicial s'escriu també en l'HTML estàtic (render amb Playwright).
Ús: python3 tools/hexaciencia/genera.py   (cal Playwright)"""
import glob, sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ARREL = Path(__file__).resolve().parent.parent.parent
BASE = "https://ildemoralesmates.github.io"
SLUG = "hexaciencia"
D = {
 "ca": {"title": "Hexaciència: Joc de preguntes de ciències per a l'aula",
        "desc": "Joc de preguntes d'ESO per a la pissarra digital: sis matèries (mates, física, química, biologia, geologia i tecnologia), 2n i 4t, 1.200 preguntes, equips i el professor d'àrbitre. Bilingüe VAL/CAS.",
        "home": "Tornar a la portada", "homeurl": "/", "locale": "ca_ES", "site": "Recursos de matemàtiques"},
 "es": {"title": "Hexaciencia: Juego de preguntas de ciencias para el aula",
        "desc": "Juego de preguntas de ESO para la pizarra digital: seis materias (mates, física, química, biología, geología y tecnología), 2.º y 4.º, 1.200 preguntas, equipos y el profesor de árbitro. Bilingüe VAL/CAS.",
        "home": "Volver a la portada", "homeurl": "/es/", "locale": "es_ES", "site": "Recursos de matemáticas"},
}

def una(s, a, b, que):
    if a not in s: sys.exit(f"  ✗ no trobat ({que}): {a[:70]}")
    return s.replace(a, b, 1)

def pagina(src, L):
    d = D[L]; url = {"ca": f"{BASE}/{SLUG}/", "es": f"{BASE}/es/{SLUG}/"}
    s = una(src, '<html lang="ca">', f'<html lang="{L}">', "html lang")
    s = una(s, "<title>Hexaciència</title>", f"<title>{d['title']}</title>", "title")
    head = f'''<meta name="description" content="{d['desc']}">
<link rel="canonical" href="{url[L]}">
<link rel="alternate" hreflang="ca" href="{url['ca']}">
<link rel="alternate" hreflang="es" href="{url['es']}">
<link rel="alternate" hreflang="x-default" href="{url['ca']}">
<meta name="author" content="Ilde Morales">
<link rel="license" href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.{L}">
<meta property="og:type" content="website">
<meta property="og:locale" content="{d['locale']}">
<meta property="og:site_name" content="{d['site']}">
<meta property="og:title" content="{d['title']}">
<meta property="og:description" content="{d['desc']}">
<meta property="og:url" content="{url[L]}">
<meta property="og:image" content="{BASE}/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<script data-goatcounter="https://ildemoralesmates.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>
</head>'''
    s = una(s, "</head>", head, "</head>")
    s = una(s, "</style>", ".hl{text-decoration:none;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--line);border-radius:8px;padding:0 9px;color:inherit;background:transparent;font-size:.9em}\n</style>", "css")
    # idioma fixat per la URL
    s = una(s, "let lang = 'ca';\ntry { lang = localStorage.getItem('trivial_lang') || 'ca'; } catch(e) {}", f"let lang = '{L}';", "lang")
    s = una(s, "  try { localStorage.setItem('trivial_lang', l); } catch(e) {}\n",
            f"  try {{ history.replaceState(null, '', l === 'es' ? '/es/{SLUG}/' : '/{SLUG}/' + location.search); }} catch(e) {{}}\n", "setLang")
    home = f'<a class="small ghost hl" href="{d["homeurl"]}" title="{d["home"]}" aria-label="{d["home"]}">⌂</a>'
    s = una(s, '<div class="tools">\n    <button class="small ghost" onclick="setLang(\'ca\')"', f'<div class="tools">\n    {home}\n    <button class="small ghost" onclick="setLang(\'ca\')"', "tools panel")
    s = una(s, '<div class="tools"><button class="small ghost" onclick="setLang(\'ca\')"', f'<div class="tools">{home}<button class="small ghost" onclick="setLang(\'ca\')"', "tools setup")
    return s

def main():
    src = (ARREL / "tools/hexaciencia/hexaciencia.src.html").read_text(encoding="utf-8")
    with sync_playwright() as p:
        exe = glob.glob("/opt/pw-browsers/chromium-*/chrome-linux*/chrome")
        b = p.chromium.launch(executable_path=exe[0], args=["--no-sandbox"]) if exe else p.chromium.launch()
        for L in ("ca", "es"):
            html = pagina(src, L)
            out = ARREL / ("es" if L == "es" else "") / SLUG / "index.html"
            out.parent.mkdir(parents=True, exist_ok=True); out.write_text(html, encoding="utf-8")
            pg = b.new_page(viewport={"width": 1366, "height": 768}); errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto("file://" + str(out)); pg.evaluate("localStorage.clear()"); pg.reload()
            inner = pg.inner_html("#setup"); pg.close()
            if errs: sys.exit(f"  ✗ errors de JS a {out}: {errs}")
            html = una(html, '<div id="setup" class="overlay"></div>', '<div id="setup" class="overlay">' + inner + '</div>', "setup")
            out.write_text(html, encoding="utf-8"); print(f"  ✓ {out.relative_to(ARREL)}")
        b.close()

if __name__ == "__main__": main()
