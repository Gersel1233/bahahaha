/* ============================================================
   LESREG — the phone.

   A real phone in three.js rather than a CSS frame, because this section
   moves it: it arrives out of nothing, steps aside for a second one, and
   takes a notification on the glass while it buzzes. None of that
   survives being faked with boxes and shadows.

   The scroll drives it through one number. The stage engine in the page
   writes the section's progress to window.__lesreg.s, and everything
   here is a function of that — so the phone and the words over it can
   never drift apart.
   ============================================================ */
import * as THREE from 'three';

/* Measured off the device — 71.9 × 149.9 × 8.75 mm — and scaled so the
   width is 0.70.

   The chamfer matters more than it looks. three adds a bevel beyond both
   ends of an extrusion, so a bevel of 0.012 was quietly making a body of
   0.082 come out 0.106 thick: 29% over the number, and 0.151 of the
   width where the real phone is 0.122. It also curved the sides, and the
   sides of this phone are flat. A third of a millimetre is the whole of
   the rounding on a titanium band. */
const W = 0.70, H = 1.484, D = 0.074, R = 0.115;
const BEV = 0.0035;                                        // the chamfer
const BEZ = 0.014;                                         // the black border
const SCREEN_W = W - BEZ * 2, SCREEN_H = SCREEN_W / (9 / 19.5);

const st = (window.__lesreg = window.__lesreg || { s: 0, err: null });

const out  = t => 1 - Math.pow(1 - t, 3);
const io   = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const slow = t => 1 - Math.pow(1 - t, 5);
const seg  = (s, a, b) => Math.max(0, Math.min(1, (s - a) / (b - a)));

const canvas = document.getElementById('telCanvas');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- the room ---------- */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
camera.position.z = 3.6;
camera.lookAt(0, 0, 0);

/* The environment is what makes the titanium read as metal — it has
   nothing to reflect otherwise. A vertical gradient is enough: light
   above, room below, and it costs one 32×128 canvas. */
function envTexture() {
  const c = document.createElement('canvas');
  c.width = 32; c.height = 128;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 128);
  /* Polished metal is mostly a picture of the room, so the floor of this
     gradient is the phone's own colour. Almost black down there and the
     titanium came out brown — the device is a light silver. */
  g.addColorStop(0, '#fffaf2'); g.addColorStop(0.42, '#f2e8d9');
  g.addColorStop(0.72, '#a9a091'); g.addColorStop(1, '#443c33');
  x.fillStyle = g; x.fillRect(0, 0, 32, 128);
  const t = new THREE.CanvasTexture(c);
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
scene.environment = envTexture();

scene.add(new THREE.AmbientLight(0xfff3e4, 0.45));
const key  = new THREE.DirectionalLight(0xfff6ea, 2.1);  key.position.set(-1.6, 2.2, 2.6);
const rim  = new THREE.DirectionalLight(0xbfd6ee, 1.25); rim.position.set(2.4, -0.6, -1.4);
const fill = new THREE.DirectionalLight(0xf6e3cd, 0.7);  fill.position.set(1.4, -1.8, 2);
scene.add(key, rim, fill);

/* ---------- the parts ---------- */
function roundedRect(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);      s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);      s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);          s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/* A screen with nothing on it yet. Not a drawn interface: the real
   recordings go here, and inventing one in the meantime would put a
   picture of software on the page that nobody built. */
function blankScreen(label) {
  const c = document.createElement('canvas');
  c.width = 540; c.height = 1170;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 1170);
  g.addColorStop(0, '#f7f0e4'); g.addColorStop(1, '#e9e0d1');
  x.fillStyle = g; x.fillRect(0, 0, 540, 1170);
  x.fillStyle = 'rgba(27,23,20,.28)';
  x.font = '600 26px -apple-system, "SF Pro Text", Helvetica, sans-serif';
  x.textAlign = 'center';
  x.fillText(label, 270, 600);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* The notification is drawn into a plane on the screen rather than laid
   over the page as DOM, so it turns and tilts with the phone.

   Every measurement below is taken off a real screenshot of the phone
   these notifications land on — 1206 x 2622, so three pixels to the
   point. The card runs 1116 wide by 231 tall with 83 between cards, the
   icon is 113 square set 40 in from the card edge, the text column
   starts 191 in, and the four lines sit on a 54-pixel rhythm. Written by
   eye instead, a notification lands in the uncanny valley: near enough
   to be recognised and wrong enough to be noticed.

   The names are not his customers'. The screenshot carries eight real
   ones with their booking times, and this page is public. The format is
   the device's, line for line; the people in it are not real. */
const NOTIF_PAD = 40, CARD_W = 1116, CARD_GAP = 83;
const NOTIF_W = CARD_W + NOTIF_PAD * 2;
const TX = 191, B1 = 45, LP = 54, TAIL = 24;   // text column, first baseline, line pitch, foot
const NOTIF_CARDS = [
  { stamp: 'nu',          body: 'Sofie Kragh · kl. 18:00 · 2 pers. · Spiser her' },
  { stamp: '2 t. siden',  body: 'Anders Bay Nielsen · kl. 17:30 · To-go' },
];

function notificationTexture() {
  const c = document.createElement('canvas');
  const x = c.getContext('2d');
  const F = '-apple-system, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Helvetica, sans-serif';

  /* The chef's hat is drawn rather than set as an emoji. A notification
     whose icon is a glyph is at the mercy of whatever emoji font the
     visitor's system happens to carry, and a missing one is a tofu box
     in the middle of the thing this act exists to show. */
  function hat(cx, cy, s, fill, band) {
    x.save();
    x.translate(cx, cy); x.scale(s, s);
    x.fillStyle = fill;
    x.beginPath();
    x.arc(-14, 2, 15, 0, Math.PI * 2); x.arc(0, -6, 17, 0, Math.PI * 2);
    x.arc(14, 2, 15, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.roundRect(-18, 6, 36, 26, 5); x.fill();
    x.fillStyle = band;
    x.fillRect(-18, 20, 36, 3.5);
    x.restore();
  }

  /* The body is one string that wraps, the way the device wraps it — not
     two lines written as two, which breaks the moment a name is longer
     than the one it was laid out for. And because it wraps, the card is
     as tall as what is in it: a name that fits on one line gets a card
     one line shorter, rather than a card with a hole in the bottom. */
  function wrap(body) {
    x.font = '400 43px ' + F;
    const words = body.split(' '), max = CARD_W - TX - 51, lines = [];
    let line = '';
    for (let i = 0; i < words.length; i++) {
      const t = line ? line + ' ' + words[i] : words[i];
      if (x.measureText(t).width > max && line) {
        lines.push(line); line = words[i];
        if (lines.length === 2) break;
      } else line = t;
    }
    if (lines.length < 2 && line) lines.push(line);
    return lines;
  }

  const plan = NOTIF_CARDS.map(n => {
    const lines = wrap(n.body);
    /* the header, then the title, then the body — so the last baseline is
       LP × (1 + however many lines the body wrapped to) below the first */
    return { ...n, lines, h: B1 + LP * (1 + lines.length) + TAIL };
  });
  c.width = NOTIF_W;
  c.height = NOTIF_PAD * 2 + plan.reduce((a, p) => a + p.h, 0) + CARD_GAP * (plan.length - 1);

  let oy = NOTIF_PAD;
  for (const p of plan) {
    x.save();
    x.translate(NOTIF_PAD, oy);
    x.shadowColor = 'rgba(0,0,0,.42)'; x.shadowBlur = 40; x.shadowOffsetY = 14;
    x.fillStyle = 'rgba(23,24,20,.94)';
    x.beginPath(); x.roundRect(0, 0, CARD_W, p.h, 66); x.fill();
    x.shadowColor = 'transparent';

    // the app icon: a squircle with the same hat in it
    x.fillStyle = 'rgb(196,107,54)';
    x.beginPath(); x.roundRect(40, (p.h - 113) / 2, 113, 113, 26); x.fill();
    hat(96.5, p.h / 2, 1.5, '#fff', 'rgba(196,107,54,.92)');

    hat(TX + 21, B1 - 14, 0.62, 'rgba(255,255,255,.95)', 'rgba(23,24,20,.95)');
    x.fillStyle = 'rgba(255,255,255,.95)';
    x.font = '600 44px ' + F;
    x.fillText('Ny bestilling', TX + 52, B1);
    x.textAlign = 'right';
    x.font = '400 42px ' + F;
    x.fillStyle = 'rgba(255,255,255,.5)';
    x.fillText(p.stamp, CARD_W - 51, B1);
    x.textAlign = 'left';

    x.fillStyle = 'rgba(255,255,255,.96)';
    x.font = '600 44px ' + F;
    x.fillText('from Spiis Admin', TX, B1 + LP);

    x.font = '400 43px ' + F;
    x.fillStyle = 'rgba(255,255,255,.78)';
    p.lines.forEach((l, i) => x.fillText(l, TX, B1 + LP * (2 + i)));
    x.restore();
    oy += p.h + CARD_GAP;
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function shadowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(60,44,30,.34)'); g.addColorStop(0.55, 'rgba(60,44,30,.12)');
  g.addColorStop(1, 'rgba(60,44,30,0)');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

const chassisGeo = new THREE.ExtrudeGeometry(roundedRect(W, H, R), {
  depth: D, bevelEnabled: true, bevelThickness: BEV, bevelSize: BEV,
  bevelSegments: 2, curveSegments: 24,
});
/* The bevel is added beyond both ends of the extrusion, so the metal
   front sits proud of the depth — right on top of the screen, which is
   why the glass once came out as brushed aluminium. Pushed back by
   exactly that, the front face lands on D/2 where the screen offsets
   expect it, and the body runs from -D/2-2·BEV to D/2. */
chassisGeo.translate(0, 0, -D / 2 - BEV);
const ZBACK = -D / 2 - BEV * 2;                     // the back of the body
const bezelGeo  = new THREE.ShapeGeometry(roundedRect(W - BEV * 2, H - BEV * 2, R - BEV), 24);

/* The back. It is never turned square to the visitor — the arrival stops
   short of ninety degrees on purpose — but the phone is seen from its
   edge through the whole turn, and the plateau is what stands proud there.
   Without it the silhouette was a flat slab. */
const PLT_W = W * 0.955, PLT_H = W * 0.36, PLT_D = 0.015;
const plateauGeo = new THREE.ExtrudeGeometry(roundedRect(PLT_W, PLT_H, W * 0.125), {
  depth: PLT_D, bevelEnabled: true, bevelThickness: 0.0022, bevelSize: 0.0022,
  bevelSegments: 2, curveSegments: 20,
});
plateauGeo.translate(0, 0, -PLT_D);
const PLT_Y = H / 2 - W * 0.05 - PLT_H / 2;
const PLT_Z = ZBACK - PLT_D;                        // the plateau's own back face

/* The glass window under it, a shade off the metal — the same two-tone
   back the device has. */
const backGeo = new THREE.ShapeGeometry(roundedRect(W * 0.80, H * 0.46, W * 0.15), 20);

const lensBarrelGeo = new THREE.CylinderGeometry(1, 1, 1, 28);
const lensGlassGeo  = new THREE.CircleGeometry(1, 28);

/* The display is not a rectangle. A plane gave it square corners inside a
   rounded body, which is the one thing that stops a phone reading as a
   phone. A shape carries the radius — but three lays its UVs straight off
   the shape's own coordinates, so a texture put on it would land in the
   wrong place and at the wrong size. They are remapped across the
   bounding box, and then a recording fills the glass edge to edge. */
function screenShape(w, h, r) {
  const g = new THREE.ShapeGeometry(roundedRect(w, h, r), 24);
  g.computeBoundingBox();
  const bb = g.boundingBox, uv = g.attributes.uv, pos = g.attributes.position;
  const dx = bb.max.x - bb.min.x, dy = bb.max.y - bb.min.y;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, (pos.getX(i) - bb.min.x) / dx, (pos.getY(i) - bb.min.y) / dy);
  }
  uv.needsUpdate = true;
  return g;
}
const screenGeo = screenShape(SCREEN_W, SCREEN_H, R - BEZ);

/* The Dynamic Island. It is the single cue that says which phone this is,
   and it sits on the glass rather than in the bezel — a notification
   comes to rest just under it, the way it does on the device. */
const ISLAND_W = SCREEN_W * 0.31, ISLAND_H = SCREEN_W * 0.086;
const islandGeo = new THREE.ShapeGeometry(roundedRect(ISLAND_W, ISLAND_H, ISLAND_H / 2), 16);
const shadowGeo = new THREE.PlaneGeometry(W * 3.1, W * 2.2);
/* The stack is as wide on the glass as it is on the device: 1116 of the
   screenshot's 1206, plus the room the shadow needs. Its height comes
   back from the drawing rather than being declared, because the cards
   size themselves to the text the visitor's own font metrics produce. */
const notifTex  = notificationTexture();
const NOTIF_H   = notifTex.image.height;
const NOTIF_PW = SCREEN_W * (NOTIF_W / 1206);
const NOTIF_PH = NOTIF_PW * (NOTIF_H / NOTIF_W);
const notifGeo  = new THREE.PlaneGeometry(NOTIF_PW, NOTIF_PH);
/* And it rests where it rests there. In the screenshot the top card's
   edge is 248 pixels down a 2622-pixel display — 9.5%, which clears the
   island — and the plane's own transparent margin sits above that. */
const NOTIF_Y = SCREEN_H / 2 - ((248 - NOTIF_PAD) / 2622) * SCREEN_H - NOTIF_PH / 2;
const shadowTex = shadowTexture();

/* Every phone gets its own materials. Shared, one phone's fade pulls the
   other one down with it, because the opacity lives on the material and
   not on the mesh. */
function buildPhone(labelA, labelB) {
  const g = new THREE.Group();

  const titan = new THREE.MeshStandardMaterial({
    color: 0xd6d2cd, metalness: 1, roughness: 0.30, envMapIntensity: 1.5, transparent: true,
  });
  g.add(new THREE.Mesh(chassisGeo, titan));

  const bezelMat = new THREE.MeshStandardMaterial({
    color: 0x090807, metalness: 0.2, roughness: 0.55, transparent: true,
  });
  const bezel = new THREE.Mesh(bezelGeo, bezelMat);
  bezel.position.z = D / 2 + 0.001;
  g.add(bezel);

  /* The glass sat four thousandths proud of the metal, which on a body
     this thin is a five per cent lip — and this section shows the phone
     edge-on halfway through the turn, which is exactly where a lip shows.
     Flush enough to read as one surface, apart enough not to fight for
     depth. */
  const sA = new THREE.MeshBasicMaterial({ map: blankScreen(labelA), toneMapped: false, transparent: true });
  const sB = new THREE.MeshBasicMaterial({ map: blankScreen(labelB), toneMapped: false, transparent: true, opacity: 0 });
  const screen = new THREE.Mesh(screenGeo, sA), screenB = new THREE.Mesh(screenGeo, sB);
  screen.position.z  = D / 2 + 0.0022;
  screenB.position.z = D / 2 + 0.0030;
  g.add(screen, screenB);

  const islandMat = new THREE.MeshBasicMaterial({ color: 0x070605, toneMapped: false, transparent: true });
  const island = new THREE.Mesh(islandGeo, islandMat);
  island.position.set(0, SCREEN_H / 2 - SCREEN_W * 0.026 - ISLAND_H / 2, D / 2 + 0.0038);
  g.add(island);

  const notifMat = new THREE.MeshBasicMaterial({ map: notifTex, toneMapped: false, transparent: true, opacity: 0 });
  const notif = new THREE.Mesh(notifGeo, notifMat);
  notif.position.set(0, NOTIF_Y, D / 2 + 0.0046);
  notif.visible = false;
  g.add(notif);

  /* ---- the back ---- */
  const backMat = new THREE.MeshStandardMaterial({
    color: 0xf0ece6, metalness: 0.15, roughness: 0.55, envMapIntensity: 1.0, transparent: true,
  });
  const back = new THREE.Mesh(backGeo, backMat);
  back.position.set(0, -H * 0.10, ZBACK - 0.0008);
  back.rotation.y = Math.PI;
  g.add(back);

  const plateauMat = new THREE.MeshStandardMaterial({
    color: 0xd6d2cd, metalness: 1, roughness: 0.30, envMapIntensity: 1.5, transparent: true,
  });
  const plateau = new THREE.Mesh(plateauGeo, plateauMat);
  plateau.position.set(0, PLT_Y, ZBACK);
  g.add(plateau);

  const lensMetal = new THREE.MeshStandardMaterial({
    color: 0xb6b1ab, metalness: 1, roughness: 0.2, envMapIntensity: 1.7, transparent: true,
  });
  const lensGlass = new THREE.MeshStandardMaterial({
    color: 0x0a0b0d, metalness: 0.6, roughness: 0.06, envMapIntensity: 2.4, transparent: true,
  });
  const flashMat = new THREE.MeshStandardMaterial({
    color: 0xfdf2df, metalness: 0.1, roughness: 0.3, transparent: true,
  });

  /* A lens is a barrel standing off the plateau with the glass set down
     inside it. Flat discs read as stickers. */
  function lens(x, y, r) {
    const barrel = new THREE.Mesh(lensBarrelGeo, lensMetal);
    barrel.scale.set(r, 0.012, r);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(x, PLT_Y + y, PLT_Z - 0.004);
    const glass = new THREE.Mesh(lensGlassGeo, lensGlass);
    glass.scale.setScalar(r * 0.78);
    glass.rotation.y = Math.PI;
    glass.position.set(x, PLT_Y + y, PLT_Z - 0.006);
    g.add(barrel, glass);
  }
  function dot(x, y, r, mat) {
    const d = new THREE.Mesh(lensGlassGeo, mat);
    d.scale.setScalar(r);
    d.rotation.y = Math.PI;
    d.position.set(x, PLT_Y + y, PLT_Z - 0.0012);
    g.add(d);
  }

  /* The camera sits top-left of the back, and the back is what act one
     turns towards the visitor — so in model space, where +X is the
     viewer's right from the front, the cluster belongs on +X. Put on -X
     it comes round the turn as a mirror image of the device. */
  const RL = W * 0.092;
  lens(PLT_W * 0.29, PLT_H * 0.29, RL);
  lens(PLT_W * 0.29, -PLT_H * 0.29, RL);
  lens(PLT_W * 0.055, 0, RL);
  dot(-PLT_W * 0.235, PLT_H * 0.21, W * 0.030, flashMat);
  dot(-PLT_W * 0.235, -PLT_H * 0.20, W * 0.024, lensGlass);
  dot(-PLT_W * 0.085, -PLT_H * 0.26, W * 0.009, lensGlass);

  /* There were side buttons here, measured down from the top edge as a
     share of the body. At this size they read as four dark notches cut
     into the band rather than as buttons, and the band is the one part of
     the edge the visitor sees. A clean edge is closer to the device than
     an approximate one. */

  const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
  const shade = new THREE.Mesh(shadowGeo, shadowMat);
  shade.rotation.x = -Math.PI / 2.1;
  shade.position.y = -H * 0.56;
  g.add(shade);

  g.visible = false;
  scene.add(g);
  return { g, body: [titan, bezelMat, islandMat],
           back: [plateauMat, backMat, lensMetal, lensGlass, flashMat],
           shadowMat, sA, sB, notifMat, notif, mix: { a: 1, b: 0, n: 0 }, o: 0 };
}

const p1 = buildPhone('Gæsteappen', 'Gæsteappen');
const p2 = buildPhone('Administrationen', 'Admin-appen');

/* One fade for the whole phone, with the screens keeping their own
   crossfade underneath it. Set in a single pass, the fade would undo
   the crossfade every frame. */
function setOpacity(p, o) {
  p.o = o;
  p.g.visible = o > 0.002;
  p.body.forEach(m => { m.opacity = o; });
  /* The back is a liability while the phone is fading. Alpha blending does
     not care which side of a body a surface is on, so a half-transparent
     phone shows its own camera plateau and lenses through the glass from
     the front — the phone arrived looking like a photograph of its own
     back. The back comes in over the last of the fade, once the body is
     opaque enough to hide what is behind it, and until then the phone
     fades the way it did before it had one. */
  const bo = Math.max(0, (o - 0.86) / 0.14);
  p.back.forEach(m => { m.opacity = bo; });
  p.shadowMat.opacity = o * 0.9;
  p.sA.opacity = o * p.mix.a;
  p.sB.opacity = o * p.mix.b;
  p.notifMat.opacity = o * p.mix.n;
}

/* ---------- where the phone stands ----------
   Two layouts, because the rule is the same in both: the words must
   never sit on the glass. On a wide window the phone keeps the upper
   half in act one and moves left of centre afterwards, so the right
   column is free. On a narrow one there is no right column — it goes up
   and gets smaller, and the words stack underneath it. */
let L = layout();
function layout() {
  /* Three placements, because the words sit somewhere different in each.
     On a wide window they are a column to the right, so the phone stops
     left of centre. On a pinned narrow one they are under it, so it keeps
     the upper half. And where the section is laid out as a block — the
     phone, where it plays rather than scrubs — the words are below the
     canvas entirely, nothing shares the frame, and the phone has no reason
     to be small or to hug the top. */
  if (document.documentElement.classList.contains('tap'))
    return { y1: 0.05, s1: 0.98, x2: 0, y2: 0.05, s2: 0.98 };
  return window.innerWidth < 900
    ? { y1: 0.34, s1: 0.62, x2: 0,     y2: 0.36, s2: 0.62 }
    : { y1: 0.34, s1: 0.72, x2: -0.66, y2: 0,    s2: 0.86 };
}

/* ---------- the three acts ---------- */
function pose(s) {
  /* 1 — it arrives out of nothing and settles in the upper half so the
     words have the bottom third to themselves. Then it slides off left.

     It used to come in on a whole revolution, then on sixty degrees. Both
     are better arrivals on paper and worse ones on the page: a turn is
     only worth having if what it turns towards you is worth seeing, and
     here it was the back and then the edge. The depth is carried by the
     dolly instead — four units of it — and the face is all that is ever
     square to the visitor. */
  const e1 = slow(seg(s, 0, 0.32));
  const x1 = io(seg(s, 0.34, 0.50));
  /* It used to come from a twenty-fifth of its size and three and a half
     units back — a speck, and a speck that was still fading. The arrival
     starts a third of the way up and half as far out: far enough to be a
     move, near enough that the first thing seen is a phone. */
  p1.g.scale.setScalar(0.34 + (L.s1 - 0.34) * e1);
  p1.g.position.set(-2.9 * x1,
                    0.46 + (L.y1 - 0.46) * e1,
                    -1.5 + 1.5 * e1 + 0.5 * x1);
  /* The turn gets a curve of its own. On the arrival's own easing — a
     quintic, chosen to plant the phone quickly — five sixths of the turn
     was over in the first tenth of the act, so the sixty degrees existed
     on paper and not on the screen. A cubic in and out holds the angle,
     turns through the middle, and settles. */
  const turn = io(seg(s, 0.01, 0.26));
  p1.g.rotation.set(0.1 * (1 - e1), 1.05 * (1 - turn) - 0.5 * x1, 0);
  /* The fade decides which pose the visitor actually meets, not the
     rotation: whatever angle the phone has reached when it stops being
     transparent is the pose the arrival appears to start from. Over a
     long fade the whole turn happens behind it. */
  setOpacity(p1, Math.min(seg(s, 0.002, 0.020), 1 - x1));

  /* 2 — the second comes in from the right and stops left of centre, so
     the right column is left free for the text.
     3 — the screen changes from the inside, the notification drops onto
     the glass, and the phone buzzes under it. */
  const e2 = io(seg(s, 0.36, 0.56));
  const bz = seg(s, 0.855, 0.96);
  const buzz = (bz > 0 && bz < 1) ? Math.sin(bz * Math.PI * 13) * (1 - bz) : 0;
  const sw = io(seg(s, 0.68, 0.82));
  p2.mix.a = 1 - sw;
  p2.mix.b = sw;
  p2.mix.n = out(seg(s, 0.82, 0.90));
  p2.g.scale.setScalar(L.s2);
  p2.g.position.set(3.4 + (L.x2 - 3.4) * e2 + buzz * 0.012, L.y2, -0.7 + 0.7 * e2);
  /* A buzzing phone shifts a hair and tips barely at all. Read at the
     brief's face value the tilt came to twenty degrees, and since the
     scroll can be stopped anywhere, that leaves the phone standing
     crooked rather than shaking. A degree and a bit reads as the buzz
     and as nothing at all when it stops. */
  p2.g.rotation.set(0, 0.42 * (1 - e2), buzz * 0.021);
  /* It used to start 0.55 of the body above its resting place, which is
     well above the phone — the card flew in over the titanium and across
     the top edge before it reached the glass. A notification does not
     come from outside the device. This one only ever exists on the
     display: it settles 0.02 of the body, from just under the island, and
     grows the last six per cent while it fades up. Nothing to clip,
     because nothing ever leaves. */
  p2.notif.visible = p2.mix.n > 0.002;
  p2.notif.position.y = NOTIF_Y + (1 - p2.mix.n) * 0.020 * H;
  p2.notif.scale.setScalar(0.94 + 0.06 * p2.mix.n);
  setOpacity(p2, seg(s, 0.36, 0.44));

  camera.position.y = Math.sin(s * Math.PI) * 0.04;
  camera.lookAt(0, 0, 0);
}

/* ---------- fitting the room to the window ---------- */
function resize() {
  /* Measured off the canvas itself, not off its parent. While the stage is
     pinned the canvas fills it and the two are the same; laid out as a
     block on a phone the stage is as tall as all its content and the canvas
     is a band inside it, and sizing the drawing buffer to the parent drew a
     phone twelve hundred pixels tall into a box five hundred tall — a
     phone squashed into a tablet. */
  const host = canvas.parentElement;
  const w = Math.max(1, Math.round(canvas.clientWidth || host.clientWidth));
  const h = Math.max(1, Math.round(canvas.clientHeight || host.clientHeight));
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  /* Far enough back that the phone's top edge stays on the glass with the
     lower third left over for the words: at 30° the visible half-height is
     z·tan15°, and act one needs about 1.15 of it. A narrow window needs
     more width as well, so it pulls back further, to the limit. */
  camera.position.z = Math.max(2.6, Math.min(4.6, 4.3 / Math.min(1, camera.aspect * 0.95)));
  L = layout();
  camera.updateProjectionMatrix();
  camera.lookAt(0, 0, 0);
  pending = true;
}

/* ---------- the recordings ----------
   A clip is not fetched until its act is nearly up, and it is wound back
   to the start every time that act begins — so a visitor sees the take
   from its first frame rather than wherever a loop happened to be when
   they arrived. Off the act it is paused, which costs nothing while
   someone reads the rest of the page. */
const clips = [];
function driveClips(s) {
  for (let i = 0; i < clips.length; i++) {
    const v = clips[i], near = s > v.at - 0.12;
    if (near && v.el.preload === 'none') { v.el.preload = 'auto'; v.el.load(); }
    if (near && v.el.paused) v.el.play().catch(() => {});
    else if (!near && !v.el.paused) v.el.pause();
    if (s >= v.at && !v.armed) { v.armed = true; try { v.el.currentTime = 0; } catch (_) {} }
    else if (s < v.at - 0.02) v.armed = false;
  }
}

/* ---------- the loop ---------- */
let last = -1, pending = true;
function frame() {
  requestAnimationFrame(frame);
  /* a hidden tab gets no work at all */
  if (document.visibilityState !== 'visible') return;
  try {
    const s = st.s || 0;
    driveClips(s);
    /* a running clip needs a frame even when the scroll is still */
    let live = false;
    for (let i = 0; i < clips.length; i++) {
      if (!clips[i].el.paused && clips[i].el.readyState > 2) { live = true; break; }
    }
    if (!pending && !live && Math.abs(s - last) < 0.0004) return;
    last = s; pending = false;
    pose(s);
    renderer.render(scene, camera);
  } catch (e) {
    st.err = (e && e.message) || String(e);
  }
}

window.addEventListener('resize', resize, { passive: true });
/* the canvas changes shape without the window doing so — fonts landing,
   the address bar folding, the block above it growing */
if ('ResizeObserver' in window) new ResizeObserver(() => resize()).observe(canvas);
resize();

if (reduce) {
  /* side by side, both screens on, the notification showing */
  p1.g.position.set(-0.78, 0, 0); p1.g.scale.setScalar(0.58); p1.g.rotation.set(0, 0, 0);
  setOpacity(p1, 1);
  p2.g.position.set(0.78, 0, 0); p2.g.scale.setScalar(0.58); p2.g.rotation.set(0, 0, 0);
  p2.mix.a = 0; p2.mix.b = 1; p2.mix.n = 1;
  p2.notif.visible = true; p2.notif.position.y = H * 0.285;
  setOpacity(p2, 1);
  camera.position.set(0, 0, 4.4); camera.updateProjectionMatrix(); camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);
} else {
  requestAnimationFrame(frame);
}

/* ---------- the hook the recordings come in through ---------- */
window.LesregTelefon = {
  /* 1 = the guest app, 2 = the administration, 3 = the admin app */
  setVideo(which, src) {
    const el = document.createElement('video');
    el.loop = true; el.muted = true; el.playsInline = true; el.preload = 'none';
    /* muted and inline are what let a phone play it without being asked */
    el.setAttribute('playsinline', ''); el.setAttribute('muted', '');
    el.setAttribute('disablepictureinpicture', '');
    el.src = src;
    const tex = new THREE.VideoTexture(el);
    tex.colorSpace = THREE.SRGBColorSpace;
    const target = which === 1 ? p1.sA : which === 2 ? p2.sA : p2.sB;
    target.map = tex; target.needsUpdate = true;
    clips.push({ el, at: which === 1 ? 0.02 : which === 2 ? 0.38 : 0.70, armed: false });
    pending = true;
    return el;
  },
  /* the canvas cannot be read by a DOM tool, so the state is readable
     instead — this is how the section gets verified */
  state() {
    return {
      s: st.s, err: st.err,
      p1: p1.g.position.toArray().map(n => +n.toFixed(3)),
      p2: p2.g.position.toArray().map(n => +n.toFixed(3)),
      rot1: +p1.g.rotation.y.toFixed(3), rot2: +p2.g.rotation.y.toFixed(3),
      scale1: +p1.g.scale.x.toFixed(3), scale2: +p2.g.scale.x.toFixed(3),
      o1: +p1.o.toFixed(3), o2: +p2.o.toFixed(3),
      /* the back's own fade, which must stay at nothing for as long as the
         body is see-through — otherwise the phone shows its camera through
         its own glass */
      back1: +p1.back[0].opacity.toFixed(3), back2: +p2.back[0].opacity.toFixed(3),
      screenA: +p2.sA.opacity.toFixed(3), screenB: +p2.sB.opacity.toFixed(3),
      notif: +p2.notifMat.opacity.toFixed(3),
      /* the card's own edges against the edges of the glass, so "it never
         leaves the phone" is a number rather than an impression */
      glass: [+(-SCREEN_H / 2).toFixed(4), +(SCREEN_H / 2).toFixed(4)],
      island: +(SCREEN_H / 2 - SCREEN_W * 0.026 - ISLAND_H).toFixed(4),
      card: [
        +(p2.notif.position.y - (NOTIF_PH / 2 - NOTIF_PH * (NOTIF_PAD / NOTIF_H)) * p2.notif.scale.x).toFixed(4),
        +(p2.notif.position.y + (NOTIF_PH / 2 - NOTIF_PH * (NOTIF_PAD / NOTIF_H)) * p2.notif.scale.x).toFixed(4),
      ],
      draws: renderer.info.render.calls,
      clips: clips.map(c => ({ at: c.at, paused: c.el.paused,
        ready: c.el.readyState, t: +c.el.currentTime.toFixed(2) })),
    };
  },
};
st.ready = true;
