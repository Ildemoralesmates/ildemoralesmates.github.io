(()=>{
/* ---------- dades (aproximades, per a 100 g) ---------- */
const SUBS={
  water:  {mp:0,   bp:100, cs:2.09,cl:4.18,cg:2.01,Lf:334,Lv:2260,Tmin:-30, Tmax:130,col:'#4dabf7',sc:'#1971c2'},
  ethanol:{mp:-114,bp:78,  cs:1.6, cl:2.44,cg:1.43,Lf:108,Lv:841, Tmin:-140,Tmax:100,col:'#69db7c',sc:'#2b8a3e'},
  acetone:{mp:-95, bp:56,  cs:1.6, cl:2.17,cg:1.30,Lf:98, Lv:501, Tmin:-120,Tmax:80, col:'#b197fc',sc:'#6741d9'},
  nitrogen:{mp:-210,bp:-196,cs:1.9,cl:2.04,cg:1.04,Lf:26, Lv:199, Tmin:-230,Tmax:-170,col:'#74c0fc',sc:'#1864ab'},
  iron:   {mp:1538,bp:2862,cs:0.45,cl:0.82,cg:0.57,Lf:247,Lv:6090,Tmin:20,  Tmax:3000,col:'#f08c4a',sc:'#9c4a12'}
};
const MASS=100; /* g */
const PHC=['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444'];
const PHN=['ph_solid','ph_melt','ph_liquid','ph_boil','ph_gas'];
const PHCAP=['cap_solid','cap_melt','cap_liquid','cap_boil','cap_gas'];

/* geometria del recipient */
const N=64,R=15,BX=14,BY=14,BW=290,BH=372,COLS=8,DX=33,DY=29,POOLK=1.12;
const bcv=$('#box'),bctx=setupCanvas(bcv,420,470);
const gcv=$('#graph'),gctx=setupCanvas(gcv,540,470);

let S,B=[],Etot,E=0,dir=0,speed=1,showVel=false,parts=[],cur=null,lastPh=-1,surf=BY+BH;
let tDrag=false;

/* ---------- física de la substància ---------- */
function setup(key){
  S=SUBS[key];
  const q=[MASS*S.cs*(S.mp-S.Tmin),MASS*S.Lf,MASS*S.cl*(S.bp-S.mp),MASS*S.Lv,MASS*S.cg*(S.Tmax-S.bp)].map(x=>x/1000);
  B=[0];q.forEach(x=>B.push(B[B.length-1]+x));Etot=B[5];
  const ts=$('#tslider');ts.min=S.Tmin;ts.max=S.Tmax;
  E=0.4*B[1];dir=0;lastPh=-1;setDirUI();initParts();
}
function stateAt(e){
  e=clamp(e,0,Etot);
  if(e<=B[1])return{T:S.Tmin+(e-B[0])*1000/(MASS*S.cs),fm:0,fb:0,ph:0};
  if(e<=B[2])return{T:S.mp,fm:(e-B[1])/(B[2]-B[1]),fb:0,ph:1};
  if(e<=B[3])return{T:S.mp+(e-B[2])*1000/(MASS*S.cl),fm:1,fb:0,ph:2};
  if(e<=B[4])return{T:S.bp,fm:1,fb:(e-B[3])/(B[4]-B[3]),ph:3};
  return{T:S.bp+(e-B[4])*1000/(MASS*S.cg),fm:1,fb:1,ph:4};
}
function EofT(T){
  if(T<S.mp)return(T-S.Tmin)*MASS*S.cs/1000;
  if(T===S.mp)return B[1];
  if(T<S.bp)return B[2]+(T-S.mp)*MASS*S.cl/1000;
  if(T===S.bp)return B[3];
  return B[4]+(T-S.bp)*MASS*S.cg/1000;
}

/* ---------- partícules ---------- */
function randn(){let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(6.2832*v);}
function initParts(){
  parts=[];
  for(let k=0;k<N;k++){const i=k%COLS,j=Math.floor(k/COLS);
    parts.push({sx:BX+8+R+i*DX+(j%2)*DX/2,sy:BY+BH-4-R-j*DY,j,x:0,y:0,vx:0,vy:0,ox:0,oy:0,st:0,pool:true});}
  const ord=parts.map((p,i)=>i).sort((a,b)=>(parts[b].j-parts[a].j)||(Math.random()-.5));
  ord.forEach((idx,r)=>{parts[idx].tm=(r+.5)/N;});
  const perm=parts.map((p,i)=>i).sort(()=>Math.random()-.5);
  perm.forEach((idx,r)=>{parts[idx].tb=(r+.5)/N;});
  parts.forEach(p=>{p.x=p.sx;p.y=p.sy;});
}
function onChange(p,ns,vL,vG){
  const a=Math.random()*6.2832;
  if(ns===0){p.vx=p.vy=0;}
  else if(ns===1){p.pool=p.st!==2;p.vx=Math.cos(a)*vL;p.vy=Math.sin(a)*vL;}
  else{p.pool=false;p.vx=Math.cos(a)*vG;p.vy=Math.sin(a)*vG;}
}
function step(dt){
  const {T,fm,fb}=cur;
  const tau=Math.pow(Math.max(T+273.15,50)/273.15,.75);
  const vL=46*tau,vG=150*tau,sig=.6+.9*tau*tau;
  let nC=0;
  parts.forEach(p=>{p.ns=fb>p.tb?2:(fm>p.tm?1:0);if(p.ns<2)nC++;});
  surf=BY+BH-nC*DX*DY*POOLK/BW;
  parts.forEach(p=>{
    if(p.ns!==p.st){onChange(p,p.ns,vL,vG);p.st=p.ns;}
    const x0=p.x,y0=p.y;
    if(p.st===0){
      const th=10;
      p.ox+=-th*p.ox*dt+sig*Math.sqrt(2*th*dt)*randn();
      p.oy+=-th*p.oy*dt+sig*Math.sqrt(2*th*dt)*randn();
      const tx=p.sx+p.ox,ty=p.sy+p.oy,d=Math.hypot(tx-p.x,ty-p.y);
      if(d>0.01){const mv=Math.min(d,Math.min(260,d*12)*dt);p.x+=(tx-p.x)/d*mv;p.y+=(ty-p.y)/d*mv;}
      p.vx+=((p.x-x0)/dt-p.vx)*.25;p.vy+=((p.y-y0)/dt-p.vy)*.25;
    }else{
      let sp=Math.hypot(p.vx,p.vy)||0.01;
      const target=p.st===1?vL:vG,k=Math.min(1,dt*(p.st===1?4:1.5));
      let s2=sp+(target-sp)*k;
      let a=Math.atan2(p.vy,p.vx)+randn()*(p.st===1?3:.4)*Math.sqrt(dt);
      p.vx=Math.cos(a)*s2;p.vy=Math.sin(a)*s2;
      if(p.st===1&&!p.pool)p.vy+=420*dt;
      p.x+=p.vx*dt;p.y+=p.vy*dt;
      if(p.x<BX+R){p.x=BX+R;p.vx=Math.abs(p.vx);}
      if(p.x>BX+BW-R){p.x=BX+BW-R;p.vx=-Math.abs(p.vx);}
      if(p.y>BY+BH-R){p.y=BY+BH-R;p.vy=-Math.abs(p.vy);}
      if(p.y<BY+R){p.y=BY+R;p.vy=Math.abs(p.vy);}
      if(p.st===1){
        if(!p.pool&&p.y>surf+R*.55)p.pool=true;
        if(p.pool&&p.y<surf+R*.55){p.y=surf+R*.55;p.vy=Math.abs(p.vy);}
      }
    }
  });
  /* col·lisions suaus */
  const md=2*R*.92,md2=md*md;
  for(let i=0;i<N;i++){const a=parts[i];
    for(let j=i+1;j<N;j++){const b=parts[j];
      if(a.st===0&&b.st===0)continue;
      let dx=a.x-b.x,dy=a.y-b.y,d2=dx*dx+dy*dy;
      if(d2>=md2||d2<1e-6)continue;
      const d=Math.sqrt(d2),nx=dx/d,ny=dy/d,ov=md-d;
      if(a.st!==0&&b.st!==0){
        a.x+=nx*ov/2;a.y+=ny*ov/2;b.x-=nx*ov/2;b.y-=ny*ov/2;
        const s=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;
        if(s<0){a.vx-=s*nx;a.vy-=s*ny;b.vx+=s*nx;b.vy+=s*ny;}
      }else if(a.st!==0){
        a.x+=nx*ov;a.y+=ny*ov;const s=a.vx*nx+a.vy*ny;if(s<0){a.vx-=2*s*nx;a.vy-=2*s*ny;}
      }else{
        b.x-=nx*ov;b.y-=ny*ov;const s=-(b.vx*nx+b.vy*ny);if(s<0){b.vx+=2*s*nx;b.vy+=2*s*ny;}
      }
    }
  }
}

/* ---------- dibuix: recipient, partícules, termòmetre ---------- */
function nice(sp){const c=[5,10,20,50,100,200,500,1000];return c.find(x=>sp/x<=7)||1000;}
function tColor(T){const u=clamp((T-S.Tmin)/(S.Tmax-S.Tmin),0,1);
  const c0=[51,154,240],c1=[240,62,62];return `rgb(${c0.map((v,i)=>Math.round(lerp(v,c1[i],u))).join(',')})`;}

function drawBox(now){
  const c=bctx;c.clearRect(0,0,420,470);
  /* líquid (tint) */
  const anyLiq=parts.some(p=>p.st===1);
  if(anyLiq){c.fillStyle=S.col;c.globalAlpha=.16;c.fillRect(BX,surf,BW,BY+BH-surf);c.globalAlpha=1;
    c.strokeStyle=S.col;c.globalAlpha=.5;c.lineWidth=2;c.beginPath();c.moveTo(BX,surf);c.lineTo(BX+BW,surf);c.stroke();c.globalAlpha=1;}
  /* partícules */
  parts.forEach(p=>{
    const g=c.createRadialGradient(p.x-R*.35,p.y-R*.35,R*.1,p.x,p.y,R);
    g.addColorStop(0,'rgba(255,255,255,.75)');g.addColorStop(.4,S.col);g.addColorStop(1,S.sc);
    c.beginPath();c.arc(p.x,p.y,R,0,6.2832);c.fillStyle=g;c.fill();c.lineWidth=1.2;c.strokeStyle=S.sc;c.stroke();
  });
  if(showVel){
    c.strokeStyle=C.ink;c.fillStyle=C.ink;c.lineWidth=2;c.lineCap='round';
    parts.forEach(p=>{const sp=Math.hypot(p.vx,p.vy);if(sp<3)return;
      const L=Math.min(36,sp*.22),ux=p.vx/sp,uy=p.vy/sp,ex=p.x+ux*L,ey=p.y+uy*L;
      c.beginPath();c.moveTo(p.x,p.y);c.lineTo(ex,ey);c.stroke();
      c.beginPath();c.moveTo(ex,ey);c.lineTo(ex-ux*6-uy*4,ey-uy*6+ux*4);c.lineTo(ex-ux*6+uy*4,ey-uy*6-ux*4);c.closePath();c.fill();});
  }
  /* recipient */
  c.strokeStyle=C.mut;c.lineWidth=4;c.lineJoin='round';c.beginPath();
  c.moveTo(BX-2,BY-2);c.lineTo(BX-2,BY+BH+2);c.lineTo(BX+BW+2,BY+BH+2);c.lineTo(BX+BW+2,BY-2);c.stroke();
  c.lineWidth=2;c.beginPath();c.moveTo(BX-2,BY-2);c.lineTo(BX+BW+2,BY-2);c.stroke();
  /* cremador / refrigerant */
  const bx=BX+BW/2;
  c.fillStyle=C.mut;c.beginPath();c.moveTo(bx-46,456);c.lineTo(bx+46,456);c.lineTo(bx+30,440);c.lineTo(bx-30,440);c.closePath();c.fill();
  if(dir>0){
    for(let k=0;k<5;k++){const fx=bx-32+k*16,fl=26+10*Math.sin(now*14+k*1.7)+(k===2?14:0);
      const g=c.createLinearGradient(0,440,0,440-fl);g.addColorStop(0,'#ffd43b');g.addColorStop(1,'rgba(255,107,0,.1)');
      c.fillStyle=g;c.beginPath();c.moveTo(fx-9,440);c.quadraticCurveTo(fx-7,440-fl*.6,fx,440-fl);c.quadraticCurveTo(fx+7,440-fl*.6,fx+9,440);c.closePath();c.fill();}
  }else if(dir<0){
    c.strokeStyle='#74c0fc';c.lineWidth=2.5;c.lineCap='round';
    for(let k=0;k<3;k++){const sx=bx-30+k*30,sy=420+4*Math.sin(now*3+k);
      for(let a=0;a<3;a++){const an=a*Math.PI/3;c.beginPath();c.moveTo(sx-Math.cos(an)*11,sy-Math.sin(an)*11);c.lineTo(sx+Math.cos(an)*11,sy+Math.sin(an)*11);c.stroke();}}
  }
  /* termòmetre */
  const tx=360,top=44,bot=366,h=bot-top,u=clamp((cur.T-S.Tmin)/(S.Tmax-S.Tmin),0,1);
  c.fillStyle=C.card;c.strokeStyle=C.mut;c.lineWidth=2;
  rr(c,tx-9,top,18,h+8,9);c.fill();c.stroke();
  c.beginPath();c.arc(tx,bot+22,19,0,6.2832);c.fill();c.stroke();
  const col=tColor(cur.T);c.fillStyle=col;
  c.beginPath();c.arc(tx,bot+22,15,0,6.2832);c.fill();
  c.fillRect(tx-4,bot-u*h,8,u*h+10);
  const span=S.Tmax-S.Tmin,stp=nice(span);
  c.fillStyle=C.mut;c.strokeStyle=C.mut;c.lineWidth=1.5;c.font='11px system-ui,sans-serif';c.textAlign='left';c.textBaseline='middle';
  for(let T=Math.ceil(S.Tmin/stp)*stp;T<=S.Tmax;T+=stp){const y=bot-(T-S.Tmin)/span*h;
    c.beginPath();c.moveTo(tx+9,y);c.lineTo(tx+15,y);c.stroke();c.fillText(T,tx+18,y);}
  c.fillStyle=C.ink;c.font='bold 15px system-ui,sans-serif';c.textAlign='center';c.textBaseline='alphabetic';
  c.fillText(fmt(cur.T,1)+' °C',tx,28);
}

/* ---------- dibuix: gràfica de calfament ---------- */
const GW=540,GH=470,ML=58,MR=16,MT=22,MB=64;
const gx=e=>ML+e/Etot*(GW-ML-MR), gy=T=>MT+(1-(T-S.Tmin)/(S.Tmax-S.Tmin))*(GH-MT-MB);
function curvePts(){return [[0,S.Tmin],[B[1],S.mp],[B[2],S.mp],[B[3],S.bp],[B[4],S.bp],[Etot,S.Tmax]];}
function drawGraph(){
  const c=gctx;c.clearRect(0,0,GW,GH);
  const span=S.Tmax-S.Tmin,tstp=nice(span);
  const xs=[10,20,25,50,100].find(s=>Etot/s<=8)||100;
  c.font='12px system-ui,sans-serif';c.lineWidth=1;
  /* graella i eixos */
  c.strokeStyle=C.line;c.fillStyle=C.mut;c.textBaseline='middle';c.textAlign='right';
  for(let T=Math.ceil(S.Tmin/tstp)*tstp;T<=S.Tmax;T+=tstp){const y=gy(T);c.beginPath();c.moveTo(ML,y);c.lineTo(GW-MR,y);c.stroke();c.fillText(T,ML-6,y);}
  c.textAlign='center';c.textBaseline='top';
  for(let e=0;e<=Etot;e+=xs){const x=gx(e);c.beginPath();c.moveTo(x,MT);c.lineTo(x,GH-MB);c.stroke();c.fillText(e,x,GH-MB+6);}
  c.strokeStyle=C.mut;c.lineWidth=1.8;c.beginPath();c.moveTo(ML,MT);c.lineTo(ML,GH-MB);c.lineTo(GW-MR,GH-MB);c.stroke();
  c.fillStyle=C.ink;c.font='13px system-ui,sans-serif';c.textAlign='center';c.textBaseline='alphabetic';
  c.fillText(t('ax_x'),(ML+GW-MR)/2,GH-MB+34);
  c.save();c.translate(15,(MT+GH-MB)/2);c.rotate(-Math.PI/2);c.fillText(t('ax_y'),0,0);c.restore();
  /* línies de T de canvi de fase */
  c.setLineDash([5,5]);c.strokeStyle=C.mut;c.lineWidth=1.2;
  [S.mp,S.bp].forEach(T=>{c.beginPath();c.moveTo(ML,gy(T));c.lineTo(GW-MR,gy(T));c.stroke();});
  c.setLineDash([]);c.fillStyle=C.mut;c.font='12px system-ui,sans-serif';c.textAlign='left';c.textBaseline='bottom';
  c.fillText(t('lbl_tf',fmt(S.mp,1)),ML+8,gy(S.mp)-4);c.fillText(t('lbl_tb',fmt(S.bp,1)),ML+8,gy(S.bp)-4);
  /* corba: tènue (completa) + intensa (recorreguda) */
  const P=curvePts();c.lineCap='round';c.lineWidth=5;
  for(let pass=0;pass<2;pass++){
    for(let k=0;k<5;k++){
      const [e0,t0]=P[k],[e1,t1]=P[k+1];
      let ee=e1,tt=t1;
      if(pass===1){if(E<=e0)continue;if(E<e1){ee=E;tt=lerp(t0,t1,(E-e0)/(e1-e0));}}
      c.globalAlpha=pass?1:.25;c.strokeStyle=PHC[k];
      c.beginPath();c.moveTo(gx(e0),gy(t0));c.lineTo(gx(ee),gy(tt));c.stroke();
    }
  }
  c.globalAlpha=1;
  /* guies i marcador */
  const mx=gx(E),my=gy(cur.T);
  c.setLineDash([3,4]);c.strokeStyle=C.ink;c.globalAlpha=.55;c.lineWidth=1.2;
  c.beginPath();c.moveTo(mx,my);c.lineTo(mx,GH-MB);c.moveTo(mx,my);c.lineTo(ML,my);c.stroke();
  c.setLineDash([]);c.globalAlpha=1;
  c.beginPath();c.arc(mx,my,9,0,6.2832);c.fillStyle=PHC[cur.ph];c.fill();c.lineWidth=3;c.strokeStyle=C.card;c.stroke();
  /* llegenda de fases */
  const lw=(GW-ML-MR)/5;c.font='13px system-ui,sans-serif';c.textAlign='left';c.textBaseline='middle';
  for(let k=0;k<5;k++){const x=ML+k*lw+4,y=GH-14;
    c.fillStyle=PHC[k];c.fillRect(x,y-6,12,12);c.fillStyle=k===cur.ph?C.ink:C.mut;
    c.font=(k===cur.ph?'bold ':'')+'13px system-ui,sans-serif';c.fillText(t(PHN[k]),x+17,y);}
}

/* ---------- interfície ---------- */
const o={sT:$('#sT'),sS:$('#sS'),sE:$('#sE'),cap:$('#cap'),tOut:$('#tOut'),ts:$('#tslider')};
let last={};
function setTxt(el,k,v){if(last[k]!==v){last[k]=v;el.textContent=v;}}
function updateUI(){
  const T=cur.T;
  setTxt(o.sT,'sT',fmt(T,1)+' °C · '+fmt(T+273.15,1)+' K');
  const stt=['stt_solid','stt_melt','stt_liquid','stt_boil','stt_gas'][cur.ph];
  const pct=cur.ph===1?Math.round(cur.fm*100):cur.ph===3?Math.round(cur.fb*100):0;
  setTxt(o.sS,'sS',t(stt,pct));
  setTxt(o.sE,'sE',fmt(E,1)+' kJ');
  if(cur.ph!==lastPh){lastPh=cur.ph;o.cap.innerHTML=t(PHCAP[cur.ph]);}
  if(!tDrag){const v=Math.round(T);if(+o.ts.value!==v)o.ts.value=v;}
  setTxt(o.tOut,'tOut',(tDrag?o.ts.value:Math.round(T))+' °C');
  gcv.setAttribute('aria-valuenow',Math.round(E/Etot*100));
  gcv.setAttribute('aria-valuetext',fmt(T,1)+' °C · '+t(stt,pct));
}
function setDirUI(){
  $('#btnCool').setAttribute('aria-pressed',dir<0);
  $('#btnPause').setAttribute('aria-pressed',dir===0);
  $('#btnHeat').setAttribute('aria-pressed',dir>0);
}
function setDir(d){dir=d;setDirUI();}
$('#btnCool').onclick=()=>setDir(-1);
$('#btnPause').onclick=()=>setDir(0);
$('#btnHeat').onclick=()=>setDir(1);
$('#btnReset').onclick=()=>{setup($('#subSel').value);};
$('#subSel').onchange=e=>setup(e.target.value);
$('#speed').oninput=e=>{speed=+e.target.value;$('#speedOut').textContent=fmt(speed,2)+'×';};
$('#chkVel').onchange=e=>{showVel=e.target.checked;};
o.ts.oninput=()=>{tDrag=true;setDir(0);E=EofT(+o.ts.value);};
o.ts.onchange=()=>{tDrag=false;};
o.ts.addEventListener('pointerup',()=>{tDrag=false;});
/* gràfica: clic/arrossegament i teclat */
function graphSet(ev){const p=canvasPos(gcv,ev);E=clamp((p.x-ML)/(GW-ML-MR)*Etot,0,Etot);setDir(0);}
let gDown=false;
gcv.addEventListener('pointerdown',ev=>{gDown=true;gcv.setPointerCapture(ev.pointerId);graphSet(ev);ev.preventDefault();});
gcv.addEventListener('pointermove',ev=>{if(gDown)graphSet(ev);});
gcv.addEventListener('pointerup',()=>{gDown=false;});
gcv.addEventListener('pointercancel',()=>{gDown=false;});
gcv.addEventListener('keydown',ev=>{
  const k={ArrowRight:1,ArrowUp:1,ArrowLeft:-1,ArrowDown:-1}[ev.key];
  if(k){E=clamp(E+k*Etot/(ev.shiftKey?20:100),0,Etot);setDir(0);ev.preventDefault();}
  else if(ev.key==='Home'){E=0;setDir(0);ev.preventDefault();}
  else if(ev.key==='End'){E=Etot;setDir(0);ev.preventDefault();}
});

/* ---------- bucle ---------- */
setup('water');cur=stateAt(E);
let acc=0;
loop((dt,now)=>{
  if(dir!==0){E=clamp(E+dir*speed*Etot/40*dt,0,Etot);if((dir>0&&E>=Etot)||(dir<0&&E<=0))setDir(0);}
  cur=stateAt(E);
  acc+=dt;const h=1/120;let n=0;
  while(acc>=h&&n<6){step(h);acc-=h;n++;}
  if(n===6)acc=0;
  drawBox(now);drawGraph();updateUI();
});
})();
