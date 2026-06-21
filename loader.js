// ===== Fyon loading screen controller =====
(function(){
  var html = document.documentElement;
  var loader = document.getElementById('fyon-loader');
  if(!loader) return;
  var ring = loader.querySelector('.fl-ring-fill');
  var pct  = loader.querySelector('.fl-pct');   // optional
  var C = 2 * Math.PI * 46;            // ring circumference (r = 46)
  if(ring){ ring.style.strokeDasharray = C; ring.style.strokeDashoffset = C; }

  var p = 0, done = false, start = performance.now();
  var MIN = 1400;                      // min time on screen (no flash on fast loads)

  function set(v){ p = v;
    if(ring) ring.style.strokeDashoffset = C * (1 - v);
    if(pct)  pct.textContent = Math.round(v * 100);
  }
  // trickle toward 90% so it always feels alive
  var trickle = setInterval(function(){
    if(!done && p < 0.9) set(Math.min(0.9, p + (0.9 - p) * 0.045 + 0.004));
  }, 60);

  function finish(){
    if(done) return; done = true;
    clearInterval(trickle); set(1);
    setTimeout(function(){
      html.classList.add('fyon-loaded');        // triggers exit + reveal
      setTimeout(function(){ loader.remove(); }, 950);
    }, 400);
  }
  function ready(){ setTimeout(finish, Math.max(0, MIN - (performance.now() - start))); }

  // 1) BEST — call this yourself when your globe/3D scene is ready:
  window.fyonReady = ready;
  // 2) Fallback — full page load + fonts:
  window.addEventListener('load', function(){
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(ready);
  });
  // 3) Safety net — never hang:
  setTimeout(finish, 8000);
})();
