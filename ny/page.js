/* The page after the opening: what comes in as it is reached, and the few
   pieces that are drawn by the scroll. One loop, running only while a
   scrubbed section is on screen; each frame reads one rectangle per
   section and writes transforms and opacity, nothing that lays out. */

const html = document.documentElement;
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const seg = (p, a, b) => clamp((p - a) / (b - a));
const out = t => 1 - Math.pow(1 - t, 3);
const io = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, t) => a + (b - a) * t;
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

html.classList.add('pg-js');

function setT(e, v) { if (e._pt !== v) { e._pt = v; e.style.transform = v; } }
function setO(e, v) { const s = v.toFixed(3); if (e._po !== s) { e._po = s; e.style.opacity = s; } }

/* ---------- what comes in as it is reached ---------- */
// neighbours come in one after another
const groups = new Map();
for (const e of $$('[data-r]')) {
  const k = e.parentElement;
  const i = groups.get(k) || 0;
  groups.set(k, i + 1);
  if (i) e.style.setProperty('--d', (i * 0.08).toFixed(2) + 's');
}
if (still || !('IntersectionObserver' in window)) {
  $$('[data-r]').forEach(e => e.classList.add('in'));
} else {
  const ro = new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('in'); ro.unobserve(en.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  $$('[data-r]').forEach(e => ro.observe(e));
}

/* ---------- the recordings play only while they are seen ---------- */
const vo = 'IntersectionObserver' in window && new IntersectionObserver(es => es.forEach(en => {
  const v = en.target;
  if (en.isIntersecting) {
    if (!v._src) {
      v._src = true;
      const s = v.dataset.v;
      // webm first: Chromium on Linux cannot decode the mp4
      v.innerHTML = '<source src="' + s + '.webm" type="video/webm"><source src="' + s + '.mp4" type="video/mp4">';
      v.load();
    }
    if (!still) v.play().catch(() => {});
  } else if (!v.paused) v.pause();
}), { threshold: 0.2 });
if (vo) $$('video[data-v]').forEach(v => vo.observe(v));

/* ---------- the band: two rows that the scroll pushes, opposite ways ---------- */
const rows = $$('[data-mq]');
// each row holds its words twice, so it can run forever without a seam
rows.forEach(r => { r.innerHTML += r.innerHTML; r._w = 0; });
const measureRows = () => rows.forEach(r => { r._w = r.scrollWidth / 2; });

/* ---------- the scrubbed pieces ---------- */
let W = innerWidth, H = innerHeight, wide = W > 760;
const S = {};

// three suppliers pulled together into one house
S.three = el => {
  const cards = $$('.t-card', el), bills = cards.map(c => c.querySelector('.bill')), one = el.querySelector('.t-one');
  return () => {
    const r = el.getBoundingClientRect();
    const t = clamp(-r.top / Math.max(1, r.height - H));
    const cw = cards[0].offsetWidth, ch = cards[0].offsetHeight;
    const enter = cards.map((c, i) => out(seg(t, 0.0 + i * 0.04, 0.16 + i * 0.04)));
    const pull = io(seg(t, 0.3, 0.62));
    const fuse = out(seg(t, 0.58, 0.78));
    cards.forEach((c, i) => {
      const k = i - 1;
      const x0 = wide ? k * cw * 1.12 : 0, y0 = wide ? 0 : k * ch * 1.18;
      const rot0 = wide ? k * 5 : k * 2, rot1 = [-4, 2, 6][i];
      const x = lerp(x0, k * 10, pull), y = lerp(y0, k * 6, pull) + (1 - enter[i]) * 90;
      const sc = lerp(1, 0.9, pull) * lerp(1, 0.86, fuse);
      setT(c, 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) rotate(' + lerp(rot0, rot1, pull).toFixed(2) + 'deg) scale(' + sc.toFixed(4) + ')');
      setO(c, enter[i] * (1 - seg(t, 0.68, 0.8)));
      // the invoices are the first thing to go
      const b = io(seg(t, 0.2 + i * 0.03, 0.42 + i * 0.03));
      setT(bills[i], 'translate3d(' + (k * 40 * b).toFixed(1) + 'px,' + (-120 * b).toFixed(1) + 'px,0) rotate(' + (k * 14 * b).toFixed(1) + 'deg)');
      setO(bills[i], 1 - b);
    });
    setT(one, 'translate3d(0,' + ((1 - fuse) * 24).toFixed(1) + 'px,0) scale(' + lerp(0.62, 1, fuse).toFixed(4) + ')');
    setO(one, fuse);
    el.classList.toggle('done', t > 0.76);
  };
};

// the window and the phone of each case move at different depths
S.case = el => {
  const win = el.querySelector('[data-p="win"]'), ph = el.querySelector('[data-p="ph"]'), chip = el.querySelector('[data-p="chip"]');
  const flip = el.classList.contains('case-r') ? -1 : 1;
  return () => {
    const r = el.getBoundingClientRect();
    const q = clamp((H - r.top) / (H + r.height));
    const inn = out(seg(q, 0.05, 0.42));
    setT(win, 'translate3d(0,' + ((0.5 - q) * 70).toFixed(1) + 'px,0) scale(' + lerp(0.9, 1, inn).toFixed(4) + ')');
    setO(win, lerp(0.3, 1, inn));
    setT(ph, 'translate3d(' + ((1 - inn) * -40 * flip).toFixed(1) + 'px,' + ((0.5 - q) * 220).toFixed(1) + 'px,0) rotate(' + ((0.5 - q) * -7 * flip).toFixed(2) + 'deg)');
    setT(chip, 'translate3d(0,' + ((0.5 - q) * 320).toFixed(1) + 'px,0)');
    setO(chip, out(seg(q, 0.25, 0.45)));
  };
};

// notifications land one after another beside the phone
S.admin = el => {
  const notes = $$('.note', el), ph = el.querySelector('.dev-iph');
  return () => {
    const r = el.getBoundingClientRect();
    const q = clamp((H - r.top) / (H + r.height));
    notes.forEach((n, i) => {
      const t = out(seg(q, 0.22 + i * 0.07, 0.36 + i * 0.07));
      setT(n, 'translate3d(' + ((1 - t) * 60).toFixed(1) + 'px,' + ((1 - t) * -14).toFixed(1) + 'px,0) scale(' + lerp(0.92, 1, t).toFixed(4) + ')');
      setO(n, t);
    });
    setT(ph, 'translate3d(0,' + ((0.5 - q) * 60).toFixed(1) + 'px,0)');
  };
};

// draw it, build it, look after it: the line runs through the three
S.steps = el => {
  const line = el.querySelector('.steps-line > i'), steps = $$('.step', el);
  return () => {
    const r = el.getBoundingClientRect();
    const t = out(seg((H - r.top) / (H * 0.9), 0.35, 1));
    const vert = W <= 640;
    setT(line, (vert ? 'scaleY(' : 'scaleX(') + Math.max(0.0001, t).toFixed(4) + ')');
    steps.forEach((s, i) => s.classList.toggle('on', t >= (vert ? i / 2.4 : i / 3) + 0.02));
  };
};

// the glass of the opening, slower than the page
S.talk = el => {
  const img = el.querySelector('[data-p="talk"]');
  return () => {
    const r = el.getBoundingClientRect();
    const q = clamp((H - r.top) / (H + r.height));
    setT(img, 'translate3d(0,' + ((q - 0.5) * -90).toFixed(1) + 'px,0) scale(1.06)');
  };
};

const live = [];
for (const el of $$('[data-scrub]')) live.push({ el, draw: S[el.dataset.scrub](el), on: false });
const talk = document.querySelector('.talk');
if (talk) live.push({ el: talk, draw: S.talk(talk), on: false });
const band = document.querySelector('.band');
live.push({ el: band, on: false, draw: (() => {
  let t0 = performance.now();
  return now => {
    const drift = ((now - t0) / 1000) * 26;
    rows.forEach((r, i) => {
      if (!r._w) return;
      const dir = +r.dataset.mq;
      let x = (drift + scrollY * 0.32) * (i ? 0.7 : 1);
      x = x % r._w;
      setT(r, 'translate3d(' + (dir > 0 ? -x : x - r._w).toFixed(1) + 'px,0,0)');
    });
  };
})(), always: true });

let raf = 0;
function frame(now) {
  raf = 0;
  let any = false;
  for (const s of live) if (s.on) { s.draw(now); if (s.always) any = true; }
  if (any && !still) kick();
}
function kick() { if (!raf) raf = requestAnimationFrame(frame); }

if (still) {
  // nothing moves: every piece is drawn once, where it ends
  W = innerWidth; H = innerHeight;
  addEventListener('load', () => {
    measureRows();
    for (const s of live) if (s.el.dataset.scrub !== 'three' && s.el.dataset.scrub !== 'steps') s.draw(performance.now());
  });
  $$('.t-one').forEach(e => { e.style.opacity = '1'; e.style.transform = 'none'; });
  $$('.t-card').forEach(e => { e.style.opacity = '0'; });
  $$('.three').forEach(e => e.classList.add('done'));
  $$('.note').forEach(e => { e.style.opacity = '1'; });
  $$('.steps-line > i').forEach(e => { e.style.transform = 'none'; });
  $$('.step').forEach(e => e.classList.add('on'));
} else {
  const so = 'IntersectionObserver' in window && new IntersectionObserver(es => {
    for (const en of es) { const s = live.find(x => x.el === en.target); if (s) s.on = en.isIntersecting; }
    kick();
  }, { rootMargin: '10% 0px 10% 0px' });
  live.forEach(s => { if (so) so.observe(s.el); else s.on = true; });
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', () => { W = innerWidth; H = innerHeight; wide = W > 760; measureRows(); kick(); });
  // the words change length with the language
  $$('.seg button').forEach(b => b.addEventListener('click', () => requestAnimationFrame(() => { measureRows(); kick(); })));
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { measureRows(); kick(); });
  measureRows();
  kick();
}
