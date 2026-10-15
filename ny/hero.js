/* The first screen: the phone is the stage.

   It is there the moment the page is: no film to fetch, no loader. The
   lock screen's notifications arrive by themselves; after that the scroll
   alone turns the phone through what we have built, and at the end its
   screen turns to paper and opens into the page.

   Everything on the phone sits in one box, and only that box is moved and
   scaled, on the compositor; the screens change by opacity and transform. */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const seg = (t, a, b) => clamp((t - a) / (b - a));
const out = t => 1 - Math.pow(1 - t, 3);
const io3 = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// the run of the track, 0 to 1: when each app opens on the phone, and when
// its words stand beside it
const OPEN = [0.12, 0.36, 0.6];
const SAY = [[0.13, 0.34], [0.37, 0.58], [0.61, 0.8]];
const MSG = [0.65, 0.69, 0.73];
const WHITE = [0.8, 0.85], ZOOM = [0.82, 0.93], PAPER = [0.89, 0.93];
// then the sentence on the paper, one group of words at a time
const WRITE = 0.905, STEP = 0.012, EACH = 0.03;
// after the page opens, in seconds: the two notifications
const NOTE = { 'hs-n1': 0.9, 'hs-n2': 1.6 };

export function startHero() {
  const html = document.documentElement;
  const track = $('.hs-track'), hs = $('.hs'), ph = $('.hs-ph'), scr = $('.hs-dev .scr');
  if (!hs || !ph || !scr) return;
  const copy = $('.hs-copy-in'), says = $$('.hs-ch > li > div'), apps = $$('.hs-s[data-s]');
  const white = $('.hs-white'), paper = $('.hs-paper'), msg = $('[data-hmsg]');
  const vids = apps.map(a => $('video', a));
  const end = $('.hs-end'), words = $$('.hs-end .g'), pillVids = $$('.hs-end video');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // the date on the lock screen is today's
  const dateEl = $('.hs-lock .d');
  const setDate = () => { try { dateEl.textContent = new Date().toLocaleDateString(html.lang === 'en' ? 'en-GB' : 'da-DK', { weekday: 'long', day: 'numeric', month: 'long' }); } catch (e) {} };
  setDate();
  addEventListener('lesreg:lang', setDate);

  if (still) { html.classList.add('hs-n1', 'hs-n2'); return; }
  for (const [c, at] of Object.entries(NOTE)) setTimeout(() => html.classList.add(c), at * 1000);

  /* ---------- where things are, untransformed ---------- */
  let W = 0, H = 0, port = false, P = { x: 0, y: 0 }, S = { x: 0, y: 0, w: 1, h: 1 }, rise = 0;
  function within(el) {
    // offsets ignore transforms, so this is the box as laid out
    let x = 0, y = 0, e = el;
    while (e && e !== hs) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
    return { x, y, w: el.offsetWidth, h: el.offsetHeight };
  }
  function measure() {
    W = hs.clientWidth; H = hs.clientHeight;
    port = W / H < 1 || W <= 760;
    P = within(ph); S = within(scr);
    // held upright, the phone starts low, under the words, and comes up
    rise = port ? P.h * 0.2 : 0;
  }
  measure();

  /* ---------- the apps' films: fetched when they are close, playing only
     while their app is open ---------- */
  const h264 = document.createElement('video').canPlayType('video/mp4; codecs="avc1.42E01E"') !== '';
  function load(v) { if (v && !v.src) { v.src = v.dataset.hv + (h264 ? '.mp4' : '.webm'); v.load(); } }
  // the first app's film once the page has settled, so it is in before it is needed
  addEventListener('load', () => setTimeout(() => load(vids[0]), 1200), { once: true });
  let playing = -1;
  function play(i) {
    if (i === playing) return;
    playing = i;
    vids.forEach((v, j) => { if (!v) return; if (j === i) { load(v); const r = v.play(); if (r) r.catch(() => {}); } else v.pause(); });
  }

  /* ---------- the scroll ---------- */
  let raf = 0;
  function frame() {
    raf = 0;
    const r = track.getBoundingClientRect();
    const p = clamp(-r.top / Math.max(1, r.height - H));

    // the opening words go as the phone comes up
    const c = seg(p, 0.01, 0.07);
    copy.style.opacity = (1 - c).toFixed(3);
    copy.style.transform = 'translate3d(0,' + (-40 * c).toFixed(1) + 'px,0)';
    copy.style.visibility = c >= 1 ? 'hidden' : '';

    // each app opens over the last, the way iOS opens one
    let open = -1;
    apps.forEach((a, i) => {
      const q = out(seg(p, OPEN[i], OPEN[i] + 0.05));
      a.style.opacity = q.toFixed(3);
      a.style.transform = 'scale(' + (0.86 + 0.14 * q).toFixed(4) + ')';
      if (q > 0) open = i;
    });
    // the next one's film comes in while the one before is showing
    apps.forEach((a, i) => { if (p > OPEN[i] - 0.1) load(vids[i]); });
    play(open < 2 ? open : -1);

    // and its words beside it
    says.forEach((s, i) => {
      const [a, b] = SAY[i];
      const inn = out(seg(p, a, a + 0.035)), go = seg(p, b - 0.035, b);
      s.style.opacity = (inn * (1 - go)).toFixed(3);
      s.style.transform = 'translate3d(0,' + ((1 - inn) * 28 - go * 28).toFixed(1) + 'px,0)';
      s.style.visibility = inn > 0 && go < 1 ? 'visible' : 'hidden';
    });

    // the message, answered
    if (msg) MSG.forEach((t, i) => msg.classList.toggle('m' + (i + 1), p >= t));

    // into the screen: it turns to paper, then fills the window
    white.style.opacity = seg(p, WHITE[0], WHITE[1]).toFixed(3);
    const e = io3(seg(p, ZOOM[0], ZOOM[1]));
    const up = rise * (1 - out(seg(p, 0.02, 0.12)));
    // the screen's middle as laid out, where it is to be seen now, and the
    // scale at which the screen, corners and all, covers the window
    const cx = S.x + S.w / 2, cy = S.y + S.h / 2, sy = cy + up;
    const full = Math.max(W / S.w, H / S.h) * 1.1;
    const k = 1 + (full - 1) * e;
    const tx = (cx + (W / 2 - cx) * e) - P.x - k * (cx - P.x);
    const ty = (sy + (H / 2 - sy) * e) - P.y - k * (cy - P.y);
    ph.style.transform = 'translate3d(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px,0) scale(' + k.toFixed(4) + ')';
    paper.style.opacity = seg(p, PAPER[0], PAPER[1]).toFixed(3);

    // the sentence, written onto it; its film runs while it can be seen
    words.forEach((w, i) => {
      const q = out(seg(p, WRITE + i * STEP, WRITE + i * STEP + EACH));
      w.style.opacity = q.toFixed(3);
      w.style.transform = q >= 1 ? 'none' : 'translate3d(0,' + ((1 - q) * 34).toFixed(1) + 'px,0)';
    });
    end.classList.toggle('on', p >= WRITE + 0.02);
    const see = p > WRITE - 0.01 && r.bottom > 0;
    pillVids.forEach(v => {
      if (p > ZOOM[0]) load(v);
      if (see && v.paused) { const pr = v.play(); if (pr) pr.catch(() => {}); }
      else if (!see && !v.paused) v.pause();
    });
    html.classList.toggle('hx-paper', e > 0.8);
  }
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(frame); }, { passive: true });

  // measured again only when the stage itself changes size (a turn, a new
  // window), never for Safari's bars
  let lw = W, lh = H;
  const refit = () => { const w = hs.clientWidth, h = hs.clientHeight; if (w === lw && h === lh) return; lw = w; lh = h; measure(); frame(); };
  if (window.ResizeObserver) new ResizeObserver(refit).observe(hs); else addEventListener('resize', refit);
  frame();
}
