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

/* ---------- inside a sheet, a piece moves only while it can be seen ----------
   The live stage and the iceberg get .play while they are on screen in the
   open sheet; every endless animation in ark.css hangs on that. */
if ('IntersectionObserver' in window) {
  $$('.sheet.sx').forEach(d => {
    const io = new IntersectionObserver(es => es.forEach(en => en.target.classList.toggle('play', en.isIntersecting)), { root: d });
    $$('.sx-live, .ic', d).forEach(e => io.observe(e));
  });
}

/* ---------- the kitchen screen in "Systemer": run as the restaurant sees it ----------
   An order comes in from spiis.dk and lands under Nye; it is started and
   moves to I gang, where its time counts down; it is marked ready and moves
   to Klar, the guest is told, and the oldest one there is collected. The
   tickets really move between the columns (FLIP: measured, moved, played
   back from where they were), and the rest make room. It runs only while
   the sheet is open and the screen can be seen. */
const kds = document.querySelector('[data-kds]');
if (kds) {
  const sheet = kds.closest('dialog');
  const col = k => kds.querySelector(`[data-col="${k}"] .kds-list`);
  const toast = kds.querySelector('.kds-toast'), toastT = kds.querySelector('.kds-toast-t');
  const ORDERS = [
    ['Mørbradgryde × 3', 'Pork stew × 3', 'Kartoffelsalat × 1', 'Potato salad × 1'],
    ['Frikadeller × 2', 'Meatballs × 2', 'Rødkål × 2', 'Red cabbage × 2'],
    ['Dagens suppe × 2', 'Soup of the day × 2', 'Brød × 4', 'Bread × 4'],
    ['Stjerneskud × 1', 'Fish on bread × 1', 'Hentes ved disken', 'Collect at the counter'],
  ];
  const en = () => document.documentElement.lang === 'en';
  let no = 214, n = 0, pick = 17 * 60 + 30, timers = [], running = false;
  const at = (ms, f) => timers.push(setTimeout(f, ms));
  const hhmm = m => String(Math.floor(m / 60)).padStart(2, '0') + '.' + String(m % 60).padStart(2, '0');
  const say = html => { toastT.innerHTML = html; toast.classList.add('on'); clearTimeout(toast._t); toast._t = setTimeout(() => toast.classList.remove('on'), 2200); };
  const counts = () => $$('.kds-col', kds).forEach(c => {
    const em = c.querySelector('.kds-h em'), v = String(c.querySelectorAll('.kds-tk:not(.going)').length);
    if (em.textContent !== v) { em.textContent = v; em.classList.remove('bump'); void em.offsetWidth; em.classList.add('bump'); }
  });
  // every ticket on the board is measured before and after a change, and played back from where it was
  function flip(change) {
    const all = $$('.kds-tk', kds), first = new Map(all.map(e => [e, e.getBoundingClientRect()]));
    change();
    $$('.kds-tk', kds).forEach(e => {
      const a = first.get(e); if (!a || !e.animate) return;
      const b = e.getBoundingClientRect(), dx = a.left - b.left, dy = a.top - b.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      // the one going across is lifted over the rest while it travels
      const big = Math.abs(dx) > 20;
      e.animate([{ transform: `translate(${dx}px, ${dy}px)${big ? ' scale(1.03)' : ''}`, boxShadow: big ? '0 18px 36px rgba(14,15,16,.22)' : '' , zIndex: big ? 5 : 1 }, { transform: 'none', zIndex: big ? 5 : 1 }], { duration: big ? 750 : 500, easing: 'cubic-bezier(.65,0,.25,1)' });
    });
    counts();
  }
  const ticket = o => {
    const d = document.createElement('div');
    const [da, enT, xda, xen] = o;
    d.className = 'kds-tk st-new fresh';
    d.dataset.no = String(no).padStart(4, '0');
    const T = (a, b, tag = 'span', cls = '') => `<${tag}${cls ? ` class="${cls}"` : ''} data-da="${a}" data-en="${b}">${en() ? b : a}</${tag}>`;
    d.innerHTML = `<p class="r"><span>#${d.dataset.no}</span><b>${hhmm(pick)}</b></p>${T(da, enT, 'b', 'd')}${T(xda, xen, 'span', 'x')}<div class="kds-a">`
      + `<span class="kds-go">${T('Start tilberedning', 'Start cooking')}<i></i></span>`
      + `<span class="kds-pr"><i style="--p:0"></i><small><b>12</b> min</small><span class="kds-ok">${T('Klar', 'Ready')}</span></span>`
      + `<span class="kds-sent">${T('Gæsten har fået besked', 'The guest has been told')}</span></div>`;
    return d;
  };
  function round() {
    const tk = ticket(ORDERS[n++ % ORDERS.length]), label = '#' + tk.dataset.no;
    // 1. it comes in
    say(`<i></i>${en() ? 'New order' : 'Ny bestilling'} ${label} <small>spiis.dk</small>`);
    flip(() => col('new').appendChild(tk));
    if (tk.animate) tk.animate([{ opacity: 0, transform: 'translateY(-14px) scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 500, easing: 'cubic-bezier(.2,1.2,.3,1)' });
    at(1600, () => tk.classList.remove('fresh'));
    // 2. it is started
    at(2300, () => tk.classList.add('press'));
    at(2650, () => { tk.classList.remove('press'); flip(() => { tk.classList.replace('st-new', 'st-cook'); col('cook').appendChild(tk); }); });
    // 3. it cooks, and its time counts down
    const bar = tk.querySelector('.kds-pr > i'), min = tk.querySelector('.kds-pr small b');
    for (let k = 1; k <= 6; k++) at(2900 + k * 550, () => { bar.style.setProperty('--p', (k / 6).toFixed(3)); min.textContent = String(Math.max(0, 12 - k * 2)); });
    // 4. it is ready; the guest is told
    at(6500, () => tk.classList.add('press'));
    at(6850, () => {
      tk.classList.remove('press');
      flip(() => { tk.classList.replace('st-cook', 'st-ready'); tk.classList.add('fresh'); col('ready').prepend(tk); });
      say(`<i></i>${en() ? 'Text sent to the guest' : 'Sms sendt til gæsten'} <small>${label}</small>`);
      at(1400, () => tk.classList.remove('fresh'));
    });
    // 5. the oldest one waiting is collected
    at(9000, () => {
      const list = col('ready'), old = list.lastElementChild;
      if (list.children.length < 2 || !old) return;
      old.classList.add('going');
      const out = old.animate ? old.animate([{ opacity: 1 }, { opacity: 0, transform: 'scale(.94)' }], { duration: 350, easing: 'ease', fill: 'forwards' }) : null;
      const gone = () => flip(() => old.remove());
      out ? out.finished.then(gone).catch(gone) : gone();
    });
    no++; pick += 5;
    at(10500, round);
  }
  // a round left halfway when the sheet was closed is cleared away first
  const tidy = () => {
    $$('.kds-tk', kds).forEach(e => { e.classList.remove('press', 'fresh'); if (!e.closest('[data-col="ready"]') && !['0213', '0212'].includes(e.dataset.no)) e.remove(); });
    const ready = col('ready'); while (ready.children.length > 2) ready.lastElementChild.remove();
    $$('.going', kds).forEach(e => e.remove());
    counts();
  };
  const start = () => { if (running) return; running = true; tidy(); at(500, round); };
  const stop = () => { running = false; timers.forEach(clearTimeout); timers = []; };
  // it runs while it can be seen in the open sheet
  if (!still && 'IntersectionObserver' in window) {
    new IntersectionObserver(es => es.forEach(e => (e.isIntersecting && sheet.open ? start() : stop())), { root: sheet }).observe(kds);
    sheet.addEventListener('close', stop);
  }
}
