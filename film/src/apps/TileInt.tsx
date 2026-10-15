/* The Integrations tile: one paid order, typed in by nobody, updating
   three real kinds of system one after another — the accounts, the
   customer's text and the kitchen printer — each showing its own change,
   and at the end: typed once, updated three places. A demonstration,
   under no client's name. */
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { useT, useFonts, seg, out3, out5, io3, mix, clamp, Check, SANS, MONO } from './common';
import { TW } from './TileApps';

export const INT_S = 6.4;

const INK = '#141517', MUTE = '#8A8780', NAVY = '#0A1020', DEEP = '#2B3F7C', GREEN = '#2F9E5B';
const BUS = 60, PX = 98, PW = TW - PX - 30, PH = 222, GAP = 24, Y0 = 668;
// when the light reaches each system
const AT = [1.2, 2.5, 3.8];
const PANELS = [
  { n: 'Regnskab', c: '#2F9E5B', ic: 'M6 3h9l3 3v15H6zM9 11h6M9 15h6' },
  { n: 'Sms til kunden', c: '#34C759', ic: 'M4 5h16v11H9l-5 4z' },
  { n: 'Køkkenprinter', c: '#1E1814', ic: 'M7 9V3h10v6M6 18H4v-7h16v7h-2M7 14h10v7H7z' },
];

type Sp = (at: number, damping?: number, stiffness?: number, mass?: number) => number;

export const TileInt: React.FC = () => {
  useFonts();
  const { t, sp } = useT();
  const on = (i: number) => out3(seg(t, AT[i], AT[i] + 0.25));
  // the light running down the line
  const nodeY = (i: number) => Y0 + i * (PH + GAP) + PH / 2;
  const runY = (() => { for (let i = 0; i < AT.length; i++) { if (t < AT[i]) { const a = i ? AT[i - 1] : 0.5; return mix(i ? nodeY(i - 1) : 640, nodeY(i), io3(seg(t, a + 0.1, AT[i]))); } } return -1; })();
  const lit = runY < 0 ? nodeY(AT.length - 1) : runY;
  const done = out5(seg(t, 5.0, 5.4));

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(175deg, #F6F4EF, #ECE7DD)', fontFamily: SANS, color: INK, overflow: 'hidden' }}>
      {/* ---------- the order, typed in by nobody ---------- */}
      <div style={{ position: 'absolute', left: 36, right: 36, top: 568, height: 70, borderRadius: 35, display: 'flex', alignItems: 'center', gap: 14, padding: '0 26px 0 14px',
        background: done > 0 ? `rgb(${mix(10, 47, done)},${mix(16, 158, done)},${mix(32, 91, done)})` : NAVY, color: '#F6F4EF', boxShadow: '0 18px 36px rgba(10,16,32,.22)' }}>
        <span style={{ width: 44, height: 44, borderRadius: '50%', display: 'grid', placeItems: 'center', flex: 'none', background: 'rgba(255,255,255,.12)' }}>
          {done > 0.5 ? <Check p={seg(t, 5.15, 5.5)} size={11} color="#fff" width={3.4} /> : <i style={{ width: 12, height: 12, borderRadius: '50%', background: '#5FD38A', opacity: 0.6 + 0.4 * Math.sin(t * 6) }} />}
        </span>
        <span style={{ position: 'relative', flex: 1, height: 30 }}>
          <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', font: `500 25px/1 ${SANS}`, opacity: 1 - done, whiteSpace: 'nowrap' }}>Ny bestilling betalt · 3 × Mørbradgryde</span>
          <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', font: `600 25px/1 ${SANS}`, opacity: done, whiteSpace: 'nowrap' }}>Tastet én gang · opdateret 3 steder</span>
        </span>
      </div>

      {/* ---------- the line, and the light on it ---------- */}
      <div style={{ position: 'absolute', left: BUS - 1.5, top: 638, width: 3, height: nodeY(AT.length - 1) - 638, background: 'rgba(20,21,23,.1)', borderRadius: 2 }} />
      <div style={{ position: 'absolute', left: BUS - 1.5, top: 638, width: 3, height: Math.max(0, lit - 638), background: DEEP, borderRadius: 2 }} />
      {runY > 0 && <i style={{ position: 'absolute', left: BUS - 12, top: runY - 12, width: 24, height: 24, borderRadius: '50%', background: '#fff', boxShadow: `0 0 0 6px ${DEEP}, 0 0 30px 8px rgba(43,63,124,.55)` }} />}

      {/* ---------- the four systems ---------- */}
      {PANELS.map((p, i) => {
        const y = Y0 + i * (PH + GAP), o = on(i), pop = Math.sin(Math.PI * clamp(seg(t, AT[i], AT[i] + 0.45)));
        return (
          <React.Fragment key={p.n}>
            <span style={{ position: 'absolute', left: BUS - 13, top: y + PH / 2 - 13, width: 26, height: 26, borderRadius: '50%', background: o > 0.5 ? GREEN : '#fff',
              boxShadow: `0 0 0 3px ${o > 0.5 ? GREEN : 'rgba(20,21,23,.15)'}`, display: 'grid', placeItems: 'center' }}>{o > 0.5 && <Check p={1} size={7} color="#fff" width={4} />}</span>
            <i style={{ position: 'absolute', left: BUS + 13, top: y + PH / 2 - 1.5, width: PX - BUS - 13, height: 3, background: o > 0 ? DEEP : 'rgba(20,21,23,.1)' }} />
            <div style={{ position: 'absolute', left: PX, top: y, width: PW, height: PH, borderRadius: 30, background: '#fff', overflow: 'hidden', padding: '24px 26px',
              opacity: mix(0.55, 1, o), transform: `scale(${1 + 0.025 * pop})`,
              boxShadow: `0 ${mix(6, 24, o)}px ${mix(16, 44, o)}px rgba(20,33,61,${mix(0.05, 0.14, o)}), inset 0 0 0 ${o > 0 ? 2 : 1}px ${o > 0 ? `rgba(47,158,91,${0.25 + 0.5 * pop})` : 'rgba(20,21,23,.06)'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 46, height: 46, borderRadius: 12, background: p.c, display: 'grid', placeItems: 'center', flex: 'none' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24"><path d={p.ic} fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" /></svg>
                </span>
                <span style={{ font: `600 30px/1 ${SANS}`, letterSpacing: -0.5 }}>{p.n}</span>
                <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, font: `600 22px/1 ${SANS}`, color: GREEN, opacity: o }}>
                  <Check p={seg(t, AT[i] + 0.1, AT[i] + 0.4)} size={11} color={GREEN} width={3.4} />Opdateret</span>
              </div>
              <div style={{ position: 'relative', marginTop: 20, height: 106 }}>
                {i === 0 && <Ledger t={t} a={AT[0]} sp={sp} />}
                {i === 1 && <Sms t={t} a={AT[1]} sp={sp} />}
                {i === 2 && <Printer t={t} a={AT[2]} sp={sp} />}
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

type Part = { t: number; a: number; sp: Sp };

// the accounts: a new entry slides in above the last one, and is booked
const Ledger: React.FC<Part> = ({ t, a, sp }) => {
  const q = sp(a + 0.05, 16, 160);
  const row = (no: string, what: string, hi: number) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, height: 50, padding: '0 14px', borderRadius: 12, background: `rgba(47,158,91,${0.1 * hi})`, font: `400 25px/1 ${SANS}` }}>
      <span style={{ font: `400 21px/1 ${MONO}`, color: MUTE }}>{no}</span><span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden' }}>{what}</span><span style={{ font: `600 21px/1 ${SANS}`, color: GREEN }}>Bogført</span>
    </div>
  );
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ transform: `translateY(${-54 * (1 - q)}px)` }}>
        <div style={{ opacity: clamp(q * 1.5) }}>{row('#1042', 'Salg · 3 × Mørbradgryde', 1 - seg(t, a + 1.2, a + 2))}</div>
        <div style={{ opacity: 0.55 }}>{row('#1041', 'Salg · 2 × Dagens ret', 0)}</div>
      </div>
    </div>
  );
};

// the customer's text: written, sent, delivered
const Sms: React.FC<Part> = ({ t, a, sp }) => {
  const msg = 'Tak! Din mad er klar kl. 17.30 🙂';
  const n = Math.round(msg.length * seg(t, a + 0.05, a + 0.6));
  const q = sp(a + 0.62, 16, 190);
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
      <span style={{ font: `500 19px/1 ${SANS}`, color: MUTE, opacity: seg(t, a + 0.85, a + 1.05) }}>Leveret</span>
      <span style={{ maxWidth: 560, padding: '16px 22px', borderRadius: 28, borderBottomRightRadius: 8, font: `400 27px/1.2 ${SANS}`, whiteSpace: 'nowrap',
        background: q > 0 ? '#34C759' : '#E9E9EB', color: q > 0 ? '#fff' : INK, transform: `scale(${mix(1, 1.04, Math.sin(Math.PI * clamp(q)))})`, opacity: n > 0 ? 1 : 0 }}>{msg.slice(0, Math.max(n, 1))}</span>
    </div>
  );
};

// the kitchen printer: the ticket comes out of the slot
const Printer: React.FC<Part> = ({ t, a }) => {
  const q = out3(seg(t, a + 0.05, a + 1.1));
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-start', gap: 18 }}>
      <div style={{ position: 'relative', width: 300, height: 106, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 18, borderRadius: 9, background: '#2A2A2E', zIndex: 2 }} />
        <div style={{ position: 'absolute', left: 16, right: 16, top: 9, height: 97, background: '#FFFDF8', boxShadow: '0 2px 8px rgba(0,0,0,.12)', padding: '12px 14px 0',
          transform: `translateY(${-97 + 97 * q}px)`, font: `400 19px/1.35 ${MONO}`, color: INK }}>
          KØKKEN · 17.30<br />3 × Mørbradgryde<br />#1042
        </div>
      </div>
      <span style={{ marginTop: 30, font: `400 23px/1.3 ${SANS}`, color: MUTE, opacity: seg(t, a + 0.6, a + 1) }}>Bonen er<br />i køkkenet</span>
    </div>
  );
};
