/* The long version of each tile in "Hvad vi bygger": the plus on a tile
   opens its sheet. A real <dialog>, so the browser keeps the focus inside it
   and Escape closes it; the page behind stands still while it is open. On a
   phone it rises from the bottom, on a large screen it comes up in the
   middle; it goes the way it came. */
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const lang = () => (document.documentElement.lang === 'en' ? 'en' : 'da');
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
let opener = null;

// the labels a reader never sees but a screen reader says, in the page's language
function words() {
  const l = lang();
  $$('[data-aria-da]').forEach(b => b.setAttribute('aria-label', b.dataset['aria' + (l === 'en' ? 'En' : 'Da')]));
  $$('.sheet [data-close]').forEach(b => b.setAttribute('aria-label', l === 'en' ? 'Close' : 'Luk'));
}

function open(d, from) {
  if (!d || d.open) return;
  opener = from || null;
  words();
  document.documentElement.classList.add('sheet-open');
  d.classList.remove('going');
  d.showModal();
  d.scrollTop = 0;
  // the sheet itself takes the focus, so no ring sits on its close until the keyboard asks for one
  const inner = d.querySelector('.sh-in[tabindex]'); if (inner) inner.focus({ preventScroll: true });
}

function close(d) {
  if (!d || !d.open || d.classList.contains('going')) return;
  const done = () => {
    d.classList.remove('going'); d.close();
    document.documentElement.classList.remove('sheet-open');
    if (opener) opener.focus({ preventScroll: true });
  };
  if (still) return done();
  d.classList.add('going');
  setTimeout(done, 260);
}

$$('.tile-more').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); open(document.getElementById(b.dataset.sheet), b); }));
// the same sheets, from the links at the foot of the page
$$('[data-open-sheet]').forEach(b => b.addEventListener('click', () => open(document.getElementById(b.dataset.openSheet), b)));
$$('.sheet').forEach(d => {
  d.addEventListener('click', e => {
    // a tap on the dim around the sheet closes it
    if (e.target === d) close(d);
    if (e.target.closest('[data-close]')) close(d);
  });
  // Escape: let it go the same way as a tap
  d.addEventListener('cancel', e => { e.preventDefault(); close(d); });
});
words();
new MutationObserver(words).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
