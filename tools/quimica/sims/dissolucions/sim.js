(()=>{
/* ---------- dades: solubilitat (g de solut / 100 g d'aigua) a 0,20,40,60,80,100 °C (aprox.) ---------- */
const TEMPS=[0,20,40,60,80,100];
const SOL={
  nacl: {M:58.44, vs:.37, tab:[35.7,35.9,36.4,37.1,38.0,39.2], dot:'#6c757d', grain:'#ffffff'},
  sugar:{M:342.3, vs:.63, tab:[179,204,238,287,362,487],        dot:'#f08c00', grain:'#fff8e6'},
  kno3: {M:101.1, vs:.40, tab:[13.3,31.6,63.9,110,169,246],     dot:'#9c36b5', grain:'#ffffff'},
  cuso4:{M:159.61,vs:.03, tab:[14.3,20.7,28.5,40,55,75.4],      dot:'#1c7ed6', grain:'#d6e6f7', tint:[30,110,255]}
};
function sol100(key,T){const tab=SOL[key].tab;T=clamp(T,0,100);const i=Math.min(4,Math.floor(T/20));
  return lerp(tab[i],tab[i+1],(T-TEMPS[i])/20);}
const TASKS=[
  {id:1,sol:'nacl', V:250,T:20,m:0,  lock:{sol:1,V:1,T:1}, kind:'gL',  target:40, tol:.03},
  {id:2,sol:'sugar',V:400,T:20,m:0,  lock:{sol:1,V:1,T:1}, kind:'pct', target:20, tolAbs:.4},
  {id:3,sol:'nacl', V:500,T:20,m:0,  lock:{sol:1,V:1,T:1}, kind:'mol', target:.5, tol:.04},
  {id:4,sol:'kno3', V:200,T:60,m:0,  lock:{sol:1,V:1,T:1}, kind:'max'},
  {id:5,sol:'kno3', V:200,T:80,m:150,lock:{sol:1,V:1,mass:1}, kind:'cryst'}
];

/* ---------- estat ---------- */
const st={sol:'nacl',V:250,T:20,m:0};
let dispD=0,mode='explore',lock={};
const chal={idx:0,solved:[0,0,0,0,0],hints:[0,0,0,0,0]};
let grains=[],dots=[];

const $b=$('#beaker'),cb=setupCanvas($b,440,480);
const $l=$('#lens'),cl=setupCanvas($l,460,220);
const $s=$('#solc'),cs=setupCanvas($s,460,240);
const el={vol:$('#vol'),temp:$('#temp'),mass:$('#mass'),num:$('#massNum'),sel:$('#solSel')};

function derive(){
  const S=SOL[st.sol],s=sol100(st.sol,st.T);
  const cap=s*st.V/(100+s*S.vs);           /* massa màxima dissolta en V mL de dissolució */
  const dis=Math.min(st.m,cap),und=Math.max(0,st.m-cap);
  const L=st.V/1000,Vw=st.V-dis*S.vs;       /* massa d'aigua (g) */
  const cL=dis/L,pct=dis/(dis+Vw)*100,n=dis/S.M,mol=n/L;
  let state='none';
  if(st.m>0.0005)state=st.m<cap-0.05?'unsat':st.m<=cap+0.05?'just':'prec';
  return{S,s,cap,dis,und,L,Vw,cL,pct,n,mol,state};
}

/* ---------- interfície: textos i controls ---------- */
function refresh(){
  const d=derive();
  $('#volOut').textContent=st.V+' mL';
  $('#tempOut').textContent=st.T+' °C';
  $('#massOut').textContent=fmt(st.m,1)+' g';
  el.vol.value=st.V;el.temp.value=st.T;el.mass.value=Math.min(st.m,+el.mass.max);
  if(document.activeElement!==el.num)el.num.value=st.m;
  $('#rG').textContent=fmt(d.cL,1)+' g/L';
  $('#rP').textContent=fmt(d.pct,2)+' %';
  $('#rM').textContent=fmt(d.mol,3)+' mol/L';
  $('#cG').innerHTML=t('calc_gL',fmt(d.dis,2),fmt(d.L,3),fmt(d.cL,1));
  $('#cP').innerHTML=t('calc_pct',fmt(d.dis,2),fmt(d.Vw,1),fmt(d.pct,2));
  $('#cM').innerHTML=t('calc_mol',fmt(d.dis,2),fmt(d.S.M,2),fmt(d.n,3),fmt(d.L,3),fmt(d.mol,3));
  const sm=$('#satMsg');
  const msgs={none:[t('sat_none'),''],unsat:[t('sat_unsat',fmt(d.cap-st.m,1)),''],just:[t('sat_just'),'ok'],prec:[t('sat_prec',fmt(d.und,1)),'ko']};
  sm.className='idea '+msgs[d.state][1];sm.textContent=msgs[d.state][0];
  $('#solInfo').textContent=t('sol_info',st.T,fmt(d.s,1));
  applyLock();
}
function applyLock(){
  const L=lock;
  el.sel.disabled=!!L.sol;el.vol.disabled=!!L.V;el.temp.disabled=!!L.T;
  [el.mass,el.num,$('#bSub1'),$('#bAdd1'),$('#bAdd10'),$('#bEmpty')].forEach(e=>{e.disabled=!!L.mass;});
  $('#solWrap').hidden=false;
  el.vol.closest('.ctrl').classList.toggle('locked',!!L.V);
  el.temp.closest('.ctrl').classList.toggle('locked',!!L.T);
  el.mass.closest('.ctrl').classList.toggle('locked',!!L.mass);
}
function setMass(v,spawn){
  v=Math.round(clamp(+v||0,0,3000)*10)/10;
  const dl=v-st.m;
  if(spawn!==false&&dl>0.2)spawnGrains(dl);
  st.m=v;refresh();
}
function buildSelect(){
  el.sel.innerHTML=Object.keys(SOL).map(k=>`<option value="${k}">${t('sol_'+k)}</option>`).join('');
  el.sel.value=st.sol;
}
el.sel.onchange=()=>{st.sol=el.sel.value;refresh();};
el.vol.oninput=()=>{st.V=+el.vol.value;refresh();};
el.temp.oninput=()=>{st.T=+el.temp.value;refresh();};
el.mass.oninput=()=>setMass(el.mass.value);
el.num.oninput=()=>{if(el.num.value!=='')setMass(el.num.value);};
el.num.onblur=()=>{el.num.value=st.m;};
$('#bAdd1').onclick=()=>setMass(st.m+1);
$('#bAdd10').onclick=()=>setMass(st.m+10);
$('#bSub1').onclick=()=>setMass(st.m-1);
$('#bEmpty').onclick=()=>{setMass(0,false);};

/* ---------- repte ---------- */
const stars=i=>Math.max(1,3-chal.hints[i]);
const totalStars=()=>chal.solved.reduce((a,s,i)=>a+(s?stars(i):0),0);
function setMode(m){
  mode=m;
  $('#modeExp').setAttribute('aria-pressed',m==='explore');
  $('#modeChal').setAttribute('aria-pressed',m==='chal');
  $('#chalInfo').hidden=m!=='chal';
  $('#taskBox').hidden=m!=='chal';
  $('#endCard').hidden=true;
  grains=[];
  if(m==='chal'){applyTask(chal.idx);}
  else{lock={};st.sol='nacl';st.V=250;st.T=20;st.m=0;dispD=0;el.sel.value=st.sol;refresh();}
}
function applyTask(i){
  const T=TASKS[i];chal.idx=i;lock=T.lock;
  st.sol=T.sol;st.V=T.V;st.T=T.T;st.m=T.m;el.sel.value=st.sol;
  dispD=T.m?derive().dis:0;grains=[];
  $('#taskTitle').textContent=t('task_title',i+1);
  $('#taskText').innerHTML=t('task_'+T.id);
  $('#taskFb').textContent='';$('#taskFb').className='fb';
  $('#hintBox').hidden=true;$('#btnNext').hidden=true;
  $('#btnCheck').disabled=false;$('#btnHint').hidden=false;
  refresh();updateChal();
}
function updateChal(){
  const n=TASKS.length,h=chal.hints.reduce((a,b)=>a+b,0);
  $('#chalProg').textContent=t('chal_progress',chal.idx+1,n);
  $('#chalHints').textContent=t('chal_hints',h);
  $('#chalPts').textContent=t('chal_points',totalStars(),n*3);
  const all=chal.solved.every(Boolean);
  $('#endCard').hidden=!all;
  if(all){$('#endTitle').textContent=t('end_title');$('#endText').textContent=t('end_text',h,totalStars(),n*3);}
}
function check(){
  const T=TASKS[chal.idx],d=derive(),fb=$('#taskFb');
  let ok=false,msg='';
  if(T.kind==='gL'){ok=Math.abs(d.cL-T.target)/T.target<=T.tol;msg=t('fb_now',fmt(d.cL,1)+' g/L',fmt(T.target,0)+' g/L');}
  else if(T.kind==='pct'){ok=Math.abs(d.pct-T.target)<=T.tolAbs;msg=t('fb_now',fmt(d.pct,1)+' %',fmt(T.target,0)+' %');}
  else if(T.kind==='mol'){ok=Math.abs(d.mol-T.target)/T.target<=T.tol;msg=t('fb_now',fmt(d.mol,3)+' mol/L',fmt(T.target,1)+' mol/L');}
  else if(T.kind==='max'){
    if(st.m<=0)msg=t('fb_t4_zero');
    else if(Math.abs(st.m-d.cap)<=3)ok=true;
    else msg=st.m<d.cap?t('fb_t4_low'):t('fb_t4_high');
  }else if(T.kind==='cryst'){
    if(d.und<=0.05)msg=t('fb_t5_none');
    else if(d.und<=10)ok=true;
    else msg=t('fb_t5_many',fmt(d.und,1));
  }
  if(ok){
    chal.solved[chal.idx]=1;
    msg=t('fb_ok',stars(chal.idx))+' '+t('ok_'+T.id);
    $('#btnNext').hidden=chal.idx>=TASKS.length-1;
    $('#btnHint').hidden=true;
  }
  fb.className='fb '+(ok?'okfb':'');fb.textContent=msg;
  if(ok)fb.style.color='var(--ok)';else fb.style.color='var(--ko)';
  updateChal();
}
function hint(){
  const i=chal.idx;if(chal.hints[i]<2)chal.hints[i]++;
  const hb=$('#hintBox');hb.hidden=false;
  hb.textContent=t('tip1_'+TASKS[i].id)+(chal.hints[i]>=2?' '+t('tip2_'+TASKS[i].id):'');
  updateChal();
}
$('#modeExp').onclick=()=>setMode('explore');
$('#modeChal').onclick=()=>setMode('chal');
$('#btnCheck').onclick=check;
$('#btnHint').onclick=hint;
$('#btnNext').onclick=()=>applyTask(chal.idx+1);
$('#btnRestart').onclick=()=>{chal.idx=0;chal.solved=[0,0,0,0,0];chal.hints=[0,0,0,0,0];$('#endCard').hidden=true;applyTask(0);};

/* ---------- dibuix del got ---------- */
const BXL=70,BXR=350,BTOP=56,BBOT=416,K=.58,CX=(BXL+BXR)/2;
const spk=[];for(let i=0;i<260;i++)spk.push({x:Math.random(),y:Math.random()});
function spawnGrains(dl){
  const n=clamp(Math.ceil(dl/2),3,16);
  for(let i=0;i<n;i++)grains.push({x:CX+(Math.random()-.5)*80,y:26+Math.random()*24,vy:0});
}
function tColor(T){const u=clamp(T/100,0,1);const a=[84,150,240],b=[240,70,60];return `rgb(${a.map((v,i)=>Math.round(lerp(v,b[i],u))).join(',')})`;}
function beakerPath(c){const r=20;c.beginPath();c.moveTo(BXL,BTOP);c.lineTo(BXL,BBOT-r);c.arcTo(BXL,BBOT,BXL+r,BBOT,r);
  c.lineTo(BXR-r,BBOT);c.arcTo(BXR,BBOT,BXR,BBOT-r,r);c.lineTo(BXR,BTOP);}
function drawBeaker(now,dt,d){
  const c=cb;c.clearRect(0,0,440,480);
  const lvl=BBOT-st.V*K;
  /* placa */
  c.fillStyle=tColor(st.T);c.globalAlpha=.85;rr(c,46,428,328,16,6);c.fill();c.globalAlpha=1;
  c.fillStyle=C.mut;rr(c,60,444,300,10,4);c.fill();
  /* aigua */
  c.save();beakerPath(c);c.lineTo(BXL,BTOP);c.closePath();c.clip();
  const tint=d.S.tint;
  c.fillStyle='rgba(116,192,252,.36)';c.fillRect(BXL,lvl,BXR-BXL,BBOT-lvl);
  if(tint){const a=clamp((dispD/d.L)/260,0,.8)*.9;c.fillStyle=`rgba(${tint[0]},${tint[1]},${tint[2]},${a})`;c.fillRect(BXL,lvl,BXR-BXL,BBOT-lvl);}
  c.fillStyle='rgba(255,255,255,.55)';c.fillRect(BXL,lvl,BXR-BXL,2.5);
  /* pila de cristalls */
  const u=Math.max(0,st.m-dispD);let pileH=0;
  if(u>0.04){
    const w=clamp(30+22*Math.sqrt(u),0,BXR-BXL-14),h=clamp(3+5*Math.sqrt(u),0,130);pileH=h;
    const y0=BBOT-2;
    c.beginPath();c.moveTo(CX-w/2,y0);c.bezierCurveTo(CX-w*.3,y0,CX-w*.16,y0-h,CX,y0-h);
    c.bezierCurveTo(CX+w*.16,y0-h,CX+w*.3,y0,CX+w/2,y0);c.closePath();
    c.fillStyle=d.S.grain;c.fill();c.lineWidth=1.3;c.strokeStyle=C.mut;c.stroke();
    c.fillStyle='rgba(0,0,0,.28)';
    const nsp=Math.min(spk.length,Math.floor(u*5+10));
    for(let i=0;i<nsp;i++){const p=spk[i];c.fillRect(CX+(p.x-.5)*w*.78*(1-p.y*.8),y0-6-p.y*h*.78,2.6,2.6);}
  }
  /* grans que cauen */
  c.fillStyle=d.S.grain;c.strokeStyle=C.mut;c.lineWidth=1;
  grains=grains.filter(g=>g.y<BBOT-8-pileH);
  grains.forEach(g=>{g.vy+=900*dt*(g.y>lvl?.25:1);g.vy=Math.min(g.vy,g.y>lvl?160:700);g.y+=g.vy*dt;c.fillRect(g.x,g.y,5,5);c.strokeRect(g.x,g.y,5,5);});
  c.restore();
  /* vapor */
  if(st.T>=70){c.strokeStyle=C.mut;c.lineWidth=2.5;c.lineCap='round';
    for(let k=0;k<3;k++){const x0=BXL+60+k*80,al=(st.T-65)/60;c.globalAlpha=clamp(al,0,.45);
      c.beginPath();for(let q=0;q<=20;q++){const yy=lvl-q*3,xx=x0+Math.sin(now*2+k+q*.35)*6*(q/20+.3);q?c.lineTo(xx,yy):c.moveTo(xx,yy);}c.stroke();}
    c.globalAlpha=1;}
  /* graduació */
  c.fillStyle=C.mut;c.strokeStyle=C.mut;c.lineWidth=1.5;c.font='12px system-ui,sans-serif';c.textAlign='left';c.textBaseline='middle';
  for(let ml=100;ml<=600;ml+=100){const y=BBOT-ml*K;c.beginPath();c.moveTo(BXL,y);c.lineTo(BXL+18,y);c.stroke();c.fillText(ml,BXL+22,y);}
  for(let ml=50;ml<600;ml+=100){const y=BBOT-ml*K;c.beginPath();c.moveTo(BXL,y);c.lineTo(BXL+10,y);c.stroke();}
  /* got */
  c.strokeStyle=C.mut;c.lineWidth=4;c.lineJoin='round';c.lineCap='round';beakerPath(c);c.stroke();
  c.beginPath();c.moveTo(BXL-10,BTOP-2);c.lineTo(BXL,BTOP);c.moveTo(BXR+10,BTOP-2);c.lineTo(BXR,BTOP);c.stroke();
  /* etiqueta de nivell */
  c.fillStyle=C.ink;c.font='bold 14px system-ui,sans-serif';c.textAlign='left';c.textBaseline='middle';
  c.strokeStyle=C.ink;c.lineWidth=1.5;c.beginPath();c.moveTo(BXR+2,lvl);c.lineTo(BXR+14,lvl);c.stroke();
  c.fillText(st.V+' mL',BXR+18,lvl);
}

/* ---------- vista ampliada ---------- */
function drawLens(dt,d){
  const c=cl,W=460,H=220;c.clearRect(0,0,W,H);
  const tint=d.S.tint;
  c.fillStyle='rgba(116,192,252,.28)';rr(c,2,2,W-4,H-4,12);c.fill();
  if(tint){const a=clamp((dispD/d.L)/260,0,.8)*.8;c.fillStyle=`rgba(${tint[0]},${tint[1]},${tint[2]},${a})`;rr(c,2,2,W-4,H-4,12);c.fill();}
  c.strokeStyle=C.line;c.lineWidth=2;rr(c,2,2,W-4,H-4,12);c.stroke();
  const molD=(dispD/d.L)/d.S.M,target=Math.min(360,Math.round(molD*45));
  for(let k=0;k<4;k++){
    if(dots.length<target)dots.push({x:12+Math.random()*(W-24),y:12+Math.random()*(H-24),a:Math.random()*6.28});
    else if(dots.length>target)dots.pop();
  }
  c.fillStyle=d.S.dot;c.strokeStyle='rgba(255,255,255,.8)';c.lineWidth=1;
  dots.forEach(p=>{p.a+=(Math.random()-.5)*2.4*Math.sqrt(dt)*3;
    const sp=(20+st.T*.45)*dt;p.x+=Math.cos(p.a)*sp;p.y+=Math.sin(p.a)*sp;
    if(p.x<9){p.x=9;p.a=Math.PI-p.a;}if(p.x>W-9){p.x=W-9;p.a=Math.PI-p.a;}
    if(p.y<9){p.y=9;p.a=-p.a;}if(p.y>H-9){p.y=H-9;p.a=-p.a;}
    c.beginPath();c.arc(p.x,p.y,4.6,0,6.2832);c.fill();c.stroke();});
  c.font='bold 14px system-ui,sans-serif';const lab=fmt(molD,2)+' mol/L',lw=c.measureText(lab).width;
  c.fillStyle=C.card;c.globalAlpha=.9;rr(c,8,8,lw+16,24,8);c.fill();c.globalAlpha=1;
  c.fillStyle=C.ink;c.textAlign='left';c.textBaseline='middle';c.fillText(lab,16,20);
}

/* ---------- corba de solubilitat ---------- */
function niceMax(v){const p=Math.pow(10,Math.floor(Math.log10(v)));for(const k of [1,1.5,2,2.5,3,4,5,6,8,10])if(k*p>=v)return k*p;return v;}
function drawSolub(d){
  const c=cs,W=460,H=240,ml=56,mr=14,mt=14,mb=58;
  c.clearRect(0,0,W,H);
  const tab=d.S.tab,ymax=niceMax(Math.max(...tab)*1.08);
  const X=T=>ml+T/100*(W-ml-mr),Y=v=>mt+(1-v/ymax)*(H-mt-mb);
  /* zones */
  const pts=[];for(let T=0;T<=100;T+=2)pts.push([T,sol100(st.sol,T)]);
  c.beginPath();c.moveTo(X(0),Y(0));pts.forEach(p=>c.lineTo(X(p[0]),Y(p[1])));c.lineTo(X(100),Y(0));c.closePath();
  c.fillStyle='rgba(27,154,85,.14)';c.fill();
  c.beginPath();c.moveTo(X(0),Y(ymax));pts.forEach(p=>c.lineTo(X(p[0]),Y(p[1])));c.lineTo(X(100),Y(ymax));c.closePath();
  c.fillStyle='rgba(232,89,12,.13)';c.fill();
  /* graella */
  c.font='12px system-ui,sans-serif';c.lineWidth=1;c.strokeStyle=C.line;c.fillStyle=C.mut;
  c.textAlign='right';c.textBaseline='middle';
  for(let i=0;i<=5;i++){const v=ymax*i/5,y=Y(v);c.beginPath();c.moveTo(ml,y);c.lineTo(W-mr,y);c.stroke();c.fillText(fmt(v,v<10?1:0),ml-6,y);}
  c.textAlign='center';c.textBaseline='top';
  for(let T=0;T<=100;T+=20){c.beginPath();c.moveTo(X(T),mt);c.lineTo(X(T),H-mb);c.stroke();c.fillText(T,X(T),H-mb+5);}
  c.strokeStyle=C.mut;c.lineWidth=1.8;c.beginPath();c.moveTo(ml,mt);c.lineTo(ml,H-mb);c.lineTo(W-mr,H-mb);c.stroke();
  /* corba */
  c.beginPath();pts.forEach((p,i)=>i?c.lineTo(X(p[0]),Y(p[1])):c.moveTo(X(p[0]),Y(p[1])));
  c.strokeStyle=C.acc;c.lineWidth=3.2;c.lineJoin='round';c.stroke();
  /* marcador */
  const v=st.m/d.Vw*100,clip=v>ymax,vy=Math.min(v,ymax),mx=X(st.T),my=Y(vy);
  const below=v<=sol100(st.sol,st.T)+0.05;
  if(st.m>0){
    c.setLineDash([3,4]);c.strokeStyle=C.ink;c.globalAlpha=.5;c.lineWidth=1.2;
    c.beginPath();c.moveTo(mx,my);c.lineTo(mx,H-mb);c.moveTo(mx,my);c.lineTo(ml,my);c.stroke();c.setLineDash([]);c.globalAlpha=1;
    c.beginPath();c.arc(mx,my,8,0,6.2832);c.fillStyle=below?'#1b9a55':'#e8590c';c.fill();c.lineWidth=3;c.strokeStyle=C.card;c.stroke();
    if(clip){c.fillStyle=C.ink;c.font='bold 12px system-ui,sans-serif';c.textAlign='left';c.textBaseline='bottom';c.fillText('▲ '+fmt(v,0),mx+10,my+14);}
  }else{
    c.beginPath();c.arc(mx,Y(0),5,0,6.2832);c.fillStyle=C.mut;c.fill();
  }
  /* eixos i llegenda */
  c.fillStyle=C.ink;c.font='12px system-ui,sans-serif';c.textAlign='center';c.textBaseline='alphabetic';
  c.fillText(t('sol_x'),(ml+W-mr)/2,H-mb+34);
  c.save();c.translate(13,(mt+H-mb)/2);c.rotate(-Math.PI/2);c.fillText(t('sol_y'),0,0);c.restore();
  c.textAlign='left';c.textBaseline='middle';
  c.fillStyle='rgba(27,154,85,.55)';c.fillRect(ml,H-12,12,12);c.fillStyle=C.mut;c.fillText(t('leg_unsat'),ml+17,H-6);
  const x2=ml+150;c.fillStyle='rgba(232,89,12,.55)';c.fillRect(x2,H-12,12,12);c.fillStyle=C.mut;c.fillText(t('leg_sat'),x2+17,H-6);
}

/* ---------- bucle ---------- */
buildSelect();setMode('explore');
loop((dt,now)=>{
  const d=derive();
  const diff=d.dis-dispD;dispD+=diff*Math.min(1,dt*2.4);if(Math.abs(d.dis-dispD)<0.004)dispD=d.dis;
  drawBeaker(now,dt,d);drawLens(dt,d);drawSolub(d);
});
})();
