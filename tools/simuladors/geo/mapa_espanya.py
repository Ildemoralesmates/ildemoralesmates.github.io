#!/usr/bin/env python3
"""Prepara la geometria del puzle «Mapa d'Espanya» -> tools/simuladors/src/mapa.geo.js

Font: Natural Earth 1:10m, «Admin 1 – States, Provinces» (domini públic, https://www.naturalearthdata.com).
Ús:  python3 tools/simuladors/geo/mapa_espanya.py <ne_10m_admin_1_states_provinces.geojson>
(el fitxer de Natural Earth no es guarda al repo; es baixa de naturalearthdata.com o de
 github.com/nvkelso/natural-earth-vector, carpeta geojson/).

Què fa: projecció cònica conforme de Lambert (paral·lels 37° i 43°), topologia per arcs compartits
(perquè les fronteres simplificades encaixen sense forats), simplificació Douglas-Peucker,
dissolució de províncies en comunitats i en el contorn d'Espanya, i Canàries en un requadre.
"""
import json, math, sys
from collections import defaultdict
from pathlib import Path

SRC = Path(sys.argv[1] if len(sys.argv) > 1 else 'ne_10m_admin_1_states_provinces.geojson')
OUT = Path(__file__).resolve().parent.parent / 'src' / 'mapa.geo.js'
CTX = ('PRT', 'FRA', 'AND', 'MAR', 'GIB', 'DZA')
TOL = 0.55          # tolerància de simplificació (unitats del viewBox)
S = 0.95            # unitats del viewBox per km

# ---------- projecció ----------
R = 6371.0
def lcc(lat1, lat2, lat0, lon0):
    f1, f2, f0 = map(math.radians, (lat1, lat2, lat0))
    n = math.log(math.cos(f1) / math.cos(f2)) / math.log(math.tan(math.pi/4 + f2/2) / math.tan(math.pi/4 + f1/2))
    F = math.cos(f1) * math.tan(math.pi/4 + f1/2) ** n / n
    r0 = R * F / math.tan(math.pi/4 + f0/2) ** n
    def p(lon, lat):
        r = R * F / math.tan(math.pi/4 + math.radians(lat)/2) ** n
        th = n * math.radians(lon - lon0)
        return (r * math.sin(th) * S, -(r0 - r * math.cos(th)) * S)
    return p
PEN = lcc(37, 43, 40, -3.5)
CAN = lcc(27.5, 29.5, 28.5, -15.7)

# ---------- dades ----------
G = json.load(open(SRC, encoding='utf-8'))
def rings_of(g):
    if g['type'] == 'Polygon': return [g['coordinates']]
    return g['coordinates']
def gbbox(g):
    xs = [c[0] for poly in rings_of(g) for r in poly for c in r]; ys = [c[1] for poly in rings_of(g) for r in poly for c in r]
    return min(xs), min(ys), max(xs), max(ys)
feats = []
for f in G['features']:
    a = f['properties']['adm0_a3']
    if a == 'ESP': feats.append(f)
    elif a in CTX:
        b = gbbox(f['geometry'])
        if b[2] > -10.5 and b[0] < 5.5 and b[3] > 34.3 and b[1] < 44.8: feats.append(f)

ISO = {  # codi ISO -> (id, comunitat)
 'C':'C','LU':'LU','OR':'OR','PO':'PO','O':'O','S':'S','BI':'BI','SS':'SS','VI':'VI','NA':'NA','LO':'LO',
 'HU':'HU','Z':'Z','TE':'TE','B':'B','GI':'GI','L':'L','T':'T','CS':'CS','V':'V','A':'A','MU':'MU',
 'AL':'AL','CA':'CA','CO':'CO','GR':'GR','H':'H','J':'J','MA':'MA','SE':'SE','BA':'BA','CC':'CC',
 'AB':'AB','CR':'CR','CU':'CU','GU':'GU','TO':'TO','M':'M','AV':'AV','BU':'BU','LE':'LE','P':'P',
 'SA':'SA','SG':'SG','SO':'SO','VA':'VA','ZA':'ZA','PM':'PM','GC':'GC','TF':'TF','CE':'CE','ML':'ML'}
COMM = {'AN':'AL CA CO GR H J MA SE','AR':'HU TE Z','AS':'O','IB':'PM','CN':'GC TF','CB':'S','CM':'AB CR CU GU TO',
        'CL':'AV BU LE P SA SG SO VA ZA','CT':'B GI L T','VC':'A CS V','EX':'BA CC','GA':'C LU OR PO','MD':'M',
        'MC':'MU','NC':'NA','PV':'BI SS VI','RI':'LO','CE':'CE','ML':'ML'}
P2C = {p: c for c, ps in COMM.items() for p in ps.split()}

# ---------- projecció i anells ----------
F = []   # {id, kind ('esp'|'ctx'), rings:[[key,...]], comm}
PT = {}  # key -> (x,y)
def key(lon, lat): return (round(lon, 7), round(lat, 7))
for f in feats:
    p = f['properties']; esp = p['adm0_a3'] == 'ESP'
    pid = p['iso_3166_2'].split('-')[1] if esp else None
    proj = CAN if pid in ('GC', 'TF') else PEN
    rings = []
    for poly in rings_of(f['geometry']):
        for r in poly:
            ks = []
            for lon, lat in r:
                k = key(lon, lat)
                if k not in PT: PT[k] = proj(lon, lat)
                if not ks or ks[-1] != k: ks.append(k)
            if ks[0] == ks[-1]: ks.pop()
            if len(ks) >= 3: rings.append(ks)
    F.append({'id': pid or (p['adm0_a3'] + ':' + p['name']), 'esp': esp, 'rings': rings, 'comm': P2C.get(pid)})
assert sum(f['esp'] for f in F) == 52 and all(f['comm'] for f in F if f['esp'])

# ---------- topologia: vèrtexs d'unió i arcs ----------
nb = defaultdict(set)
for f in F:
    for r in f['rings']:
        n = len(r)
        for i, k in enumerate(r): nb[k].add(r[i-1]); nb[k].add(r[(i+1) % n])
junc = {k for k, s in nb.items() if len(s) > 2}
ARCS = {}           # canonical tuple -> index
ARC_PTS = []        # llista de claus
ARC_OWN = []        # llista de (feature index, sentit)
def arc_id(seq):
    t = tuple(seq); rt = t[::-1]
    c, sgn = (t, 1) if t <= rt else (rt, -1)
    if c not in ARCS:
        ARCS[c] = len(ARC_PTS); ARC_PTS.append(list(c)); ARC_OWN.append([])
    return ARCS[c], sgn
FR = []  # per feature: llista d'anells; cada anell = llista de (arc, sentit)
for fi, f in enumerate(F):
    out = []
    for r in f['rings']:
        js = [i for i, k in enumerate(r) if k in junc]
        if not js:
            # anell sense unions: arc tancat, començant pel vèrtex mínim (canònic)
            i0 = min(range(len(r)), key=lambda i: r[i]); rr = r[i0:] + r[:i0]
            a, s = arc_id(rr + [rr[0]]); out.append([(a, s)]); ARC_OWN[a].append(fi); continue
        rr = r[js[0]:] + r[:js[0]]; js = [j - js[0] for j in js] + [len(r)]
        rr = rr + [rr[0]]
        ring = []
        for a0, a1 in zip(js, js[1:]):
            a, s = arc_id(rr[a0:a1+1]); ring.append((a, s)); ARC_OWN[a].append(fi)
        out.append(ring)
    FR.append(out)

# ---------- simplificació (Douglas-Peucker) ----------
def dp(pts, tol):
    if len(pts) < 3: return pts
    keep = [False]*len(pts); keep[0] = keep[-1] = True; st = [(0, len(pts)-1)]
    while st:
        a, b = st.pop(); (ax, ay), (bx, by) = pts[a], pts[b]; dx, dy = bx-ax, by-ay; L = math.hypot(dx, dy)
        best, bi = -1, -1
        for i in range(a+1, b):
            px, py = pts[i]
            d = abs(dx*(ay-py) - dy*(ax-px))/L if L > 1e-12 else math.hypot(px-ax, py-ay)
            if d > best: best, bi = d, i
        if best > tol: keep[bi] = True; st += [(a, bi), (bi, b)]
    return [p for p, k in zip(pts, keep) if k]
SIMP = []
for ks in ARC_PTS:
    pts = [PT[k] for k in ks]
    s = dp(pts, TOL)
    if ks[0] == ks[-1] and len(s) < 4:  # arc tancat: conserva almenys un triangle
        n = len(pts); s = [pts[0], pts[n//3], pts[2*n//3], pts[0]]
    SIMP.append(s)

def ring_pts(ring):
    out = []
    for a, s in ring:
        p = SIMP[a] if s == 1 else SIMP[a][::-1]
        out += p if not out else p[1:]
    return out
def area(p): return 0.5*sum(p[i-1][0]*p[i][1]-p[i][0]*p[i-1][1] for i in range(len(p)))
def fmt(v): s = f'{v:.1f}'; return s[:-2] if s.endswith('.0') else s
def path(rings):
    o = []
    for p in rings:
        if len(p) < 3: continue
        o.append('M' + 'L'.join(fmt(x)+','+fmt(y) for x, y in p) + 'Z')
    return ''.join(o)
def line(p): return 'M' + 'L'.join(fmt(x)+','+fmt(y) for x, y in p)

MINA = 2.5  # illots més menuts que això (unitats²) no es dibuixen
def feat_rings(fi):
    rs = [ring_pts(r) for r in FR[fi]]
    big = max(rs, key=lambda p: abs(area(p)))
    return [p for p in rs if p is big or abs(area(p)) >= MINA]

# ---------- dissolució: frontera d'un conjunt de features ----------
def dissolve(fis):
    fis = set(fis); cnt = defaultdict(int); used = []
    for fi in fis:
        for r in FR[fi]:
            for a, s in r: cnt[a] += 1; used.append((a, s))
    bnd = [(a, s) for a, s in used if cnt[a] == 1]
    # encadena arcs
    seg = []
    for a, s in bnd:
        p = SIMP[a] if s == 1 else SIMP[a][::-1]; seg.append(p)
    start = defaultdict(list)
    for i, p in enumerate(seg): start[p[0]].append(i)
    done = set(); rings = []
    for i in range(len(seg)):
        if i in done: continue
        ring = list(seg[i]); done.add(i); cur = seg[i][-1]
        while cur != ring[0]:
            nx = [j for j in start[cur] if j not in done]
            if not nx: break
            j = nx[0]; done.add(j); ring += seg[j][1:]; cur = seg[j][-1]
        rings.append(ring[:-1] if ring[0] == ring[-1] else ring)
    big = max(rings, key=lambda p: abs(area(p)))
    return [p for p in rings if p is big or abs(area(p)) >= MINA]

# ---------- punt per a l'etiqueta (aprox. «pol d'inaccessibilitat») ----------
def inside(x, y, rings):
    c = False
    for p in rings:
        n = len(p)
        for i in range(n):
            (x1, y1), (x2, y2) = p[i-1], p[i]
            if (y1 > y) != (y2 > y) and x < (x2-x1)*(y-y1)/(y2-y1)+x1: c = not c
    return c
def segdist(x, y, rings):
    best = 1e18
    for p in rings:
        for i in range(len(p)):
            (x1, y1), (x2, y2) = p[i-1], p[i]; dx, dy = x2-x1, y2-y1; L = dx*dx+dy*dy
            t = 0 if L == 0 else max(0, min(1, ((x-x1)*dx+(y-y1)*dy)/L))
            best = min(best, (x-x1-t*dx)**2 + (y-y1-t*dy)**2)
    return math.sqrt(best)
def label_pt(rings):
    big = max(rings, key=lambda p: abs(area(p)))
    xs = [x for x, _ in big]; ys = [y for _, y in big]
    best, bp = -1, (sum(xs)/len(xs), sum(ys)/len(ys))
    for step in (12, 4, 1.5):
        cx, cy = bp if best >= 0 else ((min(xs)+max(xs))/2, (min(ys)+max(ys))/2)
        rx = (max(xs)-min(xs))/2 if step == 12 else step*6; ry = (max(ys)-min(ys))/2 if step == 12 else step*6
        y = cy - ry
        while y <= cy + ry:
            x = cx - rx
            while x <= cx + rx:
                if inside(x, y, [big]):
                    d = segdist(x, y, [big])
                    if d > best: best, bp = d, (x, y)
                x += step
            y += step
    return bp
def bb(rings):
    xs = [x for p in rings for x, _ in p]; ys = [y for p in rings for _, y in p]
    return [min(xs), min(ys), max(xs)-min(xs), max(ys)-min(ys)]

# ---------- col·locació: península, Canàries (requadre) ----------
esp = [i for i, f in enumerate(F) if f['esp']]
can = [i for i in esp if F[i]['id'] in ('GC', 'TF')]
pen = [i for i in esp if i not in can]
penR = [p for i in pen for p in feat_rings(i)]
x0, y0, w0, h0 = bb(penR)
canR = [p for i in can for p in feat_rings(i)]
cx0, cy0, cw, ch = bb(canR)
PAD = 14
K = 0.85            # escala del requadre de Canàries
# requadre de Canàries a l'Atlàntic, al sud-oest: cantó superior dret just a l'oest de la costa de Cadis
rx, ty = PEN(-6.75, 36.85)
iw, ih = cw*K + 2*PAD, ch*K + 2*PAD
INS = [rx - iw, ty, iw, ih]
def tf_can(x, y): return (INS[0] + PAD + (x - cx0)*K, INS[1] + PAD + (y - cy0)*K)
def shift_can(rings): return [[tf_can(x, y) for x, y in p] for p in rings]
def geom(i):
    rs = feat_rings(i)
    return shift_can(rs) if i in can else rs

# vista global (viewBox); la safata de peces ocupa la mar al sud de les Balears (sobre Algèria)
left = min(x0, INS[0]) - 6; top = y0 - 16
right = x0 + w0 + PAD + 60; bottom = max(y0 + h0, INS[1] + INS[3]) + 8
dx_, dy_ = PEN(0.05, 38.3)
DOCK = [dx_, dy_, right - 6 - dx_, bottom - 6 - dy_]
VB = [left, top, right - left, bottom - top]
OX, OY = -VB[0], -VB[1]   # trasllada perquè el viewBox comence en (0,0)
def T(rings): return [[(x+OX, y+OY) for x, y in p] for p in rings]
VB = [0, 0, round(VB[2]), round(VB[3])]

out = {'vb': VB, 'ins': [round(INS[0]+OX, 1), round(INS[1]+OY, 1), round(INS[2], 1), round(INS[3], 1)], 'dock': [round(DOCK[0]+OX, 1), round(DOCK[1]+OY, 1), round(DOCK[2], 1), round(DOCK[3], 1)], 'prov': {}, 'comm': {}}
for i in esp:
    rs = T(geom(i)); lp = label_pt(rs)
    out['prov'][F[i]['id']] = {'c': F[i]['comm'], 'd': path(rs), 'bb': [round(v, 1) for v in bb(rs)], 'lp': [round(lp[0], 1), round(lp[1], 1)]}
for c, ps in COMM.items():
    fis = [i for i in esp if F[i]['comm'] == c]
    rs = dissolve(fis)
    if c == 'CN': rs = shift_can(rs)
    rs = T(rs); lp = label_pt(rs)
    out['comm'][c] = {'p': ps.split(), 'd': path(rs), 'bb': [round(v, 1) for v in bb(rs)], 'lp': [round(lp[0], 1), round(lp[1], 1)]}

# línies de frontera (un sol camí per a cada nivell), península i Canàries per separat
def lines(pred):
    o = []
    for a, own in enumerate(ARC_OWN):
        es = [fi for fi in own if F[fi]['esp']]
        if not es or not pred(a, own, es): continue
        p = SIMP[a]
        if any(F[fi]['id'] in ('GC', 'TF') for fi in es): p = [tf_can(x, y) for x, y in p]
        o.append(line([(x+OX, y+OY) for x, y in p]))
    return ''.join(o)
out['bProv'] = lines(lambda a, own, es: True)
out['bComm'] = lines(lambda a, own, es: len({F[fi]['comm'] for fi in es}) > 1 or len(own) == 1 or len(es) < len(own))
out['bNat'] = lines(lambda a, own, es: len(es) < len(own))          # frontera terrestre amb altres estats
# contorn d'Espanya (terra) per al fons
land = dissolve(pen); landC = shift_can(dissolve(can))
out['land'] = path(T(land)) + path(T(landC))
# context: països veïns (gris), retallats a la vista
ctx = [i for i, f in enumerate(F) if not f['esp']]
out['ctx'] = path(T(dissolve(ctx)))

# veïnatges (per a comprovar les activitats)
adj = defaultdict(set)
for a, own in enumerate(ARC_OWN):
    es = [F[fi]['id'] for fi in own if F[fi]['esp']]
    for u in es:
        for v in es:
            if u != v: adj[u].add(v)
out['adj'] = {k: sorted(v) for k, v in sorted(adj.items())}

js = '/* Geometria generada per tools/simuladors/geo/mapa_espanya.py a partir de Natural Earth (domini públic). No editar a mà. */\nconst GEO=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n'
OUT.write_text(js, encoding='utf-8')
print('ok', OUT, len(js), 'bytes; viewBox', VB, '; arcs', len(SIMP), 'unions', len(junc))
