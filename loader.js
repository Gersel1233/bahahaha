// ===== Fyon loading screen controller — smooth eased progress =====
// One rAF loop eases a 0..1 value toward a moving target and writes it to the
// progress bar (--p). It glides toward ~92% while loading (decelerating, never
// frozen); the moment the site is ready the target flips to 100% and it eases
// up — no "stuck then snap to 100%". Then it fades/lifts away.
(function(){
  var html = document.documentElement;
  var loader = document.getElementById('fyon-loader');
  if(!loader) return;
  var pct = loader.querySelector('.fl-pct');

  var p = 0;                 // current progress 0..1
  var target = 0.92;         // creep here until the site is ready
  var ready = false, done = false;
  var start = performance.now();
  var MIN = 850;             // minimum on-screen so it never flashes

  function draw(){
    loader.style.setProperty('--p', p.toFixed(4));
    if(pct) pct.textContent = Math.round(p * 100) + '%';
  }

  function loop(){
    var k = ready ? 0.09 : 0.05;          // ease faster on the final stretch
    p += (target - p) * k;
    if(ready && p > 0.997){ p = 1; draw(); finish(); return; }
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  function markReady(){
    if(ready) return;
    var wait = Math.max(0, MIN - (performance.now() - start));
    setTimeout(function(){ ready = true; target = 1; }, wait);
  }

  function finish(){
    if(done) return; done = true;
    setTimeout(function(){
      html.classList.add('fyon-loaded');                 // fade/lift loader out + reveal site
      setTimeout(function(){ if(loader && loader.parentNode) loader.remove(); }, 900);
    }, 160);
  }

  // 1) BEST — globe paints its first frame -> window.fyonReady()
  window.fyonReady = markReady;
  // 2) Fallback — full load (incl. iframe) + fonts ready
  window.addEventListener('load', function(){
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(markReady);
  });
  // 3) Safety net — never hang
  setTimeout(markReady, 8000);
})();
