// ===== Lesreg "Orbit" cinematic intro controller =====
// Plays the blocks→GERSEL→LESREG→Orbit-mark opening on load, then reveals the
// site. A click / scroll / key skips it and fades in fast. Reduced-motion skips
// straight in. The CSS owns the animation timeline; this only decides WHEN to
// reveal and whether the reveal should rush (user skip) or glide (natural end).
(function(){
  var html = document.documentElement;
  var intro = document.getElementById('lg-intro');
  if(!intro){ html.classList.add('fyon-loaded'); return; }

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reduced-motion: no splash, reveal the site immediately.
  if(reduced){
    html.classList.add('lg-instant', 'fyon-loaded');
    if(intro.parentNode) intro.remove();
    return;
  }

  var done = false;
  var SEQ = 7300;                       // full Orbit sequence length (ms)
  var start = performance.now();

  // rush = user asked to skip → snap the fade; otherwise let it glide.
  function finish(rush){
    if(done) return; done = true;
    if(rush) html.classList.add('lg-rush');
    html.classList.add('fyon-loaded');                 // fade splash, reveal site
    setTimeout(function(){ if(intro && intro.parentNode) intro.remove(); }, rush ? 380 : 620);
  }

  // Reveal once the sequence has played AND fonts/DOM are settled — but never
  // wait on full window.load (it blocks on stray subresources).
  function schedule(){
    var fontsP = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    Promise.race([ fontsP, new Promise(function(r){ setTimeout(r, 1200); }) ]).then(function(){
      var wait = Math.max(0, SEQ - (performance.now() - start));
      setTimeout(function(){ finish(false); }, wait);
    });
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', schedule, { once:true });
  } else { schedule(); }
  setTimeout(function(){ finish(false); }, 10000);    // hard safety net — never hang

  // Let people skip the intro (tap / scroll / key) — these rush the fade.
  function skip(){ finish(true); }
  intro.addEventListener('click', skip);
  window.addEventListener('keydown', function(e){ if(e.key==='Escape'||e.key===' '||e.key==='Enter') skip(); });
  window.addEventListener('wheel', skip, { passive:true, once:true });
  window.addEventListener('touchmove', skip, { passive:true, once:true });
})();
