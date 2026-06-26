/* ============================================================
   FYON — site interactions
   ============================================================ */
(function(){
  var NS='http://www.w3.org/2000/svg';
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sleep = function(ms){ return new Promise(function(r){ setTimeout(r,ms); }); };
  function el(t,a){ var e=document.createElementNS(NS,t); for(var k in a) e.setAttribute(k,a[k]); return e; }
  function rand(a,b){ return a+Math.random()*(b-a); }

  /* ---------- nav scroll state ---------- */
  var nav=document.querySelector('.nav');
  function onScroll(){ if(nav) nav.classList.toggle('scrolled', window.scrollY>20); }
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();

  /* ---------- reveal on scroll ---------- */
  var io=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }); }, {threshold:.16});
  document.querySelectorAll('.reveal, .wd-act').forEach(function(n){ io.observe(n); });

  /* ---------- partner payout count-up ---------- */
  (function(){
    var amt=document.getElementById('ptAmt'); if(!amt) return;
    var TARGET=1840, started=false;
    function format(n){ return '$'+Math.round(n).toLocaleString('en-US')+'<span class="mo">/mo</span>'; }
    var po=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting && !started){ started=true;
      if(prefersReduced){ amt.innerHTML=format(TARGET); return; }
      var t0=performance.now(), dur=1500;
      (function tick(now){ var p=Math.min(1,(now-t0)/dur); var e2=1-Math.pow(1-p,3); amt.innerHTML=format(TARGET*e2); if(p<1) requestAnimationFrame(tick); })(t0);
    } }); },{threshold:.5});
    po.observe(amt);
  })();

  /* ---------- hero headline caret (typed feel on load) ---------- */
  // (static end-state in markup; nothing required)

  /* ============================================================
     SELF-IMPROVEMENT LOOP (globe + cycling generic advice)
     ============================================================ */
  (function buildGlobe(){
    var g=document.getElementById('siteGlobe'); if(!g) return;
    var C=330, R=300;
    g.appendChild(el('circle',{class:'outline',cx:C,cy:C,r:R}));
    [-0.66,-0.34,0,0.34,0.66].forEach(function(f){ var dy=f*R, rx=Math.sqrt(R*R-dy*dy); g.appendChild(el('ellipse',{class:f===0?'equator':'',cx:C,cy:C+dy,rx:rx,ry:rx*0.16})); });
    var rot=el('g',{class:'grot'});
    [0.95,0.7,0.42,0.14].forEach(function(f){ rot.appendChild(el('ellipse',{cx:C,cy:C,rx:R*f,ry:R})); });
    rot.appendChild(el('line',{x1:C,y1:C-R,x2:C,y2:C+R}));
    g.appendChild(rot);
    for(var i=0;i<150;i++){ var a=Math.random()*Math.PI*2, rr=Math.sqrt(Math.random())*R*0.96; g.appendChild(el('circle',{class:'dot',cx:C+Math.cos(a)*rr,cy:C+Math.sin(a)*rr*0.99,r:Math.random()*1.1+0.5})); }
  })();
  (function loopCycle(){
    var chip=document.getElementById('loopChip'), idx=document.getElementById('loopIdx'),
        title=document.getElementById('loopTitle'), desc=document.getElementById('loopDesc'),
        dotsWrap=document.getElementById('loopDots');
    if(!chip) return;
    var ITEMS=[
      { c:'United States', t:'Advice for everyone', d:'Generic guidance is true for everyone and made for no one. Fyon never talks to an abstract user — only to you, with full context.' },
      { c:'United Kingdom', t:'The same ten tips', d:'Every app hands out the same checklist worldwide. Standards differ by place and person — Fyon knows yours.' },
      { c:'Japan', t:'A score, then silence', d:'A number tells you where you rank, not how to move. Fyon turns understanding into a living, honest plan.' },
      { c:'Brazil', t:'It forgets you', d:'Close the tab and you start over. Fyon remembers — your file only gets richer every session.' },
      { c:'Germany', t:'Built for no one', d:'Mass advice averages everybody out. Fyon is calibrated to your face, your goals, your life.' }
    ];
    var TOTAL=10;
    for(var i=0;i<TOTAL;i++){ var d=document.createElement('i'); if(i===0) d.classList.add('on'); dotsWrap.appendChild(d); }
    var dots=dotsWrap.children, n=0;
    function render(it,k){
      chip.textContent=it.c; idx.textContent=String((k%TOTAL)+1).padStart(2,'0')+' / '+TOTAL;
      title.textContent=it.t; desc.textContent=it.d;
      for(var j=0;j<dots.length;j++) dots[j].classList.toggle('on', j===(k%TOTAL));
    }
    render(ITEMS[0],2); n=2; var k=2;
    if(prefersReduced) return;
    setInterval(function(){ k++; n=(n+1)%ITEMS.length; var card=document.getElementById('loopContent'); card.style.transition='opacity .4s ease'; card.style.opacity='0';
      setTimeout(function(){ render(ITEMS[n], k); card.style.opacity='1'; }, 420); }, 4200);
  })();

  /* ============================================================
     PROBLEM SECTION (animated forgetting vs compounding)
     ============================================================ */
  (function problem(){
    var chat=document.getElementById('pbChat'); if(!chat) return;
    var note=document.getElementById('pbNote'), memTag=document.getElementById('pbMemTag'),
        memDots=document.getElementById('pbMemDots'), learned=document.getElementById('pbLearned'),
        fails=document.querySelectorAll('.pb-fail');
    var QUESTION="how do i become more attractive and confident?";
    var ANSWER=["Work on grooming and posture.","Keep a consistent skincare routine.","Build confidence with small daily wins.","Stand tall in social situations.","Dress for your body type and smile more."];
    var FACTS=[{t:"evenings are when your routine slips",tab:"History"},{t:"you want to feel it, not just look it",tab:"Goals"},{t:"redness \u2192 azelaic acid 10%",tab:"Face"},{t:"social confidence is the real goal",tab:"Goals"},{t:"week 3: posture is improving",tab:"Body"},{t:"you restart your plan at 11pm",tab:"History"}];
    function setFail(k,on){ fails.forEach(function(f){ if(f.dataset.k===k) f.classList.toggle('hot',on); }); }
    function clearFails(){ fails.forEach(function(f){ f.classList.remove('hot'); }); }
    function addBubble(cls){ var b=document.createElement('div'); b.className='bubble '+cls; chat.appendChild(b); return b; }
    async function typeInto(el2,text,speed){ if(prefersReduced){ el2.textContent=text; return; } el2.innerHTML=''; var caret=document.createElement('span'); caret.className='caret'; el2.appendChild(caret); for(var i=0;i<text.length;i++){ caret.insertAdjacentText('beforebegin',text[i]); await sleep(speed);} caret.remove(); }
    async function fillProgress(inner,dur){ if(prefersReduced){ inner.style.width='100%'; return; } var steps=18; for(var i=1;i<=steps;i++){ inner.style.width=Math.round(i/steps*100)+'%'; await sleep(dur/steps);} }
    function litTab(name){ var arr=[].slice.call(document.querySelectorAll('.pb-tab')); var t=arr.filter(function(x){ return x.textContent.trim()===name; })[0]; if(t){ t.classList.add('lit'); setTimeout(function(){ t.classList.remove('lit'); },2200);} }
    function reopenFile(){ var label=document.querySelector('.pb-fileLabel'), tabs=document.querySelectorAll('.pb-tab'); if(label){ label.style.opacity=0; label.style.transform='translateY(6px)'; } tabs.forEach(function(t){ t.classList.remove('in'); }); void chat.offsetWidth; setTimeout(function(){ if(label){ label.style.opacity=1; label.style.transform='none'; } },30); tabs.forEach(function(t,i){ setTimeout(function(){ t.classList.add('in'); },70+i*55); }); }
    var session=4, dotsOn=3, factIdx=0;
    function revealRight(){ var tabs=document.querySelectorAll('.pb-tab'), points=document.querySelectorAll('.pb-point'), dots=memDots.children;
      tabs.forEach(function(t,i){ setTimeout(function(){ t.classList.add('in'); },120*i); });
      points.forEach(function(p,i){ setTimeout(function(){ p.classList.add('in'); },700+220*i); });
      for(var i=0;i<dotsOn;i++) dots[i].classList.add('on'); dots[dotsOn-1].classList.add('pulse'); }
    function growMemory(){ var dots=memDots.children; if(session<9){ session++; } memTag.textContent='Knows you \u00b7 '+session;
      if(dotsOn<dots.length){ dots[dotsOn-1].classList.remove('pulse'); dots[dotsOn].classList.add('on'); dotsOn++; dots[dotsOn-1].classList.add('pulse'); }
      var f=FACTS[factIdx%FACTS.length]; factIdx++; litTab(f.tab); learned.classList.remove('show');
      setTimeout(function(){ learned.textContent='remembered: '+f.t; learned.classList.add('show'); },220); }
    async function leftCycle(reopen){ clearFails(); chat.classList.remove('wipe'); chat.innerHTML=''; if(reopen) reopenFile();
      var att=document.createElement('div'); att.className='attach'; att.innerHTML='<div class="thumb"><span class="cam">IMG</span></div><div class="meta"><div class="fname">selfie.jpg <span class="check">\u2713</span></div><div class="bar"><i></i></div><div class="state">uploading\u2026</div></div>'; chat.appendChild(att);
      await fillProgress(att.querySelector('.bar i'),820); att.classList.add('done'); att.querySelector('.state').textContent='uploaded \u00b7 2.1 MB'; await sleep(520);
      setFail('face',true); var u=addBubble('user'); await typeInto(u,QUESTION,26); await sleep(420);
      var typing=document.createElement('div'); typing.className='typing'; typing.innerHTML='<i></i><i></i><i></i>'; chat.appendChild(typing); await sleep(820); typing.remove();
      setFail('talk',true); att.classList.add('ignored'); att.querySelector('.state').textContent="couldn't read this image";
      for(var i=0;i<ANSWER.length;i++){ var a=addBubble('ai'); a.textContent=ANSWER[i]; if(i>=2){ setFail('wall',true); var ai=chat.querySelectorAll('.bubble.ai'); if(ai[i-2]) ai[i-2].classList.add('fading'); } await sleep(600); }
      await sleep(680); setFail('forget',true); note.classList.add('show'); growMemory(); await sleep(1400);
      chat.classList.add('wipe'); await sleep(520); note.classList.remove('show'); await sleep(850); }
    var startedP=false;
    var pObs=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting && !startedP){ startedP=true; run(); } }); },{threshold:.25});
    pObs.observe(document.getElementById('pbSection'));
    async function run(){ revealRight();
      if(prefersReduced){ var att=document.createElement('div'); att.className='attach done'; att.innerHTML='<div class="thumb"><span class="cam">IMG</span></div><div class="meta"><div class="fname">selfie.jpg <span class="check">\u2713</span></div><div class="state">uploaded \u00b7 2.1 MB</div></div>'; chat.appendChild(att); var u=addBubble('user'); u.textContent=QUESTION; ANSWER.forEach(function(t){ var a=addBubble('ai'); a.textContent=t; }); note.classList.add('show'); return; }
      await sleep(500); var n=0; while(true){ await leftCycle(n>0); n++; } }
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
    var ACCENT={ q1:'#1f857a', q2:'#5e8d6e', q3:'#2f9e91', q4:'#1f857a' };
    var CORE={ x:500, y:290 };
    var CLUSTERS=[{key:'q1',cx:372,cy:200,ax:312,ay:150},{key:'q2',cx:628,cy:200,ax:688,ay:150},{key:'q3',cx:372,cy:380,ax:312,ay:430},{key:'q4',cx:628,cy:380,ax:688,ay:430}];
    var lobeGroups={};
    CLUSTERS.forEach(function(cl){ var g=el('g',{class:'lobe '+cl.key}); svg.appendChild(g); lobeGroups[cl.key]=g; var col=ACCENT[cl.key];
      g.appendChild(el('path',{class:'trunk',d:'M'+cl.cx+' '+cl.cy+' L'+cl.ax+' '+cl.ay,stroke:col}));
      var spine=el('path',{class:'trunk',d:'M'+cl.cx+' '+cl.cy+' L'+CORE.x+' '+CORE.y,stroke:col}); spine.style.animationDelay=(Math.random()*-2)+'s'; g.appendChild(spine);
      var nodes=[{x:cl.cx,y:cl.cy,r:4.5}];
      for(var i=0;i<11;i++){ var ang=rand(0,Math.PI*2), rad=rand(26,74); nodes.push({x:cl.cx+Math.cos(ang)*rad,y:cl.cy+Math.sin(ang)*rad*0.82,r:rand(1.6,3.4)}); }
      nodes.forEach(function(nn,i){ var d=nodes.map(function(m,j){ return {j:j,dist:Math.hypot(nn.x-m.x,nn.y-m.y)}; }).filter(function(o){ return o.j!==i; }).sort(function(a,b){ return a.dist-b.dist; }).slice(0,2);
        d.forEach(function(o){ if(o.j>i) g.appendChild(el('line',{class:'edge',x1:nn.x,y1:nn.y,x2:nodes[o.j].x,y2:nodes[o.j].y,stroke:col,'stroke-opacity':0.25})); }); });
      nodes.forEach(function(nn,i){ g.appendChild(el('circle',{class:'node',cx:nn.x,cy:nn.y,r:nn.r,fill:col,'fill-opacity':i===0?0.95:0.6})); }); });
    svg.appendChild(el('circle',{cx:CORE.x,cy:CORE.y,r:16,fill:'#9fd8cf','fill-opacity':0.12}));
    svg.appendChild(el('circle',{class:'node node-core',cx:CORE.x,cy:CORE.y,r:7,fill:'#bfe3db','fill-opacity':0.95}));
    var cards=[document.querySelector('.bn-card.c1'),document.querySelector('.bn-card.c2'),document.querySelector('.bn-card.c3'),document.querySelector('.bn-card.c4')];
    var order=['q1','q2','q3','q4'];
    function setActive(i){ order.forEach(function(k,j){ var g=lobeGroups[k], on=(j===i);
      g.querySelectorAll('.node').forEach(function(nn){ nn.setAttribute('fill-opacity', on?0.95:0.5); });
      g.querySelectorAll('.edge').forEach(function(e){ e.setAttribute('stroke-opacity', on?0.6:0.18); });
      g.querySelectorAll('.trunk').forEach(function(t){ t.style.opacity = on?0.95:0.32; });
      g.style.filter = on ? 'drop-shadow(0 0 6px '+ACCENT[k]+'aa)' : 'none';
      cards[j].classList.toggle('active', on); }); }
    if(!prefersReduced){
      var idx=0, timer=null, stage=document.querySelector('.bn-stage');
      setActive(0);
      // Only animate (CSS flow/corePulse via .viz-on) and cycle cards while the
      // brain is on screen — otherwise it repaints the SVG every frame off-screen.
      var bo=new IntersectionObserver(function(es){ es.forEach(function(e){
        if(e.isIntersecting){ if(stage) stage.classList.add('viz-on'); if(!timer) timer=setInterval(function(){ idx=(idx+1)%4; setActive(idx); },2400); }
        else { if(stage) stage.classList.remove('viz-on'); if(timer){ clearInterval(timer); timer=null; } }
      }); },{threshold:.12});
      if(stage) bo.observe(stage);
    }
    else { order.forEach(function(k,j){ cards[j].classList.add('active'); }); }
    // warm loop chase
    var lnodes=[].slice.call(document.querySelectorAll('#vsLoop .lnode'));
    if(!prefersReduced && lnodes.length){ var li=0; setInterval(function(){ lnodes.forEach(function(nn,j){ nn.classList.toggle('lit', j===li); }); li=(li+1)%lnodes.length; },900); }
  })();
})();
