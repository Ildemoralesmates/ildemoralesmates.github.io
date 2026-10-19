(()=>{
/* ---------- dades ---------- */
const EL={
  H:{c:'#ffffff',r:8,s:'#7a859b'},
  C:{c:'#3d4451',r:13,s:'#161b26',tx:'#fff'},
  O:{c:'#e03131',r:12,s:'#9c1c1c',tx:'#fff'},
  N:{c:'#3b5bdb',r:12,s:'#22389a',tx:'#fff'},
  Fe:{c:'#d9822b',r:14,s:'#8f5110',tx:'#fff'}
};
const ELORDER=['C','H','N','O','Fe'];
const SP={
  H2:{a:{H:2},m:[['H',-9,0],['H',9,0]]},
  O2:{a:{O:2},m:[['O',-12,0],['O',12,0]]},
  N2:{a:{N:2},m:[['N',-12,0],['N',12,0]]},
  H2O:{a:{H:2,O:1},m:[['O',0,-5],['H',-15,10],['H',15,10]]},
  NH3:{a:{N:1,H:3},m:[['N',0,2],['H',0,-18],['H',-17,13],['H',17,13]]},
  CH4:{a:{C:1,H:4},m:[['C',0,0],['H',0,-21],['H',0,21],['H',-21,0],['H',21,0]]},
  CO2:{a:{C:1,O:2},m:[['O',-26,0],['C',0,0],['O',26,0]]},
  C3H8:{a:{C:3,H:8},m:[['C',-28,0],['C',0,0],['C',28,0],['H',-28,-20],['H',-28,20],['H',0,-20],['H',0,20],['H',28,-20],['H',28,20],['H',-47,0],['H',47,0]]},
  Fe:{a:{Fe:1},m:[['Fe',0,0]]},
  Fe2O3:{a:{Fe:2,O:3},m:[['Fe',-15,-7],['Fe',15,-7],['O',-26,12],['O',0,16],['O',26,12]]}
};
Object.values(SP).forEach(s=>{let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
  s.m.forEach(([e,x,y])=>{const r=EL[e].r;x0=Math.min(x0,x-r);x1=Math.max(x1,x+r);y0=Math.min(y0,y-r);y1=Math.max(y1,y+r);});
  s.w=x1-x0;s.h=y1-y0;s.cx=(x0+x1)/2;s.cy=(y0+y1)/2;
  s.n=Object.values(s.a).reduce((p,q)=>p+q,0);});
const RX=[
  {id:'aigua',  re:['H2','O2'],   pr:['H2O'],        sol:[2,1,2]},
  {id:'amoniac',re:['N2','H2'],   pr:['NH3'],        sol:[1,3,2]},
  {id:'metana', re:['CH4','O2'],  pr:['CO2','H2O'],  sol:[1,2,1,2]},
  {id:'ferro',  re:['Fe','O2'],   pr:['Fe2O3'],      sol:[4,3,2]},
  {id:'propa',  re:['C3H8','O2'], pr:['CO2','H2O'],  sol:[1,5,3,4]}
];
const MAXC=12;

/* ---------- estat ---------- */
let mode='explore',rx=0,coef=[1,1,1];
const chal={idx:0,hints:[0,0,0,0,0],solved:[false,false,false,false,false],done:false};
const pops={}; /* índex d'espècie -> {from,t0} */
let ang=0,vel=0,target=0,wasSolved=false,confetti=[];

const cvs=$('#bal'),ctx=setupCanvas(cvs,800,440);
const spList=()=>[...RX[rx].re,...RX[rx].pr];
const nRe=()=>RX[rx].re.length;

/* ---------- càlcul ---------- */
function counts(){
  const L={},R={};const sp=spList();
  sp.forEach((k,i)=>{const side=i<nRe()?L:R;
    for(const e in SP[k].a)side[e]=(side[e]||0)+SP[k].a[e]*coef[i];});
  const els=ELORDER.filter(e=>(L[e]||R[e]));
  return {L,R,els};
}
function totals(){const sp=spList();let l=0,r=0;sp.forEach((k,i)=>{(i<nRe()?l+=SP[k].n*coef[i]:r+=SP[k].n*coef[i]);});return{l,r};}
function isBalanced(){const c=counts();return c.els.every(e=>(c.L[e]||0)===(c.R[e]||0));}
function gcdAll(){return coef.reduce((a,b)=>gcd(a,b));}

/* ---------- construcció de la UI ---------- */
function buildSelect(){
  $('#rxSel').innerHTML=RX.map((r,i)=>`<option value="${i}">${t('rx_'+r.id+'_name')}</option>`).join('');
}
function buildLegend(){
  $('#legend').innerHTML=ELORDER.map(e=>`<span><i class="dot" style="background:${EL[e].c}"></i>${e} · ${t('el_'+e)}</span>`).join('');
}
function buildSteppers(){
  const sp=spList(),box=$('#steppers');box.innerHTML='';
  sp.forEach((k,i)=>{
    const d=document.createElement('div');d.className='stp '+(i<nRe()?'re':'pr');
    d.innerHTML=`<span class="ctr"><button type="button" aria-label="${t('coef_less',k)}">−</button><output aria-live="polite">${coef[i]}</output><button type="button" aria-label="${t('coef_more',k)}">+</button></span>
      <span class="nm">${fm(k)}<small>${t('sp_'+k)}</small></span>`;
    const [bm,bp]=d.querySelectorAll('button');
    bm.onclick=()=>setCoef(i,coef[i]-1);bp.onclick=()=>setCoef(i,coef[i]+1);
    box.appendChild(d);
  });
}
function setCoef(i,v){
  v=clamp(v,1,MAXC);if(v===coef[i])return;
  if(v>coef[i])pops[i]={from:coef[i],t0:performance.now()/1000};
  coef[i]=v;refresh();
}
function resetCoefs(){coef=spList().map(()=>1);Object.keys(pops).forEach(k=>delete pops[k]);buildSteppers();refresh();}

/* ---------- refresc de textos ---------- */
function eqHTML(){
  const sp=spList(),f=(k,i)=>(coef[i]>1?`<b class="co">${coef[i]}</b> `:'')+fm(k);
  const L=sp.slice(0,nRe()).map((k,i)=>f(k,i)).join(' + ');
  const R=sp.slice(nRe()).map((k,i)=>f(k,i+nRe())).join(' + ');
  return L+'<span class="arrow">→</span>'+R;
}
function stars(i){return Math.max(1,3-chal.hints[i]);}
function totalStars(){return chal.solved.reduce((a,s,i)=>a+(s?stars(i):0),0);}

function refresh(){
  const c=counts(),bal=isBalanced(),g=gcdAll(),simple=g===1,sp=spList();
  /* equació, steppers */
  $('#eq').innerHTML=eqHTML();
  $$('#steppers .stp').forEach((d,i)=>{d.querySelector('output').textContent=coef[i];
    const [bm,bp]=d.querySelectorAll('button');bm.disabled=coef[i]<=1;bp.disabled=coef[i]>=MAXC;});
  /* taula d'àtoms */
  $('#atoms tbody').innerHTML=c.els.map(e=>{const l=c.L[e]||0,r=c.R[e]||0,ok=l===r;
    return `<tr class="${ok?'ok':'ko'}"><td><i class="dot" style="background:${EL[e].c}"></i>${e}</td><td class="n">${l}</td><td class="n">${r}</td><td class="ck" aria-label="${ok?'✓':'✗'}">${ok?'✓':'✗'}</td></tr>`;}).join('');
  /* estat */
  const st=$('#status');let msg,cls;
  if(bal&&simple){msg=t('st_ok');cls='ok';}
  else if(bal){msg=t('st_simplify',g);cls='';}
  else{const bad=c.els.filter(e=>(c.L[e]||0)!==(c.R[e]||0)).join(', ');
    msg=t('st_no',bad);cls='ko';}
  st.className='idea '+cls;
  let extra='';
  const tt=totals();
  if(!bal){extra=tt.l>tt.r?t('st_tilt_left'):tt.l<tt.r?t('st_tilt_right'):t('st_tilt_even');}
  const done=bal&&simple;
  if(done){const id=RX[rx].id;extra=`<br><span class="mut">${t('info_prefix')} ${t('rx_'+id+'_info')}</span>`;}
  st.innerHTML=msg+(extra?(done?extra:' '+extra):'');
  /* física de la balança */
  let s=tt.l-tt.r;
  if(s===0&&!bal){const e=c.els.find(e=>(c.L[e]||0)!==(c.R[e]||0));s=(c.L[e]||0)-(c.R[e]||0);}
  target=bal?0:Math.sign(s)*(0.05+0.21*Math.tanh(Math.abs(s)/5));
  if(done&&!wasSolved&&!REDUCED)spawnConfetti();
  wasSolved=done;
  /* repte */
  if(mode==='chal'){
    if(done&&!chal.solved[chal.idx]){chal.solved[chal.idx]=true;}
    updateChal();
  }
}

function updateChal(){
  const n=RX.length;
  $('#chalProg').textContent=t('chal_progress',chal.idx+1,n);
  $('#chalHints').textContent=t('chal_hints',chal.hints.reduce((a,b)=>a+b,0));
  $('#chalPts').textContent=t('chal_points',totalStars(),n*3);
  const solved=chal.solved[chal.idx];
  const nx=$('#btnNext');
  nx.hidden=!(solved&&chal.idx<n-1);
  $('#btnHint').hidden=solved;
  const allDone=chal.solved.every(Boolean);
  const end=$('#endCard');end.hidden=!allDone;
  if(allDone){$('#endTitle').textContent=t('end_title');
    $('#endText').textContent=t('end_text',chal.hints.reduce((a,b)=>a+b,0),totalStars(),n*3);}
  if(solved){const hb=$('#hintBox');hb.hidden=false;hb.className='idea ok';hb.textContent=t('chal_solved',stars(chal.idx));}
}

/* ---------- modes ---------- */
function setMode(m){
  mode=m;
  $('#modeExp').setAttribute('aria-pressed',m==='explore');
  $('#modeChal').setAttribute('aria-pressed',m==='chal');
  $('#exploreSel').hidden=m!=='explore';
  $('#chalInfo').hidden=m!=='chal';
  $('#btnHint').hidden=m!=='chal';
  $('#btnNext').hidden=true;$('#hintBox').hidden=true;$('#endCard').hidden=true;
  if(m==='chal'){rx=chal.idx;}else{rx=+$('#rxSel').value;}
  wasSolved=false;resetCoefs();
  if(m==='chal'){$('#hintBox').hidden=true;updateChal();}
}
function restartChal(){chal.idx=0;chal.hints=[0,0,0,0,0];chal.solved=[false,false,false,false,false];setMode('chal');}

function giveHint(){
  const i=chal.idx;chal.hints[i]++;
  const hb=$('#hintBox');hb.hidden=false;hb.className='idea';
  if(chal.hints[i]===1){hb.textContent=t('rx_'+RX[rx].id+'_tip');}
  else{const sol=RX[rx].sol,sp=spList();let j=coef.findIndex((c,q)=>c!==sol[q]);if(j<0)j=0;
    hb.innerHTML=t('hint_extra',fm(sp[j]),sol[j]);}
  updateChal();
}

/* ---------- dibuix ---------- */
function drawMol(k,x,y,s){
  const m=SP[k].m;ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.translate(-SP[k].cx,-SP[k].cy);
  ctx.lineCap='round';
  for(let i=0;i<m.length;i++)for(let j=i+1;j<m.length;j++){
    const a=m[i],b=m[j],d=Math.hypot(a[1]-b[1],a[2]-b[2]);
    if(d<(EL[a[0]].r+EL[b[0]].r)*1.25){ctx.strokeStyle='#8892a6';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(a[1],a[2]);ctx.lineTo(b[1],b[2]);ctx.stroke();}}
  m.forEach(([e,ax,ay])=>{const E=EL[e];
    const g=ctx.createRadialGradient(ax-E.r*.35,ay-E.r*.35,E.r*.1,ax,ay,E.r);
    g.addColorStop(0,'rgba(255,255,255,.55)');g.addColorStop(.35,E.c);g.addColorStop(1,E.c);
    ctx.beginPath();ctx.arc(ax,ay,E.r,0,6.2832);ctx.fillStyle=E.c;ctx.fill();
    ctx.fillStyle=g;ctx.fill();ctx.lineWidth=1.6;ctx.strokeStyle=E.s;ctx.stroke();
    if(E.tx&&E.r*s>=8){ctx.fillStyle=E.tx;ctx.font='bold '+Math.round(E.r*.9)+'px system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(e,ax,ay+1);}
  });
  ctx.restore();
}
const PW=204,PH=128,PGAP=8;
function rowsAt(side,s){
  const sp=spList(),idx=sp.map((k,i)=>i).filter(i=>side==='L'?i<nRe():i>=nRe());
  const rows=[];let row={it:[],w:0,h:0};
  idx.forEach(i=>{for(let q=0;q<coef[i];q++){const b=SP[sp[i]],w=b.w*s,h=b.h*s;
    if(row.it.length&&row.w+PGAP+w>PW){rows.push(row);row={it:[],w:0,h:0};}
    row.it.push({k:sp[i],i,q,w,h});row.w+=(row.it.length>1?PGAP:0)+w;row.h=Math.max(row.h,h);}});
  if(row.it.length)rows.push(row);
  return {rows,tot:rows.reduce((a,r)=>a+r.h,0)+(rows.length-1)*PGAP};
}
function fitScale(side){let s=1.4;while(s>0.36&&rowsAt(side,s).tot>PH)s-=0.03;return s;}
function layoutPan(side,S,now){
  const res=[];let cy=-3;
  rowsAt(side,S).rows.forEach(r=>{let x=-r.w/2;
    r.it.forEach(m=>{let sc=S;const p=pops[m.i];
      if(p&&m.q>=p.from){const u=(now-p.t0)/.3;sc*=u>=1?1:Math.max(.01,ease(u));}
      res.push({k:m.k,x:x+m.w/2,y:cy-r.h/2,s:sc});x+=m.w+PGAP;});
    cy-=r.h+PGAP;});
  return res;
}
function spawnConfetti(){
  confetti=[];const cols=['#e8590c','#2f6fed','#1b9a55','#f2b705','#d6336c'];
  for(let i=0;i<46;i++){const a=Math.random()*6.283,v=120+Math.random()*220;
    confetti.push({x:400,y:150,vx:Math.cos(a)*v,vy:Math.sin(a)*v-160,c:cols[i%5],life:1.6+Math.random()*.6,r:3+Math.random()*3});}
}
function draw(dt,now){
  /* física de ressort: oscil·la una mica abans d'assentar-se */
  vel+=((target-ang)*90-vel*7)*dt;ang+=vel*dt;
  const W=800,PX=400,PY=150,Lb=262,S=Math.min(fitScale('L'),fitScale('R'));
  ctx.clearRect(0,0,W,440);
  /* peu i pal */
  ctx.fillStyle=C.line;rr(ctx,330,408,140,16,6);ctx.fill();
  ctx.fillStyle=C.mut;rr(ctx,393,PY,14,262,5);ctx.fill();
  /* bigues */
  const ca=Math.cos(ang),sa=Math.sin(ang);
  const lx=PX-Lb*ca,ly=PY+Lb*sa,rx2=PX+Lb*ca,ry=PY-Lb*sa;
  const solved=isBalanced()&&gcdAll()===1;
  ctx.strokeStyle=solved?C.ok:C.ink;ctx.globalAlpha=.9;ctx.lineWidth=10;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(lx,ly);ctx.lineTo(rx2,ry);ctx.stroke();ctx.globalAlpha=1;
  /* plats */
  [['L',lx,ly,C.acc,'pan_left'],['R',rx2,ry,C.acc2,'pan_right']].forEach(([side,ex,ey,col,lab])=>{
    const py=ey+148;
    ctx.strokeStyle=C.mut;ctx.lineWidth=1.6;
    ctx.beginPath();ctx.moveTo(ex,ey);ctx.lineTo(ex-98,py);ctx.moveTo(ex,ey);ctx.lineTo(ex+98,py);ctx.stroke();
    ctx.fillStyle=col;rr(ctx,ex-108,py,216,9,4);ctx.fill();
    /* contingut */
    layoutPan(side,S,now).forEach(m=>drawMol(m.k,ex+m.x,py+m.y,m.s));
    ctx.fillStyle=C.ink;ctx.font='bold 19px system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='alphabetic';
    ctx.fillText(t(lab),ex,py+32);
    const tt=totals();ctx.fillStyle=C.mut;ctx.font='15px system-ui,sans-serif';
    ctx.fillText(t('atoms_count',side==='L'?tt.l:tt.r),ex,py+53);
  });
  /* eix */
  ctx.beginPath();ctx.arc(PX,PY,14,0,6.2832);ctx.fillStyle=solved?C.ok:C.acc;ctx.fill();
  ctx.lineWidth=3;ctx.strokeStyle=C.card;ctx.stroke();
  if(solved){ctx.fillStyle='#fff';ctx.font='bold 17px system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('✓',PX,PY+1);}
  /* confeti */
  confetti=confetti.filter(p=>p.life>0);
  confetti.forEach(p=>{p.life-=dt;p.vy+=520*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
    ctx.globalAlpha=clamp(p.life,0,1);ctx.fillStyle=p.c;ctx.fillRect(p.x,p.y,p.r*1.6,p.r);});
  ctx.globalAlpha=1;
}

/* ---------- esdeveniments ---------- */
$('#rxSel').onchange=e=>{rx=+e.target.value;wasSolved=false;resetCoefs();};
$('#modeExp').onclick=()=>setMode('explore');
$('#modeChal').onclick=()=>setMode('chal');
$('#btnReset').onclick=()=>{wasSolved=false;resetCoefs();};
$('#btnHint').onclick=giveHint;
$('#btnNext').onclick=()=>{chal.idx++;rx=chal.idx;$('#hintBox').hidden=true;wasSolved=false;resetCoefs();updateChal();};
$('#btnRestart').onclick=restartChal;

buildSelect();buildLegend();buildSteppers();refresh();ang=target;
loop(draw);
})();
