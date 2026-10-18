/* Lesreg — the finale's sheet of paper, drawn live with WebGL.
   One sheet, printed with the picture it starts from. How it crumples is
   not made up: it is a simulation of a sheet of paper (it does not stretch,
   it keeps the creases it is given, it cannot pass through itself) squeezed
   into a ball, worked out once and kept in media/alt/crumple.bin. Played
   forward it crumples; played back it opens again. Every crease takes the
   light as the sheet turns, and it is drawn at the screen's own sharpness. */

const VS = `#version 300 es
precision highp float;
in vec3 aPos; in vec3 aNrm; in vec2 aUv; in float aAo;
uniform vec2 uView;     // the screen, in css px
uniform vec3 uPos;      // the sheet's middle, in css px (z toward the eye)
uniform float uSize;    // the sheet's side, in css px
uniform mat3 uRot;
out vec2 vUv; out vec3 vN; out float vAo; out vec3 vW;
void main(){
  vUv = aUv; vAo = aAo;
  // the simulation runs y up; the screen runs y down
  vec3 p = vec3(aPos.x, -aPos.y, aPos.z), n = vec3(aNrm.x, -aNrm.y, aNrm.z);
  vN = uRot * n;
  vec3 w = uRot * (p * uSize) + uPos;
  vW = w;
  float D = 2400.0, wq = (D - w.z) / D;
  vec2 ndc = vec2((w.x - uView.x * 0.5) / (uView.x * 0.5), -(w.y - uView.y * 0.5) / (uView.y * 0.5));
  gl_Position = vec4(ndc, -w.z / 6000.0 * wq, wq);
}`;

const FS = `#version 300 es
precision highp float;
in vec2 vUv; in vec3 vN; in float vAo; in vec3 vW;
uniform sampler2D uTex;
uniform float uBlank, uCut, uK, uFade;
out vec4 o;
float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y); }
// fine creases: sharp ridges of a little noise, too small for the sheet
// itself to carry
float ridges(vec2 p){ return 1.0 - abs(vn(p) * 2.0 - 1.0) * 0.6 - abs(vn(p * 2.3 + 7.1) * 2.0 - 1.0) * 0.4; }
void main(){
  if (vUv.x - vUv.y > 1.0 - uCut) discard;
  vec3 N = normalize(vN);
  if (!gl_FrontFacing) N = -N;
  // paper creases are sharp: half of each facet's own slope in with the
  // smooth one (y runs down the screen, so the cross is turned)
  vec3 F = normalize(cross(dFdy(vW), dFdx(vW)));
  if (dot(F, N) < 0.0) F = -F;
  N = normalize(mix(N, F, 0.55 * uK));
  // the fine creases tilt the light a little, more as the paper is worked
  vec2 q = vUv * 46.0; float e = 0.02;
  float r0 = ridges(q), rx = ridges(q + vec2(e, 0.0)), ry = ridges(q + vec2(0.0, e));
  N = normalize(N + vec3(rx - r0, -(ry - r0), 0.0) / e * 0.012 * uK);
  vec3 cream = vec3(246.0, 244.0, 239.0) / 255.0;
  vec3 base = gl_FrontFacing ? mix(texture(uTex, vUv).rgb, cream, uBlank) : cream * 0.96;
  // a soft key from the upper left, the light wrapping a little round the
  // creases; a flat sheet is lit exactly as printed
  vec3 L = normalize(vec3(-0.42, -0.55, 0.72));
  float wr = 0.35, amb = 0.34;
  float dif = clamp((dot(N, L) + wr) / (1.0 + wr), 0.0, 1.0);
  float flatD = (L.z + wr) / (1.0 + wr);
  float sh = (amb + (1.0 - amb) * dif) / (amb + (1.0 - amb) * flatD);
  sh *= mix(1.0, vAo, uK);
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float sp = pow(max(dot(N, H), 0.0), 22.0) * 0.22 * uK;
  o = vec4((base * sh + sp) * uFade, uFade);
}`;

export function createPaper(canvas, tex, crumple) {
  const gl = canvas.getContext('webgl2', { antialias: true, premultipliedAlpha: true, alpha: true });
  if (!gl) return null;
  const sh = (type, code) => { const s = gl.createShader(type); gl.shaderSource(s, code); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
  gl.useProgram(pr);
  const U = {}; ['uView', 'uPos', 'uSize', 'uRot', 'uTex', 'uBlank', 'uCut', 'uK', 'uFade'].forEach(k => U[k] = gl.getUniformLocation(pr, k));
  const buf = (loc, size) => { const b = gl.createBuffer(); const l = gl.getAttribLocation(pr, loc); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, size, gl.FLOAT, false, 0, 0); return b; };
  const bPos = buf('aPos', 3), bNrm = buf('aNrm', 3), bUv = buf('aUv', 2), bAo = buf('aAo', 1);
  let G = 0, FR = 0, frames = null, idx = null, pos, nrm, ao, texReady = false, simReady = false;

  fetch(crumple).then(r => r.arrayBuffer()).then(ab => {
    const hd = new Int32Array(ab, 0, 2); G = hd[0]; FR = hd[1];
    const q = new Int16Array(ab, 8, G * G * 3 * FR);
    frames = new Float32Array(q.length); for (let i = 0; i < q.length; i++) frames[i] = q[i] / 32767 * 0.8;
    const n = G * G, uv = new Float32Array(n * 2), ix = [];
    for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) { uv[(j * G + i) * 2] = i / (G - 1); uv[(j * G + i) * 2 + 1] = 1 - j / (G - 1); }
    for (let j = 0; j < G - 1; j++) for (let i = 0; i < G - 1; i++) { const a = j * G + i, b = a + 1, c = a + G, d = c + 1; ix.push(a, b, d, a, d, c); }
    idx = new Uint16Array(ix);
    pos = new Float32Array(n * 3); nrm = new Float32Array(n * 3); ao = new Float32Array(n);
    gl.bindBuffer(gl.ARRAY_BUFFER, bUv); gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);
    const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    simReady = true; api.onready && texReady && api.onready();
  }).catch(() => {});

  const tx = gl.createTexture();
  const img = new Image(); img.decoding = 'async';
  img.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, tx);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    texReady = true; api.onready && simReady && api.onready();
  };
  img.src = tex;
  gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  // the sheet at k (0 flat .. 1 a ball): between two of the kept frames;
  // its normals from its faces, and how shut in each point is (a crease's
  // valley, the inside of the ball) from how far its neighbours stand out
  // in front of it
  function shape(k) {
    const f = Math.min(FR - 1, Math.max(0, k * (FR - 1))), a = Math.floor(f), b = Math.min(FR - 1, a + 1), t = f - a;
    const n = G * G, A = a * n * 3, B = b * n * 3;
    for (let i = 0; i < n * 3; i++) pos[i] = frames[A + i] + (frames[B + i] - frames[A + i]) * t;
    nrm.fill(0);
    for (let i = 0; i < idx.length; i += 3) {
      const p = idx[i] * 3, q = idx[i + 1] * 3, r = idx[i + 2] * 3;
      const ux = pos[q] - pos[p], uy = pos[q + 1] - pos[p + 1], uz = pos[q + 2] - pos[p + 2];
      const vx = pos[r] - pos[p], vy = pos[r + 1] - pos[p + 1], vz = pos[r + 2] - pos[p + 2];
      const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
      nrm[p] += cx; nrm[p + 1] += cy; nrm[p + 2] += cz;
      nrm[q] += cx; nrm[q + 1] += cy; nrm[q + 2] += cz;
      nrm[r] += cx; nrm[r + 1] += cy; nrm[r + 2] += cz;
    }
    for (let i = 0; i < n; i++) { const s = i * 3, l = Math.hypot(nrm[s], nrm[s + 1], nrm[s + 2]) || 1; nrm[s] /= l; nrm[s + 1] /= l; nrm[s + 2] /= l; }
    const h = 1 / (G - 1);
    for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
      const s = j * G + i; let cx = 0, cy = 0, cz = 0, c = 0;
      if (i > 0) { const o = s * 3 - 3; cx += pos[o]; cy += pos[o + 1]; cz += pos[o + 2]; c++; }
      if (i < G - 1) { const o = s * 3 + 3; cx += pos[o]; cy += pos[o + 1]; cz += pos[o + 2]; c++; }
      if (j > 0) { const o = (s - G) * 3; cx += pos[o]; cy += pos[o + 1]; cz += pos[o + 2]; c++; }
      if (j < G - 1) { const o = (s + G) * 3; cx += pos[o]; cy += pos[o + 1]; cz += pos[o + 2]; c++; }
      const o = s * 3, dx = cx / c - pos[o], dy = cy / c - pos[o + 1], dz = cz / c - pos[o + 2];
      const conc = (dx * nrm[o] + dy * nrm[o + 1] + dz * nrm[o + 2]) / h;
      ao[s] = Math.max(0.45, Math.min(1.1, 1 - conc * 1.6));
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, bPos); gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, bNrm); gl.bufferData(gl.ARRAY_BUFFER, nrm, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, bAo); gl.bufferData(gl.ARRAY_BUFFER, ao, gl.DYNAMIC_DRAW);
  }

  let lastK = -1;
  const api = {
    get ready() { return texReady && simReady; },
    // s: { W, H, dpr, x, y, z, size, rx, ry, rz (radians), k, blank, cut, fade }
    draw(s) {
      const w = Math.round(s.W * s.dpr), hh = Math.round(s.H * s.dpr);
      if (canvas.width !== w || canvas.height !== hh) { canvas.width = w; canvas.height = hh; }
      gl.viewport(0, 0, w, hh);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      if (!api.ready || s.fade <= 0) return;
      if (s.k !== lastK) { shape(s.k); lastK = s.k; }
      const cx = Math.cos(s.rx), sx = Math.sin(s.rx), cy = Math.cos(s.ry), sy = Math.sin(s.ry), cz = Math.cos(s.rz), sz = Math.sin(s.rz);
      const m = [
        cz * cy, sz * cy, -sy,
        cz * sy * sx - sz * cx, sz * sy * sx + cz * cx, cy * sx,
        cz * sy * cx + sz * sx, sz * sy * cx - cz * sx, cy * cx];
      gl.uniform2f(U.uView, s.W, s.H); gl.uniform3f(U.uPos, s.x, s.y, s.z || 0);
      gl.uniform1f(U.uSize, s.size); gl.uniformMatrix3fv(U.uRot, false, m);
      gl.uniform1f(U.uK, Math.min(1, s.k * 3)); gl.uniform1f(U.uBlank, s.blank); gl.uniform1f(U.uCut, s.cut); gl.uniform1f(U.uFade, s.fade);
      gl.uniform1i(U.uTex, 0);
      gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
    },
  };
  return api;
}
