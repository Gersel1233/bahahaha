/* The Systems tile: the system that runs a business, shown on Spiis' own.
   An iPad at the pass of a kitchen in evening service (the kitchen
   photographed with Higgsfield, out of focus behind it). A light runs over
   its glass; the camera is close on the kitchen screen of Spiis' system,
   laid out as an iPad app is: the status bar, a floating glass sidebar, a
   large title with its toolbar, and the evening's orders in three columns.
   A new order comes in from the website and the day's count goes up; the
   kitchen starts it, it cooks, it is done, and the system itself tells the
   guest. The camera follows the order, then draws back to the whole iPad.
   The app is drawn in Liquid Atelier: porcelain and white, travertine
   hairlines, data in Fragment Mono, status by shape, obsidian buttons with
   their glass lens, glass only for what floats, ultramarine only for now. */
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { useT, useFonts, seg, out3, io3, mix, clamp, SANS, MONO, IOS } from './common';

export const SYS_S = 7.2;

// the iPad: an 11-inch iPad Pro, landscape, in its own points
const UW = 1180, UH = 820, BEZ = 20, FRAME = 3, R_SCREEN = 30;
const DW = UW + 2 * (BEZ + FRAME), DH = UH + 2 * (BEZ + FRAME);
// Liquid Atelier
const PORC = '#F6F4EF', LIME = '#E9E5DD', TRAV = '#D8D1C5', GRAPH = '#46443F', OBS = '#0E0F10', ULTRA = '#2436E8';
const EDGE = 'linear-gradient(135deg,rgba(255,255,255,.85),rgba(255,255,255,.12) 45%,rgba(255,255,255,.4))';
const EDGE_ON_LIGHT = 'linear-gradient(135deg,#fff,rgba(0,0,0,.04) 55%,rgba(0,0,0,.22))';
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

// the app's layout: a sidebar, then the content with three columns
const SIDE = 214, CONT = SIDE + 26, CW = (UW - CONT - 22 - 32) / 3, CARD_H = 178, GAP = 16, CY = 200;
const COLS = ['Nye', 'I gang', 'Klar'];
const slot = (col: number, idx: number) => ({ x: CONT + col * (CW + 16), y: CY + idx * (CARD_H + GAP) });
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

// small line icons, drawn the way the system draws them
const Ico: React.FC<{ d: string; s?: number; c?: string }> = ({ d, s = 20, c = OBS }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" style={{ flex: 'none' }}><path d={d} fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const I = {
  kitchen: 'M4 10h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM7 10V6a5 5 0 0 1 10 0v4M9 14h6',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  menu: 'M6 3h12a1 1 0 0 1 1 1v16l-3-2-3 2-3-2-3 2V4a1 1 0 0 1 1-1zM9 8h6M9 12h6',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12l2-1-1-3-2 .3-1.5-1.5L17 5l-3-1-1 2h-2l-1-2-3 1 .5 2L6 8.5 4 8.2 3 11l2 1-2 1 1 3 2-.3 1.5 1.5L7 19l3 1 1-2h2l1 2 3-1-.5-2 1.5-1.5 2 .3 1-3z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5',
  plus: 'M12 5v14M5 12h14',
  side: 'M4 5h16v14H4zM9 5v14',
};

type Stage = 'new' | 'cooking' | 'ready';
const Card: React.FC<{ no: number; at: string; what: string; more: string; stage: Stage; cook?: number; now?: number; press?: number; tick?: number }> =
  ({ no, at, what, more, stage, cook = 0, now = 0, press = 0, tick = 1 }) => (
  <div style={{ width: CW, height: CARD_H, borderRadius: 22, padding: '18px 20px', boxSizing: 'border-box', position: 'relative', overflow: 'hidden', background: '#fff',
    boxShadow: `inset 0 0 0 1px ${TRAV}, 2px 4px 12px rgba(13,13,15,.06), 0 0 0 ${2 * now}px ${PORC}, 0 0 0 ${4 * now}px rgba(36,54,232,${now})` }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, font: `400 15px/1 ${MONO}`, color: GRAPH }}>
      {now > 0.01 && <i style={{ width: 6, height: 6, borderRadius: '50%', background: ULTRA, opacity: now }} />}
      <span>#0{no}</span>
      <span style={{ marginLeft: 'auto', font: `500 18px/1 ${SANS}`, color: OBS, letterSpacing: -0.3 }}>{at}</span>
    </div>
    <div style={{ marginTop: 14, font: `500 22px/1.1 ${SANS}`, color: OBS, letterSpacing: -0.4, whiteSpace: 'nowrap' }}>{what}</div>
    <div style={{ marginTop: 6, font: `400 15px/1.2 ${SANS}`, color: GRAPH, whiteSpace: 'nowrap' }}>{more}</div>
    {/* what the kitchen can do with it now */}
    <div style={{ position: 'absolute', left: 20, right: 20, bottom: 16, height: 44 }}>
      {stage === 'new' && <span style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 44, borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 0 20px',
        background: press > 0.3 ? '#232426' : OBS, color: PORC, font: `500 15px/1 ${SANS}`, boxShadow: press > 0.3 ? 'inset 0 2px 4px rgba(0,0,0,.28)' : 'none' }}>
        Start tilberedning
        {/* the button's glass lens, over its arrow; ultramarine as it is pressed */}
        <span style={{ position: 'relative', width: 36, height: 36, borderRadius: 18, display: 'grid', placeItems: 'center', background: press > 0.3 ? ULTRA : 'rgba(255,255,255,.18)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <i style={edge(EDGE)} /></span>
      </span>}
      {stage === 'cooking' && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* a meniscus: a hairline track, ultramarine for the part that is happening now */}
        <span style={{ position: 'relative', flex: 1, height: 14 }}>
          <i style={{ position: 'absolute', left: 0, right: 0, top: 6.5, height: 1, background: TRAV }} />
          <i style={{ position: 'absolute', left: 0, top: 6, height: 2, width: `${100 * cook}%`, background: ULTRA }} />
          <i style={{ position: 'absolute', left: `calc(${100 * cook}% - 7px)`, top: 0, width: 14, height: 14, borderRadius: 7, background: '#fff', boxShadow: `0 0 0 1px ${TRAV}, 2px 4px 12px rgba(13,13,15,.10)` }} />
        </span>
        <span style={{ font: `400 14px/1 ${MONO}`, color: GRAPH }}>{Math.max(1, Math.round(12 * (1 - cook)))} min</span>
        <span style={{ height: 44, padding: '0 16px', borderRadius: 22, display: 'flex', alignItems: 'center', gap: 8, boxShadow: `inset 0 0 0 1px ${press > 0.3 ? OBS : TRAV}`,
          color: OBS, font: `500 15px/1 ${SANS}`, background: press > 0.3 ? LIME : '#fff' }}>Klar<Shape done={1} s={9} /></span>
      </div>}
      {stage === 'ready' && <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 10, font: `500 15px/1 ${SANS}`, color: OBS, borderTop: `1px solid ${LIME}`, paddingTop: 4 }}>
        <svg width="18" height="18" viewBox="0 0 24 24"><path d="M5 12.5 10 17.5 19.5 7" fill="none" stroke={OBS} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="24" strokeDashoffset={24 * (1 - tick)} /></svg>
        Gæsten har fået besked<span style={{ marginLeft: 'auto', font: `400 13px/1 ${MONO}`, color: GRAPH }}>sms</span></span>}
    </div>
  </div>
);

// a finger on the glass
const Tap: React.FC<{ x: number; y: number; q: number }> = ({ x, y, q }) => q <= 0 || q >= 1 ? null : (
  <i style={{ position: 'absolute', left: x - 30, top: y - 30, width: 60, height: 60, borderRadius: '50%', background: 'rgba(14,15,16,.12)', zIndex: 6,
    transform: `scale(${mix(0.5, 1.25, out3(q))})`, opacity: q < 0.25 ? q / 0.25 : 1 - (q - 0.25) / 0.75 }} />
);

export const TileSys: React.FC = () => {
  useFonts();
  const { t, sp } = useT();
  // Apple's springs, from a response (s) and a damping fraction
  const apple = (at: number, response: number, df: number) => sp(at, 4 * Math.PI * df / response, (2 * Math.PI / response) ** 2, 1);

  // the beats
  const NEW = 1.0, START = 2.3, DONE = 4.4, BACK = 5.05;
  const toast = t < NEW + 1.3 ? apple(NEW - 0.1, 0.42, 0.86) : 1 - io3(seg(t, NEW + 1.3, NEW + 1.65));
  const appear = apple(NEW + 0.08, 0.45, 0.82);
  const now = seg(t, NEW + 0.15, NEW + 0.45) * (1 - seg(t, DONE + 0.4, DONE + 0.8));
  const m1 = apple(START + 0.08, 0.5, 0.92), m2 = apple(DONE + 0.08, 0.5, 0.92);
  const lift = Math.max(Math.sin(Math.PI * seg(t, START + 0.05, START + 0.55)), Math.sin(Math.PI * seg(t, DONE + 0.05, DONE + 0.55)));
  const cook = io3(seg(t, START + 0.55, DONE - 0.2));
  const press1 = Math.sin(Math.PI * seg(t, START - 0.12, START + 0.1)), press2 = Math.sin(Math.PI * seg(t, DONE - 0.12, DONE + 0.1));
  const stage: Stage = t < START + 0.22 ? 'new' : t < DONE + 0.22 ? 'cooking' : 'ready';
  const swap = Math.max(clamp(1 - Math.abs(t - START - 0.22) / 0.14), clamp(1 - Math.abs(t - DONE - 0.22) / 0.14));
  const count = out3(seg(t, NEW + 0.2, NEW + 0.6));
  // the guest is told, by the system, on their phone
  const sms = apple(BACK + 0.55, 0.45, 0.8);

  // the card that is followed, and the others making room for it
  const c214 = lerp(lerp(slot(0, 0), slot(1, 0), m1), slot(2, 0), m2);
  const others: [Pt, number, string, string, string, Stage, number][] = [
    [lerp(slot(2, 0), slot(2, 1), m2), 210, '16.50', 'Mørbradgryde × 1', 'Hentes ved disken', 'ready', 0],
    [lerp(lerp(slot(1, 1), slot(1, 2), m1), slot(1, 1), m2), 211, '17.00', 'Mørbradgryde × 2', 'Kartoffelsalat × 1', 'cooking', 0.72 + 0.2 * cook],
    [lerp(lerp(slot(1, 0), slot(1, 1), m1), slot(1, 0), m2), 212, '17.10', 'Dagens suppe × 1', 'Brød × 2', 'cooking', 0.3 + 0.3 * cook],
    [lerp(lerp(slot(0, 0), slot(0, 1), appear), slot(0, 0), m1), 213, '17.15', 'Mørbradgryde × 2', 'Rødgrød × 2', 'new', 0],
  ];
  const n = (i: number) => i === 0 ? (t < START + 0.1 ? (appear > 0.5 ? 2 : 1) : 1) : i === 1 ? (m1 > 0.5 && m2 < 0.5 ? 3 : 2) : (m2 > 0.5 ? 2 : 1);

  // the camera: close on the glass, following the order from column to
  // column, then back, to show the whole iPad
  const f1 = apple(START + 0.12, 0.8, 1), f2 = apple(DONE + 0.12, 0.8, 1);
  const back = apple(BACK, 0.9, 0.96);
  const colX = (i: number) => FRAME + BEZ + slot(i, 0).x + CW / 2;
  // it opens on the whole iPad, as the light passes over it, and moves in
  const intro = apple(0.35, 1.15, 1);
  const fx = mix(mix(DW / 2 + 40, mix(mix(colX(0) + 70, colX(1) + 10, f1), colX(2) - 96, f2), intro), DW / 2 + 30, back);
  const fy = mix(mix(DH / 2 - 20, 377, intro), DH / 2, back);
  const k = mix(mix(0.7, 1.4, intro), 0.62, back);
  const rotY = mix(mix(-16, -6 + 1.5 * f1 + 1.5 * f2, intro), -17, back), rotX = mix(mix(12, 6, intro), 12, back);
  const cam = io3(seg(t, 0, SYS_S));
  // the light over the glass: once across at the start, and once as it draws back
  const sheen1 = seg(t, -0.45, 1.15), sheen2 = seg(t, BACK + 0.15, BACK + 1.6);

  const screen = (
    <div style={{ position: 'absolute', left: FRAME + BEZ, top: FRAME + BEZ, width: UW, height: UH, borderRadius: R_SCREEN, overflow: 'hidden', background: PORC, fontFamily: SANS }}>
      {/* iPadOS' status bar */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 28, display: 'flex', alignItems: 'center', padding: '0 22px', font: `600 14px/1 ${IOS}`, color: OBS, zIndex: 4 }}>
        <span>09.41</span><span style={{ marginLeft: 8, fontWeight: 500 }}>tor. 15. okt.</span>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="17" height="12" viewBox="0 0 17 12"><path d="M1 4.2a10.5 10.5 0 0 1 15 0M3.6 7a6.8 6.8 0 0 1 9.8 0M6.2 9.8a3 3 0 0 1 4.6 0" fill="none" stroke={OBS} strokeWidth="1.7" strokeLinecap="round" /></svg>
          <span style={{ fontWeight: 500 }}>100 %</span>
          <svg width="26" height="12" viewBox="0 0 26 12"><rect x=".6" y=".6" width="22" height="10.8" rx="3.2" fill="none" stroke="rgba(14,15,16,.4)" strokeWidth="1.1" /><rect x="2.2" y="2.2" width="18.8" height="7.6" rx="1.8" fill={OBS} /><path d="M24.2 4.2v3.6a1.8 1.8 0 0 0 0-3.6z" fill="rgba(14,15,16,.4)" /></svg>
        </span>
      </div>

      {/* the sidebar: floating glass, as iPadOS draws it now */}
      <div style={{ position: 'absolute', left: 10, top: 34, width: SIDE, bottom: 10, borderRadius: 26, padding: '16px 10px', boxSizing: 'border-box',
        background: 'rgba(255,255,255,.62)', boxShadow: `6px 12px 32px rgba(13,13,15,.10), inset 0 0 0 1px rgba(216,209,197,.6)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px 16px' }}>
          <Img src={staticFile('ny/media/ic/spiis.svg')} style={{ width: 34, height: 34, borderRadius: 9 }} />
          <span style={{ font: `500 20px/1 ${SANS}`, color: OBS }}>Spiis</span>
          <span style={{ marginLeft: 'auto' }}><Ico d={I.side} s={20} c={GRAPH} /></span>
        </div>
        {[[I.kitchen, 'Køkken'], [I.list, 'Bestillinger'], [I.menu, 'Menu'], [I.chart, 'Drift'], [I.gear, 'Indstillinger']].map(([d, l], i) => (
          <div key={l} style={{ height: 44, borderRadius: 22, display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px', marginBottom: 2,
            background: i === 0 ? OBS : 'transparent', color: i === 0 ? PORC : OBS, font: `500 16px/1 ${SANS}` }}>
            <Ico d={d} s={19} c={i === 0 ? PORC : GRAPH} />{l}
            {i === 1 && <span style={{ marginLeft: 'auto', font: `400 13px/1 ${MONO}`, color: GRAPH }}><Num from={23} to={24} q={count} /></span>}
          </div>
        ))}
        {/* the evening, in mono, at the foot of the sidebar */}
        <div style={{ position: 'absolute', left: 18, right: 18, bottom: 18, paddingTop: 14, borderTop: `1px solid ${TRAV}`, display: 'flex', flexDirection: 'column', gap: 10, font: `400 12px/1 ${MONO}`, color: GRAPH }}>
          <span style={{ display: 'flex', justifyContent: 'space-between' }}>KOMMISSION<b style={{ font: `500 15px/1 ${SANS}`, color: OBS }}>0 kr</b></span>
          <span style={{ display: 'flex', justifyContent: 'space-between' }}>I DAG<b style={{ font: `500 15px/1 ${SANS}`, color: OBS }}><Num from={23} to={24} q={count} /> stk.</b></span>
        </div>
      </div>

      {/* the content: a large title, its toolbar, and the evening's line */}
      <div style={{ position: 'absolute', left: CONT, top: 44, right: 22, display: 'flex', alignItems: 'center' }}>
        <span style={{ font: `500 36px/1 ${SANS}`, letterSpacing: -1.2, color: OBS }}>Køkken</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 16, font: `400 13px/1 ${MONO}`, color: GRAPH }}>
          <i style={{ width: 6, height: 6, borderRadius: '50%', background: ULTRA }} />LIVE · AFTENENS BESTILLINGER</span>
        {/* the toolbar: glass, because it floats */}
        <span style={{ position: 'relative', marginLeft: 'auto', height: 44, borderRadius: 22, display: 'flex', alignItems: 'center', gap: 4, padding: '0 6px',
          background: 'rgba(255,255,255,.7)', boxShadow: '2px 4px 12px rgba(13,13,15,.10)' }}>
          {[I.search, I.list, I.plus].map(d => <span key={d} style={{ width: 36, height: 36, display: 'grid', placeItems: 'center' }}><Ico d={d} s={19} /></span>)}
          <i style={edge(EDGE_ON_LIGHT)} />
        </span>
      </div>

      {/* the columns, each named by a chip; the one the order is in is solid */}
      {COLS.map((c, i) => {
        const here = i === 0 ? 1 - m1 : i === 1 ? m1 * (1 - m2) : m2;
        return (
          <div key={c} style={{ position: 'absolute', left: slot(i, 0).x - 8, top: CY - 62, width: CW + 16, height: UH - CY + 80, borderRadius: 26, background: LIME }}>
            <span style={{ position: 'absolute', left: 8, top: 8, height: 40, padding: '0 16px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 10,
              background: here > 0.5 ? OBS : '#fff', color: here > 0.5 ? PORC : OBS, font: `500 16px/1 ${SANS}`, boxShadow: here > 0.5 ? 'none' : `inset 0 0 0 1px ${TRAV}` }}>
              {c}<span style={{ font: `400 14px/1 ${MONO}`, color: here > 0.5 ? TRAV : GRAPH }}>{n(i)}</span></span>
          </div>
        );
      })}
      {/* the cards */}
      {others.map(([p, no, at, what, more, st, ck]) => (
        <div key={no} style={{ position: 'absolute', left: p.x, top: p.y }}><Card no={no} at={at} what={what} more={more} stage={st} cook={ck} /></div>
      ))}
      <div style={{ position: 'absolute', left: c214.x, top: c214.y, opacity: clamp(appear * 1.6), zIndex: 3,
        transform: `translateY(${-40 * (1 - appear)}px) scale(${mix(0.95, 1, clamp(appear)) * (1 + 0.035 * lift)})`,
        filter: `drop-shadow(${6 * lift}px ${4 + 18 * lift}px ${8 + 24 * lift}px rgba(13,13,15,${0.06 + 0.16 * lift}))` }}>
        <div style={{ filter: swap > 0.01 ? `blur(${1.4 * swap}px)` : undefined }}>
          <Card no={214} at="17.30" what="Mørbradgryde × 3" more="Rødgrød × 1 · fra spiis.dk" stage={stage} cook={cook} now={now}
            press={stage === 'new' ? press1 : press2} tick={seg(t, DONE + 0.35, DONE + 0.7)} />
        </div>
      </div>
      {/* the fingers on the glass */}
      <Tap x={slot(0, 0).x + CW / 2} y={slot(0, 0).y + CARD_H - 38} q={seg(t, START - 0.14, START + 0.22)} />
      <Tap x={slot(1, 0).x + CW - 60} y={slot(1, 0).y + CARD_H - 38} q={seg(t, DONE - 0.14, DONE + 0.22)} />
      {/* the order comes in: Smoke glass, because it floats */}
      <div style={{ position: 'absolute', left: slot(0, 0).x + 104, top: CY - 58, height: 44, display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px', borderRadius: 22, color: PORC,
        background: 'rgba(14,15,16,.74)', boxShadow: '6px 12px 32px rgba(13,13,15,.18)', font: `500 15px/1 ${SANS}`, zIndex: 5, whiteSpace: 'nowrap',
        opacity: clamp(toast), transform: `translateY(${-24 * (1 - toast)}px) scale(${mix(0.94, 1, clamp(toast))})` }}>
        <i style={{ width: 7, height: 7, borderRadius: '50%', background: '#6E7BFF' }} />Ny bestilling<span style={{ font: `400 13px/1 ${MONO}`, color: TRAV }}>spiis.dk</span>
        <i style={edge(EDGE)} />
      </div>
    </div>
  );

  // a band of light passing over the glass
  const sheen = (q: number, a: number) => {
    if (q <= 0 || q >= 1) return null;
    const c = mix(-30, 130, q); // where the band is, across the glass
    return <i style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
      background: `linear-gradient(112deg, transparent ${c - 16}%, rgba(255,255,255,${a * 0.35}) ${c - 7}%, rgba(255,255,255,${a}) ${c}%, rgba(255,255,255,${a * 0.35}) ${c + 5}%, transparent ${c + 12}%)` }} />;
  };

  return (
    <AbsoluteFill style={{ background: '#0B0908', overflow: 'hidden' }}>
      {/* the kitchen behind, out of focus */}
      <Img src={staticFile('film/assets/kitchen.webp')} style={{ position: 'absolute', left: -140, top: -60 - 30 * cam, width: 1120, height: 1120 * 3857 / 2160,
        filter: 'blur(14px) brightness(.62) saturate(1.1)', transform: `scale(${1.04 + 0.03 * cam})` }} />
      <i style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(11,9,8,.9) 0%, rgba(11,9,8,.35) 38%, rgba(11,9,8,.15) 60%, rgba(11,9,8,.75) 100%)' }} />
      {/* the iPad's shadow on the pass */}
      <i style={{ position: 'absolute', left: 120, width: 640, top: 1170, height: 90, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(0,0,0,.75), transparent)', opacity: Math.max(back, 1 - intro) }} />

      {/* ---------- the iPad: an aluminium edge, the black glass, its camera ---------- */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: DW, height: DH, borderRadius: R_SCREEN + BEZ + FRAME, transformOrigin: '0 0',
        background: 'linear-gradient(135deg, #9A9DA3, #3C3E43 22%, #2A2B2F 50%, #5B5E64 78%, #B4B7BC)',
        boxShadow: '0 50px 90px rgba(0,0,0,.6), 0 12px 24px rgba(0,0,0,.35)',
        transform: `translate(420px, 975px) perspective(2400px) scale(${k}) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${mix(0, 1.6, back)}deg) translate(${-fx}px, ${-fy}px)` }}>
        {/* the glass front, black to its edge */}
        <div style={{ position: 'absolute', inset: FRAME, borderRadius: R_SCREEN + BEZ, background: '#050506', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.06)' }}>
          {/* the front camera, on the long edge */}
          <i style={{ position: 'absolute', left: DW / 2 - FRAME - 5, top: BEZ / 2 - 5, width: 10, height: 10, borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 35%, #2A3550, #0B0E16 60%, #000)', boxShadow: '0 0 0 1.5px #0E0F12' }} />
        </div>
        {screen}
        {/* the glass over everything: a standing reflection, and the light passing */}
        <i style={{ position: 'absolute', inset: FRAME, borderRadius: R_SCREEN + BEZ, pointerEvents: 'none', zIndex: 8,
          background: `linear-gradient(${150 + 20 * back}deg, rgba(255,255,255,.07), rgba(255,255,255,0) 35%, rgba(255,255,255,0) 70%, rgba(255,255,255,.04))` }} />
        <div style={{ position: 'absolute', inset: FRAME, borderRadius: R_SCREEN + BEZ, overflow: 'hidden', zIndex: 9 }}>
          {sheen(sheen1, 0.55)}{sheen(sheen2, 0.4)}
        </div>
      </div>

      {/* ---------- and on the guest's phone, the system's own message ---------- */}
      <div style={{ position: 'absolute', left: 120, top: 590, width: 600, padding: '22px 24px', borderRadius: 34, display: 'flex', alignItems: 'center', gap: 18, boxSizing: 'border-box',
        background: 'linear-gradient(160deg, rgba(255,255,255,.32), rgba(255,255,255,.16))', boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,.55), inset 0 0 0 1.5px rgba(255,255,255,.14), 0 30px 60px rgba(0,0,0,.45)',
        color: '#fff', fontFamily: IOS, opacity: clamp(sms * 1.4), transform: `translateY(${60 * (1 - sms)}px) scale(${mix(0.88, 1, clamp(sms))})`,
        filter: sms < 0.98 ? `blur(${(1 - clamp(sms)) * 6}px)` : undefined }}>
        <Img src={staticFile('ny/media/ic/spiis.svg')} style={{ width: 64, height: 64, borderRadius: 15, flex: 'none' }} />
        <span style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <span style={{ font: `500 18px/1 ${IOS}`, color: 'rgba(255,255,255,.65)' }}>SPIIS</span>
          <b style={{ font: `600 25px/1.15 ${IOS}` }}>Din bestilling er klar</b>
          <span style={{ font: `400 22px/1.2 ${IOS}`, color: 'rgba(255,255,255,.82)' }}>#0214 · hent den ved disken</span>
        </span>
        <span style={{ alignSelf: 'flex-start', font: `400 18px/1 ${IOS}`, color: 'rgba(255,255,255,.6)' }}>nu</span>
      </div>
    </AbsoluteFill>
  );
};
