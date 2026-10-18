/* What the three "why Lesreg" films share, built from the LESREG library
   (Liquid Atelier 3.2, page 07) and nothing else:
   - LA31 Card / Layered plate: the basalt card with its large numeral and
     its reeds of glass behind, and the plate (Rim around a porcelain core)
     that comes up over everything at the end, with its lens button;
   - an iPhone carrying an app laid out as LA31 Media / Product window: the
     app bar with a live dot, LA31 Control / Segmented, LA31 Data / Figure.
   The film: the app shows the classic software house; a finger moves the
   segmented lens to Lesreg, and the figure answers; the plate says it. */
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { useT, useFonts, seg, out3, io3, mix, clamp, SANS, MONO, StatusBar } from './common';

export const WHY_W = 1080, WHY_H = 1350;
export const NAVY9 = '#05080F', NAVY8 = '#101A33', DEEP = '#2B3F7C';
export const OBS = '#0E0F10', BASALT = '#232426', GRAPH = '#46443F', ASH = '#8C8880', TRAV = '#D8D1C5', LIME = '#E9E5DD', PORC = '#F6F4EF', ULTRA = '#2436E8';

// the phone, large and to the right, and one iOS point on its screen
const PW = 960, PX = (WHY_W - 960) / 2, PY = 96, PH = PW * 2336 / 1120;
const SX = PX + PW * 0.0537, SY = PY + PH * 0.024, SW = PW * 0.8917, SHh = PH * 0.952;
export const pt = SW / 402;
export const P = (n: number) => n * pt;
// the Figure (Mobile, 338 x 300) on the screen, and its field (298 x 63)
export const FIG = { x: 32, y: 178 }, FW = 298, FH = 63;

// the beats, the same in all three
export const TAP = 3.05, SWITCH = 3.18, PLATE = 4.55, HOVER = 5.7, WHY_S = 7.4;

export type Face = { label: string; value: React.ReactNode; unit: string; delta: string; field: React.ReactNode; axis: [string, string] };

// LA31 Data / Figure, Mobile, on the screen (in points)
const Figure: React.FC<{ f: Face; o: number; dy: number }> = ({ f, o, dy }) => (
  <div style={{ position: 'absolute', left: P(FIG.x), top: P(FIG.y) + dy, width: P(338), height: P(300), opacity: o }}>
    <div style={{ position: 'absolute', left: P(20), top: P(20), font: `600 ${P(11)}px/${P(14)}px ${SANS}`, letterSpacing: P(0.66), textTransform: 'uppercase', color: ASH, whiteSpace: 'nowrap' }}>{f.label}</div>
    <div style={{ position: 'absolute', left: P(16), top: P(44), display: 'flex', alignItems: 'flex-start' }}>
      <span style={{ font: `300 ${P(88)}px/${P(88)}px ${SANS}`, letterSpacing: P(-4.4), color: OBS, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{f.value}</span>
      <span style={{ margin: `${P(26)}px 0 0 ${P(12)}px`, font: `400 ${P(11.5)}px/${P(16)}px ${MONO}`, color: GRAPH, whiteSpace: 'nowrap' }}>{f.unit}</span>
    </div>
    <div style={{ position: 'absolute', left: P(20), top: P(144), font: `400 ${P(12.5)}px/${P(18)}px ${SANS}`, letterSpacing: P(0.06), color: OBS, whiteSpace: 'nowrap' }}>{f.delta}</div>
    <div style={{ position: 'absolute', left: P(20), top: P(188), width: P(FW), height: P(FH) }}>{f.field}</div>
    <i style={{ position: 'absolute', left: P(20), top: P(266), width: P(FW), height: P(1), background: TRAV }} />
    <span style={{ position: 'absolute', left: P(20), top: P(274), font: `400 ${P(11.5)}px/${P(16)}px ${MONO}`, color: ASH }}>{f.axis[0]}</span>
    <span style={{ position: 'absolute', left: P(318), top: P(274), transform: 'translateX(-100%)', font: `400 ${P(11.5)}px/${P(16)}px ${MONO}`, color: ASH, whiteSpace: 'nowrap' }}>{f.axis[1]}</span>
  </div>
);

// LA31 Control / Segmented, Compact, two options: travertine track, a glass lens
const OPT = 85.5, SEGX = (402 - (8 + 2 * OPT)) / 2, SEGY = 122;
const Segmented: React.FC<{ at: number; mag: number }> = ({ at, mag }) => (
  <div style={{ position: 'absolute', left: P(SEGX), top: P(SEGY), width: P(8 + 2 * OPT), height: P(44), borderRadius: P(22), background: TRAV }}>
    <i style={{ position: 'absolute', left: P(6) + at * P(OPT), top: P(4), width: P(OPT - 4), height: P(36), borderRadius: P(18), background: 'rgba(255,255,255,.35)',
      border: `${P(1)}px solid #fff`, boxShadow: `${P(3)}px ${P(6)}px ${P(16)}px rgba(13,13,15,.18)`, transform: `scale(${1 + 0.09 * mag})` }} />
    {['Klassisk', 'Lesreg'].map((s, i) => {
      const on = i === 0 ? 1 - at : at;
      return <span key={s} style={{ position: 'absolute', left: P(4 + i * OPT), top: P(4), width: P(OPT), height: P(36), display: 'grid', placeItems: 'center',
        font: `${on > 0.5 ? 500 : 400} ${P(14)}px/${P(16)}px ${SANS}`, color: on > 0.5 ? OBS : GRAPH, transform: on > 0.5 ? `scale(${1 + 0.06 * mag})` : undefined }}>{s}</span>;
    })}
  </div>
);

// LA21/LA32 lens button, icon only: an obsidian body, a glass lens; on hover
// the lens fills ultramarine and the arrow surfaces onto it
const LensButton: React.FC<{ s: number; hover: number }> = ({ s, hover }) => (
  <span style={{ position: 'relative', flex: 'none', width: 48 * s, height: 48 * s, borderRadius: '50%', background: OBS, display: 'grid', placeItems: 'center' }}>
    <span style={{ position: 'relative', width: 40 * s, height: 40 * s, borderRadius: '50%', overflow: 'hidden',
      background: `linear-gradient(135deg, rgba(255,255,255,.22), rgba(255,255,255,.04) 55%, rgba(255,255,255,.12))`, boxShadow: `inset 0 0 0 ${s}px rgba(255,255,255,.35)` }}>
      <i style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: ULTRA, opacity: hover }} />
      <svg style={{ position: 'absolute', left: 12 * s, top: 12 * s }} width={16 * s} height={16 * s} viewBox="0 0 16 16">
        <path d="M2.5 8h10.4M9 4.1l3.9 3.9L9 11.9" fill="none" stroke="#fff" strokeOpacity={mix(0.75, 1, hover)} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  </span>
);

export const WhyFilm: React.FC<{ ghost: string; context: string; them: (t: number) => Face; us: (t: number) => Face; plate: [string, string, string] }> = ({ ghost, context, them, us, plate }) => {
  useFonts();
  const { t, sp } = useT();
  // the segmented lens travels in 220 ms and magnifies on the way
  const at = io3(seg(t, SWITCH, SWITCH + 0.22));
  const mag = Math.sin(Math.PI * seg(t, SWITCH, SWITCH + 0.22));
  const swap = seg(t, SWITCH + 0.05, SWITCH + 0.35);
  const tap = seg(t, TAP - 0.1, TAP + 0.4);
  const pl = sp(PLATE, 20, 150, 1);
  const hover = out3(seg(t, HOVER, HOVER + 0.18));
  const S = 2.42; // the plate at film size
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 70% at 50% 100%, ${DEEP}, ${NAVY8} 48%, ${NAVY9})`, overflow: 'hidden', fontFamily: SANS }}>
      <div style={{ position: 'absolute', left: 40, top: 260, width: 1000, height: 1000, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(70,100,200,.32), transparent)' }} />

      {/* ---------- the phone, and the app on it ---------- */}
      <div style={{ position: 'absolute', left: SX, top: SY, width: SW, height: SHh, borderRadius: '13% / 6.2%', overflow: 'hidden', background: PORC }}>
        <StatusBar color={OBS} />
        {/* LA31 Media / Product window's app bar */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: P(54), height: P(52), display: 'flex', alignItems: 'center', gap: P(10), padding: `0 ${P(16)}px 0 ${P(20)}px`, borderBottom: `${P(1)}px solid ${TRAV}` }}>
          <span style={{ font: `500 ${P(14)}px/${P(16)}px ${SANS}`, color: OBS }}>Hvorfor Lesreg</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: P(6) }}>
            <i style={{ width: P(6), height: P(6), borderRadius: '50%', background: ULTRA }} />
            <span style={{ font: `400 ${P(11.5)}px/${P(16)}px ${MONO}`, color: GRAPH }}>{at > 0.5 ? 'lesreg' : 'klassisk'} · eksempel</span>
          </span>
        </div>
        <Segmented at={at} mag={mag} />
        <Figure f={them(t)} o={1 - swap} dy={-swap * P(10)} />
        <Figure f={us(t)} o={swap} dy={(1 - swap) * P(10)} />
        {/* the finger's touch on "Lesreg" */}
        {tap > 0 && tap < 1 && <i style={{ position: 'absolute', left: P(SEGX + 4 + OPT * 1.5) - mix(14, 30, out3(tap)) * pt, top: P(SEGY + 22) - mix(14, 30, out3(tap)) * pt,
          width: mix(28, 60, out3(tap)) * pt, height: mix(28, 60, out3(tap)) * pt, borderRadius: '50%', background: 'rgba(14,15,16,.2)', opacity: tap < 0.25 ? tap / 0.25 : 1 - (tap - 0.25) / 0.75 }} />}
      </div>
      <Img src={staticFile('ny/media/dev/iphone-17-pro-2x.webp')} style={{ position: 'absolute', left: PX, top: PY, width: PW, height: PH }} />

      {/* ---------- the plate: a Rim around a porcelain core, over everything ---------- */}
      <div style={{ position: 'absolute', left: 64, top: 1018, width: 372 * S, height: 128 * S, borderRadius: 24 * S, opacity: clamp(pl * 1.5),
        transform: `translateY(${(1 - pl) * 260}px)`, background: 'rgba(255,255,255,.06)', border: `${S}px solid rgba(255,255,255,.85)`,
        boxShadow: `${14 * S}px ${28 * S}px ${64 * S}px rgba(13,13,15,.3)`, backdropFilter: 'blur(6px)' }}>
        <div style={{ position: 'absolute', left: 5 * S, top: 5 * S, width: 360 * S, height: 116 * S, borderRadius: 18 * S, background: PORC, display: 'flex', alignItems: 'center',
          gap: 16 * S, padding: `0 ${8 * S}px 0 ${20 * S}px` }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 * S }}>
            <span style={{ font: `600 ${11 * S}px/${14 * S}px ${SANS}`, letterSpacing: 0.66 * S, textTransform: 'uppercase', color: ASH, whiteSpace: 'nowrap' }}>{plate[0]}</span>
            <span style={{ font: `500 ${24 * S}px/${30 * S}px ${SANS}`, letterSpacing: -0.36 * S, color: OBS, whiteSpace: 'nowrap' }}>{plate[1]}</span>
            <span style={{ font: `400 ${11.5 * S}px/${16 * S}px ${MONO}`, color: GRAPH, whiteSpace: 'pre' }}>{plate[2]}</span>
          </div>
          <LensButton s={S} hover={hover} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const da = (n: number, d = 0) => n.toLocaleString('da-DK', { minimumFractionDigits: d, maximumFractionDigits: d });
export const Now: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <i style={{ position: 'absolute', left: P(x) - P(4), top: P(y) - P(4), width: P(8), height: P(8), borderRadius: '50%', background: ULTRA }} />
);
