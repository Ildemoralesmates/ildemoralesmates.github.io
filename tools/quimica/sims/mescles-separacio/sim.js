(()=>{
const W=520,H=480,PW=300;
const cv=$('#scene'),ctx0=setupCanvas(cv,W,H),pcv=$('#panel'),pctx=setupCanvas(pcv,PW,H);
let g=ctx0;
const TECH=['filt','dec','dist','chrom'],NST={filt:4,dec:4,dist:5,chrom:5};
let tech='filt',mix=0,P=0,target=0,playing=false,tm=0,dragging=false;
const SPEED=.42,CX=230;
const sm=(a,b,x)=>ease(clamp((x-a)/(b-a),0,1));
const un=i=>clamp(P-i,0,1);
const rnd=(i,s)=>{const x=Math.sin(i*127.1+s*311.7)*43758.5453;return x-Math.floor(x);};
const plain=s=>s.replace(/<sub>(.*?)<\/sub>/g,'$1').replace('R_f','Rf');
const line=(a,b,c,d)=>{g.beginPath();g.moveTo(a,b);g.lineTo(c,d);g.stroke();};
const circ=(x,y,r,f,s)=>{g.beginPath();g.arc(x,y,r,0,7);if(f){g.fillStyle=f;g.fill();}if(s){g.strokeStyle=s;g.stroke();}};
const WATER='rgba(77,171,247,.5)',OILC='rgba(238,186,40,.85)',MIXC='rgba(95,190,185,.55)',ALCC='rgba(110,200,150,.7)',SANDC='#c9955a',NA='#8a94a6',CL='#37b24d',PAPER='rgba(236,230,208,.94)',EMUL='rgba(150,185,140,.7)',CLOUD='rgba(170,130,90,.55)';
function glass(){g.strokeStyle=C.ink;g.lineWidth=2.2;g.lineJoin='round';g.lineCap='round';g.setLineDash([]);}
function txt(s,x,y,o){o=o||{};g.save();g.globalAlpha=o.a==null?1:o.a;g.font=(o.b?'600 ':'')+(o.sz||14)+'px system-ui,sans-serif';g.fillStyle=o.col||C.ink;g.textAlign=o.al||'left';g.textBaseline='middle';g.fillText(s,x,y);g.restore();}
function lab(key,ax,ay,tx,ty,a,al,args){
  if(a<.03)return;const s=plain(t(key,...(args||[])));
  g.save();g.globalAlpha=a;g.strokeStyle=C.mut;g.lineWidth=1;g.setLineDash([]);line(ax,ay,tx,ty);
  g.font='14px system-ui,sans-serif';const w=g.measureText(s).width;
  const x0=al==='c'?tx-w/2:al==='l'?tx:(tx>=ax?tx+4:tx-4-w);
  g.globalAlpha=a*.92;g.fillStyle=C.card;rr(g,x0-4,ty-11,w+8,22,6);g.fill();
  g.globalAlpha=a;g.fillStyle=C.ink;g.textAlign='left';g.textBaseline='middle';g.fillText(s,x0,ty);g.restore();}
function ion(x,y,i){if(i%2)circ(x,y,2.6,NA);else circ(x,y,3,CL);}
function stream(x,y1,y2,col,w){if(y2<=y1)return;g.fillStyle=col;g.fillRect(x-w/2,y1,w,y2-y1);}
function beaker(px,py,th,f,col,alpha){
  g.save();g.globalAlpha=alpha;g.translate(px,py);g.rotate(-th);
  const bw=70,bh=80;
  if(f>.01){const s=Math.tan(th);
    const area=c=>{let a=0;for(let k=0;k<24;k++){const x=(k+.5)*bw/24;a+=clamp(bh-(c+s*x),0,bh);}return a*bw/24;};
    let lo=-400,hi=bh+400;const tg=f*bw*bh;for(let k=0;k<30;k++){const m=(lo+hi)/2;if(area(m)>tg)lo=m;else hi=m;}
    const c=(lo+hi)/2;
    g.save();g.beginPath();g.rect(0,0,bw,bh);g.clip();
    g.beginPath();g.moveTo(-5,c-5*s);g.lineTo(bw+5,c+(bw+5)*s);g.lineTo(bw+5,bh+5);g.lineTo(-5,bh+5);g.closePath();g.fillStyle=col;g.fill();g.restore();}
  glass();g.beginPath();g.moveTo(0,0);g.lineTo(0,bh-4);g.quadraticCurveTo(0,bh,4,bh);g.lineTo(bw-4,bh);g.quadraticCurveTo(bw,bh,bw,bh-4);g.lineTo(bw,0);g.stroke();
  g.restore();}

/* ============ FILTRACIÓ ============ */
const hwPaper=y=>Math.max(0,.755*(214-y));
const hwFlask=y=>y<=332?12:12+63*(y-332)/78;
function flaskPath(){g.beginPath();g.moveTo(CX-12,300);g.lineTo(CX-12,332);g.lineTo(CX-75,410);g.lineTo(CX+75,410);g.lineTo(CX+12,332);g.lineTo(CX+12,300);g.closePath();}
function drawFilt(){
  const sand=mix===0,u1=un(1),u2=un(2),u3=un(3);
  const e1=ease(u1),e2=ease(u2),liq=sand?CLOUD:WATER;
  g.lineCap='round';g.strokeStyle=C.mut;g.lineWidth=5;g.setLineDash([]);line(60,90,60,425);line(30,425,115,425);g.lineWidth=3;line(60,192,CX-30,192);
  /* erlenmeyer */
  const h2=56*e2,surf=410-h2;
  if(h2>.5){g.save();flaskPath();g.clip();g.fillStyle=WATER;g.fillRect(CX-90,surf,180,h2+2);
    if(!sand){const n=Math.floor(26*e2);for(let i=0;i<n;i++){const y=surf+5+rnd(i,4)*Math.max(1,h2-10);ion(CX+(rnd(i,5)-.5)*2*hwFlask(y)*.85+Math.sin(tm*2+i)*1.2,y+Math.cos(tm*1.7+i)*1.2,i);}}
    g.restore();}
  glass();flaskPath();g.stroke();
  /* embut */
  glass();g.beginPath();g.moveTo(CX-80,112);g.lineTo(CX-6,215);g.lineTo(CX-6,318);g.moveTo(CX+80,112);g.lineTo(CX+6,215);g.lineTo(CX+6,318);g.stroke();
  /* paper */
  const pOff=-(1-sm(0,.7,P))*70,pA=sm(0,.5,P);
  const lvl=P<2?211-70*e1:211-70*(1-e2);
  g.save();g.translate(0,pOff);g.globalAlpha=pA;
  g.beginPath();g.moveTo(CX-76,114);g.lineTo(CX,214);g.lineTo(CX+76,114);g.closePath();g.fillStyle=PAPER;g.fill();
  g.save();g.clip();
  if(lvl<209){g.fillStyle=liq;g.fillRect(0,lvl,W,240-lvl);
    if(sand&&P>=1){for(let i=0;i<30;i++){if(lvl>204&&e2===0)break;let y=lvl+4+rnd(i,2)*Math.max(1,206-lvl-4);y=lerp(y,206-rnd(i,3)*5,e2);
      const x=CX+(rnd(i,1)-.5)*2*hwPaper(y)*(.85-.6*e2)+Math.sin(tm*1.5+i)*1.2*(1-e2);circ(x,y,2.3,SANDC);}}
    if(!sand&&P>=1){for(let i=0;i<24;i++){if(rnd(i,9)<e2)continue;const y=lvl+5+rnd(i,2)*Math.max(1,206-lvl-8);ion(CX+(rnd(i,1)-.5)*2*hwPaper(y)*.82+Math.sin(tm*2+i)*1.2,y,i);}}}
  if(sand){const pile=.4*e1+.6*e2;if(pile>.02){g.fillStyle=SANDC;g.beginPath();g.ellipse(CX,213,6+30*pile,3+13*pile,0,0,7);g.fill();}}
  g.restore();
  g.strokeStyle='#a89f84';g.lineWidth=1.5;g.beginPath();g.moveTo(CX-76,114);g.lineTo(CX,214);g.lineTo(CX+76,114);g.stroke();
  g.globalAlpha=pA*.35;line(CX,214,CX,116);
  g.restore();
  /* degoteig */
  if(u2>.04&&u2<.97){for(let k=0;k<3;k++){const yd=318+((tm*2.2+k/3)%1)*(surf-318);circ(CX,yd,2.4,WATER);}}
  /* vas que aboca */
  if(P<2.3){const ba=1-sm(2,2.3,P),m=sm(0,.25,u1);
    const lipX=lerp(CX+135,CX+14,m),lipY=lerp(150,52,m);
    const th=.96*sm(.05,.3,u1)*(1-sm(.82,.97,u1));
    const f=P<1?.9:.9*(1-sm(.12,.88,u1));
    g.save();g.globalAlpha=ba;beaker(lipX,lipY,th,f,liq,1);
    if(u1>.18&&u1<.9&&f>.06){stream(lipX-6,lipY+3,Math.min(Math.max(lvl,120),206),liq,3);}
    g.restore();}
  /* etiquetes */
  const la=sm(.4,1,P);
  lab('lb_funnel',CX-67,130,135,112,la);
  lab('lb_paper',CX-33,180,135,150,pA*la);
  lab('lb_flask',CX-62,395,130,395,la);
  lab('lb_mix',400,170,440,130,(1-sm(0,.1,u1))*(P<1?1:0));
  lab(sand?'lb_residue_sand':'lb_no_residue',CX+8,208,CX+100,232,u3);
  lab(sand?'lb_filtrate':'lb_filtrate_salt',CX+20,395,CX,442,u3,'c');
}
function panelFilt(){
  const sand=mix===0;
  txt(plain(t('lb_zoom')),PW/2,20,{al:'center',b:true});
  g.strokeStyle=C.line;g.lineWidth=1;rr(g,16,36,268,270,10);g.stroke();
  const my=176,fa=sm(1,1.25,P)*(1-sm(2.8,3,P));
  g.save();rr(g,16,36,268,270,10);g.clip();
  for(let k=0;k<5;k++){g.fillStyle='#d9d2bd';g.strokeStyle='#a89f84';g.lineWidth=1.5;rr(g,24+k*52,my-7,36,14,7);g.fill();g.stroke();}
  g.globalAlpha=fa;
  const nw=20;for(let i=0;i<nw;i++){const x=68+52*(i%4)+Math.sin(tm*2+i)*4,y=40+((tm*.35+i*.137+rnd(i,1))%1)*260;circ(x,y,3.3,'#4dabf7');}
  if(!sand){for(let i=0;i<14;i++){const x=68+52*((i+2)%4)+Math.sin(tm*2.3+i)*4,y=40+((tm*.33+i*.21+rnd(i,6))%1)*260;g.save();ion(x,y,i);g.restore();}}
  g.globalAlpha=1;
  if(sand){const rows=[[159,[42,94,146,198,250]],[138,[68,120,172,224]],[117,[94,146,198]]];
    rows.forEach((r,ri)=>{r[1].forEach((x,ci)=>{const s=clamp(un(1)*2-ri*.35,0,1);if(s<=0)return;const yy=lerp(48,r[0],ease(s));
      const rt=s>=1?Math.sin(tm*3+ci+ri)*.8:0;circ(x+rt,yy,10.5,SANDC,'#8f6a3f');});});}
  g.restore();
  if(sand){circ(34,338,8,SANDC,'#8f6a3f');txt(plain(t('lb_blocked')),50,338,{sz:13});}
  circ(34,368,3.5,'#4dabf7');txt(plain(t(sand?'lb_passes_w':'lb_passes')),50,368,{sz:13});
  if(!sand){ion(34,392,0);ion(44,392,1);txt(plain(t('lg_ions')),56,392,{sz:13});}
}

/* ============ DECANTACIÓ ============ */
const HWT=[[86,12],[112,45],[140,66],[188,76],[230,52],[262,26],[300,6]];
function hwF(y){if(y<=86)return 12;if(y>=300)return 6;for(let i=1;i<HWT.length;i++){if(y<=HWT[i][0]){const a=HWT[i-1],b=HWT[i];return lerp(a[1],b[1],(y-a[0])/(b[0]-a[0]));}}return 6;}
function funnelPath(){g.beginPath();g.moveTo(CX-12,86);g.bezierCurveTo(CX-12,118,CX-76,128,CX-76,188);g.bezierCurveTo(CX-76,238,CX-8,262,CX-6,300);g.lineTo(CX-6,350);g.lineTo(CX+6,350);g.lineTo(CX+6,300);g.bezierCurveTo(CX+8,262,CX+76,238,CX+76,188);g.bezierCurveTo(CX+76,128,CX+12,118,CX+12,86);}
function drawDec(){
  const oil=mix===0,u0=un(0),u1=un(1),u2=un(2),u3=un(3),e2=ease(u2);
  const TOP=112,BOT=300,OT=70,Y0=TOP+OT;
  const topY=P<1?BOT-(BOT-TOP)*sm(.15,.85,u0):TOP;
  /* receptor */
  const rh=46*e2,rs=438-rh;
  if(rh>.5){g.fillStyle=oil?WATER:MIXC;g.fillRect(CX-47,rs,94,rh);}
  glass();g.beginPath();g.moveTo(CX-48,386);g.lineTo(CX-48,438);g.lineTo(CX+48,438);g.lineTo(CX+48,386);g.stroke();
  /* embut */
  g.save();funnelPath();g.clip();
  let oilTop=0,oilBot=0;
  if(oil){
    if(P<1){g.fillStyle=WATER;g.fillRect(0,topY,W,BOT-topY+4);}
    else{
      const hl=P<2?OT*sm(.45,1,u1):OT;
      const yi=P<2?TOP+hl:Y0+(292-Y0)*e2;
      oilBot=yi;oilTop=yi-hl;
      g.fillStyle=WATER;g.fillRect(0,oilBot,W,BOT-oilBot+4);
      g.fillStyle=OILC;g.fillRect(0,oilTop,W,hl);
      if(P<2&&u1<.9){g.fillStyle=WATER;g.fillRect(0,oilTop,W,hl*(1-sm(.45,.9,u1)));}
    }
    for(let i=0;i<44;i++){
      const y0=118+rnd(i,2)*178;if(P<1&&y0<topY+4)continue;
      const q=clamp(un(1)*1.5-rnd(i,3)*.5,0,1);if(q>=1)continue;
      const y=lerp(y0,116+rnd(i,4)*(OT-10),ease(q));
      circ(CX+(rnd(i,1)-.5)*2*hwF(y)*.8+Math.sin(tm*2+i)*2,y,3+rnd(i,7)*3,OILC);}
  }else{
    const t2=P<2?topY:TOP+(BOT-TOP)*e2;
    g.fillStyle=MIXC;g.fillRect(0,t2,W,BOT-t2+4);
    oilTop=t2;oilBot=t2;
  }
  g.restore();
  glass();funnelPath();g.stroke();g.beginPath();g.moveTo(CX-12,40);g.lineTo(CX-12,86);g.moveTo(CX+12,40);g.lineTo(CX+12,86);g.stroke();
  if(oil&&P>=1){const a=sm(.85,1,u1);if(a>.02){g.save();g.globalAlpha=a*.6;g.setLineDash([5,4]);g.lineWidth=1.5;line(CX-hwF(oilBot)+2,oilBot,CX+hwF(oilBot)-2,oilBot);g.restore();}}
  /* clau */
  const op=P<2?0:(P<3?sm(2,2.1,P):1-sm(3,3.25,P));
  g.fillStyle=C.card;glass();rr(g,CX-8,314,16,16,3);g.fill();g.stroke();
  g.save();g.translate(CX,322);g.rotate(lerp(0,-1.25,op));g.fillStyle=C.mut;rr(g,0,-3,28,6,3);g.fill();g.restore();
  /* corrent */
  if(oil){if(P>2.02&&P<3.25)stream(CX,350,rs,WATER,3);}
  else if(P>2.02&&P<2.97)stream(CX,350,rs,MIXC,3);
  /* tap */
  const stA=(P<.02||P>=.92)?1:0;
  if(stA){g.fillStyle='#8a6d4b';g.beginPath();g.moveTo(CX-16,26);g.lineTo(CX+16,26);g.lineTo(CX+12,42);g.lineTo(CX-12,42);g.closePath();g.fill();}
  /* vas */
  if(P<1.2){const ba=1-sm(1,1.2,P),m=sm(0,.25,u0)*(1-sm(.85,.98,u0));
    const lipX=lerp(CX+135,CX+14,m),lipY=lerp(140,34,m),th=.96*sm(.05,.3,u0)*(1-sm(.85,.98,u0));
    const f=.9*(1-sm(.12,.88,u0)),col=oil?EMUL:MIXC;
    g.save();g.globalAlpha=ba;beaker(lipX,lipY,th,f,col,1);
    if(u0>.2&&u0<.88&&f>.06)stream(lipX-6,lipY+3,Math.max(topY,96),col,3);g.restore();}
  /* etiquetes */
  const la=sm(.3,.9,P);
  lab('lb_stopcock',CX+8,322,CX+55,338,la);
  if(stA)lab('lb_stopper',CX-12,34,CX-50,22,la);
  lab('lb_mix',400,160,440,128,(1-sm(0,.1,u0))*(P<1?1:0));
  if(oil){
    lab('lb_oil',CX+hwF((oilTop+oilBot)/2)-12,(oilTop+oilBot)/2,CX+95,(oilTop+oilBot)/2,sm(.85,1,u1));
    const wy=(oilBot+300)/2;
    lab('lb_water',CX+22,wy,CX+95,Math.max(wy,oilBot+14),sm(.85,1,u1)*(1-sm(2,2.4,P)));
    lab('lb_water',CX+40,420,CX+95,412,sm(2.4,2.9,P));
    lab('lb_interface',CX-hwF(oilBot)+6,oilBot,135,oilBot,sm(.9,1,u1)*(P<2.4?1:1-sm(2.4,2.8,P)));
  }else{
    lab('lb_single',CX+50,200,CX+95,200,sm(.4,.9,u1)*(1-sm(2,2.3,P)));
    lab('lb_collected_all',CX+40,420,CX+95,412,sm(2.4,2.9,P));
  }
}
let decData=null,decMix=-1;
function buildDec(){
  const cols=12,rows=12,cell=21,x0=22,y0=44,cells=[];
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)cells.push({x:x0+c*cell+cell/2,y:y0+r*cell+cell/2});
  const n=cells.length,perm=[...Array(n).keys()].sort((a,b)=>rnd(a,11)-rnd(b,11));
  const nO=Math.round(n*.45);
  decData=[...Array(n).keys()].map(k=>({k,s:cells[perm[k]],f:cells[k],type:mix===0?(k<nO?'o':'w'):(rnd(k,8)<.45?'a':'w')}));
  decMix=mix;}
function panelDec(){
  if(decMix!==mix)buildDec();
  const oil=mix===0;
  txt(plain(t('lb_zoom_int')),PW/2,20,{al:'center',b:true});
  g.strokeStyle=C.line;g.lineWidth=1;rr(g,16,36,268,270,10);g.stroke();
  decData.forEach(p=>{
    let x,y;
    if(oil){const q=clamp(un(1)*1.5-rnd(p.k,3)*.5,0,1),e=ease(q);x=lerp(p.s.x,p.f.x,e);y=lerp(p.s.y,p.f.y,e);}
    else{x=p.f.x;y=p.f.y;}
    x+=Math.sin(tm*3+p.k)*2;y+=Math.cos(tm*2.6+p.k*1.3)*2;
    if(p.type==='o'){g.fillStyle='#e8b422';g.beginPath();g.ellipse(x,y,9,4.6,0,0,7);g.fill();}
    else circ(x,y,6.2,p.type==='a'?CL:'#4dabf7');});
  circ(30,326,6,'#4dabf7');txt(plain(t('lg_water')),42,326,{sz:13});
  if(oil){g.fillStyle='#e8b422';g.beginPath();g.ellipse(110,326,9,4.6,0,0,7);g.fill();txt(plain(t('lg_oil')),124,326,{sz:13});}
  else{circ(110,326,6,CL);txt(plain(t('lg_alcohol')),122,326,{sz:13});}
  txt(plain(t(oil?'prop_dec':'prop_dec')),0,0,{a:0});
}

/* ============ DESTIL·LACIÓ ============ */
const DA={x:160,y:185},DANG=Math.atan2(115,240),DL=Math.hypot(240,115);
const dw=(lx,ly)=>({x:DA.x+lx*Math.cos(DANG)-ly*Math.sin(DANG),y:DA.y+lx*Math.sin(DANG)+ly*Math.cos(DANG)});
const TB=()=>mix===0?100:78;
function Tof(p){if(p<1)return 20;if(p<2)return lerp(20,TB(),ease(p-1));return mix===0?100+1*sm(2,5,p):lerp(78,86,sm(2,5,p));}
function drawDist(){
  const salt=mix===0,u1=un(1);
  const T=Tof(P),vol=sm(2.2,5,P),ys=258+30*vol,coll=sm(2.9,5,P);
  /* trespeus + cremador */
  g.lineCap='round';g.strokeStyle=C.mut;g.lineWidth=3;line(50,366,140,366);line(60,366,50,432);line(130,366,140,432);
  g.fillStyle=C.mut;rr(g,85,396,20,34,3);g.fill();
  const fh=28*clamp(u1*3,0,1)*(P>=5?0:1)*(.9+.1*Math.sin(tm*14));
  if(fh>1){g.fillStyle='#ff922b';g.beginPath();g.moveTo(88,396);g.quadraticCurveTo(87,396-fh*.7,95,396-fh);g.quadraticCurveTo(103,396-fh*.7,102,396);g.closePath();g.fill();
    g.fillStyle='#ffd43b';g.beginPath();g.moveTo(91,396);g.quadraticCurveTo(95,396-fh*.55,99,396);g.closePath();g.fill();}
  /* matràs */
  g.save();
  g.beginPath();g.moveTo(83,175);g.lineTo(83,239.2);g.arc(95,300,62,-1.7708,-1.3708,true);g.lineTo(107,239.2);g.lineTo(107,175);g.closePath();g.clip();
  g.fillStyle=salt?WATER:MIXC;g.fillRect(20,ys,160,400-ys);
  if(!salt){g.fillStyle='rgba(77,171,247,'+(.5*vol)+')';g.fillRect(20,ys,160,400-ys);}
  if(salt){for(let i=0;i<28;i++){const y=ys+6+rnd(i,4)*(356-ys-6),w=Math.sqrt(Math.max(0,3844-(y-300)*(y-300)));ion(95+(rnd(i,5)-.5)*2*w*.82+Math.sin(tm*2+i)*1.2,y+Math.cos(tm*1.7+i)*1.2,i);}}
  const ba=sm(1.2,1.8,P);
  if(ba>0){g.strokeStyle='rgba(255,255,255,.85)';g.lineWidth=1.2;for(let i=0;i<9;i++){const f=(tm*.5+rnd(i,6))%1,y=350-f*(350-ys),w=Math.sqrt(Math.max(0,3844-(y-300)*(y-300)));g.globalAlpha=ba;g.beginPath();g.arc(95+(rnd(i,7)-.5)*2*w*.7,y,1.5+2*f,0,7);g.stroke();}g.globalAlpha=1;}
  g.restore();
  glass();g.beginPath();g.moveTo(83,175);g.lineTo(83,239.2);g.arc(95,300,62,-1.7708,-1.3708,true);g.lineTo(107,191);g.moveTo(107,179);g.lineTo(107,175);g.stroke();
  /* tap + termòmetre */
  g.fillStyle='#8a6d4b';g.beginPath();g.moveTo(80,160);g.lineTo(110,160);g.lineTo(107,178);g.lineTo(83,178);g.closePath();g.fill();
  glass();g.fillStyle=C.card;rr(g,91,80,8,110,4);g.fill();g.stroke();
  const yt=190-(T/110)*100;
  g.fillStyle='#e03131';circ(95,193,6,'#e03131');g.fillRect(93.5,yt,3,193-yt);
  circ(95,193,6,null,C.ink);
  /* braç lateral */
  glass();line(107,179,DA.x,179);line(107,191,DA.x,191);
  /* refrigerant */
  g.save();g.translate(DA.x,DA.y);g.rotate(DANG);
  const cool=sm(2.9,3.4,P);
  g.fillStyle='rgba(77,171,247,'+(.28*cool)+')';glass();rr(g,0,-17,DL,34,6);g.fill();g.stroke();
  g.fillStyle=C.card;g.globalAlpha=.6;g.fillRect(0,-6,DL,12);g.globalAlpha=1;g.beginPath();g.moveTo(0,-6);g.lineTo(DL,-6);g.moveTo(0,6);g.lineTo(DL,6);g.stroke();
  line(DL-30,17,DL-30,32);line(30,-17,30,-32);
  if(cool>.02){g.save();g.globalAlpha=cool;g.strokeStyle='#1c7ed6';g.lineWidth=2;for(let k=0;k<6;k++){const x=DL-((tm*60+k*45)%DL);if(x<14||x>DL-6)continue;[-12,12].forEach(yy=>{g.beginPath();g.moveTo(x+5,yy-4);g.lineTo(x,yy);g.lineTo(x+5,yy+4);g.stroke();});}g.restore();}
  g.restore();
  /* vapor */
  const va=sm(1.8,2.5,P)*(1-sm(4.7,5,P));
  if(va>.02){const segs=[[95,245],[95,185],[160,185],[400,300]],lens=[60,65,DL],tot=125+DL;
    for(let i=0;i<22;i++){const s=((tm*.12+i/22)%1)*tot;let acc=0,x=95,y=245;
      for(let k=0;k<3;k++){if(s<=acc+lens[k]){const f=(s-acc)/lens[k];x=lerp(segs[k][0],segs[k+1][0],f);y=lerp(segs[k][1],segs[k+1][1],f);break;}acc+=lens[k];}
      const f2=clamp((s-125)/DL,0,1);
      circ(x+Math.sin(tm*3+i)*1.5,y+Math.cos(tm*2.4+i)*1.5,2.6,'rgba(190,200,215,'+(.8*va*(1-f2*cool))+')');}}
  /* recol·lector */
  const rh=52*coll,rs=433-rh,rcol=salt?WATER:ALCC;
  g.save();g.beginPath();g.moveTo(393,345);g.lineTo(393,372);g.lineTo(360,435);g.lineTo(450,435);g.lineTo(417,372);g.lineTo(417,345);g.closePath();g.clip();
  g.fillStyle=rcol;g.fillRect(340,rs,130,rh+4);g.restore();
  glass();g.beginPath();g.moveTo(393,345);g.lineTo(393,372);g.lineTo(360,435);g.lineTo(450,435);g.lineTo(417,372);g.lineTo(417,345);g.stroke();
  if(P>2.9&&P<4.95){const dA=sm(2.9,3.3,P);for(let k=0;k<3;k++){const yd=308+((tm*1.8+k/3)%1)*(Math.max(rs,330)-308);g.globalAlpha=dA;circ(401,yd,2.5,rcol);g.globalAlpha=1;}}
  /* etiquetes */
  const la=sm(.2,.8,P);
  lab('lb_boilflask',64,255,6,236,la,'l');
  lab('lb_thermo',99,150,130,138,la,'l');
  lab('lb_condenser',287,224,287,190,la,'c');
  lab('lb_heat',100,412,150,430,sm(1,1.4,P));
  lab('lb_cold_in',360,314,296,352,cool);
  lab('lb_cold_out',200,171,230,142,cool,'l');
  const fa=sm(3.7,4.5,P);
  lab('lb_receiver',405,436,405,454,la*(1-fa),'c');
  lab(salt?'lb_distillate_water':'lb_distillate_eth',405,436,405,454,fa,'c');
  lab(salt?'lb_residue_salt':'lb_residue_water',150,322,172,392,fa,'l');
  txt(plain(t('lb_temp',fmt(T,0))),108,88,{b:true,a:1});
}
function panelDist(){
  txt(plain(t('lb_temp_axis')),PW/2,16,{al:'center',b:true,sz:13});
  const gx0=44,gx1=284,gy0=194,gy1=34,T=Tof(P);
  const px=p=>gx0+p/5*(gx1-gx0),py=T_=>gy0-T_/110*(gy0-gy1);
  g.strokeStyle=C.line;g.lineWidth=1;g.setLineDash([]);
  [0,50,100].forEach(v=>{line(gx0,py(v),gx1,py(v));txt(String(v),gx0-6,py(v),{al:'right',sz:12,col:C.mut});});
  g.strokeStyle=C.mut;g.lineWidth=1.6;line(gx0,gy1,gx0,gy0);line(gx0,gy0,gx1,gy0);
  g.save();g.strokeStyle=C.ko;g.setLineDash([4,4]);g.globalAlpha=.7;line(gx0,py(TB()),gx1,py(TB()));g.restore();
  g.strokeStyle=C.acc;g.lineWidth=2.6;g.beginPath();
  for(let p=0;p<=P+1e-6;p+=.04){const x=px(p),y=py(Tof(p));if(p===0)g.moveTo(x,y);else g.lineTo(x,y);}
  g.lineTo(px(P),py(T));g.stroke();circ(px(P),py(T),5,C.acc);
  txt(plain(t('lb_temp',fmt(T,0))),gx1,176,{al:'right',b:true,sz:14});
  /* zoom */
  txt(plain(t('lb_zoom_dist')),PW/2,226,{al:'center',b:true,sz:13});
  g.strokeStyle=C.line;rr(g,16,238,268,182,10);g.stroke();
  const salt=mix===0,a=sm(1,2,P);
  g.save();rr(g,16,238,268,182,10);g.clip();
  g.fillStyle=salt?'rgba(77,171,247,.18)':'rgba(95,190,185,.2)';g.fillRect(16,330,268,90);
  for(let i=0;i<30;i++){
    const rx=30+(i%10)*25.5,ry=346+Math.floor(i/10)*26,sol=i%3===0;
    const rate=salt?(sol?0:.4):(sol?.85:.3);
    const col=sol?(salt?NA:CL):'#4dabf7';
    const ph=(tm*.18+rnd(i,9))%1,r=rate*a;
    let x=rx+Math.sin(tm*3+i)*3,y=ry+Math.cos(tm*2.5+i)*3;
    if(r>.01&&ph<r){const f=ph/r;y=ry-f*(ry-248);x=rx+Math.sin(tm*2+i)*8;}
    circ(x,y,sol?5.2:4,col);}
  g.restore();
  circ(34,440,4,'#4dabf7');txt(plain(t('lg_water')),44,440,{sz:12});
  circ(110,440,5,salt?NA:CL);txt(plain(t(salt?'lg_ions':'lg_ethanol')),120,440,{sz:12});
}

/* ============ CROMATOGRAFIA ============ */
const DCM=7.0;
const CH=[{ink:'#2b2b2b',cs:[{k:'lb_comp_yellow',c:'#f5c400',d:5.7},{k:'lb_comp_magenta',c:'#d6249f',d:4.1},{k:'lb_comp_cyan',c:'#12b3d6',d:2.2}]},
          {ink:'#2f7d3f',cs:[{k:'lb_comp_yellow',c:'#f5c400',d:5.6},{k:'lb_comp_blue',c:'#2b59c3',d:2.5}]}];
const YB=352,YF=212,PXD=(YB-YF)/DCM;
function drawChrom(){
  const m=CH[mix],u0=un(0),u1=un(1),u2=un(2),u3=un(3),u4=un(4);
  const wy=lerp(418,372,ease(u1));
  /* got */
  g.save();g.beginPath();g.moveTo(130,195);g.lineTo(130,412);g.quadraticCurveTo(130,420,138,420);g.lineTo(332,420);g.quadraticCurveTo(340,420,340,412);g.lineTo(340,195);
  g.lineTo(341,195);g.lineTo(341,430);g.lineTo(129,430);g.lineTo(129,195);g.closePath();g.restore();
  g.save();g.beginPath();g.rect(131,wy,208,420-wy);g.fillStyle=WATER;g.fill();g.restore();
  /* tira */
  const sx=CX-35,sw=70,st=196,sb=392;
  g.fillStyle=PAPER;g.fillRect(sx,st,sw,sb-st);g.strokeStyle='#a89f84';g.lineWidth=1.2;g.strokeRect(sx,st,sw,sb-st);
  const frontY=u2<=0?(u1>.6?372:372):lerp(372,YF,1-Math.pow(1-u2,1.6));
  const wetTop=P<1.6?sb:(P<2?372:frontY);
  if(P>=1.6){g.fillStyle='rgba(60,120,190,.16)';g.fillRect(sx+1,wetTop,sw-2,sb-wetTop);}
  const q=P<2?0:clamp((YB-frontY)/(YB-YF),0,1);
  /* línia base i punts */
  g.save();g.setLineDash([4,3]);g.strokeStyle='#777';g.lineWidth=1.3;g.globalAlpha=sm(0,.4,u0);line(sx+3,YB,sx+sw-3,YB);g.restore();
  const sp=sm(0,.7,u0);
  if(sp>0){g.globalAlpha=1-sm(0,.12,q);g.fillStyle=m.ink;g.beginPath();g.ellipse(CX,YB,9*sp,4.5*sp,0,0,7);g.fill();g.globalAlpha=1;}
  if(q>0){m.cs.forEach(c=>{const y=YB-(c.d/DCM)*q*(YB-YF),ry=3.5+3*q;g.globalAlpha=clamp(.3+q*6,0,1);g.fillStyle=c.c;g.beginPath();g.ellipse(CX,y,10+3*q,ry,0,0,7);g.fill();g.globalAlpha=1;});}
  /* front */
  if(P>=3-.001){g.save();g.setLineDash([5,3]);g.strokeStyle=C.ink;g.lineWidth=1.6;g.globalAlpha=sm(2.9,3.4,P);line(sx-4,YF,sx+sw+4,YF);g.restore();}
  /* llapis */
  g.fillStyle='#e8b93a';g.fillRect(118,186,232,9);g.fillStyle='#d9a0a0';g.fillRect(118,186,10,9);g.fillStyle='#caa97a';g.beginPath();g.moveTo(350,186);g.lineTo(364,190.5);g.lineTo(350,195);g.closePath();g.fill();
  glass();g.beginPath();g.moveTo(130,195);g.lineTo(130,412);g.quadraticCurveTo(130,420,138,420);g.lineTo(332,420);g.quadraticCurveTo(340,420,340,412);g.lineTo(340,195);g.stroke();
  /* mesures (pas 4) */
  if(u4>0){
    g.save();g.globalAlpha=sm(0,.3,u4);g.strokeStyle=C.ink;g.lineWidth=1.5;
    const xd=CX+50;line(xd,YB,xd,YF);line(xd-5,YB,xd+5,YB);line(xd-5,YF,xd+5,YF);g.restore();
    txt(plain(t('lb_front_val',fmt(DCM,1))),CX+58,(YB+YF)/2,{sz:13,a:sm(0,.3,u4)});
    m.cs.forEach((c,k)=>{const a=clamp(u4*3-k*.6,0,1),y=YB-(c.d/DCM)*(YB-YF),x=sx-8-k*9;
      g.save();g.globalAlpha=a;g.strokeStyle=c.c;g.lineWidth=2.4;line(x,YB,x,y);line(x-3,YB,x+3,YB);line(x-3,y,x+3,y);g.setLineDash([2,3]);g.lineWidth=1;line(x,y,CX-12,y);g.restore();});
  }
  /* etiquetes */
  const la=sm(.3,.9,P);
  lab('lb_baseline',sx,YB,CX-62,YB+22,sm(.2,.6,u0)*(1-sm(3,3.4,P)),'r');
  lab('lb_spot',CX+8,YB-3,CX+58,YB-30,sm(.5,1,u0)*(1-sm(0,.15,q)));
  lab('lb_solvent',335,400,352,400,sm(.6,1,u1),'l');
  lab('lb_front',sx,YF,CX-62,YF-26,sm(3.1,3.6,P)*(1-sm(3.9,4.2,P)),'r');
  void la;void u3;
}
function panelChrom(){
  const m=CH[mix],u4=un(4);
  txt(plain(t('lb_results')),PW/2,20,{al:'center',b:true});
  txt(plain(t('lb_rf')),PW/2,52,{al:'center',sz:18,b:true,col:C.acc});
  txt(plain(t('lb_front_val',fmt(DCM,1))),16,88,{sz:14,a:sm(3,3.5,P)});
  m.cs.forEach((c,k)=>{const a=clamp(u4*3-k,0,1);if(a<=0)return;
    g.save();g.globalAlpha=a;circ(24,126+k*34,7,c.c);g.restore();
    txt(plain(t('lb_rf_line',t(c.k),fmt(c.d,1),fmt(c.d/DCM,2))),40,126+k*34,{sz:13.5,a:a});});
  /* escala Rf */
  const ax0=30,ax1=270,ay=300;
  g.strokeStyle=C.mut;g.lineWidth=2;g.setLineDash([]);line(ax0,ay,ax1,ay);
  [0,.5,1].forEach(v=>{const x=ax0+v*(ax1-ax0);line(x,ay-5,x,ay+5);txt(fmt(v,v===.5?1:0),x,ay+18,{al:'center',sz:12,col:C.mut});});
  txt(plain(t('lb_rf')).replace(/ = .*/,''),PW/2,ay+44,{al:'center',sz:13,col:C.mut});
  m.cs.forEach((c,k)=>{const a=clamp(u4*3-k,0,1);if(a<=0)return;const x=ax0+(c.d/DCM)*(ax1-ax0);
    g.save();g.globalAlpha=a;circ(x,ay,9,c.c,C.ink);g.restore();});
}

/* ============ INTERFÍCIE ============ */
function draw(){
  g=ctx0;g.clearRect(0,0,W,H);g.setLineDash([]);
  ({filt:drawFilt,dec:drawDec,dist:drawDist,chrom:drawChrom})[tech]();
  g=pctx;g.clearRect(0,0,PW,H);g.setLineDash([]);
  ({filt:panelFilt,dec:panelDec,dist:panelDist,chrom:panelChrom})[tech]();
}
const N=()=>NST[tech];
const stepIdx=()=>clamp(Math.ceil(P-1e-6)-1,0,N()-1);
let lastKey='';
function buildSteps(){
  const ol=$('#steps');ol.innerHTML='';
  for(let i=0;i<N();i++){
    const li=document.createElement('li');li.tabIndex=0;
    li.innerHTML='<b>'+(i+1)+'. '+t('s_'+tech+'_'+i+'_t')+'</b><span class="d">'+t('s_'+tech+'_'+i+'_d')+'</span>';
    const go=()=>{playing=false;P=target=i+1;syncPlayBtn();};
    li.addEventListener('click',go);
    li.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}});
    ol.appendChild(li);}
  $('#principle').innerHTML='<b>'+t('principle')+':</b> '+t('prop_'+tech);
  $('#mix0').innerHTML=t('mix_'+tech+'_0');$('#mix1').innerHTML=t('mix_'+tech+'_1');
  lastKey='';
}
function syncTabs(){
  $$('#tabs button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.t===tech?'true':'false'));
  $('#mix0').setAttribute('aria-pressed',mix===0?'true':'false');$('#mix1').setAttribute('aria-pressed',mix===1?'true':'false');
}
function syncPlayBtn(){$('#bPlay').innerHTML=playing?t('btn_pause'):t('btn_play');}
function updateUI(){
  const k=stepIdx(),n=N(),end=P>=n-1e-3;
  const key=tech+mix+'|'+k+'|'+Math.floor(P+1e-6)+'|'+end+'|'+playing;
  if(key!==lastKey){lastKey=key;
    $$('#steps li').forEach((li,i)=>{li.classList.toggle('act',i===k);li.classList.toggle('done',P>=i+1-1e-3);});
    $('#stepOut').textContent=t('step_of',k+1,n);
    const r=$('#result');r.hidden=!end;
    if(end){let h='<b>'+t('result_title')+'</b><br>'+t('res_'+tech+'_'+mix);
      if(tech==='chrom'){h+='<ul style="margin:6px 0 0;padding-left:1.2em">'+CH[mix].cs.map(c=>'<li>'+t('res_chrom_rf',t(c.k),fmt(c.d,1),fmt(c.d/DCM,2))+'</li>').join('')+'</ul>';}
      r.innerHTML=h;}
    syncPlayBtn();}
  if(!dragging)$('#tl').value=Math.round(P/n*1000);
}
function resetP(){P=target=0;playing=false;syncPlayBtn();}
function setTech(k){tech=k;mix=0;resetP();buildSteps();syncTabs();}
function setMix(i){mix=i;resetP();buildSteps();syncTabs();}
$$('#tabs button').forEach(b=>b.addEventListener('click',()=>setTech(b.dataset.t)));
$('#mix0').addEventListener('click',()=>setMix(0));
$('#mix1').addEventListener('click',()=>setMix(1));
$('#bNext').addEventListener('click',()=>{playing=false;target=Math.min(N(),Math.floor(P+1e-6)+1);if(REDUCED)P=target;syncPlayBtn();});
$('#bPrev').addEventListener('click',()=>{playing=false;target=Math.max(0,Math.ceil(P-1e-6)-1);if(REDUCED)P=target;syncPlayBtn();});
$('#bReset').addEventListener('click',resetP);
$('#bPlay').addEventListener('click',()=>{
  if(playing){playing=false;target=P;}
  else{if(P>=N()-1e-3)P=0;target=N();playing=true;if(REDUCED){P=target;playing=false;}}
  syncPlayBtn();});
const tl=$('#tl');
tl.addEventListener('input',()=>{dragging=true;playing=false;P=target=tl.value/1000*N();syncPlayBtn();});
['change','pointerup','blur'].forEach(ev=>tl.addEventListener(ev,()=>{dragging=false;}));
buildSteps();syncTabs();
loop((dt,now)=>{
  tm=REDUCED?0:now;
  if(P<target)P=Math.min(target,P+dt*SPEED);else if(P>target)P=Math.max(target,P-dt*SPEED*2);
  if(playing&&P>=N()-1e-4){playing=false;syncPlayBtn();}
  updateUI();draw();});
})();
