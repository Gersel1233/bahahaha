// ===== Lesreg "Orbit" cinematic intro controller =====
// Plays the blocks→GERSEL→LESREG→Orbit-mark opening ONCE on first visit,
// then reveals the site. Repeat visits and reduced-motion skip straight in.
// The CSS owns the animation timeline; this only decides WHEN to reveal.
(function(){
  var html = document.documentElement;
  var intro = document.getElementById('lg-intro');
  if(!intro){ html.classList.add('fyon-loaded'); return; }

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var seen = false;
  try { seen = localStorage.getItem('lg_intro_seen') === '1'; } catch(e){}

  // Repeat visit or reduced-motion: no splash, reveal the site immediately.
  if(reduced || seen){
    html.classList.add('lg-instant', 'fyon-loaded');
    if(intro.parentNode) intro.remove();
    return;
  }

  var done = false;
  var SEQ = 7300;                       // full Orbit sequence length (ms)
  var start = performance.now();

  function finish(){
    if(done) return; done = true;
    try { localStorage.setItem('lg_intro_seen', '1'); } catch(e){}
    html.classList.add('fyon-loaded');                 // lift + fade splash, reveal site
    setTimeout(function(){ if(intro && intro.parentNode) intro.remove(); }, 1000);
  }

  // Reveal once the sequence has played AND fonts/DOM are settled — but never
  // wait on full window.load (it blocks on stray subresources).
  function schedule(){
    var fontsP = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    Promise.race([ fontsP, new Promise(function(r){ setTimeout(r, 1200); }) ]).then(function(){
      var wait = Math.max(0, SEQ - (performance.now() - start));
      setTimeout(finish, wait);
    });
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', schedule, { once:true });
  } else { schedule(); }
  setTimeout(finish, 10000);            // hard safety net — never hang

  // Let people skip the intro (tap / scroll / key).
  intro.addEventListener('click', finish);
  window.addEventListener('keydown', function(e){ if(e.key==='Escape'||e.key===' '||e.key==='Enter') finish(); });
  window.addEventListener('wheel', finish, { passive:true, once:true });
  window.addEventListener('touchmove', finish, { passive:true, once:true });
})();
