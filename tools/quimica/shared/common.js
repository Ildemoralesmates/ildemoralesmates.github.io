/* Utilitats comunes (T i LANG els injecta build.py abans d'aquest fitxer) */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];

function t(k,...a){let s=T[k];if(s===undefined)return k;const o=(a.length===1&&a[0]&&typeof a[0]==='object')?a[0]:a;for(const i in o)s=s.split('{'+i+'}').join(o[i]);return s;}
function fmt(x,d=2){return Number(x).toLocaleString(LANG==='va'?'ca-ES':'es-ES',{maximumFractionDigits:d});}
function clamp(x,a,b){return Math.max(a,Math.min(b,x));}
function lerp(a,b,u){return a+(b-a)*u;}
function ease(u){u=clamp(u,0,1);return u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;}
function gcd(a,b){return b?gcd(b,a%b):Math.abs(a);}

/* Fórmula en HTML: H2O -> H<sub>2</sub>O */
function fm(s){return s.replace(/([A-Za-z\)])(\d+)/g,'$1<sub>$2</sub>');}

/* Colors del tema (es refresquen si canvia el mode clar/fosc) */
const C={};
function refreshTheme(){const cs=getComputedStyle(document.documentElement);
  ['bg','card','ink','mut','line','acc','acc2','ok','ko','chip','cv'].forEach(n=>{C[n]=cs.getPropertyValue('--'+n).trim();});}
refreshTheme();
if(window.matchMedia){const mq=matchMedia('(prefers-color-scheme: dark)');
  (mq.addEventListener?mq.addEventListener.bind(mq,'change'):mq.addListener.bind(mq))(refreshTheme);}

/* Canvas amb unitats lògiques w×h, nítid en pantalles denses */
function setupCanvas(c,w,h){const d=Math.min(window.devicePixelRatio||1,2);
  c.width=Math.round(w*d);c.height=Math.round(h*d);
  c.style.aspectRatio=w+' / '+h;
  const x=c.getContext('2d');x.setTransform(d,0,0,d,0,0);
  c.lw=w;c.lh=h;return x;}

/* Coordenades del ratolí/dit en unitats lògiques */
function canvasPos(c,ev){const r=c.getBoundingClientRect();
  const p=ev.touches?ev.touches[0]:ev;
  return {x:(p.clientX-r.left)*c.lw/r.width,y:(p.clientY-r.top)*c.lh/r.height};}

/* Text amb subíndexs: dibuixa "Fe2O3" a (x,y); align: left|center|right */
function drawFormula(ctx,s,x,y,size,align,color){
  size=size||16;const sub=Math.round(size*.68);
  const parts=[];const re=/([A-Za-z\)\(·→+\-−]+|\d+)/g;let m,prev='';
  while((m=re.exec(s))){const tok=m[0];
    const isSub=/^\d+$/.test(tok)&&/[A-Za-z\)]$/.test(prev);
    parts.push({tok,isSub});prev=tok;}
  let w=0;parts.forEach(p=>{ctx.font=(p.isSub?sub:size)+'px system-ui,sans-serif';p.w=ctx.measureText(p.tok).width;w+=p.w;});
  let cx=align==='center'?x-w/2:align==='right'?x-w:x;
  ctx.fillStyle=color||C.ink;ctx.textAlign='left';ctx.textBaseline='alphabetic';
  parts.forEach(p=>{ctx.font=(p.isSub?sub:size)+'px system-ui,sans-serif';
    ctx.fillText(p.tok,cx,y+(p.isSub?size*.22:0));cx+=p.w;});
  return w;}

/* Rectangle arrodonit */
function rr(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}

/* Bucle d'animació amb dt limitat */
function loop(fn){let last=performance.now();
  function f(now){const dt=Math.min((now-last)/1000,.05);last=now;fn(dt,now/1000);requestAnimationFrame(f);}
  requestAnimationFrame(f);}

/* Preferència de moviment reduït */
const REDUCED=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
