#!/usr/bin/env python3
"""Comprova les versions castellanes: errors de JS, restes de valencià al text visible i captura.
Ús:  python3 tools/verifica_es.py <slug>... [--shots carpeta]   (cal Playwright)"""
import re, sys, subprocess, time
from pathlib import Path
from playwright.sync_api import sync_playwright
ARREL = Path(__file__).resolve().parent.parent
args = sys.argv[1:]; shots = None
if "--shots" in args: i = args.index("--shots"); shots = Path(args[i+1]); args = args[:i] + args[i+2:]
RES = re.compile(r"[àèòïç]|·l|\b(els|amb|és|dels|seua|seues|per a|això|també|però|aquest[ae]?s?|tots|cada un)\b|\bl'|\bd'", re.I)
srv = subprocess.Popen([sys.executable, "-m", "http.server", "8799"], cwd=ARREL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        for slug in args:
            for ver, url in (("ca", f"http://localhost:8799/{slug}/"), ("es", f"http://localhost:8799/es/{slug}/")):
                pg = b.new_page(viewport={"width": 1100, "height": 900}); errs = []
                pg.on("pageerror", lambda e: errs.append(str(e)))
                pg.goto(url); pg.wait_for_timeout(700)
                txt = pg.evaluate("document.body.innerText")
                if ver == "es":
                    rest = sorted({l.strip()[:90] for l in txt.splitlines() if RES.search(l)})
                    print(f"{slug} es: html lang={pg.evaluate('document.documentElement.lang')} errs={errs} title={pg.title()!r} restes={len(rest)}")
                    for r in rest[:12]: print("    ?", r)
                    if shots: shots.mkdir(parents=True, exist_ok=True); pg.screenshot(path=str(shots / f"{slug}.es.png"))
                else:
                    print(f"{slug} ca: errs={errs}")
                pg.close()
        b.close()
finally:
    srv.terminate()
