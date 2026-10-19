#!/usr/bin/env python3
"""Genera les pàgines bilingües (valencià /<slug>/ i castellà /es/<slug>/) a dist/.

Text bilingüe: sims/<slug>/strings.json  ->  {"va": {...}, "es": {...}}
Marcatge:      sims/<slug>/body.html     ->  usa {{clau}} (se substitueix per idioma)
Codi:          sims/<slug>/sim.js, sim.css (opcional)
Comú:          shared/ (css, js, plantilla, ui.json)

Ús:  python3 build.py            (base_url de config.json)
     BASE_URL=https://... python3 build.py
"""
import json, os, re, shutil, sys
from pathlib import Path
from html import escape

ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"
CFG = json.loads((ROOT / "config.json").read_text(encoding="utf-8"))
BASE = os.environ.get("BASE_URL", CFG["base_url"]).rstrip("/")
LANGS = ["va", "es"]
PREFIX = {"va": "", "es": "es/"}
HTML_LANG = {"va": "ca-valencia", "es": "es"}
HREFLANG = {"va": "ca", "es": "es"}
OG = {"va": "ca_ES", "es": "es_ES"}
LANG_NAME = {"va": "Valencià", "es": "Castellano"}
REQUIRED = ["title", "h1", "sub", "description", "card_text", "level"]

shared = ROOT / "shared"
ui = json.loads((shared / "ui.json").read_text(encoding="utf-8"))
css_common = (shared / "common.css").read_text(encoding="utf-8")
js_common = (shared / "common.js").read_text(encoding="utf-8")
shell = (shared / "shell.html").read_text(encoding="utf-8")


def fail(msg):
    print("ERROR:", msg, file=sys.stderr)
    sys.exit(1)


def page_dir(lang, slug):
    return Path(PREFIX[lang]) / slug if slug else Path(PREFIX[lang].rstrip("/") or ".")


def url(lang, slug):
    return f"{BASE}/{PREFIX[lang]}{slug + '/' if slug else ''}"


def rel(from_dir, to_dir):
    r = os.path.relpath(str(to_dir), str(from_dir)).replace(os.sep, "/")
    return "./" if r == "." else r + "/"


def jsjson(obj):
    return json.dumps(obj, ensure_ascii=False).replace("</", "<\\/")


def render(lang, slug, meta, body, css_extra="", js_extra=""):
    here = page_dir(lang, slug)
    other = "es" if lang == "va" else "va"
    langswitch = ""
    for l in LANGS:
        href = "#" if l == lang else rel(here, page_dir(l, slug))
        cur = ' aria-current="true"' if l == lang else ""
        langswitch += f'<a href="{href}" hreflang="{HREFLANG[l]}" lang="{HREFLANG[l]}"{cur}>{LANG_NAME[l]}</a>'
    hre = "".join(
        f'<link rel="alternate" hreflang="{HREFLANG[l]}" href="{url(l, slug)}">' for l in LANGS
    ) + f'<link rel="alternate" hreflang="x-default" href="{url("va", slug)}">'
    jsonld = {
        "@context": "https://schema.org",
        "@type": "LearningResource",
        "name": meta["title"],
        "description": meta["description"],
        "inLanguage": HREFLANG[lang],
        "educationalLevel": "ESO",
        "learningResourceType": "Interactive simulation",
        "url": url(lang, slug),
    }
    script = ""
    if js_extra:
        script = (
            f'<script>const LANG={json.dumps(lang)};const T={jsjson(meta["T"])};</script>'
            f"<script>{js_common}</script><script>{js_extra}</script>"
        )
    gc = CFG.get("goatcounter")
    if gc:
        script += f'<script data-goatcounter="https://{gc}.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>'
    page = shell
    repl = {
        "html_lang": HTML_LANG[lang],
        "title": escape(meta["title"]),
        "description": escape(meta["description"], quote=True),
        "canonical": url(lang, slug),
        "hreflang": hre,
        "og_locale": OG[lang],
        "jsonld": jsjson(jsonld),
        "css": css_common + css_extra,
        "home": rel(here, "." if CFG.get("home_root") else page_dir(lang, "")),
        "ui_home": ui[lang]["home"],
        "ui_lang_label": ui[lang]["lang_label"],
        "ui_footer": ui[lang]["footer"],
        "h1": meta["h1"],
        "sub": meta["sub"],
        "langswitch": langswitch,
        "body": body,
        "script": script,
    }
    for k, v in repl.items():
        page = page.replace("{{" + k + "}}", v)
    left = re.findall(r"\{\{(\w+)\}\}", page)
    if left:
        fail(f"{lang}/{slug}: marcadors sense substituir: {sorted(set(left))}")
    return page


def write(path, text):
    p = DIST / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8")


def main():
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()
    sims = []
    only = [x for x in os.environ.get("ONLY", "").split(",") if x]
    for s in CFG["sims"]:
        slug = s["slug"]
        if only and slug not in only:
            continue
        d = ROOT / "sims" / slug
        if not (d / "strings.json").exists():
            fail(f"falta {d}/strings.json")
        st = json.loads((d / "strings.json").read_text(encoding="utf-8"))
        if set(st["va"]) != set(st["es"]):
            diff = set(st["va"]) ^ set(st["es"])
            fail(f"{slug}: claus diferents entre va i es: {sorted(diff)}")
        for k in REQUIRED:
            if k not in st["va"]:
                fail(f"{slug}: falta la clau obligatòria '{k}'")
        sims.append({**s, "strings": st, "dir": d})

    for sim in sims:
        d, slug = sim["dir"], sim["slug"]
        body_tpl = (d / "body.html").read_text(encoding="utf-8")
        js = (d / "sim.js").read_text(encoding="utf-8")
        css = (d / "sim.css").read_text(encoding="utf-8") if (d / "sim.css").exists() else ""
        # claus usades pel JS: t('clau')
        used = set(re.findall(r"""\bt\(\s*['"](\w+)['"]\s*[,)]""", js))
        for lang in LANGS:
            T = sim["strings"][lang]
            miss = used - set(T)
            if miss:
                fail(f"{slug}/{lang}: el JS usa claus inexistents: {sorted(miss)}")
            body = body_tpl
            for k in set(re.findall(r"\{\{(\w+)\}\}", body_tpl)):
                if k not in T:
                    fail(f"{slug}/{lang}: el body usa la clau inexistent '{k}'")
                body = body.replace("{{" + k + "}}", T[k])
            meta = {"title": T["title"], "h1": T["h1"], "sub": T["sub"], "description": T["description"], "T": T}
            write(page_dir(lang, slug) / "index.html", render(lang, slug, meta, body, css, js))

    # pàgines d'índex
    for lang in LANGS:
        here = page_dir(lang, "")
        cards = ""
        for sim in sims:
            T = sim["strings"][lang]
            href = rel(here, page_dir(lang, sim["slug"]))
            cards += (
                f'<a class="simcard" href="{href}"><div class="ic" aria-hidden="true">{sim["icon"]}</div>'
                f'<h2>{T["h1"]}</h2><p>{T["card_text"]}</p><span class="tag">{T["level"]}</span> '
                f'<span class="mut">{ui[lang]["open"]}</span></a>'
            )
        meta = {"title": ui[lang]["index_title"], "h1": ui[lang]["index_h1"], "sub": ui[lang]["index_sub"],
                "description": ui[lang]["index_description"], "T": {}}
        write(here / "index.html", render(lang, "", meta, f'<div class="cards">{cards}</div>'))

    # sitemap amb alternatives d'idioma, robots, nojekyll
    slugs = [""] + [s["slug"] for s in sims]
    sm = ['<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">']
    for slug in slugs:
        for lang in LANGS:
            sm.append(f"<url><loc>{url(lang, slug)}</loc>")
            for l in LANGS:
                sm.append(f'<xhtml:link rel="alternate" hreflang="{HREFLANG[l]}" href="{url(l, slug)}"/>')
            sm.append(f'<xhtml:link rel="alternate" hreflang="x-default" href="{url("va", slug)}"/></url>')
    sm.append("</urlset>")
    write("sitemap.xml", "\n".join(sm) + "\n")
    write("robots.txt", f"User-agent: *\nAllow: /\nSitemap: {BASE}/sitemap.xml\n")
    write(".nojekyll", "")
    print(f"OK · {len(sims)} animacions × {len(LANGS)} idiomes · base_url = {BASE}")
    if "USUARI" in BASE:
        print("AVÍS: base_url encara és el valor provisional; canvia'l a config.json o amb BASE_URL=...")


if __name__ == "__main__":
    main()
