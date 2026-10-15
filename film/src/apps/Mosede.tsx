/* Mosede Havnecafé: in the menu, "Softice og vafler" is switched on, once.
   The phone steps back, and the change runs out to the screen above the
   counter and the website, where the same line appears. */
import React from 'react';
import { AbsoluteFill, staticFile } from 'remotion';
import { u, box, useT, useFonts, seg, out3, out5, io3, mix, clamp, StatusBar, Tap, Check, SANS, SERIF, MONO, SH } from './common';

export const MOSEDE_S = 6.6;

const NAVY = '#0C1424', PANEL = '#152039', LINE = 'rgba(243,238,230,.08)', TEXT = '#F3EEE6', SUB = '#9AA3B8', RED = '#D2373F', GREEN = '#34C759';
const ROWS = ['Burgere og sandwich', 'Pølser', 'Smørrebrød', 'Platter', 'Kugleis og ishorn', 'Softice og vafler', 'Kaffe og varme drikke', 'Øl'];
const NEW = 5;

const Toggle: React.FC<{ on: number }> = ({ on }) => (
  <span style={{ position: 'relative', width: u(51), height: u(31), borderRadius: u(16), flex: 'none',
    background: on > 0 ? `rgba(52,199,89,${on})` : 'rgba(120,120,128,.32)', boxShadow: on > 0 ? 'none' : 'inset 0 0 0 1px rgba(255,255,255,.04)' }}>
    <span style={{ position: 'absolute', top: u(2), left: u(2 + 20 * out3(on)), width: u(27), height: u(27), borderRadius: '50%', background: '#fff',
      boxShadow: `0 ${u(3)}px ${u(8)}px rgba(0,0,0,.25)` }} />
  </span>
);

// the line that appears on every screen
const Line: React.FC<{ p: number; size: number; color: string; dot?: string; pad?: number }> = ({ p, size, color, dot = RED, pad = 0 }) => (
  <div style={{ height: u(size * 1.9 * out3(p)), overflow: 'hidden', opacity: p }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: u(size * 0.5), padding: `${u(size * 0.45)}px ${u(pad)}px`, font: `600 ${u(size)}px/1 ${SANS}`, color,
      background: `rgba(210,55,63,${0.22 * (1 - seg(p, 0.6, 1)) + 0.08})`, borderRadius: u(size * 0.4) }}>
      <span style={{ width: u(size * 0.5), height: u(size * 0.5), borderRadius: '50%', background: dot, flex: 'none' }} />Softice og vafler
    </div>
  </div>
);

export const Mosede: React.FC = () => {
  useFonts();
  const { t, sp } = useT();
  const enter = (i: number) => { const q = out5(seg(t, 0.05 + i * 0.05, 0.6 + i * 0.05)); return { opacity: q, transform: `translateY(${u(20 * (1 - q))}px)` }; };
  const on = out3(seg(t, 1.0, 1.25));
  const toast = out5(seg(t, 1.35, 1.65)) * (1 - seg(t, 2.55, 2.8));
  const saved = seg(t, 2.0, 2.15);

  // the phone steps back to its place among the screens
  const back = io3(seg(t, 2.7, 3.5));
  const others = out5(seg(t, 3.0, 3.7));
  // the change travels out, then lands on each screen
  const run = seg(t, 3.6, 4.3);
  const tv = sp(4.2, 18, 150), web = sp(4.45, 18, 150);

  // where the phone ends up: small, at the bottom
  const PW = 402, PS = 0.33, PX = (402 - PW * PS) / 2, PY = SH - SH * PS - 28;

  return (
    <AbsoluteFill style={{ background: NAVY, overflow: 'hidden', fontFamily: SANS, color: TEXT }}>
      {/* the harbour, faint, behind everything once the phone steps back */}
      <AbsoluteFill style={{ opacity: 0.32 * others, backgroundImage: `url(${staticFile('ny/media/pg/mosede-web.webp')})`, backgroundSize: 'cover', backgroundPosition: '50% 40%', filter: `blur(${u(14)}px)`, transform: 'scale(1.15)' }} />
      <AbsoluteFill style={{ opacity: others, background: `linear-gradient(${NAVY}00, ${NAVY}cc 50%, ${NAVY})` }} />

      {/* ---------- the screen above the counter ---------- */}
      <div style={{ ...box(18, 80, 366, 190), opacity: others, transform: `translateY(${u(30 * (1 - others))}px)` }}>
        <div style={{ font: `400 ${u(11)}px/1 ${MONO}`, color: SUB, letterSpacing: u(0.5), marginBottom: u(10) }}>SKÆRMEN OVER DISKEN</div>
        <div style={{ position: 'relative', height: u(166), borderRadius: u(14), background: '#060A12', padding: u(12), boxShadow: `0 0 0 ${u(5)}px #1B2233, 0 ${u(20)}px ${u(40)}px rgba(0,0,0,.45)` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ font: `300 italic ${u(22)}px/1 ${SERIF}`, fontStyle: 'italic', color: '#F6E7CF' }}>Menu</span>
            <span style={{ font: `400 ${u(9)}px/1 ${MONO}`, color: SUB }}>MOSEDE HAVNECAFÉ</span>
          </div>
          <div style={{ marginTop: u(10), display: 'flex', flexDirection: 'column', gap: u(5) }}>
            {['Smørrebrød', 'Kugleis og ishorn', 'Kaffe og varme drikke'].map(n => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: u(7), font: `500 ${u(13)}px/1 ${SANS}`, color: '#E8E2D8', padding: `${u(6)}px 0`, borderBottom: `${u(1)}px solid rgba(255,255,255,.06)` }}>
                <span style={{ width: u(6), height: u(6), borderRadius: '50%', background: '#E9A23B' }} />{n}
              </div>
            ))}
            <Line p={tv} size={13} color="#fff" />
          </div>
        </div>
      </div>

      {/* ---------- the website ---------- */}
      <div style={{ ...box(18, 292, 366, 210), opacity: others, transform: `translateY(${u(30 * (1 - others))}px)` }}>
        <div style={{ font: `400 ${u(11)}px/1 ${MONO}`, color: SUB, letterSpacing: u(0.5), marginBottom: u(10) }}>HJEMMESIDEN</div>
        <div style={{ position: 'relative', height: u(188), borderRadius: u(14), overflow: 'hidden', background: '#F7F3E8', boxShadow: `0 ${u(20)}px ${u(40)}px rgba(0,0,0,.45)` }}>
          <div style={{ height: u(22), background: '#ECE6DA', display: 'flex', alignItems: 'center', gap: u(5), padding: `0 ${u(10)}px` }}>
            {['#FF5F57', '#FEBC2E', '#28C840'].map(c => <i key={c} style={{ width: u(7), height: u(7), borderRadius: '50%', background: c }} />)}
            <span style={{ marginLeft: u(10), font: `400 ${u(9)}px/1 ${SANS}`, color: '#6E6A62' }}>mosedehavnecafe.dk</span>
          </div>
          <div style={{ height: u(78), backgroundImage: `url(${staticFile('ny/media/pg/mosede-web.webp')})`, backgroundSize: 'cover', backgroundPosition: '50% 57%' }} />
          <div style={{ padding: `${u(10)}px ${u(12)}px`, color: '#1C1A17' }}>
            <div style={{ font: `600 ${u(13)}px/1 ${SANS}`, marginBottom: u(6) }}>Menukort</div>
            {['Smørrebrød', 'Kugleis og ishorn'].map(n => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: u(7), font: `500 ${u(12)}px/1 ${SANS}`, padding: `${u(5)}px 0`, borderBottom: `${u(1)}px solid rgba(0,0,0,.07)` }}>
                <span style={{ width: u(6), height: u(6), borderRadius: '50%', background: '#E9A23B' }} />{n}
              </div>
            ))}
            <Line p={web} size={12} color="#1C1A17" />
          </div>
        </div>
      </div>

      {/* ---------- the change, running out from the phone ---------- */}
      {run > 0 && run < 1 && [[120, 236], [290, 470]].map(([x, y], i) => {
        const q = io3(seg(run, i * 0.15, 0.85 + i * 0.15));
        const sx = 201, sy = PY + 8;
        return <div key={i} style={{ position: 'absolute', left: u(mix(sx, x, q) - 7), top: u(mix(sy, y, q) - 7), width: u(14), height: u(14), borderRadius: '50%',
          background: '#fff', boxShadow: `0 0 ${u(18)}px ${u(6)}px rgba(210,55,63,.75)`, opacity: Math.sin(Math.PI * clamp(q)) }} />;
      })}

      {/* ---------- the phone: the menu, where it is changed ---------- */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: u(402), height: u(SH), transformOrigin: '0 0',
        transform: `translate(${u(PX * back)}px, ${u(PY * back)}px) scale(${mix(1, PS, back)})`,
        borderRadius: u(mix(0, 54, back)), overflow: 'hidden', background: NAVY, boxShadow: back > 0 ? `0 0 0 ${u(6 / mix(1, PS, back))}px #232B3D, 0 ${u(30)}px ${u(80)}px rgba(0,0,0,.6)` : 'none' }}>
        {back > 0.3 && <div style={{ position: 'absolute', left: 0, right: 0, top: u(-26), textAlign: 'center' }} />}
        <div style={{ ...box(20, 72, 362), ...enter(0) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: u(10) }}>
            <span style={{ width: u(30), height: u(30), borderRadius: u(9), background: `linear-gradient(150deg, #E04B4B, #A72332)`, display: 'grid', placeItems: 'center', font: `700 ${u(15)}px/1 ${SANS}`, color: '#fff' }}>M</span>
            <span style={{ font: `500 ${u(15)}px/1 ${SANS}`, color: SUB }}>Mosede Havnecafé</span>
          </div>
          <div style={{ font: `600 ${u(34)}px/1 ${SANS}`, letterSpacing: u(-1), marginTop: u(18) }}>Menukort</div>
          <div style={{ font: `400 ${u(15)}px/1.3 ${SANS}`, color: SUB, marginTop: u(8) }}>Vises på skærmene, hjemmesiden og i appen</div>
        </div>
        <div style={{ ...box(16, 214, 370), background: PANEL, borderRadius: u(22), overflow: 'hidden', ...enter(1) }}>
          {ROWS.map((r, i) => {
            const o = i === NEW ? on : 1;
            return (
              <div key={r} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: u(62), padding: `0 ${u(16)}px`,
                borderTop: i ? `${u(1)}px solid ${LINE}` : 'none', background: i === NEW ? `rgba(52,199,89,${0.1 * on * (1 - seg(t, 2.2, 2.8))})` : 'none' }}>
                <span style={{ font: `500 ${u(17)}px/1 ${SANS}`, color: TEXT, opacity: mix(0.45, 1, o) }}>{r}</span>
                <Toggle on={o} />
              </div>
            );
          })}
        </div>
        <Tap x={344} y={214 + NEW * 62 + 31} at={0.98} t={t} dark />
        {/* saving, then saved on every screen */}
        <div style={{ position: 'absolute', left: u(20), right: u(20), bottom: u(36), height: u(56), borderRadius: u(28), display: 'flex', alignItems: 'center', gap: u(12), padding: `0 ${u(20)}px`,
          background: 'rgba(243,238,230,.12)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.18)', opacity: toast, transform: `translateY(${u(30 * (1 - toast))}px)` }}>
          <span style={{ position: 'relative', width: u(22), height: u(22) }}>
            <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `${u(2.5)}px solid rgba(243,238,230,.25)`, borderTopColor: TEXT, transform: `rotate(${t * 540}deg)`, opacity: 1 - saved }} />
            <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: GREEN, display: 'grid', placeItems: 'center', opacity: saved }}><Check p={seg(t, 2.05, 2.35)} size={16} color="#fff" width={3.2} /></span>
          </span>
          <span style={{ position: 'relative', font: `500 ${u(16)}px/1 ${SANS}` }}>
            <span style={{ opacity: 1 - saved }}>Opdaterer 3 skærme …</span>
            <span style={{ position: 'absolute', left: 0, top: 0, whiteSpace: 'nowrap', opacity: saved }}>Opdateret alle steder</span>
          </span>
        </div>
        <StatusBar color={TEXT} />
      </div>
      {back > 0.5 && <StatusBar color={TEXT} />}
      {back > 0.5 && <div style={{ ...box(0, PY - 22, 402), textAlign: 'center', font: `400 ${u(11)}px/1 ${MONO}`, color: SUB, letterSpacing: u(0.5), opacity: others }}>APPEN</div>}
    </AbsoluteFill>
  );
};
