/* ============================================================
   LESREG COMET v2 — motion-graphic pass.

   · Hops out of the logo's spruce core on the first scroll.
   · Rides the page MARGINS — inside a section it hugs the left
     or right gutter (outside the content column), and it only
     crosses sides in the empty bands between sections, so it
     never runs over text or other animations.
   · The tail length breathes with scroll speed: crawl and it's
     a spark, fly and it streaks.
   · At "Start a project" it DRAWS a glowing box around the card,
     the box jellies/deforms with your scrolling, and unwinds
     back into the comet when you leave.
   · Scroll back to the top and it dives back into the logo.

   Canvas at devicePixelRatio (≤2) for retina/4K crispness.
   Sleeps when idle. Off under prefers-reduced-motion.
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
  var cx=cv.getContext('2d');

  var W=0,H=0;
  function size(){ W=window.innerWidth; H=window.innerHeight;
    DPR=Math.min(window.devicePixelRatio||1,2);
    cv.width=Math.round(W*DPR); cv.height=Math.round(H*DPR);
    cx.setTransform(DPR,0,0,DPR,0,0); }
  size();

  /* ---------- geometry: gutters + side-rails per section ---------- */
  var gutter=40, edge=22, halo=24, headR=4.2, rails=[], crossings=[], fin=null, pathTop=0, pathBot=1e9;
  function build(){
    fin=document.getElementById('finCard');
    var sy=window.scrollY||window.pageYOffset;
    var inner=document.querySelector('#fyon .s-inner')||document.querySelector('.s-inner');
    gutter = inner ? Math.max(12, inner.getBoundingClientRect().left) : 24;
    edge = Math.min(30, Math.max(9, gutter*0.45));
    halo = gutter<40 ? 12 : 24;
    headR = gutter<40 ? 3.2 : 4.2;
    function doc(el){ if(!el) return null; var r=el.getBoundingClientRect();
      return { top:r.top+sy, bottom:r.bottom+sy }; }
    var hero=doc(document.getElementById('top')),
        fy=doc(document.getElementById('fyon')),
        ku=doc(document.getElementById('kunder')),
        co=doc(document.getElementById('contact'));
    rails=[]; crossings=[];
    if(hero) rails.push({from:hero.top,side:'R'});
    if(fy){ rails.push({from:fy.top,side:'L'}); crossings.push(fy.top+70); }
    if(ku){ rails.push({from:ku.top,side:'R'}); crossings.push(ku.top+48); }
    if(co){ rails.push({from:co.top,side:'R'}); crossings.push(co.top+24); }
    pathTop = hero ? hero.top+110 : 110;
    pathBot = co ? co.top+40 : 1e9;
  }
  build();

  function edgeX(side){ return side==='R' ? W-edge : edge; }
  function smooth(t){ return t*t*(3-2*t); }
  /* x for a given doc-y: hug the section's rail, blend sides across the
     empty boundary bands only */
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

  /* ---------- box (finale) ---------- */
  var boxPts=[], boxLen=0;
  function buildBox(rect,pad,r){
    var x=rect.left-pad, y=rect.top-pad, w=rect.width+pad*2, h=rect.height+pad*2;
    r=Math.min(r,w/2,h/2);
    var pts=[], N=240;
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
      pts.push(p);
    }
    boxPts=pts; boxLen=L;
    return {cx:x+w/2, cy:y+h/2, hh:h/2};
  }

  /* ---------- state ---------- */
  var px=0, py=0, vx=0, vy=0, born=false, mode='rest';
  var trail=[], MAXT=48;
  var sv=0, lastSY=window.scrollY||0;           // smoothed scroll velocity
  var drawP=0, drawV=0, uStart=0, uHead=0, wob=0; // box state
  var running=false, lastT=0, quiet=0, lastBuild=0;

  function corePos(){ var c=document.querySelector('.brand-l .orbm .c');
    if(!c) return {x:36,y:26};
    var r=c.getBoundingClientRect();
    return { x:r.left+r.width/2, y:r.top+r.height/2 }; }

  function frame(t){
    if(!lastT) lastT=t;
    var dt=Math.min(0.05,(t-lastT)/1000)||0.016; lastT=t;
    var sy=window.scrollY||window.pageYOffset;

    var instV=(sy-lastSY)/dt; lastSY=sy;
    sv += (instV-sv)*Math.min(1,dt*7);

    if(t-lastBuild>1200){ build(); lastBuild=t; }

    /* ---- mode decide ---- */
    var boxNow=false, frect=null;
    var frad=30;
    if(fin){ frect=fin.getBoundingClientRect();
      frad=parseFloat(getComputedStyle(fin).borderTopLeftRadius)||30;
      if(frect.top<H*0.72 && frect.bottom>H*0.2) boxNow=true; }
    var wantRest = sy<24 && !boxNow;

    if(!born){
      var c0=corePos(); px=c0.x; py=c0.y+sy;
      if(!wantRest){ born=true; vx=90; vy=420; }   // the hop
    } else if(wantRest){
      // dive back into the logo
      var c1=corePos(); var tx0=c1.x, ty0=c1.y+sy;
      vx+=((tx0-px)*70-vx*10)*dt; vy+=((ty0-py)*70-vy*10)*dt;
      px+=vx*dt; py+=vy*dt;
      if(Math.abs(px-tx0)+Math.abs(py-ty0)<10){ born=false; trail.length=0; }
      mode='return';
    }
    if(fin) fin.classList.toggle('orbit-on', boxNow);

    /* ---- targets ---- */
    if(born && !wantRest){
      if(boxNow){
        var geo=buildBox(frect,12,frad+12);
        if(mode!=='box'){ // find nearest point to enter
          var best=0,bd=1e9;
          for(var i=0;i<boxPts.length;i++){ var q=boxPts[i];
            var dx=q.x-px, dy=(q.y+sy)-py, dd=dx*dx+dy*dy;
            if(dd<bd){bd=dd;best=i;} }
          uStart=best/boxPts.length; uHead=uStart;
          mode='box';
        }
        // draw progress spring toward 1
        drawV+=((1-drawP)*13-drawV*6)*dt; drawP=Math.min(1,drawP+drawV*dt);
        if(drawP>0.992) drawP=1;
        uHead+=dt*0.06;                          // slow shimmer orbit when complete
        wob += (Math.min(14,Math.abs(sv)*0.02)-wob)*Math.min(1,dt*6);
        // head rides the drawing tip
        var tipU=(uStart+drawP)%1;
        var tip=boxPts[Math.floor(tipU*boxPts.length)%boxPts.length];
        var k1=drawP<1?55:30, d1=drawP<1?10:9;
        vx+=((tip.x-px)*k1-vx*d1)*dt; vy+=(((tip.y+sy)-py)*k1-vy*d1)*dt;
        px+=vx*dt; py+=vy*dt;
      } else {
        if(mode==='box'){ // unwind on the way out
          drawV=0; drawP=Math.max(0,drawP-dt*2.4);
          if(drawP<=0) mode='path';
        } else mode='path';
        var fy2=Math.max(pathTop,Math.min(pathBot, sy+H*0.44));
        var tx=railX(fy2)+Math.sin(fy2*0.02)*4;
        vx+=((tx-px)*26-vx*7.5)*dt; vy+=((fy2-py)*26-vy*7.5)*dt;
        px+=vx*dt; py+=vy*dt;
      }
    }

    /* ---- trail: length breathes with scroll speed ---- */
    var LIFE=0.16+Math.min(0.85,Math.abs(sv)/2400)+(mode==='box'?0.1:0);
    if(born && !wantRest){
      var lp=trail[trail.length-1];
      if(!lp || Math.abs(px-lp.x)+Math.abs(py-lp.y)>1.4) trail.push({x:px,y:py,t:t});
    }
    while(trail.length>MAXT || (trail.length&&(t-trail[0].t)/1000>LIFE)) trail.shift();

    /* ---- draw ---- */
    cx.clearRect(0,0,W,H);
    var hy=py-sy;

    // the box (finale)
    if((mode==='box'||drawP>0) && frect){
      var geo2=buildBox(frect,12,frad+12);
      var n=boxPts.length, count=Math.floor(drawP*n);
      if(count>1){
        var sk=Math.max(-16,Math.min(16,sv*0.014));       // jelly shear from scroll
        function dp(i){ var q=boxPts[i%n];
          var f=(q.y-geo2.cy)/geo2.hh;                    // -1 top .. 1 bottom
          return { x:q.x, y:q.y+sk*(0.5+0.5*f)+Math.sin(i*0.44+t*0.012)*wob*0.14 }; }
        for(var pass=0;pass<3;pass++){                     // bloom + glow + core
          cx.beginPath();
          var s0=Math.floor(uStart*n);
          var q0=dp(s0); cx.moveTo(q0.x,q0.y);
          for(var j=1;j<=count;j++){ var q=dp(s0+j); cx.lineTo(q.x,q.y); }
          if(pass===0){ cx.strokeStyle='rgba(52,165,150,.08)'; cx.lineWidth=16; }
          else if(pass===1){ cx.strokeStyle='rgba(52,165,150,.2)'; cx.lineWidth=7; }
          else{ cx.strokeStyle='rgba(24,120,110,.85)'; cx.lineWidth=2.2; }
          cx.lineCap='round'; cx.lineJoin='round'; cx.stroke();
        }
        if(drawP>=1){ // a bright pulse circulating the frame
          var pl=Math.floor(n*0.12), s1=Math.floor(uHead*n);
          cx.beginPath();
          var qq=dp(s1); cx.moveTo(qq.x,qq.y);
          for(var m=1;m<=pl;m++){ var q2=dp(s1+m); cx.lineTo(q2.x,q2.y); }
          cx.strokeStyle='rgba(96,214,197,.9)'; cx.lineWidth=3; cx.stroke();
        }
      }
    }

    // tail + head
    if(born && !wantRest || mode==='return'){
      var nT=trail.length;
      for(var i2=1;i2<nT;i2++){
        var A=trail[i2-1], B=trail[i2], ay=A.y-sy, by=B.y-sy;
        if((ay<-60&&by<-60)||(ay>H+60&&by>H+60)) continue;
        var f2=i2/nT, age=1-Math.min(1,(t-B.t)/1000/LIFE);
        var al=f2*f2*age*0.6; if(al<=0.012) continue;
        cx.strokeStyle='rgba('+Math.round(SP.r+(TN.r-SP.r)*f2)+','+Math.round(SP.g+(TN.g-SP.g)*f2)+','+Math.round(SP.b+(TN.b-SP.b)*f2)+','+al.toFixed(3)+')';
        cx.lineWidth=0.4+3.2*f2*age; cx.lineCap='round';
        cx.beginPath(); cx.moveTo(A.x,ay); cx.lineTo(B.x,by); cx.stroke();
      }
      if(hy>-60&&hy<H+60&&born){
        var g=cx.createRadialGradient(px,hy,0,px,hy,halo);
        g.addColorStop(0,'rgba(52,165,150,.32)');
        g.addColorStop(0.55,'rgba(52,165,150,.1)');
        g.addColorStop(1,'rgba(52,165,150,0)');
        cx.fillStyle=g; cx.beginPath(); cx.arc(px,hy,halo,0,7); cx.fill();
        cx.fillStyle='#1f857a'; cx.beginPath(); cx.arc(px,hy,headR,0,7); cx.fill();
        cx.fillStyle='rgba(234,250,246,.85)';
        cx.beginPath(); cx.arc(px-headR*0.26,hy-headR*0.3,headR*0.33,0,7); cx.fill();
      }
    }

    /* ---- sleep when nothing moves ---- */
    var busy = mode==='box' || drawP>0 || trail.length>1 || Math.abs(sv)>4 || mode==='return';
    if(!busy) quiet+=dt; else quiet=0;
    if(quiet>2){ running=false; lastT=0; return; }
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
