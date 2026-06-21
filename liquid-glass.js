// Makes the specular highlight follow the cursor on every .lg
document.querySelectorAll('.lg').forEach(function(btn){
  btn.addEventListener('pointermove', function(e){
    var r = btn.getBoundingClientRect();
    btn.style.setProperty('--mx', (e.clientX - r.left) / r.width  * 100 + '%');
    btn.style.setProperty('--my', (e.clientY - r.top)  / r.height * 100 + '%');
    btn.style.setProperty('--spec', '.95');           // brighten while hovering
  });
  btn.addEventListener('pointerleave', function(){
    btn.style.setProperty('--spec', '.55');
    btn.style.setProperty('--mx', '50%');
    btn.style.setProperty('--my', '-10%');
  });
});
