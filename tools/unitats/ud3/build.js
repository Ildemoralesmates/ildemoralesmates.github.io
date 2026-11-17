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
const nav = cur => `<nav class="ses" aria-label="Sessions de la unitat"><a href="index.html">UD 3</a>${order.map(k => `<a href="${X[k].file}"${k === cur ? ' aria-current="page"' : ''}>${k === 'R' ? 'Repàs' : k + ' · ' + X[k].short}</a>`).join('')}<a href="ampliacio.html"${cur === 'A' ? ' aria-current="page"' : ''}>Ampliació</a></nav>`;
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

// ---------- índex de la unitat ----------
const cards = sessions.map(s => {
  const ex = X[s.key];
  const hs = s.nodes.filter(n => n.k === 'h2').map(n => n.t.split(':')[0]).filter((v, i, a) => a.indexOf(v) === i && v !== 'Més pràctica');
  return `<a class="card" href="${ex.file}"><small>${esc(s.label)}${ex.anim ? ' · amb animació' : ''}</small><h2>${esc(s.title)}</h2><p>${esc(hs.join(' · '))}</p><span class="meta">Dossier, pàg. ${esc(ex.pages)}</span></a>`;
}).join('');
const anims = [['proporcionalitat/', 'Proporcionalitat directa'], ['proporcionalitat-inversa/', 'Proporcionalitat inversa'], ['repartiments-proporcionals/', 'Repartiments proporcionals'], ['percentatges-barra-100/', 'Percentatges: la barra del 100 %']];
fs.writeFileSync(path.join(OUT, 'index.html'), page('UD 3 · Proporcionalitat i percentatges — Matemàtiques 2n ESO', 'Unitat de proporcionalitat i percentatges de 2n ESO: sessions per a projectar i corregir, amb exemples resolts pas a pas, exercicis i animacions.', `<div class="page">
  <header class="top"><div><p class="eyebrow">Matemàtiques 2n ESO</p><h1>UD 3 · Proporcionalitat i percentatges</h1></div><a class="home" href="https://ildemoralesmates.github.io/">⌂ Portada</a></header>
  <p class="lede">Una pàgina per sessió, amb el mateix contingut que el dossier en paper. A classe, prem <b>Mode projecció</b> i avança amb ▶ (o amb el passador): primer es revelen els passos i després es passa a la pantalla següent.</p>
  <div class="cards">${cards}<a class="card" href="ampliacio.html"><small>S16 · Ampliació</small><h2>Reptes</h2><p>Proporcionalitat composta · Treballar junts · Escales · Percentatges que enganyen · Interessos · Reptes</p><span class="meta">Fitxa UD3_08 Ampliació</span></a></div>
  <section class="blk"><h3>Animacions de la unitat</h3><ul class="links">${anims.map(([u, t]) => `<li><a href="https://ildemoralesmates.github.io/${u}" target="_blank" rel="noopener">${esc(t)} ↗</a></li>`).join('')}</ul>
  <p class="note">Sessions 8–12: situació d'aprenentatge «Quant costava?» (en paper). Sessions 13–16: fitxes competencials, càlcul mental, prova i reforç.</p></section>
  <footer><span>© Ilde Morales · <a href="https://ildemoralesmates.github.io/">Recursos de matemàtiques</a> · <a rel="license" href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.ca">CC BY-NC-SA 4.0</a></span></footer>
</div>`, 'index.html'));
console.log('ok', sessions.map(s => X[s.key].file).join(' '));
