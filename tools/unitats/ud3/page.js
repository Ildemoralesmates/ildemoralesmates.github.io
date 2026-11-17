const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
// ---------- revelar pas a pas dins d'una unitat ----------
function syncFig(u) {
  $$('.fig', u).forEach(f => {
    const st = $$('.stage', f); if (!st.length) return;
    if (!f.dataset.sync) { st.forEach(s => s.classList.add('on')); return; }
    const wk = $('.wk', u); const n = wk ? $$('.step', wk).filter(s => !s.classList.contains('hid')).length : 99;
    let best = null; st.forEach(s => { if (+s.dataset.st <= n) best = s; });
    st.forEach(s => s.classList.toggle('on', s === best)); f.hidden = !best;
  });
}
function reveal(el) { el.classList.remove('hid'); const p = el.previousElementSibling; if (p && p.classList.contains('pend')) p.hidden = true; }
const stepper = u => ({
  next() { const r = $$('.rv.hid', u)[0]; if (!r) return false; reveal(r); syncFig(u); return true; },
  all() { $$('.rv.hid', u).forEach(reveal); syncFig(u); },
  reset() { $$('.rv', u).forEach(r => r.classList.add('hid')); $$('.pend', u).forEach(p => p.hidden = false); syncFig(u); },
});
$$('.u').forEach(u => {
  u.st = stepper(u); syncFig(u);
  const c = $('.ctrl', u); if (!c) return;
  $('.nx', c).onclick = () => u.st.next(); $('.al', c).onclick = () => u.st.all(); $('.rs', c).onclick = () => u.st.reset();
});
// ---------- animacions: es carreguen quan es demanen ----------
$$('.ld').forEach(b => b.onclick = () => { const f = document.createElement('iframe'); f.src = b.dataset.src; f.title = 'Animació'; b.closest('.ph').replaceWith(f); });
// ---------- Raona-ho ----------
let right = 0, done = 0; const tasks = $$('.task');
tasks.forEach(t => {
  const c = +t.dataset.c, ops = $$('.opt', t), fb = $('.fb', t), why = $('template', t).innerHTML;
  ops.forEach((b, j) => b.onclick = () => {
    const ok = j === c; done++; if (ok) right++;
    ops.forEach((x, i) => { x.disabled = true; if (i === c) x.classList.add('ok'); }); if (!ok) b.classList.add('no');
    fb.className = 'fb ' + (ok ? 'ok' : 'no'); fb.innerHTML = (ok ? '<b>Correcte.</b> ' : '<b>No.</b> ') + why;
    const sc = $('.score'); if (sc && done === tasks.length) sc.textContent = `Has encertat ${right} de ${tasks.length}.`;
  });
});
// ---------- mode projecció: una unitat per pantalla ----------
const U = [];
$$('section.blk, section.rec').forEach(sec => {
  const items = $$(':scope > .item', sec), t = sec.dataset.t || '';
  if (items.length) items.forEach((it, i) => U.push({ sec, item: it, first: i === 0, title: `${t} · ${i + 1}/${items.length}` }));
  else U.push({ sec, item: null, first: true, title: t });
});
let cur = 0;
function go(k) {
  cur = Math.max(0, Math.min(U.length - 1, k)); const u = U[cur];
  $$('section.blk, section.rec').forEach(x => x.classList.toggle('off', x !== u.sec));
  $$(':scope > .item', u.sec).forEach(x => x.classList.toggle('off', x !== u.item));
  $$(':scope > .intro, :scope > p.note', u.sec).forEach(x => x.classList.toggle('off', !!u.item && !u.first));
  $('#pPos').textContent = `${u.title}  ·  ${cur + 1}/${U.length}`; window.scrollTo(0, 0);
}
const unitOf = u => u.item || $(':scope > .u', u.sec);
function fwd() {
  const u = U[cur], el = unitOf(u);
  if (el && el.st && el.st.next()) { const r = $$('.rv:not(.hid)', el).pop(); const f = $('.fig:not([hidden])', el); (f && f.dataset.sync ? f : r)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return; }
  if (u.item && u.first && $(':scope > .intro .u', u.sec)?.st?.next()) return;
  go(cur + 1);
}
if ($('#pNext')) { $('#pNext').onclick = fwd; $('#pPrev').onclick = () => go(cur - 1); }
document.addEventListener('keydown', e => {
  if (!document.body.classList.contains('proj') || e.target.matches('input,textarea')) return;
  if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); fwd(); }
  else if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); go(cur - 1); }
  else if (e.key === 'Escape') $('#projBtn').click();
});
const pb = $('#projBtn');
if (pb) pb.onclick = () => {
  const on = document.body.classList.toggle('proj'); pb.setAttribute('aria-pressed', on); pb.textContent = on ? 'Ix de la projecció' : 'Mode projecció';
  if (on) { $$('.u').forEach(u => u.st.reset()); go(0); } else $$('.off').forEach(x => x.classList.remove('off'));
};
// ---------- temporitzador ----------
let tid = null;
$$('.timer [data-t]').forEach(b => b.onclick = () => {
  let s = +b.dataset.t; clearInterval(tid); const o = $('#tOut');
  const draw = () => { o.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; o.style.color = s <= 30 ? 'var(--bad)' : ''; };
  draw(); tid = setInterval(() => { s--; draw(); if (s <= 0) clearInterval(tid); }, 1000);
});
// ---------- màquina de convertir (SA, sessió 2) ----------
if ($('#cvGo')) {
  const num = v => Number(String(v).replace(/\s/g, '').replace(',', '.'));
  const f = (x, d = 2) => x.toLocaleString('ca-ES', { minimumFractionDigits: d, maximumFractionDigits: d });
  const run = () => {
    const p = num($('#cvP').value), e = num($('#cvE').value), o = $('#cvOut');
    if (!(p > 0) || !(e >= 0)) { o.innerHTML = '<p class="fb no">Escriu dos preus positius.</p>'; return; }
    const ant = p / 166.386, r = Math.round(ant * 100) / 100, dif = e - r, c = dif / r;
    const S = [['Pas 1 · Pessetes a euros', `${f(p, 0)} : 166,386 = ${f(ant, 4)} €`], ['Pas 2 · Arrodonir', `${f(r)} €`], ['Pas 3 · Diferència', `${f(e)} − ${f(r)} = ${f(dif)} €`], ['Pas 4 · Canvi', `${f(dif)} : ${f(r)} = ${f(c, 3)}`], ['Pas 5 · Percentatge', `${f(c * 100, 1)} % ${c >= 0 ? 'de pujada' : 'de baixada'}`]];
    o.innerHTML = S.map(([a, b]) => `<div class="step"><div class="lab">${a}</div><div>${b}</div></div>`).join('');
  };
  $('#cvGo').onclick = run; run();
}
