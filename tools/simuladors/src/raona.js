/* ===== Raona-ho: motor compartit (missions, sempre/de vegades/mai, qui té raó, decideix) =====
   Cada animació crida RZ.init({F, M, S, E, D, sim}) amb el seu contingut; el text específic va al seu diccionari I18N.
   Claus per tarea <id>: .q (enunciat), .more (pregunta final), .h/.e (pista/explicació de S),
   .ctx .n0 .n1 .s0 .s1 .w0 .w1 .w2 .frame .model (E; w0 és sempre la raó correcta), .l0.. (etiquetes de camps de D). */
const RZC={
ca:{rz_eyebrow:"Raona-ho",rz_title:"Pensa abans de tocar",
rz_intro:"Quatre maneres d'exprimir el simulador: problemes al revés, afirmacions per a desmuntar, errors d'uns altres i decisions de la vida real. El simulador fa de jutge.",
"aria.rz":"Tipus d'activitat",rz_tM:"🎯 Missions",rz_tS:"Sempre, de vegades o mai?",rz_tE:"Qui té raó?",rz_tD:"Decideix",
mission:"Missió",to_sim:"Mostra-ho al simulador",rz_bad:"Escriu nombres vàlids als requadres.",rz_pick:"Tria una opció.",
rz_done:"✔ Missió complida!",rz_cx_ok:"✔ Contraexemple trobat.",rz_dec_ok:"✔ Ben decidit!",
m_count:"Missions complides: {0} de {1}",
s_S:"Sempre",s_D:"De vegades",s_M:"Mai",s_ok:"✔ Correcte.",s_wrong:"✘ Torna-ho a pensar. {0}",
s_cx_ask:"Ara demostra-ho: troba un cas on <b>no</b> es complisca.",s_count:"Afirmacions resoltes: {0} de {1}",
e_who:"Qui té raó?",e_both:"Tots dos",e_none:"Cap dels dos",e_why:"Per què?",e_ok:"✔ Exacte.",e_ko:"✘ No ho és. Torna a llegir el que diu cadascú.",
e_ko2:"✘ Aquesta raó no explica l'error. Prova una altra.",e_write:"Ara explica-li-ho a qui s'ha equivocat, amb les teues paraules:",
e_model_btn:"Compara amb una resposta model",e_model:"Una resposta possible:"},
es:{rz_eyebrow:"Razónalo",rz_title:"Piensa antes de tocar",
rz_intro:"Cuatro maneras de exprimir el simulador: problemas al revés, afirmaciones para desmontar, errores ajenos y decisiones de la vida real. El simulador hace de juez.",
"aria.rz":"Tipo de actividad",rz_tM:"🎯 Misiones",rz_tS:"¿Siempre, a veces o nunca?",rz_tE:"¿Quién tiene razón?",rz_tD:"Decide",
mission:"Misión",to_sim:"Muéstralo en el simulador",rz_bad:"Escribe números válidos en los recuadros.",rz_pick:"Elige una opción.",
rz_done:"✔ ¡Misión cumplida!",rz_cx_ok:"✔ Contraejemplo encontrado.",rz_dec_ok:"✔ ¡Bien decidido!",
m_count:"Misiones cumplidas: {0} de {1}",
s_S:"Siempre",s_D:"A veces",s_M:"Nunca",s_ok:"✔ Correcto.",s_wrong:"✘ Vuelve a pensarlo. {0}",
s_cx_ask:"Ahora demuéstralo: encuentra un caso en el que <b>no</b> se cumpla.",s_count:"Afirmaciones resueltas: {0} de {1}",
e_who:"¿Quién tiene razón?",e_both:"Los dos",e_none:"Ninguno",e_why:"¿Por qué?",e_ok:"✔ Exacto.",e_ko:"✘ No es así. Vuelve a leer lo que dice cada uno.",
e_ko2:"✘ Esa razón no explica el error. Prueba otra.",e_write:"Ahora explícaselo a quien se ha equivocado, con tus palabras:",
e_model_btn:"Compara con una respuesta modelo",e_model:"Una respuesta posible:"}};
Object.assign(I18N.ca,RZC.ca);Object.assign(I18N.es,RZC.es);

const RZ=(()=>{
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num=v=>{const s=String(v==null?'':v).trim();if(!s)return null;const x=parseNum(s);return Number.isFinite(x)?x:null;};
const Mt=m=>m?tt(m.k,...(typeof m.p==='function'?m.p():(m.p||[]))):'';
const has=k=>t(k)!==k;
let cfg={},F={},sh=false;
const KINDS=['M','S','E','D'];
function fdef(f){return typeof f==='string'?(F[f]||{l:f}):f;}
function mkst(task){task.st=Object.assign({v:(task.f||[]).map(()=>''),ok:false,msg:null,pick:null,choice:null,cxOk:false,cxMsg:null,who:null,why:null,txt:'',model:false},{});return task;}
function fieldsHTML(task){return (task.f||[]).map((f,i)=>{const d=fdef(f);
  return '<label class="pairin">'+(d.l?t(d.l)+' ':'')+'<input type="text" inputmode="decimal" autocomplete="off" data-i="'+i+'" value="'+esc(task.st.v[i])+'">'+(d.u?'<span>'+d.u+'</span>':'')+'</label>';}).join(' ');}
function bind(el,task,go){$$('input[data-i]',el).forEach(i=>{i.oninput=()=>{task.st.v[+i.dataset.i]=i.value;};i.onkeydown=e=>{if(e.key==='Enter'&&go)go();};});}
function vals(task){const v=task.st.v.map(num);return v.some(x=>x===null)?null:v;}
function simBtn(task){return (task.sim!==null&&(task.sim||cfg.sim))?'<button class="btn" type="button" data-act="sim">'+t('to_sim')+'</button>':'';}
function goSim(task,v){const f=task.sim||cfg.sim;if(f)f(v,task);}
function show(el){el.scrollIntoView({behavior:REDUCE?'auto':'smooth',block:'center'});}

function renderM(){
  const box=$('#rzM'),L=cfg.M||[];if(!box)return;const done=L.filter(m=>m.st.ok).length;
  box.innerHTML='<p class="score">'+tt('m_count',done,L.length)+'</p>'+L.map((m,i)=>
    '<div class="task'+(m.st.ok?' done':'')+'" data-id="'+m.id+'"><p class="q"><b>'+t('mission')+' '+(i+1)+'.</b> '+t(m.id+'.q')+'</p>'+
    '<div class="row">'+fieldsHTML(m)+'<button class="btn primary" type="button" data-act="chk">'+t('check')+'</button>'+simBtn(m)+'</div>'+
    '<p class="msg '+(m.st.msg?(m.st.ok?'good':'bad'):'')+'" aria-live="polite">'+Mt(m.st.msg)+'</p>'+
    (m.st.ok&&has(m.id+'.more')?'<p class="more">'+t(m.id+'.more')+'</p>':'')+'</div>').join('');
  L.forEach(m=>{const el=$('.task[data-id="'+m.id+'"]',box);
    const go=()=>{const v=vals(m);if(!v){m.st.msg={k:'rz_bad'};m.st.ok=false;renderM();return;}
      const f=m.chk(v,m.st.v);m.st.ok=!f;m.st.msg=f||(m.ok?m.ok(v,m.st.v):{k:'rz_done'});renderM();};
    bind(el,m,go);$('[data-act=chk]',el).onclick=go;
    const sb=$('[data-act=sim]',el);if(sb)sb.onclick=()=>{const v=vals(m);if(v)goSim(m,v);else{m.st.msg={k:'rz_bad'};renderM();}};});
}

function renderS(){
  const box=$('#rzS'),L=cfg.S||[];if(!box)return;
  const fin=s=>s.st.ok&&(s.ans!=='D'||s.st.cxOk),done=L.filter(fin).length;
  box.innerHTML='<p class="score">'+tt('s_count',done,L.length)+'</p>'+L.map(s=>{
    const st=s.st;
    let h='<div class="task'+(fin(s)?' done':'')+'" data-id="'+s.id+'"><p class="q">'+t(s.id+'.q')+'</p><div class="sdm">'+
      ['S','D','M'].map(c=>'<button class="opt" type="button" data-c="'+c+'" aria-pressed="'+(st.choice===c)+'"'+(st.ok?' disabled':'')+'>'+t('s_'+c)+'</button>').join('')+'</div>';
    if(typeof s.sim==='function')h+='<div class="row"><button class="btn" type="button" data-act="ssim">'+t('to_sim')+'</button></div>';
    if(st.choice&&!st.ok)h+='<p class="msg bad">'+tt('s_wrong',t(s.id+'.h'))+'</p>';
    if(st.ok){h+='<p class="msg good">'+t('s_ok')+'</p>';
      if(s.ans==='D'&&!st.cxOk){h+='<p>'+t('s_cx_ask')+'</p><div class="row">'+fieldsHTML(s)+'<button class="btn primary" type="button" data-act="cx">'+t('check')+'</button></div>';
        if(st.cxMsg)h+='<p class="msg bad">'+Mt(st.cxMsg)+'</p>';}
      if(st.cxOk)h+='<p class="msg good">'+Mt(st.cxMsg)+'</p>';
      if(fin(s))h+='<p class="idea">'+t(s.id+'.e')+'</p>';}
    return h+'</div>';}).join('');
  L.forEach(s=>{const el=$('.task[data-id="'+s.id+'"]',box);
    $$('.sdm .opt',el).forEach(b=>b.onclick=()=>{s.st.choice=b.dataset.c;s.st.ok=b.dataset.c===s.ans;renderS();});
    const ss=$('[data-act=ssim]',el);if(ss)ss.onclick=()=>s.sim([],s);
    const cb=$('[data-act=cx]',el);if(cb){
      const go=()=>{const v=vals(s);if(!v){s.st.cxMsg={k:'rz_bad'};renderS();return;}
        const f=s.cx(v,s.st.v);s.st.cxOk=!f;s.st.cxMsg=f||(s.cxok?s.cxok(v,s.st.v):{k:'rz_cx_ok'});renderS();if(!f){const g=s.cxsim===undefined?cfg.sim:s.cxsim;if(g)g(v,s);}};
      bind(el,s,go);cb.onclick=go;}
  });
}

function renderE(){
  const box=$('#rzE'),L=cfg.E||[];if(!box)return;
  box.innerHTML=L.map(e=>{const st=e.st,whoOk=st.who===e.who,whyOk=whoOk&&st.why===0;
    const names=[t(e.id+'.n0'),t(e.id+'.n1'),t('e_both'),t('e_none')];
    let h='<div class="task'+(whyOk?' done':'')+'" data-id="'+e.id+'"><p class="q">'+t(e.id+'.ctx')+'</p>'+
      '<div class="who"><div class="bubble"><b>'+names[0]+'</b>'+t(e.id+'.s0')+'</div><div class="bubble"><b>'+names[1]+'</b>'+t(e.id+'.s1')+'</div></div>'+
      '<p class="q"><b>1.</b> '+t('e_who')+'</p><div class="whobtn">'+names.map((n,i)=>'<button class="opt" type="button" data-who="'+i+'" aria-pressed="'+(st.who===i)+'"'+(whoOk?' disabled':'')+'>'+n+'</button>').join('')+'</div>';
    if(st.who!==null)h+='<p class="msg '+(whoOk?'good':'bad')+'">'+t(whoOk?'e_ok':'e_ko')+'</p>';
    if(whoOk){h+='<p class="q"><b>2.</b> '+t('e_why')+'</p><div class="whyopts">'+e.order.map(i=>'<button class="opt" type="button" data-why="'+i+'" aria-pressed="'+(st.why===i)+'"'+(whyOk?' disabled':'')+'>'+t(e.id+'.w'+i)+'</button>').join('')+'</div>';
      if(st.why!==null)h+='<p class="msg '+(whyOk?'good':'bad')+'">'+t(whyOk?'e_ok':'e_ko2')+'</p>';}
    if(whyOk){h+='<p class="q"><b>3.</b> '+t('e_write')+'</p><textarea placeholder="'+esc(t(e.id+'.frame'))+'" aria-label="'+esc(t('e_write'))+'">'+esc(st.txt)+'</textarea>'+
      '<div class="row"><button class="btn" type="button" data-act="model">'+t('e_model_btn')+'</button>'+((e.sim||cfg.sim)&&e.sim!==null?'<button class="btn" type="button" data-act="sim">'+t('to_sim')+'</button>':'')+'</div>';
      if(st.model)h+='<div class="model"><b>'+t('e_model')+'</b> '+t(e.id+'.model')+'</div>';}
    return h+'</div>';}).join('');
  L.forEach(e=>{const el=$('.task[data-id="'+e.id+'"]',box);
    $$('[data-who]',el).forEach(b=>b.onclick=()=>{e.st.who=+b.dataset.who;e.st.why=null;renderE();});
    $$('[data-why]',el).forEach(b=>b.onclick=()=>{e.st.why=+b.dataset.why;renderE();});
    const ta=$('textarea',el);if(ta)ta.oninput=()=>{e.st.txt=ta.value;};
    const mb=$('[data-act=model]',el);if(mb)mb.onclick=()=>{e.st.model=true;renderE();};
    const sb=$('[data-act=sim]',el);if(sb)sb.onclick=()=>goSim(e,e.args||[]);});
}

function renderD(){
  const box=$('#rzD'),L=cfg.D||[];if(!box)return;
  box.innerHTML=L.map(d=>{
    let h='<div class="task'+(d.st.ok?' done':'')+'" data-id="'+d.id+'"><p class="q">'+t(d.id+'.q')+'</p><div class="row">';
    if(d.chips)h+='<span class="pairin">'+t(d.id+'.lc')+'</span><div class="chips">'+d.chips.vals.map(x=>'<button class="chip" type="button" data-pick="'+x+'" aria-pressed="'+(d.st.pick===x)+'">'+(d.chips.fmt?d.chips.fmt(x):String(x).replace('.',','))+(d.chips.u?' '+t(d.chips.u):'')+'</button>').join('')+'</div>';
    h+=fieldsHTML(d)+'<button class="btn primary" type="button" data-act="chk">'+t('check')+'</button>'+simBtn(d)+'</div>';
    h+='<p class="msg '+(d.st.msg?(d.st.ok?'good':'bad'):'')+'" aria-live="polite">'+Mt(d.st.msg)+'</p>';
    if(d.st.ok&&has(d.id+'.more'))h+='<p class="more">'+t(d.id+'.more')+'</p>';
    return h+'</div>';}).join('');
  L.forEach(d=>{const el=$('.task[data-id="'+d.id+'"]',box);
    $$('[data-pick]',el).forEach(b=>b.onclick=()=>{d.st.pick=+b.dataset.pick;renderD();});
    const args=()=>{const v=vals(d);if(!v)return null;return d.chips?[d.st.pick].concat(v):v;};
    const go=()=>{if(d.chips&&d.st.pick===null){d.st.msg={k:'rz_pick'};d.st.ok=false;renderD();return;}
      const v=args();if(!v){d.st.msg={k:'rz_bad'};d.st.ok=false;renderD();return;}
      const f=d.chk(v,d.st.v);d.st.ok=!f;d.st.msg=f||(d.ok?d.ok(v,d.st.v):{k:'rz_dec_ok'});renderD();};
    bind(el,d,go);$('[data-act=chk]',el).onclick=go;
    const sb=$('[data-act=sim]',el);if(sb)sb.onclick=()=>{const v=args();goSim(d,v||[]);};});
}
function render(){renderM();renderS();renderE();renderD();}
function init(c){
  cfg=c;F=c.F||{};
  KINDS.forEach(k=>(cfg[k]||[]).forEach(mkst));
  (cfg.E||[]).forEach(e=>{e.order=[0,1,2].sort(()=>Math.random()-.5);});
  const first=KINDS.find(k=>(cfg[k]||[]).length)||'M';let tab=first;
  $$('#rztabs button').forEach(b=>{const k=b.dataset.t;if(!(cfg[k]||[]).length){b.hidden=true;return;}
    b.setAttribute('aria-pressed',String(k===tab));
    b.onclick=()=>{tab=k;$$('#rztabs button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));KINDS.forEach(q=>{const p=$('#rz'+q);if(p)p.hidden=q!==tab;});};});
  KINDS.forEach(q=>{const p=$('#rz'+q);if(p)p.hidden=q!==tab;});
  App.hooks.push(render);
}
return {init,show,render};
})();
