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

function setT(e, v) { if (e && e._pt !== v) { e._pt = v; e.style.transform = v; } }
function setO(e, v) { if (!e) return; const s = v.toFixed(3); if (e._po !== s) { e._po = s; e.style.opacity = s; } }

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

/* ---------- the films never flash ----------
   A phone shows black for a moment whenever a video is fetched or sent back
   to its start. So each film's first picture lies under it, the video is
   only shown once a frame of it has been drawn, and its source is set once. */
const h264ok = document.createElement('video').canPlayType('video/mp4; codecs="avc1.640028"') !== '';
const srcOf = v => v.dataset.v + (h264ok ? '.mp4' : '.webm');
function under(v) { if (v.poster && v.parentNode && !v.parentNode.style.backgroundImage) v.parentNode.style.backgroundImage = 'url("' + v.poster + '")'; }
function show(v) {
  const on = () => { v.style.opacity = '1'; };
  if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(on);
  else v.addEventListener('timeupdate', on, { once: true });
}
function fromStart(v) {
  // hidden while it goes back, over its own first picture, so nothing flashes
  if (v.currentTime > 0.01) { v.style.opacity = '0'; try { v.currentTime = 0; } catch (e) {} }
  const p = v.play(); if (p) p.then(() => show(v)).catch(() => {}); else show(v);
}

/* ---------- the recordings play only while they are seen ---------- */
const vo = 'IntersectionObserver' in window && new IntersectionObserver(es => es.forEach(en => {
  const v = en.target;
  if (en.isIntersecting) {
    if (!v._src) { v._src = true; v.src = srcOf(v); }
    if (!still) { const p = v.play(); if (p) p.then(() => show(v)).catch(() => {}); }
  } else if (!v.paused) v.pause();
}), { threshold: 0.2 });
if (vo) $$('video[data-v]:not(.tile-film)').forEach(v => { under(v); vo.observe(v); });

/* ---------- the tiles' films: each plays once, from its beginning, when
   its tile is well in view, and then stays on its last picture. It plays
   again only after its tile has been out of sight altogether. ---------- */
// the tiles' films are fetched whole, one after another, before they play:
// a film that plays while it is still arriving stalls and flickers on a
// phone's connection. Until its film is in, a tile shows its first picture.
const queue = []; let busy = false;
function want(v, first) {
  if (v._want) { if (first && !v._ready) { const i = queue.indexOf(v); if (i > 0) { queue.splice(i, 1); queue.unshift(v); } } return; }
  v._want = true; first ? queue.unshift(v) : queue.push(v); pump();
}
async function pump() {
  if (busy) return;
  const v = queue.shift(); if (!v) return;
  busy = true;
  try { const r = await fetch(srcOf(v)); if (!r.ok) throw 0; v.src = URL.createObjectURL(await r.blob()); }
  catch (e) { v.src = srcOf(v); }
  // should the browser not take the film from memory, it gets it the usual way
  v.addEventListener('error', () => { if (v.src.startsWith('blob:')) { v.src = srcOf(v); if (v._seen) fromStart(v); } }, { once: true });
  v.preload = 'auto'; v.load();
  v._ready = true; busy = false;
  // a phone draws nothing of a film before it is told to play, so it is told
  if (v._pending) { v._pending = false; go(v); }
  pump();
}
// a tile's film is told to play; if no picture of it is drawn within a few
// seconds, it is fetched again the usual way
function go(v) {
  fromStart(v);
  clearTimeout(v._dog);
  v._dog = setTimeout(() => { if (v._seen && v.style.opacity !== '1' && v.src.startsWith('blob:')) { v.src = srcOf(v); fromStart(v); } }, 3500);
}
const to = 'IntersectionObserver' in window && new IntersectionObserver(es => es.forEach(en => {
  const v = en.target;
  if (en.intersectionRatio > 0) want(v, true);
  if (en.intersectionRatio >= 0.55 && !v._seen) {
    v._seen = true;
    if (still) {
      // nothing moves: the film's last picture, at once
      const end = () => { try { v.currentTime = Math.max(0, (v.duration || 0) - 0.05); } catch (e) {} v.addEventListener('seeked', () => { v.style.opacity = '1'; }, { once: true }); };
      if (v.readyState >= 1) end(); else v.addEventListener('loadedmetadata', end, { once: true });
      return;
    }
    if (v._ready) go(v); else v._pending = true;
  } else if (en.intersectionRatio === 0 && v._seen) {
    // out of sight: it may play again next time, from its start
    v._seen = false; v._pending = false; v.pause();
  }
}), { threshold: [0, 0.55], rootMargin: '0px 200px 0px 200px' });
if (to) $$('video.tile-film').forEach(v => { under(v); to.observe(v); });
// all four are fetched, in order, while the tiles are still a screen or so away
const tileRow = document.getElementById('tiles');
if (tileRow && 'IntersectionObserver' in window) {
  const near = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { $$('video.tile-film').forEach(v => want(v)); near.disconnect(); } }, { rootMargin: '900px 0px' });
  near.observe(tileRow);
}

/* ---------- the band: two rows that the scroll pushes, opposite ways ---------- */
const rows = $$('[data-mq]');
// each row holds its words twice, so it can run forever without a seam
rows.forEach(r => { r.innerHTML += r.innerHTML; r._w = 0; });
const measureRows = () => rows.forEach(r => { r._w = r.scrollWidth / 2; });

/* ---------- the scrubbed pieces ---------- */
let W = innerWidth, H = innerHeight, wide = W > 760;
const S = {};
// each frame reads every rectangle first and only then writes, so the
// phone never has to lay the page out again halfway through a frame
const rects = new Map();
const rect = el => rects.get(el) || el.getBoundingClientRect();

// one idea, and all it can become: an icon opens into an app, a system
// stands up behind it, the tools it talks to join it, the code it is made
// of, the search that finds it — and then the sentence it all says
S.alt = el => {
  const obj = el.querySelector('.alt-obj'), icon = el.querySelector('.a-icon'), pad = el.querySelector('.a-pad');
  const phs = [0, 1, 2].map(i => el.querySelector('.a-ph[data-i="' + i + '"]')), frames = phs.map(p => p.querySelector('.a-frame'));
  const logos = $$('.a-logo', el), svg = el.querySelector('.a-lines'), code = el.querySelector('.a-code'), lines = $$('.a-code .l', el);
  const find = el.querySelector('.a-find'), q = el.querySelector('.a-q'), res = el.querySelector('.a-res'), ai = el.querySelector('.a-ai'), typed = el.querySelector('.a-typed');
  const says = $$('.alt-say > li > div', el), end = el.querySelector('.alt-end'), label = el.querySelector('.alt-label');
  const SAY = [[-1, 0.1], [0.12, 0.27], [0.28, 0.42], [0.43, 0.56], [0.57, 0.7], [0.71, 0.84]];
  // the tools sit in an arc over the system, and the system makes room
  let u = 40, ow = 0, oh = 0, paths = [];
  const PAD = { x: 0.7, y: -0.55 }, DROP = 0.75, PAD_HALF = 3.62;
  const tool = i => { const k = (i - 2.5) / 2.5; return { x: PAD.x + k * 4.2, y: PAD.y + DROP - PAD_HALF - 0.95 + 0.32 * k * k }; };
  function measure() {
    ow = obj.offsetWidth; oh = obj.offsetHeight;
    u = Math.min(ow / 10.8, oh / 10.4);
    obj.style.setProperty('--u', u.toFixed(2) + 'px');
    // the lines from the system to each tool, drawn once for this size
    svg.setAttribute('viewBox', '0 0 ' + ow + ' ' + oh);
    svg.innerHTML = '';
    paths = [0, 1, 2, 3, 4, 5].map(i => {
      // from each tool down into the top of the system
      const tl = tool(i);
      const x1 = ow / 2 + tl.x * u, y1 = oh / 2 + (tl.y + 0.62) * u;
      const x0 = ow / 2 + (PAD.x + (tl.x - PAD.x) * 0.55) * u, y0 = oh / 2 + (PAD.y + DROP - PAD_HALF + 0.55) * u;
      const pth = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pth.setAttribute('d', 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' C' + x1.toFixed(1) + ' ' + ((y1 + y0) / 2).toFixed(1) + ' ' + x0.toFixed(1) + ' ' + ((y1 + y0) / 2).toFixed(1) + ' ' + x0.toFixed(1) + ' ' + y0.toFixed(1));
      pth.setAttribute('pathLength', '1');
      svg.appendChild(pth);
      return pth;
    });
  }
  const put = (e, x, y, sc, rot, o) => {
    setT(e, 'translate3d(' + (x * u).toFixed(1) + 'px,' + (y * u).toFixed(1) + 'px,0)' + (rot ? ' rotate(' + rot.toFixed(2) + 'deg)' : '') + ' scale(' + sc.toFixed(4) + ')');
    setO(e, o);
  };
  return () => {
    const r = rect(el);
    // when nothing may move, it stands where it ends
    const p = still ? 1 : clamp(-r.top / Math.max(1, r.height - H));
    if (el._w !== W || !ow) { el._w = W; measure(); }

    // the end: everything steps back, and the sentence comes
    const E = io(seg(p, 0.85, 0.93));
    const back = lerp(1, 0.8, E), dimEnd = lerp(1, 0.4, E);

    // 1. the icon, and the app it opens into
    const ii = out(seg(p, -0.02, 0.05));
    const L = io(seg(p, 0.1, 0.19));
    put(icon, 0, 0, lerp(0.72, 1, ii) * lerp(1, 1.6, L), 0, ii * (1 - seg(L, 0.15, 0.5)));
    const F = io(seg(p, 0.19, 0.27));
    // 2. the system stands up behind it, and the apps step aside
    const Y = io(seg(p, 0.28, 0.38));
    const gx = lerp(0, -3.15, Y), gy = lerp(0, 1.55, Y), gs = lerp(1, 0.6, Y) * back;
    // 4./5. the code, then the search, come to the front, and the rest dims
    const C = io(seg(p, 0.57, 0.64)), Fd = io(seg(p, 0.71, 0.77));
    const dim = lerp(1, 0.38, Math.max(C, Fd)) * dimEnd;
    phs.forEach((ph, i) => {
      const side = i === 0 ? 0 : i === 1 ? -1 : 1;
      const sc = i === 0 ? lerp(0.45, 1, L) : lerp(0.86, 0.92, F);
      const x = gx + side * 1.95 * F * lerp(1, 0.95, Y), y = gy + (side ? 0.28 * F : 0);
      put(ph, x * gs, y + io(seg(p, 0.42, 0.48)) * DROP, sc * gs, side * 9 * F, (i === 0 ? seg(L, 0, 0.25) : seg(F, 0, 0.3)) * dim);
      setO(frames[i], i === 0 ? seg(L, 0.4, 1) : 1);
    });
    const D = io(seg(p, 0.42, 0.48)) * DROP; // room for the tools above
    put(pad, PAD.x, lerp(2.4, PAD.y, Y) + D, lerp(0.86, 1, Y) * back, 0, Y * dim);
    // 3. the tools it is connected to, each on a line from the system
    logos.forEach((lg, i) => {
      const T = out(seg(p, 0.43 + i * 0.016, 0.5 + i * 0.016));
      const tl = tool(i);
      put(lg, tl.x, tl.y - 1.4 * (1 - T), lerp(0.6, 1, T) * back, 0, T * dim);
      if (paths[i]) { paths[i].style.strokeDashoffset = (1 - out(seg(p, 0.45 + i * 0.016, 0.53 + i * 0.016))).toFixed(3); }
    });
    setO(svg, seg(p, 0.44, 0.47) * dim);
    // 4. the code it is built of
    const away = io(seg(p, 0.7, 0.75));
    put(code, lerp(3.4, 1.1, C) + 1.6 * away, 0.95, lerp(0.94, 1, C), 0, C * (1 - away));
    lines.forEach((l, i) => { const v = seg(p, 0.6 + i * 0.011, 0.625 + i * 0.011); l.style.clipPath = 'inset(0 ' + ((1 - v) * 100).toFixed(1) + '% 0 0)'; });
    // 5. found, by the people who search, and by the assistants they ask
    put(find, lerp(-1.4, -0.4, Fd), lerp(0.6, 0.1, Fd), lerp(0.94, 1, Fd) * lerp(1, 0.9, E), 0, Fd * (1 - E));
    const full = typed.getAttribute(document.documentElement.lang === 'en' ? 'data-en' : 'data-da') || '';
    const n = Math.round(full.length * seg(p, 0.735, 0.785));
    if (typed._n !== n) { typed._n = n; typed.textContent = full.slice(0, n); }
    const r1 = out(seg(p, 0.785, 0.805)), r2 = out(seg(p, 0.805, 0.83));
    setT(res, 'translate3d(0,' + ((1 - r1) * 16).toFixed(1) + 'px,0)'); setO(res, r1);
    setT(ai, 'translate3d(0,' + ((1 - r2) * 16).toFixed(1) + 'px,0)'); setO(ai, r2);

    // the words beside it, one sentence at a time
    says.forEach((s, i) => {
      const [a, b] = SAY[i];
      const inn = a < 0 ? 1 : out(seg(p, a, a + 0.03)), go = seg(p, b - 0.025, b);
      setO(s, inn * (1 - go));
      setT(s, 'translate3d(0,' + ((1 - inn) * 26 - go * 26).toFixed(1) + 'px,0)');
      s.style.visibility = inn > 0 && go < 1 ? 'visible' : 'hidden';
    });
    setO(label, 1 - seg(p, 0.83, 0.86));
    const e2 = out(seg(p, 0.87, 0.94));
    setO(end, e2);
    setT(end, (W > 760 && W / H >= 1 ? 'translateY(-50%) ' : '') + 'translate3d(0,' + ((1 - e2) * 24).toFixed(1) + 'px,0)');
    end.classList.toggle('on', e2 > 0.5);
  };
};

// the window and the phone of each case move at different depths
S.case = el => {
  const win = el.querySelector('[data-p="win"]'), ph = el.querySelector('[data-p="ph"]'), chip = el.querySelector('[data-p="chip"]');
  const flip = el.classList.contains('case-r') ? -1 : 1;
  return () => {
    const r = rect(el);
    const q = clamp((H - r.top) / (H + r.height));
    const inn = out(seg(q, 0.05, 0.42));
    setT(win, 'translate3d(0,' + ((0.5 - q) * 70).toFixed(1) + 'px,0) scale(' + lerp(0.9, 1, inn).toFixed(4) + ')');
    setO(win, lerp(0.3, 1, inn));
    // the phone stands on the same table as the Mac: it only slides in
    setT(ph, 'translate3d(' + ((1 - inn) * -60 * flip).toFixed(1) + 'px,0,0)');
    setO(ph, inn);
    setT(chip, 'translate3d(0,' + ((0.5 - q) * 320).toFixed(1) + 'px,0)');
    setO(chip, out(seg(q, 0.25, 0.45)));
  };
};

// notifications land one after another beside the phone
S.admin = el => {
  const notes = $$('.note', el), ph = el.querySelector('.dev-iph');
  return () => {
    const r = rect(el);
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
    const r = rect(el);
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
    const r = rect(el);
    const q = clamp((H - r.top) / (H + r.height));
    setT(img, 'translate3d(0,' + ((q - 0.5) * -90).toFixed(1) + 'px,0) scale(1.06)');
  };
};

const live = [];
for (const el of $$('[data-scrub]')) live.push({ el, draw: S[el.dataset.scrub](el), on: false });
const talk = document.querySelector('.talk');
if (talk) live.push({ el: talk, draw: S.talk(talk), on: false });
const band = document.querySelector('.band');
if (band) live.push({ el: band, on: false, draw: (() => {
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
  rects.clear();
  for (const s of live) if (s.on) rects.set(s.el, s.el.getBoundingClientRect());
  for (const s of live) if (s.on) { s.draw(now); if (s.always) any = true; }
  if (any && !still) kick();
}
function kick() { if (!raf) raf = requestAnimationFrame(frame); }

if (still) {
  // nothing moves: every piece is drawn once, where it ends
  W = innerWidth; H = innerHeight;
  addEventListener('load', () => {
    measureRows();
    for (const s of live) if (s.el.dataset.scrub !== 'steps') s.draw(performance.now());
  });
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
  // only a new width is a new layout; Safari's bars coming and going is not
  addEventListener('resize', () => { if (innerWidth === W) return; W = innerWidth; H = innerHeight; wide = W > 760; measureRows(); kick(); });
  // the words change length with the language
  $$('.seg button').forEach(b => b.addEventListener('click', () => requestAnimationFrame(() => { measureRows(); kick(); })));
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { measureRows(); kick(); });
  measureRows();
  kick();
}

/* ---------- the tiles: arrows on a wide screen, a swipe everywhere ---------- */
const tiles = document.getElementById('tiles');
if (tiles) {
  const prev = document.querySelector('.tn-prev'), next = document.querySelector('.tn-next');
  const step = () => (tiles.querySelector('.tile')?.offsetWidth || 400) + 20;
  const state = () => {
    if (prev) prev.disabled = tiles.scrollLeft < 8;
    if (next) next.disabled = tiles.scrollLeft > tiles.scrollWidth - tiles.clientWidth - 8;
  };
  prev && prev.addEventListener('click', () => tiles.scrollBy({ left: -step(), behavior: 'smooth' }));
  next && next.addEventListener('click', () => tiles.scrollBy({ left: step(), behavior: 'smooth' }));
  tiles.addEventListener('scroll', state, { passive: true });
  state();
}

/* ---------- Callster: the owner texts, it is handled ---------- */
const msg = document.querySelector('[data-msg]');
if (msg) {
  let timers = [];
  const play = () => {
    timers.forEach(clearTimeout); timers = [];
    msg.classList.remove('m1', 'm2', 'm3');
    if (still) { msg.classList.add('m1', 'm3'); return; }
    timers.push(setTimeout(() => msg.classList.add('m1'), 500));
    timers.push(setTimeout(() => msg.classList.add('m2'), 1500));
    timers.push(setTimeout(() => msg.classList.add('m3'), 3300));
    timers.push(setTimeout(play, 11000));
  };
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting) play(); else { timers.forEach(clearTimeout); timers = []; }
    }), { threshold: 0.4 }).observe(msg);
  } else msg.classList.add('m1', 'm3');
}

/* ---------- Safari's bars, in the colour of what is under them ----------
   Safari colours its bars from the opaque strips at the top and bottom of
   the screen; once the first screen has turned to paper, each strip takes
   the colour of the section passing under it, so the page fills the phone
   edge to edge whatever part of it is showing. */
const edgeT = document.querySelector('.edge-t'), edgeB = document.querySelector('.edge-b');
if (edgeT && edgeB && getComputedStyle(edgeT).display !== 'none') {
  const tone = document.querySelector('meta[name="theme-color"]');
  const html = document.documentElement;
  const solid = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map(Number); return p.length < 4 || p[3] > 0.9 ? c : null; };
  // the colour of the page at a height, under anything fixed on top of it
  const under = y => {
    for (const el of document.elementsFromPoint(3, y)) {
      if (el.closest('.edge, .tb, .mm')) continue;
      for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
        const cs = getComputedStyle(e);
        if (cs.position === 'fixed') break;
        const c = solid(cs.backgroundColor); if (c) return c;
      }
    }
    return null;
  };
  let raf = 0, lastT = '', lastB = '';
  const paint = () => {
    raf = 0;
    if (html.classList.contains('hs-on') && !html.classList.contains('hs-past')) {
      if (lastT) { edgeT.style.background = edgeB.style.background = html.style.background = ''; lastT = lastB = ''; }
      return;
    }
    const t = under(8) || '', b = under(innerHeight - 8) || '';
    if (t !== lastT) { lastT = t; edgeT.style.background = t; if (tone && t) tone.content = t; }
    if (b !== lastB) { lastB = b; edgeB.style.background = b; html.style.background = b; }
  };
  const ask = () => { if (!raf) raf = requestAnimationFrame(paint); };
  addEventListener('scroll', ask, { passive: true });
  addEventListener('resize', ask);
  ask();
}
