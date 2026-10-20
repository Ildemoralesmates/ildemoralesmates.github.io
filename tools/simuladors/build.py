#!/usr/bin/env python3
"""Ensambla cada simulador (src/<nom>.src.html) amb el CSS/JS comú -> tools/simuladors/.build/<nom>.html (ho crida genera.py)"""
import sys
from pathlib import Path
R = Path(__file__).resolve().parent
S = R / "src"
OUT = R / ".build"; OUT.mkdir(exist_ok=True)
css = (S / "common.css").read_text(encoding="utf-8")
js = (S / "common.js").read_text(encoding="utf-8")
qcss = (S / "quiz.css").read_text(encoding="utf-8")
qjs = (S / "quiz.js").read_text(encoding="utf-8")
scss = (S / "steps.css").read_text(encoding="utf-8")
sjs = (S / "steps.js").read_text(encoding="utf-8")
rcss = (S / "raona.css").read_text(encoding="utf-8")
rjs = (S / "raona.js").read_text(encoding="utf-8")
RAONA = ('<section class="card" id="reason"><h2><small data-i18n="rz_eyebrow"></small><span data-i18n="rz_title"></span></h2><p data-i18n="rz_intro"></p>'
         '<div class="seg tabs" id="rztabs" role="group" data-i18n-aria="aria.rz" aria-label=""><button type="button" data-t="M" aria-pressed="true" data-i18n="rz_tM"></button>'
         '<button type="button" data-t="S" aria-pressed="false" data-i18n="rz_tS"></button><button type="button" data-t="E" aria-pressed="false" data-i18n="rz_tE"></button>'
         '<button type="button" data-t="D" aria-pressed="false" data-i18n="rz_tD"></button></div>'
         '<div id="rzM" class="rzp"></div><div id="rzS" class="rzp" hidden></div><div id="rzE" class="rzp" hidden></div><div id="rzD" class="rzp" hidden></div></section>')
LANGSW = '<div class="seg langsw" role="group" aria-label="Idioma / Idioma"><button type="button" data-lang="ca" aria-pressed="true">Valencià</button><button type="button" data-lang="es" aria-pressed="false">Castellano</button></div>'
FOOT = ('<footer class="cc">© Ilde · <a href="https://ildemoralesmates.github.io/">Recursos de matemàtiques</a> · '
        '<a rel="license" href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a></footer>')
LVLSW = '<div class="seg" id="lvlsw" role="group" data-i18n-aria="aria.lvl" aria-label=""><button type="button" data-level="basic" data-i18n="lvl_basic"></button><button type="button" data-level="adv" data-i18n="lvl_adv"></button></div>'
QUIZ = ('<section class="card quizc" data-i18n-aria="aria.quiz" aria-label=""><h2><small data-i18n="quiz_eyebrow"></small><span data-i18n="quiz_title"></span></h2>'
        '<p class="score" id="score"></p><div id="quiz"></div><div><button class="btn" id="resetQuiz" type="button" data-i18n="reset_quiz"></button></div></section>')
GC = '<script data-goatcounter="https://ildemoralesmates.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>'
names = sys.argv[1:] or [p.name[:-9] for p in S.glob("*.src.html")]
for n in names:
    s = (S / f"{n}.src.html").read_text(encoding="utf-8")
    s = s.replace("/*@COMMON_CSS@*/", css).replace("/*@COMMON_JS@*/", js)
    s = s.replace("/*@QUIZ_CSS@*/", qcss).replace("/*@QUIZ_JS@*/", qjs).replace("/*@STEPS_CSS@*/", scss).replace("/*@STEPS_JS@*/", sjs).replace("/*@RAONA_CSS@*/", rcss).replace("/*@RAONA_JS@*/", rjs).replace("<!--@RAONA@-->", RAONA).replace("<!--@LVLSW@-->", LVLSW).replace("<!--@QUIZ@-->", QUIZ)
    s = s.replace("<!--@LANGSW@-->", LANGSW).replace("<!--@FOOTER@-->", FOOT).replace("<!--@GC@-->", GC)
    (OUT / f"{n}.html").write_text(s, encoding="utf-8")
    print("ok", n, len(s))
