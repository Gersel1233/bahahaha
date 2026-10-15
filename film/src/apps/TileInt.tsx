/* The Integrations tile: one order, paid, runs through everything the
   business already uses. It comes in from the payment, reaches the system
   in the middle, and goes out to the accounts, the text, the calendar, the
   till and the AI, each lighting as it is done, with the log below. The
   stations are kinds of system, not anyone's product. */
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { useT, useFonts, seg, out3, out5, io3, mix, clamp, Check, SANS, MONO } from './common';
import { TW } from './TileApps';

const INK = '#141517', MUTE = '#8A8780', NAVY = '#0A1020', DEEP = '#2B3F7C', GREEN = '#2F9E5B';
const CX = TW / 2, CY = 885, R = 255;

// the stations, clockwise from the top; the first is where the order comes from
const ST = [
  { n: 'Betaling', log: 'Betaling modtaget', ic: 'M3 7h18v10H3zM3 10h18' },
  { n: 'Regnskab', log: 'Bogført i regnskabet', ic: 'M6 3h9l3 3v15H6zM9 11h6M9 15h6' },
  { n: 'SMS', log: 'Kvittering sendt på sms', ic: 'M4 5h16v11H9l-5 4z' },
  { n: 'Kalender', log: 'Afhentning kl. 17.30 i kalenderen', ic: 'M4 6h16v14H4zM4 10h16M8 3v5M16 3v5' },
  { n: 'Kasse', log: 'Registreret i kassen', ic: 'M5 9h14l-1 11H6zM8 9V6h8v3' },
  { n: 'AI', log: 'AI har svaret kunden', ic: 'M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z' },
];
const at = (i: number) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / ST.length; return { x: CX + R * Math.cos(a), y: CY + R * Math.sin(a) }; };
// when the order reaches the middle, and when each station after it is done
const IN = [0.7, 1.5], OUT = (i: number) => 1.9 + (i - 1) * 0.42;

export const TileInt: React.FC = () => {
  useFonts();
  const { t, sp } = useT();
  const all = seg(t, 0, 0.5) * (1 - seg(t, 7.4, 7.95));
  const chip = sp(0.2, 16, 160);
  const inn = io3(seg(t, IN[0], IN[1]));
  const core = Math.sin(clamp(seg(t, IN[1] - 0.1, IN[1] + 0.5)) * Math.PI);
  const done = (i: number) => (i === 0 ? seg(t, 0.4, 0.6) : seg(t, OUT(i) + 0.32, OUT(i) + 0.5));
  const lines = ST.map((_, i) => done(i));
  const time = (i: number) => `17.02.0${Math.min(9, 1 + Math.floor(i / 2))}`;

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(175deg, #F6F4EF, #ECE7DD)', fontFamily: SANS, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: all }}>
        {/* the lines from the middle */}
        <svg width={TW} height={1400} style={{ position: 'absolute', inset: 0 }}>
          {ST.map((_, i) => { const p = at(i); return <line key={i} x1={CX} y1={CY} x2={p.x} y2={p.y} stroke={done(i) > 0 ? DEEP : 'rgba(20,21,23,.12)'} strokeOpacity={done(i) > 0 ? 0.35 + 0.4 * done(i) : 1} strokeWidth="3" strokeDasharray="2 10" strokeLinecap="round" />; })}
        </svg>
        {/* the order, travelling: in from the payment, then out to each */}
        {(() => {
          const dots: React.ReactNode[] = [];
          const p0 = at(0);
          if (inn > 0 && inn < 1) dots.push(<i key="in" style={{ position: 'absolute', left: mix(p0.x, CX, inn) - 11, top: mix(p0.y, CY, inn) - 11, width: 22, height: 22, borderRadius: '50%', background: DEEP, boxShadow: '0 0 0 8px rgba(43,63,124,.18), 0 0 30px rgba(43,63,124,.6)' }} />);
          for (let i = 1; i < ST.length; i++) {
            const q = io3(seg(t, OUT(i), OUT(i) + 0.38));
            if (q > 0 && q < 1) { const p = at(i); dots.push(<i key={i} style={{ position: 'absolute', left: mix(CX, p.x, q) - 9, top: mix(CY, p.y, q) - 9, width: 18, height: 18, borderRadius: '50%', background: DEEP, boxShadow: '0 0 0 7px rgba(43,63,124,.16), 0 0 24px rgba(43,63,124,.55)' }} />); }
          }
          return dots;
        })()}

        {/* the middle: their system */}
        <div style={{ position: 'absolute', left: CX - 100, top: CY - 100, width: 200, height: 200, borderRadius: '50%', display: 'grid', placeItems: 'center', textAlign: 'center',
          background: `radial-gradient(circle at 35% 30%, #22346A, ${NAVY})`, color: '#F6F4EF',
          boxShadow: `0 0 0 ${10 + 16 * core}px rgba(43,63,124,${0.08 + 0.12 * core}), 0 30px 60px rgba(10,16,32,.3)`, transform: `scale(${1 + 0.05 * core})` }}>
          <span><b style={{ display: 'block', font: `600 38px/1 ${SANS}`, letterSpacing: -0.8 }}>Lesreg</b><i style={{ display: 'block', marginTop: 10, font: `400 18px/1 ${MONO}`, fontStyle: 'normal', color: '#9AA3B8' }}>jeres system</i></span>
        </div>

        {/* the stations */}
        {ST.map((s, i) => {
          const p = at(i), d = out3(done(i)), e = out5(seg(t, 0.1 + i * 0.06, 0.6 + i * 0.06));
          return (
            <div key={s.n} style={{ position: 'absolute', left: p.x - 104, top: p.y - 42, width: 208, height: 84, borderRadius: 42, display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px 0 14px',
              background: d > 0 ? `rgba(255,255,255,1)` : 'rgba(255,255,255,.75)', color: INK, opacity: e, transform: `scale(${mix(0.85, 1, e) * (1 + 0.06 * Math.sin(Math.PI * clamp(done(i) * 1.2)))})`,
              boxShadow: `0 14px 30px rgba(20,33,61,${0.08 + 0.1 * d}), inset 0 0 0 ${d > 0 ? 2 : 1}px ${d > 0 ? `rgba(47,158,91,${d})` : 'rgba(20,21,23,.08)'}` }}>
              <span style={{ width: 56, height: 56, borderRadius: '50%', flex: 'none', display: 'grid', placeItems: 'center', background: d > 0.5 ? GREEN : '#EEEAE3' }}>
                {d > 0.5 ? <Check p={seg(done(i), 0.5, 1)} size={14} color="#fff" width={3.4} />
                  : <svg width="30" height="30" viewBox="0 0 24 24"><path d={s.ic} fill="none" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" /></svg>}
              </span>
              <span style={{ font: `600 25px/1 ${SANS}` }}>{s.n}</span>
            </div>
          );
        })}

        {/* the order itself, where it starts */}
        <div style={{ position: 'absolute', left: 20, top: at(0).y - 30, width: 270, height: 60, borderRadius: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          background: NAVY, color: '#F6F4EF', font: `500 22px/1 ${SANS}`, boxShadow: '0 16px 30px rgba(10,16,32,.25)',
          opacity: clamp(chip * 1.5) * (1 - seg(t, 1.1, 1.5)), transform: `translateX(${-30 * (1 - chip)}px)` }}>
          <i style={{ width: 10, height: 10, borderRadius: '50%', background: '#5FD38A' }} />Betalt · 3 retter
        </div>

        {/* the log */}
        <div style={{ position: 'absolute', left: 40, right: 40, top: 1180, height: 210, borderRadius: 26, padding: '16px 24px', overflow: 'hidden',
          background: 'rgba(255,255,255,.7)', boxShadow: 'inset 0 0 0 1px rgba(20,21,23,.06), 0 10px 30px rgba(20,33,61,.06)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          {ST.map((s, i) => {
            const q = out3(seg(lines[i], 0, 1));
            return (
              <div key={s.n} style={{ display: 'flex', gap: 14, font: `400 19px/1.1 ${MONO}`, color: INK, maxHeight: 31 * q, opacity: q, overflow: 'hidden', paddingTop: 9 * q }}>
                <span style={{ color: MUTE }}>{time(i)}</span><span style={{ color: GREEN }}>✓</span><span style={{ fontFamily: SANS, fontSize: 21 }}>{s.log}</span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
