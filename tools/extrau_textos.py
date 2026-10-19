#!/usr/bin/env python3
"""Extrau els textos traduïbles d'un original valencià (<slug>/index.html) com a candidats numerats.

Ús:  python3 tools/extrau_textos.py <slug> [carpeta_de_treball]
Escriu <carpeta>/<slug>.cands.json (amb el context exacte de cada text) i <carpeta>/<slug>.txt (N<TAB>text).
Després es redacta <carpeta>/<slug>.es.txt amb línies N<TAB>traducció (les que falten o buides no es tradueixen)
i s'executa:  python3 tools/aplica_traduccio.py <slug> [carpeta]   -> escriu i18n/es/<slug>.json
"""
import json, re, sys
from pathlib import Path
ARREL = Path(__file__).resolve().parent.parent
LET = re.compile(r"[A-Za-zÀ-ÿ]")

def es_text(s):
    t = s.strip()
    if not LET.search(t): return False
    if re.search(r'\w="|="|prefers-|^[\s"\'/>]*\w+="', t): return False   # fragments de codi SVG/HTML
    if len(LET.findall(t)) < 3: return False                             # "a² =", "c = √"
    if re.fullmatch(r"https?://\S+|#[0-9a-fA-F]{3,8}|[\w.#:/\-\[\]=*>+,~%()' ]*[_\-.#:/\[\]=*>+~%]+[\w.#:/\-\[\]=*>+,~%()' ]*", t) and ' ' not in t: return False
    if re.fullmatch(r"[a-z0-9_\-.:/#]+", t): return False            # identificadors, classes, rutes
    if re.search(r"[{}]|=>|;\s*\w+\s*:|\bfunction\b|\breturn\b|\bvar\b|\bconst\b", t): return False
    if re.fullmatch(r"[\d\s.,+\-×·%=/()−–]*[a-zA-Z]{0,3}", t): return False   # números i unitats
    if ' ' in t.replace('\xa0', ' ') or re.search(r"[À-ÿ]", t): return True
    return bool(re.fullmatch(r"[A-ZÀ-Ý][a-zà-ÿ]{2,}[.:!?]?", t))   # etiquetes d'una paraula amb majúscula

def peces(lit_start, text, out):
    """Un literal o node de text: si duu etiquetes HTML, es divideix en trossos de text."""
    pos = 0
    for m in re.finditer(r"<[^>]*>|\$\{[^}]*\}", text):
        _trosso(lit_start + pos, text[pos:m.start()], out); pos = m.end()
    _trosso(lit_start + pos, text[pos:], out)

def _trosso(ini, t, out):
    if es_text(t):
        l = len(t) - len(t.lstrip()); r = len(t.rstrip())
        out.append((ini + l, ini + r))

def extreu(html):
    out = []
    # blocs <style> i <script>
    zones = [(m.start(1), m.end(1), m.group(2)) for m in re.finditer(r"<(style|script)\b[^>]*>(.*?)</\1>", html, re.S)
             for m in [re.match(r"(?s)(.*)", "")] if False]
    sty = [(m.start(2), m.end(2), m.group(1)) for m in re.finditer(r"<(style|script)\b[^>]*>(.*?)</\1>", html, re.S)]
    def dins(i): return any(a <= i < b for a, b, _ in sty)
    # 1) nodes de text de l'HTML
    for m in re.finditer(r">([^<>]+)<", html):
        if dins(m.start(1)): continue
        peces(m.start(1), m.group(1), out)
    # 2) atributs
    for m in re.finditer(r'\b(?:title|aria-label|alt|placeholder|content|data-[\w-]+)="([^"]*)"', html):
        if dins(m.start(1)): continue
        if m.group(0).startswith('content="') and not re.search(r'(name|property)="(description|og:description|og:title)"', html[max(0, m.start()-80):m.end()+80]): continue
        peces(m.start(1), m.group(1), out)
    # 3) literals de JS
    for a, b, tipus in sty:
        if tipus != "script": continue
        s = html[a:b]; i = 0
        while i < len(s):
            c = s[i]
            if s.startswith("//", i): i = s.find("\n", i); i = len(s) if i < 0 else i; continue
            if s.startswith("/*", i): i = s.find("*/", i) + 2; continue
            if c in "'\"`":
                q = c; j = i + 1; dep = 0
                while j < len(s):
                    if s[j] == "\\": j += 2; continue
                    if q == "`" and s.startswith("${", j): dep += 1; j += 2; continue
                    if q == "`" and dep and s[j] == "}": dep -= 1
                    if s[j] == q and not dep: break
                    if q != "`" and s[j] == "\n": break
                    j += 1
                if j >= len(s): break
                peces(a + i + 1, s[i + 1:j], out); i = j + 1; continue
            i += 1
    out = sorted(set(out))
    res = []
    for ini, fi in out:
        t = html[ini:fi]
        pre, post = html[max(0, ini-1):ini], html[fi:fi+1]
        res.append({"t": t, "pre": pre, "post": post, "ctx": re.sub(r"\s+", " ", html[max(0, ini-40):fi+40])})
    return res

if __name__ == "__main__":
    slug = sys.argv[1]; w = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("/tmp")
    html = (ARREL / slug / "index.html").read_text(encoding="utf-8")
    c = extreu(html)
    # compacta: un mateix text només una vegada
    uniq = {}; 
    for x in c: uniq.setdefault((x["pre"], x["t"], x["post"]), x)
    c = list(uniq.values())
    w.mkdir(parents=True, exist_ok=True)
    (w / f"{slug}.cands.json").write_text(json.dumps(c, ensure_ascii=False, indent=0), encoding="utf-8")
    (w / f"{slug}.txt").write_text("\n".join(f"{n}\t{x['t']}" for n, x in enumerate(c)), encoding="utf-8")
    print(slug, len(c), "candidats,", sum(len(x['t']) for x in c), "caràcters")
