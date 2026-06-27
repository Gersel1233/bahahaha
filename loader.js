// ===== Fyon cinematic intro controller =====
// Plays the "Lesreg introduces · Fyon" opening, then reveals the site.
// The CSS owns the animation timeline; this just decides WHEN to reveal
// (after the sequence + fonts/DOM ready) and lets the user skip.
(function(){
  var html = document.documentElement;
  var intro = document.getElementById('fyon-intro');
  if(!intro) return;

  var done = false;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SEQ = reduced ? 700 : 3900;     // full cinematic length (ms)
  var start = performance.now();

  function finish(){
    if(done) return; done = true;
    html.classList.add('fyon-loaded');                 // fade/lift intro out + reveal site
    setTimeout(function(){ if(intro && intro.parentNode) intro.remove(); }, 1000);
  }

  // Reveal only once the sequence has played AND fonts/DOM are settled — but
  // never wait on full window.load (it blocks on stray subresources).
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
  setTimeout(finish, 7000);            // hard safety net — never hang

  // Let people skip the intro (tap / scroll / key).
  intro.addEventListener('click', finish);
  window.addEventListener('keydown', function(e){ if(e.key==='Escape'||e.key===' '||e.key==='Enter') finish(); });
  window.addEventListener('wheel', finish, { passive:true, once:true });
  window.addEventListener('touchmove', finish, { passive:true, once:true });
})();
