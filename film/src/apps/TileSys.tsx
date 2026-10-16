/* The Systems tile: the system that runs a business, shown on Spiis' own.
   An iPad at the pass of a kitchen in evening service (the kitchen
   photographed with Higgsfield, out of focus behind it). A light runs over
   its glass; then the camera is close on one order at a time, the way a
   kitchen screen should show it: the dish, what it is, when it is to be
   fetched, and where it is now — Modtaget, I gang, Klar, Sms sendt — on a
   segmented control whose glass lens travels with it. The last order
   leaves, the new one from spiis.dk comes in, the kitchen starts it, marks
   it ready, the guest gets a text; the camera draws back to the whole iPad
   and the guest's phone. The app is laid out as an iPad app (status bar,
   floating tab bar) and drawn in Liquid Atelier. */
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { useT, useFonts, seg, out3, io3, mix, clamp, SANS, MONO, IOS } from './common';

export const SYS_S = 7.2;

// the iPad: an 11-inch iPad Pro, landscape, in its own points
const UW = 1180, UH = 820, BEZ = 20, FRAME = 3, R_SCREEN = 30;
const DW = UW + 2 * (BEZ + FRAME), DH = UH + 2 * (BEZ + FRAME), IN = FRAME + BEZ;
// Liquid Atelier
const PORC = '#F6F4EF', LIME = '#E9E5DD', TRAV = '#D8D1C5', ASH = '#8C8880', GRAPH = '#46443F', OBS = '#0E0F10', ULTRA = '#2436E8';
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
const Tick: React.FC<{ p: number; s?: number; c?: string; w?: number }> = ({ p, s = 18, c = OBS, w = 2.6 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" style={{ flex: 'none' }}><path d="M5 12.5 10 17.5 19.5 7" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="24" strokeDashoffset={24 * (1 - clamp(p))} /></svg>
);

// a number that changes the way iOS changes one
const Num: React.FC<{ from: number; to: number; q: number }> = ({ from, to, q }) => (
  <span style={{ position: 'relative', display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom' }}>
    <span style={{ visibility: 'hidden' }}>{Math.max(from, to)}</span>
    {q < 1 && <span style={{ position: 'absolute', left: 0, top: 0, opacity: 1 - q, transform: `translateY(${-q * 60}%)`, filter: q > 0.01 ? `blur(${q * 3}px)` : undefined }}>{from}</span>}
    {q > 0 && <span style={{ position: 'absolute', left: 0, top: 0, opacity: q, transform: `translateY(${(1 - q) * 60}%)`, filter: q < 0.99 ? `blur(${(1 - q) * 3}px)` : undefined }}>{to}</span>}
  </span>
);
// a line of words that changes the same way
const Swap: React.FC<{ items: [React.ReactNode, number][]; t: number; h: number }> = ({ items, t, h }) => (
  <span style={{ position: 'relative', display: 'block', height: h }}>
    {items.map(([node, at], i) => {
      const next = items[i + 1];
      const inn = i === 0 ? 1 : out3(seg(t, at, at + 0.28));
      const go = next ? out3(seg(t, next[1], next[1] + 0.2)) : 0;
      const o = inn * (1 - go);
      if (o <= 0.001) return null;
      return <span key={i} style={{ position: 'absolute', left: 0, top: 0, right: 0, height: h, display: 'flex', alignItems: 'center', opacity: o,
        transform: `translateY(${(1 - inn) * 10 - go * 10}px)`, filter: o < 0.99 ? `blur(${(1 - o) * 4}px)` : undefined }}>{node}</span>;
    })}
  </span>
);

// LA31 Control / Segmented, with the glass lens that travels and magnifies
const STEPS = ['Modtaget', 'I gang', 'Klar', 'Sms sendt'];
const Segmented: React.FC<{ pos: number; travel: number; w: number }> = ({ pos, travel, w }) => {
  const H = 52, P = 4, cw = (w - 2 * P) / STEPS.length, mag = 1 + 0.08 * travel;
  return (
    <div style={{ position: 'relative', width: w, height: H, borderRadius: H / 2, background: LIME, boxShadow: `inset 0 0 0 1px ${TRAV}` }}>
      <div style={{ position: 'absolute', left: P + pos * cw, top: P, width: cw, height: H - 2 * P, borderRadius: (H - 2 * P) / 2,
        background: 'rgba(255,255,255,.92)', boxShadow: '2px 4px 12px rgba(13,13,15,.12)', transform: `scale(${mag})` }}><i style={edge(EDGE_ON_LIGHT)} /></div>
      {STEPS.map((l, i) => {
        const near = clamp(1 - Math.abs(pos - i));
        const passed = clamp(pos - i + 1);
        return <span key={l} style={{ position: 'absolute', left: P + i * cw, top: 0, width: cw, height: H, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          font: `500 16px/1 ${SANS}`, color: near > 0.5 ? OBS : passed >= 1 ? GRAPH : ASH, transform: `scale(${1 + (mag - 1) * near})` }}>
          <Shape done={passed >= 1 && i < pos - 0.5 ? 1 : 0} s={10} c={near > 0.5 ? OBS : passed >= 1 ? GRAPH : ASH} />{l}</span>;
      })}
    </div>
  );
};

// a finger on the glass
const Tap: React.FC<{ x: number; y: number; q: number }> = ({ x, y, q }) => q <= 0 || q >= 1 ? null : (
  <i style={{ position: 'absolute', left: x - 30, top: y - 30, width: 60, height: 60, borderRadius: '50%', background: 'rgba(14,15,16,.14)', zIndex: 6,
    transform: `scale(${mix(0.5, 1.25, out3(q))})`, opacity: q < 0.25 ? q / 0.25 : 1 - (q - 0.25) / 0.75 }} />
);

// the order panel, on the left of the app
const OX = 24, OY = 92, OW = 560, OH = 560;
// the queue, on the right
const QX = OX + OW + 24, QW = UW - QX - 24;

export const TileSys: React.FC = () => {
  useFonts();
  const { t, sp } = useT();
  // Apple's springs, from a response (s) and a damping fraction
  const apple = (at: number, response: number, df: number) => sp(at, 4 * Math.PI * df / response, (2 * Math.PI / response) ** 2, 1);

  // the beats
  const NEW = 1.05, START = 2.35, READY = 3.85, SENT = 4.45, BACK = 5.05;
  const swapIn = apple(NEW, 0.55, 0.9); // the last order goes, the new one comes in
  const toast = t < NEW + 1.2 ? apple(NEW - 0.12, 0.42, 0.86) : 1 - io3(seg(t, NEW + 1.2, NEW + 1.5));
  const now = seg(t, NEW + 0.2, NEW + 0.5) * (1 - seg(t, SENT + 0.3, SENT + 0.7));
  const lensAt = (a: number) => seg(t, a, a + 0.3);
  const ease = (x: number) => 1 - Math.pow(1 - x, 3);
  const pos = ease(lensAt(START + 0.06)) + ease(lensAt(READY + 0.06)) + ease(lensAt(SENT));
  const travel = Math.sin(Math.PI * lensAt(START + 0.06)) + Math.sin(Math.PI * lensAt(READY + 0.06)) + Math.sin(Math.PI * lensAt(SENT));
  const cook = io3(seg(t, START + 0.3, READY - 0.15));
  const press1 = Math.sin(Math.PI * seg(t, START - 0.12, START + 0.1)), press2 = Math.sin(Math.PI * seg(t, READY - 0.12, READY + 0.1));
  const count = out3(seg(t, NEW + 0.25, NEW + 0.65));
  const sms = apple(BACK + 0.55, 0.45, 0.8);

  // the camera: the whole iPad as the light passes, close on the order, then back
  const intro = apple(0.35, 1.15, 1), back = apple(BACK, 0.9, 0.96);
  const k = mix(mix(0.7, 1.4, intro), 0.62, back);
  const fx = mix(mix(DW / 2 + 40, IN + OX + OW / 2, intro), DW / 2 + 30, back);
  const fy = mix(mix(DH / 2 - 20, IN + OY + 262, intro), DH / 2, back);
  const rotY = mix(mix(-16, -6 + 2 * io3(seg(t, 1, BACK)), intro), -17, back), rotX = mix(mix(12, 6, intro), 12, back);
  const cam = io3(seg(t, 0, SYS_S));
  const sheen1 = seg(t, -0.45, 1.15), sheen2 = seg(t, BACK + 0.15, BACK + 1.6);

  // one order on the panel: the photograph, what, when, where it is, and what to do
  const order = (o: { no: string; at: string; what: string; n: string; more: string; live: boolean }) => (
    <div style={{ position: 'absolute', inset: 0, padding: 22, boxSizing: 'border-box' }}>
      <div style={{ position: 'relative', height: 214, borderRadius: 18, overflow: 'hidden' }}>
        <Img src={staticFile('film/assets/dish.webp')} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 55%' }} />
        <i style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(14,15,16,0) 55%, rgba(14,15,16,.35))' }} />
        <span style={{ position: 'absolute', right: 14, bottom: 14, height: 34, padding: '0 14px', borderRadius: 17, display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(14,15,16,.6)', color: PORC, font: `400 13px/1 ${MONO}` }}>AFHENTNING <b style={{ font: `500 16px/1 ${SANS}` }}>{o.at}</b><i style={edge(EDGE)} /></span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 20, font: `400 14px/1 ${MONO}`, color: GRAPH }}>
        {o.live && <i style={{ width: 6, height: 6, borderRadius: '50%', background: ULTRA, opacity: now }} />}#{o.no} · FRA SPIIS.DK · BETALT ONLINE
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 12 }}>
        <span style={{ font: `500 38px/1 ${SANS}`, letterSpacing: -1.3, color: OBS }}>{o.what}</span>
        <span style={{ font: `400 26px/1 ${MONO}`, color: GRAPH }}>× {o.n}</span>
      </div>
      <div style={{ marginTop: 8, font: `400 18px/1.2 ${SANS}`, color: GRAPH }}>{o.more}</div>
    </div>
  );

  const queue: [string, string, string, number][] = [
    ['#0213', 'Mørbradgryde × 2', '17.15', 1], ['#0212', 'Dagens suppe × 1', '17.10', 0], ['#0211', 'Mørbradgryde × 2', '17.00', 0], ['#0210', 'Kartoffelsalat × 1', '16.50', 1],
  ];

  const screen = (
    <div style={{ position: 'absolute', left: IN, top: IN, width: UW, height: UH, borderRadius: R_SCREEN, overflow: 'hidden', background: PORC, fontFamily: SANS }}>
      {/* iPadOS' status bar */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 28, display: 'flex', alignItems: 'center', padding: '0 22px', font: `600 14px/1 ${IOS}`, color: OBS, zIndex: 4 }}>
        <span>09.41</span><span style={{ marginLeft: 8, fontWeight: 500 }}>tor. 15. okt.</span>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="17" height="12" viewBox="0 0 17 12"><path d="M1 4.2a10.5 10.5 0 0 1 15 0M3.6 7a6.8 6.8 0 0 1 9.8 0M6.2 9.8a3 3 0 0 1 4.6 0" fill="none" stroke={OBS} strokeWidth="1.7" strokeLinecap="round" /></svg>
          <span style={{ fontWeight: 500 }}>100 %</span>
          <svg width="26" height="12" viewBox="0 0 26 12"><rect x=".6" y=".6" width="22" height="10.8" rx="3.2" fill="none" stroke="rgba(14,15,16,.4)" strokeWidth="1.1" /><rect x="2.2" y="2.2" width="18.8" height="7.6" rx="1.8" fill={OBS} /><path d="M24.2 4.2v3.6a1.8 1.8 0 0 0 0-3.6z" fill="rgba(14,15,16,.4)" /></svg>
        </span>
      </div>
      {/* the app's name, and its floating tab bar of glass, as iPadOS has it */}
      <div style={{ position: 'absolute', left: OX + 4, top: 44, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Img src={staticFile('ny/media/ic/spiis.svg')} style={{ width: 30, height: 30, borderRadius: 8 }} />
        <span style={{ font: `500 19px/1 ${SANS}`, color: OBS }}>Spiis</span>
      </div>
      <div style={{ position: 'absolute', left: UW / 2 - 160, top: 34, width: 320, height: 48, borderRadius: 24, display: 'flex', alignItems: 'center', padding: 4, boxSizing: 'border-box',
        background: 'rgba(255,255,255,.72)', boxShadow: '6px 12px 32px rgba(13,13,15,.10)' }}>
        {['Køkken', 'Menu', 'Drift'].map((n, i) => <span key={n} style={{ flex: 1, height: 40, borderRadius: 20, display: 'grid', placeItems: 'center', font: `500 15px/1 ${SANS}`,
          background: i === 0 ? OBS : 'transparent', color: i === 0 ? PORC : GRAPH }}>{n}</span>)}
        <i style={edge(EDGE_ON_LIGHT)} />
      </div>
      <div style={{ position: 'absolute', right: 24, top: 44, display: 'flex', alignItems: 'center', gap: 7, font: `400 13px/1 ${MONO}`, color: GRAPH }}>
        <i style={{ width: 6, height: 6, borderRadius: '50%', background: ULTRA }} />LIVE · TORSDAG AFTEN</div>

      {/* ---------- the order, in front ---------- */}
      <div style={{ position: 'absolute', left: OX, top: OY, width: OW, height: OH, borderRadius: 28, background: '#fff', overflow: 'hidden',
        boxShadow: `inset 0 0 0 1px ${TRAV}, 6px 12px 32px rgba(13,13,15,.08), 0 0 0 ${2 * now}px ${PORC}, 0 0 0 ${4 * now}px rgba(36,54,232,${now})` }}>
        {/* the last order leaves to the left, the new one comes in from the right */}
        <div style={{ position: 'absolute', inset: 0, transform: `translateX(${-OW * 1.05 * swapIn}px)`, opacity: 1 - seg(swapIn, 0.6, 1) }}>
          {order({ no: '0213', at: '17.15', what: 'Mørbradgryde', n: '2', more: 'med ris · Rødgrød med fløde × 2', live: false })}
        </div>
        <div style={{ position: 'absolute', inset: 0, transform: `translateX(${OW * 1.05 * (1 - swapIn)}px)` }}>
          {order({ no: '0214', at: '17.30', what: 'Mørbradgryde', n: '3', more: 'med ris · Rødgrød med fløde × 1', live: true })}
        </div>
        {/* where it is, and what to do */}
        <div style={{ position: 'absolute', left: 22, right: 22, top: 404 }}>
          <Segmented pos={t < NEW ? 3 : pos + 3 * (1 - clamp(swapIn))} travel={travel + Math.sin(Math.PI * clamp(swapIn)) * (t < NEW + 0.7 ? 1 : 0)} w={OW - 44} />
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 22, height: 52 }}>
            <span style={{ flex: 1, font: `500 17px/1 ${SANS}`, color: OBS }}>
              <Swap t={t} h={52} items={[
                [<span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Tick p={1} />Gæsten har fået en sms</span>, 0],
                [<span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Shape done={0} />Venter på køkkenet</span>, NEW + 0.2],
                [<span style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                  <span style={{ position: 'relative', width: 150, height: 14 }}>
                    <i style={{ position: 'absolute', left: 0, right: 0, top: 6.5, height: 1, background: TRAV }} />
                    <i style={{ position: 'absolute', left: 0, top: 6, height: 2, width: `${100 * cook}%`, background: ULTRA }} />
                    <i style={{ position: 'absolute', left: `calc(${100 * cook}% - 7px)`, top: 0, width: 14, height: 14, borderRadius: 7, background: '#fff', boxShadow: `0 0 0 1px ${TRAV}, 2px 4px 12px rgba(13,13,15,.10)` }} />
                  </span><span style={{ font: `400 15px/1 ${MONO}`, color: GRAPH }}>{Math.max(1, Math.round(12 * (1 - cook)))} MIN</span></span>, START + 0.1],
                [<span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Shape done={1} />Klar til afhentning</span>, READY + 0.1],
                [<span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Tick p={seg(t, SENT + 0.1, SENT + 0.45)} />Gæsten har fået en sms</span>, SENT],
              ]} />
            </span>
            {/* the button: LA32 Primary, obsidian with its glass lens; the step it takes changes with the order */}
            <span style={{ position: 'relative', height: 52, borderRadius: 26, display: 'flex', alignItems: 'center', gap: 14, padding: '0 5px 0 22px', minWidth: 236, boxSizing: 'border-box',
              background: (t > SENT || t < NEW + 0.3) ? TRAV : (press1 + press2) > 0.3 ? '#232426' : OBS, color: (t > SENT || t < NEW + 0.3) ? GRAPH : PORC, font: `500 16px/1 ${SANS}`,
              boxShadow: (press1 + press2) > 0.3 ? 'inset 0 2px 4px rgba(0,0,0,.28)' : 'none' }}>
              <span style={{ flex: 1, position: 'relative', height: 52 }}>
                <Swap t={t} h={52} items={[[<>Sendt til gæsten</>, 0], [<>Start tilberedning</>, NEW + 0.2], [<>Markér som klar</>, START + 0.2], [<>Sendt til gæsten</>, SENT]]} />
              </span>
              <span style={{ position: 'relative', width: 42, height: 42, borderRadius: 21, display: 'grid', placeItems: 'center',
                background: (press1 + press2) > 0.3 ? ULTRA : (t > SENT || t < NEW + 0.3) ? 'rgba(255,255,255,.5)' : 'rgba(255,255,255,.18)' }}>
                {(t > SENT || t < NEW + 0.3) ? <Tick p={1} s={16} c={GRAPH} w={3} /> :
                  <svg width="16" height="16" viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                <i style={edge(EDGE)} /></span>
            </span>
          </div>
        </div>
      </div>
      <Tap x={OX + OW - 22 - 120} y={OY + 404 + 52 + 22 + 26} q={seg(t, START - 0.14, START + 0.22)} />
      <Tap x={OX + OW - 22 - 120} y={OY + 404 + 52 + 22 + 26} q={seg(t, READY - 0.14, READY + 0.22)} />
      {/* the new order arriving: Smoke glass, because it floats */}
      <div style={{ position: 'absolute', left: OX + 22, top: OY + 22, height: 44, display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px', borderRadius: 22, color: PORC, zIndex: 5,
        background: 'rgba(14,15,16,.74)', boxShadow: '6px 12px 32px rgba(13,13,15,.18)', font: `500 16px/1 ${SANS}`, whiteSpace: 'nowrap',
        opacity: clamp(toast), transform: `translateY(${-20 * (1 - toast)}px) scale(${mix(0.94, 1, clamp(toast))})` }}>
        <i style={{ width: 7, height: 7, borderRadius: '50%', background: '#7B86FF' }} />Ny bestilling<span style={{ font: `400 13px/1 ${MONO}`, color: TRAV }}>SPIIS.DK</span>
        <i style={edge(EDGE)} />
      </div>

      {/* ---------- the queue, to the right ---------- */}
      <div style={{ position: 'absolute', left: QX, top: OY, width: QW }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', font: `400 13px/1 ${MONO}`, letterSpacing: 0.5, color: GRAPH, padding: '0 4px 14px' }}>
          <span>I AFTEN</span><span><b style={{ font: `500 22px/1 ${SANS}`, color: OBS }}><Num from={23} to={24} q={count} /></b> bestillinger</span>
        </div>
        {queue.map(([no, what, at, d], i) => (
          <div key={no} style={{ height: 66, borderTop: `1px solid ${TRAV}`, display: 'flex', alignItems: 'center', gap: 12, padding: '0 4px' }}>
            <span style={{ font: `400 13px/1 ${MONO}`, color: GRAPH, width: 52 }}>{no}</span>
            <Shape done={d} s={10} />
            <span style={{ font: `500 17px/1 ${SANS}`, color: OBS }}>{what}</span>
            <span style={{ marginLeft: 'auto', font: `400 14px/1 ${MONO}`, color: GRAPH }}>{at}</span>
          </div>
        ))}
        <div style={{ marginTop: 28, padding: '18px 18px', borderRadius: 22, background: LIME, display: 'flex', justifyContent: 'space-between' }}>
          {[['KOMMISSION', '0 kr'], ['KANAL', 'spiis.dk'], ['BETALT', 'online']].map(([l, v]) => (
            <span key={l} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ font: `400 11px/1 ${MONO}`, letterSpacing: 0.5, color: ASH }}>{l}</span>
              <span style={{ font: `500 20px/1 ${SANS}`, color: OBS }}>{v}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  // a band of light passing over the glass
  const sheen = (q: number, a: number) => {
    if (q <= 0 || q >= 1) return null;
    const c = mix(-30, 130, q);
    return <i style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
      background: `linear-gradient(112deg, transparent ${c - 16}%, rgba(255,255,255,${a * 0.35}) ${c - 7}%, rgba(255,255,255,${a}) ${c}%, rgba(255,255,255,${a * 0.35}) ${c + 5}%, transparent ${c + 12}%)` }} />;
  };

  return (
    <AbsoluteFill style={{ background: '#0B0908', overflow: 'hidden' }}>
      {/* the kitchen behind, out of focus */}
      <Img src={staticFile('film/assets/kitchen.webp')} style={{ position: 'absolute', left: -140, top: -60 - 30 * cam, width: 1120, height: 1120 * 3857 / 2160,
        filter: 'blur(14px) brightness(.62) saturate(1.1)', transform: `scale(${1.04 + 0.03 * cam})` }} />
      <i style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(11,9,8,.9) 0%, rgba(11,9,8,.35) 38%, rgba(11,9,8,.15) 60%, rgba(11,9,8,.75) 100%)' }} />
      <i style={{ position: 'absolute', left: 120, width: 640, top: 1170, height: 90, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(0,0,0,.75), transparent)', opacity: Math.max(back, 1 - intro) }} />

      {/* ---------- the iPad: an aluminium edge, the black glass, its camera ---------- */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: DW, height: DH, borderRadius: R_SCREEN + BEZ + FRAME, transformOrigin: '0 0',
        background: 'linear-gradient(135deg, #9A9DA3, #3C3E43 22%, #2A2B2F 50%, #5B5E64 78%, #B4B7BC)',
        boxShadow: '0 50px 90px rgba(0,0,0,.6), 0 12px 24px rgba(0,0,0,.35)',
        transform: `translate(420px, 975px) perspective(2400px) scale(${k}) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${mix(0, 1.6, back)}deg) translate(${-fx}px, ${-fy}px)` }}>
        <div style={{ position: 'absolute', inset: FRAME, borderRadius: R_SCREEN + BEZ, background: '#050506', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.06)' }}>
          <i style={{ position: 'absolute', left: DW / 2 - FRAME - 5, top: BEZ / 2 - 5, width: 10, height: 10, borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 35%, #2A3550, #0B0E16 60%, #000)', boxShadow: '0 0 0 1.5px #0E0F12' }} />
        </div>
        {screen}
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
          <span style={{ font: `400 22px/1.2 ${IOS}`, color: 'rgba(255,255,255,.82)' }}>#0214 · hent den ved disken kl. 17.30</span>
        </span>
        <span style={{ alignSelf: 'flex-start', font: `400 18px/1 ${IOS}`, color: 'rgba(255,255,255,.6)' }}>nu</span>
      </div>
    </AbsoluteFill>
  );
};
