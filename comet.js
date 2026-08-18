/* ============================================================
   LESREG COMET v3 — cinematic + smooth.

   States: rest → launch (ripple, bezier arc, sparks) → path
   (margin rails, speed-breathing tail) → box (draws a glowing
   frame around "Start a project", head gets absorbed, frame
   breathes, jellies with scroll) → release (frame dissolves,
   head re-emerges) → dive (arcs back into the logo, ripple).

   Performance rules honoured here:
   · no getComputedStyle / classList writes inside the frame loop
   · one getBoundingClientRect on the card per frame, nothing else
   · geometry rebuilt on a 1.2 s cadence, not per frame
   · desynchronized canvas, DPR-capped, batched strokes
   ============================================================ */
(function(){
  'use strict';
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var SP={r:31,g:133,b:122}, TN={r:82,g:200,b:184};
  var DPR=Math.min(window.devicePixelRatio||1,2);

  var cv=document.createElement('canvas');
  cv.id='lgComet'; cv.setAttribute('aria-hidden','true');
  cv.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:60;';
  document.body.appendChild(cv);
  var cx=cv.getContext('2d',{desynchronized:true});

  var W=0,H=0;
  function size(){ W=window.innerWidth; H=window.innerHeight;
    DPR=Math.min(window.devicePixelRatio||1,2);
    cv.width=Math.round(W*DPR); cv.height=Math.round(H*DPR);
    cx.setTransform(DPR,0,0,DPR,0,0); }
  size();

  /* ---------- geometry (rebuilt off the hot path) ---------- */
  var gutter=40, edge=22, halo=24, headR=4.2, rails=[], crossings=[],
      fin=null, frad=34, pathTop=0, pathBot=1e9;
  function build(){
    fin=document.getElementById('finCard');
    if(fin) frad=parseFloat(getComputedStyle(fin).borderTopLeftRadius)||34;
    var sy=window.scrollY||window.pageYOffset;
    var inner=document.querySelector('#fyon .s-inner')||document.querySelector('.s-inner');
    gutter = inner ? Math.max(12, inner.getBoundingClientRect().left) : 24;
    edge = Math.min(30, Math.max(9, gutter*0.45));
    halo = gutter<40 ? 13 : 24;
    headR = gutter<40 ? 3.2 : 4.2;
    function doc(el){ if(!el) return null; var r=el.getBoundingClientRect();
      return { top:r.top+sy, bottom:r.bottom+sy }; }
    var hero=doc(document.getElementById('top')),
        fy=doc(document.getElementById('fyon')),
        ku=doc(document.getElementById('kunder')),
        co=doc(document.getElementById('contact'));
    rails=[]; crossings=[];
    if(hero) rails.push({side:'L'});
    if(fy){ rails.push({side:'R'}); crossings.push(fy.top+70); }
    if(ku){ rails.push({side:'L'}); crossings.push(ku.top+48); }
    if(co){ rails.push({side:'R'}); crossings.push(co.top+24); }
    pathTop = hero ? hero.top+110 : 110;
    pathBot = co ? co.top+40 : 1e9;
  }
  build();

  function edgeX(side){ return side==='R' ? W-edge : edge; }
  function smooth(t){ return t*t*(3-2*t); }
  function railX(fy){
    if(!rails.length) return W-edge;
    var side=rails[0].side;
    for(var i=1;i<rails.length;i++){
      var c=crossings[i-1], BAND=64;
      if(fy>=c+BAND){ side=rails[i].side; continue; }
      if(fy>c-BAND){
        var s=smooth((fy-(c-BAND))/(2*BAND));
        return edgeX(side)+(edgeX(rails[i].side)-edgeX(side))*s;
      }
      break;
    }
    return edgeX(side);
  }

  /* ---------- box perimeter ---------- */
  var boxPts=[], boxC={x:0,y:0,hh:1};
  function buildBox(rect,pad,r){
    var x=rect.left-pad, y=rect.top-pad, w=rect.width+pad*2, h=rect.height+pad*2;
    r=Math.min(r,w/2,h/2);
    var N=240, pts=new Array(N);
    var sw=w-2*r, sh=h-2*r, arc=Math.PI*r/2, L=2*sw+2*sh+4*arc;
    for(var i=0;i<N;i++){
      var d=(i/N)*L, p;
      if(d<sw){ p={x:x+r+d,y:y}; }
      else if((d-=sw)<arc){ var a=-Math.PI/2+(d/arc)*(Math.PI/2); p={x:x+w-r+Math.cos(a)*r,y:y+r+Math.sin(a)*r}; }
      else if((d-=arc)<sh){ p={x:x+w,y:y+r+d}; }
      else if((d-=sh)<arc){ var a2=(d/arc)*(Math.PI/2); p={x:x+w-r+Math.cos(a2)*r,y:y+h-r+Math.sin(a2)*r}; }
      else if((d-=arc)<sw){ p={x:x+w-r-d,y:y+h}; }
      else if((d-=sw)<arc){ var a3=Math.PI/2+(d/arc)*(Math.PI/2); p={x:x+r+Math.cos(a3)*r,y:y+h-r+Math.sin(a3)*r}; }
      else if((d-=arc)<sh){ p={x:x,y:y+h-r-d}; }
      else { var a4=Math.PI+((d-sh)/arc)*(Math.PI/2); p={x:x+r+Math.cos(a4)*r,y:y+r+Math.sin(a4)*r}; }
      pts[i]=p;
    }
    boxPts=pts; boxC={x:x+w/2,y:y+h/2,hh:h/2};
  }

  /* ---------- fx: ripples + sparks ---------- */
  var fx=[];
  function ripple(x,y,docSpace){ fx.push({k:'r',x:x,y:y,doc:!!docSpace,t:0,life:.7}); }
  function sparks(x,y,docSpace,n){
    for(var i=0;i<(n||7);i++){ var a=Math.random()*6.283, s=60+Math.random()*180;
      fx.push({k:'s',x:x,y:y,doc:!!docSpace,vx:Math.cos(a)*s,vy:Math.sin(a)*s-40,t:0,life:.5+Math.random()*.3}); }
  }
  function drawFx(dt,sy){
    for(var i=fx.length-1;i>=0;i--){ var f=fx[i]; f.t+=dt;
      var q=f.t/f.life; if(q>=1){ fx.splice(i,1); continue; }
      var yy=f.doc?f.y-sy:f.y;
      if(f.k==='r'){
        var rr=6+q*44, al=(1-q)*(1-q)*.5;
        cx.strokeStyle='rgba(52,165,150,'+al.toFixed(3)+')'; cx.lineWidth=1.6-(q*1.1);
        cx.beginPath(); cx.arc(f.x,yy,rr,0,7); cx.stroke();
      } else {
        f.x+=f.vx*dt; f.y+=f.vy*dt; f.vy+=140*dt;
        var al2=(1-q)*.8, r2=1.8*(1-q*.6);
        cx.fillStyle='rgba(82,200,184,'+al2.toFixed(3)+')';
        cx.beginPath(); cx.arc(f.x,f.doc?f.y-sy:f.y,r2,0,7); cx.fill();
      }
    }
  }

  /* ---------- state ---------- */
  var mode='rest';           // rest|launch|path|box|release|dive
  var px=0,py=0,vx=0,vy=0;   // head, document space
  var hf=0;                  // head visibility 0..1
  var trail=[], MAXT=48;
  var sv=0, lastSY=window.scrollY||0;
  var drawP=0, uStart=0, wob=0, frameA=0, breathe=0;
  var lch={t:0,dur:.9,p0:null,p1:null,p2:null,p3:null}; // launch/dive bezier
  var running=false, lastT=0, quiet=0, lastBuild=0, orbitCls=false;

  function corePos(){ var c=document.querySelector('.brand-l .orbm .c');
    if(!c) return {x:36,y:26};
    var r=c.getBoundingClientRect();
    return { x:r.left+r.width/2, y:r.top+r.height/2 }; }
  function bez(p0,p1,p2,p3,t){ var u=1-t;
    return { x:u*u*u*p0.x+3*u*u*t*p1.x+3*u*t*t*p2.x+t*t*t*p3.x,
             y:u*u*u*p0.y+3*u*u*t*p1.y+3*u*t*t*p2.y+t*t*t*p3.y }; }
  function easeOut(t){ return 1-Math.pow(1-t,3); }

  function startLaunch(sy){
    var c=corePos();
    var ex=railX(sy+H*0.44), ey=sy+H*0.44;
    lch={t:0,dur:1.0,
      p0:{x:c.x,y:c.y+sy},
      p1:{x:c.x-34,y:c.y+sy+90},
      p2:{x:ex-16,y:c.y+sy+(ey-(c.y+sy))*0.55},
      p3:{x:ex,y:ey}};
    ripple(c.x,c.y,false); sparks(c.x,c.y,false,8);
    mode='launch'; hf=0;
  }
  function startDive(sy){
    var c=corePos();
    lch={t:0,dur:.6,
      p0:{x:px,y:py},
      p1:{x:px,y:py-90},
      p2:{x:c.x+90,y:c.y+sy+70},
      p3:{x:c.x,y:c.y+sy}};
    mode='dive';
  }

  function frame(t){
    if(!lastT) lastT=t;
    var dt=Math.min(0.05,(t-lastT)/1000)||0.016; lastT=t;
    var sy=window.scrollY||window.pageYOffset;
    var instV=(sy-lastSY)/dt; lastSY=sy;
    sv += (instV-sv)*Math.min(1,dt*7);
    if(t-lastBuild>1200){ build(); lastBuild=t; }

    var frect=null, boxNow=false;
    if(fin){ frect=fin.getBoundingClientRect();
      if(frect.top<H*0.72 && frect.bottom>H*0.2) boxNow=true; }
    var wantRest = sy<24 && !boxNow;

    /* ---- state machine ---- */
    if(mode==='rest'){ if(!wantRest) startLaunch(sy); }
    else if(mode==='launch'){
      lch.t+=dt; var q=Math.min(1,lch.t/lch.dur);
      var e=easeOut(q), b=bez(lch.p0,lch.p1,lch.p2,lch.p3,e);
      var b2=bez(lch.p0,lch.p1,lch.p2,lch.p3,Math.min(1,e+0.02));
      vx=(b2.x-b.x)/ (0.02*lch.dur||.016); vy=(b2.y-b.y)/(0.02*lch.dur||.016);
      px=b.x; py=b.y;
      hf=Math.min(1,q*1.8);
      if(q>=1){ mode='path'; vx*=.25; vy*=.25; }
    }
    else if(mode==='dive'){
      if(!wantRest){ mode='path'; }
      else{
        lch.t+=dt; var q2=Math.min(1,lch.t/lch.dur);
        var e2=smooth(q2), b3=bez(lch.p0,lch.p1,lch.p2,lch.p3,e2);
        px=b3.x; py=b3.y;
        hf=1-Math.max(0,(q2-.72)/.28);
        if(q2>=1){ var c2=corePos(); ripple(c2.x,c2.y,false);
          mode='rest'; trail.length=0; hf=0; }
      }
    }
    else if(mode==='path'){
      if(wantRest){ startDive(sy); }
      else if(boxNow){
        buildBox(frect,12,frad+12);
        var best=0,bd=1e9;
        for(var i=0;i<boxPts.length;i+=3){ var qq=boxPts[i];
          var dx=qq.x-px, dy=(qq.y+sy)-py, dd=dx*dx+dy*dy;
          if(dd<bd){bd=dd;best=i;} }
        uStart=best/boxPts.length; drawP=0; frameA=1; mode='box';
      } else {
        hf+=(1-hf)*Math.min(1,dt*6);
        var fy2=Math.max(pathTop,Math.min(pathBot, sy+H*0.44));
        var tx=railX(fy2)+Math.sin(fy2*0.02)*4;
        vx+=((tx-px)*40-vx*9.5)*dt; vy+=((fy2-py)*40-vy*9.5)*dt;
        px+=vx*dt; py+=vy*dt;
      }
    }
    else if(mode==='box'){
      if(!boxNow){ // dissolve, re-emerge
        mode='release';
      } else {
        buildBox(frect,12,frad+12);
        drawP=Math.min(1,drawP+dt*1.15);           // steady, readable draw
        var dp2=smooth(drawP);
        wob += (Math.min(10,Math.abs(sv)*0.016)-wob)*Math.min(1,dt*6);
        breathe+=dt;
        if(drawP<1){
          var tip=boxPts[Math.floor(((uStart+dp2)%1)*boxPts.length)%boxPts.length];
          var k1=90,d1=13;
          vx+=((tip.x-px)*k1-vx*d1)*dt; vy+=(((tip.y+sy)-py)*k1-vy*d1)*dt;
          px+=vx*dt; py+=vy*dt;
          hf=1;
        } else {
          hf=Math.max(0,hf-dt*2.6);                // absorbed into the frame
        }
      }
    }
    else if(mode==='release'){
      frameA-=dt*2.4;
      if(hf<1){ hf=Math.min(1,hf+dt*4); }
      if(frameA<=0){ frameA=0; drawP=0; mode='path';
        sparks(px,py,true,6); }
      // head springs back toward the rail already
      var fy3=Math.max(pathTop,Math.min(pathBot, sy+H*0.44));
      var tx3=railX(fy3)+Math.sin(fy3*0.02)*4;
      vx+=((tx3-px)*30-vx*8.5)*dt; vy+=((fy3-py)*30-vy*8.5)*dt;
      px+=vx*dt; py+=vy*dt;
    }

    if(boxNow!==orbitCls && fin){ fin.classList.toggle('orbit-on',boxNow); orbitCls=boxNow; }

    /* ---- trail ---- */
    var LIFE=0.16+Math.min(0.85,Math.abs(sv)/2400)+(mode==='box'?0.08:0);
    if(hf>0.05 && mode!=='rest'){
      var lp=trail[trail.length-1];
      if(!lp || Math.abs(px-lp.x)+Math.abs(py-lp.y)>1.4) trail.push({x:px,y:py,t:t});
    }
    while(trail.length>MAXT || (trail.length&&(t-trail[0].t)/1000>LIFE)) trail.shift();

    /* ---- draw ---- */
    cx.clearRect(0,0,W,H);

    // frame around the card
    if((mode==='box'||mode==='release') && frect && (drawP>0||frameA>0) && frameA>0){
      var n=boxPts.length, count=Math.floor(smooth(drawP)*n);
      if(count>1){
        var sk=Math.max(-14,Math.min(14,sv*0.012));
        var rel=1-frameA, lift=rel*18*(sv<0?-1:1);   // dissolve drifts with scroll direction
        var glowA=(0.16+0.05*Math.sin(breathe*1.7))*frameA;
        var coreA=0.8*frameA;
        var s0=Math.floor(uStart*n);
        function P(idx){ var q=boxPts[((idx%n)+n)%n];
          var f=(q.y-boxC.y)/boxC.hh;
          return { x:q.x, y:q.y+sk*(0.5+0.5*f)+Math.sin(idx*0.35+t*0.012)*wob*0.12 - lift }; }
        for(var pass=0;pass<3;pass++){
          cx.beginPath();
          var q0=P(s0); cx.moveTo(q0.x,q0.y);
          for(var j=1;j<=count;j++){ var q1=P(s0+j); cx.lineTo(q1.x,q1.y); }
          if(pass===0){ cx.strokeStyle='rgba(52,165,150,'+(glowA*.5).toFixed(3)+')'; cx.lineWidth=16; }
          else if(pass===1){ cx.strokeStyle='rgba(52,165,150,'+glowA.toFixed(3)+')'; cx.lineWidth=7; }
          else{ cx.strokeStyle='rgba(24,120,110,'+coreA.toFixed(3)+')'; cx.lineWidth=2.2; }
          cx.lineCap='round'; cx.lineJoin='round'; cx.stroke();
        }
        // a brighter leading edge while drawing
        if(drawP<1 && count>Math.floor(n*0.05)+2){
          var tipN=Math.max(2,Math.floor(n*0.05));
          cx.beginPath();
          var qa=P(s0+count-tipN); cx.moveTo(qa.x,qa.y);
          for(var m2=count-tipN+1;m2<=count;m2++){ var qb=P(s0+m2); cx.lineTo(qb.x,qb.y); }
          cx.strokeStyle='rgba(96,214,197,'+(0.85*frameA).toFixed(3)+')'; cx.lineWidth=3; cx.stroke();
        }
      }
    }

    // tail
    var nT=trail.length;
    if(nT>1 && hf>0.02){
      for(var i2=1;i2<nT;i2++){
        var A=trail[i2-1], B=trail[i2], ay=A.y-sy, by=B.y-sy;
        if((ay<-60&&by<-60)||(ay>H+60&&by>H+60)) continue;
        var f2=i2/nT, age=1-Math.min(1,(t-B.t)/1000/LIFE);
        var al=f2*f2*age*0.55*hf; if(al<=0.012) continue;
        cx.strokeStyle='rgba('+Math.round(SP.r+(TN.r-SP.r)*f2)+','+Math.round(SP.g+(TN.g-SP.g)*f2)+','+Math.round(SP.b+(TN.b-SP.b)*f2)+','+al.toFixed(3)+')';
        cx.lineWidth=0.4+3.1*f2*age; cx.lineCap='round';
        cx.beginPath(); cx.moveTo(A.x,ay); cx.lineTo(B.x,by); cx.stroke();
      }
    }
    // head
    var hy=py-sy;
    if(hf>0.02 && hy>-60 && hy<H+60 && mode!=='rest'){
      var hR=headR*(0.4+0.6*hf), hA=hf;
      var g=cx.createRadialGradient(px,hy,0,px,hy,halo);
      g.addColorStop(0,'rgba(52,165,150,'+(0.32*hA).toFixed(3)+')');
      g.addColorStop(0.55,'rgba(52,165,150,'+(0.1*hA).toFixed(3)+')');
      g.addColorStop(1,'rgba(52,165,150,0)');
      cx.fillStyle=g; cx.beginPath(); cx.arc(px,hy,halo,0,7); cx.fill();
      cx.fillStyle='rgba(31,133,122,'+hA.toFixed(3)+')';
      cx.beginPath(); cx.arc(px,hy,hR,0,7); cx.fill();
      cx.fillStyle='rgba(234,250,246,'+(0.85*hA).toFixed(3)+')';
      cx.beginPath(); cx.arc(px-hR*0.26,hy-hR*0.3,hR*0.33,0,7); cx.fill();
    }
    drawFx(dt,sy);

    /* ---- sleep ---- */
    var busy = mode!=='rest' && (mode!=='path' || trail.length>1 || Math.abs(sv)>4) || fx.length>0;
    if(!busy) quiet+=dt; else quiet=0;
    if(quiet>2 && mode!=='box'){ running=false; lastT=0; return; }
    requestAnimationFrame(frame);
  }

  function wake(){ if(!running){ running=true; lastSY=window.scrollY||0; requestAnimationFrame(frame); } }
  window.addEventListener('scroll',wake,{passive:true});
  window.addEventListener('resize',function(){ size(); build(); wake(); },{passive:true});

  (function boot(){
    if(document.documentElement.classList.contains('fyon-loaded')){ build(); wake(); }
    else setTimeout(boot,120);
  })();
})();
