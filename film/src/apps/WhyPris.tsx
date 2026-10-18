/* Why Lesreg, the price: the classic way's invoice, where the hours keep
   running and the total with them; then Lesreg's offer comes up over it,
   one fixed price agreed before the start, from DKK 50 an hour, and is
   agreed. An example, under no agency's name. */
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { useT, useFonts, seg, out3, out5, io3, mix, clamp, SANS, MONO } from './common';

export const WHY_W = 1080, WHY_H = 1350;
export const PRIS_S = 7.2;

export const NAVY9 = '#05080F', NAVY8 = '#101A33', DEEP = '#2B3F7C';
export const OBS = '#0E0F10', BASALT = '#232426', GRAPH = '#46443F', ASH = '#8C8880', TRAV = '#D8D1C5', LIME = '#E9E5DD', PORC = '#F6F4EF', ULTRA = '#2436E8';

// the stage every one of the three films stands on
export const Stage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ background: `radial-gradient(120% 70% at 50% 100%, ${DEEP}, ${NAVY8} 48%, ${NAVY9})`, overflow: 'hidden', fontFamily: SANS }}>
    <div style={{ position: 'absolute', left: 90, top: 200, width: 900, height: 900, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(70,100,200,.28), transparent)' }} />
    {children}
  </AbsoluteFill>
);

// Lesreg's mark, the folded corner
export const Mark: React.FC<{ s: number; c?: string; bg?: string }> = ({ s, c = PORC, bg = OBS }) => (
  <svg width={s} height={s} viewBox="0 0 128 128" style={{ display: 'block', flex: 'none' }}><path d="M0 0H94l34 34v94H0Z" fill={c} /><path d="M44 28h18v62h38v18H44Z" fill={bg} /></svg>
);

const kr = (n: number) => Math.round(n).toLocaleString('da-DK');
const RATE = 1000;
const ROWS: [string, number][] = [['Opstartsmøde', 3], ['Projektledelse', 8], ['Design', 16], ['Udvikling', 40], ['Møder om rettelser', 6], ['Rettelser', 12]];
const R0 = 0.75, STEP = 0.42;

export const WhyPris: React.FC = () => {
  useFonts();
  const { t, sp } = useT();

  // the invoice: up from below, then the hours run
  const inv = out5(seg(t, 0.05, 0.75));
  const arrived = ROWS.map((_, i) => out3(seg(t, R0 + i * STEP, R0 + i * STEP + 0.36)));
  // the meter never stops: what has landed, and the row under way creeping in
  const SETTLE = 3.9;
  const running = Math.min(t, SETTLE + 0.6);
  let hours = 0;
  ROWS.forEach(([, h], i) => {
    const a = R0 + i * STEP;
    hours += h * clamp((running - a) / STEP);
  });
  const total = hours * RATE;
  // the invoice steps back as the offer comes
  const back = io3(seg(t, SETTLE, SETTLE + 0.7));
  const offer = sp(SETTLE + 0.15, 20, 140);
  const lines = [0, 1, 2].map(i => out3(seg(t, SETTLE + 0.65 + i * 0.16, SETTLE + 1.0 + i * 0.16)));
  const price = out3(seg(t, SETTLE + 1.05, SETTLE + 1.6));
  const fifty = Math.round(50 * out3(seg(t, SETTLE + 1.05, SETTLE + 1.75)));
  // agreed: the button is pressed and says so
  const PRESS = 6.05;
  const press = Math.sin(Math.PI * seg(t, PRESS, PRESS + 0.22));
  const agreed = out3(seg(t, PRESS + 0.1, PRESS + 0.4));
  const tick = (t * 6) % 360; // the second hand of the meter

  const IX = 150, IY = 185, IW = 780;
  return (
    <Stage>
      {/* ---------- the classic invoice ---------- */}
      <div style={{ position: 'absolute', left: IX, top: IY, width: IW, borderRadius: 28, background: PORC, color: OBS, padding: '52px 56px 48px',
        boxShadow: '12px 24px 56px rgba(0,0,0,.35)', transformOrigin: '50% 0',
        opacity: inv * mix(1, 0.5, back), filter: back > 0.01 ? `blur(${back * 3}px) brightness(${mix(1, 0.7, back)})` : undefined,
        transform: `translateY(${(1 - inv) * 120 - back * 70}px) scale(${mix(1, 0.9, back)})` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ font: `400 20px/1 ${MONO}`, color: ASH, letterSpacing: 1 }}>FAKTURA</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 12, height: 48, padding: '0 20px 0 14px', borderRadius: 24, background: LIME, font: `400 20px/1 ${MONO}`, color: GRAPH }}>
            <svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke={GRAPH} strokeWidth="1.6" />
              <path d={`M12 12 L${12 + 7 * Math.sin(tick * Math.PI / 180)} ${12 - 7 * Math.cos(tick * Math.PI / 180)}`} stroke={GRAPH} strokeWidth="1.6" strokeLinecap="round" /></svg>
            {kr(RATE)} kr./t
          </span>
        </div>
        <div style={{ marginTop: 34, font: `500 54px/1 ${SANS}`, letterSpacing: -2 }}>Ny hjemmeside</div>
        <div style={{ marginTop: 14, font: `400 19px/1 ${MONO}`, color: ASH }}>Klassisk softwarehus · timer, der løber</div>
        <div style={{ marginTop: 34, borderTop: `1.5px solid ${TRAV}` }}>
          {ROWS.map(([d, h], i) => {
            const a = arrived[i];
            const got = clamp((running - (R0 + i * STEP)) / STEP);
            return (
              <div key={d} style={{ display: 'flex', alignItems: 'center', height: 70, borderBottom: `1.5px solid ${TRAV}`, opacity: a, transform: `translateY(${(1 - a) * 14}px)` }}>
                <span style={{ flex: 1, font: `400 27px/1 ${SANS}` }}>{d}</span>
                <span style={{ width: 120, textAlign: 'right', font: `400 22px/1 ${MONO}`, color: GRAPH }}>{Math.round(h * got)} t</span>
                <span style={{ width: 170, textAlign: 'right', font: `400 22px/1 ${MONO}` }}>{kr(h * got * RATE)}</span>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 34 }}>
          <div>
            <div style={{ font: `600 16px/1 ${SANS}`, letterSpacing: 1, color: ASH }}>I ALT · {Math.round(hours)} TIMER</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', marginTop: 10 }}>
              <span style={{ font: `300 104px/96px ${SANS}`, letterSpacing: -5, fontVariantNumeric: 'tabular-nums' }}>{kr(total)}</span>
              <span style={{ margin: '20px 0 0 14px', font: `400 20px/1 ${MONO}`, color: GRAPH }}>kr.</span>
            </div>
          </div>
          <span style={{ marginBottom: 12, font: `400 18px/1 ${MONO}`, color: ASH }}>og tælleren kører</span>
        </div>
      </div>

      {/* ---------- Lesreg's offer, over it ---------- */}
      <div style={{ position: "absolute", left: 110, top: 505, width: 860, borderRadius: 34, background: OBS, color: PORC, padding: '50px 56px 52px',
        boxShadow: `inset 0 1px 0 rgba(255,255,255,.14), inset 0 0 0 1px rgba(255,255,255,.08), 14px 28px 70px rgba(0,0,0,.55)`,
        opacity: clamp(offer * 1.4), transform: `translateY(${(1 - offer) * 520}px)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Mark s={40} c={PORC} bg={OBS} />
          <span style={{ font: `500 30px/1 ${SANS}`, letterSpacing: -0.6 }}>Lesreg</span>
          <span style={{ marginLeft: 'auto', font: `400 20px/1 ${MONO}`, color: ASH, letterSpacing: 1 }}>TILBUD</span>
        </div>
        <div style={{ marginTop: 40, font: `500 54px/1 ${SANS}`, letterSpacing: -2 }}>Ny hjemmeside</div>
        <div style={{ marginTop: 30 }}>
          {['Én fast pris, aftalt før start', 'Ingen timer, der løber', 'Rettelser på timer, ikke uger'].map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 18, height: 58, opacity: lines[i], transform: `translateX(${(1 - lines[i]) * 24}px)` }}>
              <svg width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="13.5" fill="none" stroke="rgba(246,244,239,.35)" strokeWidth="1.5" />
                <path d="M9 15.5l4 4 8-9" fill="none" stroke={PORC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="20" strokeDashoffset={20 * (1 - out3(seg(lines[i], 0.3, 1)))} /></svg>
              <span style={{ font: `400 28px/1 ${SANS}` }}>{s}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 30, borderTop: '1.5px solid rgba(255,255,255,.12)', paddingTop: 34, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ opacity: price }}>
            <div style={{ font: `600 16px/1 ${SANS}`, letterSpacing: 1, color: ASH }}>TIMEPRIS FRA</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', marginTop: 10 }}>
              <span style={{ font: `300 150px/132px ${SANS}`, letterSpacing: -7, fontVariantNumeric: 'tabular-nums' }}>{fifty}</span>
              <span style={{ margin: '28px 0 0 16px', font: `400 22px/1 ${MONO}`, color: TRAV }}>kr./t</span>
              <span style={{ margin: '32px 0 0 18px', width: 14, height: 14, borderRadius: '50%', background: ULTRA, boxShadow: `0 0 0 ${6 + 3 * Math.sin(t * 4)}px rgba(36,54,232,.28)`, opacity: seg(t, SETTLE + 1.6, SETTLE + 1.8) }} />
            </div>
          </div>
          {/* LA32 Button, primary on dark: a porcelain capsule and its lens */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, height: 76, padding: '0 6px 0 34px', borderRadius: 38, background: PORC, color: OBS,
            opacity: seg(t, SETTLE + 1.4, SETTLE + 1.7), transform: `scale(${1 - 0.04 * press})`, marginBottom: 14 }}>
            <span style={{ position: 'relative', display: 'block', width: 92, height: 26, font: `500 24px/26px ${SANS}` }}>
              <span style={{ position: 'absolute', left: 0, top: 0, opacity: 1 - agreed, transform: `translateY(${-agreed * 12}px)` }}>Aftal</span>
              <span style={{ position: 'absolute', left: 0, top: 0, opacity: agreed, transform: `translateY(${(1 - agreed) * 12}px)` }}>Aftalt</span>
            </span>
            <span style={{ width: 64, height: 64, borderRadius: '50%', display: 'grid', placeItems: 'center', background: agreed > 0.5 ? ULTRA : OBS }}>
              <svg width="28" height="28" viewBox="0 0 24 24">
                {agreed > 0.5
                  ? <path d="M5 12.5 10 17.5 19.5 7" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="24" strokeDashoffset={24 * (1 - out3(seg(t, PRESS + 0.2, PRESS + 0.5)))} />
                  : <path d="M4 12h14M13 6l6 6-6 6" fill="none" stroke={PORC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
              </svg>
            </span>
          </div>
        </div>
      </div>
    </Stage>
  );
};
