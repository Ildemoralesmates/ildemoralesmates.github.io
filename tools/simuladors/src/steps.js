/* ===== passos amb predicció: cada pas té text, pregunta de predicció i pregunta per a pensar ===== */
const SI18N={
ca:{st_prev:"← Anterior",st_next:"Següent →",st_restart:"Torna a l'inici",st_step:"Pas {a} de {b}",st_predict:"Predix abans de veure",st_think:"Pensa-hi",
st_hint:"Mostra una pista",st_hide:"Amaga la pista",st_ok:"Correcte!",st_ko:"No exactament.","aria.steps":"Passos de l'animació","aria.stage":"Dibuix de l'animació",
sl_cells:"Cèl·lules",sl_chrom:"Cromosomes per cèl·lula",sl_chromat:"Cromàtides per cromosoma",sl_dna:"ADN per cèl·lula",sl_chrompol:"Cromosomes per pol",sl_dnatot:"ADN total"},
es:{st_prev:"← Anterior",st_next:"Siguiente →",st_restart:"Volver al inicio",st_step:"Paso {a} de {b}",st_predict:"Predice antes de ver",st_think:"Piénsalo",
st_hint:"Ver una pista",st_hide:"Ocultar la pista",st_ok:"¡Correcto!",st_ko:"No exactamente.","aria.steps":"Pasos de la animación","aria.stage":"Dibujo de la animación",
sl_cells:"Células",sl_chrom:"Cromosomas por célula",sl_chromat:"Cromátidas por cromosoma",sl_dna:"ADN por célula",sl_chrompol:"Cromosomas por polo",sl_dnatot:"ADN total"}};
Object.assign(I18N.ca,SI18N.ca);Object.assign(I18N.es,SI18N.es);
const SE={i:0,steps:[],ans:{},hint:{},cb:null};
function stepsInit(steps,cb){
  SE.steps=steps;SE.cb=cb;
  const sp=$('#stepper');
  steps.forEach((s,k)=>{const b=document.createElement('button');b.type='button';b.textContent=k+1;b.onclick=()=>stepGo(k);sp.appendChild(b);});
  $('#prev').onclick=()=>stepGo(SE.i-1);
  $('#next').onclick=()=>stepGo(SE.i+1);
  $('#restart').onclick=()=>{SE.ans={};SE.hint={};stepGo(0);};
  document.addEventListener('langchange',stepRender);
  stepGo(0);
}
function stepGo(i){
  i=Math.max(0,Math.min(SE.steps.length-1,i));
  const prev=SE.i;SE.i=i;stepRender();
  if(SE.cb)SE.cb(i,prev);
}
function stepRender(){
  const s=SE.steps[SE.i],id=s.id;
  $$('#stepper button').forEach((b,k)=>{
    if(k===SE.i)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');
    b.className=(SE.ans[SE.steps[k].id]!==undefined&&k!==SE.i)?'done':'';
  });
  $('#stepno').textContent=t('st_step',{a:SE.i+1,b:SE.steps.length});
  const T=$('#stitle');T.dataset.i18n=id+'.title';T.textContent=t(id+'.title');
  const X=$('#stext');X.dataset.i18nHtml=id+'.text';X.innerHTML=t(id+'.text');
  const st=$('#sstats');st.innerHTML='';
  (s.stats||[]).forEach((p,j)=>{
    const d=document.createElement('div');d.className='stat';
    d.innerHTML='<span class="k">'+t(p[0])+'</span><span class="v">'+(I18N.ca[id+'.sv'+j]!==undefined?t(id+'.sv'+j):p[1])+'</span>';
    st.appendChild(d);
  });
  st.hidden=!(s.stats&&s.stats.length);
  const ask=$('#sask');ask.innerHTML='';ask.hidden=!s.ask;
  if(s.ask){
    const a=SE.ans[id],c=document.createElement('div');c.className='pred';
    c.innerHTML='<span class="eb">'+t('st_predict')+'</span><p class="qtext">'+t(id+'.q')+'</p>';
    const o=document.createElement('div');o.className='opts';
    for(let j=0;j<s.ask.n;j++){
      const b=document.createElement('button');b.type='button';b.className='opt';b.innerHTML=t(id+'.o'+j);
      if(a!==undefined){b.disabled=true;if(j===s.ask.ok)b.classList.add('right');else if(j===a)b.classList.add('wrong');}
      b.onclick=()=>{SE.ans[id]=j;stepRender();};
      o.appendChild(b);
    }
    c.appendChild(o);
    if(a!==undefined){const f=document.createElement('p');f.className='fb';f.innerHTML='<b>'+(a===s.ask.ok?t('st_ok'):t('st_ko'))+'</b> '+t(id+'.why');c.appendChild(f);}
    ask.appendChild(c);
  }
  const th=$('#sthink');th.innerHTML='';th.hidden=!s.think;
  if(s.think){
    const c=document.createElement('div');c.className='think';
    c.innerHTML='<span class="eb">'+t('st_think')+'</span><p class="qtext">'+t(id+'.tq')+'</p>';
    const open=!!SE.hint[id];
    const b=document.createElement('button');b.type='button';b.className='linkb';b.textContent=open?t('st_hide'):t('st_hint');
    b.onclick=()=>{SE.hint[id]=!SE.hint[id];stepRender();};
    c.appendChild(b);
    if(open){const f=document.createElement('p');f.className='fb';f.innerHTML=t(id+'.th');c.appendChild(f);}
    th.appendChild(c);
  }
  $('#prev').disabled=(SE.i===0);$('#next').disabled=(SE.i===SE.steps.length-1);
}
