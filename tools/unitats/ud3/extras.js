// Contingut només web de la UD 3: pla, pàgines del dossier, animacions, figures i tasques «Raona-ho».
// El text de les sessions ve del dossier (content.json); ací només hi ha el que no va en paper.
const BASE = 'https://ildemoralesmates.github.io/';

// ---------- figures (SVG generat) ----------
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

// recta numèrica doble: stages = { n: { ticks:[[x, dalt, baix, cls]], arcs:[[a, b, etiqueta, 'top'|'bot'|'both']], cap, ok } }
function dnl(cfg) {
  const L = 60, R = 740, X = x => L + (x / cfg.xmax) * (R - L), T = 92, B = 160;
  const svg = st => {
    const tick = ([x, top, bot, cls = '']) => `<line class="tk" x1="${X(x)}" y1="${T - 8}" x2="${X(x)}" y2="${T + 8}"/><line class="tk" x1="${X(x)}" y1="${B - 8}" x2="${X(x)}" y2="${B + 8}"/>
      <text class="lb ${cls}" x="${X(x)}" y="${T - 14}" text-anchor="middle">${esc(top)}</text><text class="lb ${cls}" x="${X(x)}" y="${B + 26}" text-anchor="middle">${esc(bot)}</text>`;
    const arc = (a, b, lab, side = 'both') => {
      const one = (y, up) => { const m = (X(a) + X(b)) / 2, h = up ? y - 34 : y + 34;
        return `<path class="ar" d="M${X(a)} ${y} Q${m} ${h} ${X(b)} ${y}" marker-end="url(#mk)"/><text class="op" x="${m}" y="${up ? h + 8 : h - 2}" text-anchor="middle">${esc(lab)}</text>`; };
      return (side !== 'bot' ? one(T - 30, true) : '') + (side !== 'top' ? one(B + 32, false) : '');
    };
    return `<svg viewBox="0 0 800 254" role="img" aria-label="${esc(cfg.aria)}"><defs><marker id="mk" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="var(--ok)"/></marker></defs>
      <line class="ax" x1="${L - 10}" y1="${T}" x2="${R + 10}" y2="${T}"/><line class="ax" x1="${L - 10}" y1="${B}" x2="${R + 10}" y2="${B}"/>
      <text class="un" x="${R + 16}" y="${T + 5}">${esc(cfg.units[0])}</text><text class="un" x="${R + 16}" y="${B + 5}">${esc(cfg.units[1])}</text>
      ${st.ticks.map(tick).join('')}${(st.arcs || []).map(a => arc(...a)).join('')}
      ${st.ok ? `<text class="ok" x="${R}" y="${B + 84}" text-anchor="end">${esc(st.ok)}</text>` : ''}
      <text class="cap" x="${L}" y="${B + 84}">${esc(st.cap || '')}</text></svg>`;
  };
  const keys = Object.keys(cfg.stages).map(Number).sort((a, b) => a - b);
  return `<div class="fig dnl"${cfg.sync ? ' data-sync="1"' : ''}>${keys.map(k => `<div class="stage" data-st="${k}">${svg(cfg.stages[k])}</div>`).join('')}</div>`;
}

// columnes de pintors × dies (inversa)
function bars() {
  const u = 4.6, w = 20, g = 3, base = 210;
  const grp = (x0, n, d, lab) => Array.from({ length: n }, (_, i) => `<rect class="bar" x="${x0 + i * (w + g)}" y="${base - d * u}" width="${w}" height="${d * u}" rx="2"/>`).join('')
    + `<text class="lb" x="${x0 + (n * (w + g) - g) / 2}" y="${base + 22}" text-anchor="middle">${lab}</text>`
    + `<text class="un" x="${x0 + (n * (w + g) - g) / 2}" y="${base - d * u - 8}" text-anchor="middle">${d} dies</text>`;
  const A = grp(80, 3, 12, '3 pintors'), Bc = grp(330, 1, 36, '1 pintor'), Cc = grp(520, 4, 9, '4 pintors');
  const svg = (parts, cap, ok) => `<svg viewBox="0 0 800 260" role="img" aria-label="Columnes: 3 pintors per 12 dies, 1 pintor per 36 dies i 4 pintors per 9 dies">
    <line class="ax" x1="40" y1="210" x2="760" y2="210"/>${parts}<text class="cap" x="40" y="252">${esc(cap)}</text>${ok ? `<text class="ok" x="760" y="252" text-anchor="end">${esc(ok)}</text>` : ''}</svg>`;
  return `<div class="fig dnl" data-sync="1">
    <div class="stage" data-st="2">${svg(A, '3 pintors × 12 dies: cada columna és un pintor.')}</div>
    <div class="stage" data-st="3">${svg(A + Bc, 'Un sol pintor ha de fer tota la faena: 3 · 12 = 36 dies.')}</div>
    <div class="stage" data-st="4">${svg(A + Bc + Cc, '4 pintors es reparteixen els 36 dies: 36 : 4 = 9 dies.')}</div>
    <div class="stage" data-st="5">${svg(A + Bc + Cc, 'La «quantitat de faena» és la mateixa en els tres casos.', '3 · 12 = 1 · 36 = 4 · 9 = 36 ✓')}</div></div>`;
}

// gràfica genèrica
function graph({ xmax, ymax, xstep = 1, ystep = 1, ylab = 2, lines = [], curves = [], pts = [], labels = [], xname, yname, aria, cap }) {
  const L = 44, Rr = 340, Tt = 20, Bb = 220, X = x => L + x / xmax * (Rr - L), Y = y => Bb - y / ymax * (Bb - Tt);
  let g = '';
  for (let x = xstep; x <= xmax; x += xstep) g += `<line class="gd" x1="${X(x)}" y1="${Y(0)}" x2="${X(x)}" y2="${Y(ymax)}"/><text class="la" x="${X(x)}" y="${Y(0) + 15}" text-anchor="middle">${x}</text>`;
  for (let y = ystep, i = 1; y <= ymax; y += ystep, i++) g += `<line class="gd" x1="${X(0)}" y1="${Y(y)}" x2="${X(xmax)}" y2="${Y(y)}"/>` + (i % ylab === 0 ? `<text class="la" x="${X(0) - 7}" y="${Y(y) + 4}" text-anchor="end">${y}</text>` : '');
  const ln = lines.map(([x1, y1, x2, y2, c]) => `<line class="l${c}" x1="${X(x1)}" y1="${Y(y1)}" x2="${X(x2)}" y2="${Y(y2)}"/>`).join('');
  const cv = curves.map(([f, a, b, c]) => { let d = ''; for (let i = 0; i <= 60; i++) { const x = a + (b - a) * i / 60; d += (i ? ' L' : 'M') + X(x).toFixed(1) + ' ' + Y(f(x)).toFixed(1); } return `<path class="l${c}" fill="none" d="${d}"/>`; }).join('');
  const pp = pts.map(([x, y, c]) => `<circle class="p${c}" cx="${X(x)}" cy="${Y(y)}" r="4"/>`).join('');
  const lb = labels.map(([x, y, t, c]) => `<text class="t${c}" x="${X(x)}" y="${Y(y)}">${esc(t)}</text>`).join('');
  return `<figure class="fig"><svg class="grf" viewBox="0 0 360 250" role="img" aria-label="${esc(aria)}">${g}
    <line class="ax" x1="${X(0)}" y1="${Y(0)}" x2="${X(xmax) + 8}" y2="${Y(0)}"/><line class="ax" x1="${X(0)}" y1="${Y(0)}" x2="${X(0)}" y2="${Y(ymax) - 8}"/>
    <text class="la" x="${X(xmax) + 8}" y="${Y(0) + 30}" text-anchor="end">${esc(xname)}</text><text class="la" x="${X(0) + 6}" y="${Y(ymax) - 2}">${esc(yname)}</text>
    ${ln}${cv}${pp}${lb}</svg><figcaption>${cap}</figcaption></figure>`;
}

// gots de granissat (S1)
function glasses() {
  const glass = (x, suc, aigua, name) => {
    const h = 16, n = suc + aigua, top = 200 - n * h;
    let r = '';
    for (let i = 0; i < n; i++) r += `<rect class="${i < suc ? 'suc' : 'aig'}" x="${x}" y="${200 - (i + 1) * h}" width="70" height="${h}"/>`;
    return r + `<path class="st" d="M${x - 4} ${top - 10} L${x - 4} 202 L${x + 74} 202 L${x + 74} ${top - 10}"/>
      <text class="lb" x="${x + 35}" y="226" text-anchor="middle">${name}</text><text class="un" x="${x + 35}" y="244" text-anchor="middle">${suc} de suc · ${aigua} d'aigua</text>`;
  };
  return `<figure class="fig"><svg class="ill" viewBox="0 0 300 250" role="img" aria-label="Got de la Laia amb 2 parts de suc i 3 d'aigua; got del Pau amb 3 de suc i 5 d'aigua">
    ${glass(40, 2, 3, 'Laia')}${glass(190, 3, 5, 'Pau')}</svg><figcaption>Verd: suc de llima. Blau: aigua.</figcaption></figure>`;
}

// barra del repartiment (S5)
function repBar() {
  const parts = [['Anna', 10, 'c1', 250], ['Berta', 6, 'c2', 150], ['Carla', 4, 'c3', 100]];
  const cw = 34, x0 = 60; let x = x0, r = '', i = 0;
  parts.forEach(([n, k, c, e]) => {
    for (let j = 0; j < k; j++, i++) r += `<rect class="${c}" x="${x0 + i * cw}" y="60" width="${cw - 2}" height="44" rx="3"/><text class="mini" x="${x0 + i * cw + cw / 2 - 1}" y="87" text-anchor="middle">25</text>`;
    const w = k * cw; r += `<text class="lb" x="${x + w / 2}" y="44" text-anchor="middle">${n}: ${k} €</text><text class="ok" x="${x + w / 2}" y="134" text-anchor="middle">${e} €</text>`; x += w;
  });
  return `<figure class="fig"><svg class="ill rep" viewBox="0 0 800 160" role="img" aria-label="Barra de 20 parts: 10 de l'Anna, 6 de la Berta i 4 de la Carla, 25 euros cadascuna">${r}</svg>
    <figcaption>500 € en 20 parts: cada euro posat són 25 € de premi.</figcaption></figure>`;
}

// il·lustracions de la sessió 2 (al costat de cada taula)
const ILL2 = [
  `<svg class="ill" viewBox="0 0 120 100" role="img" aria-label="Balança amb taronges que marca 1,50 euros el quilo">
    <circle class="or" cx="47" cy="50" r="9"/><circle class="or" cx="63" cy="50" r="9"/><circle class="or" cx="79" cy="50" r="9"/><circle class="or" cx="55" cy="36" r="8.5"/><circle class="or" cx="71" cy="36" r="8.5"/>
    <path class="st" d="M22 60 Q63 72 104 60"/><line class="st" x1="63" y1="66" x2="63" y2="72"/>
    <rect class="fl" x="22" y="72" width="82" height="22" rx="5"/><rect class="scr" x="36" y="76" width="54" height="14" rx="2"/>
    <text class="lcd" x="63" y="87" font-size="9.5" text-anchor="middle">1,50 €/kg</text></svg>`,
  `<svg class="ill" viewBox="0 0 120 100" role="img" aria-label="Taxi parat amb el taxímetre marcant 3 euros abans de començar">
    <rect class="scr" x="4" y="4" width="70" height="20" rx="3"/><text class="lcd" x="39" y="18.5" font-size="11" text-anchor="middle">3,00 €</text>
    <text class="mut" x="78" y="13" font-size="9">0 km</text><text class="mut" x="78" y="23" font-size="8">(parat)</text>
    <path class="fl" d="M32 56 L44 40 H80 L92 56 Z"/><rect class="yl" x="52" y="33" width="20" height="7" rx="1.5"/>
    <rect class="fl" x="10" y="56" width="104" height="24" rx="8"/>
    <circle class="ink" cx="34" cy="82" r="9"/><circle class="ink" cx="90" cy="82" r="9"/></svg>`,
  `<svg class="ill" viewBox="0 0 120 100" role="img" aria-label="Xiqueta mesurant-se l'alçada al costat d'un regle">
    <rect class="fl" x="76" y="6" width="20" height="90" rx="2"/>
    ${[14, 24, 34, 44, 54, 64, 74, 84].map((y, i) => `<line class="tick" x1="76" y1="${y}" x2="${i % 2 ? 84 : 88}" y2="${y}"/>`).join('')}
    <circle class="fl" cx="46" cy="24" r="8"/><line class="st" x1="46" y1="32" x2="46" y2="62"/><line class="st" x1="46" y1="40" x2="34" y2="54"/><line class="st" x1="46" y1="40" x2="58" y2="54"/>
    <line class="st" x1="46" y1="62" x2="37" y2="94"/><line class="st" x1="46" y1="62" x2="55" y2="94"/>
    <line class="st" x1="40" y1="15" x2="76" y2="15" stroke-dasharray="3 3"/></svg>`,
];

const ICO2 = {
  'Problema A': '<svg class="ill ico" viewBox="0 0 24 24" aria-hidden="true"><rect class="fl" x="6" y="2.5" width="12" height="6" rx="1"/><rect class="fl" x="2.5" y="8.5" width="19" height="9" rx="2"/><rect class="fl" x="7" y="14" width="10" height="7.5"/></svg>',
  'Problema B': '<svg class="ill ico" viewBox="0 0 24 24" aria-hidden="true"><path class="st" d="M8 6c0-2 2-2 2-4M13 6c0-2 2-2 2-4"/><path class="fl" d="M3.5 10h17v6a4 4 0 0 1-4 4h-9a4 4 0 0 1-4-4z"/><path class="st" d="M1.5 11.5h2M20.5 11.5h2"/></svg>',
  'Problema C': '<svg class="ill ico" viewBox="0 0 24 24" aria-hidden="true"><path class="fl" d="M6 11 8.5 6h7L18 11"/><rect class="fl" x="2.5" y="11" width="19" height="6" rx="2"/><circle class="ink" cx="7" cy="18" r="2.4"/><circle class="ink" cx="17" cy="18" r="2.4"/></svg>',
  'Problema D': '<svg class="ill ico" viewBox="0 0 24 24" aria-hidden="true"><path class="fl" d="M15.5 3.5l5 5L9 20H4v-5z"/><path class="st" d="M13.5 5.5l5 5"/></svg>',
};

// ---------- per sessió ----------
const S = {
  S1: {
    file: 'sessio-1.html', short: 'Raons',
    plan: [['5′', 'Per a pensar'], ['15′', 'Recorda i exemple resolt'], ['28′', 'Exercicis'], ['7′', 'Eixida: 2 preguntes']], pages: '1–2',
    figs: [{ at: 'h2:Per a pensar', html: glasses() }],
    raona: [
      { ty: 'Qui té raó?', q: 'La Laia posa 2 gots de suc per 3 d\'aigua; el Pau, 3 de suc per 5 d\'aigua. El Pau diu que el seu té més gust de llima perquè hi ha més suc. Quin és més fort?', o: ['El de la Laia', 'El del Pau', 'Són iguals'], c: 0, why: 'Laia: 2 : 3 ≈ 0,67 de suc per got d\'aigua. Pau: 3 : 5 = 0,6. El de la Laia és més fort: cal comparar raons, no quantitats.' },
      { ty: 'Tria l\'expressió que modela', q: 'La raó farina/sucre d\'una recepta és 5/2. Quina proporció permet calcular el sucre x si tens 750 g de farina?', o: ['5/2 = 750/x', '5/2 = x/750', '2/5 = 750/x', '5 + 2 = 750 + x'], c: 0, why: 'Les dues raons han de comparar el mateix i en el mateix ordre: farina entre sucre. Ix x = 300 g.' },
      { ty: 'Sempre, a vegades o mai?', q: '«Si dues raons tenen el mateix numerador, són iguals.»', o: ['Sempre', 'A vegades', 'Mai'], c: 1, why: 'A vegades: 3/4 i 3/4 sí, però 3/4 i 3/5 no. Cal comprovar els productes en creu.' },
    ],
  },
  S2: {
    file: 'sessio-2.html', short: 'Directa (I)',
    plan: [['12′', 'Per a pensar + animació'], ['15′', 'Exemple resolt'], ['23′', 'Ara tu (A–D)'], ['5′', 'Tancament']], pages: '3–5',
    anim: { url: BASE + 'proporcionalitat/', text: 'Tria el context de les **taronges** i mou el control: el quocient (la «raó» dels dos gots) no canvia mai. Després prova el **taxi**: per què ara el quocient sí que canvia?' },
    ptableIll: ILL2, icons: ICO2,
    figs: [
      { at: 'box', html: graph({ xmax: 5, ymax: 9, lines: [[0, 0, 5, 7.5, 1], [0, 3, 5, 8, 2]], pts: [[0, 0, 1], [1, 1.5, 1], [2, 3, 1], [3, 4.5, 1], [4, 6, 1], [0, 3, 2], [1, 4, 2], [2, 5, 2], [3, 6, 2], [4, 7, 2]], labels: [[3.2, 3.6, 'taronges: y = 1,5 · x', 1], [0.3, 7.2, 'taxi: y = 3 + x', 2]], xname: 'kg o km', yname: '€', aria: 'Gràfica: la recta de les taronges passa per l\'origen; la del taxi comença en 3 euros', cap: 'La proporcionalitat directa és una recta que <b>passa per l\'origen</b>: 0 kg, 0 €. La del taxi comença en 3 €.' }) },
      { at: 'worked', html: dnl({ xmax: 9, units: ['kg', '€'], sync: true, aria: 'Recta numèrica doble de quilos i euros', stages: {
        2: { ticks: [[0, '0', '0'], [5, '5', '6,50'], [8, '8', '?', 'q']], cap: 'Cada quantitat de quilos té el seu preu just davall.' },
        3: { ticks: [[0, '0', '0'], [5, '5', '6,50'], [8, '8', '?', 'q'], [1, '1', '1,30', 'hl']], arcs: [[5, 1, ': 5']], cap: 'Dividim per 5 dalt i baix: 1 kg costa 1,30 €.' },
        4: { ticks: [[0, '0', '0'], [5, '5', '6,50'], [1, '1', '1,30', 'hl'], [8, '8', '10,40', 'hl']], arcs: [[1, 8, '· 8']], cap: 'Multipliquem per 8 dalt i baix: 8 kg costen 10,40 €.' },
        5: { ticks: [[0, '0', '0'], [5, '5', '6,50'], [1, '1', '1,30', 'hl'], [8, '8', '10,40', 'hl']], ok: '10,40 : 8 = 1,30 ✓', cap: 'Comprovem: el quocient continua sent 1,30 €/kg.' } } }) },
    ],
    raona: [
      { ty: 'Sempre, a vegades o mai?', q: '«Si dues magnituds creixen alhora, són directament proporcionals.»', o: ['Sempre', 'A vegades', 'Mai'], c: 1, why: 'A vegades. Les taronges i el preu, sí (quocient constant). El taxi o l\'edat i l\'alçada creixen alhora però no són proporcionals.' },
      { ty: 'Qui té raó?', q: '5 kg costen 6,50 €. Per a 8 kg, la Laia fa 6,50 : 5 · 8 i el Pau fa 6,50 · 5 : 8.', o: ['La Laia', 'El Pau', 'Tots dos (és el mateix)', 'Cap dels dos'], c: 0, why: 'La Laia: calcula el preu d\'1 kg (1,30 €) i el multiplica per 8 → 10,40 €. El Pau obté 4,06 €: per a més quilos no pot costar menys.' },
      { ty: 'Tria l\'expressió que modela', q: 'Una impressora fa 120 còpies en 4 minuts. Quina expressió dona les còpies que fa en 7 minuts?', o: ['120 : 4 · 7', '120 · 4 : 7', '120 + (7 − 4)', '4 · 7 : 120'], c: 0, why: '120 : 4 = 30 còpies per minut, i 30 · 7 = 210. La segona dona 68,6 còpies: menys que en 4 minuts.' },
      { ty: 'Detecta l\'error', q: 'L\'Hugo diu: «Si 1 km de taxi costa 4 €, 3 km costen 3 · 4 = 12 €.» Mira la taula del taxi. Quin és l\'error?', o: ['Ha multiplicat malament', 'El taxi no és proporcional: hi ha una part fixa (3 km costen 6 €)', 'Havia de dividir 4 entre 3', 'No hi ha cap error'], c: 1, why: 'Segons la taula, 3 km costen 6 €. El preu té una part fixa (la baixada de bandera) i per això no es pot fer la regla de tres.' },
    ],
  },
  S3: {
    file: 'sessio-3.html', short: 'Directa (II)',
    plan: [['10′', 'Correcció'], ['12′', 'Dos camins'], ['25′', 'Exercicis'], ['8′', 'Animació: taxi i quiz']], pages: '6',
    anim: { url: BASE + 'proporcionalitat/', text: 'Prova els contextos de la **impressora**, els **macarrons** i el **gasoil** i troba la constant de cada un. Acaba amb el **quiz**.' },
    figs: [{ at: 'h2:Dos camins', html: dnl({ xmax: 11, units: ['llibretes', '€'], aria: 'Recta numèrica doble: 4 llibretes 6 euros, 1 llibreta 1,50, 10 llibretes 15 euros', stages: {
      0: { ticks: [[0, '0', '0'], [1, '1', '1,50', 'hl'], [4, '4', '6'], [10, '10', '15', 'hl']], arcs: [[4, 1, ': 4', 'top'], [1, 10, '· 10', 'bot']], cap: 'Reducció a la unitat: dividim per 4 i multipliquem per 10.', ok: 'Regla de tres: 6 · 10 : 4 = 15' } } }) }],
    raona: [
      { ty: 'Detecta l\'error', q: 'Una recepta per a 4 persones porta 3 ous. Per a 12 persones, el Pau fa 3 + 8 = 11 ous.', o: ['Ha sumat la diferència de persones: cal multiplicar per 3 → 9 ous', 'Està bé', 'Havia de dividir: 1 ou', 'Són 12 ous'], c: 0, why: 'De 4 a 12 persones es multiplica per 3, i els ous també: 3 · 3 = 9. Sumar no conserva la raó.' },
      { ty: 'Tria l\'expressió que modela', q: '3 entrades costen 25,50 €. Quant costen 7 entrades?', o: ['25,50 : 3 · 7', '25,50 · 3 : 7', '25,50 + 4', '3 · 7 : 25,50'], c: 0, why: '25,50 : 3 = 8,50 € l\'entrada; 8,50 · 7 = 59,50 €.' },
      { ty: 'Sempre, a vegades o mai?', q: '«En una taula de proporcionalitat directa, si x val 0, y també val 0.»', o: ['Sempre', 'A vegades', 'Mai'], c: 0, why: 'Sempre: y = k · x, i k · 0 = 0. Per això la gràfica passa per l\'origen (i el taxi no és proporcional).' },
    ],
  },
  S4: {
    file: 'sessio-4.html', short: 'Inversa',
    plan: [['5′', 'Per a pensar: el Marc'], ['15′', 'Exemple resolt i Ara tu'], ['25′', 'Exercicis'], ['10′', 'Directa, inversa o cap?']], pages: '7–9',
    anim: { url: BASE + 'proporcionalitat-inversa/', text: 'Canvia el nombre de treballadors i mira què passa amb els dies: el **producte** es manté.' },
    figs: [
      { at: 'box', html: graph({ xmax: 12, ymax: 36, xstep: 1, ystep: 3, ylab: 2, curves: [[x => 36 / x, 1, 12, 1]], pts: [[1, 36, 1], [2, 18, 1], [3, 12, 1], [4, 9, 1], [6, 6, 1], [9, 4, 1], [12, 3, 1]], labels: [[3.4, 15, 'x · y = 36', 1]], xname: 'pintors', yname: 'dies', aria: 'Gràfica de proporcionalitat inversa: corba que baixa, x per y igual a 36', cap: 'La inversa <b>no és una recta</b>: el doble de pintors, la meitat de dies. El producte sempre és 36.' }) },
      { at: 'worked', html: bars() },
    ],
    raona: [
      { ty: 'Qui té raó?', q: '3 pintors tarden 12 dies. El Marc diu que 6 pintors tardaran 24 dies; l\'Aina, que 6 dies.', o: ['El Marc', 'L\'Aina', 'Cap dels dos'], c: 1, why: 'L\'Aina: el doble de pintors, la meitat de temps. 3 · 12 = 36 i 36 : 6 = 6 dies.' },
      { ty: 'Directa, inversa o cap?', q: 'La velocitat d\'un cotxe i el temps que tarda a fer el mateix trajecte.', o: ['Directa', 'Inversa', 'Cap'], c: 1, why: 'Inversa: al doble de velocitat, la meitat de temps. El producte (la distància) és constant.' },
      { ty: 'Tria l\'expressió que modela', q: 'Amb 8 aixetes un depòsit s\'ompli en 6 hores. Quant tarda amb 12 aixetes?', o: ['8 · 6 : 12', '6 · 12 : 8', '6 : 8 · 12', '12 · 8 : 6'], c: 0, why: '1 aixeta tardaria 8 · 6 = 48 h; 12 aixetes, 48 : 12 = 4 h. La segona és la «regla de tres directa»: 9 h, més temps amb més aixetes.' },
      { ty: 'Sempre, a vegades o mai?', q: '«Si dues magnituds són inversament proporcionals i una es triplica, l\'altra es dividix entre 3.»', o: ['Sempre', 'A vegades', 'Mai'], c: 0, why: 'Sempre: és la definició. Si x · y = k i x es multiplica per 3, y ha de dividir-se entre 3.' },
    ],
  },
  S5: {
    file: 'sessio-5.html', short: 'Repartiments',
    plan: [['8′', 'Correcció'], ['15′', 'Exemples'], ['20′', 'Exercicis'], ['12′', 'Consolidació 1']], pages: '10–11',
    anim: { url: BASE + 'repartiments-proporcionals/', text: 'El total es trosseja en **parts iguals**, pas a pas. Prova un repartiment **directe** i un d\'**invers**: qui rep més en cada cas?' },
    figs: [{ at: 'item:Exemple 1', html: repBar() }],
    raona: [
      { ty: 'Qui té raó?', q: 'Anna (10 €), Berta (6 €) i Carla (4 €) guanyen 500 €. La Carla vol repartir-ho a parts iguals; l\'Anna, proporcionalment.', o: ['La Carla', 'L\'Anna', 'Tant fa'], c: 1, why: 'L\'Anna: qui ha posat més ha de rebre més. 250 €, 150 € i 100 €.' },
      { ty: 'Detecta l\'error', q: 'Repartir 90 € inversament a 2 i 4 errors. L\'Hugo dona 30 € a qui té 2 errors i 60 € a qui en té 4.', o: ['Ha fet un repartiment directe: ha de ser 60 € i 30 €', 'Està bé', 'Han de ser 45 € i 45 €', 'Han de ser 18 € i 72 €'], c: 0, why: 'En un repartiment invers, qui té menys errors rep més: parts 2 i 1 → 60 € i 30 €.' },
      { ty: 'Tria l\'expressió que modela', q: 'Repartim 120 € directament proporcional a 2, 3 i 5. Quant rep la part de 5?', o: ['120 : 10 · 5', '120 : 5', '120 · 5 : 3', '120 : 3 · 5'], c: 0, why: '2 + 3 + 5 = 10 parts; 120 : 10 = 12 € per part; 12 · 5 = 60 €.' },
    ],
  },
  S6: {
    file: 'sessio-6.html', short: 'Percentatges',
    plan: [['12′', 'Text d\'història'], ['10′', 'Animació'], ['13′', 'Exemple resolt'], ['20′', 'Exercicis']], pages: '12–14',
    anim: { url: BASE + 'percentatges-barra-100/', text: 'Modes **P** i **T**: la barra del 100 % i la quadrícula 10 × 10. Busca la part, el total i el percentatge.' },
    figs: [{ at: 'worked', html: dnl({ xmax: 105, units: ['%', 'alumnes'], sync: true, aria: 'Recta numèrica doble de percentatges i alumnes', stages: {
      1: { ticks: [[100, '100 %', '25']], cap: 'El total de la classe és el 100 %.' },
      2: { ticks: [[100, '100 %', '25'], [1, '1 %', '0,25', 'hl']], arcs: [[100, 1, ': 100']], cap: 'Dividim per 100 dalt i baix: l\'1 % són 0,25 alumnes.' },
      3: { ticks: [[100, '100 %', '25'], [1, '1 %', '0,25'], [36, '36 %', '9', 'hl']], arcs: [[1, 36, '· 36']], cap: 'Multipliquem per 36: el 36 % són 9 alumnes.' },
      4: { ticks: [[100, '100 %', '25'], [1, '1 %', '0,25'], [36, '36 %', '9', 'hl']], ok: '0,36 · 25 = 9 ✓', cap: 'Drecera: multiplicar pel decimal.' } } }) }],
    raona: [
      { ty: 'Qui té raó?', q: 'A 2n A aproven 18 de 24 i a 2n B, 20 de 28. 2n B diu que ha aprovat més perquè són 20.', o: ['2n A: el 75 %, més que el 71 % de 2n B', '2n B, perquè són més', 'Han aprovat igual'], c: 0, why: 'Cal comparar percentatges: 18 : 24 = 0,75 → 75 %; 20 : 28 ≈ 0,714 → 71,4 %.' },
      { ty: 'Tria l\'expressió que modela', q: 'Quina expressió dona el 36 % de 25?', o: ['0,36 · 25', '25 : 36', '36 · 25', '25 − 36'], c: 0, why: '0,36 · 25 = 9. Les altres són els errors típics.' },
      { ty: 'Sempre, a vegades o mai?', q: '«Un percentatge d\'una quantitat és més menut que la quantitat.»', o: ['Sempre', 'A vegades', 'Mai'], c: 1, why: 'A vegades: el 30 % de 50 és 15, però el 150 % de 50 és 75.' },
      { ty: 'Ordena sense calcular', q: 'Quin és més gran?', o: ['El 25 % de 80', 'El 50 % de 30', 'El 10 % de 210'], c: 2, why: '25 % de 80 = 20; 50 % de 30 = 15; 10 % de 210 = 21.' },
    ],
  },
  S7: {
    file: 'sessio-7.html', short: 'Augments',
    plan: [['10′', 'Animació (mode F)'], ['15′', 'Exemple resolt'], ['25′', 'Exercicis'], ['5′', 'Anunci de la SA']], pages: '15–17',
    anim: { url: BASE + 'percentatges-barra-100/', text: 'Mode **F**: augments i rebaixes. Fixa\'t en l\'**índex de variació**: pujar un 20 % és multiplicar per 1,20.' },
    figs: [{ at: 'worked', html: dnl({ xmax: 135, units: ['%', '€'], sync: true, aria: 'Recta numèrica doble de percentatges i euros', stages: {
      1: { ticks: [[0, '0', '0'], [100, '100 %', '?', 'q'], [120, '120 %', '54']], cap: 'Pujar un 20 % és passar del 100 % al 120 %: índex 1,20.' },
      2: { ticks: [[0, '0', '0'], [100, '100 %', '?', 'q'], [120, '120 %', '54']], cap: 'Ens donen el final (120 %) i busquem l\'inicial (100 %).' },
      3: { ticks: [[0, '0', '0'], [100, '100 %', '45', 'hl'], [120, '120 %', '54']], arcs: [[120, 100, ': 1,20']], cap: 'Dividim entre l\'índex: 54 : 1,20 = 45 €.' },
      4: { ticks: [[0, '0', '0'], [100, '100 %', '45', 'hl'], [120, '120 %', '54']], ok: '45 · 1,20 = 54 ✓', cap: 'No restem el 20 % de 54: el 20 % era de 45.' } } }) }],
    raona: [
      { ty: 'Qui té raó?', q: 'Unes sabatilles de 60 € pugen un 10 % i després baixen un 10 %. El dependent diu que tornen a costar 60 €.', o: ['No: costen 59,40 €', 'Sí: 60 €', 'No: costen 54 €'], c: 0, why: '60 · 1,10 = 66 €; 66 · 0,90 = 59,40 €. El 10 % de la baixada és de 66 €, no de 60 €.' },
      { ty: 'Tria l\'expressió que modela', q: 'Després d\'una pujada del 20 %, un producte val 54 €. Quant valia?', o: ['54 : 1,20', '54 · 0,80', '54 − 0,20 · 54', '54 · 1,20'], c: 0, why: 'inicial · 1,20 = 54 → inicial = 54 : 1,20 = 45 €. Restar el 20 % de 54 dona 43,20 €: error típic.' },
      { ty: 'Percentatges encadenats', q: 'Una rebaixa del 20 % i després una altra del 20 %. Quina és la rebaixa total?', o: ['36 %', '40 %', '4 %', '64 %'], c: 0, why: '0,80 · 0,80 = 0,64: pagues el 64 %, la rebaixa és del 36 %.' },
      { ty: 'Índex de variació', q: 'Quin índex correspon a una rebaixa del 12 %?', o: ['0,88', '1,12', '0,12', '1,88'], c: 0, why: 'Queda el 88 %: 1 − 0,12 = 0,88.' },
    ],
  },
  R: {
    file: 'repas.html', short: 'Repàs',
    plan: [['A casa', 'Abans de la prova']], pages: '18',
    raona: [
      { ty: 'Quina eina toca?', q: '4 aixetes omplin una bassa en 9 hores. Quant tarden 6 aixetes?', o: ['Directa', 'Inversa', 'Percentatge', 'Repartiment', 'Cap'], c: 1, why: 'Més aixetes, menys temps: inversa. 4 · 9 = 36; 36 : 6 = 6 h.' },
      { ty: 'Quina eina toca?', q: 'Una bici de 300 € té un 15 % de descompte. Quant costa?', o: ['Directa', 'Inversa', 'Percentatge', 'Repartiment', 'Cap'], c: 2, why: 'Percentatge: 300 · 0,85 = 255 €.' },
      { ty: 'Quina eina toca?', q: 'La talla de peu i l\'alçada d\'una persona.', o: ['Directa', 'Inversa', 'Percentatge', 'Repartiment', 'Cap'], c: 4, why: 'Cap: estan relacionades, però no són proporcionals.' },
      { ty: 'Quina eina toca?', q: 'Tres socis es reparteixen els beneficis segons els diners que han invertit.', o: ['Directa', 'Inversa', 'Percentatge', 'Repartiment', 'Cap'], c: 3, why: 'Repartiment directament proporcional: qui inverteix més rep més.' },
    ],
  },
};

module.exports = { S };
