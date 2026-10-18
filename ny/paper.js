/* Lesreg — the finale's sheet of paper, drawn live with WebGL.
   One sheet, printed with the picture it starts from: it crumples where it
   stands into a ball, and opens again into the mark. Its creases belong to
   the paper (they are worked out from where each point lies on the sheet),
   so the ball that opens is the ball that was made, and every facet takes
   the light as it turns. Nothing is a film; it is drawn at the screen's own
   sharpness. */

// simplex noise, 3D (Ashima Arts, MIT)
const NOISE = `
vec3 m289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 m289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 perm(vec4 x){return m289(((x*34.0)+1.0)*x);}
vec4 tis(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=m289(i);
  vec4 p=perm(perm(perm(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=tis(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

const VS = `#version 300 es
precision highp float;
in vec2 aUv;
in float aRnd;          // each point's own jolt, -1..1
uniform vec2 uView;     // the screen, in css px
uniform vec3 uPos;      // the sheet's middle, in css px (z toward the eye)
uniform float uSize;    // the sheet's side, in css px
uniform mat3 uRot;
uniform float uK;       // 0 flat .. 1 a ball
// the folds: each a straight crease through a point on the sheet, mountain
// or valley, fading out away from it - (x, y, angle, height) and its reach
uniform vec4 uF[100];
uniform float uR[100];
out vec2 vUv; out vec3 vP; out float vC;
${NOISE}
float folds(vec2 p){
  float h = 0.0;
  for (int i = 0; i < 100; i++) {
    vec4 f = uF[i]; vec2 q = p - f.xy;
    h += f.w * abs(dot(q, vec2(cos(f.z), sin(f.z)))) * exp(-dot(q, q) / (uR[i] * uR[i]));
  }
  return h;
}
void main(){
  vUv = aUv;
  vec2 d = aUv - 0.5;
  float r = length(d) / 0.70711;
  float ang = atan(d.y, d.x);
  // the edges go first, the middle last
  float kv = clamp(uK * 1.4 - (1.0 - r) * 0.4, 0.0, 1.0);
  float ke = kv * kv * (3.0 - 2.0 * kv);
  // wrapped round a ball: the middle of the sheet to the front, its corners
  // gathered behind
  // by the square's own measure, so every edge is drawn round to the back
  float rq = max(abs(d.x), abs(d.y)) * 2.0;
  float pol = mix(r, rq, 0.8) * 3.0;
  vec3 dir = vec3(sin(pol) * cos(ang), sin(pol) * sin(ang), cos(pol));
  // creases, fixed to the paper: flat facets between straight folds
  float c = clamp(folds(d), -0.09, 0.09);
  float lump = snoise(vec3(d * 2.2, 7.0));
  vec3 ball = dir * (0.19 + 0.32 * clamp(c, -0.12, 0.12) + 0.018 * aRnd + 0.012 * lump);
  // the depth comes last, so half way the paper is a crumpled sheet and
  // not a cushion
  vec3 p = mix(vec3(d, 0.0), ball, ke);
  p.z = ball.z * ke * ke;
  vec3 nrm = normalize(mix(vec3(0.0, 0.0, 1.0), dir, ke));
  // while it crumples the folds stand up hard, more at the edges
  // the creases come up hard at once and stay while the paper moves, going
  // only as it lies flat
  float hold = smoothstep(0.0, 0.3, kv);
  float amp = hold * (0.55 + 0.45 * r) * (1.0 - 0.7 * ke);
  p += nrm * (c * amp * 0.9 + aRnd * 0.024 * hold * (1.0 - ke) + lump * 0.015 * kv);
  vC = c;
  // turned about the ball's own middle, which sits back from the sheet's
  // plane so the ball does not swell toward the eye
  vec3 w = uRot * (p * uSize) + uPos - vec3(0.0, 0.0, 0.19 * ke * uSize);
  vP = w;
  float D = 2400.0, wq = (D - w.z) / D;
  vec2 ndc = vec2((w.x - uView.x * 0.5) / (uView.x * 0.5), -(w.y - uView.y * 0.5) / (uView.y * 0.5));
  gl_Position = vec4(ndc, -w.z / 6000.0 * wq, wq);
}`;

const FS = `#version 300 es
precision highp float;
in vec2 vUv; in vec3 vP; in float vC;
uniform sampler2D uTex;
uniform float uBlank, uCut, uK, uFade;
out vec4 o;
void main(){
  // the mark's corner, cut as the sheet comes to be the mark
  if (vUv.x - vUv.y > 1.0 - uCut) discard;
  // a facet's own slope: y runs down the screen, so the cross is turned
  vec3 N = normalize(cross(dFdy(vP), dFdx(vP)));
  if (N.z < 0.0) N = -N;
  vec3 cream = vec3(246.0, 244.0, 239.0) / 255.0;
  vec3 base = !gl_FrontFacing ? mix(texture(uTex, vUv).rgb, cream, uBlank) : cream * 0.97;
  // light from the upper left; a flat sheet is lit exactly as printed
  vec3 L = normalize(vec3(-0.42, -0.55, 0.72));
  float amb = 0.36, flatL = amb + (1.0 - amb) * L.z;
  float sh = (amb + (1.0 - amb) * max(dot(N, L), 0.0)) / flatL;
  sh *= 1.0 - 1.2 * uK * clamp(-vC, 0.0, 0.2);
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  // paper has a soft sheen: the facets that face the light catch it
  float sp = pow(max(dot(N, H), 0.0), 16.0) * 0.36 * uK;
  o = vec4((base * sh + sp) * uFade, uFade);
}`;

export function createPaper(canvas, src) {
  const gl = canvas.getContext('webgl2', { antialias: true, premultipliedAlpha: true, alpha: true });
  if (!gl) return null;
  const sh = (type, code) => { const s = gl.createShader(type); gl.shaderSource(s, code); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
  gl.useProgram(pr);
  // the sheet: a fine grid, its inner points nudged so the facets are not
  // all alike
  const n = 42, uv = [], idx = [], jolt = [];
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
    const inner = i > 0 && i < n && j > 0 && j < n;
    uv.push((i + (inner ? (rnd() - 0.5) * 0.7 : 0)) / n, (j + (inner ? (rnd() - 0.5) * 0.7 : 0)) / n);
    jolt.push(rnd() * 2 - 1);
  }
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const a = j * (n + 1) + i, b = a + 1, c = a + n + 1, d = c + 1;
    if ((i + j) % 2) idx.push(a, b, d, a, d, c); else idx.push(a, b, c, b, d, c);
  }
  const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'aUv'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const jb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, jb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(jolt), gl.STATIC_DRAW);
  const jl = gl.getAttribLocation(pr, 'aRnd'); gl.enableVertexAttribArray(jl); gl.vertexAttribPointer(jl, 1, gl.FLOAT, false, 0, 0);
  const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(idx), gl.STATIC_DRAW);
  const U = {}; ['uView', 'uPos', 'uSize', 'uRot', 'uK', 'uTex', 'uBlank', 'uCut', 'uFade', 'uF', 'uR'].forEach(k => U[k] = gl.getUniformLocation(pr, k));
  // a hundred folds, laid once over the sheet: a few long ones, more that
  // are shorter, many small; mountain and valley in turn
  const F = [], R = [];
  for (let i = 0; i < 100; i++) {
    const size = i < 14 ? 0 : i < 46 ? 1 : 2;
    F.push((rnd() - 0.5) * 1.1, (rnd() - 0.5) * 1.1, rnd() * Math.PI, (i % 2 ? 1 : -1) * [0.5, 0.45, 0.4][size] * (0.6 + 0.4 * rnd()));
    R.push([0.26 + 0.2 * rnd(), 0.1 + 0.08 * rnd(), 0.04 + 0.04 * rnd()][size]);
  }
  gl.uniform4fv(U.uF, new Float32Array(F)); gl.uniform1fv(U.uR, new Float32Array(R));
  const tex = gl.createTexture(); let ready = false;
  const img = new Image(); img.decoding = 'async';
  img.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    ready = true; api.onready && api.onready();
  };
  img.src = src;
  gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  const api = {
    get ready() { return ready; },
    // s: { W, H, dpr, x, y, z, size, rx, ry, rz (radians), k, blank, cut, fade }
    draw(s) {
      const w = Math.round(s.W * s.dpr), h = Math.round(s.H * s.dpr);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      if (!ready || s.fade <= 0) return;
      const cx = Math.cos(s.rx), sx = Math.sin(s.rx), cy = Math.cos(s.ry), sy = Math.sin(s.ry), cz = Math.cos(s.rz), sz = Math.sin(s.rz);
      // Rz * Ry * Rx, column-major
      const m = [
        cz * cy, sz * cy, -sy,
        cz * sy * sx - sz * cx, sz * sy * sx + cz * cx, cy * sx,
        cz * sy * cx + sz * sx, sz * sy * cx - cz * sx, cy * cx];
      gl.uniform2f(U.uView, s.W, s.H); gl.uniform3f(U.uPos, s.x, s.y, s.z || 0);
      gl.uniform1f(U.uSize, s.size); gl.uniformMatrix3fv(U.uRot, false, m);
      gl.uniform1f(U.uK, s.k); gl.uniform1f(U.uBlank, s.blank); gl.uniform1f(U.uCut, s.cut); gl.uniform1f(U.uFade, s.fade);
      gl.uniform1i(U.uTex, 0);
      gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_INT, 0);
    },
  };
  return api;
}
