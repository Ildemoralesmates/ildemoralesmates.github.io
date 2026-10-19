#!/usr/bin/env python3
"""Fusiona les traduccions (<carpeta>/<slug>.es.txt: N<TAB>castellà) amb els candidats extrets i escriu i18n/es/<slug>.json.
Ús:  python3 tools/aplica_traduccio.py <slug> [carpeta_de_treball]
"""
import json, sys
from pathlib import Path
ARREL = Path(__file__).resolve().parent.parent
slug = sys.argv[1]; w = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("/tmp")
cands = json.loads((w / f"{slug}.cands.json").read_text(encoding="utf-8"))
tr = {}
for l in (w / f"{slug}.es.txt").read_text(encoding="utf-8").splitlines():
    if "\t" in l:
        n, t = l.split("\t", 1)
        if t.strip() and n.strip().isdigit(): tr[int(n)] = t
DELIM = {">": "<", "'": "'", '"': '"', "`": "`"}
parells, vistos = [], set()
for n, t in sorted(tr.items()):
    c = cands[n]; va = c["t"]; es = t
    pre, post = c["pre"], c["post"]
    if pre in DELIM and post == DELIM[pre]:
        if pre in "'\"`": es = es.replace("\\" + pre, pre).replace(pre, "\\" + pre) if pre != '"' else es.replace('"', "&quot;" if c["ctx"].count('="') else '\\"')
        va, es = pre + va + post, pre + es + post
    if va == es or va in vistos: continue
    vistos.add(va); parells.append([va, es])
parells.sort(key=lambda p: -len(p[0]))
d = {"_comentari": f"Traducció al castellà de {slug}/index.html. Cada parell és [text valencià exacte, text castellà]. Després d'editar, executa: python3 tools/genera_es.py",
     "parells": parells}
(ARREL / "i18n" / "es" / f"{slug}.json").write_text(json.dumps(d, ensure_ascii=False, indent=1), encoding="utf-8")
print(slug, len(parells), "parells")
