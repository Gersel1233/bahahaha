/* Why Lesreg, the money: orders come in on the lock screen from the
   business's own site, one after another; then the day's payout comes up,
   order by order, and the line for the platform's commission says 0,00.
   An example, under no client's name. */
import React from 'react';
import { Img, staticFile } from 'remotion';
import { useT, useFonts, seg, out3, out5, mix, clamp, IOS, StatusBar } from './common';
import { Stage, WHY_W, OBS, PORC, ULTRA, GRAPH, ASH, TRAV, LIME } from './WhyPris';

export const PENGE_S = 7.2;

const PW = 840, PX = (WHY_W - PW) / 2, PY = 150, PH = PW * 2336 / 1120;
const SX = PX + PW * 0.0537, SY = PY + PH * 0.024, SW = PW * 0.8917, SHh = PH * 0.952;
const pt = SW / 402;
const P = (n: number) => n * pt;
const NAVY9 = '#05080F', NAVY8 = '#101A33', DEEP = '#2B3F7C';
const CH = "'Chivo', sans-serif", FM = "'Fragment Mono', monospace";

const ORDERS: [string, string, number][] = [
  ['2 × brunch', 'afhentning 10.30', 485],
  ['Kaffe og kage', 'afhentning 10.45', 320],
  ['Bestilling til 6', 'afhentning 12.00', 1150],
];
const kr = (n: number) => n.toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const ARR = [0.55, 1.2, 1.85];

export const WhyPenge: React.FC = () => {
  useFonts();
  const { t, sp } = useT();
  const phone = out5(seg(t, 0, 0.6));
  const land = ARR.map(a => sp(a, 18, 200, 0.85));
  // the payout: a sheet from the bottom, the sum counting up as its lines come
  const SHEET = 2.95;
  const sheet = sp(SHEET, 22, 170, 1);
  const rows = ORDERS.map((_, i) => out3(seg(t, SHEET + 0.45 + i * 0.16, SHEET + 0.8 + i * 0.16)));
  const sum = ORDERS.reduce((a, [, , v], i) => a + v * rows[i], 0);
  const COM = SHEET + 1.35;
  const com = out3(seg(t, COM, COM + 0.35));
  const comSel = out3(seg(t, COM + 0.35, COM + 0.7));
  const toYou = out3(seg(t, COM + 0.7, COM + 1.05));
  const dim = seg(sheet, 0, 1) * 0.35;

  return (
    <Stage>
      <div style={{ position: 'absolute', inset: 0, opacity: phone, transform: `translateY(${(1 - phone) * 90}px)` }}>
        <div style={{ position: 'absolute', left: SX, top: SY, width: SW, height: SHh, borderRadius: '13% / 6.2%', overflow: 'hidden', fontFamily: IOS,
          background: `radial-gradient(130% 70% at 50% 0%, #3A55A8 0%, ${DEEP} 18%, ${NAVY8} 52%, ${NAVY9} 100%)` }}>
          <StatusBar color="#fff" />
          {/* ---------- the lock screen ---------- */}
          <svg style={{ position: 'absolute', left: P(201 - 9.5), top: P(57) }} width={P(19)} height={P(19)} viewBox="0 0 24 24">
            <rect x="5" y="10.5" width="14" height="10" rx="2.6" fill="#fff" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="#fff" strokeWidth="2.2" />
          </svg>
          <div style={{ position: 'absolute', top: P(80), left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,.88)', font: `600 ${P(18.5)}px/1 ${IOS}` }}>Lørdag 19. december</div>
          <div style={{ position: 'absolute', top: P(100), left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,.96)', font: `700 ${P(96)}px/1 ${IOS}`, letterSpacing: P(-3.5) }}>9:41</div>
          {/* the orders, newest on top, the ones before moving down for it */}
          {ORDERS.map(([what, when, v], i) => {
            const q = land[i];
            if (t < ARR[i] - 0.05) return null;
            const after = land.slice(i + 1).reduce((a, b) => a + b, 0);
            return (
              <div key={i} style={{ position: 'absolute', left: P(14), right: P(14), top: P(244) + after * P(84) + (1 - q) * P(40), height: P(74), borderRadius: P(24),
                display: 'flex', alignItems: 'center', gap: P(12), padding: `0 ${P(14)}px`, color: '#fff', opacity: clamp(q * 1.4), transform: `scale(${mix(0.92, 1, q)})`,
                background: 'linear-gradient(160deg, rgba(255,255,255,.27), rgba(255,255,255,.13))', boxShadow: `inset 0 ${P(0.8)}px 0 rgba(255,255,255,.4), 0 ${P(10)}px ${P(28)}px rgba(0,0,0,.2)` }}>
                <Img src={staticFile('ny/media/ic/jeres.svg')} style={{ width: P(38), height: P(38), borderRadius: P(9), flex: 'none' }} />
                <span style={{ display: 'flex', flexDirection: 'column', gap: P(3), flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'flex', justifyContent: 'space-between', font: `600 ${P(15)}px/1.15 ${IOS}` }}>Ny bestilling · {v.toLocaleString('da-DK')} kr.<span style={{ font: `400 ${P(12)}px/1.4 ${IOS}`, color: 'rgba(255,255,255,.6)' }}>nu</span></span>
                  <span style={{ font: `400 ${P(14)}px/1.2 ${IOS}`, color: 'rgba(255,255,255,.8)' }}>{what} · {when}</span>
                </span>
              </div>
            );
          })}
          <div style={{ position: 'absolute', inset: 0, background: '#000', opacity: dim }} />

          {/* ---------- the day's payout, in the business's own app ---------- */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: P(196) + (1 - sheet) * P(700), bottom: 0, borderRadius: `${P(38)}px ${P(38)}px 0 0`, background: PORC, color: OBS,
            padding: `${P(10)}px ${P(22)}px 0`, boxShadow: `0 -${P(10)}px ${P(40)}px rgba(0,0,0,.25)` }}>
            <div style={{ width: P(36), height: P(5), borderRadius: P(3), background: 'rgba(60,60,67,.3)', margin: '0 auto' }} />
            <div style={{ marginTop: P(22), font: `600 ${P(11)}px/${P(14)}px ${CH}`, letterSpacing: P(0.66), color: ASH }}>UDBETALING · I DAG</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', marginTop: P(8) }}>
              <span style={{ font: `300 ${P(58)}px/${P(58)}px ${CH}`, letterSpacing: P(-2.8), fontVariantNumeric: 'tabular-nums' }}>{kr(sum)}</span>
              <span style={{ margin: `${P(12)}px 0 0 ${P(8)}px`, font: `400 ${P(11.5)}px/1 ${FM}`, color: GRAPH }}>kr.</span>
            </div>
            <div style={{ marginTop: P(18) }}>
              {ORDERS.map(([what, , v], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: P(12), height: P(44), padding: `0 ${P(4)}px`, borderBottom: `1px solid ${TRAV}`, opacity: rows[i], transform: `translateY(${(1 - rows[i]) * P(8)}px)` }}>
                  <span style={{ width: P(46), font: `400 ${P(11.5)}px/1 ${FM}`, color: GRAPH }}>#{1042 + i}</span>
                  <span style={{ flex: 1, font: `400 ${P(14)}px/1 ${CH}` }}>{what}</span>
                  <i style={{ width: P(8), height: P(8), borderRadius: '50%', background: OBS }} />
                  <span style={{ width: P(80), textAlign: 'right', font: `400 ${P(11.5)}px/1 ${FM}` }}>{kr(v)}</span>
                </div>
              ))}
              {/* the platform's commission: none, marked as the line that matters */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: P(12), height: P(48), marginTop: P(10), padding: `0 ${P(4)}px`, opacity: com }}>
                <i style={{ position: 'absolute', inset: `0 ${P(-12)}px`, borderRadius: P(12), background: LIME, opacity: comSel }} />
                <i style={{ position: 'absolute', left: P(-6), top: '50%', width: P(6), height: P(6), marginTop: P(-3), borderRadius: '50%', background: ULTRA, opacity: comSel }} />
                <span style={{ position: 'relative', flex: 1, font: `500 ${P(14)}px/1 ${CH}` }}>Kommission til platform</span>
                <span style={{ position: 'relative', width: P(80), textAlign: 'right', font: `400 ${P(11.5)}px/1 ${FM}` }}>0,00</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: P(16), padding: `0 ${P(4)}px`, opacity: toYou, transform: `translateY(${(1 - toYou) * P(8)}px)` }}>
                <span style={{ font: `500 ${P(17)}px/1 ${CH}` }}>Til jer</span>
                <span style={{ font: `500 ${P(17)}px/1 ${CH}`, fontVariantNumeric: 'tabular-nums' }}>{kr(1955)} kr.</span>
              </div>
            </div>
          </div>
        </div>
        <Img src={staticFile('ny/media/dev/iphone-17-pro-2x.webp')} style={{ position: 'absolute', left: PX, top: PY, width: PW, height: PH }} />
      </div>
    </Stage>
  );
};
