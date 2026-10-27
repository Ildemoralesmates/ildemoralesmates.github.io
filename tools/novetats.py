#!/usr/bin/env python3
"""Manté novetats.json, que alimenta el bloc «Últimes pàgines afegides» de la portada.

Ús:
  python3 tools/novetats.py <slug>                      recurs retocat: data = avui i puja al capdamunt
  python3 tools/novetats.py <slug> --t "Títol" --d "Descripció breu" --cat mates
                                                        recurs nou: alta = data = avui
  python3 tools/novetats.py --check                     avisa dels recursos de la portada que falten al JSON

La data és la del dia en què s'afegeix o es retoca (hora de Madrid). Una descripció breu = una frase d'uns 100 caràcters.
"""
import argparse, json, re, sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
FITXER = ROOT / 'novetats.json'
INDEX = ROOT / 'index.html'


def carrega():
    return json.loads(FITXER.read_text(encoding='utf-8')) if FITXER.exists() else []


def desa(dades):
    FITXER.write_text(json.dumps(dades, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')


def hrefs_portada():
    src = INDEX.read_text(encoding='utf-8')
    bloc = src[src.index('const RES = ['):src.index('const NIVELLS')]
    return re.findall(r"href: '([^']+)'", bloc)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('slug', nargs='?', help="carpeta del recurs, p. ex. thales (amb o sense barra final)")
    ap.add_argument('--t', help='títol (només per a un recurs nou)')
    ap.add_argument('--d', help='descripció breu (només per a un recurs nou)')
    ap.add_argument('--cat', help="id de matèria: mates, fisica, quimica, biologia, geologia, geo, tecno, jocs, curio, misc")
    ap.add_argument('--check', action='store_true')
    a = ap.parse_args()

    dades = carrega()
    if a.check:
        tinc = {x['href'] for x in dades}
        falten = [h for h in hrefs_portada() if h not in tinc]
        print('Tot en ordre.' if not falten else 'Falten a novetats.json: ' + ', '.join(falten))
        return 1 if falten else 0
    if not a.slug:
        ap.error('cal el slug del recurs (o --check)')

    avui = datetime.now(ZoneInfo('Europe/Madrid')).strftime('%Y-%m-%d')
    href = a.slug.strip('/') + '/'
    i = next((k for k, x in enumerate(dades) if x['href'] == href), None)
    if i is None:
        if not (a.t and a.d and a.cat):
            ap.error(f'«{href}» no és a novetats.json: per a un recurs nou calen --t, --d i --cat')
        dades.insert(0, {'href': href, 'cat': a.cat, 't': a.t, 'd': a.d, 'alta': avui, 'data': avui})
        print(f'Nou: {href} ({avui})')
    else:
        x = dades.pop(i)
        x['data'] = avui
        if a.t: x['t'] = a.t
        if a.d: x['d'] = a.d
        if a.cat: x['cat'] = a.cat
        dades.insert(0, x)
        print(f'Retocat: {href} ({avui})')
    desa(dades)
    return 0


if __name__ == '__main__':
    sys.exit(main())
