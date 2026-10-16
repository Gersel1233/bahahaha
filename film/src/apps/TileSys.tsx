/* The Systems tile: the system that runs a business, shown on Spiis' own,
   drawn in Liquid Atelier. The camera is inside the iPad's screen all the
   way: a product window on porcelain, the evening's figure, a ledger of
   orders with status by shape, and ultramarine only for what is "now".
   A new order comes in from the website and the count goes up; it is
   opened, and the glass lens of a segmented control travels with the
   kitchen through Modtaget → Tilberedes → Klar, and the guest is told.
   Glass only where something floats: the lens. */
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { useT, useFonts, seg, out3, io3, mix, clamp, SANS, MONO } from './common';

export const SYS_S = 7;

// the iPad's screen, in its own points (an 11-inch iPad, landscape)
const UW = 1180, UH = 820, BEZ = 22;
// Liquid Atelier
const OBS = '#0E0F10', GRAPH = '#46443F', ASH = '#8C8880', TRAV = '#D8D1C5', PORC = '#F6F4EF', ULTRA = '#2436E8';
const EDGE_LIGHT = 'linear-gradient(135deg,#fff,rgba(0,0,0,.04) 55%,rgba(0,0,0,.22))';
const SHADOW_S = '2px 4px 12px rgba(13,13,15,.10)';

// a number counting the way iOS changes one: the old goes up into a blur,
// the new comes up out of one
const Num: React.FC<{ from: number; to: number; q: number }> = ({ from, to, q }) => (
  <span style={{ position: 'relative', display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom' }}>
    <span style={{ visibility: 'hidden' }}>{Math.max(from, to)}</span>
    {q < 1 && <span style={{ position: 'absolute', left: 0, top: 0, opacity: 1 - q, transform: `translateY(${-q * 55}%)`, filter: q > 0.01 ? `blur(${q * 4}px)` : undefined }}>{from}</span>}
    {q > 0 && <span style={{ position: 'absolute', left: 0, top: 0, opacity: q, transform: `translateY(${(1 - q) * 55}%)`, filter: q < 0.99 ? `blur(${(1 - q) * 4}px)` : undefined }}>{to}</span>}
  </span>
);

// status by shape: ring = waiting, filled = done
const Shape: React.FC<{ done: number; s?: number }> = ({ done, s = 11 }) => (
  <svg width={s} height={s} viewBox="0 0 12 12" style={{ flex: 'none' }}>
    <circle cx="6" cy="6" r="4.6" fill="none" stroke={OBS} strokeWidth="1.6" />
    <circle cx="6" cy="6" r={4.6 * done} fill={OBS} />
  </svg>
);

// a ledger row, compact: id and status over the order and its time
const ROW_H = 74;
const Row: React.FC<{ id: string; what: string; at: string; status: string; done: number; sel?: number; press?: number }> = ({ id, what, at, status, done, sel = 0, press = 0 }) => (
  <div style={{ position: 'relative', height: ROW_H - 6, borderRadius: 16, padding: '13px 18px 0 30px', boxSizing: 'border-box',
    background: `rgba(233,229,221,${sel})`, borderBottom: sel > 0.5 ? 'none' : `1px solid ${TRAV}`, transform: `scale(${1 - 0.015 * press})` }}>
    <i style={{ position: 'absolute', left: 12, top: 18, width: 6, height: 6, borderRadius: '50%', background: ULTRA, opacity: sel }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, font: `400 14px/1 ${MONO}`, color: GRAPH }}>
      <span>{id}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, font: `500 14px/1 ${SANS}`, color: OBS }}><Shape done={done} s={10} />{status}</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 10 }}>
      <span style={{ font: `500 19px/1 ${SANS}`, color: OBS, letterSpacing: -0.2 }}>{what}</span>
      <span style={{ marginLeft: 'auto', font: `400 15px/1 ${MONO}`, color: GRAPH }}>{at}</span>
    </div>
  </div>
);

// a finger on the glass
const Tap: React.FC<{ x: number; y: number; q: number }> = ({ x, y, q }) => q <= 0 || q >= 1 ? null : (
  <i style={{ position: 'absolute', left: x - 30, top: y - 30, width: 60, height: 60, borderRadius: '50%', background: 'rgba(14,15,16,.12)', zIndex: 6,
    transform: `scale(${mix(0.5, 1.25, out3(q))})`, opacity: q < 0.25 ? q / 0.25 : 1 - (q - 0.25) / 0.75 }} />
);

// LA31 Control / Segmented, Regular, with the glass lens that magnifies
// the label under it as it travels
const SEG = ['Modtaget', 'Tilberedes', 'Klar'];
const SEG_W = 440, SEG_H = 48, SEG_I = 4;
const Segmented: React.FC<{ pos: number; travel: number }> = ({ pos, travel }) => {
  const cw = (SEG_W - 2 * SEG_I) / 3, mag = 1 + 0.09 * travel;
  return (
    <div style={{ position: 'relative', width: SEG_W, height: SEG_H, borderRadius: SEG_H / 2, background: TRAV }}>
      {/* the lens */}
      <div style={{ position: 'absolute', left: SEG_I + pos * cw, top: SEG_I, width: cw, height: SEG_H - 2 * SEG_I, borderRadius: (SEG_H - 2 * SEG_I) / 2,
        background: 'rgba(255,255,255,.55)', boxShadow: `${SHADOW_S}, inset 0 1px 0 rgba(255,255,255,.9)`, transform: `scale(${mag})` }}>
        <i style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', padding: 1, background: EDGE_LIGHT,
          WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' } as React.CSSProperties} />
      </div>
      {SEG.map((l, i) => {
        const near = clamp(1 - Math.abs(pos - i)); // the label under the lens is magnified with it
        return <span key={l} style={{ position: 'absolute', left: SEG_I + i * cw, top: 0, width: cw, height: SEG_H, display: 'grid', placeItems: 'center',
          font: `500 15px/1 ${SANS}`, color: near > 0.5 ? OBS : GRAPH, transform: `scale(${1 + (mag - 1) * near})` }}>{l}</span>;
      })}
    </div>
  );
};

export const TileSys: React.FC = () => {
  useFonts();
  const { t, sp } = useT();

  // the beats
  const NEW = 0.75, OPEN = 1.75, COOK = 3.0, READY = 4.4;
  const arrive = sp(NEW, 18, 170);
  const count = out3(seg(t, NEW + 0.15, NEW + 0.75));
  const press = Math.sin(Math.PI * seg(t, OPEN - 0.1, OPEN + 0.08));
  const sel = out3(seg(t, OPEN, OPEN + 0.18));
  const pan = sp(OPEN + 0.1, 22, 95);
  const detail = seg(t, OPEN + 0.35, OPEN + 0.7);
  // the lens travels, 220 ms in the system's own ease, magnifying as it goes
  const lensAt = (a: number) => seg(t, a, a + 0.26);
  const ease = (x: number) => 1 - Math.pow(1 - x, 3);
  const pos = ease(lensAt(COOK)) + ease(lensAt(READY));
  const travel = Math.sin(Math.PI * lensAt(COOK)) + Math.sin(Math.PI * lensAt(READY));
  const done = out3(seg(t, READY + 0.1, READY + 0.4));
  const told = seg(t, READY + 0.45, READY + 0.8);

  // the camera: inside the screen all the way; it never shows the iPad's edge
  const k = 1.6 + 0.03 * io3(seg(t, 0, SYS_S));
  const fx = mix(BEZ + 248, BEZ + 760, pan), fy = BEZ + UH / 2 - 30;

  const rows: [string, string, string, string, number][] = [
    ['#0213', 'Mørbradgryde med ris × 2', '17.15', 'Tilberedes', 0],
    ['#0212', 'Dagens suppe × 1', '17.10', 'Tilberedes', 0],
    ['#0211', 'Mørbradgryde med ris × 2', '17.00', 'Klar', 1],
    ['#0210', 'Kartoffelsalat × 1', '16.50', 'Hentet', 1],
  ];
  const LX = 24, LY = 516;
  const status214 = t < COOK + 0.13 ? 'Ny · spiis.dk' : t < READY + 0.13 ? 'Tilberedes' : 'Klar';

  const screen = (
    <div style={{ position: 'absolute', left: BEZ, top: BEZ, width: UW, height: UH, borderRadius: 30, overflow: 'hidden', background: PORC, fontFamily: SANS }}>
      {/* ---------- left: the evening, and its orders ---------- */}
      <div style={{ position: 'absolute', left: LX, top: 358, width: 446 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, font: `400 12px/1 ${MONO}`, letterSpacing: 0.6, color: GRAPH }}>
          <Img src={staticFile('ny/media/ic/spiis.svg')} style={{ width: 18, height: 18, borderRadius: 5 }} />SPIIS KØKKEN
          <i style={{ width: 6, height: 6, borderRadius: '50%', background: ULTRA, marginLeft: 4 }} />LIVE · BESTILLINGER I AFTEN</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginTop: 10 }}>
          <span style={{ font: `400 88px/0.9 ${SANS}`, letterSpacing: -3, color: OBS }}><Num from={23} to={24} q={count} /></span>
          <span style={{ font: `400 13px/1.5 ${MONO}`, color: GRAPH, paddingBottom: 8 }}>stk.<br />0 kr i kommission</span>
          {/* the hairline field, its last point now */}
          <svg width="150" height="60" viewBox="0 0 150 60" style={{ marginLeft: 'auto', marginBottom: 6, overflow: 'visible' }}>
            <path d="M0 52 L12 48 L22 50 L34 41 L46 44 L58 35 L70 37 L82 28 L94 31 L106 22 L118 24 L130 15" fill="none" stroke={OBS} strokeWidth="1.2" />
            <path d={`M130 15 L${mix(130, 142, count)} ${mix(15, 8, count)}`} fill="none" stroke={OBS} strokeWidth="1.2" />
            <line x1="0" y1="59.5" x2="150" y2="59.5" stroke={TRAV} />
            <circle cx={mix(130, 142, count)} cy={mix(15, 8, count)} r="4" fill={ULTRA} />
          </svg>
        </div>
      </div>
      <div style={{ position: 'absolute', left: LX, top: LY, width: 446 }}>
        {/* the new order comes in at the top; the others make room */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, opacity: clamp(arrive * 1.5), transform: `translateY(${-24 * (1 - arrive)}px)`, zIndex: 2 }}>
          <Row id="#0214" what="Mørbradgryde med ris × 3" at="17.30" status={status214} done={done} sel={Math.max(sel, 0)} press={press} />
        </div>
        {rows.map(([id, what, at, st, d], i) => (
          <div key={id} style={{ position: 'absolute', left: 0, right: 0, top: (i + arrive) * ROW_H }}>
            <Row id={id} what={what} at={at} status={st} done={d} />
          </div>
        ))}
      </div>
      <Tap x={LX + 220} y={LY + 34} q={seg(t, OPEN - 0.14, OPEN + 0.24)} />

      {/* ---------- right: the order, opened ---------- */}
      <div style={{ position: 'absolute', left: 540, top: 358, width: 440, opacity: detail, transform: `translateY(${16 * (1 - out3(detail))}px)`,
        filter: detail < 0.99 ? `blur(${(1 - detail) * 6}px)` : undefined }}>
        <div style={{ font: `400 12px/1 ${MONO}`, letterSpacing: 0.6, color: GRAPH }}>#0214 · AFHENTNING 17.30 · SPIIS.DK</div>
        <div style={{ marginTop: 14, font: `500 34px/1.08 ${SANS}`, letterSpacing: -1, color: OBS }}>Mørbradgryde med ris × 3</div>
        <div style={{ marginTop: 8, font: `400 18px/1.3 ${SANS}`, color: GRAPH }}>Rødgrød med fløde × 1 · betalt online</div>
        <div style={{ marginTop: 34 }}><Segmented pos={pos} travel={travel} /></div>
        {/* what the system does about it, said with a shape and words */}
        <div style={{ position: 'relative', marginTop: 26, height: 24 }}>
          {([
            [t < READY + 0.4 ? 1 - seg(t, READY + 0.25, READY + 0.4) : 0, 0, t < COOK ? 'Venter på køkkenet' : 'Køkkenet er i gang · ca. 12 min'],
            [told, 1, 'Klar · gæsten har fået en sms 17.24'],
          ] as [number, number, string][]).map(([o, d, txt]) => (
            <span key={txt} style={{ position: 'absolute', left: 0, top: 0, display: 'flex', alignItems: 'center', gap: 10, font: `500 17px/1 ${SANS}`, color: OBS, whiteSpace: 'nowrap',
              opacity: o, transform: `translateY(${(1 - o) * 8}px)` }}><Shape done={d} s={12} />{txt}</span>
          ))}
        </div>
        <div style={{ marginTop: 30, paddingTop: 18, borderTop: `1px solid ${TRAV}`, display: 'flex', gap: 40 }}>
          {[['KOMMISSION', '0 kr'], ['BETALT', '289 kr'], ['KANAL', 'spiis.dk']].map(([l, v]) => (
            <span key={l} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ font: `400 11px/1 ${MONO}`, letterSpacing: 0.6, color: ASH }}>{l}</span>
              <span style={{ font: `500 20px/1 ${SANS}`, color: OBS }}>{v}</span>
            </span>
          ))}
        </div>
      </div>
      <Tap x={540 + 1.5 * (SEG_W / 3)} y={358 + 160 + 34 + 24} q={seg(t, COOK - 0.14, COOK + 0.2)} />
      <Tap x={540 + 2.5 * (SEG_W / 3)} y={358 + 160 + 34 + 24} q={seg(t, READY - 0.14, READY + 0.2)} />

    </div>
  );

  return (
    <AbsoluteFill style={{ background: PORC, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: UW + 2 * BEZ, height: UH + 2 * BEZ, transformOrigin: '0 0', background: PORC,
        transform: `translate(420px, 700px) scale(${k}) translate(${-fx}px, ${-fy}px)` }}>
        {screen}
      </div>
    </AbsoluteFill>
  );
};
