/* The Apps tile: what makes an app of today, done the way iOS itself moves.
   The order's notification lands on the lock screen, then goes up into the
   Dynamic Island, which carries the order as a Live Activity, small, while
   it cooks; when it is ready the island opens with the news, and closes
   back over the camera with a green tick. Things come into the island out
   of a blur, and its shape moves on springs, as on the phone. A
   demonstration of the kind of app we build, under no client's name. */
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { useT, useFonts, seg, out3, out5, mix, clamp, Check, SANS } from './common';

export const TILE_S = 8;
export const APPS_S = 6.2;
export const TW = 840, TH = 1400;

const NAVY9 = '#05080F', NAVY8 = '#101A33', DEEP = '#2B3F7C', ORANGE = '#F08A3E', ORANGE2 = '#E0612A', GREEN = '#30D158';
// the phone, and its screen inside the render (measured off the frame)
const PW = 780, PX = (TW - PW) / 2, PY = 560, PH = PW * 2336 / 1120;
const SX = PX + PW * 0.0537, SY = PY + PH * 0.024, SW = PW * 0.8917, SHh = PH * 0.952;
const pt = SW / 402; // one iOS point on this screen
const P = (n: number) => n * pt;
// the hardware island, in points from the screen's top left
const ISL = { top: 12.9, h: 37.1, w: 125.7, cx: 201.2 };
// the notification on the lock screen, in points
const BAN = { l: 14, t: 236, w: 374, h: 72, r: 26 };

// an example, not a client: the app is yours
const Icon: React.FC<{ src: string; s: number }> = ({ src, s }) => (
  <Img src={staticFile(src)} style={{ width: s, height: s, borderRadius: s * 0.225, flex: 'none', display: 'block' }} />
);
const JERES = 'ny/media/ic/jeres.svg';

// content comes into the island the way iOS brings it: out of a blur
const blurIn = (q: number, from = 0.9): React.CSSProperties => ({
  opacity: clamp(q), filter: q < 0.999 ? `blur(${(1 - clamp(q)) * P(7)}px)` : undefined, transform: `scale(${mix(from, 1, clamp(q))})`,
});

// a line of text that changes the way iOS changes it: the old one goes up
// into a blur, the new one comes up out of one
const Roll: React.FC<{ items: [string, number, string][]; t: number; size: number }> = ({ items, t, size }) => (
  <span style={{ position: 'relative', display: 'block', height: P(size * 1.2) }}>
    {items.map(([txt, at, color], i) => {
      const next = items[i + 1];
      const inn = i === 0 ? 1 : out3(seg(t, at, at + 0.3));
      const go = next ? out3(seg(t, next[1], next[1] + 0.22)) : 0;
      const o = inn * (1 - go);
      if (o <= 0.001) return null;
      return <span key={txt} style={{ position: 'absolute', left: 0, top: 0, whiteSpace: 'nowrap', font: `600 ${P(size)}px/1.2 ${SANS}`, color, letterSpacing: P(-0.3),
        opacity: o, transform: `translateY(${((1 - inn) * 10 - go * 10) * pt}px)`, filter: o < 0.99 ? `blur(${(1 - o) * P(4)}px)` : undefined }}>{txt}</span>;
    })}
  </span>
);

// the lens of the front camera, cut from the frame itself, so it is seen
// through the island as on the phone
const LENS = { x: PX + 670.3 * (PW / 1120), y: PY + 135.3 * (PW / 1120), r: 17 * (PW / 1120) };
const Lens: React.FC = () => (
  <div style={{ position: 'absolute', left: LENS.x - LENS.r, top: LENS.y - LENS.r, width: LENS.r * 2, height: LENS.r * 2, borderRadius: '50%', overflow: 'hidden' }}>
    <Img src={staticFile('ny/media/dev/iphone-17-pro-2x.webp')} style={{ position: 'absolute', left: PX - (LENS.x - LENS.r), top: PY - (LENS.y - LENS.r), width: PW, height: PH, maxWidth: 'none' }} />
  </div>
);

// the order's three stages, the last filling as it is reached
const Stages: React.FC<{ f: number[] }> = ({ f: fills }) => {
  const last = fills[2];
  return (
  <div>
    <div style={{ display: 'flex', gap: P(4) }}>
      {fills.map((f, i) => (
        <span key={i} style={{ position: 'relative', flex: 1, height: P(6), borderRadius: P(3), background: 'rgba(255,255,255,.16)', overflow: 'hidden' }}>
          <i style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${100 * f}%`, borderRadius: P(3), background: last > 0.02 ? GREEN : ORANGE }} />
        </span>
      ))}
    </div>
    <div style={{ display: 'flex', gap: P(4), marginTop: P(9), font: `500 ${P(12)}px/1 ${SANS}` }}>
      {['Modtaget', 'Tilberedes', 'Klar'].map((s, i) => (
        <span key={s} style={{ flex: 1, color: i < 2 ? `rgba(255,255,255,${mix(0.4, 0.7, fills[i])})` : `rgba(${mix(255, 48, last) | 0},${mix(255, 209, last) | 0},${mix(255, 88, last) | 0},${mix(0.4, 1, last)})` }}>{s}</span>
      ))}
    </div>
  </div>
  );
};

// the status bar, as iOS draws it beside the island
// net: signal and wi-fi, which iOS hides while the island is wide; all:
// the whole bar, hidden while the island is open over it
const Status: React.FC<{ net: number; all: number }> = ({ net, all }) => (
  <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: P(54), color: '#fff', opacity: all }}>
    <svg style={{ position: 'absolute', right: P(26), top: P(19) }} width={P(76)} height={P(14)} viewBox="0 0 76 14">
      <g opacity={net}>
        {[0, 1, 2, 3].map(i => <rect key={i} x={i * 5} y={10 - i * 2.6} width="3.2" height={3.4 + i * 2.6} rx="0.9" fill="#fff" />)}
        <path d="M31 4.2a9.6 9.6 0 0 1 13 0M33.4 7a6.2 6.2 0 0 1 8.2 0M35.8 9.8a2.8 2.8 0 0 1 3.4 0" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" />
      </g>
      <rect x="50" y="1.5" width="22" height="11" rx="3.4" fill="none" stroke="rgba(255,255,255,.45)" strokeWidth="1.1" />
      <rect x="52" y="3.5" width="18" height="7" rx="1.8" fill="#fff" />
      <path d="M73.6 5.6v2.8a1.5 1.5 0 0 0 0-2.8z" fill="rgba(255,255,255,.45)" />
    </svg>
  </div>
);


export const TileApps: React.FC = () => {
  useFonts();
  const { t, sp } = useT();

  // 1. the notification lands on the lock screen, from below, on a spring
  const LAND = 0.35;
  const land = sp(LAND, 18, 170);
  // 2. and goes up into the island: its words go out of a blur, its shape
  //    narrows to the island's and darkens to it
  const UP = 1.65;
  const bm = t < UP ? 1 : 1 - sp(UP, 21, 165);
  const bContent = 1 - seg(t, UP, UP + 0.16);
  const showBanner = t > LAND - 0.05 && !(t > UP + 0.2 && bm <= 0.004);
  // 3. the island swallows it, and opens straight away as the Live Activity,
  //    where the order loads through its three stages
  const GULP = UP + 0.34;
  const gulp = Math.sin(Math.PI * seg(t, GULP, GULP + 0.26));
  const OPEN = GULP + 0.12;
  const S1 = OPEN + 0.35, S2 = S1 + 0.5, S3 = S2 + 1.25;
  const fills = [out3(seg(t, S1 - 0.3, S1)), seg(t, S2 - 0.1, S3 - 0.1) ** 0.85, out3(seg(t, S3, S3 + 0.32))];
  const ready = out3(seg(t, S3, S3 + 0.2));
  // 4. ready: its words go, and it folds up round the camera, small, with a tick
  const CLOSE = S3 + 0.95;
  const g = t < CLOSE ? sp(OPEN, 15, 165) : 1 - sp(CLOSE, 26, 230);
  const openContent = seg(t, OPEN + 0.14, OPEN + 0.42) * (1 - seg(t, CLOSE - 0.12, CLOSE + 0.02));
  const compactVis = seg(t, CLOSE + 0.22, CLOSE + 0.5);
  const done = Math.sin(Math.PI * seg(t, S3, S3 + 0.3)); // a small lift when it is ready

  // the island's size: hardware → expanded → compact, never smaller than the hardware's
  const base = t < CLOSE ? ISL.w + 16 * gulp : 190;
  const ge = Math.max(0, g);
  const w = mix(base, 380, g) * (1 + 0.012 * done), h = mix(ISL.h + 2.5 * gulp, 150, ge) * (1 + 0.012 * done), r = mix((ISL.h + 2.5 * gulp) / 2, 44, ge);

  // the banner's shape, between the island's and its own
  const bl = mix(ISL.cx - ISL.w / 2, BAN.l, bm), bt = mix(ISL.top, BAN.t, bm) + (t < UP ? 46 * (1 - land) : 0), bw = mix(ISL.w, BAN.w, bm), bh = mix(ISL.h, BAN.h, bm), br = mix(ISL.h / 2, BAN.r, clamp(bm));
  const landed = clamp(land * 1.3);

  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 70% at 50% 100%, ${DEEP}, ${NAVY8} 48%, ${NAVY9})`, fontFamily: SANS, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: PX - 120, top: PY - 160, width: PW + 240, height: PW + 240, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(70,100,200,.35), transparent)' }} />

      {/* ---------- the lock screen, iOS 18's ---------- */}
      <div style={{ position: 'absolute', left: SX, top: SY, width: SW, height: SHh, borderRadius: '13% / 6.2%', overflow: 'hidden',
        background: `radial-gradient(130% 70% at 50% 0%, #3A55A8 0%, ${DEEP} 18%, ${NAVY8} 52%, ${NAVY9} 100%)` }}>
        <Status net={1 - seg(w, ISL.w + 8, ISL.w + 40)} all={1 - seg(ge, 0.05, 0.3)} />
        <svg style={{ position: 'absolute', left: P(201 - 9.5), top: P(57) }} width={P(19)} height={P(19)} viewBox="0 0 24 24">
          <rect x="5" y="10.5" width="14" height="10" rx="2.6" fill="#fff" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="#fff" strokeWidth="2.2" />
        </svg>
        <div style={{ position: 'absolute', top: P(78), left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,.88)', font: `600 ${P(18.5)}px/1 ${SANS}` }}>Torsdag 15. oktober</div>
        <div style={{ position: 'absolute', top: P(98), left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,.96)', font: `700 ${P(98)}px/1 ${SANS}`, letterSpacing: P(-3.6) }}>9:41</div>
      </div>
      <Img src={staticFile('ny/media/dev/iphone-17-pro-2x.webp')} style={{ position: 'absolute', left: PX, top: PY, width: PW, height: PH }} />

      {/* ---------- the notification: on the lock screen, then up into the island ---------- */}
      {showBanner && <div style={{ position: 'absolute', left: SX + P(bl), top: SY + P(bt), width: P(bw), height: P(bh), borderRadius: P(br), overflow: 'hidden',
        background: 'linear-gradient(160deg, rgba(255,255,255,.27), rgba(255,255,255,.13))',
        boxShadow: `inset 0 ${P(0.8)}px 0 rgba(255,255,255,${0.45 * bm}), inset 0 0 0 ${P(0.6)}px rgba(255,255,255,${0.12 * bm}), 0 ${P(10)}px ${P(28)}px rgba(0,0,0,${0.22 * clamp(bm)})`,
        opacity: landed, transform: t < UP ? `scale(${mix(0.94, 1, land)})` : undefined }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: P(BAN.w), height: P(BAN.h), display: 'flex', alignItems: 'center', gap: P(12), padding: `0 ${P(14)}px`, color: '#fff',
          ...blurIn(bContent, 0.8), transformOrigin: '50% 0' }}>
          <Icon src={JERES} s={P(38)} />
          <span style={{ display: 'flex', flexDirection: 'column', gap: P(3), flex: 1, minWidth: 0 }}>
            <span style={{ font: `500 ${P(12)}px/1 ${SANS}`, color: 'rgba(255,255,255,.6)', letterSpacing: P(0.3) }}>JERES APP</span>
            <b style={{ font: `600 ${P(15)}px/1.15 ${SANS}` }}>Din bestilling er modtaget</b>
            <span style={{ font: `400 ${P(14)}px/1.2 ${SANS}`, color: 'rgba(255,255,255,.8)' }}>3 retter · afhentning kl. 17.30</span>
          </span>
          <span style={{ alignSelf: 'flex-start', marginTop: P(14), font: `400 ${P(12)}px/1 ${SANS}`, color: 'rgba(255,255,255,.6)' }}>nu</span>
        </div>
        {/* it turns to the island's black on the way up */}
        <i style={{ position: 'absolute', inset: 0, background: '#000', opacity: seg(1 - bm, 0.12, 0.55) }} />
      </div>}

      {/* ---------- the Dynamic Island, exactly over the camera's ---------- */}
      <div style={{ position: 'absolute', left: SX + (ISL.cx - w / 2) * pt, top: SY + ISL.top * pt - 0.6 * pt, width: w * pt, height: (h + 1.2) * pt, borderRadius: (r + 0.6) * pt,
        background: '#000', overflow: 'hidden', boxShadow: g > 0.05 ? `0 ${P(12)}px ${P(34)}px rgba(0,0,0,.45)` : 'none' }}>
        {/* compact, as iOS lays it: the app's icon to the left of the camera,
            inset from the island's round end; a tick to the right of the lens */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: (ISL.h + 1.2) * pt, ...blurIn(compactVis, 0.7) }}>
          <span style={{ position: 'absolute', left: P(9.5), top: P((ISL.h + 1.2 - 20) / 2) }}><Icon src={JERES} s={P(20)} /></span>
          <span style={{ position: 'absolute', right: P(9.5), top: P((ISL.h + 1.2 - 20) / 2), width: P(20), height: P(20), borderRadius: '50%', background: GREEN,
            display: 'grid', placeItems: 'center', transform: `scale(${mix(0.5, 1, out3(seg(t, CLOSE + 0.28, CLOSE + 0.5)))})` }}>
            <Check p={seg(t, CLOSE + 0.34, CLOSE + 0.62)} size={5.4} color="#000" width={4} /></span>
        </div>
        {/* expanded, laid out round the camera as iOS lays it: the app to its
            left, the time to its right, the state and its stages under it */}
        <div style={{ position: 'absolute', left: (w - 380) / 2 * pt, top: 0, width: P(380), height: P(150), color: '#fff' }}>
          <div style={{ position: 'absolute', left: P(16), top: P(12), ...blurIn(openContent, 0.85), transformOrigin: '0 0' }}><Icon src={JERES} s={P(40)} /></div>
          <div style={{ position: 'absolute', right: P(20), top: P(13), textAlign: 'right', ...blurIn(openContent, 0.85), transformOrigin: '100% 0' }}>
            <span style={{ display: 'block', font: `600 ${P(22)}px/1 ${SANS}`, letterSpacing: P(-0.6) }}>17.30</span>
            <span style={{ display: 'block', marginTop: P(4), font: `500 ${P(12)}px/1 ${SANS}`, color: 'rgba(255,255,255,.55)' }}>afhentning</span>
          </div>
          <div style={{ position: 'absolute', left: P(18), right: P(20), top: P(62), ...blurIn(seg(t, OPEN + 0.22, OPEN + 0.5) * (1 - seg(t, CLOSE - 0.12, CLOSE + 0.02)), 0.95), transformOrigin: '50% 0' }}>
            <Roll t={t} size={20} items={[['Bestilling modtaget', 0, '#fff'], ['Tilberedes', S2 - 0.1, '#fff'], ['Klar til afhentning', S3, GREEN]]} />
            <div style={{ marginTop: P(14) }}><Stages f={fills} /></div>
          </div>
        </div>
      </div>
      {/* the camera, seen through the island */}
      <Lens />
    </AbsoluteFill>
  );
};
