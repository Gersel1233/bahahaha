/* The page around the opening: the scroll, the language, the headline,
   the bar. The opening itself is in intro.js and knows nothing about any
   of this — it is told a number and draws it. */
import { createIntro } from './intro.js?v=2';

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

let intro = null;
function applyLang(l) {
  lang = l;
  html.lang = l;
  $$('[data-da]').forEach(e => { const v = e.dataset[l]; if (v != null && e.innerHTML !== v) e.innerHTML = v; });
  $$('.seg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === l)));
  if (intro) { intro.setLang(l); if (W) intro.layout(W, H); }
  heroCache();
  kick();
}
$$('.seg button').forEach(b => b.addEventListener('click', () => {
  try { localStorage.setItem('lesreg-lang', b.dataset.lang); } catch (e) {}
  applyLang(b.dataset.lang);
  html.classList.remove('mm-open');
  $('.tb-menu').setAttribute('aria-expanded', 'false');
}));

/* LA31 Nav / Mobile bar: the lens opens the menu */
$('.tb-menu').addEventListener('click', () => {
  const open = !html.classList.contains('mm-open');
  html.classList.toggle('mm-open', open);
  $('.tb-menu').setAttribute('aria-expanded', String(open));
});
addEventListener('keydown', e => { if (e.key === 'Escape') html.classList.remove('mm-open'); });

/* ---------- the opening ---------- */
const on = html.classList.contains('ix-on');
const track = $('.ix-track'), stage = $('#stage');
if (on) intro = createIntro(stage, { lang });

let heroEls = [];
function heroCache() {
  heroEls = [
    { e: $('.hero .label'), a: 0.925 },
    ...$$('.h1 .hl > span').map((e, i) => ({ e, a: 0.93 + i * 0.014, line: true })),
    ...$$('.h-row > :not(.h-rule)').map((e, i) => ({ e, a: 0.952 + i * 0.008 })),
  ];
  heroEls.forEach(h => { h.e._t = null; h.e._o = null; });
}
const heroBox = $('#hero'), rule = $('.h-rule');
function drawHero(p) {
  // the page's own content stays out of the way until the page is there
  const show = p >= 0.92 ? '1' : '0';
  if (heroBox._o !== show) { heroBox._o = show; heroBox.style.visibility = show === '1' ? 'visible' : 'hidden'; }
  const r = 'scaleX(' + Math.max(0.0001, out5(seg(p, 0.945, 0.995))).toFixed(4) + ')';
  if (rule._t !== r) { rule._t = r; rule.style.transform = r; }
  for (const h of heroEls) {
    const t = out5(seg(p, h.a, h.a + 0.04));
    const tf = h.line ? 'translate3d(0,' + ((1 - t) * 130).toFixed(1) + '%,0)' : 'translate3d(0,' + ((1 - t) * 16).toFixed(1) + 'px,0)';
    if (h.e._t !== tf) { h.e._t = tf; h.e.style.transform = tf; }
    const o = (h.line ? Math.min(1, t * 2.5) : t).toFixed(3);
    if (h.e._o !== o) { h.e._o = o; h.e.style.opacity = o; }
  }
}

let W = 0, H = 0, top0 = 0, span = 1, navBox = null;
function measure() {
  const w = stage.clientWidth, h = stage.clientHeight;
  // the address bar on a phone changes the height a little all the time;
  // only a real change of size is worth laying out again
  if (w !== W || Math.abs(h - H) > 120 || !W) { W = w; H = h; intro.layout(W, H); }
  top0 = track.getBoundingClientRect().top + scrollY;
  span = Math.max(1, track.offsetHeight - stage.clientHeight);
  navBox = $('.tb').getBoundingClientRect();
}

let cur = 0, tgt = 0, raf = 0, last = 0, t0 = null, started = false, pinned = false;
const coarse = matchMedia('(pointer: coarse)').matches;
// A wheel moves in steps, so it is eased; a finger already moves smoothly
// and anything added to it is felt as lag, so on touch it is barely eased.
const TAU = coarse ? 0.03 : 0.075;
const target = () => clamp((scrollY - top0) / span);

function draw(p, a) {
  const st = intro.render(p, a);
  drawHero(p);
  // the library: Smoke over dark, Smoke dense once the bar stands on paper
  const pg = st.page;
  const light = st.done || (pg && p >= 0.8 && pg.top <= navBox.top + 4 && pg.left <= navBox.left + 8 && pg.right >= navBox.right - 8);
  html.classList.toggle('nav-light', !!light);
  html.classList.toggle('ix-done', p > 0.92);
  stage.classList.toggle('on-paper', st.done);
}

function frame(t) {
  raf = 0;
  if (pinned) return;
  if (t0 === null) t0 = t;
  const dt = last ? Math.min(0.064, (t - last) / 1000) : 1 / 60;
  last = t;
  const a = started ? Math.min(1, (t - t0) / 2600) : 0;
  tgt = target();
  cur += (tgt - cur) * (1 - Math.exp(-dt / TAU));
  if (Math.abs(tgt - cur) < 0.00004) cur = tgt;
  draw(cur, a);
  if (cur !== tgt || a < 1) kick(); else last = 0;
}
function kick() { if (on && intro && !raf && !pinned) raf = requestAnimationFrame(frame); }

if (on) {
  applyLang(lang);
  measure();
  cur = tgt = target();
  draw(cur, 0);
  // the room fades up when the picture and the type are both there
  const pic = stage.querySelector('.ix-pic');
  const ready = Promise.all([
    document.fonts ? document.fonts.ready : null,
    pic && pic.decode ? pic.decode().catch(() => {}) : null,
  ]);
  Promise.race([ready, new Promise(r => setTimeout(r, 1800))])
    .then(() => { started = true; t0 = null; html.classList.remove('ix-start'); kick(); });
  addEventListener('scroll', kick, { passive: true });
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
  html.classList.add('nav-light');
}

// for the film and the tests: pin() stops the page's own loop so any
// frame can be held
window.__lesreg = { intro, measure, draw: (p, a = 1) => draw(p, a), pin: v => { pinned = v !== false; } };
