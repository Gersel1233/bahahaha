/* The page around the opening: the scroll, the language, the headline,
   the bar. The opening itself is in intro.js and knows nothing about any
   of this — it is told a number and draws it. */
import { createIntro, pAt, tAt, DURATION, FILM_AT, FILM_LEN } from './intro.js?v=13';

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
    { e: $('.h-vis'), a: 0.938 },
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

let W = 0, H = 0, navBox = null;
function measure() {
  const w = stage.clientWidth, h = stage.clientHeight;
  // the address bar on a phone changes the height a little all the time;
  // only a real change of size is worth laying out again
  if (w !== W || Math.abs(h - H) > 120 || !W) { W = w; H = h; intro.layout(W, H); }
  navBox = $('.tb').getBoundingClientRect();
}

function draw(p, a) {
  const st = intro.render(p, a);
  drawHero(p);
  // the library: Smoke over dark, Smoke dense once the bar stands on paper
  const pg = st.page;
  const light = st.done || (pg && p >= 0.8 && pg.top <= navBox.top + 4 && pg.left <= navBox.left + 8 && pg.right >= navBox.right - 8);
  html.classList.toggle('nav-light', !!light);
  html.classList.toggle('ix-done', p > 0.92);
  stage.classList.toggle('on-paper', st.done);
  intro.playApps(st.wantApps);
}

/* ---------- the opening plays by itself ----------
   Nothing starts until the type and the whole film are in: the title comes
   up while they load, and the film starts only when it cannot run out.
   Then one clock drives everything; while the film runs, the clock is the
   film's own, so the words can never drift off the picture. Scrolling,
   swiping or the skip button cuts to the finished phone and lets the page
   open from there. */
const vid = intro && intro.video;
let state = 'load', clock = 0, last = 0, speed = 1, raf = 0, pinned = false, tA = null;
const FILM_END = vid ? FILM_AT + FILM_LEN : 0;

function frame(now) {
  raf = 0;
  if (pinned) return;
  if (tA === null) tA = now;
  const a = Math.min(1, (now - tA) / 2600);
  if (state === 'play') {
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    clock += dt * speed;
    // the film starts on its mark and, while it plays, it is the clock: a
    // stall holds the words too
    if (vid && speed === 1 && clock >= FILM_AT && clock < FILM_END) {
      if (vid.paused && !vid.ended && !vid._go) { vid._go = true; vid.play().catch(() => {}); }
      else if (!vid.paused && vid.readyState >= 2) {
        const vt = FILM_AT + vid.currentTime;
        if (Math.abs(vt - clock) > 0.12) clock = vt;
      }
    }
    if (clock >= DURATION) { clock = DURATION; finish(); }
  }
  last = now;
  draw(pAt(clock), a);
  if (state !== 'done' || a < 1) raf = requestAnimationFrame(frame);
}
function kick() { if (!raf && !pinned) raf = requestAnimationFrame(frame); }

function start() {
  if (state !== 'load') return;
  state = 'play';
  html.classList.remove('ix-start');
  // the title has had its time while the film loaded: start where it holds
  const shown = tA === null ? 0 : (performance.now() - tA) / 1000;
  clock = Math.min(FILM_AT - 0.4, Math.max(0, shown - 0.4));
  // the film waits on its first frame until its mark; without it (Low Power
  // Mode on an iPhone refuses to play video) the timeline still runs, and
  // the sharp still of the phone carries the end
  last = 0;
  kick();
}
function skip() {
  if (state === 'done') return;
  if (state === 'load') start();
  const cut = tAt(0.78);
  if (clock < cut) clock = cut;
  speed = 1.6;
  if (vid) vid.pause();
  kick();
}
function finish() {
  state = 'done';
  html.classList.remove('ix-playing');
  if (vid) { vid.pause(); vid.removeAttribute('src'); vid.load(); }
}

if (on) {
  applyLang(lang);
  measure();
  // a reload further down the page lands there, without the opening
  if (scrollY > 40) {
    state = 'done'; clock = DURATION; tA = -1e9;
    html.classList.remove('ix-start');
    draw(1, 1);
  } else {
    html.classList.add('ix-playing');
    draw(0, 0);
    const ready = Promise.all([document.fonts ? document.fonts.ready : null, intro.frames.ready]);
    // the title starts when the type is there; the film when it is all in
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { html.classList.remove('ix-start'); tA = null; kick(); });
    Promise.race([ready, new Promise(r => setTimeout(r, 9000))]).then(start);
    // any attempt to move on is a skip; nothing scrolls while it plays
    const leave = e => { if (state !== 'done') { if (e.cancelable) e.preventDefault(); skip(); } };
    addEventListener('wheel', leave, { passive: false });
    addEventListener('touchmove', leave, { passive: false });
    addEventListener('keydown', e => { if (['ArrowDown', 'PageDown', ' ', 'End', 'Enter'].includes(e.key)) leave(e); });
  }
  addEventListener('resize', () => { measure(); kick(); });
  $('#skip').addEventListener('click', skip);
} else {
  applyLang(lang);
  html.classList.add('nav-light');
}

// for the film and the tests: pin() stops the page's own loop so any
// frame can be held
window.__lesreg = { intro, measure, draw: (p, a = 1) => draw(p, a), pin: v => { pinned = v !== false; }, skip, get clock() { return clock; }, get state() { return state; } };
