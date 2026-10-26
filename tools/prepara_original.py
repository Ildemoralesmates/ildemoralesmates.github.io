#!/usr/bin/env python3
"""Prepara un original valencià per a tindre versió castellana: hreflang, enllaç «Castellano» (.navtop/.lang). Idempotent.
Ús:  python3 tools/prepara_original.py <slug> [<slug>...]"""
import re, sys
from pathlib import Path
ARREL = Path(__file__).resolve().parent.parent
BASE = "https://ildemoralesmates.github.io"
CSS = (".navtop{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:14px}\n"
       ".navtop .back{margin-bottom:0}\n"
       ".lang{font:600 .85rem ui-monospace,SFMono-Regular,Menlo,monospace;color:inherit;opacity:.85;text-decoration:none;"
       "border:1.5px solid color-mix(in srgb,currentColor 28%,transparent);border-radius:99px;padding:4px 12px}\n"
       ".lang:hover,.lang:focus-visible{opacity:1;border-color:currentColor}\n")
for slug in sys.argv[1:]:
    p = ARREL / slug / "index.html"; s = p.read_text(encoding="utf-8")
    if "hreflang" not in s:
        can = f'<link rel="canonical" href="{BASE}/{slug}/">'
        assert can in s, f"{slug}: sense canonical"
        s = s.replace(can, can + f'\n<link rel="alternate" hreflang="ca" href="{BASE}/{slug}/">\n<link rel="alternate" hreflang="es" href="{BASE}/es/{slug}/">\n<link rel="alternate" hreflang="x-default" href="{BASE}/{slug}/">', 1)
    if 'class="navtop"' not in s:
        m = re.search(r'([ \t]*)<a class="back" href="\.\./">([^<]*)</a>', s)
        if not m:   # pàgines sense enllaç .back: només el selector d'idioma, a l'inici del body
            mb = re.search(r'<body[^>]*>', s); assert mb, f"{slug}: sense <body>"
            nav = f'\n  <nav class="navtop"><a class="lang" href="../es/{slug}/" hreflang="es" lang="es">Castellano</a></nav>'
            s = s[:mb.end()] + nav + s[mb.end():]
            j = s.find("</style>"); assert j > 0, f"{slug}: sense <style>"
            s = s[:j] + CSS + s[j:]
            p.write_text(s, encoding="utf-8"); print("preparat (sense back)", slug); continue
        ind = m.group(1)
        nou = (f'{ind}<nav class="navtop">\n{ind}  <a class="back" href="../">{m.group(2)}</a>\n'
               f'{ind}  <a class="lang" href="../es/{slug}/" hreflang="es" lang="es">Castellano</a>\n{ind}</nav>')
        s = s.replace(m.group(0), nou, 1)
        i = s.find(".back")
        j = s.find("</style>", i) if i >= 0 else -1
        assert j > 0, f"{slug}: sense bloc d'estils amb .back"
        s = s[:j] + CSS + s[j:]
    p.write_text(s, encoding="utf-8"); print("preparat", slug)
