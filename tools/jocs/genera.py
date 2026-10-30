#!/usr/bin/env python3
"""Genera <slug>/index.html (valencià) i es/<slug>/index.html (castellà) dels jocs d'aula (hexaciencia, bingo-resultats i els jocs arcade de monomis) a partir de
tools/jocs/<font>.src.html (HTML autònom del joc, amb diccionari I18N ca/es). NO s'editen les eixides a mà.
L'idioma inicial el fixa la URL; el selector VAL/CAS canvia el text sense perdre la partida i actualitza la URL.
El text de la pantalla inicial s'escriu també en l'HTML estàtic (render amb Playwright).
Ús: python3 tools/jocs/genera.py [slug]   (cal Playwright; sense argument, tots els jocs)"""
import glob, json, re, sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ARREL = Path(__file__).resolve().parent.parent.parent
BASE = "https://ildemoralesmates.github.io"
JOCS = {
 "hexaciencia": {
  "src": "hexaciencia.src.html", "h1": "<title>Hexaciència</title>",
  "ca": {"title": "Hexaciència: Joc de preguntes de ciències per a l'aula",
         "desc": "Joc de preguntes d'ESO per a la pissarra digital: sis matèries (mates, física, química, biologia, geologia i tecnologia), 2n i 4t, 1.200 preguntes, equips i el professor d'àrbitre. Bilingüe VAL/CAS."},
  "es": {"title": "Hexaciencia: Juego de preguntas de ciencias para el aula",
         "desc": "Juego de preguntas de ESO para la pizarra digital: seis materias (mates, física, química, biología, geología y tecnología), 2.º y 4.º, 1.200 preguntas, equipos y el profesor de árbitro. Bilingüe VAL/CAS."}},
 "bingo-resultats": {
  "src": "bingo.src.html", "h1": "<title>Bingo de resultats</title>",
  "ca": {"title": "Bingo de resultats: Joc de càlcul amb cartons per a imprimir",
         "desc": "Bingo de càlcul per a la pissarra digital: el professor canta operacions (enters, potències, percentatges, equacions…), la classe marca el resultat al cartó, amb cartons únics per a imprimir i comprovació de línia i bingo. Bilingüe VAL/CAS."},
  "es": {"title": "Bingo de resultados: Juego de cálculo con cartones para imprimir",
         "desc": "Bingo de cálculo para la pizarra digital: el profesor canta operaciones (enteros, potencias, porcentajes, ecuaciones…), la clase marca el resultado en el cartón, con cartones únicos para imprimir y comprobación de línea y bingo. Bilingüe VAL/CAS."}},
 "monomis-en-orbita": {
  "src": "monomis-en-orbita.src.html", "h1": "<title>monomis-en-orbita</title>", "arcade": True,
  "ca": {"title": "Monomis en òrbita: Joc d'operacions amb monomis",
         "desc": "Joc arcade per a practicar la suma, la resta, el producte i la divisió de monomis: dispara la resposta correcta als meteorits abans que arriben. Amb teclat o tàctil. Bilingüe VAL/CAS."},
  "es": {"title": "Monomios en órbita: Juego de operaciones con monomios",
         "desc": "Juego arcade para practicar la suma, la resta, el producto y la división de monomios: dispara la respuesta correcta a los meteoritos antes de que lleguen. Con teclado o táctil. Bilingüe VAL/CAS."}},
 "monomis-a-la-fuga": {
  "src": "monomis-a-la-fuga.src.html", "h1": "<title>monomis-a-la-fuga</title>", "arcade": True,
  "ca": {"title": "Monomis a la fuga: Joc de terminal amb operacions de monomis",
         "desc": "Desxifra paquets de dades resolent sumes, restes, productes i divisions de monomis abans que el rastreig t'agafe. Estètica de terminal, teclat i tàctil. Bilingüe VAL/CAS."},
  "es": {"title": "Monomios a la fuga: Juego de terminal con operaciones de monomios",
         "desc": "Descifra paquetes de datos resolviendo sumas, restas, productos y divisiones de monomios antes de que el rastreo te alcance. Estética de terminal, teclado y táctil. Bilingüe VAL/CAS."}},
 "fabrica-de-monomis": {
  "src": "fabrica-de-monomis.src.html", "h1": "<title>fabrica-de-monomis</title>", "arcade": True,
  "ca": {"title": "Fàbrica de monomis: Joc de caixes amb operacions de monomis",
         "desc": "Segella cada caixa amb la resposta correcta abans que s'estrelle a la cinta i completa els palets. Operacions amb monomis, amb teclat o tàctil. Bilingüe VAL/CAS."},
  "es": {"title": "Fábrica de monomios: Juego de cajas con operaciones de monomios",
         "desc": "Sella cada caja con la respuesta correcta antes de que se estrelle en la cinta y completa los palés. Operaciones con monomios, con teclado o táctil. Bilingüe VAL/CAS."}},
 "monosalt": {
  "src": "monosalt.src.html", "h1": "<title>monosalt</title>", "arcade": True,
  "ca": {"title": "Monosalt: Joc de plataformes amb monomis",
         "desc": "Salta de plataforma en plataforma i queda't a la porta amb la resposta correcta d'una operació de monomis, abans que l'ona de lava t'agafe. Teclat i tàctil. Bilingüe VAL/CAS."},
  "es": {"title": "Monosalto: Juego de plataformas con monomios",
         "desc": "Salta de plataforma en plataforma y quédate en la puerta con la respuesta correcta de una operación de monomios, antes de que la ola de lava te alcance. Teclado y táctil. Bilingüe VAL/CAS."}},
 "defensa-monomial": {
  "src": "defensa-monomial.src.html", "h1": "<title>defensa-monomial</title>", "arcade": True,
  "ca": {"title": "Defensa monomial: Joc de torres amb divisors i factors",
         "desc": "Tria la torre el monomi de la qual divideix exactament l'enemic, o la que du el factor que falta al producte: les operacions de monomis al revés, amb pistes d'error. Bilingüe VAL/CAS."},
  "es": {"title": "Defensa monomial: Juego de torres con divisores y factores",
         "desc": "Elige la torre cuyo monomio divide exactamente al enemigo, o la que lleva el factor que falta en el producto: las operaciones de monomios al revés, con pistas de error. Bilingüe VAL/CAS."}},
}
LOC = {"ca": {"home": "Tornar a la portada", "homeurl": "/", "locale": "ca_ES", "site": "Recursos de matemàtiques"},
       "es": {"home": "Volver a la portada", "homeurl": "/es/", "locale": "es_ES", "site": "Recursos de matemáticas"}}

def una(s, a, b, que):
    if a not in s: sys.exit(f"  ✗ no trobat ({que}): {a[:70]}")
    return s.replace(a, b, 1)

def pagina(src, slug, L):
    SLUG = slug; d = {**JOCS[slug][L], **LOC[L]}; url = {"ca": f"{BASE}/{SLUG}/", "es": f"{BASE}/es/{SLUG}/"}
    s = una(src, '<html lang="ca">', f'<html lang="{L}">', "html lang")
    s = una(s, JOCS[slug]["h1"], f"<title>{d['title']}</title>", "title")
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
    arcade = JOCS[slug].get("arcade")
    if not arcade:
        s = una(s, "</style>", ".hl{text-decoration:none;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--line);border-radius:8px;padding:0 9px;color:inherit;background:transparent;font-size:.9em}\n</style>", "css")
    home = f'<a class="small ghost hl" href="{d["homeurl"]}" title="{d["home"]}" aria-label="{d["home"]}">⌂</a>'
    url_js = f"try {{ history.replaceState(null, '', l === 'es' ? '/es/{SLUG}/' : '/{SLUG}/' + location.search); }} catch(e) {{}}"
    if slug == "hexaciencia":
        s = una(s, "let lang = 'ca';\ntry { lang = localStorage.getItem('trivial_lang') || 'ca'; } catch(e) {}", f"let lang = '{L}';", "lang")
        s = una(s, "  try { localStorage.setItem('trivial_lang', l); } catch(e) {}\n", "  " + url_js + "\n", "setLang")
        s = una(s, '<div class="tools">\n    <button class="small ghost" onclick="setLang(\'ca\')"', f'<div class="tools">\n    {home}\n    <button class="small ghost" onclick="setLang(\'ca\')"', "tools panel")
        s = una(s, '<div class="tools"><button class="small ghost" onclick="setLang(\'ca\')"', f'<div class="tools">{home}<button class="small ghost" onclick="setLang(\'ca\')"', "tools setup")
    elif arcade:
        # jocs arcade (monomis): selector VAL/CAS intern, URL per idioma, títol de pestanya en els dos idiomes, ⌂ a la barra superior
        s = una(s, "let lang = 'ca';", f"let lang = '{L}';", "lang")
        s = una(s, "/*@URL@*/", url_js, "url")
        s = una(s, "/*@TITLES@*/null", json.dumps({k: JOCS[slug][k]["title"] for k in ("ca", "es")}, ensure_ascii=False), "titols")
        s = una(s, "<!--@HOME@-->", f'<a class="hl nl" href="{d["homeurl"]}" title="{d["home"]}" aria-label="{d["home"]}">⌂</a>', "home")
    else:
        s = una(s, "let lang = 'ca';", f"let lang = '{L}';", "lang")
        s = una(s, "/*@URL@*/", url_js, "url")
        assert "<!--@HOME@-->" in s
        s = s.replace("<!--@HOME@-->", home)
    return s

def main():
    slugs = sys.argv[1:] or list(JOCS)
    with sync_playwright() as p:
        exe = glob.glob("/opt/pw-browsers/chromium-*/chrome-linux*/chrome")
        b = p.chromium.launch(executable_path=exe[0], args=["--no-sandbox"]) if exe else p.chromium.launch()
        for slug in slugs:
            src = (ARREL / "tools/jocs" / JOCS[slug]["src"]).read_text(encoding="utf-8")
            for L in ("ca", "es"):
                html = pagina(src, slug, L)
                out = ARREL / ("es" if L == "es" else "") / slug / "index.html"
                out.parent.mkdir(parents=True, exist_ok=True); out.write_text(html, encoding="utf-8")
                pg = b.new_page(viewport={"width": 1366, "height": 768}); errs = []
                pg.on("pageerror", lambda e: errs.append(str(e)))
                pg.goto("file://" + str(out)); pg.evaluate("localStorage.clear()"); pg.reload()
                arc = JOCS[slug].get("arcade")
                inner = pg.inner_html("#ovStart .panel" if arc else "#setup"); pg.close()
                if errs: sys.exit(f"  ✗ errors de JS a {out}: {errs}")
                if arc:  # la pantalla inicial dels jocs arcade també va com a HTML estàtic
                    html, n = re.subn(r'(<div class="ov on" id="ovStart"><div class="panel">).*?(</div></div>\n\n<div class="ov" id="ovPause">)', lambda m: m.group(1) + inner + m.group(2), html, count=1, flags=re.S)
                    if n != 1: sys.exit(f"  ✗ no trobada la pantalla inicial a {out}")
                else:
                    html = una(html, '<div id="setup" class="overlay"></div>', '<div id="setup" class="overlay">' + inner + '</div>', "setup")
                out.write_text(html, encoding="utf-8"); print(f"  ✓ {out.relative_to(ARREL)}")
        b.close()

if __name__ == "__main__": main()
