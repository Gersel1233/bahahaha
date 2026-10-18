/* Mosede Havnecafé: one change, everywhere. In the café's menu app
   "Softice og vafler" is switched on. That one line lifts out of the list
   as the change itself, the two other places it shows rise beside it - the
   screen above the counter and the website - and a copy of the line flies
   into each and lands there as a new line. Drawn large: on the page this
   plays on a small phone, so every word must still read. Lesreg's Liquid
   Atelier for the chrome (obsidian, porcelain, Chivo, Fragment Mono,
   ultramarine only for "now"); the café's own red and blue for its things. */
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { u, box, useT, useFonts, seg, out3, out5, io3, mix, clamp, StatusBar, Tap, Check, SANS, SERIF, MONO, SH } from './common';

export const MOSEDE_S = 6.6;

const OBS = '#0E0F10', BASALT = '#232426', GRAPHITE = '#46443F', ASH = '#8C8880', TRAV = '#D8D1C5', PORC = '#F6F4EF', ULTRA = '#2436E8';
const RED = '#D62A3A', BLUE = '#2A5F8F';
const ROWS = ['Smørrebrød', 'Platter', 'Kugleis og ishorn', 'Softice og vafler', 'Kaffe og varme drikke', 'Øl og vand'];
const NEW = 3, ROW_H = 68, LIST_Y = 214;

// a switch in the house's colours: on is porcelain with an obsidian knob
const Toggle: React.FC<{ on: number }> = ({ on }) => (
  <span style={{ position: 'relative', width: u(56), height: u(34), borderRadius: u(17), flex: 'none',
    background: on > 0 ? `rgba(246,244,239,${0.18 + 0.82 * on})` : 'rgba(246,244,239,.18)' }}>
    <span style={{ position: 'absolute', top: u(3), left: u(3 + 22 * out3(on)), width: u(28), height: u(28), borderRadius: '50%',
      background: on > 0.5 ? OBS : PORC, boxShadow: `0 ${u(2)}px ${u(6)}px rgba(0,0,0,.3)` }} />
  </span>
);

// the new line as it stands in a list
const NewLine: React.FC<{ size: number; color: string; open: number; flash: number; rule: string }> = ({ size, color, open, flash, rule }) => (
  <div style={{ height: u(size * 2.1 * out3(open)), overflow: 'hidden' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: u(size * 0.55), height: u(size * 2.1), padding: `0 ${u(size * 0.5)}px`, margin: `0 ${u(-size * 0.5)}px`,
      font: `500 ${u(size)}px/1 ${SANS}`, color, borderRadius: u(size * 0.5), background: `rgba(36,54,232,${0.16 * flash})`, borderTop: `${u(1)}px solid ${rule}` }}>
      <span style={{ width: u(size * 0.42), height: u(size * 0.42), borderRadius: '50%', background: RED, flex: 'none' }} />Softice og vafler
      <span style={{ marginLeft: 'auto', width: u(8), height: u(8), borderRadius: '50%', background: ULTRA, opacity: flash, boxShadow: `0 0 0 ${u(5 * flash)}px rgba(36,54,232,.22)` }} />
    </div>
  </div>
);

const Item: React.FC<{ n: string; size: number; color: string; rule: string; dot: string }> = ({ n, size, color, rule, dot }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: u(size * 0.55), height: u(size * 2.1), font: `500 ${u(size)}px/1 ${SANS}`, color, borderTop: `${u(1)}px solid ${rule}` }}>
    <span style={{ width: u(size * 0.42), height: u(size * 0.42), borderRadius: '50%', background: dot, flex: 'none' }} />{n}
  </div>
);

// a place the change reaches: a mono label above, "Opdateret" once it lands
const Place: React.FC<{ y: number; h: number; label: string; rise: number; done: number; children: React.ReactNode }> = ({ y, h, label, rise, done, children }) => (
  <div style={{ ...box(18, y, 366, h), opacity: rise, transform: `translateY(${u(60 * (1 - rise))}px)` }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: u(24), marginBottom: u(10) }}>
      <span style={{ font: `400 ${u(13)}px/1 ${MONO}`, color: TRAV, letterSpacing: u(0.6) }}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: u(6), font: `500 ${u(14)}px/1 ${SANS}`, color: PORC, opacity: done }}>
        <Check p={done} size={16} color={PORC} width={3} />Opdateret
      </span>
    </div>
    {children}
  </div>
);

export const Mosede: React.FC = () => {
  useFonts();
  const { t } = useT();
  const enter = (i: number) => { const q = out5(seg(t, 0.05 + i * 0.06, 0.6 + i * 0.06)); return { opacity: q, transform: `translateY(${u(24 * (1 - q))}px)` }; };

  // 1. the switch
  const on = out3(seg(t, 1.0, 1.25));
  // 2. the list goes, the line lifts out as the change
  const go = io3(seg(t, 2.0, 2.6));
  const lift = io3(seg(t, 2.1, 2.8));
  // 3. the two places rise
  const tvIn = out5(seg(t, 2.5, 3.2)), webIn = out5(seg(t, 2.65, 3.35));
  // 4. a copy flies into each, and opens there as a new line
  const fly = [seg(t, 3.35, 4.05), seg(t, 3.55, 4.25)];
  const open = [out3(seg(t, 3.95, 4.3)), out3(seg(t, 4.15, 4.5))];
  const flash = [Math.sin(Math.PI * seg(t, 3.95, 5.2)), Math.sin(Math.PI * seg(t, 4.15, 5.4))];
  const done = [seg(t, 4.2, 4.55), seg(t, 4.4, 4.75)];
  const all = out5(seg(t, 4.85, 5.25));

  // where the change sits once lifted: a wide chip under the title
  const rowY0 = LIST_Y + NEW * ROW_H, chipY = 96;
  const chipY_ = mix(rowY0, chipY, lift);
  // where the copies land in each place (the first point of the new line)
  const TV_Y = 196, WEB_Y = 508;
  const land = [[38, TV_Y + 34 + 16 + 46 + 3 * 40 + 20], [38, WEB_Y + 34 + 28 + 64 + 8 + 40 + 2 * 36 + 18]];

  return (
    <AbsoluteFill style={{ background: OBS, overflow: 'hidden', fontFamily: SANS, color: PORC }}>
      {/* the café, faint, behind it all once the change goes out */}
      <AbsoluteFill style={{ opacity: 0.22 * go, backgroundImage: `url(${staticFile('ny/media/pg/mosede-web.webp')})`, backgroundSize: 'cover', backgroundPosition: '50% 40%', filter: `blur(${u(18)}px)`, transform: 'scale(1.2)' }} />
      <AbsoluteFill style={{ opacity: go, background: `linear-gradient(${OBS}66, ${OBS}dd 40%, ${OBS})` }} />

      {/* ---------- the menu app ---------- */}
      <div style={{ ...box(20, 70, 362), ...enter(0), opacity: (enter(0).opacity as number) * (1 - go) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: u(12) }}>
          <Img src={staticFile('ny/media/ic/mosede-app.svg')} style={{ width: u(40), height: u(40) }} />
          <span style={{ font: `500 ${u(17)}px/1 ${SANS}`, color: TRAV }}>Mosede Havnecafé</span>
        </div>
        <div style={{ font: `500 ${u(40)}px/1 ${SANS}`, letterSpacing: u(-1.2), marginTop: u(22) }}>Menukort</div>
        <div style={{ font: `400 ${u(16)}px/1.3 ${SANS}`, color: ASH, marginTop: u(10) }}>Vises i caféen, på hjemmesiden og i appen</div>
      </div>
      <div style={{ ...box(16, LIST_Y, 370), background: BASALT, borderRadius: u(24), overflow: 'hidden', ...enter(1) }}>
        {ROWS.map((r, i) => {
          const o = i === NEW ? on : 1;
          const away = i === NEW ? 0 : go;
          return (
            <div key={r} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: u(ROW_H), padding: `0 ${u(18)}px`,
              borderTop: i ? `${u(1)}px solid rgba(246,244,239,.07)` : 'none', opacity: (i === NEW ? (t > 1.9 ? 0 : 1) : 1) * (1 - away), transform: `translateY(${u(30 * away * (i < NEW ? -1 : 1))}px)` }}>
              <span style={{ font: `500 ${u(21)}px/1 ${SANS}`, color: PORC, opacity: mix(0.4, 1, o) }}>{r}</span>
              <Toggle on={o} />
            </div>
          );
        })}
      </div>
      <Tap x={348} y={LIST_Y + NEW * ROW_H + ROW_H / 2} at={0.98} t={t} dark />
      {/* ---------- the change itself, lifted out of the list ---------- */}
      {t > 1.9 && (
        <div style={{ ...box(mix(16, 18, lift), chipY_, mix(370, 366, lift), ROW_H), borderRadius: u(mix(0, 22, lift)), zIndex: 5,
          background: mix(0, 1, lift) > 0 ? `rgba(246,244,239,${lift})` : BASALT, color: lift > 0.5 ? OBS : PORC,
          boxShadow: `0 ${u(20 * lift)}px ${u(44 * lift)}px rgba(0,0,0,${0.5 * lift})`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `0 ${u(18)}px` }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: u(12 * lift), font: `500 ${u(21)}px/1 ${SANS}` }}>
            <span style={{ width: u(9 * lift), height: u(9), borderRadius: '50%', background: RED, opacity: lift }} />Softice og vafler
          </span>
          <span style={{ position: 'relative', font: `400 ${u(13)}px/1 ${MONO}`, letterSpacing: u(0.5), color: GRAPHITE, opacity: lift }}>
            <span style={{ opacity: 1 - all }}>SLÅET TIL</span>
            <span style={{ position: 'absolute', right: 0, top: u(-4), display: 'flex', alignItems: 'center', gap: u(6), whiteSpace: 'nowrap', color: OBS, opacity: all }}>
              <Check p={seg(t, 4.95, 5.35)} size={16} color={OBS} width={3} />ALLE STEDER</span>
          </span>
        </div>
      )}
      <div style={{ ...box(20, chipY - 34), font: `400 ${u(13)}px/1 ${MONO}`, color: TRAV, letterSpacing: u(0.6), opacity: lift }}>ÉN ÆNDRING</div>

      {/* ---------- the screen above the counter ---------- */}
      <Place y={TV_Y} h={280} label="I CAFÉEN · SKÆRMEN" rise={tvIn} done={done[0]}>
        <div style={{ borderRadius: u(18), background: '#05070B', padding: `${u(16)}px ${u(20)}px ${u(12)}px`, boxShadow: `0 0 0 ${u(5)}px ${BASALT}, 0 ${u(22)}px ${u(44)}px rgba(0,0,0,.5)` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', height: u(46) }}>
            <span style={{ font: `300 italic ${u(30)}px/1 ${SERIF}`, color: '#F6E7CF' }}>Menu</span>
            <span style={{ font: `400 ${u(11)}px/1 ${MONO}`, color: ASH, letterSpacing: u(0.4) }}>MOSEDE HAVNECAFÉ</span>
          </div>
          {['Smørrebrød', 'Kugleis og ishorn', 'Kaffe og varme drikke'].map(n => <Item key={n} n={n} size={19} color="#EDE7DD" rule="rgba(255,255,255,.07)" dot="#E9A23B" />)}
          <NewLine size={19} color="#fff" open={open[0]} flash={flash[0]} rule="rgba(255,255,255,.07)" />
        </div>
      </Place>

      {/* ---------- the website ---------- */}
      <Place y={WEB_Y} h={320} label="PÅ HJEMMESIDEN" rise={webIn} done={done[1]}>
        <div style={{ borderRadius: u(18), overflow: 'hidden', background: '#F7F3E8', boxShadow: `0 ${u(22)}px ${u(44)}px rgba(0,0,0,.5)` }}>
          <div style={{ height: u(28), background: '#ECE6DA', display: 'flex', alignItems: 'center', gap: u(6), padding: `0 ${u(12)}px` }}>
            {['#FF5F57', '#FEBC2E', '#28C840'].map(c => <i key={c} style={{ width: u(8), height: u(8), borderRadius: '50%', background: c }} />)}
            <span style={{ marginLeft: u(10), font: `400 ${u(12)}px/1 ${MONO}`, color: '#6E6A62' }}>mosedehavnecafe.dk</span>
          </div>
          <div style={{ height: u(64), backgroundImage: `url(${staticFile('ny/media/pg/mosede-web.webp')})`, backgroundSize: 'cover', backgroundPosition: '50% 57%' }} />
          <div style={{ padding: `${u(8)}px ${u(20)}px ${u(10)}px`, color: '#1C1A17' }}>
            <div style={{ font: `500 ${u(20)}px/1 ${SANS}`, height: u(40), display: 'flex', alignItems: 'center' }}>Menukort</div>
            {['Smørrebrød', 'Kugleis og ishorn'].map(n => <Item key={n} n={n} size={17} color="#1C1A17" rule="rgba(0,0,0,.08)" dot={BLUE} />)}
            <NewLine size={17} color="#1C1A17" open={open[1]} flash={flash[1]} rule="rgba(0,0,0,.08)" />
          </div>
        </div>
      </Place>

      {/* ---------- the copies, flying from the change to each place ---------- */}
      {fly.map((f, i) => {
        if (f <= 0 || f >= 1) return null;
        const q = io3(f);
        const x0 = 18 + 18, y0 = chipY + ROW_H / 2, [x1, y1] = land[i];
        // an arc: out to the right, then in
        const x = mix(x0, x1, q) + Math.sin(Math.PI * q) * (i ? 120 : 80), y = mix(y0, y1, q);
        const s = mix(1, i ? 0.8 : 0.9, q);
        return (
          <div key={i} style={{ position: 'absolute', left: u(x), top: u(y - 22 * s), height: u(44 * s), padding: `0 ${u(16 * s)}px`, borderRadius: u(22 * s), zIndex: 6,
            display: 'flex', alignItems: 'center', gap: u(10 * s), background: PORC, color: OBS, font: `500 ${u(18 * s)}px/1 ${SANS}`, whiteSpace: 'nowrap',
            boxShadow: `0 ${u(16)}px ${u(34)}px rgba(0,0,0,.45)`, opacity: Math.min(1, f * 6, (1 - f) * 8) }}>
            <span style={{ width: u(8 * s), height: u(8 * s), borderRadius: '50%', background: RED }} />Softice og vafler
          </div>
        );
      })}

      <StatusBar color={PORC} />
    </AbsoluteFill>
  );
};
