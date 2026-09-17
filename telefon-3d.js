/* ============================================================
   LESREG — the phone.

   A real phone in three.js rather than a CSS frame, because this
   section turns it over: it arrives out of nothing, spins once, steps
   aside for a second one, and takes a notification on the glass while
   it buzzes. None of that survives being faked with boxes and shadows.

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
   over the page as DOM, so it turns and tilts with the phone. */
function notificationTexture() {
  const c = document.createElement('canvas');
  c.width = 900; c.height = 560;
  const x = c.getContext('2d');
  const F = '-apple-system, "SF Pro Text", "Helvetica Neue", Helvetica, sans-serif';

  function card(ox, oy, w, h, alpha, scale) {
    x.save();
    x.globalAlpha = alpha;
    x.translate(ox + w / 2, oy + h / 2); x.scale(scale, scale); x.translate(-(w / 2), -(h / 2));
    x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 34; x.shadowOffsetY = 12;
    x.fillStyle = 'rgba(30,29,27,.9)';
    x.beginPath(); x.roundRect(0, 0, w, h, 40); x.fill();
    x.shadowColor = 'transparent';
  }

  // the one underneath, already read
  card(30, 18, 840, 200, 0.55, 0.92);
  x.fillStyle = 'rgba(247,241,232,.82)';
  x.font = '600 30px ' + F;
  x.fillText('Anders Bay Nielsen', 90, 84);
  x.font = '400 28px ' + F;
  x.fillStyle = 'rgba(247,241,232,.6)';
  x.fillText('kl. 17:30 · To-go · 2 t. siden', 90, 132);
  x.restore();

  // the one that just landed
  card(30, 230, 840, 300, 1, 1);
  x.fillStyle = '#e8712f';
  x.beginPath(); x.roundRect(64, 38, 84, 84, 16); x.fill();
  // a chef's hat, drawn rather than fetched
  x.fillStyle = '#fff';
  x.beginPath();
  x.arc(92, 68, 15, 0, Math.PI * 2); x.arc(106, 61, 17, 0, Math.PI * 2);
  x.arc(120, 68, 15, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.roundRect(88, 72, 36, 26, 4); x.fill();
  x.fillStyle = 'rgba(232,113,47,.9)';
  x.fillRect(88, 86, 36, 3);

  x.fillStyle = 'rgba(247,241,232,.72)';
  x.font = '600 26px ' + F;
  x.fillText('Ny bestilling', 168, 68);
  x.textAlign = 'right';
  x.font = '400 26px ' + F;
  x.fillText('nu', 782, 68);
  x.textAlign = 'left';
  x.fillStyle = '#fdf7ee';
  x.font = '600 32px ' + F;
  x.fillText('from Spiis Admin', 168, 116);
  x.font = '400 31px ' + F;
  x.fillStyle = 'rgba(253,247,238,.92)';
  x.fillText('Sofie Kragh', 168, 166);
  x.font = '400 29px ' + F;
  x.fillStyle = 'rgba(253,247,238,.66)';
  x.fillText('kl. 18:00 · 2 pers. · Spiser her', 168, 212);
  x.restore();

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
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

/* The back. The plateau across the top says iPhone 17 Pro louder than
   anything else on the device, and act one turns the phone a whole
   revolution — so for a third of that turn the back is what is being
   looked at. Left flat it read as a grey slab. */
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
const btnGeo    = new THREE.BoxGeometry(0.012, 1, D * 0.62);
const shadowGeo = new THREE.PlaneGeometry(W * 3.1, W * 2.2);
const notifGeo  = new THREE.PlaneGeometry(SCREEN_W * 0.94, SCREEN_W * 0.94 * (560 / 900));
const notifTex  = notificationTexture();
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
  notif.position.set(0, H * 0.285, D / 2 + 0.0046);
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

  const plateau = new THREE.Mesh(plateauGeo, titan);
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

  /* the buttons sit where they sit on the phone: measured down from the
     top edge as a share of the body, not eyeballed */
  const btnMat = new THREE.MeshStandardMaterial({ color: 0xbdb8b2, metalness: 1, roughness: 0.24, transparent: true });
  [[-1, 0.22, 0.07], [-1, 0.32, 0.11], [-1, 0.455, 0.11], [1, 0.30, 0.15]]
    .forEach(([side, top, len]) => {
      const b = new THREE.Mesh(btnGeo, btnMat);
      b.scale.y = len * H;
      b.position.set(side * W / 2, H / 2 - (top + len / 2) * H, 0);
      g.add(b);
    });

  const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
  const shade = new THREE.Mesh(shadowGeo, shadowMat);
  shade.rotation.x = -Math.PI / 2.1;
  shade.position.y = -H * 0.56;
  g.add(shade);

  g.visible = false;
  scene.add(g);
  return { g, body: [titan, bezelMat, btnMat, islandMat, backMat, lensMetal, lensGlass, flashMat],
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
  return window.innerWidth < 900
    ? { y1: 0.34, s1: 0.62, x2: 0,     y2: 0.36, s2: 0.62 }
    : { y1: 0.34, s1: 0.72, x2: -0.66, y2: 0,    s2: 0.86 };
}

/* ---------- the three acts ---------- */
function pose(s) {
  /* 1 — it arrives out of nothing, turns one whole revolution on the way
     in, and settles in the upper half so the words have the bottom third
     to themselves. Then it slides off to the left. */
  const e1 = slow(seg(s, 0, 0.32));
  const x1 = io(seg(s, 0.34, 0.50));
  p1.g.scale.setScalar(0.04 + (L.s1 - 0.04) * e1);
  p1.g.position.set(-2.9 * x1,
                    0.46 + (L.y1 - 0.46) * e1,
                    -3.4 + 3.4 * e1 + 0.5 * x1);
  p1.g.rotation.set(0.1 * (1 - e1), Math.PI * 2 * (1 - e1) - 0.5 * x1, 0);
  setOpacity(p1, Math.min(seg(s, 0.02, 0.10), 1 - x1));

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
  p2.notif.visible = p2.mix.n > 0.002;
  p2.notif.position.y = H * 0.285 + (1 - p2.mix.n) * 0.55 * H;
  setOpacity(p2, seg(s, 0.36, 0.44));

  camera.position.y = Math.sin(s * Math.PI) * 0.04;
  camera.lookAt(0, 0, 0);
}

/* ---------- fitting the room to the window ---------- */
function resize() {
  const host = canvas.parentElement;
  const w = Math.max(1, Math.round(host.clientWidth));
  const h = Math.max(1, Math.round(host.clientHeight));
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
      screenA: +p2.sA.opacity.toFixed(3), screenB: +p2.sB.opacity.toFixed(3),
      notif: +p2.notifMat.opacity.toFixed(3),
      draws: renderer.info.render.calls,
      clips: clips.map(c => ({ at: c.at, paused: c.el.paused,
        ready: c.el.readyState, t: +c.el.currentTime.toFixed(2) })),
    };
  },
};
st.ready = true;
