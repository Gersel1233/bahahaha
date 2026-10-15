/* The Apps tile: what makes an app of today. A notification lands on the
   lock screen, goes up into the Dynamic Island and becomes a Live Activity
   that follows the order until it is ready, then folds back into the
   island. A demonstration of the kind of app we build, under no client's
   name. */
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { useT, useFonts, seg, out3, out5, io3, mix, clamp, Check, SANS } from './common';

export const TILE_S = 8;
export const APPS_S = 6.4;
export const TW = 840, TH = 1400;

const NAVY9 = '#05080F', NAVY8 = '#101A33', DEEP = '#2B3F7C', ORANGE = '#E07A3A', GREEN = '#34C759';
// the phone, and its screen inside the render
const PW = 780, PX = (TW - PW) / 2, PY = 560, PH = PW * 2336 / 1120;
const SX = PX + PW * 0.0537, SY = PY + PH * 0.024, SW = PW * 0.8917, SHh = PH * 0.952;
const pt = SW / 402; // one iOS point on this screen

const Fork: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 24 24"><path d="M7 3v7a2 2 0 0 0 2 2v9M11 3v7M7 3v4m4-4v4M17 3c-1.7 1-2.5 3-2.5 6s1 4 2.5 4v8" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

export const TileApps: React.FC = () => {
  useFonts();
  const { t, sp } = useT();
  // it is already there when it starts, and it ends on its last state
  const all = 1, rise = 1;
  const note = sp(0.9, 16, 170);
  const up = io3(seg(t, 1.9, 2.25)); // the notification goes up into the island
  const open = sp(2.15, 15, 150); // and the island opens
  const close = io3(seg(t, 5.3, 5.75));
  const steps = [seg(t, 2.6, 3.0), seg(t, 3.4, 4.2), seg(t, 4.4, 4.7)];
  const ready = out3(steps[2]);
  const pulse = Math.sin(clamp(seg(t, 4.5, 5.1)) * Math.PI);

  // the island: closed, then a Live Activity, then compact
  const iw = mix(mix(125, 380, open), 250, close), ih = mix(mix(37, 168, open), 37, close);
  const ir = mix(mix(18.5, 46, open), 18.5, close);
  const status = ready > 0.5 ? 'Klar til afhentning' : steps[1] > 0 ? 'Tilberedes' : 'Modtaget';

  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 70% at 50% 100%, ${DEEP}, ${NAVY8} 48%, ${NAVY9})`, fontFamily: SANS, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: PX - 120, top: PY - 160, width: PW + 240, height: PW + 240, borderRadius: '50%',
        background: 'radial-gradient(closest-side, rgba(70,100,200,.35), transparent)', opacity: all }} />
      <div style={{ position: 'absolute', inset: 0, opacity: all, transform: `translateY(${80 * (1 - rise)}px)` }}>
        {/* ---------- the screen ---------- */}
        <div style={{ position: 'absolute', left: SX, top: SY, width: SW, height: SHh, borderRadius: `${13}% / ${6.2}%`, overflow: 'hidden',
          background: `radial-gradient(130% 70% at 50% 0%, #3A55A8 0%, ${DEEP} 18%, ${NAVY8} 52%, ${NAVY9} 100%)` }}>
          <div style={{ position: 'absolute', top: 76 * pt, left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,.88)', font: `600 ${18 * pt}px/1 ${SANS}` }}>Torsdag 15. oktober</div>
          <div style={{ position: 'absolute', top: 96 * pt, left: 0, right: 0, textAlign: 'center', color: '#fff', font: `600 ${96 * pt}px/1 ${SANS}`, letterSpacing: -3 * pt }}>9:41</div>
          {/* the notification, before it goes up */}
          <div style={{ position: 'absolute', left: 14 * pt, right: 14 * pt, top: mix(318, 12, up) * pt, padding: `${13 * pt}px ${14 * pt}px`, borderRadius: 24 * pt,
            display: 'flex', alignItems: 'center', gap: 12 * pt, color: '#fff',
            background: 'linear-gradient(160deg, rgba(255,255,255,.28), rgba(255,255,255,.13))', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.5)',
            opacity: clamp(note * 1.4) * (1 - up), transform: `translateY(${-30 * pt * (1 - note)}px) scale(${mix(0.92, 1, note) * mix(1, 0.4, up)})` }}>
            <span style={{ width: 38 * pt, height: 38 * pt, borderRadius: 9 * pt, background: ORANGE, display: 'grid', placeItems: 'center', flex: 'none' }}><Fork s={22 * pt} /></span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 3 * pt, minWidth: 0 }}>
              <b style={{ font: `600 ${15 * pt}px/1.15 ${SANS}` }}>Din bestilling er modtaget</b>
              <span style={{ font: `400 ${14 * pt}px/1.2 ${SANS}`, color: 'rgba(255,255,255,.82)' }}>3 retter · afhentning kl. 17.30</span>
            </span>
            <span style={{ marginLeft: 'auto', alignSelf: 'flex-start', font: `400 ${12 * pt}px/1 ${SANS}`, color: 'rgba(255,255,255,.6)' }}>nu</span>
          </div>
        </div>
        <Img src={staticFile('ny/media/dev/iphone-17-pro-2x.webp')} style={{ position: 'absolute', left: PX, top: PY, width: PW, height: PH }} />

        {/* ---------- the Dynamic Island, over the frame's own ---------- */}
        <div style={{ position: 'absolute', left: SX + (SW - iw * pt) / 2, top: SY + 11 * pt, width: iw * pt, height: ih * pt, borderRadius: ir * pt, background: '#000', overflow: 'hidden',
          boxShadow: open > 0.1 ? `0 ${10 * pt}px ${30 * pt}px rgba(0,0,0,.4)` : 'none', transform: `scale(${1 + 0.035 * pulse})` }}>
          {/* compact: the icon left, the state right */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `0 ${10 * pt}px`, opacity: close }}>
            <span style={{ width: 22 * pt, height: 22 * pt, borderRadius: 6 * pt, background: ORANGE, display: 'grid', placeItems: 'center' }}><Fork s={14 * pt} /></span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 * pt, font: `600 ${13 * pt}px/1 ${SANS}`, color: GREEN }}><Check p={1} size={7} color={GREEN} width={3} />Klar</span>
          </div>
          {/* expanded: the Live Activity */}
          <div style={{ position: 'absolute', left: 0, top: 0, width: 380 * pt, height: 168 * pt, padding: `${22 * pt}px ${22 * pt}px`, color: '#fff',
            opacity: seg(open, 0.55, 1) * (1 - seg(close, 0, 0.4)) }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 * pt }}>
              <span style={{ width: 44 * pt, height: 44 * pt, borderRadius: 12 * pt, background: ORANGE, display: 'grid', placeItems: 'center', flex: 'none' }}><Fork s={26 * pt} /></span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 4 * pt }}>
                <span style={{ font: `500 ${13 * pt}px/1 ${SANS}`, color: 'rgba(255,255,255,.6)' }}>Din bestilling</span>
                <span style={{ position: 'relative', font: `600 ${19 * pt}px/1.1 ${SANS}`, color: ready > 0.5 ? GREEN : '#fff' }}>{status}</span>
              </span>
              <span style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <span style={{ display: 'block', font: `600 ${24 * pt}px/1 ${SANS}`, letterSpacing: -0.5 * pt }}>17.30</span>
                <span style={{ font: `500 ${12 * pt}px/1.4 ${SANS}`, color: 'rgba(255,255,255,.6)' }}>afhentning</span>
              </span>
            </div>
            {/* three steps, filled as they happen */}
            <div style={{ position: 'relative', marginTop: 24 * pt, height: 6 * pt, borderRadius: 3 * pt, background: 'rgba(255,255,255,.16)' }}>
              <i style={{ position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 3 * pt, width: `${100 * (steps[0] * 0.08 + steps[1] * 0.42 + steps[2] * 0.5)}%`, background: ready > 0.5 ? GREEN : ORANGE }} />
              {[0, 0.5, 1].map((x, i) => (
                <i key={i} style={{ position: 'absolute', left: `calc(${x * 100}% - ${7 * pt}px)`, top: -4 * pt, width: 14 * pt, height: 14 * pt, borderRadius: '50%',
                  background: steps[i] >= 1 ? (ready > 0.5 ? GREEN : ORANGE) : '#3A3A3C', boxShadow: `0 0 0 ${3 * pt}px #000` }} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 * pt, font: `500 ${12 * pt}px/1 ${SANS}`, color: 'rgba(255,255,255,.55)' }}>
              <span>Modtaget</span><span>Tilberedes</span><span>Klar</span>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
