/* Lesreg — the opening.

   One function of one number. render(p, a) draws the whole intro for a
   scroll position p (0..1) and a load clock a (0..1), and nothing else
   moves it: no timers, no state carried from the previous frame. That is
   why it plays exactly as well backwards as forwards, and why the same
   file can be filmed frame by frame (Remotion) as well as scrolled.

   Everything is built from the mark. The mark is a square with its top
   right corner cut off and an L inside. So: the L throws out the two axes
   the whole diagram is laid on, every route turns at right angles, the
   order that travels through the system is a tiny copy of the mark, the
   system folds back into the mark, and the mark opens into the page.

   Only transform and opacity are written per frame. Lines and boxes are
   real size and are only ever scaled down, so nothing is upscaled and
   nothing needs a filter. */

const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const seg = (p, a, b) => clamp((p - a) / (b - a));
const out = t => 1 - Math.pow(1 - t, 3);
const out5 = t => 1 - Math.pow(1 - t, 5);
const io = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const back = (t, s = 1.6) => {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const c = s + 1;
  return 1 + c * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
};
const lerp = (a, b, t) => a + (b - a) * t;

export const TXT = {
  da: {
    sub: 'Softwarehus',
    cue: 'Scroll',
    say: [
      ['01', 'Bestilling', 'En kunde bestiller på telefonen.'],
      ['02', 'Køkken', 'Køkkenskærmen har den med det samme.'],
      ['03', 'Booking', 'Bookingen ligger i samme system.'],
      ['04', 'Skærme', 'Og menuen over disken rettes ét sted.'],
      ['', '', 'Ét system. Bygget af ét hus.'],
    ],
    house: ['Ét hus.', 'Én regning.', 'Ét ansvar.'],
    phone: { title: 'Menu', items: ['Dagens ret', 'Smørrebrød', 'Kaffe'], btn: 'Bestil' },
    kitchen: { label: 'Køkken', lines: ['2 × Dagens ret', '1 × Kaffe'], now: 'Ny' },
    booking: { label: 'Booking', rows: ['18:00 · 4 pers.', '19:30 · 2 pers.', '20:00 · 6 pers.'] },
    menu: { label: 'Over disken', rows: ['Dagens ret', 'Smørrebrød', 'Kaffe & kage'] },
  },
  en: {
    sub: 'Software house',
    cue: 'Scroll',
    say: [
      ['01', 'Order', 'A customer orders on their phone.'],
      ['02', 'Kitchen', 'The kitchen screen has it instantly.'],
      ['03', 'Booking', 'The bookings live in the same system.'],
      ['04', 'Screens', 'And the menu screens are edited in one place.'],
      ['', '', 'One system. Built by one house.'],
    ],
    house: ['One house.', 'One invoice.', 'One responsibility.'],
    phone: { title: 'Menu', items: ["Today's special", 'Open sandwich', 'Coffee'], btn: 'Order' },
    kitchen: { label: 'Kitchen', lines: ["2 × Today's special", '1 × Coffee'], now: 'New' },
    booking: { label: 'Booking', rows: ['18:00 · 4 guests', '19:30 · 2 guests', '20:00 · 6 guests'] },
    menu: { label: 'Over the counter', rows: ["Today's special", 'Open sandwich', 'Coffee & cake'] },
  },
};

/* ---------- the two compositions ----------
   Everything is laid out in grid units from O, the point where the two
   axes cross — the outer corner of the L. Rects are [x0, y0, x1, y1]. */
const LAND = {
  bounds: { x0: -7, x1: 7, y0: -5.3, y1: 3.3 },
  phone: [-6, -3, -4, 1],
  kitchen: [-1, -1, 2, 1],
  booking: [4, -4, 7, -2],
  menu: [4, 1, 7, 3],
  r1: [[-4, 0], [-1, 0]],
  r2: [[1, -1], [1, -3], [4, -3]],
  r3: [[2, 0], [3, 0], [3, 2], [4, 2]],
  say: { x: -7, bottom: -3.35, w: 10.6 },
};
const PORT = {
  bounds: { x0: -2.9, x1: 2.9, y0: -3.4, y1: 10 },
  phone: [-2.8, 0.6, -0.8, 4.2],
  kitchen: [-1.5, 5.2, 1.5, 7],
  booking: [0.25, 8.2, 2.9, 10],
  menu: [-2.9, 8.2, -0.25, 10],
  r1: [[-0.8, 2.4], [0, 2.4], [0, 5.2]],
  r2: [[0.6, 7], [0.6, 7.6], [1.6, 7.6], [1.6, 8.2]],
  r3: [[-0.6, 7], [-0.6, 7.6], [-1.6, 7.6], [-1.6, 8.2]],
  say: { x: -2.9, bottom: -0.4, w: 5.8 },
};

/* mark geometry, in the 128-unit drawing from brand/lesreg-mark.svg */
const MK = { lx: 44 / 128, ly: 28 / 128, lw: 18 / 128, lh: 80 / 128, hy: 90 / 128, hw: 56 / 128, cut: 34 / 128 };

function h(tag, cls, parent, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  if (parent) parent.appendChild(e);
  return e;
}

/* write-through caches: a frame only touches what changed. A film is
   rendered out of order and can't trust what the last frame left behind,
   so it turns them off. */
let CACHE = true;
// and 3D transforms put a part on a layer of its own, which a screenshot
// can catch before it is painted — so a film draws everything in 2D
const flat = v => v.replace(/translate3d\(([^,]+),([^,]+),\s*0(px)?\)/g, 'translate($1,$2)');
function setT(e, v) {
  if (!CACHE) { e.style.transform = flat(v); return; }
  if (e._t !== v) { e._t = v; e.style.transform = v; }
}
function setO(e, v) {
  const s = v <= 0.001 ? '0' : v >= 0.999 ? '1' : v.toFixed(3);
  if (!CACHE || e._o !== s) { e._o = s; e.style.opacity = s; e.style.visibility = s === '0' ? 'hidden' : 'visible'; }
}
const tr = (x, y, sx = 1, sy = sx) =>
  'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0)' + (sx === 1 && sy === 1 ? '' : ' scale(' + sx.toFixed(4) + ',' + sy.toFixed(4) + ')');

function words(text) {
  return text.split(' ').map(w => '<span class="w"><span>' + w + '</span></span>').join(' ');
}

function makeMark(parent, cls) {
  const m = h('div', 'mk ' + (cls || ''), parent);
  m.v = h('i', 'mk-v', m);
  m.h = h('i', 'mk-h', m);
  m.cut = h('i', 'mk-cut', m);
  m.slash = h('i', 'mk-slash', m);
  return m;
}

export function createIntro(stage, opts = {}) {
  let lang = opts.lang || 'da';
  if (opts.film) CACHE = false;
  const root = h('div', 'ix');
  const pgrid = h('div', 'ix-pg');
  stage.insertBefore(pgrid, stage.firstChild);
  stage.insertBefore(root, stage.firstChild);
  const world = h('div', 'ix-world', root);
  const gridBox = h('div', 'ix-grid', world);
  const axH = h('i', 'ix-ax ix-ax-h', world);
  const axV = h('i', 'ix-ax ix-ax-v', world);
  const routeBox = h('div', 'ix-routes', world);
  const pulse = h('i', 'ix-pulse', world);
  const markA = makeMark(world, 'mk-a');

  const nodes = {};
  ['phone', 'kitchen', 'booking', 'menu'].forEach(k => {
    const n = h('div', 'nd nd-' + k, world);
    n.ring = h('i', 'nd-ring', world);
    n.ring.dataset.k = k;
    // the outline that draws itself before the card is there
    n.edges = k === 'phone' ? [] : ['t', 'r', 'b', 'l'].map(sd => h('i', 'ed ed-' + sd, world));
    nodes[k] = n;
  });
  const tokens = [0, 1, 2].map(() => h('i', 'tk', world));

  const lockup = h('div', 'ix-lockup', root);
  const word = h('div', 'ix-word', lockup);
  const sub = h('div', 'ix-sub', lockup);
  const cue = h('div', 'ix-cue', root);

  const sayBox = h('div', 'ix-says', root);
  const markD = makeMark(root, 'mk-d');
  const house = h('div', 'ix-house', root);

  let G = null;
  let routes = [];
  let grid = { h: [], v: [] };
  let pg = [];
  let says = [];
  let houseLines = [];
  let letters = [];

  function fill() {
    const T = TXT[lang];
    word.innerHTML = 'Lesreg'.split('').map(c => '<span>' + c + '</span>').join('');
    letters = Array.from(word.children);
    sub.textContent = T.sub;
    cue.innerHTML = '<span>' + T.cue + '</span><i></i>';

    sayBox.innerHTML = '';
    says = T.say.map(([n, label, text]) => {
      const s = h('div', 'say', sayBox);
      if (n) h('div', 'say-k', s, '<b>' + n + '</b><span>' + label + '</span>');
      const p = h('p', 'say-t', s, words(text));
      s.w = Array.from(p.querySelectorAll('.w > span'));
      s.k = s.querySelector('.say-k');
      return s;
    });

    house.innerHTML = T.house.map(l => '<span>' + l + '</span>').join(' ');
    houseLines = Array.from(house.children);

    const P = nodes.phone;
    P.innerHTML =
      '<i class="ph-notch"></i><div class="ph-title">' + T.phone.title + '</div>' +
      T.phone.items.map((it, i) => '<div class="ph-row' + (i === 0 ? ' on' : '') + '"><span>' + it + '</span><b>' + (i === 0 ? '2' : '+') + '</b></div>').join('') +
      '<div class="ph-btn"><span>' + T.phone.btn + '</span></div>';
    P.btn = P.querySelector('.ph-btn');

    const K = nodes.kitchen;
    K.innerHTML =
      '<i class="cutl"></i><div class="nd-l">' + T.kitchen.label + '</div>' +
      '<div class="kd-tk"><div class="kd-no"><b>#214</b><span>' + T.kitchen.now + '</span></div>' +
      T.kitchen.lines.map(l => '<div class="kd-li">' + l + '</div>').join('') + '</div>';
    K.ticket = K.querySelector('.kd-tk');

    const B = nodes.booking;
    B.innerHTML =
      '<i class="cutl"></i><div class="nd-l">' + T.booking.label + '</div>' +
      T.booking.rows.map((r, i) => '<div class="bk-row' + (i === 1 ? ' new' : '') + '"><i></i><span>' + r + '</span></div>').join('');
    B.fresh = B.querySelector('.bk-row.new');

    const M = nodes.menu;
    M.innerHTML =
      '<i class="cutl"></i><div class="nd-l">' + T.menu.label + '</div>' +
      T.menu.rows.map((r, i) => '<div class="mn-row' + (i === 0 ? ' hot' : '') + '"><span>' + r + '</span><i></i></div>').join('');
    M.hot = M.querySelector('.mn-row.hot');

    // cached transforms belong to the old nodes
    [P.btn, K.ticket, B.fresh, M.hot].forEach(e => { if (e) { e._t = null; e._o = null; } });
  }

  function placeRect(e, r) {
    const x = G.X(r[0]), y = G.Y(r[1]);
    const w = (r[2] - r[0]) * G.gx, hh = (r[3] - r[1]) * G.g;
    e.style.left = x + 'px'; e.style.top = y + 'px';
    e.style.width = w + 'px'; e.style.height = hh + 'px';
    e.box = { x, y, w, h: hh, cx: x + w / 2, cy: y + hh / 2 };
  }

  function layout(W, H) {
    const land = W / H >= 1.05;
    const L = land ? LAND : PORT;
    const top = land ? 84 : 76, bot = land ? 44 : 66;
    const bw = L.bounds.x1 - L.bounds.x0, bh = L.bounds.y1 - L.bounds.y0;
    const g = Math.min(W / (bw + 1.4), (H - top - bot) / bh);
    const Ox = W / 2 - ((L.bounds.x0 + L.bounds.x1) / 2) * g;
    const Oy = top + ((H - top - bot) - bh * g) / 2 - L.bounds.y0 * g;
    // On a short phone the height decides g, and the diagram would be a
    // narrow strip down the middle with cards too small to hold their own
    // text. So across, it may use the width it has: columns get wider,
    // rows keep their height. The grid is drawn on the same columns, so
    // the cards still sit on its lines.
    const gx = land ? g : Math.min(g * 1.55, Math.max(g, (W - 28) / bw));
    G = { W, H, g, gx, land, L, O: { x: Ox, y: Oy }, X: u => Ox + u * gx, Y: v => Oy + v * g };
    stage.style.setProperty('--gx', gx.toFixed(2) + 'px');
    root.classList.toggle('is-short', !land && g < 46);
    stage.style.setProperty('--g', g.toFixed(2) + 'px');
    world.style.transformOrigin = Ox + 'px ' + Oy + 'px';
    root.classList.toggle('is-land', land);
    root.classList.toggle('is-port', !land);

    // the mark at the start, centred; its L corner is where O will be
    const Ma = land ? Math.min(1.9 * g, 190) : Math.min(2.1 * gx, 150);
    const ax = W / 2 - Ma / 2, ay = H * (land ? 0.4 : 0.38) - Ma / 2;
    G.Ma = Ma;
    G.Oa = { x: ax + MK.lx * Ma, y: ay + (MK.ly + MK.lh) * Ma };
    sizeMark(markA, Ma);
    markA.style.left = (Ox - MK.lx * Ma) + 'px';
    markA.style.top = (Oy - (MK.ly + MK.lh) * Ma) + 'px';
    lockup.style.left = '0px'; lockup.style.width = W + 'px';
    lockup.style.top = (ay + Ma + Ma * 0.34) + 'px';
    lockup.style.setProperty('--ma', Ma + 'px');

    // the pan is at most this far, so the lines are this much longer
    const pad = Math.max(Math.abs(G.Oa.x - Ox), Math.abs(G.Oa.y - Oy)) + 40;

    axH.style.left = (-pad) + 'px'; axH.style.width = (W + 2 * pad) + 'px'; axH.style.top = Oy + 'px';
    axH.style.transformOrigin = (Ox + pad) + 'px 50%';
    axV.style.top = (-pad) + 'px'; axV.style.height = (H + 2 * pad) + 'px'; axV.style.left = Ox + 'px';
    axV.style.transformOrigin = '50% ' + (Oy + pad) + 'px';

    gridBox.innerHTML = '';
    grid = { h: [], v: [] };
    for (let k = Math.floor((-pad - Ox) / gx); k <= Math.ceil((W + pad - Ox) / gx); k++) {
      if (k === 0) continue;
      const e = h('i', 'gl gl-v', gridBox);
      e.style.left = (Ox + k * gx) + 'px'; e.style.top = (-pad) + 'px'; e.style.height = (H + 2 * pad) + 'px';
      e.style.transformOrigin = '50% ' + (Oy + pad) + 'px';
      e.d = Math.abs(k); grid.v.push(e);
    }
    for (let k = Math.floor((-pad - Oy) / g); k <= Math.ceil((H + pad - Oy) / g); k++) {
      if (k === 0) continue;
      const e = h('i', 'gl gl-h', gridBox);
      e.style.top = (Oy + k * g) + 'px'; e.style.left = (-pad) + 'px'; e.style.width = (W + 2 * pad) + 'px';
      e.style.transformOrigin = (Ox + pad) + 'px 50%';
      e.d = Math.abs(k); grid.h.push(e);
    }

    ['phone', 'kitchen', 'booking', 'menu'].forEach(k => {
      placeRect(nodes[k], L[k]);
      const b = nodes[k].box, ring = nodes[k].ring;
      ring.style.left = b.x + 'px'; ring.style.top = b.y + 'px';
      ring.style.width = b.w + 'px'; ring.style.height = b.h + 'px';
      const c = 0.2 * g, E = nodes[k].edges;
      if (E.length) {
        const [t, r, bo, l] = E;
        Object.assign(t.style, { left: b.x + 'px', top: b.y + 'px', width: (b.w - c) + 'px' });
        Object.assign(r.style, { left: (b.x + b.w - 1) + 'px', top: (b.y + c) + 'px', height: (b.h - c) + 'px' });
        Object.assign(bo.style, { left: b.x + 'px', top: (b.y + b.h - 1) + 'px', width: b.w + 'px' });
        Object.assign(l.style, { left: b.x + 'px', top: b.y + 'px', height: b.h + 'px' });
      }
    });

    pulse.style.left = Ox + 'px'; pulse.style.top = Oy + 'px';

    // the same lattice, in ink, on the page the opening ends on
    pgrid.innerHTML = '';
    pg = [];
    for (let k = Math.floor(-Ox / gx); k <= Math.ceil((W - Ox) / gx); k++) {
      const e = h('i', 'pgl pgl-v', pgrid);
      e.style.left = (Ox + k * gx) + 'px'; e.style.transformOrigin = '50% ' + Oy + 'px';
      e.d = Math.abs(k); e.v = true; pg.push(e);
    }
    for (let k = Math.floor(-Oy / g); k <= Math.ceil((H - Oy) / g); k++) {
      const e = h('i', 'pgl pgl-h', pgrid);
      e.style.top = (Oy + k * g) + 'px'; e.style.transformOrigin = Ox + 'px 50%';
      e.d = Math.abs(k); e.v = false; pg.push(e);
    }

    // routes: each one a list of straight segments, drawn in order
    routeBox.innerHTML = '';
    routes = ['r1', 'r2', 'r3'].map(key => {
      const pts = L[key].map(([u, v]) => [G.X(u), G.Y(v)]);
      let len = 0;
      const segs = [];
      for (let i = 1; i < pts.length; i++) {
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
        const l = Math.abs(x1 - x0) + Math.abs(y1 - y0);
        const e = h('i', 'rt', routeBox);
        const horiz = y0 === y1;
        if (horiz) {
          e.style.left = Math.min(x0, x1) + 'px'; e.style.top = y0 + 'px'; e.style.width = l + 'px';
          e.classList.add('rt-h');
          e.style.transformOrigin = (x1 >= x0 ? '0' : '100%') + ' 50%';
        } else {
          e.style.top = Math.min(y0, y1) + 'px'; e.style.left = x0 + 'px'; e.style.height = l + 'px';
          e.classList.add('rt-v');
          e.style.transformOrigin = '50% ' + (y1 >= y0 ? '0' : '100%');
        }
        segs.push({ e, x0, y0, x1, y1, a: len, l, horiz });
        len += l;
      }
      return { segs, len };
    });

    // the mark it all folds back into
    const Md = land ? Math.min(2.5 * g, 250) : Math.min(2.9 * gx, 190);
    G.Md = Md;
    G.D = { x: W / 2, y: H * (land ? 0.43 : 0.4) };
    sizeMark(markD, Md);
    markD.style.left = (G.D.x - Md / 2) + 'px';
    markD.style.top = (G.D.y - Md / 2) + 'px';
    house.style.top = (G.D.y + Md / 2 + Md * 0.24) + 'px';

    // where the zoom ends: the window sits in the crook of the L, its
    // bottom left just inside the inner corner, the cut beyond its top right
    // three things have to hold at the end: the window's right edge is
    // still on the square, its top is still on it, and its top right
    // corner is clear of the cut. The largest of the three wins, plus room.
    const ua = 0.49, vb = 0.69;
    const F = 1.05 * Math.max(W / (1 - ua), H / vb, (W + H) / (1 - MK.cut - ua + vb));
    const X0 = -ua * F, Y0 = H - vb * F;
    const S = F / Md;
    const x0 = G.D.x - Md / 2, y0 = G.D.y - Md / 2;
    G.zoom = { S, Zx: (X0 - S * x0) / (1 - S), Zy: (Y0 - S * y0) / (1 - S) };

    const sy = L.say;
    sayBox.style.left = G.X(sy.x) + 'px';
    sayBox.style.width = (sy.w * G.gx) + 'px';
    sayBox.style.top = G.Y(sy.bottom) + 'px';

    // forget cached values; positions above changed under them
    root.querySelectorAll('*').forEach(e => { e._t = null; e._o = null; });
    world._t = null;
  }

  function sizeMark(m, s) {
    m.style.width = s + 'px'; m.style.height = s + 'px';
  }

  /* the mark: square, L drawn stroke by stroke, then the corner cut */
  function drawMark(m, lv, lh, cut, slash) {
    setT(m.v, 'scale(1,' + Math.max(0.0001, lv).toFixed(4) + ')');
    setT(m.h, 'scale(' + Math.max(0.0001, lh).toFixed(4) + ',1)');
    setT(m.cut, 'scale(' + Math.max(0.0001, cut).toFixed(4) + ')');
    setO(m.slash, slash);
  }

  function routeAt(r, t) {
    const d = r.len * t;
    for (const s of r.segs) {
      const k = clamp((d - s.a) / s.l);
      setT(s.e, s.horiz ? 'scale(' + Math.max(0.0001, k).toFixed(4) + ',1)' : 'scale(1,' + Math.max(0.0001, k).toFixed(4) + ')');
    }
    let head = r.segs[0];
    for (const s of r.segs) if (d >= s.a) head = s;
    const k = clamp((d - head.a) / head.l);
    return { x: lerp(head.x0, head.x1, k), y: lerp(head.y0, head.y1, k) };
  }

  function card(n, pop, gone, to) {
    const b = n.box;
    const traced = n.edges.length > 0;
    let x = 0, y = 0;
    let s = traced ? lerp(0.97, 1, out(seg(pop, 0.45, 1))) : lerp(0.86, 1, back(pop));
    let o = traced ? out(seg(pop, 0.5, 1)) : clamp(pop * 2.2);
    if (traced) {
      const fadeE = (1 - seg(pop, 0.75, 1) * 0.85) * (1 - seg(gone, 0, 0.25));
      n.edges.forEach((e, i) => {
        const t = io(seg(pop, i * 0.14, 0.34 + i * 0.14));
        const horiz = i === 0 || i === 2;
        setT(e, horiz ? 'scale(' + Math.max(0.0001, t).toFixed(4) + ',1)' : 'scale(1,' + Math.max(0.0001, t).toFixed(4) + ')');
        setO(e, t > 0 ? fadeE : 0);
      });
    }
    if (gone > 0) {
      const m = io(gone);
      x = (to.x - b.cx) * m; y = (to.y - b.cy) * m;
      s *= lerp(1, (G.Md * 0.5) / Math.max(b.w, b.h), m);
      o *= 1 - seg(gone, 0.55, 1);
    }
    setT(n, tr(x, y, s));
    setO(n, o);
  }

  function ring(n, t) {
    const r = n.ring;
    if (t <= 0 || t >= 1) { setO(r, 0); return; }
    const k = out(t);
    setT(r, 'scale(' + (1 + 0.16 * k).toFixed(4) + ',' + (1 + 0.16 * k * (n.box.w / n.box.h)).toFixed(4) + ')');
    setO(r, 0.9 * (1 - k));
  }

  function token(e, pos, born, docked) {
    if (born <= 0 || docked >= 1) { setO(e, 0); return; }
    const s = lerp(0.2, 1, out(clamp(born * 3))) * (1 - out(docked) * 0.8);
    setT(e, tr(pos.x, pos.y, s));
    setO(e, 1 - docked);
  }

  function sayAt(s, p, a, b) {
    const tin = seg(p, a, a + 0.035);
    const tout = seg(p, b - 0.03, b);
    const vis = tin > 0 && tout < 1;
    setO(s, vis ? 1 : 0);
    if (!vis) return;
    s.w.forEach((w, i) => {
      const ti = out5(seg(p, a + i * 0.0035, a + 0.03 + i * 0.0035));
      const to = io(seg(p, b - 0.03 + i * 0.0018, b - 0.006 + i * 0.0018));
      setT(w, 'translate3d(0,' + ((1 - ti) * 105 - to * 105).toFixed(1) + '%,0)');
      setO(w, ti * (1 - to));
    });
    if (s.k) {
      const k = out(seg(p, a, a + 0.03)) * (1 - seg(p, b - 0.03, b - 0.01));
      setT(s.k, 'translate3d(' + ((1 - k) * -12).toFixed(1) + 'px,0,0)');
      setO(s.k, k);
    }
  }

  /* p: scroll 0..1   a: the load clock 0..1 */
  function render(p, a = 1) {
    if (!G) return;
    p = clamp(p);

    /* ----- A: the mark draws itself, on the load clock ----- */
    const aPop = back(seg(a, 0.02, 0.3), 1.3);
    const aV = out(seg(a, 0.18, 0.42));
    const aH = out(seg(a, 0.34, 0.56));
    const aCut = back(seg(a, 0.55, 0.68), 2.2);
    const aSlash = seg(a, 0.55, 0.6) * (1 - seg(a, 0.62, 0.8));

    /* ----- B: the L throws out the axes, the camera settles ----- */
    const fold = io(seg(p, 0.008, 0.07));
    const pan = io(seg(p, 0.02, 0.105));
    const panX = (G.Oa.x - G.O.x) * (1 - pan), panY = (G.Oa.y - G.O.y) * (1 - pan);
    // the camera: pulls back as the grid opens, then eases in across the story
    const cs = 1 - 0.06 * io(seg(p, 0.0, 0.09)) + 0.06 * io(seg(p, 0.09, 0.62));
    setT(world, tr(panX, panY, cs));
    const pu = seg(p, 0.012, 0.06);
    setT(pulse, 'translate3d(-50%,-50%,0) scale(' + (0.2 + 5 * out(pu)).toFixed(4) + ')');
    setO(pulse, pu > 0 && pu < 1 ? 0.7 * (1 - out(pu)) : 0);

    const m = Math.max(0.0001, (1 - fold) * lerp(0.85, 1, aPop));
    setT(markA, 'translate3d(0,0,0) scale(' + m.toFixed(4) + ')');
    drawMark(markA, aV, aH, aCut, aSlash);
    setO(markA, clamp(aPop * 3) * (1 - seg(p, 0.05, 0.07)));

    letters.forEach((l, i) => {
      const tin = out5(seg(a, 0.42 + i * 0.035, 0.74 + i * 0.035));
      const tout = io(seg(p, 0.0 + i * 0.004, 0.035 + i * 0.004));
      setT(l, 'translate3d(0,' + ((1 - tin) * 60 - tout * 70).toFixed(1) + '%,0)');
      setO(l, tin * (1 - tout));
    });
    const sIn = out(seg(a, 0.7, 0.95)), sOut = seg(p, 0, 0.03);
    setT(sub, 'translate3d(0,' + ((1 - sIn) * 8 - sOut * 10).toFixed(1) + 'px,0)');
    setO(sub, sIn * (1 - sOut));
    setO(cue, seg(a, 0.85, 1) * (1 - seg(p, 0, 0.02)));

    /* axes: out of the corner in B, back into it in D */
    const axIn = out(seg(p, 0.012, 0.075));
    const axOut = io(seg(p, 0.645, 0.705));
    const ax = axIn * (1 - axOut);
    setT(axH, 'scale(' + Math.max(0.0001, ax).toFixed(4) + ',1)');
    setT(axV, 'scale(1,' + Math.max(0.0001, ax).toFixed(4) + ')');
    setO(axH, ax > 0 ? 1 : 0); setO(axV, ax > 0 ? 1 : 0);

    /* the grid draws outwards from the axes, and is folded away
       from the outside in */
    const gl = (e, horiz) => {
      const tin = out(seg(p, 0.03 + e.d * 0.0055, 0.085 + e.d * 0.0055));
      const tout = io(seg(p, 0.6 + (12 - Math.min(12, e.d)) * 0.003, 0.645 + (12 - Math.min(12, e.d)) * 0.003));
      const k = tin * (1 - tout);
      setT(e, horiz ? 'scale(' + Math.max(0.0001, k).toFixed(4) + ',1)' : 'scale(1,' + Math.max(0.0001, k).toFixed(4) + ')');
      setO(e, k > 0 ? 1 : 0);
    };
    grid.h.forEach(e => gl(e, true));
    grid.v.forEach(e => gl(e, false));

    /* ----- C: one order through the system ----- */
    const goneAt = i => seg(p, 0.605 + i * 0.012, 0.69 + i * 0.012);
    const to = G.D;
    card(nodes.phone, seg(p, 0.065, 0.11), goneAt(0), to);
    card(nodes.kitchen, seg(p, 0.205, 0.245), goneAt(1), to);
    card(nodes.booking, seg(p, 0.315, 0.355), goneAt(2), to);
    card(nodes.menu, seg(p, 0.425, 0.465), goneAt(3), to);

    // the button is pressed
    const press = seg(p, 0.168, 0.188);
    const ps = 1 - 0.09 * Math.sin(Math.PI * press);
    setT(nodes.phone.btn, 'scale(' + ps.toFixed(4) + ')');
    nodes.phone.btn.classList.toggle('lit', press > 0.3 && p < 0.5);

    const rfade = 1 - seg(p, 0.6, 0.635);
    const r1 = io(seg(p, 0.185, 0.255));
    const r2 = io(seg(p, 0.295, 0.365));
    const r3 = io(seg(p, 0.405, 0.475));
    const h1 = routeAt(routes[0], r1);
    const h2 = routeAt(routes[1], r2);
    const h3 = routeAt(routes[2], r3);
    routes.forEach((r, i) => r.segs.forEach(s => setO(s.e, ([r1, r2, r3][i] > 0 ? 1 : 0) * rfade)));

    token(tokens[0], h1, seg(p, 0.185, 0.2), seg(p, 0.25, 0.262));
    token(tokens[1], h2, seg(p, 0.295, 0.31), seg(p, 0.36, 0.372));
    token(tokens[2], h3, seg(p, 0.405, 0.42), seg(p, 0.47, 0.482));

    ring(nodes.kitchen, seg(p, 0.252, 0.305));
    ring(nodes.booking, seg(p, 0.362, 0.415));
    ring(nodes.menu, seg(p, 0.472, 0.525));

    // what each one does with it
    const tk = out5(seg(p, 0.252, 0.285));
    setT(nodes.kitchen.ticket, tr(0, (1 - tk) * -0.5 * G.g));
    setO(nodes.kitchen.ticket, tk);
    nodes.kitchen.classList.toggle('hot', p > 0.252 && p < 0.33);

    const bk = out5(seg(p, 0.362, 0.392));
    setT(nodes.booking.fresh, tr((1 - bk) * 0.6 * G.g, 0));
    setO(nodes.booking.fresh, bk);

    const mn = seg(p, 0.472, 0.5);
    nodes.menu.hot.classList.toggle('lit', mn > 0.5);
    setT(nodes.menu.hot, 'scale(1,' + (1 - 0.35 * Math.sin(Math.PI * mn)).toFixed(4) + ')');

    sayAt(says[0], p, 0.085, 0.215);
    sayAt(says[1], p, 0.225, 0.325);
    sayAt(says[2], p, 0.335, 0.435);
    sayAt(says[3], p, 0.445, 0.555);
    sayAt(says[4], p, 0.565, 0.66);

    /* ----- D: the system folds back into the mark ----- */
    const dPop = back(seg(p, 0.675, 0.72), 1.5);
    const dV = out(seg(p, 0.7, 0.735));
    const dH = out(seg(p, 0.725, 0.76));
    const dCut = back(seg(p, 0.755, 0.775), 2.4);
    const dSlash = seg(p, 0.755, 0.765) * (1 - seg(p, 0.768, 0.8));

    houseLines.forEach((l, i) => {
      const tin = out5(seg(p, 0.735 + i * 0.012, 0.77 + i * 0.012));
      const tout = io(seg(p, 0.8, 0.83));
      setT(l, 'translate3d(0,' + ((1 - tin) * 0.6 - tout * 0.4).toFixed(3) + 'em,0)');
      setO(l, tin * (1 - tout));
    });

    /* ----- E: the mark opens into the page ----- */
    const z = io(seg(p, 0.8, 0.94));
    const s = Math.pow(G.zoom.S, z);
    const zx = G.zoom.Zx, zy = G.zoom.Zy;
    const x0 = G.D.x - G.Md / 2, y0 = G.D.y - G.Md / 2;
    // a zoom about one fixed point, at a constant rate of magnification
    const tx = zx + s * (x0 - zx) - x0, ty = zy + s * (y0 - zy) - y0;
    const popS = lerp(0.62, 1, dPop);
    setT(markD, tr(tx + (1 - popS) * G.Md / 2, ty + (1 - popS) * G.Md / 2, s * popS));
    drawMark(markD, dV, dH, dCut, dSlash);
    setO(markD, seg(p, 0.675, 0.69) * (p >= 0.94 ? 0 : 1));

    root.classList.toggle('on-paper', p >= 0.94);

    pg.forEach(e => {
      const t = io(seg(p, 0.94 + e.d * 0.003, 0.985 + e.d * 0.003));
      setT(e, e.v ? 'scale(1,' + Math.max(0.0001, t).toFixed(4) + ')' : 'scale(' + Math.max(0.0001, t).toFixed(4) + ',1)');
      setO(e, t > 0 ? 1 : 0);
    });

    // is this point of the window on paper yet: inside the square,
    // outside the cut, outside the L
    const side = s * popS * G.Md, mx = x0 + tx + (1 - popS) * G.Md / 2, my = y0 + ty + (1 - popS) * G.Md / 2;
    const onPaper = (px, py) => {
      if (p >= 0.94) return true;
      if (p < 0.69) return false;
      const u = (px - mx) / side, v = (py - my) / side;
      if (u < 0 || u > 1 || v < 0 || v > 1) return false;
      if (u - v > 1 - MK.cut) return false;
      if (u >= MK.lx && u <= MK.lx + MK.lw && v >= MK.ly && v <= MK.ly + MK.lh) return false;
      if (u >= MK.lx && u <= MK.lx + MK.hw && v >= MK.hy && v <= MK.hy + MK.lw) return false;
      return true;
    };
    return { paper: z, done: p >= 0.94, onPaper };
  }

  function setLang(l) {
    lang = TXT[l] ? l : 'da';
    fill();
    if (G) layout(G.W, G.H);
  }

  fill();
  return { layout, render, setLang, get geometry() { return G; } };
}
