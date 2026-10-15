/* The first screen: a film that plays once, by itself, and a page that
   scrolls the whole time.

   Nothing is ever taken from the reader: the scroll is never held, and the
   film is never skipped or scrubbed. The page simply slides up over it.

   It does wait for one thing. The film only starts when all of it is in
   and the device has shown it can draw at full rate; until then the Lesreg
   mark stands on the dark with a line for how much has arrived. A device
   that cannot keep up gets a lighter film, never a stuttering one. */

const $ = (s, r = document) => r.querySelector(s);
const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const seg = (t, a, b) => clamp((t - a) / (b - a));
const out = t => 1 - Math.pow(1 - t, 3);

// where the phone's screen is in each film, as fractions of the picture
// (measured off the last frame: the Deep Blue frame, and Callster's render's
// own screen proportions inside it)
const FILMS = {
  land: { w: 3824, h: 2160, pos: [0.64, 0.5], screen: { l: 0.5326, r: 0.7381, t: 0.0967, b: 0.8134 }, base: 'media/film-d', first: 'media/film-d-first.webp', end: 'media/phone-d-end.webp' },
  port: { w: 2160, h: 3824, pos: [0.5, 0.42], screen: { l: 0.31, r: 0.6831, t: 0.2621, b: 0.7508 }, base: 'media/film-m', first: 'media/film-m-first.webp', end: 'media/phone-m-end.webp' },
};

// the beats, in seconds of the film
const BEAT = { copy: 4.3 };
// and after it, in seconds from its last frame
const AFTER = { 'hx-lock': 0.05, 'hx-n1': 0.55, 'hx-n2': 1.15 };
// the film runs faster than it was shot: the glass has somewhere to be
const RATE = 1.6;

export function startHero() {
  const html = document.documentElement;
  const boot = $('#boot'), bar = $('#boot .boot-bar > i');
  const hx = $('.hx'), track = $('.hx-track'), media = $('.hx-media'), vid = $('.hx-film'), ios = $('.hx-ios'), white = $('.hx-white'), copy = $('.hx-copy');
  if (!hx || !vid) return;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let F = null, W = 0, H = 0, S = { x: 0, y: 0, w: 1, h: 1 };
  function fit() {
    W = innerWidth; H = innerHeight;
    const nf = W / H >= 1 ? FILMS.land : FILMS.port;
    const changed = nf !== F;
    F = nf;
    vid.style.objectPosition = (F.pos[0] * 100) + '% ' + (F.pos[1] * 100) + '%';
    // the phone's screen on this window: the film covers it, so the
    // picture is scaled by the larger ratio and offset by its position
    const s = Math.max(W / F.w, H / F.h), dw = F.w * s, dh = F.h * s;
    const ox = (W - dw) * F.pos[0], oy = (H - dh) * F.pos[1];
    const sc = F.screen;
    const x = ox + sc.l * dw, y = oy + sc.t * dh, w = (sc.r - sc.l) * dw, h = (sc.b - sc.t) * dh;
    const box = 'left:' + x.toFixed(1) + 'px;top:' + y.toFixed(1) + 'px;width:' + w.toFixed(1) + 'px;height:' + h.toFixed(1) + 'px';
    ios.style.cssText = box; white.style.cssText = box;
    S = { x, y, w, h };
    hx.classList.toggle('is-port', F === FILMS.port);
    if (changed) {
      // turned from one shape to the other: the other film's picture
      if (vid.src) { vid.pause(); vid.removeAttribute('src'); vid.load(); vid.poster = F.end; }
      else vid.poster = html.classList.contains('hx-lock') ? F.end : F.first;
    }
    return changed;
  }
  fit();

  // the date on the lock screen is today's
  const lang = () => html.lang === 'en' ? 'en-GB' : 'da-DK';
  const dateEl = $('.hx-ios .d');
  const setDate = () => { try { dateEl.textContent = new Date().toLocaleDateString(lang(), { weekday: 'long', day: 'numeric', month: 'long' }); } catch (e) {} };
  setDate();
  addEventListener('lesreg:lang', setDate);

  if (still) {
    // nothing moves: the phone as the film leaves it, the words already there
    vid.poster = F.end;
    html.classList.add('hx-ready', 'hx-copy-in', 'hx-lock', 'hx-n1', 'hx-n2');
    if (boot) boot.remove();
    return;
  }

  /* ---------- can this device draw at full rate? ---------- */
  const probe = () => new Promise(res => {
    const t = []; let last = performance.now(); const end = last + 650;
    (function f(n) { t.push(n - last); last = n; if (n < end) requestAnimationFrame(f); else { t.sort((a, b) => a - b); res(t[Math.floor(t.length / 2)] || 16.7); } })(last);
  });
  const conn = navigator.connection || {};
  const weakNet = conn.saveData || /(^|-)2g|3g/.test(conn.effectiveType || '');
  const weakMem = navigator.deviceMemory && navigator.deviceMemory < 4;

  function pick(fast) {
    const hevc = vid.canPlayType('video/mp4; codecs="hvc1.1.6.L153.B0"') !== '';
    const h264 = vid.canPlayType('video/mp4; codecs="avc1.640033"') !== '';
    if (!h264 && !hevc) return F.base + '.webm';
    if (!fast) return F.base + '-lite.mp4';
    const devW = W * (devicePixelRatio || 1);
    if (hevc) return F === FILMS.land && devW > 2000 ? F.base + '-uhd.mp4' : F.base + '-hevc.mp4';
    return F.base + '.mp4';
  }

  // the whole film, with a line for how much of it has come
  async function fetchAll(url) {
    const r = await fetch(url);
    if (!r.ok || !r.body) throw new Error('film');
    const total = +r.headers.get('content-length') || 0, reader = r.body.getReader(), parts = [];
    let got = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      parts.push(value); got += value.length;
      if (total && bar) bar.style.transform = 'scaleX(' + (0.08 + 0.92 * got / total).toFixed(3) + ')';
    }
    return URL.createObjectURL(new Blob(parts, { type: 'video/mp4' }));
  }

  let t0 = 0, raf = 0;
  const beats = new Set();
  function tick() {
    raf = 0;
    const t = vid.currentTime;
    if (t >= BEAT.copy && !beats.has('copy')) { beats.add('copy'); html.classList.add('hx-copy-in'); }
    if (!beats.has('copy')) raf = requestAnimationFrame(tick);
  }
  vid.addEventListener('ended', () => {
    // the words are there whatever happened; then the phone wakes, and the
    // two systems speak, one after the other
    html.classList.add('hx-copy-in');
    for (const [c, at] of Object.entries(AFTER)) setTimeout(() => html.classList.add(c), at * 1000);
  });

  async function go() {
    const ms = await probe();
    const fast = ms < 20 && !weakNet && !weakMem;
    const url = pick(fast);
    let src = url;
    try {
      src = await Promise.race([fetchAll(url), new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), 9000))]);
    } catch (e) { src = url; }
    if (document.fonts) await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1500))]);
    vid.src = src;
    await new Promise(r => { if (vid.readyState >= 2) r(); else { vid.addEventListener('loadeddata', r, { once: true }); setTimeout(r, 3000); } });
    html.classList.add('hx-ready');
    if (boot) { boot.classList.add('out'); setTimeout(() => boot.remove(), 900); }
    // after the dark has lifted, the film
    setTimeout(() => {
      vid.playbackRate = RATE;
      vid.play().then(() => { t0 = performance.now(); raf = requestAnimationFrame(tick); })
        .catch(() => { vid.poster = F.end; vid.removeAttribute('src'); vid.load(); html.classList.add('hx-copy-in', 'hx-lock', 'hx-n1', 'hx-n2'); });
    }, 350);
  }
  // a reload further down the page does not need the opening at all
  if (scrollY > H * 0.6) {
    vid.poster = F.end;
    html.classList.add('hx-ready', 'hx-copy-in', 'hx-lock', 'hx-n1', 'hx-n2');
    if (boot) boot.remove();
  } else go();

  /* ---------- on scroll, into the phone: its screen turns to paper and
     becomes the page. Only the picture is moved and scaled, on the
     compositor; nothing is drawn again. ---------- */
  let sraf = 0;
  const dim = $('.hx-dim'), scrim = $('.hx-scrim');
  const io3 = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  function onScroll() {
    sraf = 0;
    const r = track.getBoundingClientRect();
    const p = clamp(-r.top / Math.max(1, r.height - H));
    const e = io3(p);
    // the scale at which the screen covers the window, and the move that
    // brings its middle to the window's middle
    const cx = S.x + S.w / 2, cy = S.y + S.h / 2;
    const full = Math.max(W / S.w, H / S.h) * 1.04;
    const k = 1 + (full - 1) * e;
    const tx = (cx + (W / 2 - cx) * e) - k * cx, ty = (cy + (H / 2 - cy) * e) - k * cy;
    media.style.transform = 'translate3d(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px,0) scale(' + k.toFixed(4) + ')';
    white.style.opacity = seg(e, 0.3, 0.8).toFixed(3);
    const fade = 1 - seg(p, 0, 0.22);
    copy.style.opacity = fade.toFixed(3);
    copy.style.transform = 'translate3d(0,' + (-p * 60).toFixed(1) + 'px,0)';
    scrim.style.opacity = fade.toFixed(3);
    dim.style.opacity = '0';
    html.classList.toggle('hx-paper', e > 0.8);
  }
  addEventListener('scroll', () => { if (!sraf) sraf = requestAnimationFrame(onScroll); }, { passive: true });
  addEventListener('resize', () => { fit(); onScroll(); });
  onScroll();
}
