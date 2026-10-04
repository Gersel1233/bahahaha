/* The page around the opening: the scroll, the language, the headline,
   the bar. The opening itself is in intro.js and knows nothing about any
   of this — it is told a number and draws it. */
import { createIntro } from './intro.js?v=1';

const html = document.documentElement;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const seg = (p, a, b) => clamp((p - a) / (b - a));
const out5 = t => 1 - Math.pow(1 - t, 5);

/* ---------- language ----------
   Danish for anyone whose browser asks for it, English otherwise; a
   choice made on the page sticks. */
let lang = 'da';
try {
  const saved = localStorage.getItem('lesreg-lang');
  if (saved === 'da' || saved === 'en') lang = saved;
  else lang = (navigator.languages || [navigator.language]).some(l => /^da\b/i.test(l || '')) ? 'da' : 'en';
} catch (e) {}

function applyLang(l) {
  lang = l;
  html.lang = l;
  $$('[data-da]').forEach(e => { const v = e.dataset[l]; if (v != null && e.innerHTML !== v) e.innerHTML = v; });
  $$('.lang button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === l)));
  const on = $('.lang button[data-lang="' + l + '"]'), box = $('.lang');
  if (on && box) {
    box.style.setProperty('--lx', on.offsetLeft + 'px');
    box.style.setProperty('--lw', on.offsetWidth + 'px');
  }
  if (intro) intro.setLang(l);
  heroCache();
  kick();
}
$$('.lang button').forEach(b => b.addEventListener('click', () => {
  try { localStorage.setItem('lesreg-lang', b.dataset.lang); } catch (e) {}
  applyLang(b.dataset.lang);
}));

/* ---------- the opening ---------- */
const on = html.classList.contains('ix-on');
const track = $('.ix-track'), stage = $('#stage');
let intro = null;
if (on) {
  intro = createIntro(stage, { lang });
}

let heroEls = [];
function heroCache() {
  heroEls = [
    { e: $('.h-k'), a: 0.935 },
    ...$$('.hl > span').map((e, i) => ({ e, a: 0.94 + i * 0.012, line: true })),
    { e: $('.h-p'), a: 0.962 },
    { e: $('.h-c'), a: 0.968 },
  ];
  heroEls.forEach(h => { h.e._t = null; h.e._o = null; });
}

function drawHero(p) {
  for (const h of heroEls) {
    const t = out5(seg(p, h.a, h.a + 0.045));
    const tf = h.line ? 'translate3d(0,' + ((1 - t) * 108).toFixed(1) + '%,0)' : 'translate3d(0,' + ((1 - t) * 18).toFixed(1) + 'px,0)';
    if (h.e._t !== tf) { h.e._t = tf; h.e.style.transform = tf; }
    const o = h.line ? '1' : t.toFixed(3);
    if (h.e._o !== o) { h.e._o = o; h.e.style.opacity = o; }
  }
}

let W = 0, H = 0, top0 = 0, span = 1;
let navL = { x: 0, y: 0 }, navR = { x: 0, y: 0 };
function measure() {
  const w = stage.clientWidth, h = stage.clientHeight;
  // the address bar on a phone changes the height by a little all the
  // time; only a real change of size is worth laying out again
  if (w !== W || Math.abs(h - H) > 120 || !W) {
    W = w; H = h;
    intro.layout(W, H);
  }
  top0 = track.getBoundingClientRect().top + scrollY;
  const b = $('.brand').getBoundingClientRect(), c = $('.nav-r').getBoundingClientRect();
  navL = { x: b.left + b.width * 0.5, y: b.top + b.height / 2 };
  navR = { x: c.left + c.width * 0.5, y: c.top + c.height / 2 };
  span = Math.max(1, track.offsetHeight - stage.clientHeight);
}

let cur = 0, tgt = 0, raf = 0, last = 0, t0 = null, started = false;
const coarse = matchMedia('(pointer: coarse)').matches;
// A wheel moves in steps, so it is eased; a finger already moves smoothly
// and anything added to it is felt as lag, so on touch it is barely eased.
const TAU = coarse ? 0.03 : 0.075;

function target() { return clamp((scrollY - top0) / span); }

function draw(p, a) {
  const st = intro.render(p, a);
  drawHero(p);
  // each end of the bar turns when the paper reaches it, not together
  html.classList.toggle('nav-ink-l', st.onPaper(navL.x, navL.y));
  html.classList.toggle('nav-ink', st.onPaper(navR.x, navR.y));
  html.classList.toggle('ix-done', p > 0.93);
  stage.classList.toggle('on-paper', st.done);
}

let pinned = false;
function frame(t) {
  raf = 0;
  if (pinned) return;
  if (t0 === null) t0 = t;
  const dt = last ? Math.min(0.064, (t - last) / 1000) : 1 / 60;
  last = t;
  const a = started ? Math.min(1, (t - t0) / 2300) : 0;
  tgt = target();
  cur += (tgt - cur) * (1 - Math.exp(-dt / TAU));
  if (Math.abs(tgt - cur) < 0.00004) cur = tgt;
  draw(cur, a);
  if (cur !== tgt || a < 1) kick(); else last = 0;
}
function kick() { if (on && !raf) raf = requestAnimationFrame(frame); }

function solidNav() { html.classList.toggle('nav-solid', scrollY > (on ? top0 + span + 40 : 40)); }

if (on) {
  applyLang(lang);
  measure();
  cur = tgt = target();
  draw(cur, 0);
  // the mark starts drawing when the type is there, not before
  Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise(r => setTimeout(r, 900))])
    .then(() => { started = true; t0 = null; kick(); });
  addEventListener('scroll', () => { kick(); solidNav(); }, { passive: true });
  addEventListener('resize', () => { measure(); kick(); });
  $('#skip').addEventListener('click', () => {
    scrollTo({ top: top0 + span, behavior: 'instant' });
    cur = tgt = 1; started = true; t0 = -1e9;
    draw(1, 1);
  });
  // a reload halfway down lands where it was, without replaying the way there
  if (cur > 0.02) { started = true; t0 = -1e9; }
} else {
  applyLang(lang);
  addEventListener('scroll', solidNav, { passive: true });
}
solidNav();

// expose the drawing for the film and the tests
// expose the drawing for the film and the tests; pin() stops the page's own
// loop so a test can hold any frame
window.__lesreg = { intro, measure, draw: (p, a = 1) => draw(p, a), pin: v => { pinned = v !== false; } };
