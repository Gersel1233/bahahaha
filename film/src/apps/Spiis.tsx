/* Spiis: a guest orders three of the day's dish for half past five and
   pays; the order flies into the kitchen, where the count of the dish goes
   from 14 to 17 and the new order is started. */
import React from 'react';
import { AbsoluteFill, staticFile } from 'remotion';
import { u, box, useT, useFonts, seg, out3, out5, io3, mix, clamp, StatusBar, Tap, Check, SANS, SERIF, MONO, SH } from './common';

export const SPIIS_S = 6.6;

const CREAM = '#F4EFE7', INK = '#1E1915', MUTE = '#8A7F74', ORANGE = '#D9692E', GREEN = '#2F9E5B';
const KITCHEN = '#15110E', CARD = '#221B16', CARD2 = '#2B231D', LIGHT = '#F4EFE7';

const Num: React.FC<{ a: number; b: number; p: number; size: number; color: string; weight?: number }> = ({ a, b, p, size, color, weight = 600 }) => (
  // one number rolls up and the next takes its place
  <span style={{ position: 'relative', display: 'inline-block', height: u(size * 1.1), overflow: 'hidden', verticalAlign: 'bottom', font: `${weight} ${u(size)}px/1.1 ${SANS}`, color }}>
    <span style={{ display: 'block', transform: `translateY(${-100 * out3(p)}%)` }}>{a}</span>
    <span style={{ position: 'absolute', left: 0, top: 0, transform: `translateY(${100 - 100 * out3(p)}%)` }}>{b}</span>
  </span>
);

export const Spiis: React.FC = () => {
  useFonts();
  const { t, sp } = useT();

  /* ---------- the guest ---------- */
  const enter = (i: number) => { const q = out5(seg(t, 0.05 + i * 0.07, 0.65 + i * 0.07)); return { opacity: q, transform: `translateY(${u(24 * (1 - q))}px)` }; };
  const n1 = seg(t, 0.82, 1.0), n2 = seg(t, 1.17, 1.35);
  const chip = out3(seg(t, 1.55, 1.75));
  const press = t > 2.0 && t < 2.18 ? 0.965 : 1;
  const done = out3(seg(t, 2.15, 2.5));
  // the guest's screen goes back as the kitchen comes forward
  const away = io3(seg(t, 2.85, 3.45));
  const kitchenIn = io3(seg(t, 2.95, 3.5));

  /* ---------- the kitchen ---------- */
  const land = sp(3.45, 16, 140);
  const tick = seg(t, 3.75, 4.05), dish = seg(t, 3.8, 4.4);
  const started = out3(seg(t, 5.25, 5.55));
  const glow = 1 - seg(t, 5.3, 6.0);

  const statusColor = t < 3.1 ? INK : LIGHT;
  const orders = [
    { at: '17.00', what: '2 × Mørbradgryde med ris', st: 'I gang', c: ORANGE },
    { at: '17.15', what: '4 × Mørbradgryde · 1 × Spiis-brød', st: 'Klar', c: GREEN },
    { at: '18.00', what: '1 × Mørbradgryde med ris', st: 'Ny', c: '#B9AFA4' },
  ];

  return (
    <AbsoluteFill style={{ background: KITCHEN, overflow: 'hidden', fontFamily: SANS }}>
      {/* ---------- the kitchen, under ---------- */}
      <AbsoluteFill style={{ opacity: kitchenIn, transform: `scale(${mix(1.06, 1, kitchenIn)})` }}>
        <div style={{ ...box(20, 74), color: LIGHT }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: u(8), font: `400 ${u(12)}px/1 ${MONO}`, color: '#A89B8E', letterSpacing: u(0.4) }}><svg width={u(18)} height={u(18)} viewBox="30 36 60 58"><path d="M38 74c-11 0-15-16-4-20-1-12 13-19 22-12 6-9 22-8 26 3 12-2 18 14 8 22-2 1-4 2-6 2z" fill="none" stroke="#A89B8E" strokeWidth="5" strokeLinejoin="round" /><rect x="38" y="74" width="46" height="16" rx="3" fill="none" stroke="#A89B8E" strokeWidth="5" /><circle cx="51" cy="82" r="3" fill="#A89B8E" /><circle cx="61" cy="82" r="3" fill="#A89B8E" /><circle cx="71" cy="82" r="3" fill="#A89B8E" /></svg>SPIIS · KØKKENET</div>
          <div style={{ font: `600 ${u(32)}px/1.1 ${SANS}`, letterSpacing: u(-1), marginTop: u(8) }}>I dag</div>
        </div>
        <div style={{ ...box(20, 150, 175, 96), background: CARD, borderRadius: u(20), padding: u(16), color: LIGHT }}>
          <div style={{ font: `500 ${u(13)}px/1 ${SANS}`, color: '#A89B8E' }}>Bestillinger</div>
          <div style={{ marginTop: u(14) }}><Num a={6} b={7} p={tick} size={34} color={LIGHT} /></div>
        </div>
        <div style={{ ...box(207, 150, 175, 96), background: CARD, borderRadius: u(20), padding: u(16), color: LIGHT, boxShadow: `inset 0 0 0 ${u(1.5)}px rgba(217,105,46,${0.6 * dish * glow})` }}>
          <div style={{ font: `500 ${u(13)}px/1 ${SANS}`, color: '#A89B8E' }}>Mørbradgryde</div>
          <div style={{ marginTop: u(14), display: 'flex', alignItems: 'baseline', gap: u(6) }}>
            <span style={{ font: `600 ${u(34)}px/1.1 ${SANS}`, color: dish > 0 ? ORANGE : LIGHT }}>{Math.round(mix(14, 17, out3(dish)))}</span>
            <span style={{ font: `500 ${u(14)}px/1 ${SANS}`, color: '#A89B8E' }}>portioner</span>
          </div>
        </div>
        <div style={{ ...box(20, 272), font: `400 ${u(12)}px/1 ${MONO}`, color: '#A89B8E', letterSpacing: u(0.4) }}>TIL AFHENTNING</div>
        {/* the orders already in; they step down for the new one */}
        {orders.map((o, i) => (
          <div key={o.at} style={{ ...box(20, 296 + (i + land) * 104, 362, 92), background: CARD, borderRadius: u(20), padding: `${u(16)}px ${u(18)}px`, color: LIGHT, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ font: `600 ${u(20)}px/1 ${SANS}` }}>kl. {o.at}</span>
              <span style={{ font: `600 ${u(12)}px/1 ${SANS}`, color: o.c, padding: `${u(6)}px ${u(10)}px`, borderRadius: u(20), background: 'rgba(255,255,255,.06)' }}>{o.st}</span>
            </div>
            <span style={{ font: `400 ${u(15)}px/1.2 ${SANS}`, color: '#CFC5BA' }}>{o.what}</span>
          </div>
        ))}
        {/* the new one, landing from where the guest pressed */}
        {t > 3.2 && (
          <div style={{ ...box(20, 296, 362, 92), background: CARD2, borderRadius: u(20), padding: `${u(16)}px ${u(18)}px`, color: LIGHT,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 5,
            transform: `translateY(${u(mix(420, 0, land))}px) scale(${mix(1.25, 1, land)})`, opacity: clamp(land * 2),
            boxShadow: `0 0 0 ${u(1.5)}px rgba(217,105,46,${0.9 * glow}), 0 ${u(10)}px ${u(40)}px rgba(217,105,46,${0.35 * glow})` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: u(10) }}>
                <span style={{ font: `600 ${u(11)}px/1 ${SANS}`, color: '#fff', background: ORANGE, padding: `${u(5)}px ${u(8)}px`, borderRadius: u(6), letterSpacing: u(0.5), opacity: 1 - started }}>NY</span>
                <span style={{ font: `600 ${u(20)}px/1 ${SANS}` }}>kl. 17.30</span>
              </span>
              <span style={{ position: 'relative', font: `600 ${u(12)}px/1 ${SANS}`, padding: `${u(6)}px ${u(10)}px`, borderRadius: u(20), background: 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', gap: u(4) }}>
                <span style={{ color: GREEN, opacity: 1 - started, display: 'flex', alignItems: 'center', gap: u(4) }}><Check p={1} size={12} color={GREEN} width={3} />Betalt</span>
                <span style={{ position: 'absolute', right: u(10), color: ORANGE, opacity: started }}>I gang</span>
              </span>
            </div>
            <span style={{ font: `400 ${u(15)}px/1.2 ${SANS}`, color: '#E7DDD2' }}>3 × Mørbradgryde med ris</span>
          </div>
        )}
      </AbsoluteFill>

      {/* ---------- the guest, over ---------- */}
      {away < 1 && (
        <AbsoluteFill style={{ background: CREAM, transformOrigin: '50% 40%', borderRadius: u(mix(0, 44, away)),
          transform: `translateY(${u(-60 * away)}px) scale(${mix(1, 0.72, away)})`, opacity: 1 - seg(t, 3.15, 3.45) }}>
          <div style={{ ...box(20, 70, 362, 30), display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...enter(0) }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: u(8), font: `600 ${u(24)}px/1 ${SANS}`, color: INK, letterSpacing: u(-0.6) }}><svg width={u(26)} height={u(26)} viewBox="30 36 60 58"><path d="M38 74c-11 0-15-16-4-20-1-12 13-19 22-12 6-9 22-8 26 3 12-2 18 14 8 22-2 1-4 2-6 2z" fill="none" stroke="#1E1915" strokeWidth="5" strokeLinejoin="round" /><rect x="38" y="74" width="46" height="16" rx="3" fill="none" stroke="#1E1915" strokeWidth="5" /><circle cx="51" cy="82" r="3" fill="#1E1915" /><circle cx="61" cy="82" r="3" fill="#1E1915" /><circle cx="71" cy="82" r="3" fill="#1E1915" /></svg>Spiis</span>
            <span style={{ font: `600 ${u(12)}px/1 ${SANS}`, color: ORANGE, background: 'rgba(217,105,46,.12)', padding: `${u(7)}px ${u(12)}px`, borderRadius: u(20) }}>Dagens ret</span>
          </div>
          <div style={{ ...box(20, 116, 362, 236), borderRadius: u(26), overflow: 'hidden', ...enter(1) }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${staticFile('film/assets/dish.webp')})`, backgroundSize: 'cover',
              backgroundPosition: '62% 55%', transform: `scale(${mix(1.08, 1.0, out3(seg(t, 0, 3)))})` }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(rgba(0,0,0,0) 60%, rgba(0,0,0,.18))' }} />
          </div>
          <div style={{ ...box(20, 372, 362), ...enter(2) }}>
            <div style={{ font: `400 ${u(12)}px/1 ${MONO}`, color: ORANGE, letterSpacing: u(0.4) }}>HJEMMELAVET · TIL AFHENTNING</div>
            <div style={{ font: `600 ${u(30)}px/1.1 ${SANS}`, color: INK, letterSpacing: u(-0.9), marginTop: u(10) }}>Mørbradgryde <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 300 }}>med ris</span></div>
          </div>
          {/* how many */}
          <div style={{ ...box(20, 470, 362, 60), display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `${u(1)}px solid rgba(30,25,21,.1)`, ...enter(3) }}>
            <span style={{ font: `500 ${u(17)}px/1 ${SANS}`, color: INK }}>Antal</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: u(18), background: '#fff', borderRadius: u(24), padding: `${u(6)}px ${u(8)}px`, boxShadow: `0 ${u(1)}px ${u(3)}px rgba(0,0,0,.08)` }}>
              <span style={{ width: u(32), height: u(32), borderRadius: '50%', display: 'grid', placeItems: 'center', color: MUTE, font: `500 ${u(22)}px/1 ${SANS}` }}>–</span>
              <span style={{ width: u(18), textAlign: 'center' }}>{n2 > 0 ? <Num a={2} b={3} p={n2} size={20} color={INK} /> : <Num a={1} b={2} p={n1} size={20} color={INK} />}</span>
              <span style={{ width: u(32), height: u(32), borderRadius: '50%', display: 'grid', placeItems: 'center', color: '#fff', background: ORANGE, font: `500 ${u(22)}px/1 ${SANS}` }}>+</span>
            </span>
          </div>
          {/* when */}
          <div style={{ ...box(20, 540, 362), ...enter(4) }}>
            <div style={{ font: `500 ${u(17)}px/1 ${SANS}`, color: INK }}>Afhentning i dag</div>
            <div style={{ display: 'flex', gap: u(10), marginTop: u(14) }}>
              {['17.00', '17.30', '18.00'].map(c => {
                const on = c === '17.30' ? chip : 0;
                return <span key={c} style={{ flex: 1, textAlign: 'center', padding: `${u(13)}px 0`, borderRadius: u(16), font: `600 ${u(16)}px/1 ${SANS}`,
                  color: on > 0.5 ? '#fff' : INK, background: on > 0 ? `rgba(217,105,46,${on})` : '#fff', boxShadow: `inset 0 0 0 ${u(1)}px rgba(30,25,21,${0.1 * (1 - on)})` }}>{c}</span>;
              })}
            </div>
          </div>
          {/* what is being ordered, as it is chosen */}
          <div style={{ ...box(20, 650, 362, 56), display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `${u(1)}px solid rgba(30,25,21,.1)`, ...enter(5) }}>
            <span style={{ font: `400 ${u(15)}px/1.3 ${SANS}`, color: MUTE }}>Din bestilling</span>
            <span style={{ font: `600 ${u(15)}px/1.3 ${SANS}`, color: INK }}>{n2 >= 1 ? 3 : n1 >= 1 ? 2 : 1} × Mørbradgryde{chip > 0.5 ? ' · kl. 17.30' : ''}</span>
          </div>
          {/* order and pay: the button becomes the receipt */}
          <div style={{ ...box(20, SH - 104, 362, 62), borderRadius: u(31), background: done > 0 ? `rgb(${mix(217, 47, done)},${mix(105, 158, done)},${mix(46, 91, done)})` : ORANGE,
            transform: `scale(${press})`, display: 'grid', placeItems: 'center', color: '#fff', ...enter(5) }}>
            <span style={{ position: 'absolute', font: `600 ${u(18)}px/1 ${SANS}`, opacity: 1 - done }}>Bestil og betal</span>
            <span style={{ position: 'absolute', display: 'flex', alignItems: 'center', gap: u(8), font: `600 ${u(18)}px/1 ${SANS}`, opacity: done }}>
              <Check p={seg(t, 2.25, 2.6)} size={22} color="#fff" width={3} />Bestilt · kl. 17.30
            </span>
          </div>
          <Tap x={366} y={500} at={0.86} t={t} />
          <Tap x={366} y={500} at={1.21} t={t} />
          <Tap x={201} y={586} at={1.6} t={t} />
          <Tap x={250} y={SH - 73} at={2.04} t={t} />
        </AbsoluteFill>
      )}
      <StatusBar color={statusColor} />
    </AbsoluteFill>
  );
};
