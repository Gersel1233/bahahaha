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
export const APPS_S = 6.6;
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

// the minutes left, from 8 down to 1, each new number rolling up into place
// out of a blur, as iOS changes a number
const Minutes: React.FC<{ fill: number }> = ({ fill }) => {
  const steps = 7, x = clamp(fill) * steps, n = Math.min(steps, Math.floor(x)), q = n >= steps ? 1 : out3(clamp((x - n) / 0.45));
  const now = 8 - n, before = now + 1;
  const num = (v: number, y: number, o: number) => (
    <span style={{ position: 'absolute', right: P(30), top: 0, height: P(22), display: 'flex', alignItems: 'center', font: `600 ${P(15)}px/1 ${SANS}`, color: ORANGE,
      transform: `translateY(${y}px)`, opacity: o, filter: o < 0.99 ? `blur(${(1 - o) * P(3)}px)` : undefined }}>{v}</span>
  );
  return (
    <>
      {n > 0 && q < 1 && num(before, -q * P(12), 1 - q)}
      {num(now, n > 0 ? (1 - q) * P(12) : 0, n > 0 ? q : 1)}
      <span style={{ position: 'absolute', right: P(2), top: 0, height: P(22), display: 'flex', alignItems: 'center', font: `600 ${P(15)}px/1 ${SANS}`, color: ORANGE }}>min</span>
    </>
  );
};

// the order's three stages, the last filling as it is reached
const Stages: React.FC<{ last: number }> = ({ last }) => (
  <div>
    <div style={{ display: 'flex', gap: P(4) }}>
      {[1, 1, last].map((f, i) => (
        <span key={i} style={{ position: 'relative', flex: 1, height: P(6), borderRadius: P(3), background: 'rgba(255,255,255,.16)', overflow: 'hidden' }}>
          <i style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${100 * f}%`, borderRadius: P(3), background: GREEN }} />
        </span>
      ))}
    </div>
    <div style={{ display: 'flex', gap: P(4), marginTop: P(9), font: `500 ${P(12)}px/1 ${SANS}` }}>
      {['Modtaget', 'Tilberedes', 'Klar'].map((s, i) => (
        <span key={s} style={{ flex: 1, color: i < 2 ? 'rgba(255,255,255,.55)' : `rgba(${mix(255, 48, last) | 0},${mix(255, 209, last) | 0},${mix(255, 88, last) | 0},${mix(0.55, 1, last)})` }}>{s}</span>
      ))}
    </div>
  </div>
);

// the status bar, as iOS draws it beside the island
const Status: React.FC = () => (
  <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: P(54), color: '#fff' }}>
    <svg style={{ position: 'absolute', right: P(26), top: P(19) }} width={P(76)} height={P(14)} viewBox="0 0 76 14">
      {[0, 1, 2, 3].map(i => <rect key={i} x={i * 5} y={10 - i * 2.6} width="3.2" height={3.4 + i * 2.6} rx="0.9" fill="#fff" />)}
      <path d="M31 4.2a9.6 9.6 0 0 1 13 0M33.4 7a6.2 6.2 0 0 1 8.2 0M35.8 9.8a2.8 2.8 0 0 1 3.4 0" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" />
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
  // 3. the island takes the order: a little swallow, then the Live Activity
  const GULP = UP + 0.36;
  const gulp = Math.sin(Math.PI * seg(t, GULP, GULP + 0.28));
  const compactIn = sp(GULP + 0.16, 15, 190);
  const fill = clamp(seg(t, GULP + 0.4, 3.85) ** 0.9);
  // 4. ready: the island opens with the news, then closes again with a tick
  const OPEN = 3.9, CLOSE = 5.3;
  const g = t < CLOSE ? sp(OPEN, 13, 150) : 1 - sp(CLOSE, 17, 200);
  const openContent = seg(t, OPEN + 0.12, OPEN + 0.4) * (1 - seg(t, CLOSE - 0.04, CLOSE + 0.08));
  const ready = out3(seg(t, OPEN - 0.05, OPEN + 0.2));
  const compactVis = t < CLOSE ? clamp(seg(compactIn, 0.35, 1)) * (1 - seg(g, 0, 0.18)) : seg(t, CLOSE + 0.14, CLOSE + 0.4);

  // the island's size: hardware → compact → expanded → compact
  const cw = mix(ISL.w + 16 * gulp, 194, compactIn);
  const w = mix(cw, 380, g), h = mix(ISL.h + 2.5 * gulp, 142, g), r = mix((ISL.h + 2.5 * gulp) / 2, 46, Math.max(0, g));

  // the banner's shape, between the island's and its own
  const bl = mix(ISL.cx - ISL.w / 2, BAN.l, bm), bt = mix(ISL.top, BAN.t, bm) + (t < UP ? 46 * (1 - land) : 0), bw = mix(ISL.w, BAN.w, bm), bh = mix(ISL.h, BAN.h, bm), br = mix(ISL.h / 2, BAN.r, clamp(bm));
  const landed = clamp(land * 1.3);

  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 70% at 50% 100%, ${DEEP}, ${NAVY8} 48%, ${NAVY9})`, fontFamily: SANS, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: PX - 120, top: PY - 160, width: PW + 240, height: PW + 240, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(70,100,200,.35), transparent)' }} />

      {/* ---------- the lock screen, iOS 18's ---------- */}
      <div style={{ position: 'absolute', left: SX, top: SY, width: SW, height: SHh, borderRadius: '13% / 6.2%', overflow: 'hidden',
        background: `radial-gradient(130% 70% at 50% 0%, #3A55A8 0%, ${DEEP} 18%, ${NAVY8} 52%, ${NAVY9} 100%)` }}>
        <Status />
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
        {/* compact: the app on the left; on the right the minutes left, rolling
            down the way iOS rolls a number, and at the end the tick */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: (ISL.h + 1.2) * pt, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `0 ${P(7)}px 0 ${P(7)}px`,
          ...blurIn(compactVis, 0.7) }}>
          <Icon src={JERES} s={P(25)} />
          <span style={{ position: 'relative', width: P(58), height: P(22), overflow: 'hidden' }}>
            <span style={{ position: 'absolute', inset: 0, opacity: 1 - ready }}><Minutes fill={fill} /></span>
            <span style={{ position: 'absolute', right: P(4), top: 0, height: P(22), display: 'flex', alignItems: 'center', gap: P(4), font: `600 ${P(15)}px/1 ${SANS}`, color: GREEN, opacity: ready }}>
              <Check p={seg(t, CLOSE + 0.2, CLOSE + 0.55)} size={7.5} color={GREEN} width={3.4} />Klar</span>
          </span>
        </div>
        {/* expanded: the news, and the order's three stages */}
        <div style={{ position: 'absolute', left: (w - 380) / 2 * pt, top: 0, width: P(380), height: P(142), padding: `${P(20)}px ${P(22)}px`, color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: P(12), ...blurIn(openContent, 0.9), transformOrigin: '50% 0' }}>
            <Icon src={JERES} s={P(46)} />
            <span style={{ display: 'flex', flexDirection: 'column', gap: P(6), flex: 1 }}>
              <span style={{ font: `500 ${P(13)}px/1 ${SANS}`, color: 'rgba(255,255,255,.55)' }}>Jeres app</span>
              <span style={{ font: `600 ${P(20)}px/1.05 ${SANS}`, color: GREEN, letterSpacing: P(-0.3) }}>Klar til afhentning</span>
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: P(5) }}>
              <span style={{ font: `600 ${P(26)}px/1 ${SANS}`, letterSpacing: P(-0.8) }}>17.30</span>
              <span style={{ font: `500 ${P(12)}px/1 ${SANS}`, color: 'rgba(255,255,255,.55)' }}>afhentning</span>
            </span>
          </div>
          <div style={{ marginTop: P(22), ...blurIn(seg(t, OPEN + 0.2, OPEN + 0.46) * (1 - seg(t, CLOSE - 0.04, CLOSE + 0.08)), 0.96) }}>
            <Stages last={out3(seg(t, OPEN + 0.32, OPEN + 0.8))} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
