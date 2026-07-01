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
    var chat=document.getElementById('pbChat'); if(!chat) return;
    var fails=document.querySelectorAll('.pb-fail');
    var QUESTION="how do i become more attractive and confident?";
    var ANSWER=["Work on grooming and posture.","Keep a consistent skincare routine.","Build confidence with small daily wins.","Stand tall in social situations.","Dress for your body type and smile more."];
    function setFail(k,on){ fails.forEach(function(f){ if(f.dataset.k===k) f.classList.toggle('hot',on); }); }
    function clearFails(){ fails.forEach(function(f){ f.classList.remove('hot'); }); }
    function addBubble(cls){ var b=document.createElement('div'); b.className='bubble '+cls; chat.appendChild(b); return b; }
    // RIGHT card — a sequenced read: scan sweeps the tile, the presence map
    // draws itself, chips land; tabs pop; the future renders in teal.
    var card=document.querySelector('.pb-card.right');
    var FACTS=[ {tab:'History', t:'evenings are when your routine slips'},
                {tab:'Face',    t:'redness calming \u2192 azelaic acid 10%'},
                {tab:'Goals',   t:'social confidence is the real goal'},
                {tab:'Body',    t:'week 3 \u2014 posture visibly improving'} ];
    var factEl=document.getElementById('fyFact');
    var tabs=card?[].slice.call(card.querySelectorAll('.pb-tab')):[];
    function setFact(i,instant){ var f=FACTS[i%FACTS.length];
      tabs.forEach(function(t){ t.classList.toggle('lit', t.textContent.trim()===f.tab); });
      if(!factEl) return;
      if(instant||prefersReduced){ factEl.textContent=f.t; return; }
      factEl.style.opacity='0';
      setTimeout(function(){ factEl.textContent=f.t; factEl.style.opacity='1'; },320); }
    var factIdx=0, factTimer=null, revealed=false;
    // ambient life (fact cycle + node twinkle) only while the card is on screen
    if(card && !prefersReduced){
      var live=new IntersectionObserver(function(es){ es.forEach(function(e){
        if(e.isIntersecting){ card.classList.add('fy-live');
          if(revealed && !factTimer) factTimer=setInterval(function(){ factIdx++; setFact(factIdx); },5200); }
        else { card.classList.remove('fy-live'); if(factTimer){ clearInterval(factTimer); factTimer=null; } }
      }); },{threshold:.25});
      live.observe(card);
    }
    function revealRight(){ if(!card) return;
      var panels=[].slice.call(card.querySelectorAll('.fy-panel'));
      panels.forEach(function(p,i){ setTimeout(function(){ p.classList.add('in'); }, 200+i*420); });
      var tile1=card.querySelector('.fy-reads .fy-tile');
      var face1=card.querySelector('.cf.now');
      var state=card.querySelector('.fy-read-state');
      setTimeout(function(){ if(tile1) tile1.classList.add('in'); }, 420);
      [].slice.call(card.querySelectorAll('.fy-future .fy-tile')).forEach(function(t,i){ setTimeout(function(){ t.classList.add('in'); }, 1380+i*200); });
      setTimeout(function(){ if(tile1) tile1.classList.add('scanning'); }, 550);
      setTimeout(function(){ if(face1) face1.classList.add('in'); }, 800);
      setTimeout(function(){ if(state) state.textContent='presence read \u2713'; }, 2450);
      [].slice.call(card.querySelectorAll('.fy-chip')).forEach(function(c,i){ setTimeout(function(){ c.classList.add('in'); }, 1550+i*190); });
      tabs.forEach(function(t,i){ setTimeout(function(){ t.classList.add('in'); }, 880+i*95); });
      var rem=card.querySelector('.fy-remember'); setTimeout(function(){ if(rem) rem.classList.add('in'); }, 1350);
      setTimeout(function(){ setFact(0,true); }, 1450);
      [].slice.call(card.querySelectorAll('.cf.future')).forEach(function(f,i){ setTimeout(function(){ f.classList.add('in'); }, 1550+i*240); });
      var lock=card.querySelector('.fy-lock'); setTimeout(function(){ if(lock) lock.classList.add('pulse'); }, 2700);
      setTimeout(function(){ revealed=true;
        if(card.classList.contains('fy-live') && !factTimer) factTimer=setInterval(function(){ factIdx++; setFact(factIdx); },5200);
      }, 3600);
    }
    function revealRightInstant(){ if(!card) return;
      [].slice.call(card.querySelectorAll('.fy-panel, .fy-chip, .pb-tab, .fy-tile, .fy-remember, .cf')).forEach(function(n){ n.classList.add('in'); });
      var state=card.querySelector('.fy-read-state'); if(state) state.textContent='presence read \u2713';
      setFact(0,true);
    }
    // the thread visibly forgets — bubbles ghost out, a stamp remains
    function forget(){ var wipe=document.createElement('div'); wipe.className='pb-wipe';
      wipe.textContent='\u2014 new chat \u00b7 nothing remembered \u2014'; chat.appendChild(wipe);
      void wipe.offsetWidth; chat.classList.add('ghost'); }
    async function leftCycle(){ clearFails(); chat.innerHTML='';
      function put(el,d){ el.style.animationDelay=d+'ms'; chat.appendChild(el); }
      var att=document.createElement('div'); att.className='attach done ignored';
      att.innerHTML='<div class="thumb"><span class="cam">IMG</span></div><div class="meta"><div class="fname">selfie.jpg <span class="check">\u2713</span></div><div class="state">saw the image \u2014 didn\'t read your face</div></div>';
      put(att,0);
      var u=document.createElement('div'); u.className='bubble user'; u.textContent=QUESTION; put(u,140);
      ANSWER.forEach(function(t,i){ var a=document.createElement('div'); a.className='bubble ai'+(i<3?' fading':''); a.textContent=t; put(a,300+i*130); });
      setTimeout(function(){ setFail('face',true); },400);
      setTimeout(function(){ setFail('talk',true); },700);
      setTimeout(function(){ setFail('wall',true); },1000);
      setTimeout(function(){ setFail('forget',true); },1300);
      await sleep(2700); forget(); }
    var startedP=false;
    var pObs=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting && !startedP){ startedP=true; run(); } }); },{threshold:.2});
    { var pbSec=document.getElementById('why'); if(pbSec) pObs.observe(pbSec); }
    async function run(){
      if(prefersReduced){ revealRightInstant();
        var att=document.createElement('div'); att.className='attach done ignored'; att.innerHTML='<div class="thumb"><span class="cam">IMG</span></div><div class="meta"><div class="fname">selfie.jpg <span class="check">\u2713</span></div><div class="state">saw the image \u2014 didn\'t read your face</div></div>'; chat.appendChild(att);
        var u=addBubble('user'); u.textContent=QUESTION; ANSWER.forEach(function(t){ var a=addBubble('ai'); a.textContent=t; });
        forget(); return; }
      revealRight(); await sleep(500); await leftCycle(); }   // play once, then it stays
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
        if(e.isIntersecting){ if(stage) stage.classList.add('viz-on'); if(!timer) timer=setInterval(function(){ idx=(idx+1)%4; setActive(idx); },5200); }
        else { if(stage) stage.classList.remove('viz-on'); if(timer){ clearInterval(timer); timer=null; } }
      }); },{threshold:.12});
      if(stage) bo.observe(stage);
    }
    else { order.forEach(function(k,j){ cards[j].classList.add('active'); }); }
    // warm loop chase
    var lnodes=[].slice.call(document.querySelectorAll('#vsLoop .lnode'));
    if(!prefersReduced && lnodes.length){ var li=0; setInterval(function(){ lnodes.forEach(function(nn,j){ nn.classList.toggle('lit', j===li); }); li=(li+1)%lnodes.length; },900); }
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
          c.setAttribute('viewBox','255 115 490 350');
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
