/* The Systems tile: the system that runs a business, shown on Spiis' own.
   The camera is inside the iPad's screen all the way, close on the kitchen
   screen of Spiis' system, dark as kitchen screens are. A new order comes
   in from the website and the day's count goes up; the kitchen starts it,
   it cooks, it is done, and the system itself tells the guest. The camera
   follows the order from column to column. Commission: 0 kr. */
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { useT, useFonts, seg, out3, io3, mix, clamp, SANS } from './common';

export const SYS_S = 7;

// the iPad's screen, in its own points (an 11-inch iPad, landscape)
const UW = 1180, UH = 820, BEZ = 22;
const BG = '#141110', INK = '#F4EFE8', MUTE = '#9C9187', ORANGE = '#E07A3A', PEACH = 'rgba(224,122,58,.16)', PEACHT = '#F2A06B', DARK = '#0D0B0A', GREEN = '#3CC774', MINT = 'rgba(60,199,116,.16)';

// the three columns of the kitchen, and the place of each card in them
const COLS = [{ name: 'Nye', dot: ORANGE }, { name: 'I gang', dot: '#E0A33A' }, { name: 'Klar', dot: GREEN }];
const CX = 24, CY = 446, CW = (UW - 48 - 32) / 3, CARD_H = 170, GAP = 16;
const slot = (col: number, idx: number) => ({ x: CX + col * (CW + 16), y: CY + idx * (CARD_H + GAP) });
type Pt = { x: number; y: number };
const lerp = (a: Pt, b: Pt, q: number): Pt => ({ x: mix(a.x, b.x, q), y: mix(a.y, b.y, q) });

// a number that changes the way iOS changes one: the old goes up into a
// blur, the new comes up out of one
const Num: React.FC<{ from: number; to: number; q: number }> = ({ from, to, q }) => (
  <span style={{ position: 'relative', display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom' }}>
    <span style={{ visibility: 'hidden' }}>{Math.max(from, to)}</span>
    {q < 1 && <span style={{ position: 'absolute', left: 0, top: 0, opacity: 1 - q, transform: `translateY(${-q * 60}%)`, filter: q > 0.01 ? `blur(${q * 3}px)` : undefined }}>{from}</span>}
    {q > 0 && <span style={{ position: 'absolute', left: 0, top: 0, opacity: q, transform: `translateY(${(1 - q) * 60}%)`, filter: q < 0.99 ? `blur(${(1 - q) * 3}px)` : undefined }}>{to}</span>}
  </span>
);

type Stage = 'new' | 'cooking' | 'ready';
const Card: React.FC<{ no: number; at: string; lines: string[]; stage: Stage; cook?: number; glow?: number; press?: number; tick?: number; isNew?: boolean }> =
  ({ no, at, lines, stage, cook = 0, glow = 0, press = 0, tick = 1, isNew }) => (
  <div style={{ width: CW, height: CARD_H, borderRadius: 20, padding: '18px 20px', boxSizing: 'border-box', position: 'relative', overflow: 'hidden',
    background: stage === 'ready' ? '#17231C' : '#211C1A',
    boxShadow: `inset 0 0 0 1.5px ${stage === 'ready' ? 'rgba(60,199,116,.3)' : 'rgba(255,255,255,.07)'}, inset 0 1.5px 0 rgba(255,255,255,.06), 0 0 0 ${3 * glow}px rgba(224,122,58,${0.8 * glow}), 0 0 ${44 * glow}px rgba(224,122,58,${0.5 * glow})` }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <b style={{ font: `700 26px/1 ${SANS}`, color: INK, letterSpacing: -0.5 }}>{at}</b>
      <span style={{ padding: '6px 10px', borderRadius: 8, background: PEACH, color: PEACHT, font: `600 14px/1 ${SANS}` }}>{isNew ? 'Ny · spiis.dk' : 'Afhentning'}</span>
      <span style={{ marginLeft: 'auto', font: `500 16px/1 ${SANS}`, color: MUTE }}>#{no}</span>
    </div>
    <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {lines.map(l => <span key={l} style={{ font: `500 19px/1.15 ${SANS}`, color: INK, whiteSpace: 'nowrap' }}>{l}</span>)}
    </div>
    {/* what the kitchen can do with it now */}
    <div style={{ position: 'absolute', left: 20, right: 20, bottom: 16, height: 40 }}>
      {stage === 'new' && <span style={{ position: 'absolute', inset: 0, borderRadius: 12, background: ORANGE, color: '#fff', display: 'grid', placeItems: 'center',
        font: `600 18px/1 ${SANS}`, transform: `scale(${1 - 0.04 * press})`, opacity: 1 - 0.18 * press }}>Start</span>}
      {stage === 'cooking' && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,.1)', overflow: 'hidden', position: 'relative' }}>
          <i style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${100 * cook}%`, borderRadius: 4, background: `linear-gradient(90deg, #E0A33A, ${ORANGE})` }} />
        </span>
        <span style={{ height: 40, padding: '0 18px', borderRadius: 12, display: 'grid', placeItems: 'center', background: MINT, color: GREEN, font: `600 18px/1 ${SANS}`,
          transform: `scale(${1 - 0.04 * press})` }}>Klar</span>
      </div>}
      {stage === 'ready' && <span style={{ position: 'absolute', inset: 0, borderRadius: 12, background: MINT, color: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        font: `600 18px/1 ${SANS}` }}>
        <svg width="18" height="18" viewBox="0 0 24 24"><path d="M5 12.5 10 17.5 19.5 7" fill="none" stroke={GREEN} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="24" strokeDashoffset={24 * (1 - tick)} /></svg>
        Gæsten har fået besked</span>}
    </div>
  </div>
);

// a finger on the glass
const Tap: React.FC<{ x: number; y: number; q: number }> = ({ x, y, q }) => q <= 0 || q >= 1 ? null : (
  <i style={{ position: 'absolute', left: x - 34, top: y - 34, width: 68, height: 68, borderRadius: '50%', background: 'rgba(255,255,255,.22)', zIndex: 6,
    transform: `scale(${mix(0.5, 1.3, out3(q))})`, opacity: q < 0.25 ? q / 0.25 : 1 - (q - 0.25) / 0.75 }} />
);

export const TileSys: React.FC = () => {
  useFonts();
  const { t, sp } = useT();

  // the beats
  const NEW = 0.75, START = 2.05, DONE = 4.25;
  const appear = sp(NEW + 0.1, 15, 170);
  const glow = seg(t, NEW + 0.15, NEW + 0.4) * (1 - seg(t, START - 0.3, START + 0.1));
  const m1 = sp(START + 0.08, 17, 150), m2 = sp(DONE + 0.08, 17, 150);
  const lift = Math.max(Math.sin(Math.PI * seg(t, START + 0.05, START + 0.6)), Math.sin(Math.PI * seg(t, DONE + 0.05, DONE + 0.6)));
  const cook = io3(seg(t, START + 0.6, DONE - 0.2));
  const press1 = Math.sin(Math.PI * seg(t, START - 0.12, START + 0.1)), press2 = Math.sin(Math.PI * seg(t, DONE - 0.12, DONE + 0.1));
  const stage: Stage = t < START + 0.25 ? 'new' : t < DONE + 0.25 ? 'cooking' : 'ready';
  const swap = Math.max(clamp(1 - Math.abs(t - START - 0.25) / 0.12), clamp(1 - Math.abs(t - DONE - 0.25) / 0.12));

  // the card that is followed, and the others making room for it
  const c214 = lerp(lerp(slot(0, 0), slot(1, 0), m1), slot(2, 0), m2);
  const others: [Pt, number, string, string[], Stage, number][] = [
    [lerp(slot(2, 0), slot(2, 1), m2), 210, '16.50', ['1 × Mørbradgryde med ris'], 'ready', 0],
    [lerp(lerp(slot(1, 1), slot(1, 2), m1), slot(1, 1), m2), 211, '17.00', ['2 × Mørbradgryde med ris', '1 × Kartoffelsalat'], 'cooking', 0.72 + 0.2 * cook],
    [lerp(lerp(slot(1, 0), slot(1, 1), m1), slot(1, 0), m2), 212, '17.10', ['1 × Dagens suppe'], 'cooking', 0.3 + 0.3 * cook],
    [lerp(lerp(slot(0, 0), slot(0, 1), appear), slot(0, 0), m1), 213, '17.15', ['2 × Mørbradgryde med ris'], 'new', 0],
  ];
  const count = (i: number) => i === 0 ? (t < START + 0.1 ? (appear > 0.5 ? 2 : 1) : 1) : i === 1 ? (m1 > 0.5 && m2 < 0.5 ? 3 : 2) : (m2 > 0.5 ? 2 : 1);

  // the camera: inside the screen all the way, following the order from
  // column to column; it never shows the iPad's edge
  const f1 = sp(START + 0.12, 20, 110), f2 = sp(DONE + 0.12, 20, 110);
  const colX = (i: number) => BEZ + slot(i, 0).x + CW / 2;
  const fx = mix(mix(colX(0) + 21, colX(1), f1), colX(2) - 28, f2);
  const fy = 610 + 4 * io3(seg(t, 0, SYS_S));
  const k = 1.95 + 0.04 * io3(seg(t, 0, SYS_S));
  const rotY = -4 + 1.5 * f1 + 1.5 * f2, rotX = 3;
  const sweep = seg(t, 0.9, 3.6);

  const screen = (
    <div style={{ position: 'absolute', left: BEZ, top: BEZ, width: UW, height: UH, borderRadius: 30, overflow: 'hidden', background: BG, fontFamily: SANS }}>
      {/* the system's own bar, and the evening's numbers */}
      <div style={{ height: 76, background: BG, display: 'flex', alignItems: 'center', gap: 14, padding: '0 26px', color: INK }}>
        <Img src={staticFile('ny/media/ic/spiis.svg')} style={{ width: 40, height: 40, borderRadius: 10 }} />
        <b style={{ font: `700 26px/1 ${SANS}` }}>Spiis</b>
        <span style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
          {['Køkken', 'Menu', 'Drift'].map((n, i) => <span key={n} style={{ padding: '10px 16px', borderRadius: 12, font: `600 17px/1 ${SANS}`,
            background: i === 0 ? 'rgba(244,239,232,.12)' : 'transparent', color: i === 0 ? INK : MUTE }}>{n}</span>)}
        </span>
      </div>
      <div style={{ position: 'absolute', left: CX, top: 352, display: 'flex', gap: 10 }}>
        <span style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(244,239,232,.07)', font: `500 19px/1 ${SANS}`, color: '#CFC5BA' }}>
          I dag <b style={{ color: INK, margin: '0 4px' }}><Num from={23} to={24} q={out3(seg(t, NEW + 0.2, NEW + 0.5))} /></b> bestillinger</span>
        <span style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(60,199,116,.14)', font: `500 19px/1 ${SANS}`, color: '#8FD6A9' }}>
          <b style={{ color: '#C9F0D6', marginRight: 4 }}>0 kr</b> i kommission</span>
        <span style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(244,239,232,.07)', font: `500 19px/1 ${SANS}`, color: '#CFC5BA' }}>
          Næste afhentning <b style={{ color: INK, marginLeft: 4 }}>17.00</b></span>
      </div>
      {/* the columns */}
      {COLS.map((c, i) => (
        <div key={c.name} style={{ position: 'absolute', left: slot(i, 0).x - 8, top: CY - 46, width: CW + 16, height: UH - CY + 60, borderRadius: 24, background: 'rgba(255,255,255,.028)' }}>
          <span style={{ position: 'absolute', left: 16, top: 13, display: 'flex', alignItems: 'center', gap: 9, font: `600 18px/1 ${SANS}`, color: INK }}>
            <i style={{ width: 9, height: 9, borderRadius: '50%', background: c.dot }} />{c.name}
            <span style={{ minWidth: 14, padding: '4px 8px', borderRadius: 8, background: 'rgba(255,255,255,.08)', color: MUTE, textAlign: 'center', font: `600 15px/1 ${SANS}` }}>{count(i)}</span></span>
        </div>
      ))}
      {/* the cards */}
      {others.map(([p, no, at, lines, st, ck]) => (
        <div key={no} style={{ position: 'absolute', left: p.x, top: p.y }}><Card no={no} at={at} lines={lines} stage={st} cook={ck} /></div>
      ))}
      <div style={{ position: 'absolute', left: c214.x, top: c214.y, opacity: clamp(appear * 1.6), zIndex: 3,
        transform: `translateY(${-50 * (1 - appear)}px) scale(${mix(0.94, 1, clamp(appear)) * (1 + 0.04 * lift)})`,
        filter: `drop-shadow(0 ${4 + 22 * lift}px ${8 + 26 * lift}px rgba(0,0,0,${0.25 + 0.3 * lift}))` }}>
        <div style={{ filter: swap > 0.01 ? `blur(${2.5 * swap}px)` : undefined }}>
          <Card no={214} at="17.30" lines={['3 × Mørbradgryde med ris', '1 × Rødgrød med fløde']} stage={stage} cook={cook} glow={glow} isNew={stage === 'new'}
            press={stage === 'new' ? press1 : press2} tick={seg(t, DONE + 0.35, DONE + 0.7)} />
        </div>
      </div>
      {/* the fingers on the glass */}
      <Tap x={slot(0, 0).x + CW / 2} y={slot(0, 0).y + CARD_H - 36} q={seg(t, START - 0.15, START + 0.22)} />
      <Tap x={slot(1, 0).x + CW - 58} y={slot(1, 0).y + CARD_H - 36} q={seg(t, DONE - 0.15, DONE + 0.22)} />
      {/* the light of the room, moving over the glass */}
      <i style={{ position: 'absolute', inset: 0, zIndex: 8, background: `linear-gradient(105deg, transparent ${mix(-30, 110, sweep)}%, rgba(255,255,255,.07) ${mix(-20, 120, sweep)}%, transparent ${mix(-10, 130, sweep)}%)` }} />
    </div>
  );

  return (
    <AbsoluteFill style={{ background: '#0B0908', overflow: 'hidden' }}>
      {/* ---------- the iPad, seen from inside its screen ---------- */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: UW + 2 * BEZ, height: UH + 2 * BEZ, borderRadius: 52, transformOrigin: '0 0', background: '#0A0A0B',
        transform: `translate(420px, 975px) perspective(2400px) scale(${k}) rotateX(${rotX}deg) rotateY(${rotY}deg) translate(${-fx}px, ${-fy}px)` }}>
        {screen}
      </div>

    </AbsoluteFill>
  );
};
