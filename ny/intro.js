/* Lesreg — the opening, on Liquid Atelier 3.2.

   One function of one number, as before: render(p, a) draws everything
   for a scroll position p (0..1) and a load clock a (0..1), with no state
   carried between frames. It plays backwards as well as forwards, and the
   same file is filmed frame by frame by Remotion.

   The world is a Higgsfield photograph of a harbour restaurant at blue
   hour, before opening. Over it, the system is shown the way the library
   says software is shown: Product windows — a clear Rim around a solid
   porcelain core — that float in the room, each tied to a place in the
   picture by an ultramarine Annotation marker. Ultramarine means "now",
   and nothing else. Then the windows fold into one plate, and the plate's
   porcelain core opens out into the page.

   Rim has no blur in the library (Glass radius 0), so the windows cost
   nothing to move. Only transform, opacity and one clip-path are written
   per frame. */

const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const seg = (p, a, b) => clamp((p - a) / (b - a));
const out = t => 1 - Math.pow(1 - t, 3);
const out5 = t => 1 - Math.pow(1 - t, 5);
const io = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const back = (t, s = 1.5) => {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const c = s + 1;
  return 1 + c * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
};
const lerp = (a, b, t) => a + (b - a) * t;

export const TXT = {
  da: {
    kicker: 'Lesreg · Softwarehus',
    open: ['Stille systemer', 'til travle aftener.'],
    scene: 'Scene 01 — blå time, før åbning',
    cue: 'Scroll',
    ch: [
      ['01', 'Bestilling', 'En bestilling kommer ind.'],
      ['02', 'Køkken', 'Køkkenskærmen har den med det samme.'],
      ['03', 'Booking', 'Bookingen ligger i samme system.'],
      ['04', 'Skærme', 'Og menuen over disken rettes ét sted.'],
    ],
    one: ['Ét system.', 'Bygget af ét hus.'],
    house: { label: 'Lesreg', a: 'Ét hus. Én regning.', b: 'Ét ansvar.' },
    order: { name: 'Bestilling', ctx: 'Ny · lige nu', rows: ['2 × Dagens ret', '1 × Kaffe'], meta: 'Til afhentning · 18:30' },
    kitchen: { name: 'Køkkenskærm', ctx: '3 i kø', no: '#214', rows: ['2 × Dagens ret', '1 × Kaffe'], meta: '00:12' },
    booking: { name: 'Booking', ctx: 'I aften', rows: [['18:00', '4 pers.'], ['19:30', '2 pers.'], ['20:00', '6 pers.']], fresh: 'Ny' },
    menu: { name: 'Skærm over disken', ctx: 'Skærm 2', rows: ['Dagens ret', 'Smørrebrød', 'Kaffe & kage'], hot: 'Opdateret' },
  },
  en: {
    kicker: 'Lesreg · Software house',
    open: ['Quiet systems', 'for busy evenings.'],
    scene: 'Scene 01 — blue hour, before opening',
    cue: 'Scroll',
    ch: [
      ['01', 'Order', 'An order comes in.'],
      ['02', 'Kitchen', 'The kitchen screen has it instantly.'],
      ['03', 'Booking', 'The bookings live in the same system.'],
      ['04', 'Screens', 'And the menu screens are edited in one place.'],
    ],
    one: ['One system.', 'Built by one house.'],
    house: { label: 'Lesreg', a: 'One house. One invoice.', b: 'One responsibility.' },
    order: { name: 'Order', ctx: 'New · just now', rows: ["2 × Today's special", '1 × Coffee'], meta: 'Pick-up · 18:30' },
    kitchen: { name: 'Kitchen screen', ctx: '3 in queue', no: '#214', rows: ["2 × Today's special", '1 × Coffee'], meta: '00:12' },
    booking: { name: 'Booking', ctx: 'Tonight', rows: [['18:00', '4 guests'], ['19:30', '2 guests'], ['20:00', '6 guests']], fresh: 'New' },
    menu: { name: 'Screen over the counter', ctx: 'Screen 2', rows: ["Today's special", 'Open sandwich', 'Coffee & cake'], hot: 'Updated' },
  },
};

/* ---------- the two pictures and where things are in them ----------
   Anchors are in picture coordinates (0..1). Windows are placed in
   fractions of the stage, their width in --u units. */
const SCENES = {
  land: {
    src: 'media/havn-16x9', w: 1920, h: 1086,
    focus: [0.5, 0.56],
    anchors: { order: [0.66, 0.47], kitchen: [0.2, 0.585], booking: [0.745, 0.665], menu: [0.33, 0.52] },
    wins: { order: [0.655, 0.15, 300], kitchen: [0.075, 0.2, 300], booking: [0.615, 0.585, 300], menu: [0.375, 0.115, 280] },
  },
  port: {
    src: 'media/havn-9x16', w: 1080, h: 1910,
    focus: [0.42, 0.58],
    anchors: { order: [0.56, 0.5], kitchen: [0.24, 0.63], booking: [0.88, 0.69], menu: [0.31, 0.45] },
    wins: { order: [0, 0.135, 300], kitchen: [0, 0.135, 300], booking: [0, 0.135, 300], menu: [0, 0.135, 300] },
  },
};
const KEYS = ['order', 'kitchen', 'booking', 'menu'];
const CH0 = 0.1, CHL = 0.13; // chapter i runs from CH0 + i*CHL, for CHL

function h(tag, cls, parent, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  if (parent) parent.appendChild(e);
  return e;
}

/* write-through caches: a frame only touches what changed. A film is
   rendered out of order and can't trust what the last frame left
   behind, so it turns them off — and draws in 2D, because a 3D transform
   puts a part on a layer of its own that a screenshot can catch before it
   is painted. */
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
const tr = (x, y, s = 1) =>
  'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0)' + (s === 1 ? '' : ' scale(' + s.toFixed(4) + ')');

const words = t => t.split(' ').map(w => '<span class="w"><span>' + w + '</span></span>').join(' ');
const dot = '<i class="now" aria-hidden="true"></i>';

export function createIntro(stage, opts = {}) {
  let lang = opts.lang || 'da';
  if (opts.film) CACHE = false;

  const root = h('div', 'ix');
  stage.insertBefore(root, stage.firstChild);

  // the picture, sharp and out of focus, moved by one camera
  const cam = h('div', 'ix-cam', root);
  const pic = h('img', 'ix-pic', cam);
  const soft = h('img', 'ix-pic ix-soft', cam);
  pic.alt = ''; soft.alt = '';
  const scrimTop = h('i', 'ix-scrim ix-scrim-top', root);
  const scrimBot = h('i', 'ix-scrim ix-scrim-bot', root);
  const dim = h('i', 'ix-dim', root);

  const lineBox = h('div', 'ix-lines', root);
  const markBox = h('div', 'ix-marks', root);
  const winBox = h('div', 'ix-wins', root);

  const opening = h('div', 'ix-open', root);
  const sceneTag = h('div', 'ix-tag', root);
  const sayBox = h('div', 'ix-says', root);
  const rail = h('div', 'ix-rail', root);
  const house = h('div', 'win ix-house', root);
  // the page is a sibling of the opening, so it outlives it
  const page = h('div', 'ix-page');
  stage.insertBefore(page, root.nextSibling);

  const P = {};
  KEYS.forEach((k, i) => {
    P[k] = {
      m: h('div', 'mk', markBox, '<span>' + (i + 1) + '</span><i class="mk-halo"></i>'),
      l: h('i', 'ld', lineBox),
      w: h('div', 'win win-' + k, winBox),
    };
  });

  let G = null, says = [], oneSay = null, openParts = [], railCur = null;

  function fill() {
    const T = TXT[lang];
    opening.innerHTML =
      '<p class="ix-kick">' + T.kicker + '</p>' +
      '<h2 class="ix-display"><span class="ln"><span>' + T.open[0] + '</span></span>' +
      '<span class="ln acc"><span>' + T.open[1] + '</span></span></h2>';
    openParts = [opening.querySelector('.ix-kick'), ...opening.querySelectorAll('.ln > span')];
    sceneTag.innerHTML = '<span>' + T.scene + '</span><span class="cue">' + T.cue + '<i></i></span>';

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

    rail.innerHTML = '<div class="rail-in">' + T.ch.map(c => '<span>' + c[0] + '</span>').join('') + '</div>' +
      '<div class="rail-cur"></div>';
    railCur = rail.querySelector('.rail-cur');

    const O = T.order, K = T.kitchen, B = T.booking, M = T.menu;
    const bar = (name, ctx, live) => '<div class="bar"><b>' + name + '</b><span class="ctx">' + (live ? dot : '') + ctx + '</span></div>';
    P.order.w.innerHTML = '<div class="core">' + bar(O.name, O.ctx, true) +
      '<div class="body">' + O.rows.map(r => '<p class="row">' + r + '</p>').join('') +
      '<p class="meta">' + O.meta + '</p></div></div>';
    P.kitchen.w.innerHTML = '<div class="core">' + bar(K.name, K.ctx) +
      '<div class="body"><div class="tk"><p class="fig">' + K.no + '</p><p class="meta">' + dot + K.meta + '</p></div>' +
      K.rows.map(r => '<p class="row">' + r + '</p>').join('') + '</div></div>';
    P.booking.w.innerHTML = '<div class="core">' + bar(B.name, B.ctx) +
      '<div class="body">' + B.rows.map((r, i) => '<p class="led' + (i === 1 ? ' fresh' : '') + '"><span class="mono">' + r[0] + '</span><span>' + r[1] + '</span>' +
        (i === 1 ? '<span class="tag">' + dot + B.fresh + '</span>' : '') + '</p>').join('') + '</div></div>';
    P.menu.w.innerHTML = '<div class="core">' + bar(M.name, M.ctx) +
      '<div class="body">' + M.rows.map((r, i) => '<p class="mrow' + (i === 0 ? ' hot' : '') + '"><span>' + r + '</span>' +
        (i === 0 ? '<span class="tag">' + M.hot + '</span>' : '<i></i>') + '</p>').join('') + '</div></div>';
    KEYS.forEach(k => { P[k].parts = Array.from(P[k].w.querySelectorAll('.bar, .body > *')); });
    P.kitchen.ev = P.kitchen.w.querySelector('.tk');
    P.booking.ev = P.booking.w.querySelector('.led.fresh');
    P.menu.ev = P.menu.w.querySelector('.mrow.hot .tag');
    P.order.ev = P.order.w.querySelector('.ctx');

    house.innerHTML = '<div class="core"><p class="lbl">' + T.house.label + '</p>' +
      '<p class="h2">' + T.house.a + '</p><p class="acc">' + T.house.b + '</p></div>';

    root.querySelectorAll('*').forEach(e => { e._t = e._o = e._c = null; });
  }

  function layout(W, H) {
    const land = W / H >= 1.05;
    const S = land ? SCENES.land : SCENES.port;
    const src = (opts.base || '') + S.src;
    if (pic.dataset.src !== src) {
      pic.dataset.src = src;
      pic.src = src + (opts.jpg ? '.jpg' : '.webp');
      soft.src = src + '-glas.jpg';
    }
    const s0 = Math.max(W / S.w, H / S.h);
    const Dw = S.w * s0, Dh = S.h * s0, ox = (W - Dw) / 2, oy = (H - Dh) / 2;
    for (const im of [pic, soft]) {
      im.style.left = ox + 'px'; im.style.top = oy + 'px';
      im.style.width = Dw + 'px'; im.style.height = Dh + 'px';
    }
    const u = land ? clamp(Math.min(W / 1440, H / 900), 0.78, 1.3) : clamp(W / 390, 0.82, 1.2);
    stage.style.setProperty('--u', u.toFixed(4));
    root.classList.toggle('is-land', land);
    root.classList.toggle('is-port', !land);

    G = { W, H, land, S, Dw, Dh, ox, oy, u, win: {} };
    KEYS.forEach(k => {
      const [fx, fy, w] = S.wins[k];
      const ww = Math.min(w * u, W - 40);
      const x = land ? fx * W : W / 2 - ww / 2;
      const y = land ? fy * H : 84 + fy * 0;
      const e = P[k].w;
      e.style.left = x + 'px'; e.style.top = y + 'px'; e.style.width = ww + 'px';
      G.win[k] = { x, y, w: ww, h: 0 };
    });
    // heights come from content: read once, here, never per frame
    KEYS.forEach(k => { G.win[k].h = P[k].w.offsetHeight; });

    const hw = land ? Math.min(560 * u, W - 96) : W - 40;
    house.style.width = hw + 'px';
    house.style.left = (W / 2 - hw / 2) + 'px';
    const hh = house.offsetHeight;
    const hy = H * (land ? 0.46 : 0.42) - hh / 2;
    house.style.top = hy + 'px';
    G.house = { x: W / 2 - hw / 2, y: hy, w: hw, h: hh, cx: W / 2, cy: hy + hh / 2 };

    root.querySelectorAll('*').forEach(e => { e._t = e._o = e._c = null; });
    page._c = null; page._o = null;
  }

  /* the camera: a zoom k about a point C of the picture, kept inside it */
  function camera(p, a) {
    const S = G.S;
    const settle = 1 + 0.07 * (1 - out(seg(a, 0, 1)));
    const k = settle * (1 + 0.1 * io(seg(p, 0.02, 0.6)) + 0.06 * io(seg(p, 0.6, 0.86)));
    const m = io(seg(p, 0.02, 0.6));
    const fx = G.ox + S.focus[0] * G.Dw, fy = G.oy + S.focus[1] * G.Dh;
    let Cx = lerp(G.W / 2, fx, m), Cy = lerp(G.H / 2, fy, m);
    const hx = G.W / (2 * k), hy = G.H / (2 * k);
    Cx = clamp(Cx, G.ox + hx, G.ox + G.Dw - hx);
    Cy = clamp(Cy, G.oy + hy, G.oy + G.Dh - hy);
    return { k, tx: G.W / 2 - k * Cx, ty: G.H / 2 - k * Cy, Cx, Cy };
  }
  const proj = (c, u, v) => [c.tx + c.k * (G.ox + u * G.Dw), c.ty + c.k * (G.oy + v * G.Dh)];

  function sayAt(s, p, a, b) {
    const tin = seg(p, a, a + 0.035), tout = seg(p, b - 0.03, b);
    const vis = tin > 0 && tout < 1;
    setO(s, vis ? 1 : 0);
    if (!vis) return;
    s.w.forEach((w, i) => {
      const ti = out5(seg(p, a + i * 0.003, a + 0.028 + i * 0.003));
      const to = io(seg(p, b - 0.03 + i * 0.0015, b - 0.008 + i * 0.0015));
      setT(w, 'translate3d(0,' + ((1 - ti) * 105 - to * 105).toFixed(1) + '%,0)');
      setO(w, ti * (1 - to));
    });
    if (s.k) {
      const k = out(seg(p, a, a + 0.03)) * (1 - seg(p, b - 0.03, b - 0.012));
      setT(s.k, 'translate3d(0,' + ((1 - k) * 8).toFixed(1) + 'px,0)');
      setO(s.k, k);
    }
  }

  function render(p, a = 1) {
    if (!G) return { paper: 0, done: false, page: null };
    p = clamp(p);
    const land = G.land;

    /* ----- the room ----- */
    const c = camera(p, a);
    setT(cam, 'translate3d(' + c.tx.toFixed(2) + 'px,' + c.ty.toFixed(2) + 'px,0) scale(' + c.k.toFixed(4) + ')');
    setO(cam, out(seg(a, 0, 0.55)));
    setO(soft, io(seg(p, 0.76, 0.88)));
    setO(scrimBot, lerp(0.62, 1, io(seg(p, 0, 0.1))));
    setO(scrimTop, 1);
    setO(dim, 0.1 + 0.32 * io(seg(p, 0.6, 0.72)));

    /* ----- the opening words ----- */
    const ex = io(seg(p, 0, 0.075));
    openParts.forEach((e, i) => {
      const tin = out5(seg(a, 0.35 + i * 0.08, 0.85 + i * 0.08));
      const tout = io(seg(p, i * 0.006, 0.06 + i * 0.006));
      const y = i === 0 ? (1 - tin) * 10 - tout * 14 : (1 - tin) * 104 - tout * 104;
      setT(e, 'translate3d(0,' + y.toFixed(1) + (i === 0 ? 'px' : '%') + ',0)');
      setO(e, tin * (1 - tout));
    });
    setO(sceneTag, out(seg(a, 0.8, 1)) * (1 - ex));

    // where the room's middle has moved to, for the windows' parallax
    const midX = c.tx + c.k * (G.ox + G.Dw / 2) - G.W / 2;
    const midY = c.ty + c.k * (G.oy + G.Dh / 2) - G.H / 2;

    /* ----- four chapters ----- */
    KEYS.forEach((k, i) => {
      const s0 = CH0 + i * CHL;
      const X = P[k], wb = G.win[k];
      const [mx, my] = proj(c, G.S.anchors[k][0], G.S.anchors[k][1]);

      // the marker, pinned to the room
      const pop = back(seg(p, s0, s0 + 0.022), 2);
      const gone = seg(p, 0.64 + i * 0.008, 0.7 + i * 0.008);
      setT(X.m, tr(mx, my, Math.max(0.0001, pop * (1 - 0.6 * gone))));
      setO(X.m, clamp(pop * 3) * (1 - gone));
      const halo = X.m.lastChild, hp = seg(p, s0 + 0.01, s0 + 0.05);
      setT(halo, 'scale(' + (1 + 1.4 * out(hp)).toFixed(4) + ')');
      setO(halo, hp > 0 && hp < 1 ? 0.55 * (1 - out(hp)) : 0);

      // the window floats a little with the camera, as if nearer to us
      const px = midX * 0.12, py = midY * 0.12;
      const win = out5(seg(p, s0 + 0.026, s0 + 0.05));
      // a phone has room for one window: it folds back into its marker
      // when the next chapter starts
      const dock = !land && i < 3 ? io(seg(p, s0 + CHL - 0.022, s0 + CHL + 0.004)) : 0;
      // and then all of them fold into one
      const merge = io(seg(p, 0.64 + i * 0.01, 0.71 + i * 0.01));

      const wcx = wb.x + wb.w / 2, wcy = wb.y + wb.h / 2;
      let dx = px, dy = py, sc = lerp(0.94, 1, win), o = win;
      if (dock > 0) {
        dx = lerp(px, mx - wcx, dock); dy = lerp(py, my - wcy, dock);
        sc *= 1 - 0.88 * dock; o = win * (1 - out(seg(dock, 0.4, 1)));
      }
      if (merge > 0) {
        // docked windows come back out of their markers to be folded in
        const ox = land ? px : mx - wcx, oy = land ? py : my - wcy;
        dx = lerp(ox, G.house.cx - wcx, merge);
        dy = lerp(oy, G.house.cy - wcy, merge);
        sc = lerp(land ? 1 : 0.2, 0.5, merge);
        o = (land ? 1 : clamp(merge * 4)) * (1 - seg(merge, 0.55, 1)) * (p > s0 ? 1 : 0);
      }
      setT(X.w, tr(dx, dy, sc));
      setO(X.w, o);

      // what is on the window settles a beat after the window — but it is
      // never missing: an empty porcelain card reads as grey on the room
      X.parts.forEach((e, j) => {
        const t = out5(seg(p, s0 + 0.026 + j * 0.003, s0 + 0.056 + j * 0.003));
        setT(e, 'translate3d(0,' + ((1 - t) * 10).toFixed(1) + 'px,0)');
      });
      // the thing that is happening now
      const ev = seg(p, s0 + 0.066, s0 + 0.086);
      X.w.classList.toggle('live', ev > 0.3 && merge === 0);
      if (k === 'kitchen') setT(X.ev, 'translate3d(' + ((1 - out5(ev)) * -18).toFixed(1) + 'px,0,0)');
      if (k === 'booking') setT(X.ev, 'translate3d(' + ((1 - out5(ev)) * 22).toFixed(1) + 'px,0,0)');
      if (k !== 'order') setO(X.ev, out(ev) * (X.parts.length ? 1 : 1));

      // the leader: marker to the nearest edge of the window
      const L = X.l;
      const vx = wb.x + dx + wb.w * (1 - sc) / 2, vy = wb.y + dy + wb.h * (1 - sc) / 2;
      const ex2 = clamp(mx, vx + 14, vx + wb.w * sc - 14), ey2 = clamp(my, vy + 14, vy + wb.h * sc - 14);
      const ddx = ex2 - mx, ddy = ey2 - my, len = Math.hypot(ddx, ddy);
      const draw = out(seg(p, s0 + 0.012, s0 + 0.04)) * (1 - Math.max(dock, merge));
      setT(L, 'translate3d(' + mx.toFixed(2) + 'px,' + my.toFixed(2) + 'px,0) rotate(' + Math.atan2(ddy, ddx).toFixed(4) + 'rad) scale(' + Math.max(0.0001, (len / 1000) * draw).toFixed(5) + ',1)');
      setO(L, draw > 0.01 && len > 18 ? 1 : 0);

      sayAt(says[i], p, s0 + 0.008, s0 + CHL - 0.004);
    });
    sayAt(oneSay, p, 0.625, 0.715);

    /* the rail: which chapter this is */
    setO(rail, land ? out(seg(p, 0.08, 0.11)) * (1 - seg(p, 0.62, 0.66)) : 0);
    if (land) {
      const at = clamp((p - CH0) / CHL, 0, 3.999);
      const i = Math.floor(at), f = at - i;
      const pos = i + io(seg(f, 0.88, 1));
      setT(railCur, 'translate3d(0,' + (pos * 48).toFixed(2) + 'px,0)');
      const T = TXT[lang].ch[Math.min(3, Math.round(pos))];
      if (railCur._lbl !== T[1]) { railCur._lbl = T[1]; railCur.innerHTML = '<span class="mono">' + T[0] + '</span><b>' + T[1] + '</b>'; }
    }

    /* ----- one house ----- */
    const hp = back(seg(p, 0.7, 0.745), 1.2);
    const hOut = seg(p, 0.8, 0.825);
    setT(house, tr(0, (1 - hp) * 14, lerp(0.94, 1, hp)));
    setO(house, clamp(hp * 2.5) * (1 - seg(p, 0.83, 0.86)));
    const hc = house.firstChild.children;
    setO(hc[0], out(seg(p, 0.72, 0.75)) * (1 - hOut));
    setO(hc[1], out(seg(p, 0.73, 0.76)) * (1 - hOut));
    setO(hc[2], out(seg(p, 0.745, 0.775)) * (1 - hOut));

    /* ----- the core opens into the page ----- */
    const z = io(seg(p, 0.8, 0.935));
    const r0 = G.house, inset = 5 * G.u + 1;
    const top = lerp(r0.y + inset, 0, z), left = lerp(r0.x + inset, 0, z);
    const right = lerp(G.W - (r0.x + r0.w - inset), 0, z), bottom = lerp(G.H - (r0.y + r0.h - inset), 0, z);
    const rad = lerp(18 * G.u, 0, out(z));
    setC(page, 'inset(' + top.toFixed(1) + 'px ' + right.toFixed(1) + 'px ' + bottom.toFixed(1) + 'px ' + left.toFixed(1) + 'px round ' + rad.toFixed(1) + 'px)');
    setO(page, p >= 0.8 ? 1 : 0);

    const done = p >= 0.935;
    root.classList.toggle('gone', done);
    return { paper: z, done, page: { top, left, right: G.W - right, bottom: G.H - bottom } };
  }

  function setLang(l) {
    lang = TXT[l] ? l : 'da';
    fill();
    if (G) layout(G.W, G.H);
  }

  fill();
  return { layout, render, setLang, get geometry() { return G; } };
}
