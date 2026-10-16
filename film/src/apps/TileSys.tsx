/* The Systems tile: the system that runs a business, shown on Spiis' own.
   An iPad at the pass of a kitchen in evening service (the kitchen
   photographed with Higgsfield, out of focus behind it), turning slowly:
   the kitchen screen of Spiis' system. A new order comes in from the
   website and the day's count goes up; the kitchen starts it, it cooks, it
   is done, and the system itself tells the guest. Commission: 0 kr.
   The screen is drawn in Liquid Atelier: porcelain and white, hairlines of
   travertine, data in Fragment Mono, status by shape, obsidian buttons
   with their glass lens, glass only for what floats, and ultramarine only
   for what is happening now. */
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { useT, useFonts, seg, out3, io3, mix, clamp, SANS, MONO } from './common';

export const SYS_S = 7;

// the iPad's screen, in its own points (an 11-inch iPad, landscape)
const UW = 1180, UH = 820, BEZ = 22;
// Liquid Atelier
const PORC = '#F6F4EF', LIME = '#E9E5DD', TRAV = '#D8D1C5', ASH = '#8C8880', GRAPH = '#46443F', OBS = '#0E0F10', ULTRA = '#2436E8';
const EDGE_ON_LIGHT = 'linear-gradient(135deg,#fff,rgba(0,0,0,.04) 55%,rgba(0,0,0,.22))', EDGE = 'linear-gradient(135deg,rgba(255,255,255,.85),rgba(255,255,255,.12) 45%,rgba(255,255,255,.4))';
// the 1 px specular edge of glass, light from −45°
const edge = (g: string): React.CSSProperties => ({ position: 'absolute', inset: 0, borderRadius: 'inherit', padding: 1, background: g, pointerEvents: 'none',
  WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' } as React.CSSProperties);

// status by shape: ring = waiting, filled = done
const Shape: React.FC<{ done: number; s?: number; c?: string }> = ({ done, s = 12, c = OBS }) => (
  <svg width={s} height={s} viewBox="0 0 12 12" style={{ flex: 'none' }}>
    <circle cx="6" cy="6" r="4.6" fill="none" stroke={c} strokeWidth="1.6" />
    <circle cx="6" cy="6" r={4.6 * done} fill={c} />
  </svg>
);

// the three columns of the kitchen, and the place of each card in them
const COLS = ['Nye', 'I gang', 'Klar'];
const CX = 24, CY = 176, CW = (UW - 48 - 32) / 3, CARD_H = 170, GAP = 16;
const slot = (col: number, idx: number) => ({ x: CX + col * (CW + 16), y: CY + 14 + idx * (CARD_H + GAP) });
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
const Card: React.FC<{ no: number; at: string; lines: string[]; stage: Stage; cook?: number; now?: number; press?: number; tick?: number; isNew?: boolean }> =
  ({ no, at, lines, stage, cook = 0, now = 0, press = 0, tick = 1, isNew }) => (
  <div style={{ width: CW, height: CARD_H, borderRadius: 22, padding: '20px 22px', boxSizing: 'border-box', position: 'relative', overflow: 'hidden', background: '#fff',
    boxShadow: `inset 0 0 0 1px ${TRAV}, 2px 4px 12px rgba(13,13,15,.06), 0 0 0 ${2 * now}px ${PORC}, 0 0 0 ${4 * now}px rgba(36,54,232,${now})` }}>
    {/* the order: its number and time in mono, its state by shape */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, font: `400 15px/1 ${MONO}`, color: GRAPH }}>
      {now > 0.01 && <i style={{ width: 6, height: 6, borderRadius: '50%', background: ULTRA, opacity: now }} />}
      <span>#0{no}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 7, font: `500 15px/1 ${SANS}`, color: OBS }}>
        <Shape done={stage === 'ready' ? 1 : 0} s={11} />{stage === 'ready' ? 'Klar' : stage === 'cooking' ? 'Tilberedes' : isNew ? 'Ny · spiis.dk' : 'Ny'}</span>
      <span style={{ marginLeft: 'auto', font: `400 17px/1 ${MONO}`, color: OBS }}>{at}</span>
    </div>
    <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {lines.map(l => <span key={l} style={{ font: `500 20px/1.15 ${SANS}`, color: OBS, whiteSpace: 'nowrap', letterSpacing: -0.2 }}>{l}</span>)}
    </div>
    {/* what the kitchen can do with it now */}
    <div style={{ position: 'absolute', left: 22, right: 22, bottom: 16, height: 44 }}>
      {stage === 'new' && <span style={{ position: 'absolute', left: 0, top: 0, height: 44, borderRadius: 22, display: 'flex', alignItems: 'center', gap: 12, padding: '0 4px 0 20px',
        background: press > 0.3 ? '#232426' : OBS, color: PORC, font: `500 15px/1 ${SANS}`, boxShadow: press > 0.3 ? 'inset 0 2px 4px rgba(0,0,0,.28)' : 'none' }}>
        Start tilberedning
        {/* the button's glass lens, over its arrow; ultramarine as it is pressed */}
        <span style={{ position: 'relative', width: 36, height: 36, borderRadius: 18, display: 'grid', placeItems: 'center', background: `rgba(${press > 0.3 ? '36,54,232,1' : '255,255,255,.18'})` }}>
          <svg width="14" height="14" viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <i style={edge(EDGE)} /></span>
      </span>}
      {stage === 'cooking' && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* a meniscus: a hairline track, ultramarine for the part that is happening now */}
        <span style={{ position: 'relative', flex: 1, height: 14 }}>
          <i style={{ position: 'absolute', left: 0, right: 0, top: 6.5, height: 1, background: TRAV }} />
          <i style={{ position: 'absolute', left: 0, top: 6, height: 2, width: `${100 * cook}%`, background: ULTRA }} />
          <i style={{ position: 'absolute', left: `calc(${100 * cook}% - 7px)`, top: 0, width: 14, height: 14, borderRadius: 7, background: '#fff', boxShadow: `0 0 0 1px ${TRAV}, 2px 4px 12px rgba(13,13,15,.10)` }} />
        </span>
        <span style={{ font: `400 14px/1 ${MONO}`, color: GRAPH }}>{Math.max(1, Math.round(12 * (1 - cook)))} min</span>
        <span style={{ height: 44, padding: '0 18px', borderRadius: 22, display: 'flex', alignItems: 'center', gap: 8, boxShadow: `inset 0 0 0 1px ${press > 0.3 ? OBS : TRAV}`,
          color: OBS, font: `500 15px/1 ${SANS}`, background: press > 0.3 ? LIME : '#fff' }}>Klar<Shape done={1} s={9} /></span>
      </div>}
      {stage === 'ready' && <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 10, font: `500 16px/1 ${SANS}`, color: OBS,
        borderTop: `1px solid ${LIME}`, paddingTop: 4 }}>
        <svg width="18" height="18" viewBox="0 0 24 24"><path d="M5 12.5 10 17.5 19.5 7" fill="none" stroke={OBS} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="24" strokeDashoffset={24 * (1 - tick)} /></svg>
        Gæsten har fået besked<span style={{ marginLeft: 'auto', font: `400 14px/1 ${MONO}`, color: GRAPH }}>sms 17.24</span></span>}
    </div>
  </div>
);

// a finger on the glass
const Tap: React.FC<{ x: number; y: number; q: number }> = ({ x, y, q }) => q <= 0 || q >= 1 ? null : (
  <i style={{ position: 'absolute', left: x - 34, top: y - 34, width: 68, height: 68, borderRadius: '50%', background: 'rgba(14,15,16,.12)', zIndex: 6,
    transform: `scale(${mix(0.5, 1.3, out3(q))})`, opacity: q < 0.25 ? q / 0.25 : 1 - (q - 0.25) / 0.75 }} />
);

export const TileSys: React.FC = () => {
  useFonts();
  const { t, sp } = useT();

  // the beats
  const NEW = 0.75, START = 2.05, DONE = 4.25;
  const toast = t < NEW + 1.5 ? sp(NEW - 0.1, 20, 180) : 1 - io3(seg(t, NEW + 1.5, NEW + 1.85));
  const appear = sp(NEW + 0.1, 19, 170);
  const now = seg(t, NEW + 0.15, NEW + 0.45) * (1 - seg(t, DONE + 0.4, DONE + 0.8));
  const m1 = sp(START + 0.08, 22, 140), m2 = sp(DONE + 0.08, 22, 140);
  const lift = Math.max(Math.sin(Math.PI * seg(t, START + 0.05, START + 0.6)), Math.sin(Math.PI * seg(t, DONE + 0.05, DONE + 0.6)));
  const cook = io3(seg(t, START + 0.6, DONE - 0.2));
  const press1 = Math.sin(Math.PI * seg(t, START - 0.12, START + 0.1)), press2 = Math.sin(Math.PI * seg(t, DONE - 0.12, DONE + 0.1));
  const stage: Stage = t < START + 0.25 ? 'new' : t < DONE + 0.25 ? 'cooking' : 'ready';
  const swap = Math.max(clamp(1 - Math.abs(t - START - 0.25) / 0.14), clamp(1 - Math.abs(t - DONE - 0.25) / 0.14));
  // the guest is told, by the system, on their phone
  const sms = sp(DONE + 1.15, 16, 170);

  // the card that is followed, and the others making room for it
  const c214 = lerp(lerp(slot(0, 0), slot(1, 0), m1), slot(2, 0), m2);
  const others: [Pt, number, string, string[], Stage, number][] = [
    [lerp(slot(2, 0), slot(2, 1), m2), 210, '16.50', ['1 × Mørbradgryde med ris'], 'ready', 0],
    [lerp(lerp(slot(1, 1), slot(1, 2), m1), slot(1, 1), m2), 211, '17.00', ['2 × Mørbradgryde med ris', '1 × Kartoffelsalat'], 'cooking', 0.72 + 0.2 * cook],
    [lerp(lerp(slot(1, 0), slot(1, 1), m1), slot(1, 0), m2), 212, '17.10', ['1 × Dagens suppe'], 'cooking', 0.3 + 0.3 * cook],
    [lerp(lerp(slot(0, 0), slot(0, 1), appear), slot(0, 0), m1), 213, '17.15', ['2 × Mørbradgryde med ris'], 'new', 0],
  ];
  const count = (i: number) => i === 0 ? (t < START + 0.1 ? (appear > 0.5 ? 2 : 1) : 1) : i === 1 ? (m1 > 0.5 && m2 < 0.5 ? 3 : 2) : (m2 > 0.5 ? 2 : 1);

  // the camera: close on the glass, following the order from column to
  // column, then back, to show the whole iPad and the guest's phone
  const f1 = sp(START + 0.1, 24, 105), f2 = sp(DONE + 0.1, 24, 105);
  const back = sp(DONE + 0.75, 21, 75);
  const colX = (i: number) => BEZ + slot(i, 0).x + CW / 2;
  const fx = mix(mix(mix(colX(0) + 40, colX(1), f1), colX(2) - 40, f2), BEZ + UW / 2 + 40, back);
  const fy = mix(BEZ + 236 + 14 * io3(seg(t, 0, 2)), BEZ + UH / 2, back);
  const k = mix(1.72 - 0.05 * io3(seg(t, 0, DONE)), 0.6, back);
  const rotY = mix(-9 + 3 * f1 + 3 * f2, -20, back), rotX = mix(9, 14, back);
  const cam = io3(seg(t, 0, SYS_S));
  const sweep = seg(t, 0.9, 3.6);

  const screen = (
    <div style={{ position: 'absolute', left: BEZ, top: BEZ, width: UW, height: UH, borderRadius: 30, overflow: 'hidden', background: PORC, fontFamily: SANS }}>
      {/* the top bar, solid on the light screen: the brand, the live context,
          the current place as a solid chip, and the evening's figures in mono */}
      <div style={{ height: 76, display: 'flex', alignItems: 'center', gap: 12, padding: '0 22px', background: '#fff', borderBottom: `1px solid ${TRAV}`, color: OBS }}>
        <Img src={staticFile('ny/media/ic/spiis.svg')} style={{ width: 36, height: 36, borderRadius: 9 }} />
        <span style={{ font: `500 21px/1 ${SANS}` }}>Spiis</span>
        <span style={{ display: 'flex', gap: 4, marginLeft: 14 }}>
          {['Køkken', 'Menu', 'Drift'].map((n, i) => <span key={n} style={{ height: 44, padding: '0 16px', borderRadius: 22, display: 'flex', alignItems: 'center', font: `500 15px/1 ${SANS}`,
            background: i === 0 ? OBS : 'transparent', color: i === 0 ? PORC : GRAPH }}>{n}</span>)}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 22, marginLeft: 'auto', font: `400 14px/1 ${MONO}`, color: GRAPH }}>
          <span>I DAG <b style={{ font: `500 20px/1 ${SANS}`, color: OBS, marginLeft: 6 }}><Num from={23} to={24} q={out3(seg(t, NEW + 0.2, NEW + 0.6))} /></b></span>
          <span>KOMMISSION <b style={{ font: `500 20px/1 ${SANS}`, color: OBS, marginLeft: 6 }}>0 kr</b></span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><i style={{ width: 6, height: 6, borderRadius: '50%', background: ULTRA }} />LIVE</span>
        </span>
      </div>
      <div style={{ position: 'absolute', left: CX + 2, top: 98, display: 'flex', alignItems: 'baseline', gap: 14 }}>
        <span style={{ font: `500 34px/1 ${SANS}`, letterSpacing: -1, color: OBS }}>Køkkenet</span>
        <span style={{ font: `400 13px/1 ${MONO}`, letterSpacing: 0.5, color: GRAPH }}>TORSDAG · AFTENENS BESTILLINGER</span>
      </div>
      {/* the columns, each named by a chip; the one the order is in is solid */}
      {COLS.map((c, i) => {
        const here = i === 0 ? 1 - m1 : i === 1 ? m1 * (1 - m2) : m2;
        return (
          <div key={c} style={{ position: 'absolute', left: slot(i, 0).x - 8, top: CY - 46, width: CW + 16, height: UH - CY + 60, borderRadius: 26, background: LIME }}>
            <span style={{ position: 'absolute', left: 8, top: 8, height: 40, padding: '0 16px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 10,
              background: here > 0.5 ? OBS : '#fff', color: here > 0.5 ? PORC : OBS, font: `500 16px/1 ${SANS}`, boxShadow: here > 0.5 ? 'none' : `inset 0 0 0 1px ${TRAV}` }}>
              {c}<span style={{ font: `400 14px/1 ${MONO}`, color: here > 0.5 ? TRAV : GRAPH }}>{count(i)}</span></span>
          </div>
        );
      })}
      {/* the cards */}
      {others.map(([p, no, at, lines, st, ck]) => (
        <div key={no} style={{ position: 'absolute', left: p.x, top: p.y }}><Card no={no} at={at} lines={lines} stage={st} cook={ck} /></div>
      ))}
      <div style={{ position: 'absolute', left: c214.x, top: c214.y, opacity: clamp(appear * 1.6), zIndex: 3,
        transform: `translateY(${-50 * (1 - appear)}px) scale(${mix(0.94, 1, clamp(appear)) * (1 + 0.04 * lift)})`,
        filter: `drop-shadow(${6 * lift}px ${4 + 18 * lift}px ${8 + 24 * lift}px rgba(13,13,15,${0.06 + 0.16 * lift}))` }}>
        <div style={{ filter: swap > 0.01 ? `blur(${1.6 * swap}px)` : undefined }}>
          <Card no={214} at="17.30" lines={['3 × Mørbradgryde med ris', '1 × Rødgrød med fløde']} stage={stage} cook={cook} now={now} isNew={stage === 'new'}
            press={stage === 'new' ? press1 : press2} tick={seg(t, DONE + 0.35, DONE + 0.7)} />
        </div>
      </div>
      {/* the fingers on the glass */}
      <Tap x={slot(0, 0).x + 150} y={slot(0, 0).y + CARD_H - 38} q={seg(t, START - 0.15, START + 0.22)} />
      <Tap x={slot(1, 0).x + CW - 66} y={slot(1, 0).y + CARD_H - 38} q={seg(t, DONE - 0.15, DONE + 0.22)} />
      {/* the order comes in: Smoke glass, because it floats */}
      <div style={{ position: 'absolute', left: 250, top: 86, height: 48, display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px', borderRadius: 24, color: PORC,
        background: 'rgba(14,15,16,.72)', boxShadow: '6px 12px 32px rgba(13,13,15,.16)', font: `500 16px/1 ${SANS}`, zIndex: 5,
        opacity: clamp(toast), transform: `translateY(${-30 * (1 - toast)}px) scale(${mix(0.94, 1, clamp(toast))})` }}>
        <i style={{ width: 7, height: 7, borderRadius: '50%', background: '#6E7BFF' }} />
        Ny bestilling fra spiis.dk<span style={{ font: `400 14px/1 ${MONO}`, color: TRAV }}>#0214</span>
        <i style={edge(EDGE)} />
      </div>
      {/* the light of the room, moving over the glass */}
      <i style={{ position: 'absolute', inset: 0, zIndex: 8, background: `linear-gradient(105deg, transparent ${mix(-30, 110, sweep)}%, rgba(255,255,255,.2) ${mix(-20, 120, sweep)}%, transparent ${mix(-10, 130, sweep)}%)` }} />
    </div>
  );

  return (
    <AbsoluteFill style={{ background: '#0B0908', overflow: 'hidden' }}>
      {/* the kitchen behind, out of focus */}
      <Img src={staticFile('film/assets/kitchen.webp')} style={{ position: 'absolute', left: -140, top: -60 - 30 * cam, width: 1120, height: 1120 * 3857 / 2160,
        filter: 'blur(14px) brightness(.62) saturate(1.1)', transform: `scale(${1.04 + 0.03 * cam})` }} />
      <i style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(11,9,8,.9) 0%, rgba(11,9,8,.35) 38%, rgba(11,9,8,.15) 60%, rgba(11,9,8,.75) 100%)' }} />
      {/* the iPad's shadow on the pass */}
      <i style={{ position: 'absolute', left: 110, width: 660, top: 1190, height: 100, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(0,0,0,.7), transparent)', opacity: back }} />

      {/* ---------- the iPad ---------- */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: UW + 2 * BEZ, height: UH + 2 * BEZ, borderRadius: 52, transformOrigin: '0 0',
        background: '#0A0A0B', boxShadow: 'inset 0 0 0 2px #2A2A2E, inset 0 0 0 5px #0A0A0B, inset 0 0 0 6px #3A3A40, 0 40px 80px rgba(0,0,0,.55)',
        transform: `translate(420px, 975px) perspective(2400px) scale(${k}) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${mix(0, 2, back)}deg) translate(${-fx}px, ${-fy}px)` }}>
        {screen}
      </div>

      {/* ---------- and on the guest's phone, the system's own message ---------- */}
      <div style={{ position: 'absolute', left: 130, top: 590, width: 600, padding: '22px 24px', borderRadius: 34, display: 'flex', alignItems: 'center', gap: 18, boxSizing: 'border-box',
        background: 'linear-gradient(160deg, rgba(255,255,255,.32), rgba(255,255,255,.16))', boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,.55), inset 0 0 0 1.5px rgba(255,255,255,.14), 0 30px 60px rgba(0,0,0,.45)',
        color: '#fff', fontFamily: SANS, opacity: clamp(sms * 1.4), transform: `translateY(${60 * (1 - sms)}px) scale(${mix(0.88, 1, clamp(sms))})`,
        filter: sms < 0.98 ? `blur(${(1 - clamp(sms)) * 6}px)` : undefined }}>
        <Img src={staticFile('ny/media/ic/spiis.svg')} style={{ width: 64, height: 64, borderRadius: 15, flex: 'none' }} />
        <span style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <span style={{ font: `500 18px/1 ${SANS}`, color: 'rgba(255,255,255,.65)' }}>SPIIS</span>
          <b style={{ font: `600 25px/1.15 ${SANS}` }}>Din bestilling er klar</b>
          <span style={{ font: `400 22px/1.2 ${SANS}`, color: 'rgba(255,255,255,.82)' }}>#214 · hent den ved disken</span>
        </span>
        <span style={{ alignSelf: 'flex-start', font: `400 18px/1 ${SANS}`, color: 'rgba(255,255,255,.6)' }}>nu</span>
      </div>
    </AbsoluteFill>
  );
};
