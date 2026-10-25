/* ===== utilitats comunes de les animacions de Tecnologia (depén de common.js) ===== */
const TEC={
  /* bucle d'animació: fn(dt en segons) */
  loop(fn){let last=performance.now();const f=now=>{const dt=Math.min(.05,(now-last)/1000);last=now;fn(dt);requestAnimationFrame(f);};requestAnimationFrame(f);},
  /* canvas lògic W×H que es torna a dibuixar quan canvia la mida o el tema */
  cv(sel,W,H,draw){let o=null;o=makeCanvas($(sel),W,H,()=>{if(o)draw(o);});document.addEventListener('themechange',()=>draw(o));draw(o);return o;},
  txt(c,s,x,y,o){o=o||{};c.font=o.font||'13px system-ui';c.fillStyle=o.col||C().ink;c.textAlign=o.al||'center';c.textBaseline=o.bl||'middle';c.fillText(s,x,y);},
  line(c,pts,col,w,dash){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.strokeStyle=col;c.lineWidth=w||2;c.setLineDash(dash||[]);c.lineJoin='round';c.lineCap='round';c.stroke();c.setLineDash([]);},
  arrow(c,x1,y1,x2,y2,col,w){
    const a=Math.atan2(y2-y1,x2-x1),h=Math.max(7,(w||2)*3.4);
    c.beginPath();c.moveTo(x1,y1);c.lineTo(x2-Math.cos(a)*h*.6,y2-Math.sin(a)*h*.6);c.strokeStyle=col;c.lineWidth=w||2;c.lineCap='round';c.stroke();
    c.beginPath();c.moveTo(x2,y2);c.lineTo(x2-h*Math.cos(a-.42),y2-h*Math.sin(a-.42));c.lineTo(x2-h*Math.cos(a+.42),y2-h*Math.sin(a+.42));c.closePath();c.fillStyle=col;c.fill();
  },
  /* roda dentada de mòdul m (px per dent): z dents, angle ang; la dent 0 apunta cap a ang */
  gear(c,cx,cy,z,m,ang,col,markAng,alpha){
    const R=m*z/2,Ra=R+m*0.9,Rf=R-m*1.1,hp=Math.PI/z,P=(r,t)=>[cx+r*Math.cos(t),cy+r*Math.sin(t)];
    c.beginPath();
    for(let k=0;k<z;k++){
      const a=ang+k*2*hp;
      [P(Rf,a-hp),P(Rf,a-0.6*hp),P(Ra,a-0.32*hp),P(Ra,a+0.32*hp),P(Rf,a+0.6*hp)].forEach((p,i)=>k===0&&i===0?c.moveTo(p[0],p[1]):c.lineTo(p[0],p[1]));
    }
    c.closePath();
    c.fillStyle=C().panel;c.fill();
    c.globalAlpha=alpha||.2;c.fillStyle=col;c.fill();c.globalAlpha=1;
    c.strokeStyle=col;c.lineWidth=2;c.setLineDash([]);c.stroke();
    c.beginPath();c.arc(cx,cy,Math.max(4,m*0.55),0,TAU);c.fillStyle=col;c.fill();
    if(markAng!==undefined){
      const mx=cx+(R-m*0.3)*Math.cos(markAng),my=cy+(R-m*0.3)*Math.sin(markAng);
      c.beginPath();c.moveTo(cx,cy);c.lineTo(mx,my);c.strokeStyle=col;c.lineWidth=3;c.lineCap='round';c.stroke();
      c.beginPath();c.arc(mx,my,Math.max(4,m*0.4),0,TAU);c.fillStyle=col;c.fill();c.lineWidth=2;c.strokeStyle=C().panel;c.stroke();
    }
  },
  /* arrossegar sobre un canvas amb ratolí o dit: h={down(p)->bool, move(p), up()} */
  drag(o,h){
    let on=false;
    o.cv.addEventListener('pointerdown',e=>{const p=o.pt(e);if(h.down(p,e)){on=true;o.cv.setPointerCapture(e.pointerId);e.preventDefault();}});
    o.cv.addEventListener('pointermove',e=>{const p=o.pt(e);if(on)h.move(p,e);else if(h.hover)h.hover(p,e);});
    const end=e=>{if(on){on=false;h.up&&h.up(e);}};
    o.cv.addEventListener('pointerup',end);o.cv.addEventListener('pointercancel',end);
  },
  /* prefix SI per a resistències i corrents: 4700 -> "4,7 kΩ" */
  si(v,u){
    if(!isFinite(v))return '∞ '+u;
    const a=Math.abs(v);let k=0,p=['','k','M','G'],pm=['','m','µ'];
    if(a>=1000){while(Math.abs(v)>=1000&&k<3){v/=1000;k++;}return fmt(+v.toPrecision(3),2).replace(/,?0+$/,'').replace(/,$/,'')+' '+p[k]+u;}
    if(a<1&&a>0){while(Math.abs(v)<1&&k<2){v*=1000;k++;}return fmt(+v.toPrecision(3),2).replace(/,?0+$/,'').replace(/,$/,'')+' '+pm[k]+u;}
    return fmt(+v.toPrecision(3),2).replace(/,?0+$/,'').replace(/,$/,'')+' '+u;
  },
  /* converteix text com "4,7k", "470", "2M2" en nombre */
  parse(s){
    s=String(s).trim().toLowerCase().replace(/\s/g,'').replace('ω','').replace('ohm','').replace('Ω','');
    let m=s.match(/^(\d+)([kmr])(\d+)$/);
    if(m){const mul={k:1e3,m:1e6,r:1}[m[2]];return parseFloat(m[1]+'.'+m[3])*mul;}
    m=s.match(/^([\d.,]+)([km]?)$/);
    if(!m)return NaN;
    return parseFloat(m[1].replace(',','.'))*({'':1,k:1e3,m:1e6}[m[2]]);
  },
  seg(host,opts,cur,on){/* grup de botons exclusius; opts=[{v,key}] */
    host.innerHTML='';const bs=opts.map(o=>{const b=document.createElement('button');b.type='button';b.dataset.v=o.v;b.setAttribute('data-i18n',o.key);b.textContent=t(o.key);b.setAttribute('aria-pressed',String(o.v===cur));
      b.onclick=()=>{bs.forEach(x=>x.setAttribute('aria-pressed',String(x===b)));on(o.v);};host.appendChild(b);return b;});
    return bs;
  }
};
