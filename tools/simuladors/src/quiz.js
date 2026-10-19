/* ===== nivell Bàsic/Avançat, test autocorregit i utilitats (només recursos amb test) ===== */
const QI18N={
ca:{lvl_basic:"Bàsic",lvl_adv:"Avançat","aria.lvl":"Nivell de la pàgina","aria.quiz":"Test d'autoavaluació",
quiz_eyebrow:"Autoavaluació",quiz_title:"Posa't a prova",check:"Comprova",reset_quiz:"Torna a començar el test",
score:"Puntuació",answered:"respostes",correct:"Correcte.",wrong:"No exactament.",expected:"Resposta esperada:",ans_ph:"Escriu un número"},
es:{lvl_basic:"Básico",lvl_adv:"Avanzado","aria.lvl":"Nivel de la página","aria.quiz":"Test de autoevaluación",
quiz_eyebrow:"Autoevaluación",quiz_title:"Ponte a prueba",check:"Comprobar",reset_quiz:"Reiniciar el test",
score:"Puntuación",answered:"respuestas",correct:"Correcto.",wrong:"No exactamente.",expected:"Respuesta esperada:",ans_ph:"Escribe un número"}};
Object.assign(I18N.ca,QI18N.ca);Object.assign(I18N.es,QI18N.es);

const App={level:'basic',hooks:[],answers:{}};
try{const s=sessionStorage.getItem('ilde-level');if(s==='basic'||s==='adv')App.level=s;}catch(e){}
const nf=(x,d=2)=>Number(x).toLocaleString(LANG==='es'?'es-ES':'ca-ES',{maximumFractionDigits:d});
function fmtN(x){if(x===0)return'0';const a=Math.abs(x);if(a>=1e5||a<1e-2){const e=Math.floor(Math.log10(a));return nf(x/Math.pow(10,e),2)+'·10<sup>'+e+'</sup>';}return nf(x,a<10?2:a<1000?1:0);}
const tt=(k,...a)=>t(k,Object.assign({},a));
function fitCanvas(c,w,h){const d=Math.min(window.devicePixelRatio||1,2);c.width=w*d;c.height=h*d;const x=c.getContext('2d');x.setTransform(d,0,0,d,0,0);return x;}
function css(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim();}
function L(o){return typeof o==='string'?o:(o[LANG]||o.va||o.ca);}
const parseNum=s=>Number(String(s).trim().replace(/\s/g,'').replace(',','.'));

let QS=[];
function renderQuiz(){
  const box=$('#quiz');if(!box)return;
  const qs=QS.filter(q=>q.lvl==='all'||q.lvl===App.level);
  box.innerHTML='';let done=0,ok=0;
  qs.forEach((q,i)=>{
    const st=App.answers[q.id];
    const card=document.createElement('div');card.className='qcard'+(st?(st.ok?' ok':' ko'):'');
    const h=document.createElement('p');h.className='qtext';h.innerHTML='<b>'+(i+1)+'.</b> '+t(q.id+'.q');card.appendChild(h);
    if(q.type==='mc'){
      const o=document.createElement('div');o.className='opts';
      for(let j=0;j<q.n;j++){
        const b=document.createElement('button');b.type='button';b.className='opt';b.innerHTML=t(q.id+'.o'+j);
        if(st){b.disabled=true;if(j===q.ans)b.classList.add('right');else if(j===st.val)b.classList.add('wrong');}
        b.onclick=()=>{App.answers[q.id]={val:j,ok:j===q.ans};renderQuiz();};
        o.appendChild(b);
      }
      card.appendChild(o);
    }else{
      const row=document.createElement('div');row.className='numrow';
      const inp=document.createElement('input');inp.type='text';inp.inputMode='decimal';inp.placeholder=t('ans_ph');inp.setAttribute('aria-label',t('ans_ph'));
      const b=document.createElement('button');b.type='button';b.className='btn primary';b.textContent=t('check');
      if(st){inp.value=st.raw;inp.disabled=true;b.disabled=true;}
      const go=()=>{const v=parseNum(inp.value);if(!isFinite(v)||inp.value.trim()===''){inp.classList.add('bad');return;}
        const okk=Math.abs(v-q.num)<=Math.abs(q.num)*(q.tol!==undefined?q.tol:0.03)+1e-12;
        App.answers[q.id]={val:v,raw:inp.value,ok:okk};renderQuiz();};
      b.onclick=go;inp.onkeydown=e=>{if(e.key==='Enter')go();};
      row.append(inp);
      if(q.u){const u=document.createElement('span');u.className='unit';u.textContent=t(q.id+'.u');row.append(u);}
      row.append(b);card.appendChild(row);
    }
    if(st){
      const f=document.createElement('p');f.className='fb';
      const exp=q.type==='num'&&!st.ok?t('expected')+' <b>'+(q.sci?q.num.toExponential(2).replace('e+','·10^'):nf(q.num,Math.abs(q.num)>=100?0:3))+'</b>. ':'';
      f.innerHTML=(st.ok?'<b>✔ '+t('correct')+'</b> ':'<b>✘ '+t('wrong')+'</b> ')+exp+t(q.id+'.e');
      card.appendChild(f);done++;if(st.ok)ok++;
    }
    box.appendChild(card);
  });
  const sc=$('#score');if(sc)sc.innerHTML=t('score')+': <b>'+ok+' / '+qs.length+'</b> ('+done+' '+t('answered')+')';
}
function applyLevel(){
  $$('[data-lvl]').forEach(e=>{e.hidden=!(e.dataset.lvl==='all'||e.dataset.lvl===App.level);});
  $$('#lvlsw button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.level===App.level)));
  renderQuiz();
  App.hooks.forEach(f=>f());
}
function initQuiz(qs){
  QS=qs;
  $$('#lvlsw button').forEach(b=>b.addEventListener('click',()=>{App.level=b.dataset.level;try{sessionStorage.setItem('ilde-level',App.level);}catch(e){}applyLevel();}));
  const r=$('#resetQuiz');if(r)r.addEventListener('click',()=>{App.answers={};renderQuiz();});
  document.addEventListener('langchange',applyLevel);
}
