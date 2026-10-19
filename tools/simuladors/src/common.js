/* ===== utilitats comunes (idioma, canvas, colors) ===== */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const TAU=Math.PI*2;
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const lerp=(a,b,t)=>a+(b-a)*t;
const REDUCE=matchMedia('(prefers-reduced-motion: reduce)').matches;
let LANG='ca';
try{const s=localStorage.getItem('ilde-lang');if(s==='ca'||s==='es')LANG=s;}catch(e){}
const fmt=(x,d=2)=>Number.isFinite(x)?x.toFixed(d).replace('.',','):'—';
function t(k,p){
  let s=I18N[LANG]&&I18N[LANG][k]; if(s===undefined) s=I18N.ca[k]; if(s===undefined) return k;
  return p?s.replace(/\{(\w+)\}/g,(m,n)=>p[n]!==undefined?p[n]:m):s;
}
function applyLang(){
  document.documentElement.lang=LANG;
  $$('[data-i18n]').forEach(e=>{e.textContent=t(e.dataset.i18n);});
  $$('[data-i18n-html]').forEach(e=>{e.innerHTML=t(e.dataset.i18nHtml);});
  $$('[data-i18n-aria]').forEach(e=>{e.setAttribute('aria-label',t(e.dataset.i18nAria));});
  document.title=t('title');
  $$('.langsw button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===LANG)));
  document.dispatchEvent(new Event('langchange'));
}
function initLang(){
  $$('.langsw button').forEach(b=>b.addEventListener('click',()=>{
    LANG=b.dataset.lang; try{localStorage.setItem('ilde-lang',LANG);}catch(e){} applyLang();
  }));
}
/* colors del tema (llegits del CSS, es refresquen si canvia el mode clar/fosc) */
let _C=null;
function C(){
  if(_C) return _C;
  const s=getComputedStyle(document.documentElement), g=n=>s.getPropertyValue(n).trim();
  return _C={bg:g('--bg'),panel:g('--panel'),stage:g('--stage'),ink:g('--ink'),muted:g('--muted'),line:g('--line'),
    pa:g('--pa'),pb:g('--pb'),ok:g('--ok'),warn:g('--warn'),chip:g('--chip'),
    dark:matchMedia('(prefers-color-scheme: dark)').matches};
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{_C=null;document.dispatchEvent(new Event('themechange'));});
/* canvas amb coordenades lògiques W×H i nitidesa en pantalles de molta densitat */
function makeCanvas(cv,W,H,onResize){
  cv.style.aspectRatio=W+'/'+H;
  const o={cv,W,H,ctx:cv.getContext('2d'),s:1};
  function fit(){
    const r=cv.getBoundingClientRect(); if(!r.width) return;
    const dpr=Math.min(window.devicePixelRatio||1,2.5);
    cv.width=Math.round(r.width*dpr); cv.height=Math.round(r.width*dpr*H/W);
    o.s=cv.width/W; o.ctx.setTransform(o.s,0,0,o.s,0,0);
    if(onResize) onResize();
  }
  new ResizeObserver(fit).observe(cv); fit();
  o.pt=ev=>{const r=cv.getBoundingClientRect();return {x:(ev.clientX-r.left)*W/r.width,y:(ev.clientY-r.top)*H/r.height};};
  return o;
}
function rrect(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
/* nombres aleatoris amb llavor opcional i gaussians */
function randn(){let u=0,v=0;while(!u)u=Math.random();v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(TAU*v);}
/* controls: crea un lliscador amb etiqueta i valor */
function slider(host,{id,key,min,max,step,val,fmtv,on}){
  const d=document.createElement('div');d.className='ctl';
  d.innerHTML='<label for="'+id+'" data-i18n="'+key+'"></label><output id="'+id+'-o"></output><input type="range" id="'+id+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+val+'">';
  host.appendChild(d);
  const inp=d.querySelector('input'),out=d.querySelector('output');
  const upd=()=>{out.textContent=fmtv?fmtv(+inp.value):inp.value;};
  inp.addEventListener('input',()=>{upd();on&&on(+inp.value);});
  upd();
  return {el:d,inp,out,set(v){inp.value=v;upd();},get:()=>+inp.value,refresh:upd,disable(f){d.classList.toggle('off',f);inp.disabled=f;}};
}
