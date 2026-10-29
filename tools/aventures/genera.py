#!/usr/bin/env python3
"""Genera les dues pàgines d'una aventura bilingüe amb URL pròpia per idioma.

Font: tools/aventures/<slug>.src.html (HTML autònom de l'aventura, amb selector VAL/CAS intern).
Eixida: <slug>/index.html (valencià) i es/<slug>/index.html (castellà). NO s'editen a mà.
Cada pàgina porta canonical, hreflang ca/es/x-default, GoatCounter, i la portada (títol, descripció,
instruccions i camp del nom) escrita també en l'HTML estàtic: es renderitza amb Playwright i s'hi insereix.
El selector d'idioma de la pàgina navega a l'altra URL (conservant la partida, que viu al localStorage).
Les URL antigues amb ?lang=es redirigeixen a la versió castellana.

Ús:  python3 tools/aventures/genera.py [slug]      (cal Playwright; sense argument, totes les aventures)
"""
import glob, re, sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ARREL = Path(__file__).resolve().parent.parent.parent
BASE = "https://ildemoralesmates.github.io"

AVENTURES = {
    "numeros-perduts": {
        "ca": {
            "title": "Els números perduts: Expedició a Calmara",
            "brand": "Els números perduts",
            "desc": "Aventura interactiva amb reptes de nombres: tria el camí, resol reptes de successions, càlcul i numeració, ajuda Tamu i Oxo i recupera els tres fragments de la tauleta amb el robot Zum. 10 finals.",
            "restart": "Començar de nou",
            "home": "Tornar a la portada",
            "homeurl": "/",
        },
        "es": {
            "title": "Los números perdidos: Expedición a Calmara",
            "brand": "Los números perdidos",
            "desc": "Aventura interactiva con retos de números: elige el camino, resuelve retos de sucesiones, cálculo y numeración, ayuda a Tamu y a Oxo y recupera los tres fragmentos de la tablilla con el robot Zum. 10 finales.",
            "restart": "Empezar de nuevo",
            "home": "Volver a la portada",
            "homeurl": "/es/",
        },
    },
    "missio-zefir": {
        "ca": {
            "title": "Missió Zèfir: Aventura als tres planetes",
            "brand": "Missió Zèfir",
            "desc": "Aventura interactiva a l'espai: tria el camí, resol reptes de càlcul i problemes, tira el dau i recupera les tres peces del motor amb l'alienígena Zumet, que només parla en refranys. 8 finals.",
            "restart": "Començar de nou",
            "home": "Tornar a la portada",
            "homeurl": "/",
        },
        "es": {
            "title": "Misión Céfiro: Aventura en los tres planetas",
            "brand": "Misión Céfiro",
            "desc": "Aventura interactiva en el espacio: elige el camino, resuelve retos de cálculo y problemas, tira el dado y recupera las tres piezas del motor con el alienígena Zumet, que solo habla en refranes. 8 finales.",
            "restart": "Empezar de nuevo",
            "home": "Volver a la portada",
            "homeurl": "/es/",
        },
    },
    "asterix-percy-jackson": {
        "ca": {
            "title": "Astèrix i Percy Jackson: Un embolic de poció i de déus",
            "brand": "Astèrix i Percy Jackson",
            "desc": "Aventura interactiva còmica: tria el camí, usa tres cartes de poder, guanya insígnies amb bones accions i troba els tres ingredients de l'antídot amb Mr. D. 9 finals.",
            "restart": "Començar de nou",
            "home": "Tornar a la portada",
            "homeurl": "/",
        },
        "es": {
            "title": "Astérix y Percy Jackson: Un lío de poción y de dioses",
            "brand": "Astérix y Percy Jackson",
            "desc": "Aventura interactiva cómica: elige el camino, usa tres cartas de poder, gana insignias con buenas acciones y encuentra los tres ingredientes del antídoto con Mr. D. 9 finales.",
            "restart": "Empezar de nuevo",
            "home": "Volver a la portada",
            "homeurl": "/es/",
        },
    },
    "gumball-bob-esponja": {
        "ca": {
            "title": "Gumball i Bob Esponja: Aventura al Canal Mesclat",
            "brand": "Gumball i Bob Esponja",
            "desc": "Aventura interactiva: tria el camí, resol sis reptes de geometria (figures, perímetre, angles, simetria, cossos i polígons), guanya tres cartes ajudant i recupera les tres peces del comandament amb Gumball. 9 finals.",
            "restart": "Començar de nou",
            "home": "Tornar a la portada",
            "homeurl": "/",
        },
        "es": {
            "title": "Gumball y Bob Esponja: Aventura en el Canal Mezclado",
            "brand": "Gumball y Bob Esponja",
            "desc": "Aventura interactiva: elige el camino, resuelve seis retos de geometría (figuras, perímetro, ángulos, simetría, cuerpos y polígonos), gana tres cartas ayudando y recupera las tres piezas del mando con Gumball. 9 finales.",
            "restart": "Empezar de nuevo",
            "home": "Volver a la portada",
            "homeurl": "/es/",
        },
    },
    "somni-blaugrana": {
        "ca": {
            "title": "El somni blaugrana: Aventura de futbol al Ciutat de València",
            "brand": "El somni blaugrana",
            "desc": "Aventura interactiva de futbol: tria el camí, resol reptes de multiplicar i dividir, guanya les tres franges de la samarreta amb el baló Cuiro i juga el partit final amb marcador i rellotge. 9 finals.",
            "restart": "Començar de nou",
            "home": "Tornar a la portada",
            "homeurl": "/",
        },
        "es": {
            "title": "El sueño blaugrana: Aventura de fútbol en el Ciutat de València",
            "brand": "El sueño blaugrana",
            "desc": "Aventura interactiva de fútbol: elige el camino, resuelve retos de multiplicar y dividir, gana las tres franjas de la camiseta con el balón Cuiro y juega el partido final con marcador y reloj. 9 finales.",
            "restart": "Empezar de nuevo",
            "home": "Volver a la portada",
            "homeurl": "/es/",
        },
    },
    "oliver-benji-bola-de-drac": {
        "ca": {
            "title": "Oliver i Benji × Bola de Drac: El torneig de les set boles",
            "brand": "Oliver i Benji × Bola de Drac",
            "desc": "Aventura interactiva: tria el camí, resol endevinalles, guanya cartes Veloç, Tècnica i Força en duels i troba les tres Boles del Drac amb la pilota parlant Pipo. 9 finals.",
            "restart": "Començar de nou",
            "home": "Tornar a la portada",
            "homeurl": "/",
        },
        "es": {
            "title": "Oliver y Benji × Bola de Dragón: El torneo de las siete bolas",
            "brand": "Oliver y Benji × Bola de Dragón",
            "desc": "Aventura interactiva: elige el camino, resuelve adivinanzas, gana cartas Veloz, Técnica y Fuerza en duelos y encuentra las tres Bolas del Dragón con el balón parlante Pipo. 9 finales.",
            "restart": "Empezar de nuevo",
            "home": "Volver a la portada",
            "homeurl": "/es/",
        },
    }
}


def una(s, a, b, que):
    if a not in s:
        sys.exit(f"  ✗ no trobat ({que}): {a[:70]}")
    return s.replace(a, b, 1)


def pagina(src, slug, L):
    d = AVENTURES[slug][L]
    altre = "es" if L == "ca" else "ca"
    url = {"ca": f"{BASE}/{slug}/", "es": f"{BASE}/es/{slug}/"}
    path = {"ca": f"/{slug}/", "es": f"/es/{slug}/"}
    s = src
    s = una(s, '<html lang="ca">', f'<html lang="{L}">', "html lang")
    s = re.sub(r"<title>.*?</title>", f"<title>{d['title']}</title>", s, count=1)
    meta = f'''<meta name="description" content="{d['desc']}">
<link rel="canonical" href="{url[L]}">
<link rel="alternate" hreflang="ca" href="{url['ca']}">
<link rel="alternate" hreflang="es" href="{url['es']}">
<link rel="alternate" hreflang="x-default" href="{url['ca']}">
<meta name="author" content="Ilde">
<link rel="license" href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.{L}">
<meta property="og:type" content="website">
<meta property="og:locale" content="{'ca_ES' if L == 'ca' else 'es_ES'}">
<meta property="og:site_name" content="{'Recursos de matemàtiques' if L == 'ca' else 'Recursos de matemáticas'}">
<meta property="og:title" content="{d['title']}">
<meta property="og:description" content="{d['desc']}">
<meta property="og:url" content="{url[L]}">
<meta property="og:image" content="{BASE}/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">'''
    s, n = re.subn(r'<meta name="description" content="[^"]*">', lambda m: meta, s, count=1)
    assert n == 1, "meta description"
    gc = '<script data-goatcounter="https://ildemoralesmates.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>\n</head>'
    s = una(s, "</head>", gc, "</head>")
    # capçalera estàtica en l'idioma de la pàgina
    s, nb = re.subn(r'<div class="brand" id="brand">[^<]*</div>', lambda m: f'<div class="brand" id="brand">{d["brand"]}</div>', s, count=1)
    assert nb == 1, "brand"
    s = una(s, 'aria-label="Començar de nou"', f'aria-label="{d["restart"]}"', "aria restart")
    # enllaç de tornada a la portada (convenció del lloc), a la capçalera
    s = una(s, '<div class="tools">\n', f'<div class="tools">\n    <a class="pill home" href="{d["homeurl"]}" aria-label="{d["home"]}" title="{d["home"]}">⌂</a>\n', "tools")
    s = una(s, "</style>", "a.pill{text-decoration:none;display:inline-flex;align-items:center;justify-content:center}\n</style>", "css pill")
    if L == "es":
        s = una(s, 'id="lang-ca" aria-pressed="true"', 'id="lang-ca" aria-pressed="false"', "pill ca")
        s = una(s, 'id="lang-es" aria-pressed="false"', 'id="lang-es" aria-pressed="true"', "pill es")
    # l'idioma el fixa la URL: llengua inicial, sense recuperar-la de la partida guardada
    s, nl = re.subn(r"lang: 'ca', era: '(\w+)'", lambda m: f"lang: '{L}', era: '{m.group(1)}'", s, count=1)
    assert nl == 1, "st.lang"
    s = una(s, "    if (d.lang === 'ca' || d.lang === 'es') st.lang = d.lang;\n", "", "load lang")
    s = una(s, "function setLang(l) {\n  st.lang = l;\n  render();\n  save();\n}",
            f"function setLang(l) {{\n  if (l === st.lang) return;\n  save();\n  location.href = l === 'es' ? '/es/{slug}/' : '/{slug}/';\n}}", "setLang")
    if L == "ca":  # enllaços antics ?lang=es
        s = una(s, "load();\nrender();\n</script>", "if (new URLSearchParams(location.search).get('lang') === 'es') location.replace('/es/" + slug + "/');\nload();\nrender();\n</script>", "?lang")
    return s


def main():
    slugs = sys.argv[1:] or list(AVENTURES)
    with sync_playwright() as p:
        exe = glob.glob("/opt/pw-browsers/chromium-*/chrome-linux*/chrome")
        b = p.chromium.launch(executable_path=exe[0], args=["--no-sandbox"]) if exe else p.chromium.launch()
        for slug in slugs:
            src = (ARREL / "tools/aventures" / f"{slug}.src.html").read_text(encoding="utf-8")
            for L in ("ca", "es"):
                html = pagina(src, slug, L)
                out = ARREL / ("es" if L == "es" else "") / slug / "index.html"
                out.parent.mkdir(parents=True, exist_ok=True)
                out.write_text(html, encoding="utf-8")
                # renderitza la portada i l'insereix com a HTML estàtic dins <main id="app">
                page = b.new_page(viewport={"width": 430, "height": 900})
                errs = []
                page.on("pageerror", lambda e: errs.append(str(e)))
                page.goto("file://" + str(out))
                page.evaluate("localStorage.clear()")
                page.reload()
                inner = page.inner_html("#app")
                page.close()
                if errs:
                    sys.exit(f"  ✗ errors de JS a {out}: {errs}")
                html = una(html, '<main id="app"></main>', f'<main id="app">{inner}</main>', "main")
                out.write_text(html, encoding="utf-8")
                print(f"  ✓ {out.relative_to(ARREL)}")
        b.close()


if __name__ == "__main__":
    main()
