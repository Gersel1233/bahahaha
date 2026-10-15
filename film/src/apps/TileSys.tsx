/* The Systems tile: a business's own system putting itself together. The
   day's overview counts up and its curve draws, the kitchen's orders come
   in and move on, and the menu switches a dish on. Panels in depth, the way
   a product is shown taken apart. A demonstration, under no client's name. */
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { useT, useFonts, seg, out3, out5, io3, mix, clamp, Check, SANS, MONO, SERIF } from './common';
import { TW, TH } from './TileApps';

const INK = '#141517', MUTE = '#8A8780', LINE = 'rgba(20,21,23,.08)', ORANGE = '#D9692E', GREEN = '#2F9E5B', NAVY = '#18264A';

const Panel: React.FC<{ x: number; y: number; w: number; h: number; p: number; z?: number; dark?: boolean; children: React.ReactNode }> = ({ x, y, w, h, p, z = 0, dark, children }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 34, padding: 32, overflow: 'hidden',
    background: dark ? NAVY : 'rgba(255,255,255,.92)', color: dark ? '#F3EEE6' : INK,
    boxShadow: `0 ${30 + z * 10}px ${70 + z * 20}px rgba(20,33,61,${0.14 + z * 0.04}), 0 2px 6px rgba(20,33,61,.06), inset 0 0 0 1px ${dark ? 'rgba(255,255,255,.08)' : 'rgba(20,21,23,.05)'}`,
    opacity: clamp(p * 1.6), transform: `translateY(${70 * (1 - p)}px) scale(${mix(0.92, 1, p)})` }}>{children}</div>
);

const Count: React.FC<{ to: number; p: number; size: number; color?: string }> = ({ to, p, size, color = INK }) => (
  <span style={{ font: `600 ${size}px/1 ${SANS}`, letterSpacing: -size * 0.03, color, fontVariantNumeric: 'tabular-nums' }}>{Math.round(to * out3(p))}</span>
);

const ORDERS = [
  { at: '17.00', what: '2 × Dagens ret', st: ['Ny', 'I gang', 'Klar'] },
  { at: '17.15', what: '4 × Dagens ret', st: ['Ny', 'I gang'] },
  { at: '17.30', what: '3 × Dagens ret', st: ['Ny'] },
];
const ST: Record<string, string> = { 'Ny': '#8A8780', 'I gang': ORANGE, 'Klar': GREEN };

export const TileSys: React.FC = () => {
  useFonts();
  const { t, sp } = useT();
  const all = 1 - seg(t, 7.4, 7.95);
  const a = sp(0.25, 17, 120), b = sp(0.75, 17, 120), c = sp(1.25, 17, 120);
  const kpi = seg(t, 0.8, 2.4), curve = io3(seg(t, 1.0, 2.8));
  const dish = out3(seg(t, 4.6, 4.85));
  // the curve of the day, drawn
  const pts = [8, 12, 10, 18, 26, 22, 30, 41, 38, 52, 61, 58, 72];
  const cw = 690, ch = 150;
  const path = pts.map((v, i) => `${i ? 'L' : 'M'}${(i / (pts.length - 1)) * cw},${ch - (v / 80) * ch}`).join(' ');
  const area = path + ` L${cw},${ch} L0,${ch} Z`;

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(175deg, #FFFFFF 0%, #F1EDE6 55%, #E7E1D6 100%)', fontFamily: SANS, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: all }}>
        {/* ---------- the day, at a glance ---------- */}
        <Panel x={28} y={540} w={784} h={470} p={a}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ font: `600 42px/1 ${SANS}`, letterSpacing: -1.2 }}>Overblik <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 300 }}>i dag</span></span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, font: `400 20px/1 ${MONO}`, color: GREEN }}><i style={{ width: 12, height: 12, borderRadius: '50%', background: GREEN, opacity: 0.5 + 0.5 * Math.sin(t * 6) }} />LIVE</span>
          </div>
          <div style={{ display: 'flex', gap: 46, marginTop: 34 }}>
            {[['Bestillinger', 48], ['Bookinger', 12], ['Gæster i aften', 36]].map(([l, v], i) => (
              <div key={l as string} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ font: `500 22px/1 ${SANS}`, color: MUTE }}>{l}</span>
                <Count to={v as number} p={seg(kpi, i * 0.12, 0.7 + i * 0.12)} size={78} />
              </div>
            ))}
          </div>
          <svg width={cw} height={ch} style={{ position: 'absolute', left: 46, bottom: 34, overflow: 'visible' }}>
            <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={ORANGE} stopOpacity=".22" /><stop offset="1" stopColor={ORANGE} stopOpacity="0" /></linearGradient>
              <clipPath id="c"><rect x="0" y="-20" width={cw * curve} height={ch + 40} /></clipPath></defs>
            {[0.25, 0.5, 0.75].map(y => <line key={y} x1="0" x2={cw} y1={ch * y} y2={ch * y} stroke={LINE} strokeWidth="2" />)}
            <g clipPath="url(#c)"><path d={area} fill="url(#g)" /><path d={path} fill="none" stroke={ORANGE} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" /></g>
            {curve > 0.98 && <circle cx={cw} cy={ch - (72 / 80) * ch} r={8 + 3 * Math.sin(t * 6)} fill={ORANGE} stroke="#fff" strokeWidth="4" />}
          </svg>
        </Panel>

        {/* ---------- the kitchen ---------- */}
        <Panel x={28} y={1036} w={500} h={400} p={b} z={1} dark>
          <div style={{ font: `400 19px/1 ${MONO}`, color: '#9AA3B8', letterSpacing: 1.4 }}>KØKKENET</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
            {ORDERS.map((o, i) => {
              const inn = out5(seg(t, 1.4 + i * 0.45, 1.9 + i * 0.45));
              // each order moves on through its states
              const k = Math.min(o.st.length - 1, Math.floor(seg(t, 2.8 + i * 0.3, 6.2) * o.st.length));
              const s = o.st[Math.max(0, k)];
              return (
                <div key={o.at} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', borderRadius: 20, background: 'rgba(255,255,255,.06)',
                  opacity: inn, transform: `translateX(${-40 * (1 - inn)}px)` }}>
                  <span style={{ font: `600 30px/1 ${SANS}` }}>{o.at}</span>
                  <span style={{ font: `400 22px/1.2 ${SANS}`, color: '#C9CFDC', flex: 1 }}>{o.what}</span>
                  <span style={{ font: `600 19px/1 ${SANS}`, color: ST[s], padding: '9px 14px', borderRadius: 20, background: 'rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {s === 'Klar' && <Check p={1} size={9} color={GREEN} width={3.2} />}{s}</span>
                </div>
              );
            })}
          </div>
        </Panel>

        {/* ---------- the menu ---------- */}
        <Panel x={548} y={1090} w={264} h={340} p={c} z={2}>
          <div style={{ font: `400 19px/1 ${MONO}`, color: MUTE, letterSpacing: 1.4 }}>MENUKORT</div>
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 14 }}>
            {['Dagens ret', 'Brød', 'Dessert', 'Kaffe'].map((n, i) => {
              const on = i === 2 ? dish : 1;
              return (
                <div key={n} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 62, borderTop: i ? `1px solid ${LINE}` : 'none' }}>
                  <span style={{ font: `500 24px/1 ${SANS}`, opacity: mix(0.4, 1, on) }}>{n}</span>
                  <span style={{ position: 'relative', width: 50, height: 30, borderRadius: 15, background: on > 0 ? `rgba(52,199,89,${on})` : 'rgba(120,120,128,.25)' }}>
                    <i style={{ position: 'absolute', top: 2, left: 2 + 20 * on, width: 26, height: 26, borderRadius: '50%', background: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,.2)' }} />
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </AbsoluteFill>
  );
};
