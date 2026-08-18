/* ============================================================
   LESREG COMET — the spruce core of the logo lifts off and
   snakes between the sections as you scroll, drawing a glowing
   tail. When the "Start a project" card enters, it settles into
   orbit around the card's edge.

   One fixed <canvas> over the page (pointer-events none), drawn
   at devicePixelRatio so the glow stays crisp on retina/4K. The
   head is a critically-damped spring chasing a path anchored to
   the sections; the tail is stored in DOCUMENT space, so fast
   scrolling streaks it through the world like a real comet.
   Disabled under prefers-reduced-motion.
   ============================================================ */
(function(){
  'use strict';
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var SPRUCE={r:31,g:133,b:122}, TINT={r:82,g:200,b:184};
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

  /* ---- the path: waypoints in document space, one weave per section ---- */
  var pts=[];
  function buildPath(){
    var sy=window.scrollY||window.pageYOffset;
    pts=[];
    function at(el,f,xf){ if(!el) return;
      var r=el.getBoundingClientRect();
      pts.push({ x:W*xf, y:r.top+sy+r.height*f }); }
    var core=document.querySelector('.brand-l .orbm .c');
    if(core){ var cr=core.getBoundingClientRect();
      pts.push({ x:cr.left+cr.width/2, y:cr.top+sy+cr.height/2 }); }
    else pts.push({ x:W*0.08, y:26 });
    at(document.getElementById('top'),   0.88, 0.80);
    at(document.getElementById('fyon'),  0.30, 0.15);
    at(document.getElementById('fyon'),  0.95, 0.84);
    at(document.getElementById('kunder'),0.42, 0.11);
    at(document.getElementById('kunder'),0.94, 0.85);
    at(document.getElementById('contact'),0.06, 0.50);
    pts.sort(function(a,b){ return a.y-b.y; });
  }
  buildPath();

  function smooth(t){ return t*t*(3-2*t); }
  /* where the comet wants to be (document space) for a given scroll */
  function pathTarget(sy){
    var fy=sy+H*0.42;
    if(!pts.length) return {x:W/2,y:fy};
    var first=pts[0], last=pts[pts.length-1];
    if(fy<=first.y) return {x:first.x,y:first.y};
    if(fy>=last.y)  return {x:last.x, y:last.y};
    for(var i=0;i<pts.length-1;i++){
      var a=pts[i], b=pts[i+1];
      if(fy>=a.y && fy<=b.y){
        var s=smooth((fy-a.y)/Math.max(1,b.y-a.y));
        // a gentle sway on top of the weave keeps the line alive
        var sway=Math.sin(fy*0.0045)*W*0.018;
        return { x:a.x+(b.x-a.x)*s+sway, y:fy };
      }
    }
    return {x:last.x,y:last.y};
  }

  /* ---- orbit: the rounded-rect perimeter of the finale card ---- */
  var fin=document.getElementById('finCard');
  function perimeter(rect,pad,r,u){
    var x=rect.left-pad, y=rect.top-pad, w=rect.width+pad*2, h=rect.height+pad*2;
    r=Math.min(r,w/2,h/2);
    var sw=w-2*r, sh=h-2*r, arc=Math.PI*r/2;
    var L=2*sw+2*sh+4*arc, d=(u%1)*L;
    function ptArc(cxA,cyA,a0,t){ var a=a0+t*(Math.PI/2); return {x:cxA+Math.cos(a)*r, y:cyA+Math.sin(a)*r}; }
    if(d<sw)                return {x:x+r+d, y:y};                          d-=sw;
    if(d<arc)               return ptArc(x+w-r,y+r,-Math.PI/2,d/arc);       d-=arc;
    if(d<sh)                return {x:x+w, y:y+r+d};                        d-=sh;
    if(d<arc)               return ptArc(x+w-r,y+h-r,0,d/arc);              d-=arc;
    if(d<sw)                return {x:x+w-r-d, y:y+h};                      d-=sw;
    if(d<arc)               return ptArc(x+r,y+h-r,Math.PI/2,d/arc);        d-=arc;
    if(d<sh)                return {x:x, y:y+h-r-d};                        d-=sh;
    return ptArc(x+r,y+r,Math.PI,d/arc);
  }
  function nearestU(rect,pad,r,px,py){
    var best=0,bd=1e9;
    for(var i=0;i<64;i++){ var u=i/64, p=perimeter(rect,pad,r,u);
      var dx=p.x-px, dy=p.y-py, dd=dx*dx+dy*dy;
      if(dd<bd){ bd=dd; best=u; } }
    return best;
  }

  /* ---- state ---- */
  var px=pts[0]?pts[0].x:W/2, py=pts[0]?pts[0].y:0, vx=0, vy=0;
  var trail=[], MAXT=42, LIFE=0.85;
  var orbitU=0, inOrbit=false, lastScroll=-1, quietT=0, running=false, lastT=0;
  var lastBuild=0;

  function frame(t){
    if(!lastT) lastT=t;
    var dt=Math.min(0.05,(t-lastT)/1000); lastT=t;
    var sy=window.scrollY||window.pageYOffset;

    if(t-lastBuild>1200){ buildPath(); lastBuild=t; }

    // pick target
    var tx,ty, orbitNow=false;
    if(fin){
      var fr=fin.getBoundingClientRect();
      if(fr.top<H*0.8 && fr.bottom>H*0.15){
        orbitNow=true;
        var pad=14, rr=34;
        if(!inOrbit) orbitU=nearestU(fr,pad,rr,px-0,py-sy)+0.002;
        var per=2*(fr.width+fr.height);
        orbitU+=dt*(110/Math.max(600,per)); // ~constant px speed
        var op=perimeter(fr,pad,rr,orbitU);
        tx=op.x; ty=op.y+sy;
      }
    }
    if(!orbitNow){ var pt=pathTarget(sy); tx=pt.x; ty=pt.y; }
    if(orbitNow!==inOrbit){ inOrbit=orbitNow; if(fin) fin.classList.toggle('orbit-on',inOrbit); }

    // spring (document space)
    var k=inOrbit?60:26, damp=inOrbit?11:7.5;
    vx+=((tx-px)*k-vx*damp)*dt; vy+=((ty-py)*k-vy*damp)*dt;
    px+=vx*dt; py+=vy*dt;

    // trail (document space)
    var lp=trail[trail.length-1];
    if(!lp || Math.abs(px-lp.x)+Math.abs(py-lp.y)>1.6) trail.push({x:px,y:py,t:t});
    while(trail.length>MAXT || (trail.length && (t-trail[0].t)/1000>LIFE)) trail.shift();

    // draw
    cx.clearRect(0,0,W,H);
    var hy=py-sy;
    if(hy>-80 && hy<H+80){
      var n=trail.length;
      for(var i=1;i<n;i++){
        var A=trail[i-1], B=trail[i];
        var ay=A.y-sy, by=B.y-sy;
        if((ay<-60&&by<-60)||(ay>H+60&&by>H+60)) continue;
        var f=i/n, age=1-Math.min(1,(t-B.t)/1000/LIFE);
        var al=f*f*age*0.6;
        if(al<=0.01) continue;
        var cr2=Math.round(SPRUCE.r+(TINT.r-SPRUCE.r)*f),
            cg=Math.round(SPRUCE.g+(TINT.g-SPRUCE.g)*f),
            cb=Math.round(SPRUCE.b+(TINT.b-SPRUCE.b)*f);
        cx.strokeStyle='rgba('+cr2+','+cg+','+cb+','+al.toFixed(3)+')';
        cx.lineWidth=0.4+3.4*f*age;
        cx.lineCap='round';
        cx.beginPath(); cx.moveTo(A.x,ay); cx.lineTo(B.x,by); cx.stroke();
      }
      // halo
      var g=cx.createRadialGradient(px,hy,0,px,hy,26);
      g.addColorStop(0,'rgba(52,165,150,.34)');
      g.addColorStop(0.5,'rgba(52,165,150,.12)');
      g.addColorStop(1,'rgba(52,165,150,0)');
      cx.fillStyle=g; cx.beginPath(); cx.arc(px,hy,26,0,7); cx.fill();
      // head
      cx.fillStyle='#1f857a';
      cx.beginPath(); cx.arc(px,hy,4.2,0,7); cx.fill();
      cx.fillStyle='rgba(234,250,246,.85)';
      cx.beginPath(); cx.arc(px-1.1,hy-1.2,1.4,0,7); cx.fill();
    }

    // sleep when idle: nothing to animate, tail gone, not orbiting
    if(sy===lastScroll && !inOrbit) quietT+=dt; else quietT=0;
    lastScroll=sy;
    if(quietT>2.4 && trail.length<2){ running=false; lastT=0; return; }
    requestAnimationFrame(frame);
  }

  function wake(){ if(!running){ running=true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll',wake,{passive:true});
  window.addEventListener('resize',function(){ size(); buildPath(); wake(); },{passive:true});

  // start once the intro has released the page
  (function boot(){
    if(document.documentElement.classList.contains('fyon-loaded')){ buildPath(); wake(); }
    else setTimeout(boot,120);
  })();
})();
