// ===== Fyon loading screen controller — smooth eased progress =====
// One rAF loop eases the ring toward a moving target. It glides toward ~92%
// while loading (decelerating, never frozen), and the moment the site is ready
// the target flips to 100% and it eases up — no "stuck then snap to 100%".
(function(){
  var html = document.documentElement;
  var loader = document.getElementById('fyon-loader');
  if(!loader) return;
  var ring = loader.querySelector('.fl-ring-fill');
  var pct  = loader.querySelector('.fl-pct');
  var C = 2 * Math.PI * 46;                 // ring circumference (r = 46)
  if(ring){ ring.style.strokeDasharray = C; ring.style.strokeDashoffset = C; }

  var p = 0;                 // current progress 0..1
  var target = 0.92;         // creep here until the site is ready
  var ready = false, done = false;
  var start = performance.now();
  var MIN = 850;             // minimum on-screen so it never flashes

  function draw(){
    if(ring) ring.style.strokeDashoffset = C * (1 - p);
    if(pct)  pct.textContent = Math.round(p * 100);
  }

  function loop(){
    // ease toward the target every frame; speed up the final stretch once ready
    var k = ready ? 0.10 : 0.05;
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
      html.classList.add('fyon-loaded');                 // fade loader out + reveal site
      setTimeout(function(){ if(loader && loader.parentNode) loader.remove(); }, 800);
    }, 140);
  }

  // 1) BEST — call when the heavy scene (globe) has painted its first frame
  window.fyonReady = markReady;
  // 2) Fallback — full page load (incl. iframe) + fonts ready
  window.addEventListener('load', function(){
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(markReady);
  });
  // 3) Safety net — never hang
  setTimeout(markReady, 8000);
})();
