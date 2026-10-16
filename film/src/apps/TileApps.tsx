/* The Apps tile: what makes an app of today, done the way iOS itself moves.
   On the home screen, the app's widget orders again with one tap. The
   notification comes out of the Dynamic Island and goes back up into it;
   the island then carries the order as a Live Activity, small, while it
   cooks; when it is ready the island opens with the news, and closes back
   over the camera with a green tick. A demonstration of the kind of app we
   build, under no client's name. */
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { useT, useFonts, seg, out3, out5, mix, clamp, Check, SANS } from './common';

export const TILE_S = 8;
export const APPS_S = 6.8;
export const TW = 840, TH = 1400;

const NAVY9 = '#05080F', NAVY8 = '#101A33', DEEP = '#2B3F7C', ORANGE = '#F08A3E', ORANGE2 = '#E0612A', GREEN = '#30D158';
// the phone, and its screen inside the render (measured off the frame)
const PW = 780, PX = (TW - PW) / 2, PY = 560, PH = PW * 2336 / 1120;
const SX = PX + PW * 0.0537, SY = PY + PH * 0.024, SW = PW * 0.8917, SHh = PH * 0.952;
const pt = SW / 402; // one iOS point on this screen
const P = (n: number) => n * pt;
// the hardware island, in points from the screen's top left
const ISL = { top: 12.9, h: 37.1, w: 125.7, cx: 201.2 };
// a notification banner, in points
const BAN = { l: 10, t: 58, w: 382, h: 76, r: 25 };

// an example, not a client: the app is yours
const Icon: React.FC<{ src: string; s: number }> = ({ src, s }) => (
  <Img src={staticFile(src)} style={{ width: s, height: s, borderRadius: s * 0.225, flex: 'none', display: 'block' }} />
);
const JERES = 'ny/media/ic/jeres.svg';

// content comes into the island the way iOS brings it: out of a blur
const blurIn = (q: number, from = 0.9): React.CSSProperties => ({
  opacity: clamp(q), filter: q < 0.999 ? `blur(${(1 - clamp(q)) * P(7)}px)` : undefined, transform: `scale(${mix(from, 1, clamp(q))})`,
});

// a bar, full
const Bar: React.FC<{ h: number }> = ({ h }) => (
  <div style={{ position: 'relative', height: h, borderRadius: h / 2, background: `linear-gradient(90deg, rgba(48,209,88,.75), ${GREEN})` }} />
);

// the status bar, as iOS draws it beside the island
const Status: React.FC = () => (
  <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: P(54), color: '#fff' }}>
    <span style={{ position: 'absolute', left: P(52), top: P(18), font: `600 ${P(17)}px/1 ${SANS}`, letterSpacing: P(-0.3) }}>9:41</span>
    <svg style={{ position: 'absolute', right: P(32), top: P(19) }} width={P(76)} height={P(14)} viewBox="0 0 76 14">
      {[0, 1, 2, 3].map(i => <rect key={i} x={i * 5} y={10 - i * 2.6} width="3.2" height={3.4 + i * 2.6} rx="0.9" fill="#fff" />)}
      <path d="M31 4.2a9.6 9.6 0 0 1 13 0M33.4 7a6.2 6.2 0 0 1 8.2 0M35.8 9.8a2.8 2.8 0 0 1 3.4 0" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" />
      <rect x="50" y="1.5" width="22" height="11" rx="3.4" fill="none" stroke="rgba(255,255,255,.45)" strokeWidth="1.1" />
      <rect x="52" y="3.5" width="18" height="7" rx="1.8" fill="#fff" />
      <path d="M73.6 5.6v2.8a1.5 1.5 0 0 0 0-2.8z" fill="rgba(255,255,255,.45)" />
    </svg>
  </div>
);

const APPS: [string, string][] = [[JERES, 'Jeres app'], ['ny/media/ic/spiis.svg', 'Spiis'], ['ny/media/ic/mosede.png', 'Mosede'], ['ny/media/ic/callster.png', 'Callster']];

export const TileApps: React.FC = () => {
  useFonts();
  const { t, sp } = useT();

  // 1. one tap on the widget orders again
  const TAP = 0.6;
  const press = Math.sin(Math.PI * seg(t, TAP, TAP + 0.22));
  const bought = out3(seg(t, TAP + 0.18, TAP + 0.5));
  // 2. the notification comes out of the island, and goes back up into it
  const IN = 1.25, OUT = 2.75;
  const bm = t < OUT ? sp(IN, 16, 210) : 1 - sp(OUT, 19, 240);
  const bContent = seg(t, IN + 0.12, IN + 0.38) * (1 - seg(t, OUT - 0.02, OUT + 0.1));
  const showBanner = t > IN && !(t > OUT + 0.1 && bm <= 0.01);
  // 3. the island takes the order: a little swallow, then the Live Activity
  const gulp = Math.sin(Math.PI * seg(t, OUT + 0.2, OUT + 0.48));
  const compactIn = sp(OUT + 0.36, 15, 190);
  const fill = clamp(seg(t, 3.35, 4.5) ** 0.9);
  // 4. ready: the island opens with the news, then closes again with a tick
  const OPEN = 4.6, CLOSE = 5.95;
  const g = t < CLOSE ? sp(OPEN, 15, 165) : 1 - sp(CLOSE, 17, 200);
  const openContent = seg(t, OPEN + 0.14, OPEN + 0.42) * (1 - seg(t, CLOSE - 0.04, CLOSE + 0.08));
  const ready = out3(seg(t, OPEN - 0.05, OPEN + 0.2));
  const compactVis = t < CLOSE ? clamp(seg(compactIn, 0.35, 1)) * (1 - seg(g, 0, 0.18)) : seg(t, CLOSE + 0.14, CLOSE + 0.4);

  // the island's size: hardware → compact → expanded → compact
  const cw = mix(ISL.w + 16 * gulp, 212, compactIn);
  const w = mix(cw, 380, g), h = mix(ISL.h + 2.5 * gulp, 168, g), r = mix((ISL.h + 2.5 * gulp) / 2, 46, Math.max(0, g));

  // the banner's shape, between the island's and its own
  const bl = mix(ISL.cx - ISL.w / 2, BAN.l, bm), bt = mix(ISL.top, BAN.t, bm), bw = mix(ISL.w, BAN.w, bm), bh = mix(ISL.h, BAN.h, bm), br = mix(ISL.h / 2, BAN.r, clamp(bm));

  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 70% at 50% 100%, ${DEEP}, ${NAVY8} 48%, ${NAVY9})`, fontFamily: SANS, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: PX - 120, top: PY - 160, width: PW + 240, height: PW + 240, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(70,100,200,.35), transparent)' }} />

      {/* ---------- the home screen ---------- */}
      <div style={{ position: 'absolute', left: SX, top: SY, width: SW, height: SHh, borderRadius: '13% / 6.2%', overflow: 'hidden',
        background: `radial-gradient(90% 55% at 80% 8%, #4A66C0 0%, rgba(74,102,192,0) 70%), radial-gradient(120% 70% at 10% 60%, #22357A 0%, rgba(34,53,122,0) 70%), linear-gradient(180deg, #1A2A5E, ${NAVY8} 60%, ${NAVY9})` }}>
        <Status />

        {/* the app's widget: the last order, and a button to order it again */}
        <div style={{ position: 'absolute', left: P(28), top: P(72), width: P(346), height: P(162), borderRadius: P(23), overflow: 'hidden',
          background: 'linear-gradient(160deg, #26272B, #17181B)', boxShadow: `inset 0 0 0 ${P(0.6)}px rgba(255,255,255,.08)`, color: '#fff' }}>
          <Img src={staticFile('film/assets/dish.webp')} style={{ position: 'absolute', left: P(14), top: P(14), width: P(134), height: P(134), borderRadius: P(13), objectFit: 'cover' }} />
          <div style={{ position: 'absolute', left: P(164), top: P(18), right: P(16), bottom: P(16), display: 'flex', flexDirection: 'column' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: P(6), font: `600 ${P(12)}px/1 ${SANS}`, color: 'rgba(255,255,255,.55)', letterSpacing: P(0.2) }}>
              <Icon src={JERES} s={P(16)} />JERES APP</span>
            <span style={{ marginTop: P(10), font: `600 ${P(18)}px/1.15 ${SANS}` }}>Mørbradgryde</span>
            <span style={{ position: 'relative', marginTop: P(5), height: P(16), font: `400 ${P(13)}px/1.2 ${SANS}`, color: 'rgba(255,255,255,.6)' }}>
              <span style={{ position: 'absolute', left: 0, top: 0, whiteSpace: 'nowrap', opacity: 1 - bought, transform: `translateY(${-bought * P(5)}px)` }}>Din seneste bestilling</span>
              <span style={{ position: 'absolute', left: 0, top: 0, whiteSpace: 'nowrap', opacity: bought, transform: `translateY(${(1 - bought) * P(5)}px)` }}>Afhentning kl. 17.30</span>
            </span>
            {/* the button: pressed, then done */}
            <span style={{ marginTop: 'auto', height: P(36), borderRadius: P(18), position: 'relative', overflow: 'hidden',
              background: bought > 0.5 ? 'rgba(48,209,88,.18)' : ORANGE2, transform: `scale(${1 - 0.05 * press})`, opacity: 1 - 0.25 * press,
              display: 'grid', placeItems: 'center', font: `600 ${P(15)}px/1 ${SANS}` }}>
              <span style={{ position: 'absolute', opacity: 1 - bought }}>Bestil igen</span>
              <span style={{ position: 'absolute', opacity: bought, color: GREEN, display: 'flex', alignItems: 'center', gap: P(5) }}>
                <Check p={seg(t, TAP + 0.22, TAP + 0.55)} size={6} color={GREEN} width={3.2} />Bestilt</span>
            </span>
          </div>
        </div>

        {/* the apps, as on any home screen */}
        {APPS.map(([src, name], i) => (
          <div key={name} style={{ position: 'absolute', left: P(28 + i * 94), top: P(258), width: P(64), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: P(6) }}>
            <Icon src={src} s={P(64)} />
            <span style={{ font: `500 ${P(12)}px/1 ${SANS}`, color: '#fff', whiteSpace: 'nowrap' }}>{name}</span>
          </div>
        ))}
      </div>
      <Img src={staticFile('ny/media/dev/iphone-17-pro-2x.webp')} style={{ position: 'absolute', left: PX, top: PY, width: PW, height: PH }} />

      {/* ---------- the notification: out of the island, and back into it ---------- */}
      {showBanner && <div style={{ position: 'absolute', left: SX + P(bl), top: SY + P(bt), width: P(bw), height: P(bh), borderRadius: P(br), overflow: 'hidden',
        background: 'linear-gradient(160deg, #3A3B40, #2A2B30)', boxShadow: `0 ${P(10)}px ${P(30)}px rgba(0,0,0,${0.35 * clamp(bm)})` }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: P(BAN.w), height: P(BAN.h), display: 'flex', alignItems: 'center', gap: P(12), padding: `0 ${P(14)}px`, color: '#fff',
          ...blurIn(bContent, 0.94), transformOrigin: '50% 0' }}>
          <Icon src={JERES} s={P(38)} />
          <span style={{ display: 'flex', flexDirection: 'column', gap: P(3), flex: 1, minWidth: 0 }}>
            <b style={{ font: `600 ${P(15)}px/1.15 ${SANS}` }}>Din bestilling er modtaget</b>
            <span style={{ font: `400 ${P(14)}px/1.2 ${SANS}`, color: 'rgba(255,255,255,.75)' }}>Mørbradgryde · afhentning kl. 17.30</span>
          </span>
          <span style={{ alignSelf: 'flex-start', marginTop: P(16), font: `400 ${P(12)}px/1 ${SANS}`, color: 'rgba(255,255,255,.5)' }}>nu</span>
        </div>
        {/* black while it is still the island */}
        <i style={{ position: 'absolute', inset: 0, background: '#000', opacity: 1 - seg(bm, 0.15, 0.6) }} />
      </div>}

      {/* ---------- the Dynamic Island, exactly over the camera's ---------- */}
      <div style={{ position: 'absolute', left: SX + (ISL.cx - w / 2) * pt, top: SY + ISL.top * pt - 0.6 * pt, width: w * pt, height: (h + 1.2) * pt, borderRadius: (r + 0.6) * pt,
        background: '#000', overflow: 'hidden', boxShadow: g > 0.05 ? `0 ${P(12)}px ${P(34)}px rgba(0,0,0,.45)` : 'none' }}>
        {/* compact: the order on the left, its state on the right */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: (ISL.h + 1.2) * pt, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `0 ${P(8)}px`,
          ...blurIn(compactVis, 0.7) }}>
          <Icon src={JERES} s={P(24)} />
          <span style={{ position: 'relative', width: P(54), height: P(22) }}>
            {/* while it cooks: a ring that fills; when ready: the tick */}
            <svg width={P(22)} height={P(22)} viewBox="0 0 24 24" style={{ position: 'absolute', right: 0, top: 0, opacity: 1 - ready }}>
              <circle cx="12" cy="12" r="9" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="3" />
              <circle cx="12" cy="12" r="9" fill="none" stroke={ORANGE} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${56.5 * fill} 56.5`} transform="rotate(-90 12 12)" />
            </svg>
            <span style={{ position: 'absolute', right: 0, top: 0, height: P(22), display: 'flex', alignItems: 'center', gap: P(4), font: `600 ${P(14)}px/1 ${SANS}`, color: GREEN, opacity: ready }}>
              <Check p={seg(t, CLOSE + 0.2, CLOSE + 0.55)} size={7.5} color={GREEN} width={3.4} />Klar</span>
          </span>
        </div>
        {/* expanded: the news */}
        <div style={{ position: 'absolute', left: (w - 380) / 2 * pt, top: 0, width: P(380), height: P(168), padding: `${P(22)}px ${P(24)}px`, color: '#fff',
          ...blurIn(openContent, 0.88), transformOrigin: '50% 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: P(14) }}>
            <Icon src={JERES} s={P(48)} />
            <span style={{ display: 'flex', flexDirection: 'column', gap: P(5), flex: 1 }}>
              <span style={{ font: `500 ${P(13)}px/1 ${SANS}`, color: 'rgba(255,255,255,.6)' }}>Jeres app · din bestilling</span>
              <span style={{ font: `600 ${P(21)}px/1.1 ${SANS}`, color: GREEN }}>Klar til afhentning</span>
            </span>
            <span style={{ width: P(46), height: P(46), borderRadius: '50%', background: GREEN, display: 'grid', placeItems: 'center', flex: 'none',
              transform: `scale(${mix(0.4, 1, out5(seg(t, OPEN + 0.2, OPEN + 0.55)))})` }}><Check p={seg(t, OPEN + 0.3, OPEN + 0.65)} size={12} color="#fff" width={3.4} /></span>
          </div>
          <div style={{ marginTop: P(22) }}><Bar h={P(7)} /></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: P(10), font: `500 ${P(12)}px/1 ${SANS}`, color: 'rgba(255,255,255,.55)' }}>
            <span>Bestilt 17.02</span><span>Hent den ved disken</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
