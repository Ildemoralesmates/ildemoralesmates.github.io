#!/usr/bin/env python3
"""Genera els diccionaris opcionals del joc «Xifres i lletres».

  python3 tools/simuladors/dicc/genera_diccionaris.py <catalan-dict-tools> <LibreOffice-dictionaries>

  <catalan-dict-tools>        clon de https://github.com/Softcatala/catalan-dict-tools  (LGPL 2.1 / GPL 2)
  <LibreOffice-dictionaries>  clon de https://github.com/LibreOffice/dictionaries       (es/: RLA-ES, GPL 3 / LGPL 3 / MPL 1.1)

Escriu xifres-i-lletres/diccionari-ca.txt i diccionari-es.txt: una paraula per línia, formes flexionades,
de 2 a 9 lletres, sense noms propis, sigles ni paraules amb guió o apòstrof, i una sola forma per cada
combinació de lletres sense accents (que és com juga el joc).
"""
import re, sys, unicodedata, pathlib, datetime

ROOT = pathlib.Path(__file__).resolve().parents[3]
OUT = ROOT / 'xifres-i-lletres'

# Paraules malsonants que no volem veure a la pissarra (per lema). Llista curta, no exhaustiva.
STOP_CA = set('puta puto putejar putada cony fotre follar merda cabró cabrona gilipolles polla maricó marica colló collonut collonada xona'.split())
STOP_ES = set('puta puto putear putada puticlub putón coño joder follar mierda cabrón cabrona gilipollas gilipollez polla maricón marica cojón cojonudo chocho hijoputa'.split())

def norm(s):
    s = s.upper().replace('Ñ', '\x01').replace('Ç', '\x02')
    s = ''.join(c for c in unicodedata.normalize('NFD', s) if not unicodedata.combining(c))
    s = re.sub(r'[^A-Z\x01\x02]', '', s)
    return s.replace('\x01', 'Ñ').replace('\x02', 'Ç')

OKW = re.compile(r'^[a-zàáèéíïòóúüçñ·]+$')
def keep(w):
    """Paraula admissible (minúscules, només lletres) -> forma normalitzada o None."""
    if not OKW.match(w): return None
    n = norm(w)
    if not re.search('[AEIOUY]', n): return None          # abreviatures (cm, kg, vs…)
    return n if 2 <= len(n) <= 9 else None

def write(lang, forms, header):
    best = {}
    for w in forms:
        n = keep(w)
        if n is None: continue
        if n not in best or w < best[n]: best[n] = w
    words = sorted(best.values(), key=lambda w: (norm(w), w))
    p = OUT / f'diccionari-{lang}.txt'
    p.write_text(''.join('# ' + h + '\n' for h in header) + '\n'.join(words) + '\n', encoding='utf-8')
    print(lang, len(words), 'paraules', round(p.stat().st_size / 1e6, 2), 'MB')

# ---------- valencià / català: llista de formes de LanguageTool (Softcatalà) ----------
def catala(src):
    forms = set()
    for name in ('diccionari.txt', 'diccionari-dnv.txt'):
        for line in (src / 'resultats' / 'lt' / name).open(encoding='utf-8'):
            f = line.split()
            if len(f) != 3: continue
            form, lemma, tag = f
            if tag.startswith('NP') or tag == 'Y' or lemma in STOP_CA or form in STOP_CA: continue   # noms propis, abreviatures
            if tag[0] == 'V' and tag[-1] == 'B': continue      # formes verbals només balears
            forms.add(form)
    return forms

# ---------- castellà: expansió del diccionari Hunspell es_ES (RLA-ES) ----------
def castella(src):
    aff = (src / 'es' / 'es_ES.aff').read_text(encoding='utf-8')
    rules = {}                                   # flag -> (tipus, creuat, [(strip, add, cont, regex)])
    for line in aff.splitlines():
        f = line.split()
        if len(f) < 4 or f[0] not in ('SFX', 'PFX'): continue
        if len(f) == 4 and f[3].isdigit():
            rules[f[1]] = (f[0], f[2] == 'Y', []); continue
        strip = '' if f[2] == '0' else f[2]
        add, _, cont = f[3].partition('/')
        add = '' if add == '0' else add
        cond = f[4] if len(f) > 4 else '.'
        rx = re.compile((cond + '$') if f[0] == 'SFX' else ('^' + cond))
        rules[f[1]][2].append((strip, add, cont, rx))
    def sfx(word, flag):
        kind, cross, rs = rules[flag]
        for strip, add, cont, rx in rs:
            if kind == 'SFX' and word.endswith(strip) and rx.search(word):
                yield word[:len(word) - len(strip)] + add, cont, cross
    def pfx(word, flag):
        kind, cross, rs = rules[flag]
        for strip, add, cont, rx in rs:
            if kind == 'PFX' and word.startswith(strip) and rx.search(word):
                yield add + word[len(strip):]
    forms = set()
    lines = (src / 'es' / 'es_ES.dic').read_text(encoding='utf-8').splitlines()[1:]
    for line in lines:
        word, _, flags = line.strip().partition('/')
        if not word or word[0].isupper() or word in STOP_ES: continue
        flags = [c for c in flags if c in rules]
        out, crossable = {word}, {word}
        for fl in flags:
            for w2, cont, cross in sfx(word, fl):
                out.add(w2)
                if cross: crossable.add(w2)
                for c2 in cont:                               # sufix doble (p. ex. -ción + -es)
                    if c2 in rules:
                        for w3, _, cr3 in sfx(w2, c2):
                            out.add(w3)
                            if cross and cr3: crossable.add(w3)
        for fl in flags:
            if rules[fl][0] == 'PFX':
                for base in list(crossable):
                    out.update(pfx(base, fl))
        forms |= out
    return forms

if __name__ == '__main__':
    ca_src, es_src = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
    avui = datetime.date.today().isoformat()
    write('ca', catala(ca_src), [
        'Diccionari del joc «Xifres i lletres» (valencià/català). Generat el ' + avui + ' amb tools/simuladors/dicc/genera_diccionaris.py',
        'Font: diccionari de formes de Softcatalà (https://github.com/Softcatala/catalan-dict-tools), amb les entrades del DNV.',
        'Llicència: LGPL 2.1 / GPL 2 (la de la font). Formes de 2 a 9 lletres; sense noms propis ni formes només balears.'])
    write('es', castella(es_src), [
        'Diccionario del juego «Cifras y letras» (castellano). Generado el ' + avui + ' con tools/simuladors/dicc/genera_diccionaris.py',
        'Fuente: diccionario Hunspell es_ES del proyecto RLA-ES (https://github.com/LibreOffice/dictionaries, carpeta es/), expandido a formas.',
        'Licencia: GPL 3 / LGPL 3 / MPL 1.1 (la de la fuente). Formas de 2 a 9 letras; sin nombres propios.'])
