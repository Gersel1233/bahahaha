/* Lesreg — the opening, third cut.

   A Higgsfield film is the substrate: a drop of molten glass that flows
   and sets into a slab, filmed locked-off on engraved travertine. It is
   scrubbed by the scroll from a frame sequence, so it can run backwards as
   cleanly as forwards. Over it, everything is in the library's own
   language (LESREG · Liquid Atelier): the glass is measured as it sets,
   the way the Glass material laboratory measures it; then the slab lights
   up with the systems Lesreg has actually built — Spiis, then Mosede
   Havnecafé — and finally its face opens out into the page.

   render(p, a) is still one function of the scroll position and the load
   clock, and still writes only transform, opacity and one clip-path to
   the page. The film is drawn into one canvas. */

const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const seg = (p, a, b) => clamp((p - a) / (b - a));
const out = t => 1 - Math.pow(1 - t, 3);
const out5 = t => 1 - Math.pow(1 - t, 5);
const io = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, t) => a + (b - a) * t;

export const TXT = {
  da: {
    kicker: 'Lesreg · Softwarehus',
    open: ['Software,', 'formet efter forretningen.'],
    cue: 'Scroll',
    ch: [
      ['01', 'Materiale', 'Alt starter flydende.'],
      ['02', 'Form', 'Så får det en form, der holder.'],
      ['03', 'Spiis', 'Til Spiis blev det bestilling, booking og køkkenskærm.'],
      ['04', 'Mosede Havnecafé', 'Til Mosede Havnecafé blev det menuen og skærmene over disken.'],
    ],
    one: ['Ét hus.', 'Tegnet, bygget og drevet.'],
    ann: { w: 'LA3 / Glass / Block', d: 'refraktion .75 · dybde 32 · dispersion .1', s: 'Spejlkant −45°', live: 'I drift · lige nu' },
    app: { spiis: 'Spiis · bestillinger', mosede: 'Mosede Havnecafé · menu' },
  },
  en: {
    kicker: 'Lesreg · Software house',
    open: ['Software,', 'shaped to the business.'],
    cue: 'Scroll',
    ch: [
      ['01', 'Material', 'Everything starts fluid.'],
      ['02', 'Form', 'Then it takes a shape that holds.'],
      ['03', 'Spiis', 'For Spiis it became ordering, booking and a kitchen screen.'],
      ['04', 'Mosede Havnecafé', 'For Mosede Havnecafé it became the menu and the screens over the counter.'],
    ],
    one: ['One house.', 'Designed, built and run.'],
    ann: { w: 'LA3 / Glass / Block', d: 'refraction .75 · depth 32 · dispersion .1', s: 'Specular edge −45°', live: 'Running · right now' },
    app: { spiis: 'Spiis · orders', mosede: 'Mosede Havnecafé · menu' },
  },
};

/* the film, and where things stand in it (picture coordinates 0..1).
   One sequence in two parts: frames 0..nA-1 are the drop setting into
   the glass slab; the rest are the slab turning into an iPhone 17 Pro.
   glass: the sharp still of the slab; end: the sharp still of the phone.
   screen: the phone's display, measured off the end still, and its
   Dynamic Island as fractions of that display. */
const SCENES = {
  land: {
    w: 2688, h: 1520, seq: 'media/seq-d/', nA: 97, n: 158,
    glass: 'media/glas-d-end.webp', end: 'media/phone-d-end.webp',
    slab: { l: 0.522, r: 0.75, t: 0.082, b: 0.828 },
    glint: [0.749, 0.214],
    screen: { l: 0.5339, r: 0.7392, t: 0.0967, b: 0.8191, rad: 0.114 },
    island: { cx: 0.498, t: 0.012, w: 0.29, h: 0.04 },
  },
  port: {
    w: 1520, h: 2688, seq: 'media/seq-m/', nA: 65, n: 106,
    glass: 'media/glas-m-end.webp', end: 'media/phone-m-end.webp',
    slab: { l: 0.28, r: 0.72, t: 0.255, b: 0.762 },
    glint: [0.69, 0.272],
    screen: { l: 0.3118, r: 0.6862, t: 0.2634, b: 0.7515, rad: 0.105 },
    island: { cx: 0.496, t: 0.013, w: 0.33, h: 0.038 },
  },
};

/* the scroll, in parts */
const SEQ = [0.035, 0.40];            // the drop sets into the glass
const SEQB = [0.43, 0.515];           // the glass becomes the phone
const CH = [[0.07, 0.235], [0.245, 0.52], [0.53, 0.665], [0.67, 0.775]];
const ONE = [0.775, 0.85];

function h(tag, cls, parent, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  if (parent) parent.appendChild(e);
  return e;
}

let CACHE = true;
const flat = v => v.replace(/translate3d\(([^,]+),([^,]+),\s*0(px)?\)/g, 'translate($1,$2)');
function setT(e, v) {
  if (!CACHE) { e.style.transform = flat(v); return; }
  if (e._t !== v) { e._t = v; e.style.transform = v; }
}
function setO(e, v) {
  const s = v <= 0.001 ? '0' : v >= 0.999 ? '1' : v.toFixed(3);
  if (!CACHE || e._o !== s) { e._o = s; e.style.opacity = s; e.style.visibility = s === '0' ? 'hidden' : 'visible'; }
}
function setC(e, v) { if (!CACHE || e._c !== v) { e._c = v; e.style.clipPath = v; e.style.webkitClipPath = v; } }
const words = t => t.split(' ').map(w => '<span class="w"><span>' + w + '</span></span>').join(' ');

export function createIntro(stage, opts = {}) {
  let lang = opts.lang || 'da';
  if (opts.film) CACHE = false;
  const base = opts.base || '';

  const root = h('div', 'ix');
  stage.insertBefore(root, stage.firstChild);
  const canvas = h('canvas', 'ix-film', root);
  // in a film the canvas is drawn in software, with the rest of the page:
  // a GPU canvas can be caught a frame out of step with what is over it
  const ctx = canvas.getContext('2d', opts.film ? { alpha: false, willReadFrequently: true } : { alpha: false });
  const glassStill = h('img', 'ix-still', root);
  const still = h('img', 'ix-still', root);
  still.alt = ''; glassStill.alt = '';
  const scrimL = h('i', 'ix-scrim ix-scrim-l', root);
  const scrimB = h('i', 'ix-scrim ix-scrim-b', root);

  // the measurements drawn on the glass as it sets
  const ann = h('div', 'ix-ann', root);
  const dimW = h('i', 'dim dim-w', ann), dimH = h('i', 'dim dim-h', ann);
  const tick = [0, 1, 2, 3].map(() => h('i', 'tick', ann));
  const labW = h('span', 'alab alab-w', ann), labH = h('span', 'alab alab-h', ann);
  const mark = h('div', 'mk', ann, '<span>1</span><i class="mk-halo"></i>');
  const lead = h('i', 'ld', ann), labS = h('span', 'alab alab-s', ann);

  // what the glass shows when it is set: the real systems
  const screen = h('div', 'ix-screen', root);
  const apps = {
    spiis: h('div', 'app app-spiis', screen),
    mosede: h('div', 'app app-mosede', screen),
  };
  // the phone's own top: a status bar over the recordings' (which show the
  // recording dot), and the Dynamic Island where the photograph has it
  const statusBar = h('div', 'sbar', screen, '<span class="t">9:41</span><span class="ic">' +
    '<svg viewBox="0 0 18 12"><path d="M1 11h2V8H1zm4 0h2V6H5zm4 0h2V3.5H9zm4 0h2V1h-2z" fill="currentColor"/></svg>' +
    '<svg viewBox="0 0 16 12"><path d="M8 11.2 5.6 8.6a3.4 3.4 0 0 1 4.8 0zM3.4 6.4a6.5 6.5 0 0 1 9.2 0l-1.4 1.4a4.5 4.5 0 0 0-6.4 0zM1 4a9.9 9.9 0 0 1 14 0l-1.4 1.4a7.9 7.9 0 0 0-11.2 0z" fill="currentColor"/></svg>' +
    '<svg viewBox="0 0 27 12"><rect x=".5" y=".5" width="23" height="11" rx="3.5" fill="none" stroke="currentColor" opacity=".45"/><rect x="2" y="2" width="18" height="8" rx="2" fill="currentColor"/><path d="M25 4v4a2 2 0 0 0 0-4z" fill="currentColor" opacity=".45"/></svg></span>');
  const island = h('i', 'island', screen);
  const sheen = h('i', 'sheen', screen);
  const tagApp = h('div', 'apptag', root);

  const opening = h('div', 'ix-open', root);
  const cue = h('div', 'ix-cue', root);
  const sayBox = h('div', 'ix-says', root);
  const rail = h('div', 'ix-rail', root);
  const page = h('div', 'ix-page');
  stage.insertBefore(page, root.nextSibling);

  let G = null, says = [], oneSay = null, openParts = [], railCur = null;
  // frames: the compressed pictures (all of them, ~2 MB), and a small
  // window of decoded ones around where the reader is. Drawing a picture
  // that is not decoded yet decodes it on the spot and stalls the frame;
  // decoding all of them would hold ~360 MB, which a phone will not allow.
  const frames = { list: [], ok: [], scene: null, bmp: new Map(), pending: new Set(), want: 0 };
  const canBitmap = typeof createImageBitmap === 'function' && !opts.film;
  function ensureDecoded(want) {
    if (!canBitmap) return;
    frames.want = want;
    const n = frames.list.length;
    for (let d = 0; d <= 8; d++) {
      for (const j of d ? [want + d, want - d] : [want]) {
        if (j < 0 || j >= n || !frames.ok[j] || frames.bmp.has(j) || frames.pending.has(j)) continue;
        frames.pending.add(j);
        const S = frames.scene;
        createImageBitmap(frames.list[j]).then(b => {
          frames.pending.delete(j);
          if (frames.scene !== S) { b.close(); return; }
          frames.bmp.set(j, b);
          if (Math.abs(j - frames.want) <= 2 && G) render(G.lastP, G.lastA, true);
        }).catch(() => frames.pending.delete(j));
      }
    }
    for (const [j, b] of frames.bmp) if (Math.abs(j - want) > 14 && b !== frames.last) { b.close(); frames.bmp.delete(j); }
  }

  function fillApps() {
    for (const k of ['spiis', 'mosede']) {
      const el = apps[k];
      el.innerHTML = '';
      const poster = base + 'media/app-' + k + '.jpg';
      if (opts.film) {
        h('img', '', el).src = poster;
      } else {
        const v = h('video', '', el);
        v.muted = true; v.playsInline = true; v.loop = true; v.preload = 'none'; v.poster = poster;
        v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
        v.dataset.src = 'media/app-' + k;
      }
    }
  }

  function fill() {
    const T = TXT[lang];
    opening.innerHTML =
      '<p class="ix-kick">' + T.kicker + '</p>' +
      '<h2 class="ix-display"><span class="ln"><span>' + T.open[0] + '</span></span>' +
      '<span class="ln acc"><span>' + T.open[1] + '</span></span></h2>';
    openParts = [opening.querySelector('.ix-kick'), ...opening.querySelectorAll('.ln > span')];
    cue.innerHTML = '<span>' + T.cue + '</span><i></i>';
    sayBox.innerHTML = '';
    says = T.ch.map(([n, label, text]) => {
      const s = h('div', 'say', sayBox);
      s.k = h('p', 'say-k', s, '<b>' + n + '</b>' + label);
      const p = h('p', 'say-t', s, words(text));
      s.w = Array.from(p.querySelectorAll('.w > span'));
      return s;
    });
    oneSay = h('div', 'say say-one', sayBox);
    const p1 = h('p', 'say-t', oneSay, words(T.one[0]) + '<br>' + words(T.one[1]));
    oneSay.w = Array.from(p1.querySelectorAll('.w > span'));
    rail.innerHTML = '<div class="rail-in">' + T.ch.map(c => '<span>' + c[0] + '</span>').join('') + '</div><div class="rail-cur"></div>';
    railCur = rail.querySelector('.rail-cur');
    labW.textContent = T.ann.w; labH.textContent = T.ann.d; labS.textContent = T.ann.s;
    tagApp.innerHTML = '<span class="dot"></span><span class="t"></span>';
    root.querySelectorAll('*').forEach(e => { e._t = e._o = e._c = null; });
  }

  /* the film: the first and last frames at full size straight away, the
     rest in the background — coarse first, so scrubbing early already has
     something near every position */
  function loadFrames(S) {
    if (frames.scene === S) return frames.ready;
    for (const b of frames.bmp.values()) b.close();
    frames.bmp.clear(); frames.pending.clear();
    frames.scene = S; frames.list = new Array(S.n); frames.ok = new Array(S.n).fill(false);
    let firstDone;
    frames.first = new Promise(r => { firstDone = r; });
    const order = [];
    for (const step of [16, 8, 4, 2, 1]) for (let i = 0; i < S.n; i += step) if (!order.includes(i)) order.push(i);
    if (!order.includes(S.n - 1)) order.splice(1, 0, S.n - 1);
    const url = i => base + S.seq + String(i).padStart(3, '0') + '.webp';
    // with bitmaps the frames are kept as files and decoded from the file:
    // createImageBitmap on an <img> decodes on the main thread in Chrome,
    // which cost 200-330 ms frames where the film jumps into its second half
    const one = canBitmap ? (i => fetch(url(i)).then(r => (r.ok ? r.blob() : null)).then(b => {
      if (!b || frames.scene !== S) return;
      frames.list[i] = b; frames.ok[i] = true;
      if (i === 0) createImageBitmap(b).then(bm => { frames.bmp.set(0, bm); frames.last = bm; firstDone(); }).catch(firstDone);
      else if (G && G.S === S && Math.abs(i - frames.want) <= 8) ensureDecoded(frames.want);
    }).catch(() => { if (i === 0) firstDone(); })) : (i => new Promise(res => {
      const im = new Image();
      im.decoding = 'async';
      im.onload = () => {
        frames.list[i] = im; frames.ok[i] = true; res();
        if (i === 0) (im.decode ? im.decode() : Promise.resolve()).catch(() => {}).then(firstDone);
        if (G && G.S === S && Math.abs(i - frames.want) <= 8) ensureDecoded(frames.want);
      };
      im.onerror = () => { if (i === 0) firstDone(); res(); };
      im.src = url(i);
    }));
    // a few at a time, in order
    frames.ready = (async () => {
      let k = 0;
      const lanes = Array.from({ length: 6 }, async () => { while (k < order.length) await one(order[k++]); });
      await Promise.all(lanes);
    })();
    return frames.ready;
  }

  function layout(W, H) {
    const land = W / H >= 1.0;
    const S = land ? SCENES.land : SCENES.port;
    const dpr = Math.min(2, (typeof devicePixelRatio === 'number' ? devicePixelRatio : 1));
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    let s0 = Math.max(W / S.w, H / S.h);
    // a phone: a little closer, and the empty dark above the glass cropped
    // away, so the glass stands high and the words have the stone below it
    if (!land) s0 *= 1.18;
    const Dw = S.w * s0, Dh = S.h * s0;
    let ox = (W - Dw) / 2;
    // landscape: keep the glass in the right half however wide the window is
    if (land) ox = clamp(W * 0.64 - ((S.slab.l + S.slab.r) / 2) * Dw, W - Dw, 0);
    // landscape: the glass's top always clears the bar. The film's top is
    // black, so the picture can be lowered into the window without an
    // edge — as long as the stone still reaches the bottom.
    let oy = land ? (H - Dh) / 2 : H - Dh;
    if (land) {
      const want = 100 - S.slab.t * Dh;
      if (want > oy && want + Dh >= H) oy = want;
      else if (want > oy) oy = H - Dh;
    }
    // both stills are decoded as soon as they arrive: a picture this size
    // decoded on the frame it first appears stalls that frame
    for (const [im, src] of [[still, S.end], [glassStill, S.glass]]) {
      if (im.dataset.src === src) continue;
      im.dataset.src = src; im.decoding = 'async'; im.src = base + src;
      if (im.decode) im.decode().catch(() => {});
    }
    for (const im of [still, glassStill]) { im.style.width = Dw + 'px'; im.style.height = Dh + 'px'; }
    const u = land ? clamp(Math.min(W / 1440, H / 900), 0.78, 1.3) : clamp(W / 390, 0.86, 1.2);
    stage.style.setProperty('--u', u.toFixed(4));
    root.classList.toggle('is-land', land); root.classList.toggle('is-port', !land);

    // the display of the phone, where the systems will run
    const sd = S.screen, sw = (sd.r - sd.l) * Dw;
    const scr = { u: sd.l, v: sd.t, w: sw, h: (sd.b - sd.t) * Dh, r: sw * sd.rad };
    screen.style.width = scr.w + 'px'; screen.style.height = scr.h + 'px';
    screen.style.borderRadius = scr.r + 'px';
    const isl = S.island;
    island.style.left = ((isl.cx - isl.w / 2) * 100) + '%'; island.style.width = (isl.w * 100) + '%';
    island.style.top = (isl.t * 100) + '%'; island.style.height = (isl.h * 100) + '%';
    statusBar.style.height = ((isl.t * 2 + isl.h) * 100) + '%';
    screen.style.setProperty('--sw', scr.w + 'px');
    G = { W, H, land, S, Dw, Dh, ox, oy, dpr, u, scr, lastP: 0, lastA: 0 };
    loadFrames(S);
    root.querySelectorAll('*').forEach(e => { e._t = e._o = e._c = null; });
    page._c = page._o = null;
    return frames.ready;
  }

  /* a gentle push-in about the glass; the film itself never moves */
  function camera(p) {
    const k = G.land ? 1 + 0.045 * io(seg(p, 0.0, 0.5)) + 0.05 * io(seg(p, 0.5, 0.8)) : 1;
    // about the glass's top edge, so the push-in never lifts it under the bar
    const fu = (G.S.slab.l + G.S.slab.r) / 2, fv = G.S.slab.t;
    const fx = G.ox + fu * G.Dw, fy = G.oy + fv * G.Dh;
    // zoom about the glass, so it stays where it is and the room grows
    return { k, tx: fx - k * fx, ty: fy - k * fy };
  }
  const proj = (c, u, v) => [c.tx + c.k * (G.ox + u * G.Dw), c.ty + c.k * (G.oy + v * G.Dh)];

  function line(e, x0, y0, x1, y1, t) {
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
    setT(e, 'translate3d(' + x0.toFixed(2) + 'px,' + y0.toFixed(2) + 'px,0) rotate(' + Math.atan2(dy, dx).toFixed(4) + 'rad) scale(' + Math.max(0.0001, (len / 1000) * t).toFixed(5) + ',1)');
    setO(e, t > 0.01 ? 1 : 0);
  }

  function sayAt(s, p, a, b) {
    const tin = seg(p, a, a + 0.032), tout = seg(p, b - 0.028, b);
    const vis = tin > 0 && tout < 1;
    setO(s, vis ? 1 : 0);
    if (!vis) return;
    s.w.forEach((w, i) => {
      const ti = out5(seg(p, a + i * 0.0028, a + 0.026 + i * 0.0028));
      const to = io(seg(p, b - 0.028 + i * 0.0014, b - 0.008 + i * 0.0014));
      setT(w, 'translate3d(0,' + ((1 - ti) * 110 - to * 110).toFixed(1) + '%,0)');
      setO(w, ti * (1 - to));
    });
    if (s.k) {
      const k = out(seg(p, a, a + 0.03)) * (1 - seg(p, b - 0.03, b - 0.012));
      setT(s.k, 'translate3d(0,' + ((1 - k) * 8).toFixed(1) + 'px,0)');
      setO(s.k, k);
    }
  }

  function drawFilm(c, p, fade) {
    const S = G.S;
    // the first stretch of the film is a drop that hardly moves: give it
    // less of the scroll than the part where the glass actually flows
    const t = seg(p, SEQ[0], SEQ[1]);
    const ft = t < 0.5 ? t * 0.7 : 0.35 + (t - 0.5) * 1.3;
    let want = Math.round(clamp(ft) * (S.nA - 1));
    if (S.n > S.nA && p > SEQB[0]) want = S.nA + Math.round(io(seg(p, SEQB[0], SEQB[1])) * (S.n - S.nA - 1));
    ensureDecoded(want);
    // the nearest picture that is ready to draw: decoded if we can, any
    // that has arrived if we cannot
    const ready = canBitmap ? (j => frames.bmp.has(j)) : (j => frames.ok[j]);
    let i = -1;
    for (let d = 0; d < S.n && i < 0; d++) {
      if (want - d >= 0 && ready(want - d)) i = want - d;
      else if (want + d < S.n && ready(want + d)) i = want + d;
    }
    // nothing near is ready yet: hold the picture already on screen
    let im = i >= 0 ? (canBitmap ? frames.bmp.get(i) : frames.list[i]) : (canBitmap ? frames.last : frames.list[0]);
    if (canBitmap && im) frames.last = im;
    const dpr = G.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#040404'; // the film's own black, measured off its top edge
    ctx.fillRect(0, 0, G.W, G.H);
    // the fade-in is drawn into the picture rather than set on the canvas:
    // a canvas with an opacity of its own can be repainted in parts
    ctx.globalAlpha = fade;
    if (im) ctx.drawImage(im, c.tx + c.k * G.ox, c.ty + c.k * G.oy, G.Dw * c.k, G.Dh * c.k);
    ctx.globalAlpha = 1;
    return i;
  }

  function render(p, a = 1, fromLoad) {
    if (!G) return { done: false, page: null };
    p = clamp(p); G.lastP = p; G.lastA = a;
    const land = G.land, T = TXT[lang];
    const c = camera(p);

    /* ----- the film, and the sharp still it ends on ----- */
    drawFilm(c, p, out(seg(a, 0, 0.6)));
    const stT = ('translate3d(' + (c.tx + c.k * G.ox).toFixed(2) + 'px,' + (c.ty + c.k * G.oy).toFixed(2) + 'px,0) scale(' + c.k.toFixed(4) + ')');
    // the glass is held sharp while it is measured, the phone once it is made;
    // a still that is not showing is not moved either
    const oG = seg(p, SEQ[1] - 0.008, SEQ[1] + 0.008) * (1 - seg(p, SEQB[0] - 0.004, SEQB[0] + 0.004));
    const oP = seg(p, SEQB[1] - 0.006, SEQB[1] + 0.008);
    if (oG > 0.001 || !CACHE) setT(glassStill, stT);
    if (oP > 0.001 || !CACHE) setT(still, stT);
    setO(glassStill, oG);
    setO(still, oP);
    if (fromLoad) return;
    setO(scrimB, land ? 0.6 + 0.4 * seg(p, 0.05, 0.12) : 1);
    setO(scrimL, land ? 1 : 0);

    /* ----- the opening words ----- */
    openParts.forEach((e, i) => {
      const tin = out5(seg(a, 0.3 + i * 0.09, 0.8 + i * 0.09));
      const tout = io(seg(p, 0.012 + i * 0.006, 0.06 + i * 0.006));
      const y = i === 0 ? (1 - tin) * 10 - tout * 14 : (1 - tin) * 110 - tout * 110;
      setT(e, 'translate3d(0,' + y.toFixed(1) + (i === 0 ? 'px' : '%') + ',0)');
      setO(e, tin * (1 - tout));
    });
    setO(cue, out(seg(a, 0.8, 1)) * (1 - seg(p, 0, 0.03)));

    /* ----- chapters ----- */
    CH.forEach(([s0, s1], i) => sayAt(says[i], p, s0, s1));
    sayAt(oneSay, p, ONE[0], ONE[1]);
    setO(rail, land ? out(seg(p, 0.06, 0.09)) * (1 - seg(p, 0.77, 0.8)) : 0);
    if (land) {
      let at = 0;
      CH.forEach(([s0], i) => { if (p >= s0 - 0.01) at = i; });
      const prev = Math.max(0, at - 1), f = io(seg(p, CH[at][0] - 0.012, CH[at][0] + 0.008));
      const pos = at === 0 ? 0 : lerp(prev, at, f);
      setT(railCur, 'translate3d(0,' + (pos * 48).toFixed(2) + 'px,0)');
      const lab = T.ch[at][1];
      if (railCur._lbl !== lab) { railCur._lbl = lab; railCur.innerHTML = '<span class="mono">' + T.ch[at][0] + '</span><b>' + lab + '</b>'; }
    }

    /* ----- the glass is measured as it sets ----- */
    const sl = G.S.slab;
    const [x0, y0] = proj(c, sl.l, sl.t), [x1, y1] = proj(c, sl.r, sl.b);
    const aIn = seg(p, 0.3, 0.41), aOut = 1 - seg(p, 0.418, 0.438);
    const gapY = 26 * G.u, gapX = 30 * G.u;
    const wT = out(seg(aIn, 0, 0.45)) * aOut, hT = out(seg(aIn, 0.15, 0.6)) * aOut;
    const dy0 = y1 + gapY;
    line(dimW, x0, dy0, x1, dy0, land ? wT : 0);
    line(dimH, x1 + gapX, y0, x1 + gapX, y1, land ? hT : 0);
    const tk = [[x0, dy0], [x1, dy0], [x1 + gapX, y0], [x1 + gapX, y1]];
    tick.forEach((e, i) => {
      const t = land ? (i < 2 ? wT : hT) : 0;
      const vert = i < 2;
      setT(e, 'translate3d(' + tk[i][0].toFixed(2) + 'px,' + tk[i][1].toFixed(2) + 'px,0)' + (vert ? '' : ' rotate(90deg)'));
      setO(e, t > 0.98 ? aOut : 0);
    });
    setT(labW, 'translate3d(' + ((x0 + x1) / 2).toFixed(2) + 'px,' + (dy0 + 10).toFixed(2) + 'px,0) translate(-50%,0)');
    setO(labW, land ? out(seg(aIn, 0.35, 0.6)) * aOut : 0);
    setT(labH, 'translate3d(' + (x1 + gapX + 10).toFixed(2) + 'px,' + ((y0 + y1) / 2).toFixed(2) + 'px,0) rotate(-90deg) translate(-50%,0)');
    setO(labH, land ? out(seg(aIn, 0.5, 0.75)) * aOut : 0);
    const [gx, gy] = proj(c, G.S.glint[0], G.S.glint[1]);
    const mp = out5(seg(aIn, 0.55, 0.8));
    setT(mark, 'translate3d(' + gx.toFixed(2) + 'px,' + gy.toFixed(2) + 'px,0) scale(' + Math.max(0.0001, mp).toFixed(4) + ')');
    setO(mark, clamp(mp * 3) * aOut);
    const halo = mark.lastChild, hp = seg(aIn, 0.7, 1);
    setT(halo, 'scale(' + (1 + 1.3 * out(hp)).toFixed(4) + ')');
    setO(halo, hp > 0 && hp < 1 ? 0.55 * (1 - out(hp)) : 0);
    const lx = land ? x1 + gapX + 30 : gx - 30, ly = land ? gy - 70 * G.u : gy;
    line(lead, gx, gy, land ? lx - 4 : lx + 4, ly, out(seg(aIn, 0.7, 0.9)) * aOut);
    setT(labS, 'translate3d(' + lx.toFixed(2) + 'px,' + ly.toFixed(2) + 'px,0) translate(' + (land ? '0' : '-100%') + ',-50%)');
    setO(labS, out(seg(aIn, 0.8, 1)) * aOut);

    /* ----- the systems, inside the glass ----- */
    const sc = G.scr;
    const [sx, sy] = proj(c, sc.u, sc.v);
    const on = out5(seg(p, 0.52, 0.555));
    setT(screen, 'translate3d(' + sx.toFixed(2) + 'px,' + sy.toFixed(2) + 'px,0) scale(' + (c.k * lerp(0.965, 1, on)).toFixed(4) + ')');
    setO(screen, on * (1 - seg(p, 0.83, 0.86)));
    // Mosede flows in over Spiis from the bottom, the way the glass set
    const wipe = io(seg(p, 0.655, 0.695));
    setC(apps.mosede, 'inset(' + ((1 - wipe) * 100).toFixed(2) + '% 0 0 0 round ' + (sc.r * 0.9).toFixed(1) + 'px)');
    setO(apps.mosede, wipe > 0 ? 1 : 0);
    setO(sheen, 1);
    // which system it is, on a label under the glass
    const tg = out(seg(p, 0.54, 0.57)) * (1 - seg(p, 0.76, 0.79));
    const which = p < 0.675 ? 'spiis' : 'mosede';
    const tt = tagApp.lastChild;
    if (tt._w !== which + lang) { tt._w = which + lang; tt.textContent = T.app[which]; }
    // the system's name, under the phone
    const tagY = sy + sc.h * c.k + 16 * G.u;
    setT(tagApp, 'translate3d(' + (sx + sc.w * c.k / 2).toFixed(2) + 'px,' + tagY.toFixed(2) + 'px,0) translate(-50%,0)');
    setO(tagApp, tg);

    /* ----- the face of the glass opens into the page ----- */
    const z = io(seg(p, 0.8, 0.935));
    const sw = sc.w * c.k, sh = sc.h * c.k;
    const top = lerp(sy, 0, z), left = lerp(sx, 0, z);
    const right = lerp(G.W - (sx + sw), 0, z), bottom = lerp(G.H - (sy + sh), 0, z);
    const rad = lerp(sc.r * c.k, 0, out(z));
    setC(page, 'inset(' + top.toFixed(1) + 'px ' + right.toFixed(1) + 'px ' + bottom.toFixed(1) + 'px ' + left.toFixed(1) + 'px round ' + rad.toFixed(1) + 'px)');
    setO(page, p >= 0.8 ? 1 : 0);

    const done = p >= 0.935;
    root.classList.toggle('gone', done);
    return { done, page: { top, left, right: G.W - right, bottom: G.H - bottom }, wantApps: p > 0.36 && p < 0.86 };
  }

  /* the recordings only load when the glass is about to show them */
  function playApps(want) {
    for (const el of Object.values(apps)) {
      const v = el.querySelector('video');
      if (!v) continue;
      if (want && !v._loaded) {
        // cut to the part worth showing (Mosede's opens on a splash); webm
        // first, because Chromium on Linux cannot decode the mp4
        const src = base + v.dataset.src;
        v.innerHTML = '<source src="' + src + '.webm" type="video/webm"><source src="' + src + '.mp4" type="video/mp4">';
        v.load();
        v._loaded = true;
      }
      if (want && v._loaded && v.paused) v.play().catch(() => {});
      if (!want && v._loaded && !v.paused) v.pause();
    }
  }

  function setLang(l) {
    lang = TXT[l] ? l : 'da';
    fill();
    if (G) layout(G.W, G.H);
  }

  fill(); fillApps();
  return { layout, render, setLang, playApps, get geometry() { return G; }, get frames() { return frames; } };
}
