#!/usr/bin/env python3
"""Genera les 4 animacions de Química (va + es) i les copia a l'arrel del lloc.
Ús: python3 tools/quimica/publica.py   (després: targeta a index.html i sitemap, ja fets)"""
import shutil, subprocess, sys, json
from pathlib import Path
HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
subprocess.run([sys.executable, str(HERE / "build.py")], check=True)
for s in json.loads((HERE / "config.json").read_text())["sims"]:
    slug = s["slug"]
    for sub in (Path(slug), Path("es") / slug):
        dst = ROOT / sub
        dst.mkdir(parents=True, exist_ok=True)
        shutil.copy(HERE / "dist" / sub / "index.html", dst / "index.html")
shutil.rmtree(HERE / "dist")
print("Pàgines copiades a l'arrel.")
