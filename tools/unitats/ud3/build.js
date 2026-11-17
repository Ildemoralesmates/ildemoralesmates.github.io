// Genera les pàgines web de la UD 3 a partir del contingut del dossier (content.json) i de extras.js
// Ús: (cd .. && WEB=1 node dossier.js) && node build.js  →  web/ud3/*.html
const fs = require('fs');
const path = require('path');
const { S: X } = require('./extras.js');
const { nodes, sols } = JSON.parse(fs.readFileSync(path.join(__dirname, 'content.json'), 'utf8'));
const OUT = process.env.OUTDIR || path.join(__dirname, 'ud3');
const SITE = 'https://ildemoralesmates.github.io/ud3-proporcionalitat-percentatges/';
fs.mkdirSync(OUT, { recursive: true });

// ---------- text amb marcat ----------
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const math = src => '<span class="mth">' + esc(src).replace(/\{\{([^|}]+)\|([^}]+)\}\}/g, '<span class="frac"><span>$1</span><span>$2</span></span>') + '</span>';
function md(t) {
  return String(t).split(/(\$[^$]+\$|\*\*[^*]+\*\*|\*[^*]+\*)/).map(p => {
    if (/^\$[^$]+\$$/.test(p)) return math(p.slice(1, -1));
    if (/^\*\*[^*]+\*\*$/.test(p)) return '<b>' + esc(p.slice(2, -2)) + '</b>';
    if (/^\*[^*]+\*$/.test(p)) return '<i>' + esc(p.slice(1, -1)) + '</i>';
    return esc(p);
  }).join('');
}
const LV = ['', '●', '●●', '●●●'];

// ---------- sessions i solucions ----------
const sessions = [];
for (const n of nodes) {
  if (n.k === 'sec') { sessions.push({ key: n.label === 'Repàs' ? 'R' : 'S' + n.label.replace(/\D/g, ''), label: n.label, title: n.title, nodes: [] }); continue; }
  if (sessions.length) sessions[sessions.length - 1].nodes.push(n);
}
function parseSol(items) {
  const txt = items.join('   '), out = {};
  const re = /\*\*(Per a pensar|Explica-ho|Exemple|Dos camins|Més pràctica|[A-D]|\d+|M\d+)[.:]\*\*/g;
  const ms = [...txt.matchAll(re)];
  ms.forEach((m, i) => { const end = i + 1 < ms.length ? ms[i + 1].index : txt.length; const v = txt.slice(m.index + m[0].length, end).trim(); if (v) out[m[1]] = v; });
  return out;
}
const SOLS = Object.fromEntries(sols.map(s => [s.key, parseSol(s.items)]));

// ---------- peces ----------
const solDiv = t => t ? `<div class="rv hid sol"><span class="sl">Solució</span> ${md(t)}</div>` : '';
function table(rows, o = {}) {
  return `<div class="tw"><table class="${o.cls || 'gt'}">` + rows.map((r, i) => {
    const tag = o.head && i === 0 ? 'th' : 'td';
    const rv = o.reveal && i > 0 ? ' class="rv hid"' : '';
    return `<tr${rv}>` + r.map((c, j) => {
      const cc = String(c);
      const cls = (j === 0 && !o.head) || (o.head && i === 0) ? ' class="lab"' : (cc === '' ? ' class="blankc"' : '');
      return `<${j === 0 && !o.head ? 'th' : tag}${cls}>${cc.split('\n').map(md).join('<br>')}</${j === 0 && !o.head ? 'th' : tag}>`;
    }).join('') + '</tr>';
  }).join('') + '</table></div>';
}
function worked(n) {
  return `<div class="colh"><span>Pas</span><span>Què fem</span><span>Per què</span></div><div class="steps wk">` + n.steps.map((s, i) =>
    `<div class="step${i ? ' rv hid' : ''}"><div class="lab">${md(s[0])}</div><div>${s[1].split('\n').map(md).join('<br>')}</div><div class="why">${md(s[2])}</div></div>`).join('') + '</div>';
}
function comp(n) {
  return '<div class="fade">' + n.steps.map(s => s[1] === ''
    ? `<div class="row you"><span class="lab">${md(s[0])}</span><span><span class="pend">…………………………</span><span class="rv hid ans">${md(s[2] || '')}</span></span></div>`
    : `<div class="row"><span class="lab">${md(s[0])}</span><span>${md(s[1])}</span></div>`).join('') + '</div>';
}

// ---------- una sessió ----------
function renderSession(ses) {
  const ex = X[ses.key], sol = SOLS[ses.key] || {};
  let ptIdx = 0;
  // blocs per títol
  const blocks = []; let cur = null;
  for (const n of ses.nodes) {
    if (n.k === 'h2') { cur = { title: n.t, nodes: [] }; blocks.push(cur); continue; }
    if (n.k === 'box') { blocks.push({ box: n }); cur = null; continue; }
    if (n.k === 'blank' || (n.k === 'p' && !n.t.trim())) continue;
    if (!cur) { cur = { title: null, nodes: [] }; blocks.push(cur); }
    cur.nodes.push(n);
  }
  const figsAt = at => (ex.figs || []).filter(f => f.at === at).map(f => f.html).join('');
  const isStart = n => n.k === 'ex' || (n.k === 'p' && /^\*\*(Problema|Exemple) /.test(n.t));
  const itemName = n => n.k === 'ex' ? n.n : (n.t.match(/^\*\*((?:Problema|Exemple) [A-Z0-9]+)/) || [])[1];

  function node(n, ctx) {
    switch (n.k) {
      case 'p': {
        if (/^\*\*Explica-ho/.test(n.t)) return `<p class="exp">${md(n.t)}</p>` + solDiv(sol['Explica-ho'] || sol['Exemple'] || sol['Dos camins']);
        if (n.ctl) return `<p class="cp">${md(n.t)}</p>`;
        const m = n.t.match(/^\*\*(Problema [A-D])\.\*\*/);
        if (m) return `<h4>${(ex.icons || {})[m[1]] || ''}${md(n.t)}</h4>`;
        if (/^\*\*Exemple /.test(n.t)) return `<h4>${md(n.t)}</h4>`;
        return `<p>${md(n.t)}</p>`;
      }
      case 'ptable': {
        const t = table([[n.labels[0], ...n.r1], [n.labels[1], ...n.r2]], { cls: 'pt' });
        const ill = ex.ptableIll && ex.ptableIll[ptIdx++];
        return ill ? `<div class="trow">${ill}${t}</div>` : t;
      }
      case 'grid': return table(n.rows, { head: n.head, reveal: ctx.example });
      case 'worked': return worked(n) + figsAt('worked');
      case 'comp': return comp(n);
      case 'ex': {
        const s = sol[n.n];
        return `<p class="exq"><span class="lvl" aria-label="nivell ${n.lvl}">${LV[n.lvl]}</span> <b>${esc(n.n)}.</b> ${md(n.t)}</p>`
          + (n.items.length ? `<div class="its">${n.items.map(i => `<p>${md(i)}</p>`).join('')}</div>` : '') + solDiv(s);
      }
    }
    return '';
  }
  const ctrl = '<div class="ctrl"><button class="btn primary nx">Següent pas</button><button class="btn al">Mostra-ho tot</button><button class="btn rs">Amaga</button></div>';
  const unit = (inner, cls = '') => `<div class="u ${cls}">${inner}${/class="rv /.test(inner) ? ctrl : ''}</div>`;

  let html = '', bi = 0, raonaDone = false;
  const raona = () => {
    if (!ex.raona || raonaDone) return ''; raonaDone = true;
    return `<section class="blk" data-t="Comprova què has entés"><h3>Comprova què has entés <span class="tag">raona-ho</span></h3>
      ${ex.raona.map((t, k) => `<div class="u item task" data-c="${t.c}"><span class="ty">${esc(t.ty)}</span><p>${md(t.q)}</p><div class="opts">${t.o.map((o, j) => `<button class="opt"><span class="l">${'ABCDE'[j]}</span><span>${md(o)}</span></button>`).join('')}</div><p class="fb">${''}</p><template>${md(t.why)}</template></div>`).join('')}
      <p class="score" aria-live="polite"></p></section>`;
  };
  const anim = () => ex.anim ? `<section class="blk anim" data-t="Animació"><h3>Animació</h3><p>${md(ex.anim.text)}</p>
      <div class="ph"><button class="btn primary ld" data-src="${ex.anim.url}">Carrega l'animació ací</button><a href="${ex.anim.url}" target="_blank" rel="noopener">o obri-la en una pestanya nova ↗</a></div></section>` : '';

  for (const b of blocks) {
    if (b.box) {
      const fig = figsAt('box');
      html += `<section class="rec" data-t="${esc(b.box.title)}"><h3>${esc(b.box.title)}</h3><div class="${fig ? 'recg' : ''}"><ul>${b.box.lines.map(l => `<li>${md(l.replace(/^•\s*/, ''))}</li>`).join('')}</ul>${fig}</div></section>`;
      continue;
    }
    if (b.title === 'Més pràctica') html += raona();
    // separa introducció i ítems
    const intro = [], items = [];
    for (const n of b.nodes) { if (isStart(n)) items.push([n]); else if (items.length) items[items.length - 1].push(n); else intro.push(n); }
    const [h, tag] = (b.title || '').split(/:\s*/);
    const sideFig = figsAt('h2:' + h);
    let inner = intro.map(n => node(n, {})).join('');
    if (/^Per a pensar/.test(b.title || '') && sol['Per a pensar']) inner += solDiv(sol['Per a pensar']);
    if (sideFig) inner = `<div class="side"><div>${inner}</div><div class="sidefig">${sideFig}</div></div>`;
    const itemsHtml = items.map(it => {
      const nm = itemName(it[0]) || '';
      const isEx = /^Exemple/.test(nm);
      let body = it.map(n => node(n, { example: isEx })).join('');
      const f = figsAt('item:' + nm); if (f) body += f;
      return unit(body, 'item' + (it[0].k === 'ex' ? ' exi' : ' prob'));
    }).join('');
    const intro_u = items.length ? `<div class="intro">${inner}</div>` : unit(inner);
    html += `<section class="blk" data-t="${esc(h || ses.title)}">${b.title ? `<h3>${esc(h)}${tag ? ` <span class="tag">${esc(tag)}</span>` : ''}</h3>` : ''}${intro_u}${b.title === 'Més pràctica' ? '<p class="note">Són els exercicis M del final de la sessió en el dossier.</p>' : ''}${itemsHtml}</section>`;
    if (bi++ === 0) html += anim();
  }
  html += raona();
  return html;
}

// ---------- plantilla ----------
const CSS = fs.readFileSync(path.join(__dirname, 'page.css'), 'utf8');
const JS = fs.readFileSync(path.join(__dirname, 'page.js'), 'utf8');
const order = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'R'];
const nav = cur => `<nav class="ses" aria-label="Sessions de la unitat"><a href="index.html">UD 3</a>${order.map(k => (k === 'R' ? `<a href="sa-1.html"${/^SA/.test(cur) ? ' aria-current="page"' : ''}>S8–12 · SA</a>` : '') + `<a href="${X[k].file}"${k === cur ? ' aria-current="page"' : ''}>${k === 'R' ? 'Repàs' : k + ' · ' + X[k].short}</a>`).join('')}<a href="ampliacio.html"${cur === 'A' ? ' aria-current="page"' : ''}>Ampliació</a></nav>`;
const GC = '<script data-goatcounter="https://ildemoralesmates.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>';
const page = (title, desc, body, file) => `<!DOCTYPE html>
<html lang="ca">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}${file === 'index.html' ? '' : file}">
<link rel="license" href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.ca">
<style>${CSS}</style>
${GC}
</head>
<body>
${body}
<script>${JS}</script>
</body>
</html>
`;

for (const ses of sessions) {
  const ex = X[ses.key];
  const full = `${ses.label === 'Repàs' ? 'Repàs' : ses.label} · ${ses.title}`;
  const body = `<div class="page">
  <header class="top">
    <div><p class="eyebrow">Matemàtiques 2n ESO · UD 3 · Proporcionalitat i percentatges</p><h1>${esc(full)}</h1></div>
    <div class="tools">
      <div class="timer" aria-label="Temporitzador"><button class="btn" data-t="300">5′</button><button class="btn" data-t="600">10′</button><button class="btn" data-t="900">15′</button><output id="tOut">--:--</output></div>
      <button class="btn" id="projBtn" aria-pressed="false">Mode projecció</button>
      <a class="home" href="https://ildemoralesmates.github.io/">⌂ Portada</a>
    </div>
  </header>
  ${nav(ses.key)}
  <div class="sesh"><div class="plan">${ex.plan.map(([m, t]) => `<span><b>${esc(m)}</b> ${esc(t)}</span>`).join('')}</div><span class="meta">En paper: dossier UD3_02, pàg. ${esc(ex.pages)}</span></div>
  ${renderSession(ses)}
  <footer><span>© Ilde Morales · <a href="https://ildemoralesmates.github.io/">Recursos de matemàtiques</a> · <a rel="license" href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.ca">CC BY-NC-SA 4.0</a></span><span>Les respostes es treballen al quadern; ací es corregixen.</span></footer>
</div>
<div class="pnav" role="navigation" aria-label="Navegació de la projecció"><button class="btn" id="pPrev" aria-label="Anterior">◀</button><output id="pPos"></output><button class="btn primary" id="pNext" aria-label="Següent">▶</button></div>`;
  fs.writeFileSync(path.join(OUT, ex.file), page(`UD 3 · ${full} — Matemàtiques 2n ESO`, `Matemàtiques 2n ESO, unitat de proporcionalitat i percentatges: ${full}. Per a projectar a classe i corregir a casa.`, body, ex.file));
}

// ---------- ampliació (de la fitxa UD3_08_Ampliacio, mateixa font) ----------
const AMP = JSON.parse(fs.readFileSync(path.join(__dirname, 'ampliacio.json'), 'utf8'));
{
  let qn = 0;
  const ctrl = '<div class="ctrl"><button class="btn primary nx">Següent pas</button><button class="btn al">Mostra-ho tot</button><button class="btn rs">Amaga</button></div>';
  const secs = AMP.map(b => {
    const [, h, tag] = b.title.match(/^BLOC ([A-Z]) · (.*)$/) || [, '', b.title];
    return `<section class="blk" data-t="Bloc ${h}"><h3>Bloc ${esc(h)} <span class="tag">${esc(tag)}</span></h3>` + b.qs.map(q => {
      qn++;
      return `<div class="u item"><p class="exq"><b>${qn}.</b> ${md(q.text)}</p><div class="its">${q.items.map(([t, a], i) => `<p><b>${'abcd'[i]})</b> ${md(t)}</p><div class="rv hid sol"><span class="sl">Solució</span> ${md(a)}</div>`).join('')}</div>${ctrl}</div>`;
    }).join('') + '</section>';
  }).join('');
  const body = `<div class="page">
  <header class="top">
    <div><p class="eyebrow">Matemàtiques 2n ESO · UD 3 · Proporcionalitat i percentatges</p><h1>Ampliació · Reptes</h1></div>
    <div class="tools">
      <div class="timer" aria-label="Temporitzador"><button class="btn" data-t="300">5′</button><button class="btn" data-t="600">10′</button><button class="btn" data-t="900">15′</button><output id="tOut">--:--</output></div>
      <button class="btn" id="projBtn" aria-pressed="false">Mode projecció</button>
      <a class="home" href="https://ildemoralesmates.github.io/">⌂ Portada</a>
    </div>
  </header>
  ${nav('A')}
  <div class="sesh"><div class="plan"><span><b>S16</b> Treball diferenciat (qui ha superat la prova)</span></div><span class="meta">En paper: fitxa UD3_08 Ampliació</span></div>
  <p class="lede">Problemes per a anar un pas més enllà. Es resolen al quadern amb tot el procediment; ací es corregixen apartat per apartat.</p>
  ${secs}
  <footer><span>© Ilde Morales · <a href="https://ildemoralesmates.github.io/">Recursos de matemàtiques</a> · <a rel="license" href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.ca">CC BY-NC-SA 4.0</a></span><span>Les respostes es treballen al quadern; ací es corregixen.</span></footer>
</div>
<div class="pnav" role="navigation" aria-label="Navegació de la projecció"><button class="btn" id="pPrev" aria-label="Anterior">◀</button><output id="pPos"></output><button class="btn primary" id="pNext" aria-label="Següent">▶</button></div>`;
  fs.writeFileSync(path.join(OUT, 'ampliacio.html'), page('UD 3 · Ampliació · Reptes de proporcionalitat i percentatges — Matemàtiques 2n ESO', 'Reptes d\'ampliació de proporcionalitat i percentatges per a 2n ESO: proporcionalitat composta, escales, percentatges que enganyen i interessos.', body, 'ampliacio.html'));
}

// ---------- situació d'aprenentatge «Quant costava?» (sa.json, mateixa font que els documents de la SA) ----------
const SA = JSON.parse(fs.readFileSync(path.join(__dirname, 'sa.json'), 'utf8'));
{
  const ctrl = '<div class="ctrl"><button class="btn primary nx">Següent pas</button><button class="btn al">Mostra-ho tot</button><button class="btn rs">Amaga</button></div>';
  const lines = t => String(t).split('\n').map(md).join('<br>');
  // barres horitzontals: rows [etiqueta, valor, text]; ref = línia de referència
  const hbars = (rows, max, { unit = '', ref, refLab, aria, cls = 'c1' } = {}) => {
    const L = 120, W = 560, H = 34, X = v => L + v / max * W;
    let g = rows.map(([lab, v, txt, c], i) => `<text class="lb" x="${L - 10}" y="${30 + i * H + 17}" text-anchor="end">${esc(lab)}</text><rect class="${c || cls}" x="${L}" y="${30 + i * H + 4}" width="${Math.max(2, X(v) - L)}" height="${H - 12}" rx="3"/><text class="ok" x="${X(v) + 8}" y="${30 + i * H + 21}">${esc(txt)}</text>`).join('');
    if (ref != null) g += `<line x1="${X(ref)}" y1="22" x2="${X(ref)}" y2="${36 + rows.length * H}" stroke="var(--pb)" stroke-width="2.5" stroke-dasharray="6 4"/><text class="lb" x="${X(ref)}" y="16" text-anchor="middle" style="fill:var(--pb)">${esc(refLab)}</text>`;
    return `<svg class="ill rep" viewBox="0 0 800 ${44 + rows.length * H}" role="img" aria-label="${esc(aria)}">${g}</svg>`;
  };
  const EXTRA = {
    2: { top: `<section class="blk" data-t="La màquina de convertir"><h3>La màquina de convertir <span class="tag">prova-la</span></h3>
        <p>Escriu el preu antic en pessetes i el preu d'ara en euros. La màquina fa els cinc passos de l'algoritme.</p>
        <div class="check conv"><label>Preu antic <input class="n" id="cvP" inputmode="decimal" value="40"> pta</label><label>Preu actual <input class="n" id="cvE" inputmode="decimal" value="1,20"> €</label><button class="btn primary" id="cvGo">Calcula</button></div>
        <div class="u"><div class="steps" id="cvOut"></div></div></section>` },
    3: { top: `<section class="blk" data-t="Dues maneres de comparar"><h3>Dues maneres de comparar <span class="tag">productes de la Laia</span></h3>
        <div class="u"><p>Quin ha pujat més? Primer mirem la <b>diferència en euros</b> i després el <b>canvi percentual</b>.</p>
        <div class="rv hid fig"><p><b>Diferència en euros</b> (preu d'ara − preu antic)</p>${hbars([['Pa', 0.96, '+0,96 €'], ['Diari', 1.05, '+1,05 €'], ['Cine', 5.49, '+5,49 €'], ['Menú', 6.99, '+6,99 €']], 8, { aria: 'Diferència en euros: pa 0,96; diari 1,05; cine 5,49; menú 6,99' })}</div>
        <div class="rv hid fig"><p><b>Canvi percentual</b> (diferència : preu antic)</p>${hbars([['Pa', 400, '+400 %', 'c2'], ['Diari', 140, '+140 %', 'c2'], ['Cine', 182.4, '+182,4 %', 'c2'], ['Menú', 116.3, '+116,3 %', 'c2']], 460, { aria: 'Canvi percentual: pa 400 %; diari 140 %; cine 182,4 %; menú 116,3 %' })}</div>
        <div class="rv hid sol"><span class="sl">Conclusió</span> En euros, el que més puja és el menú; en percentatge, el pa. Per a comparar preus tan diferents, el que compta és el <b>canvi percentual</b>.</div>${ctrl}</div></section>` },
    4: { top: `<section class="blk" data-t="Preus reals i IPC"><h3>Preus reals i IPC <span class="tag">productes de la Laia</span></h3>
        <div class="u"><p>Línia discontínua: el que hauria pujat cada preu si haguera seguit l'IPC (+70 %). Barres: el que ha pujat de veritat.</p>
        <div class="rv hid fig">${hbars([['Pa', 400, '+400 %', 'c2'], ['Diari', 140, '+140 %', 'c2'], ['Cine', 182.4, '+182,4 %', 'c2'], ['Menú', 116.3, '+116,3 %', 'c2']], 460, { ref: 70, refLab: 'IPC +70 %', aria: 'Pujades reals dels quatre productes, totes per damunt de la línia de l\'IPC del 70 %' })}</div>
        <div class="rv hid sol"><span class="sl">Conclusió</span> Els quatre productes han pujat més que l'IPC. El pa és el que més se n'allunya.</div>${ctrl}</div>
        <p class="note">Dada real: calculadora de variació de l'IPC de l'INE (<a href="https://www.ine.es/calcula/" target="_blank" rel="noopener">ine.es/calcula ↗</a>), triant l'any d'inici i el final. El 70 % és una dada suposada per a treballar a classe.</p></section>` },
  };
  const subnav = n => `<nav class="ses sub" aria-label="Sessions de la situació d'aprenentatge">${SA.sessions.map(s => `<a href="sa-${s.num}.html"${s.num === n ? ' aria-current="page"' : ''}>S${s.num + 7} · ${esc(s.titol)}</a>`).join('')}</nav>`;
  const rubrica = () => `<section class="blk" data-t="Rúbrica de coavaluació"><h3>Rúbrica <span class="tag">coavaluació de la galeria</span></h3>
    <div class="tw"><table class="gt rub"><tr><th class="lab">Criteri</th>${SA.rubrica.nivells.map(n => `<th>${esc(n)}</th>`).join('')}</tr>
    ${SA.rubrica.criteris.map(c => `<tr><th class="lab"><b>${esc(c.codi)}</b><br>${md(c.criteri)}</th>${c.nivells.map(n => `<td>${md(n)}</td>`).join('')}</tr>`).join('')}</table></div></section>`;
  for (const s of SA.sessions) {
    const n = s.num, sesN = n + 7;
    let h = '';
    if (n === 1) h += `<section class="rec" data-t="${esc(SA.context_titol)}"><h3>${esc(SA.context_titol)}</h3><p>${md(SA.presentacio)}</p><p><b>Pregunta de la SA:</b> ${md(SA.pregunta_inicial)}</p></section>`;
    h += `<section class="blk" data-t="Context"><h3>Context <span class="tag">${esc(s.titol)}</span></h3><div class="u"><p>${md(s.context)}</p></div></section>`;
    h += `<section class="blk" data-t="Per a pensar"><h3>Per a pensar</h3><div class="u"><p class="big">${md(s.detonant)}</p></div></section>`;
    if (EXTRA[n]) h += EXTRA[n].top;
    if (s.per_a_recordar) h += `<section class="rec" data-t="Per a recordar"><h3>Per a recordar</h3><p>${md(s.per_a_recordar)}</p></section>`;
    for (const b of s.blocs) {
      const tag = { estandard: 'per a tots', reforc: 'si et costa', ampliacio: 'per a anar més enllà' }[b.tipus];
      const pre = { estandard: '', reforc: 'R', ampliacio: 'A' }[b.tipus];
      h += `<section class="blk ${b.tipus}" data-t="${esc(b.titol)}"><h3>${esc(b.titol)} <span class="tag">${tag}</span></h3>` + b.items.map(it =>
        `<div class="u item"><p class="exq"><b>${pre}${esc(it.id)}.</b> ${lines(it.text)}</p><div class="rv hid sol"><span class="sl">Solució</span> ${lines(it.solucio)}${it.error_tipic ? `<br><i>Error típic: ${md(it.error_tipic)}</i>` : ''}</div>${ctrl}</div>`).join('') + '</section>';
    }
    if (n === 5) h += rubrica();
    const title = `Sessió ${sesN} · SA ${n} · ${s.titol}`;
    const body = `<div class="page">
  <header class="top">
    <div><p class="eyebrow">Matemàtiques 2n ESO · UD 3 · Situació d'aprenentatge «${esc(SA.titol)}»</p><h1>${esc(title)}</h1></div>
    <div class="tools">
      <div class="timer" aria-label="Temporitzador"><button class="btn" data-t="300">5′</button><button class="btn" data-t="600">10′</button><button class="btn" data-t="900">15′</button><output id="tOut">--:--</output></div>
      <button class="btn" id="projBtn" aria-pressed="false">Mode projecció</button>
      <a class="home" href="https://ildemoralesmates.github.io/">⌂ Portada</a>
    </div>
  </header>
  ${nav('SA' + n)}
  ${subnav(n)}
  <div class="sesh"><div class="plan"><span><b>SA</b> sessió ${n} de 5 · treball en equips de 4</span></div><span class="meta">En paper: SA UD3_05, pàg. ${n + 1}</span></div>
  ${h}
  <footer><span>© Ilde Morales · <a href="https://ildemoralesmates.github.io/">Recursos de matemàtiques</a> · <a rel="license" href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.ca">CC BY-NC-SA 4.0</a></span><span>Les respostes es treballen al quadern; ací es corregixen.</span></footer>
</div>
<div class="pnav" role="navigation" aria-label="Navegació de la projecció"><button class="btn" id="pPrev" aria-label="Anterior">◀</button><output id="pPos"></output><button class="btn primary" id="pNext" aria-label="Següent">▶</button></div>`;
    fs.writeFileSync(path.join(OUT, `sa-${n}.html`), page(`UD 3 · ${title} — Matemàtiques 2n ESO`, `Situació d'aprenentatge de 2n ESO «${SA.titol}», sessió ${n}: ${s.titol}. Pessetes i euros, canvi percentual i IPC, per a projectar i corregir.`, body, `sa-${n}.html`));
  }
}

// ---------- índex de la unitat ----------
const cards = sessions.map(s => {
  const ex = X[s.key];
  const hs = s.nodes.filter(n => n.k === 'h2').map(n => n.t.split(':')[0]).filter((v, i, a) => a.indexOf(v) === i && v !== 'Més pràctica');
  return (s.key === 'R' ? `<a class="card" href="sa-1.html"><small>Sessions 8–12 · situació d'aprenentatge</small><h2>${esc(SA.titol)}</h2><p>${SA.sessions.map(x => esc(x.titol)).join(' · ')}</p><span class="meta">SA UD3_05, en equips</span></a>` : '') + `<a class="card" href="${ex.file}"><small>${esc(s.label)}${ex.anim ? ' · amb animació' : ''}</small><h2>${esc(s.title)}</h2><p>${esc(hs.join(' · '))}</p><span class="meta">Dossier, pàg. ${esc(ex.pages)}</span></a>`;
}).join('');
const anims = [['proporcionalitat/', 'Proporcionalitat directa'], ['proporcionalitat-inversa/', 'Proporcionalitat inversa'], ['repartiments-proporcionals/', 'Repartiments proporcionals'], ['percentatges-barra-100/', 'Percentatges: la barra del 100 %']];
fs.writeFileSync(path.join(OUT, 'index.html'), page('UD 3 · Proporcionalitat i percentatges — Matemàtiques 2n ESO', 'Unitat de proporcionalitat i percentatges de 2n ESO: sessions per a projectar i corregir, amb exemples resolts pas a pas, exercicis i animacions.', `<div class="page">
  <header class="top"><div><p class="eyebrow">Matemàtiques 2n ESO</p><h1>UD 3 · Proporcionalitat i percentatges</h1></div><a class="home" href="https://ildemoralesmates.github.io/">⌂ Portada</a></header>
  <p class="lede">Una pàgina per sessió, amb el mateix contingut que el dossier en paper. A classe, prem <b>Mode projecció</b> i avança amb ▶ (o amb el passador): primer es revelen els passos i després es passa a la pantalla següent.</p>
  <div class="cards">${cards}<a class="card" href="ampliacio.html"><small>S16 · Ampliació</small><h2>Reptes</h2><p>Proporcionalitat composta · Treballar junts · Escales · Percentatges que enganyen · Interessos · Reptes</p><span class="meta">Fitxa UD3_08 Ampliació</span></a></div>
  <section class="blk"><h3>Animacions de la unitat</h3><ul class="links">${anims.map(([u, t]) => `<li><a href="https://ildemoralesmates.github.io/${u}" target="_blank" rel="noopener">${esc(t)} ↗</a></li>`).join('')}</ul>
  <p class="note">Sessions 13–16: fitxes competencials, càlcul mental, prova i reforç.</p></section>
  <footer><span>© Ilde Morales · <a href="https://ildemoralesmates.github.io/">Recursos de matemàtiques</a> · <a rel="license" href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.ca">CC BY-NC-SA 4.0</a></span></footer>
</div>`, 'index.html'));
console.log('ok', sessions.map(s => X[s.key].file).join(' '));
