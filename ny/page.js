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
  const find = el.querySelector('.a-find'), res = el.querySelector('.a-res'), typed = el.querySelector('.a-typed');
  const ask = el.querySelector('.a-ask'), typed2 = el.querySelector('.a-typed2'), answers = $$('.a-ans', el);
  const says = $$('.alt-say > li > div', el), end = el.querySelector('.alt-end'), label = el.querySelector('.alt-label');
  const fin = el.querySelector('.alt-fin'), cv = el.querySelector('.fin-paper'), ctx = cv.getContext('2d');
  const brand = el.querySelector('.fin-brand'), mark = el.querySelector('.fin-mark'), word = el.querySelector('.fin-word');
  const l1 = el.querySelector('.fin-l1'), l2 = el.querySelector('.fin-l2'), sh = el.querySelector('.fin-sh'), flap = el.querySelector('.fin-flap');

  /* ---------- the fold: a film (made from this very picture, by Higgsfield)
     in which all of it crumples into a ball of paper that opens into the
     mark; drawn frame by frame onto a canvas, as the scroll moves ---------- */
  const FOLD = { n: +(cv.dataset.n || 0), src: cv.dataset.src || '', end: 0.24 };
  const pics = []; let loading = false, shown = -1;
  function loadFrames() {
    if (loading || !FOLD.n) return; loading = true;
    for (let i = 0; i < FOLD.n; i++) { const im = new Image(); im.decoding = 'async'; im.src = FOLD.src + String(i + 1).padStart(3, '0') + '.webp'; if (im.decode) im.decode().catch(() => {}); pics[i] = im; }
  }
  const endLines = $$('.alt-fin-h .ln > *', el), endWhat = el.querySelector('.alt-fin-what'), endP = el.querySelector('.alt-fin-p'), endCta = el.querySelector('.alt-fin-cta');
  const glow2 = el.querySelector('.alt-glow2'), glow = el.querySelector('.alt-glow');
  let V = { cx: 0, cy: 0, S: 0 }, dpr = 1;
  const cap = /[?&]cap=(start|end)/.exec(location.search);
  let fy = 0, wordW = 0, objC = { x: 0, y: 0 };
  // the first five beats run on their own clock, pe; Google and the assistants after them
  const K = 0.845;
  const SAY = [[-1, 0.1 * K], [0.12 * K, 0.27 * K], [0.28 * K, 0.42 * K], [0.43 * K, 0.56 * K], [0.57 * K, 0.7 * K], [0.6, 0.7], [0.705, 0.875]];
  // where the scroll comes to rest: each beat, whole, its words up (in p), and the very end
  const REST = [0.045, 0.195, 0.325, 0.445, 0.556, 0.668, 0.845];
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
  // the scroll lands on each beat: a resting point for each, laid in the track
  // when the scroll lets go inside the section, it glides on to the nearest
  // beat, so it always comes to rest where there is something to read
  let touching = false, settleT = 0, settling = false, lastP = null;
  const settle = () => {
    if (still || touching) return;
    const r0 = el.getBoundingClientRect(), run = el.offsetHeight - innerHeight;
    const P0 = -r0.top / Math.max(1, run);
    if (P0 <= 0.002) { lastP = 0; return; }
    if (P0 >= 0.998) { lastP = 1; return; }
    const pts = REST.map(x => x * 0.852).concat([1]);
    // on in the direction the scroll was going; back only for a nudge
    const dir = lastP === null ? 1 : Math.sign(P0 - lastP);
    const gap = 0.012;
    let best;
    if (lastP !== null && Math.abs(P0 - lastP) < gap) best = lastP;
    else if (dir >= 0) best = pts.find(x => x >= P0 - 0.004) ?? 1;
    else best = [...pts].reverse().find(x => x <= P0 + 0.004) ?? pts[0];
    lastP = best;
    const dy = (best - P0) * run;
    if (Math.abs(dy) < 3) return;
    // into the finale the glide is long, so the film plays as a film
    glide(scrollY + dy, best === 1 && P0 < 0.85 ? 2600 : Math.min(900, Math.max(420, Math.abs(dy) / innerHeight * 520)));
  };
  // a glide of our own, so its length can be chosen; any touch or wheel ends it
  let glideRaf = 0;
  const stopGlide = () => { if (glideRaf) { cancelAnimationFrame(glideRaf); glideRaf = 0; settling = false; } };
  function glide(to, ms) {
    stopGlide();
    const from = scrollY, t0 = performance.now();
    settling = true;
    const step = now => {
      const k = Math.min(1, (now - t0) / ms), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      scrollTo(0, from + (to - from) * e);
      if (k < 1) glideRaf = requestAnimationFrame(step); else { glideRaf = 0; setTimeout(() => { settling = false; }, 60); }
    };
    glideRaf = requestAnimationFrame(step);
  }
  addEventListener('wheel', stopGlide, { passive: true });
  addEventListener('touchstart', () => { touching = true; stopGlide(); clearTimeout(settleT); }, { passive: true });
  addEventListener('touchend', () => { touching = false; clearTimeout(settleT); settleT = setTimeout(settle, 180); }, { passive: true });
  addEventListener('scroll', () => { if (settling) return; clearTimeout(settleT); settleT = setTimeout(settle, 180); }, { passive: true });
  let Ps = -1, tPrev = 0, MW = 100;
  return now => {
    const r = rect(el);
    // when nothing may move, it stands where it ends
    const Pt = still ? 1 : clamp(-r.top / Math.max(1, r.height - H));
    // it follows the scroll a breath behind, so a flick becomes a glide
    const dt = Math.min(0.05, Math.max(0.001, ((now || 0) - tPrev) / 1000)); tPrev = now || 0;
    if (Ps < 0 || still || Math.abs(Pt - Ps) > 0.25) Ps = Pt; else Ps += (Pt - Ps) * (1 - Math.exp(-dt * 14));
    if (Math.abs(Pt - Ps) > 0.0004) kick(); else Ps = Pt;
    const P = Ps;
    // the scenes run on p; the finale takes the last part of the scroll, q
    const p = clamp(P / 0.852), q = seg(P, 0.72, 1);
    if (P > 0.35) loadFrames();
    if (el._w !== W || !ow) {
      el._w = W; measure();
      const mob = W <= 760 || W / H < 1;
      el._mob = mob;
      fy = H * (mob ? 0.3 : 0.33);
      fin.style.setProperty('--fy', fy.toFixed(0) + 'px');
      end.style.setProperty('--ey', (fy + (mob ? 62 : 96)).toFixed(0) + 'px');
      wordW = word.offsetWidth + parseFloat(getComputedStyle(brand).gap || '0');
      objC = { x: obj.offsetLeft + ow / 2, y: obj.offsetTop + oh / 2 };
      // the film's square: where it plays, and how big
      V = mob ? { cx: W / 2, cy: H * 0.5, S: Math.min(W * 1.02, H * 0.62) } : { cx: W / 2, cy: H * 0.52, S: Math.min(W * 0.6, H * 0.84) };
      dpr = Math.min(2, devicePixelRatio || 1);
      Object.assign(cv.style, { left: (V.cx - V.S / 2).toFixed(1) + 'px', top: (V.cy - V.S / 2).toFixed(1) + 'px', width: V.S.toFixed(1) + 'px', height: V.S.toFixed(1) + 'px' });
      cv.width = cv.height = Math.round(V.S * dpr);
      MW = parseFloat(getComputedStyle(mark).width) || 100;
      glow2.style.setProperty('--gx', V.cx.toFixed(0) + 'px'); glow2.style.setProperty('--gy', V.cy.toFixed(0) + 'px');
      shown = -1;
    }
    const pe = p / K;

    // the end: everything steps back, and the sentence comes
    const E = 0;
    const back = lerp(1, 0.8, E), dimEnd = lerp(1, 0.4, E);

    // 1. the icon, and the app it opens into
    const ii = out(seg(pe, -0.02, 0.05));
    const L = io(seg(pe, 0.1, 0.17));
    put(icon, 0, 0, lerp(0.72, 1, ii) * lerp(1, 1.6, L), 0, ii * (1 - seg(L, 0.15, 0.5)));
    const F = io(seg(pe, 0.17, 0.232));
    // 2. the system stands up behind it, and the apps step aside
    const Y = io(seg(pe, 0.28, 0.38));
    const gx = lerp(0, -3.15, Y), gy = lerp(0, 1.55, Y), gs = lerp(1, 0.6, Y) * back;
    // 4./5. the code, then the search, come to the front, and the rest dims
    const C = io(seg(pe, 0.57, 0.64)), Fd = io(seg(p, 0.6, 0.65)) * (1 - io(seg(p, 0.7, 0.735))), A = io(seg(p, 0.7, 0.745));
    const dim = lerp(1, 0.38, Math.max(C, io(seg(p, 0.6, 0.65)))) * lerp(1, 0.55, A) * dimEnd;
    phs.forEach((ph, i) => {
      const side = i === 0 ? 0 : i === 1 ? -1 : 1;
      const sc = i === 0 ? lerp(0.45, 1, L) : lerp(0.86, 0.92, F);
      const x = gx + side * 1.95 * F * lerp(1, 0.95, Y), y = gy + (side ? 0.28 * F : 0);
      put(ph, x * gs, y + io(seg(pe, 0.42, 0.48)) * DROP, sc * gs, side * 9 * F, (i === 0 ? seg(L, 0, 0.25) : seg(F, 0, 0.3)) * dim);
      setO(frames[i], i === 0 ? seg(L, 0.4, 1) : 1);
    });
    const D = io(seg(pe, 0.42, 0.48)) * DROP; // room for the tools above
    put(pad, PAD.x, lerp(2.4, PAD.y, Y) + D, lerp(0.86, 1, Y) * back, 0, Y * dim);
    // 3. the tools it is connected to, each on a line from the system
    logos.forEach((lg, i) => {
      const T = out(seg(pe, 0.42 + i * 0.01, 0.48 + i * 0.01));
      const tl = tool(i);
      put(lg, tl.x, tl.y - 1.4 * (1 - T), lerp(0.6, 1, T) * back, 0, T * dim);
      if (paths[i]) { paths[i].style.strokeDashoffset = (1 - out(seg(pe, 0.44 + i * 0.01, 0.5 + i * 0.01))).toFixed(3); }
    });
    setO(svg, seg(pe, 0.44, 0.47) * dim);
    // 4. the code it is built of
    const away = io(seg(pe, 0.7, 0.75));
    put(code, lerp(3.4, 1.1, C) + 1.6 * away, 0.95, lerp(0.94, 1, C), 0, C * (1 - away));
    lines.forEach((l, i) => { const v = seg(pe, 0.575 + i * 0.008, 0.595 + i * 0.008); l.style.clipPath = 'inset(0 ' + ((1 - v) * 100).toFixed(1) + '% 0 0)'; });
    // 5. found, by the people who search, and by the assistants they ask
    put(find, lerp(-1.2, -0.3, Fd) - 1.2 * io(seg(p, 0.7, 0.735)), lerp(0.6, 0.1, io(seg(p, 0.6, 0.65))), lerp(0.94, 1, Fd), 0, Fd);
    const lang = document.documentElement.lang === 'en' ? 'data-en' : 'data-da';
    const full = typed.getAttribute(lang) || '';
    const n = Math.round(full.length * seg(p, 0.612, 0.645));
    if (typed._n !== n) { typed._n = n; typed.textContent = full.slice(0, n); }
    const r1 = out(seg(p, 0.643, 0.662));
    setT(res, 'translate3d(0,' + ((1 - r1) * 16).toFixed(1) + 'px,0)'); setO(res, r1);
    // 6. asked: the question to an assistant, and three answers that name it
    put(ask, lerp(1.2, 0.2, A), lerp(0.4, -0.2, A), lerp(0.94, 1, A) * lerp(1, 0.9, E), 0, A * (1 - E));
    const full2 = typed2.getAttribute(lang) || '';
    const n2 = Math.round(full2.length * seg(p, 0.72, 0.765));
    if (typed2._n !== n2) { typed2._n = n2; typed2.textContent = full2.slice(0, n2); }
    answers.forEach((an, i) => {
      // they come in one after another; each new one in front, the earlier ones fanned behind it
      const a = out(seg(p, 0.77 + i * 0.022, 0.795 + i * 0.022));
      const after = answers.reduce((s, _, k) => s + (k > i ? out(seg(p, 0.77 + k * 0.022, 0.795 + k * 0.022)) : 0), 0);
      // the earlier ones tucked behind, only their names showing above it
      setT(an, 'translate3d(0,' + ((1 - a) * 30 - after * 0.3 * u).toFixed(1) + 'px,0) scale(' + ((1 - 0.05 * after) * lerp(0.96, 1, a)).toFixed(4) + ')');
      setO(an, a * (1 - 0.25 * Math.min(after, 1.5)));
      an.style.setProperty('--c', (1 - clamp(after * 1.4)).toFixed(3));
      an.style.zIndex = String(i + 1);
    });

    // the words beside it, one sentence at a time
    says.forEach((s, i) => {
      const [a, b] = SAY[i];
      const inn = a < 0 ? 1 : out(seg(p, a, a + 0.03)), go = seg(p, b - 0.025, b);
      setO(s, inn * (1 - go));
      setT(s, 'translate3d(0,' + ((1 - inn) * 26 - go * 26).toFixed(1) + 'px,0)');
      s.style.visibility = inn > 0 && go < 1 ? 'visible' : 'hidden';
    });
    setO(label, 1 - seg(p, 0.83, 0.86));

    // ---------- the finale ----------
    let Q = q;
    if (cap) Q = cap[1] === 'start' ? 0.13 : 0.885;
    // 1. it gathers in the middle, the light behind it with it
    const g = io(seg(Q, 0, 0.13));
    // the system behind steps away; what is left is the tools it talks to
    // and the answer it gets: that is what goes into the paper
    const off = io(seg(Q, 0, 0.09));
    if (off > 0) { for (const e of [pad, svg, ...phs]) setO(e, (+e._po || 0) * (1 - off)); }
    // and the tools come back up to full light
    if (off > 0) for (const e of logos) setO(e, lerp(+e._po || 0, 1, off));
    // the whole of it fits well inside the film's square, its middle in the middle
    // the camera is closer while there is one thing to see, the icon and the
    // app, and steps back as the system stands up behind it
    const zoom = lerp(el._mob ? 1.5 : 1.16, 1, io(seg(pe, 0.27, 0.37)));
    const sc = lerp(zoom, V.S / (12.6 * u), g);
    setT(obj, 'translate3d(' + ((V.cx - objC.x - 0.45 * u * sc) * g).toFixed(1) + 'px,' + ((V.cy - objC.y + 1.55 * u * sc) * g).toFixed(1) + 'px,0) scale(' + sc.toFixed(4) + ')');
    setO(glow2, g); setO(glow, 1 - g);
    // 2. the film takes over from the very picture it starts from
    const film = Q >= 0.13 && Q < 0.9 && FOLD.n;
    // the film comes up over the page's own picture, so no step shows between them
    const xf = seg(Q, 0.13, 0.17);
    setO(obj, Q >= 0.17 ? 0 : 1);
    if (cap && cap[1] === 'start') setO(obj, 1);
    setO(fin, Q > 0 ? 1 : 0);
    setO(cv, film && !(cap && cap[1] === 'start') ? xf : 0);
    if (film) {
      const k = Math.min(FOLD.n - 1, Math.round(seg(Q, 0.17, 0.86) * (FOLD.n - 1)));
      // the nearest frame that has arrived
      let i = k; while (i > 0 && !(pics[i] && pics[i].complete && pics[i].naturalWidth)) i--;
      if (i !== shown && pics[i] && pics[i].complete && pics[i].naturalWidth) {
        shown = i;
        const c2 = cv.getContext('2d');
        c2.clearRect(0, 0, cv.width, cv.height);
        c2.drawImage(pics[i], 0, 0, cv.width, cv.height);
      }
    }
    // 3. the mark, at the size and place it has at the film's end, comes
    //    to its own place, and its name beside it
    const hand = Q >= 0.86;
    setO(brand, hand ? 1 : 0);
    flap.style.opacity = '0';
    l1.setAttribute('height', '80'); l2.setAttribute('width', '56');
    const mv = io(seg(Q, 0.9, 0.97));
    const s0 = FOLD.end * V.S / MW;
    const bx = lerp(V.cx - W / 2, 0, mv), by = lerp(V.cy - fy, 0, mv);
    const wd = out(seg(Q, 0.92, 0.98));
    setT(brand, 'translate(-50%,-50%) translate3d(' + (bx + wordW / 2 * (1 - wd)).toFixed(1) + 'px,' + by.toFixed(1) + 'px,0) scale(' + lerp(s0, 1, mv).toFixed(4) + ')');
    setT(word, 'translate3d(' + (-18 * (1 - wd)).toFixed(1) + 'px,0,0)'); setO(word, wd);
    sh.setAttribute('x', lerp(-60, 160, seg(Q, 0.95, 1)).toFixed(1));
    // 4. and the sentence under it, with the way to say what you need
    // the two lines rise out of their own edge, one after the other; then
    // what we make, the price, and the two ways on
    setO(end, Q > 0.9 ? 1 : 0);
    endLines.forEach((l, i) => { const v = out(seg(Q, 0.935 + i * 0.018, 0.975 + i * 0.018)); setT(l, 'translate3d(0,' + ((1 - v) * 110).toFixed(1) + '%,0)'); });
    const w1 = out(seg(Q, 0.965, 0.99)), w2 = out(seg(Q, 0.975, 1));
    setO(endWhat, w1); setO(endP, w1);
    setO(endCta, w2); setT(endCta, 'translate3d(0,' + ((1 - w2) * 16).toFixed(1) + 'px,0)');
    end.classList.toggle('on', w2 > 0.5);
    setT(end, 'translate(-50%,0)');
    if (cap && cap[1] === 'end') { setO(end, 0); setO(word, 0); setT(brand, 'translate(-50%,-50%) translate3d(' + (V.cx - W / 2 + wordW / 2).toFixed(1) + 'px,' + (V.cy - fy).toFixed(1) + 'px,0) scale(' + s0.toFixed(4) + ')'); setO(brand, 1); }
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
