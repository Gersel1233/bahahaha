/* The Systems tile, as a story with its cause and its effect: at Spiis, a
   guest books a table on the phone and the restaurant's system shows it at
   once; then the guest pre-orders, and the order lands on the kitchen
   screen. The phone in front, the restaurant's MacBook behind. */
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { useT, useFonts, seg, out3, out5, io3, mix, clamp, Check, SANS, MONO, SERIF } from './common';
import { TW } from './TileApps';

export const SYS_S = 6.6;

const INK = '#1E1915', MUTE = '#8A7F74', LINE = 'rgba(30,25,21,.08)', ORANGE = '#D9692E', GREEN = '#2F9E5B', CREAM = '#F4EFE7';
// the MacBook, behind and to the right
const MW = 800, MX = 100, MY = 680, MH = MW * 938 / 1600;
const MSX = MX + MW * 0.1034, MSY = MY + MH * 0.0345, MSW = MW * 0.7942, MSH = MW * 938 / 1600 * 0.8553;
// the phone, in front and to the left
const PW = 300, PX = 28, PY = 820, PH = PW * 2336 / 1120;
const PSX = PX + PW * 0.0537, PSY = PY + PH * 0.024, PSW = PW * 0.8917, PSH = PH * 0.952;

const Num: React.FC<{ a: number; b: number; p: number; size: number; color?: string }> = ({ a, b, p, size, color = INK }) => (
  <span style={{ font: `600 ${size}px/1 ${SANS}`, color: p > 0 ? (p < 1 ? ORANGE : color) : color, fontVariantNumeric: 'tabular-nums', letterSpacing: -size * 0.03 }}>{Math.round(mix(a, b, out3(p)))}</span>
);

export const TileSys: React.FC = () => {
  useFonts();
  const { t, sp } = useT();
  // the story, in three lines
  const say = [[0.2, 1.5, 'Gæsten booker bord'], [1.5, 2.9, 'Restauranten ser det med det samme'], [2.9, 9, 'Bestillingen går lige til køkkenet']] as const;
  // the guest: book, then pre-order
  const book = t > 0.95 && t < 1.1 ? 0.96 : 1, booked = out3(seg(t, 1.05, 1.3));
  const toOrder = io3(seg(t, 2.5, 2.9));
  const pay = t > 3.35 && t < 3.5 ? 0.96 : 1, paid = out3(seg(t, 3.45, 3.7));
  // the light, from the phone to the MacBook
  const pulse = (a: number) => { const q = io3(seg(t, a, a + 0.5)); return q > 0 && q < 1 ? q : -1; };
  const p1 = pulse(1.3), p2 = pulse(3.7);
  // and what happens there
  const row = sp(1.8, 16, 150), guests = seg(t, 1.85, 2.3);
  const order = sp(4.2, 16, 150), dish = seg(t, 4.25, 4.7);
  const glow1 = 1 - seg(t, 2.6, 3.4), glow2 = 1 - seg(t, 5.4, 6.2);

  const from = { x: PSX + PSW * 0.75, y: PSY + PSH * 0.55 }, to1 = { x: MSX + MSW * 0.62, y: MSY + MSH * 0.42 }, to2 = { x: MSX + MSW * 0.62, y: MSY + MSH * 0.8 };
  const arc = (q: number, a: { x: number; y: number }, b: { x: number; y: number }) => ({ x: mix(a.x, b.x, q), y: mix(a.y, b.y, q) - Math.sin(Math.PI * q) * 120 });

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(175deg, #FFFFFF 0%, #F3EFE8 55%, #E9E3D8 100%)', fontFamily: SANS, overflow: 'hidden' }}>
      {/* the line that says what is happening */}
      <div style={{ position: 'absolute', left: 40, top: 556, height: 50 }}>
        {say.map(([a, b, s], i) => {
          const q = out5(seg(t, a + 0.05, a + 0.4)) * (1 - seg(t, b - 0.2, b));
          return <span key={i} style={{ position: 'absolute', left: 0, top: 0, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px 12px 14px', borderRadius: 26,
            background: '#fff', boxShadow: '0 10px 26px rgba(20,33,61,.1), inset 0 0 0 1px rgba(20,21,23,.06)', font: `500 23px/1 ${SANS}`, color: INK,
            opacity: q, transform: `translateY(${16 * (1 - q)}px)` }}>
            <i style={{ width: 26, height: 26, borderRadius: '50%', background: i === 0 ? INK : ORANGE, color: '#fff', display: 'grid', placeItems: 'center', font: `600 14px/1 ${SANS}`, fontStyle: 'normal' }}>{i + 1}</i>{s}</span>;
        })}
      </div>

      {/* ---------- the restaurant's MacBook ---------- */}
      <div style={{ position: 'absolute', left: MSX, top: MSY, width: MSW, height: MSH, background: CREAM, overflow: 'hidden', padding: '22px 26px 0 150px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', paddingRight: 10 }}>
          <span style={{ font: `600 30px/1 ${SANS}`, color: INK, letterSpacing: -0.8 }}>Spiis <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 300 }}>overblik</span></span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, font: `400 15px/1 ${MONO}`, color: GREEN }}><i style={{ width: 9, height: 9, borderRadius: '50%', background: GREEN }} />LIVE</span>
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 18 }}>
          {[['Gæster i aften', 32, 36, guests, glow1], ['Mørbradgryde', 14, 17, dish, glow2]].map(([l, a, b, p, g]) => (
            <div key={l as string} style={{ flex: 1, background: '#fff', borderRadius: 16, padding: '14px 16px', boxShadow: `inset 0 0 0 2px rgba(217,105,46,${0.8 * (p as number > 0 ? (g as number) : 0)})` }}>
              <div style={{ font: `500 16px/1 ${SANS}`, color: MUTE }}>{l}</div>
              <div style={{ marginTop: 10 }}><Num a={a as number} b={b as number} p={p as number} size={40} /></div>
            </div>
          ))}
        </div>
        {/* tonight's tables */}
        <div style={{ marginTop: 16, font: `400 13px/1 ${MONO}`, color: MUTE, letterSpacing: 1 }}>BORDE I AFTEN</div>
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[...(t > 1.8 ? [{ k: 'new', at: '19.00', n: '4 pers.', st: 'Ny', g: glow1, p: row }] : []), { k: 'a', at: '18.30', n: '2 pers.', st: 'Bekræftet', g: 0, p: 1 }, { k: 'b', at: '20.00', n: '6 pers.', st: 'Bekræftet', g: 0, p: 1 }].map(r => (
            <div key={r.k} style={{ display: 'flex', alignItems: 'center', gap: 14, height: 40 * clamp(r.p), overflow: 'hidden', padding: '0 14px', borderRadius: 12, opacity: clamp(r.p * 1.4),
              background: r.k === 'new' ? `rgba(217,105,46,${0.14 * r.g + 0.02})` : '#fff', boxShadow: r.k === 'new' ? `inset 0 0 0 2px rgba(217,105,46,${0.8 * r.g})` : 'none' }}>
              <span style={{ font: `600 19px/1 ${SANS}`, color: INK }}>{r.at}</span><span style={{ font: `400 17px/1 ${SANS}`, color: MUTE }}>{r.n}</span>
              <span style={{ marginLeft: 'auto', font: `600 14px/1 ${SANS}`, color: r.k === 'new' ? ORANGE : GREEN }}>{r.st}</span>
            </div>
          ))}
        </div>
      </div>
      {/* the kitchen screen, over the overview once the order is in */}
      <div style={{ position: 'absolute', left: MSX + 140, top: MSY + MSH * 0.6, width: MSW - 160, borderRadius: 18, padding: '16px 18px', background: '#1E1814', color: CREAM,
        boxShadow: `0 20px 40px rgba(0,0,0,.25), 0 0 0 2px rgba(217,105,46,${0.9 * glow2 * clamp(order)})`, opacity: clamp(order * 1.5), transform: `translateY(${60 * (1 - order)}px)` }}>
        <div style={{ font: `400 13px/1 ${MONO}`, color: '#A89B8E', letterSpacing: 1 }}>KØKKENET · NY BESTILLING</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 12 }}>
          <span style={{ font: `600 24px/1 ${SANS}` }}>17.30</span><span style={{ font: `400 19px/1 ${SANS}`, color: '#E7DDD2' }}>3 × Mørbradgryde</span>
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, font: `600 15px/1 ${SANS}`, color: '#5FD38A' }}><Check p={1} size={9} color="#5FD38A" width={3.2} />Betalt</span>
        </div>
      </div>
      <Img src={staticFile('ny/media/dev/macbook-pro-14.webp')} style={{ position: 'absolute', left: MX, top: MY, width: MW, height: MH }} />

      {/* ---------- the light between them ---------- */}
      {[[p1, to1], [p2, to2]].map(([q, b], i) => {
        if ((q as number) < 0) return null;
        const p = arc(q as number, from, b as { x: number; y: number });
        return <i key={i} style={{ position: 'absolute', left: p.x - 12, top: p.y - 12, width: 24, height: 24, borderRadius: '50%', background: '#fff', zIndex: 5,
          boxShadow: '0 0 0 8px rgba(217,105,46,.25), 0 0 40px 10px rgba(217,105,46,.6)' }} />;
      })}

      {/* ---------- the guest's phone ---------- */}
      <div style={{ position: 'absolute', left: PSX, top: PSY, width: PSW, height: PSH, borderRadius: '13% / 6.2%', overflow: 'hidden', background: CREAM, zIndex: 3 }}>
        {/* book a table */}
        <div style={{ position: 'absolute', inset: 0, padding: '64px 18px 0', opacity: 1 - toOrder, transform: `translateX(${-60 * toOrder}px)` }}>
          <div style={{ font: `600 26px/1 ${SANS}`, color: INK, letterSpacing: -0.6 }}>Book bord</div>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[['Dag', 'Lørdag'], ['Tid', '19.00'], ['Gæster', '4 personer']].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 14px', borderRadius: 14, background: '#fff', font: `500 18px/1 ${SANS}` }}><span style={{ color: MUTE }}>{k}</span><span style={{ color: INK }}>{v}</span></div>
            ))}
          </div>
          <div style={{ position: 'absolute', left: 18, right: 18, bottom: 40, height: 56, borderRadius: 28, display: 'grid', placeItems: 'center', color: '#fff', font: `600 20px/1 ${SANS}`,
            background: booked > 0 ? `rgb(${mix(217, 47, booked)},${mix(105, 158, booked)},${mix(46, 91, booked)})` : ORANGE, transform: `scale(${book})` }}>
            <span style={{ position: 'absolute', opacity: 1 - booked }}>Book</span>
            <span style={{ position: 'absolute', opacity: booked, display: 'flex', alignItems: 'center', gap: 8 }}><Check p={seg(t, 1.1, 1.4)} size={10} color="#fff" width={3.4} />Booket</span>
          </div>
        </div>
        {/* pre-order */}
        <div style={{ position: 'absolute', inset: 0, padding: '64px 18px 0', opacity: toOrder, transform: `translateX(${60 * (1 - toOrder)}px)` }}>
          <div style={{ font: `600 26px/1 ${SANS}`, color: INK, letterSpacing: -0.6 }}>Forudbestil</div>
          <div style={{ marginTop: 16, height: 150, borderRadius: 16, backgroundImage: `url(${staticFile('film/assets/dish.webp')})`, backgroundSize: 'cover', backgroundPosition: '62% 55%' }} />
          <div style={{ marginTop: 12, font: `600 19px/1.2 ${SANS}`, color: INK }}>3 × Mørbradgryde</div>
          <div style={{ marginTop: 6, font: `400 16px/1 ${SANS}`, color: MUTE }}>Afhentning kl. 17.30</div>
          <div style={{ position: 'absolute', left: 18, right: 18, bottom: 40, height: 56, borderRadius: 28, display: 'grid', placeItems: 'center', color: '#fff', font: `600 19px/1 ${SANS}`,
            background: paid > 0 ? `rgb(${mix(217, 47, paid)},${mix(105, 158, paid)},${mix(46, 91, paid)})` : ORANGE, transform: `scale(${pay})` }}>
            <span style={{ position: 'absolute', opacity: 1 - paid }}>Bestil og betal</span>
            <span style={{ position: 'absolute', opacity: paid, display: 'flex', alignItems: 'center', gap: 8 }}><Check p={seg(t, 3.5, 3.8)} size={10} color="#fff" width={3.4} />Betalt</span>
          </div>
        </div>
      </div>
      <Img src={staticFile('ny/media/dev/iphone-17-pro-2x.webp')} style={{ position: 'absolute', left: PX, top: PY, width: PW, height: PH, zIndex: 4 }} />
    </AbsoluteFill>
  );
};
