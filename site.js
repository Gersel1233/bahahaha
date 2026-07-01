/* ============================================================
   FYON — site interactions
   ============================================================ */
(function(){
  var NS='http://www.w3.org/2000/svg';
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sleep = function(ms){ return new Promise(function(r){ setTimeout(r,ms); }); };
  function el(t,a){ var e=document.createElementNS(NS,t); for(var k in a) e.setAttribute(k,a[k]); return e; }
  function rand(a,b){ return a+Math.random()*(b-a); }

  /* ---------- nav scroll state + reading progress (one rAF-throttled pass) ---------- */
  var nav=document.querySelector('.nav'), sprog=document.querySelector('#sprog i');
  var scrollQueued=false;
  function applyScroll(){ scrollQueued=false;
    var y=window.scrollY;
    if(nav) nav.classList.toggle('scrolled', y>20);
    if(sprog){ var max=document.documentElement.scrollHeight-window.innerHeight;
      sprog.style.transform='scaleX('+(max>0?Math.min(1,y/max):0)+')'; } }
  function onScroll(){ if(!scrollQueued){ scrollQueued=true; requestAnimationFrame(applyScroll); } }
  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('resize', onScroll, {passive:true});
  applyScroll();

  /* ---------- reveal on scroll ---------- */
  var io=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }); }, {threshold:.16});
  document.querySelectorAll('.reveal, .wd-act').forEach(function(n){ io.observe(n); });

  /* ============================================================
     PROBLEM SECTION (animated forgetting vs compounding)
     ============================================================ */
  (function problem(){
    // Static composition — both cards read as finished evidence, not a demo.
    var chat=document.getElementById('pbChat'); if(!chat) return;
    var QUESTION="how do i become more attractive and confident?";
    var ANSWER=["Work on grooming and posture.","Keep a consistent skincare routine.","Build confidence with small daily wins.","Stand tall in social situations.","Dress for your body type and smile more."];
    document.querySelectorAll('.pb-fail').forEach(function(f){ f.classList.add('hot'); });
    var att=document.createElement('div'); att.className='attach done ignored';
    att.innerHTML='<div class="thumb"><span class="cam">IMG</span></div><div class="meta"><div class="fname">selfie.jpg <span class="check">\u2713</span></div><div class="state">saw the image \u2014 didn\'t read your face</div></div>';
    chat.appendChild(att);
    var u=document.createElement('div'); u.className='bubble user'; u.textContent=QUESTION; chat.appendChild(u);
    ANSWER.forEach(function(t,i){ var a=document.createElement('div'); a.className='bubble ai'+(i<3?' fading':''); a.textContent=t; chat.appendChild(a); });
    var wipe=document.createElement('div'); wipe.className='pb-wipe'; wipe.textContent='\u2014 new chat \u00b7 nothing remembered \u2014'; chat.appendChild(wipe);
    chat.classList.add('ghost');
    var card=document.querySelector('.pb-card.right');
    if(card) [].slice.call(card.querySelectorAll('.fy-panel, .fy-chip, .pb-tab, .fy-tile, .fy-remember, .cf')).forEach(function(n){ n.classList.add('in'); });
  })();

  /* ============================================================
     WHAT IT DOES — "it knows you" chat types in on view
     ============================================================ */
  (function knowsYou(){
    var box=document.getElementById('kwChat'); if(!box) return;
    var LINES=[{who:'ai',t:'Last time you said evenings are when your routine slips. Want to start there?'},{who:'user',t:"yeah, that's the hard part"},{who:'ai',t:'Then we build around it — one step, tonight, that survives a long day.'}];
    var started=false;
    var o=new IntersectionObserver(function(es){ es.forEach(async function(e){ if(e.isIntersecting && !started){ started=true;
      if(prefersReduced){ LINES.forEach(function(l){ var b=document.createElement('div'); b.className='kw-b '+l.who; b.textContent=l.t; box.appendChild(b); }); return; }
      for(var i=0;i<LINES.length;i++){ await sleep(i?700:300); var b=document.createElement('div'); b.className='kw-b '+LINES[i].who; b.style.animation='rise .45s cubic-bezier(.2,.8,.2,1) both'; b.textContent=LINES[i].t; box.appendChild(b); } } }); },{threshold:.4});
    o.observe(box);
  })();

  /* ============================================================
     BRAIN — 4-lobe neural network, activation cycle
     ============================================================ */
  (function brain(){
    var svg=document.querySelector('.bn-links'); if(!svg) return;
    var ACCENT={ q1:'#1f857a', q2:'#34a596', q3:'#5e8d6e', q4:'#2f9e91' };
    var CX=500, CY=290, D2R=Math.PI/180;
    function pt(a,r){ return { x:+(CX+Math.cos(a*D2R)*r).toFixed(1), y:+(CY+Math.sin(a*D2R)*r).toFixed(1) }; }
    function arcPath(a1,a2,r){ var p1=pt(a1,r), p2=pt(a2,r);
      return 'M'+p1.x+' '+p1.y+' A'+r+' '+r+' 0 0 1 '+p2.x+' '+p2.y; }

    // core glow gradient
    var defs=el('defs',{});
    defs.innerHTML='<radialGradient id="bnGlow"><stop offset="0" stop-color="#2f9e91" stop-opacity=".36"/><stop offset="1" stop-color="#2f9e91" stop-opacity="0"/></radialGradient>';
    svg.appendChild(defs);
    // faint concentric guides — depth without noise
    [92,152,212].forEach(function(r,i){ svg.appendChild(el('circle',{cx:CX,cy:CY,r:r,fill:'none',stroke:'rgba(244,237,225,'+(0.055-i*0.014)+')','stroke-width':1})); });

    // the orbital system — four constellation arms feeding one core
    var sys=el('g',{class:'bn-sys'}); svg.appendChild(sys);
    var ARMS=[{key:'q1',a:225},{key:'q2',a:315},{key:'q3',a:135},{key:'q4',a:45}];
    var armGroups={};
    ARMS.forEach(function(A){ var col=ACCENT[A.key];
      var g=el('g',{class:'bn-arm '+A.key}); g.style.setProperty('--acol', col+'99'); sys.appendChild(g); armGroups[A.key]=g;
      g.appendChild(el('path',{class:'arc',d:arcPath(A.a-30,A.a+30,168),stroke:col,'stroke-opacity':.5,'stroke-width':1.2}));
      g.appendChild(el('path',{class:'arc',d:arcPath(A.a-17,A.a+17,124),stroke:col,'stroke-opacity':.26,'stroke-width':1}));
      var hub=pt(A.a,146);
      var nodes=[{x:hub.x,y:hub.y,r:4.4,hub:true}];
      for(var i=0;i<7;i++){ var p=pt(A.a-30+i*10+rand(-2.5,2.5), 168+rand(-7,7)); nodes.push({x:p.x,y:p.y,r:rand(1.8,3.4)}); }
      for(var j=0;j<4;j++){ var q=pt(A.a-15+j*10+rand(-3,3), 124+rand(-6,6)); nodes.push({x:q.x,y:q.y,r:rand(1.6,2.6)}); }
      for(var i=1;i<7;i++){ g.appendChild(el('line',{class:'edge',x1:nodes[i].x,y1:nodes[i].y,x2:nodes[i+1].x,y2:nodes[i+1].y,stroke:col,'stroke-opacity':.2})); }
      [2,5,8,10].forEach(function(k){ if(nodes[k]) g.appendChild(el('line',{class:'edge',x1:hub.x,y1:hub.y,x2:nodes[k].x,y2:nodes[k].y,stroke:col,'stroke-opacity':.3})); });
      nodes.forEach(function(nn){ g.appendChild(el('circle',{class:'node',cx:nn.x,cy:nn.y,r:nn.r,fill:col,'fill-opacity':nn.hub?.95:.6})); });
      // the stream — a drawn curve from the hub into the core, ridden by comets
      var end=pt(A.a+14,36), ctl=pt(A.a-12,88);
      var d='M'+hub.x+' '+hub.y+' Q'+ctl.x+' '+ctl.y+' '+end.x+' '+end.y;
      g.appendChild(el('path',{class:'stream',d:d,stroke:col,'stroke-opacity':.15,'stroke-width':1}));
      if(!prefersReduced){ for(var k=0;k<3;k++){
        var c=el('circle',{class:'comet',r:2.2,fill:col});
        c.appendChild(el('animateMotion',{dur:'4.6s',repeatCount:'indefinite',begin:(-k*1.53)+'s',path:d}));
        c.appendChild(el('animate',{attributeName:'opacity',values:'0;.95;.95;0',keyTimes:'0;.15;.8;1',dur:'4.6s',repeatCount:'indefinite',begin:(-k*1.53)+'s'}));
        g.appendChild(c); } }
    });

    // the core — halo, rotating tick ring, steady ring, bright heart
    svg.appendChild(el('circle',{class:'bn-halo',cx:CX,cy:CY,r:62,fill:'url(#bnGlow)'}));
    svg.appendChild(el('circle',{class:'bn-ringDash',cx:CX,cy:CY,r:41,fill:'none',stroke:'#2f9e91','stroke-opacity':.42,'stroke-width':1,'stroke-dasharray':'3 8'}));
    svg.appendChild(el('circle',{cx:CX,cy:CY,r:27,fill:'none',stroke:'rgba(191,227,219,.38)','stroke-width':1.2}));
    svg.appendChild(el('circle',{class:'bn-coreDot',cx:CX,cy:CY,r:10,fill:'#dff3ef'}));

    var cards=[document.querySelector('.bn-card.c1'),document.querySelector('.bn-card.c2'),document.querySelector('.bn-card.c3'),document.querySelector('.bn-card.c4')];
    function setActive(i){ ARMS.forEach(function(A,j){ var on=(j===i);
      armGroups[A.key].classList.toggle('on',on); armGroups[A.key].classList.toggle('dim',!on);
      if(cards[j]) cards[j].classList.toggle('active',on); }); }
    if(!prefersReduced){
      var idx=0, timer=null, stage=document.querySelector('.bn-stage');
      setActive(0);
      var bo=new IntersectionObserver(function(es){ es.forEach(function(e){
        if(e.isIntersecting){ if(stage) stage.classList.add('viz-on'); if(!timer) timer=setInterval(function(){ idx=(idx+1)%4; setActive(idx); },5200); }
        else { if(stage) stage.classList.remove('viz-on'); if(timer){ clearInterval(timer); timer=null; } }
      }); },{threshold:.12});
      if(stage) bo.observe(stage);
    } else { cards.forEach(function(c){ if(c) c.classList.add('active'); }); }
  })();

  /* ============================================================
     MOBILE — tap to view the brain network fullscreen
     ============================================================ */
  (function brainFullscreen(){
    var openBtn=document.getElementById('bnFsOpen'), ov=document.getElementById('bnFs'),
        closeBtn=document.getElementById('bnFsClose'), map=document.getElementById('bnFsMap');
    if(!openBtn||!ov||!map) return;
    var filled=false;
    function open(){
      if(!filled){
        var links=document.querySelector('.bn-stage .bn-links');
        if(links){ var c=links.cloneNode(true);
          // crop the viewBox to where the nodes actually are, so the network
          // fills the screen instead of floating tiny in a sea of empty margin
          c.setAttribute('viewBox','265 55 470 470');
          c.setAttribute('preserveAspectRatio','xMidYMid meet');
          map.appendChild(c); filled=true; }
      }
      ov.hidden=false; document.body.classList.add('bn-fs-open'); document.body.style.overflow='hidden';
    }
    function close(){ ov.hidden=true; document.body.classList.remove('bn-fs-open'); document.body.style.overflow=''; }
    openBtn.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    ov.addEventListener('click', function(e){ if(e.target===ov) close(); });
    document.addEventListener('keydown', function(e){ if(e.key==='Escape' && !ov.hidden) close(); });
  })();
})();
