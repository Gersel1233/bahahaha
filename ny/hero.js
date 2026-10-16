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
  const white = $('.hs-white'), paper = $('.hs-paper');
  const vids = apps.map(a => $('video', a));
  const lock = $('.hs-lock'), screens = [lock, ...apps], sw = $('.hs-sw'), labs = [null, ...$$('.hs-lab')];
  const rail = $('.hs-rail'), railItems = $$('.hs-rail li');
  const end = $('.hs-end'), words = $$('.hs-end .g'), pillVids = $$('.hs-end video');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // the date on the lock screen is today's
  const dateEl = $('.hs-lock .d');
  const setDate = () => { try { dateEl.textContent = new Date().toLocaleDateString(html.lang === 'en' ? 'en-GB' : 'da-DK', { weekday: 'long', day: 'numeric', month: 'long' }); } catch (e) {} };
  setDate();
  addEventListener('lesreg:lang', setDate);

  if (still) {
    html.classList.add('hs-n1', 'hs-n2');
    // the page's colour behind Safari's bars still follows the dark
    const past = () => html.classList.toggle('hs-past', hs.getBoundingClientRect().bottom < 60);
    addEventListener('scroll', past, { passive: true }); past();
    return;
  }
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

  /* ---------- the apps' films: fetched when they are close; each starts
     from its beginning when its app opens, and plays once ---------- */
  const h264 = document.createElement('video').canPlayType('video/mp4; codecs="avc1.42E01E"') !== '';
  function load(v) { if (v && !v.src) { v.src = v.dataset.hv + (h264 ? '.mp4' : '.webm'); v.preload = 'auto'; } }
  // a phone shows black for a moment when a video goes back to its start;
  // so each film's first picture lies under it, and the film is only shown
  // once a frame of it has been drawn
  vids.forEach(v => { if (v && v.poster) v.parentNode.style.background = 'url("' + v.poster + '") 50% 0 / cover no-repeat'; });
  function show(v) { const on = () => { v.style.opacity = '1'; }; if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(on); else v.addEventListener('timeupdate', on, { once: true }); }
  // the first app's film once the page has settled, so it is in before it is needed
  addEventListener('load', () => setTimeout(() => load(vids[0]), 1200), { once: true });
  let playing = -1;
  function play(i) {
    if (i === playing) return;
    playing = i;
    vids.forEach((v, j) => {
      if (!v) return;
      if (j === i) {
        load(v);
        if (v.currentTime > 0.01) { v.style.opacity = '0'; try { v.currentTime = 0; } catch (e) {} }
        const r = v.play(); if (r) r.then(() => show(v)).catch(() => {}); else show(v);
      }
      else v.pause();
    });
  }

  /* ---------- the scroll ---------- */
  const tone = $('meta[name="theme-color"]');
  let wasPast = null;
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

    // from one app to the next the way an iPhone does it: the screen goes
    // up into the app switcher as a card, the cards slide across, and the
    // next one opens. Three times: lock screen → Spiis → Mosede → Callster.
    const tr = k => {
      const c = OPEN[k - 1], u = seg(p, c - 0.05, c + 0.06);
      return { u, up: io3(seg(u, 0, 0.34)), across: io3(seg(u, 0.3, 0.7)), into: io3(seg(u, 0.66, 1)) };
    };
    const T = [null, tr(1), tr(2), tr(3)];
    const CARD = 0.62, SLIDE = 0.7, LIFT = 0.04;
    let cur = 0, back = 0;
    screens.forEach((el, j) => {
      const tin = T[j], tout = T[j + 1];
      let k = 1, x = 0, y = 0, o = 1, lab = 0;
      if (tin && tin.u <= 0) o = 0;
      else if (tout && tout.u >= 1) o = 0;
      else if (tout && tout.u > 0) { k = 1 - (1 - CARD) * tout.up; y = -LIFT * tout.up; x = -SLIDE * tout.across; lab = tout.up * (1 - tout.into); o = 1 - tout.into; }
      else if (tin && tin.u < 1) { k = CARD + (1 - CARD) * tin.into; y = -LIFT * (1 - tin.into); x = (SLIDE + 0.45 * (1 - tin.up)) * (1 - tin.across); lab = tin.up * (1 - tin.into); o = tin.up > 0 ? 1 : 0; }
      // its film is already running in its card as it slides in
      if (tin && tin.u >= 0.3) cur = j;
      el.style.opacity = o.toFixed(3);
      el.style.transform = 'translate3d(' + (x * S.w).toFixed(1) + 'px,' + (y * S.h).toFixed(1) + 'px,0) scale(' + k.toFixed(4) + ')';
      el.style.boxShadow = lab > 0 ? '0 ' + (S.w * 0.05).toFixed(1) + 'px ' + (S.w * 0.12).toFixed(1) + 'px rgba(0,0,0,' + (0.5 * lab).toFixed(3) + ')' : 'none';
      // the app's icon and name above its card, as the switcher shows it
      const l = labs[j];
      if (l) {
        l.style.opacity = lab.toFixed(3);
        const left = S.w / 2 + x * S.w - (k * S.w) / 2, top = S.h / 2 + y * S.h - (k * S.h) / 2 - S.w * 0.1;
        l.style.transform = 'translate3d(' + left.toFixed(1) + 'px,' + top.toFixed(1) + 'px,0)';
      }
      if (tout) back = Math.max(back, tout.up * (1 - tout.into));
    });
    sw.style.opacity = back.toFixed(3);
    const open = cur - 1;
    // the next one's film comes in while the one before is showing
    apps.forEach((a, i) => { if (p > OPEN[i] - 0.12) load(vids[i]); });
    play(open);

    // the chapter rail: shown with the chapters, its chip on the current one
    const rv = seg(p, 0.09, 0.13) * (1 - seg(p, 0.78, 0.82));
    rail.style.opacity = rv.toFixed(3);
    let ch = 0; SAY.forEach(([a], i) => { if (p >= a - 0.012) ch = i; });
    railItems.forEach((li, i) => li.classList.toggle('on', i === ch));

    // and its words beside it
    says.forEach((s, i) => {
      const [a, b] = SAY[i];
      const inn = out(seg(p, a, a + 0.035)), go = seg(p, b - 0.035, b);
      s.style.opacity = (inn * (1 - go)).toFixed(3);
      s.style.transform = 'translate3d(0,' + ((1 - inn) * 28 - go * 28).toFixed(1) + 'px,0)';
      s.style.visibility = inn > 0 && go < 1 ? 'visible' : 'hidden';
    });


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
      if (p > 0.7) load(v);
      if (see && v.paused) { const pr = v.play(); if (pr) pr.then(() => show(v)).catch(() => {}); }
      else if (!see && !v.paused) v.pause();
    });
    html.classList.toggle('hx-paper', e > 0.8);
    // and Safari's bars with it
    const past = p >= PAPER[1] - 0.005;
    if (past !== wasPast) { wasPast = past; html.classList.toggle('hs-past', past); if (tone) tone.content = past ? '#F6F4EF' : '#05080F'; }
  }
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(frame); }, { passive: true });

  // measured again only when the stage itself changes size (a turn, a new
  // window), never for Safari's bars
  let lw = W, lh = H;
  const refit = () => { const w = hs.clientWidth, h = hs.clientHeight; if (w === lw && h === lh) return; lw = w; lh = h; measure(); frame(); };
  if (window.ResizeObserver) new ResizeObserver(refit).observe(hs); else addEventListener('resize', refit);
  frame();
}
