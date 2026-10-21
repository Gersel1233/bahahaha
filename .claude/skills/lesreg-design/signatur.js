/* Lesreg signatur: the little behaviour the components need.
   - [data-open="id"] opens <dialog class="sheet" id="id">; .sheet-x, Escape
     or a click on the dim closes it; the page behind stands still.
   - .toggle flips aria-checked on click and on Space/Enter.
   - .reveal gets .in when it comes on screen.
   - .chips[role=radiogroup] keeps one chip chosen. */
(() => {
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const html = document.documentElement;

  function open(d) { if (!d || d.open) return; html.classList.add('sheet-open'); d.showModal(); d.scrollTop = 0; }
  function close(d) { if (!d || !d.open) return; d.close(); html.classList.remove('sheet-open'); }
  document.addEventListener('click', e => {
    const o = e.target.closest('[data-open]'); if (o) { open(document.getElementById(o.dataset.open)); return; }
    const x = e.target.closest('.sheet-x'); if (x) { close(x.closest('dialog')); return; }
    if (e.target.matches('dialog.sheet')) close(e.target);   // the dim around it
  });
  $$('dialog.sheet').forEach(d => d.addEventListener('close', () => html.classList.remove('sheet-open')));

  $$('.toggle').forEach(t => {
    t.setAttribute('role', 'switch'); t.tabIndex = 0;
    if (!t.hasAttribute('aria-checked')) t.setAttribute('aria-checked', 'false');
    const flip = () => t.setAttribute('aria-checked', t.getAttribute('aria-checked') === 'true' ? 'false' : 'true');
    t.addEventListener('click', flip);
    t.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); } });
  });

  $$('.chips[role="radiogroup"]').forEach(g => g.addEventListener('click', e => {
    const c = e.target.closest('.chip'); if (!c) return;
    $$('.chip', g).forEach(x => x.setAttribute('aria-checked', x === c ? 'true' : 'false'));
  }));

  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' });
  $$('.reveal').forEach(e => io.observe(e));
})();
