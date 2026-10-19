#!/usr/bin/env python3
"""Ensambla cada simulador (src/<nom>.src.html) amb el CSS/JS comú -> tools/simuladors/.build/<nom>.html (ho crida genera.py)"""
import sys
from pathlib import Path
R = Path(__file__).resolve().parent
S = R / "src"
OUT = R / ".build"; OUT.mkdir(exist_ok=True)
css = (S / "common.css").read_text(encoding="utf-8")
js = (S / "common.js").read_text(encoding="utf-8")
LANGSW = '<div class="seg langsw" role="group" aria-label="Idioma / Idioma"><button type="button" data-lang="ca" aria-pressed="true">Valencià</button><button type="button" data-lang="es" aria-pressed="false">Castellano</button></div>'
FOOT = ('<footer class="cc">© Ilde · <a href="https://ildemoralesmates.github.io/">Recursos de matemàtiques</a> · '
        '<a rel="license" href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a></footer>')
GC = '<script data-goatcounter="https://ildemoralesmates.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>'
names = sys.argv[1:] or [p.name[:-9] for p in S.glob("*.src.html")]
for n in names:
    s = (S / f"{n}.src.html").read_text(encoding="utf-8")
    s = s.replace("/*@COMMON_CSS@*/", css).replace("/*@COMMON_JS@*/", js)
    s = s.replace("<!--@LANGSW@-->", LANGSW).replace("<!--@FOOTER@-->", FOOT).replace("<!--@GC@-->", GC)
    (OUT / f"{n}.html").write_text(s, encoding="utf-8")
    print("ok", n, len(s))
