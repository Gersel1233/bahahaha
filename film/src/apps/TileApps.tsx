/* The Apps tile: what makes an app of today, the way iOS itself does it.
   The order's notification lands on the lock screen and becomes a Live
   Activity; the Dynamic Island carries the same order, small, while the
   bar fills; when it is ready the island opens with the news, then closes
   back over the camera with a green tick. A demonstration of the kind of
   app we build, under no client's name. */
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { useT, useFonts, seg, out3, out5, io3, mix, clamp, Check, SANS } from './common';

export const TILE_S = 8;
export const APPS_S = 6.4;
export const TW = 840, TH = 1400;

const NAVY9 = '#05080F', NAVY8 = '#101A33', DEEP = '#2B3F7C', ORANGE = '#F08A3E', ORANGE2 = '#E0612A', GREEN = '#30D158';
// the phone, and its screen inside the render (measured off the frame)
const PW = 780, PX = (TW - PW) / 2, PY = 560, PH = PW * 2336 / 1120;
const SX = PX + PW * 0.0537, SY = PY + PH * 0.024, SW = PW * 0.8917, SHh = PH * 0.952;
const pt = SW / 402; // one iOS point on this screen
// the hardware island, in points from the screen's top left
const ISL = { top: 12.9, h: 37.1, w: 125.7, cx: 201.2 };

const Fork: React.FC<{ s: number; c?: string }> = ({ s, c = '#fff' }) => (
  <svg width={s} height={s} viewBox="0 0 24 24"><path d="M7 3v7a2 2 0 0 0 2 2v9M11 3v7M7 3v4m4-4v4M17 3c-1.7 1-2.5 3-2.5 6s1 4 2.5 4v8" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
// an example, not a client: the app is yours
const AppIcon: React.FC<{ s: number }> = ({ s }) => (
  <Img src={staticFile('ny/media/ic/jeres.svg')} style={{ width: s, height: s, borderRadius: s * 0.24, flex: 'none' }} />
);

// a bar that fills, with a light at its head
const Bar: React.FC<{ p: number; done: number; h: number }> = ({ p, done, h }) => (
  <div style={{ position: 'relative', height: h, borderRadius: h / 2, background: 'rgba(255,255,255,.16)', overflow: 'hidden' }}>
    <i style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${100 * p}%`, borderRadius: h / 2,
      background: done > 0 ? `linear-gradient(90deg, rgba(48,209,88,${0.7 + 0.3 * done}), ${GREEN})` : `linear-gradient(90deg, ${ORANGE2}, ${ORANGE})` }} />
    {p > 0.02 && p < 0.995 && <i style={{ position: 'absolute', top: -h, bottom: -h, width: h * 5, left: `calc(${100 * p}% - ${h * 3}px)`,
      background: 'radial-gradient(closest-side, rgba(255,220,180,.9), rgba(255,220,180,0))' }} />}
  </div>
);

export const TileApps: React.FC = () => {
  useFonts();
  const { t, sp } = useT();

  // 1. the notification lands
  const note = sp(0.35, 17, 190);
  // 2. it becomes the Live Activity, and the island takes the order too
  const live = io3(seg(t, 1.25, 1.75));
  const compactIn = sp(1.45, 18, 200);
  const fill = clamp(seg(t, 1.6, 3.55) ** 0.9);
  const cooking = seg(t, 2.1, 2.35);
  // 3. ready: the island opens with the news
  const open = sp(3.6, 14, 150);
  const ready = out3(seg(t, 3.55, 3.8));
  // 4. and closes again, over the camera, with a tick
  const close = sp(4.75, 16, 170);
  const opened = clamp(open) * (1 - clamp(close));

  // the island's size: hardware → compact → expanded → compact
  const compactW = 212;
  const w = mix(mix(ISL.w, compactW, clamp(compactIn)), 384, opened);
  const h = mix(ISL.h, 172, opened);
  const r = mix(ISL.h / 2, 46, opened);
  const status = ready > 0.5 ? 'Klar til afhentning' : cooking > 0.5 ? 'Tilberedes' : 'Modtaget';

  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 70% at 50% 100%, ${DEEP}, ${NAVY8} 48%, ${NAVY9})`, fontFamily: SANS, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: PX - 120, top: PY - 160, width: PW + 240, height: PW + 240, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(70,100,200,.35), transparent)' }} />

      {/* ---------- the lock screen ---------- */}
      <div style={{ position: 'absolute', left: SX, top: SY, width: SW, height: SHh, borderRadius: '13% / 6.2%', overflow: 'hidden',
        background: `radial-gradient(130% 70% at 50% 0%, #3A55A8 0%, ${DEEP} 18%, ${NAVY8} 52%, ${NAVY9} 100%)` }}>
        <div style={{ position: 'absolute', top: 76 * pt, left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,.88)', font: `600 ${18 * pt}px/1 ${SANS}` }}>Torsdag 15. oktober</div>
        <div style={{ position: 'absolute', top: 98 * pt, left: 0, right: 0, textAlign: 'center', color: '#fff', font: `600 ${92 * pt}px/1 ${SANS}`, letterSpacing: -3 * pt }}>9:41</div>

        {/* the notification, then the Live Activity it becomes: one glass card that grows */}
        <div style={{ position: 'absolute', left: 14 * pt, right: 14 * pt, top: 236 * pt, height: mix(70, 132, live) * pt, borderRadius: 26 * pt, overflow: 'hidden',
          background: `linear-gradient(160deg, rgba(255,255,255,${mix(0.28, 0.2, live)}), rgba(255,255,255,${mix(0.13, 0.08, live)}))`,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.5), inset 0 0 0 1px rgba(255,255,255,.12), 0 20px 40px rgba(0,0,0,.25)',
          opacity: clamp(note * 1.4), transform: `translateY(${40 * pt * (1 - note)}px) scale(${mix(0.92, 1, note)})`, color: '#fff' }}>
          {/* as a notification */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 12 * pt, padding: `0 ${14 * pt}px`, opacity: 1 - seg(live, 0, 0.4) }}>
            <AppIcon s={38 * pt} />
            <span style={{ display: 'flex', flexDirection: 'column', gap: 3 * pt, flex: 1, minWidth: 0 }}>
              <span style={{ font: `500 ${12 * pt}px/1 ${SANS}`, color: 'rgba(255,255,255,.6)', letterSpacing: 0.3 * pt }}>JERES APP</span>
              <b style={{ font: `600 ${15 * pt}px/1.15 ${SANS}` }}>Din bestilling er modtaget</b>
              <span style={{ font: `400 ${14 * pt}px/1.2 ${SANS}`, color: 'rgba(255,255,255,.8)' }}>3 retter · afhentning kl. 17.30</span>
            </span>
            <span style={{ alignSelf: 'flex-start', marginTop: 14 * pt, font: `400 ${12 * pt}px/1 ${SANS}`, color: 'rgba(255,255,255,.6)' }}>nu</span>
          </div>
          {/* as a Live Activity */}
          <div style={{ position: 'absolute', inset: 0, padding: `${16 * pt}px ${18 * pt}px`, opacity: seg(live, 0.45, 1) }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 * pt }}>
              <AppIcon s={40 * pt} />
              <span style={{ display: 'flex', flexDirection: 'column', gap: 4 * pt, flex: 1 }}>
                <span style={{ font: `500 ${13 * pt}px/1 ${SANS}`, color: 'rgba(255,255,255,.65)' }}>Jeres app · din bestilling</span>
                <span style={{ position: 'relative', height: 20 * pt }}>
                  {['Modtaget', 'Tilberedes', 'Klar til afhentning'].map((s, i) => {
                    const on = s === status ? 1 : 0;
                    return <span key={s} style={{ position: 'absolute', left: 0, top: 0, whiteSpace: 'nowrap', font: `600 ${18 * pt}px/1.1 ${SANS}`, color: i === 2 ? GREEN : '#fff',
                      opacity: on, transform: `translateY(${(1 - on) * 6 * pt}px)` }}>{s}</span>;
                  })}
                </span>
              </span>
              <span style={{ textAlign: 'right' }}>
                <span style={{ display: 'block', font: `600 ${24 * pt}px/1 ${SANS}`, letterSpacing: -0.5 * pt }}>17.30</span>
                <span style={{ font: `500 ${12 * pt}px/1.5 ${SANS}`, color: 'rgba(255,255,255,.6)' }}>afhentning</span>
              </span>
            </div>
            <div style={{ marginTop: 18 * pt }}><Bar p={fill} done={ready} h={7 * pt} /></div>
          </div>
        </div>
      </div>
      <Img src={staticFile('ny/media/dev/iphone-17-pro-2x.webp')} style={{ position: 'absolute', left: PX, top: PY, width: PW, height: PH }} />

      {/* ---------- the Dynamic Island, exactly over the camera's ---------- */}
      <div style={{ position: 'absolute', left: SX + (ISL.cx - w / 2) * pt, top: SY + ISL.top * pt - 0.6 * pt, width: w * pt, height: (h + 1.2) * pt, borderRadius: (r + 0.6) * pt,
        background: '#000', overflow: 'hidden', boxShadow: opened > 0.05 ? `0 ${12 * pt}px ${34 * pt}px rgba(0,0,0,.45)` : 'none' }}>
        {/* compact: the order on the left, its state on the right */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: (ISL.h + 1.2) * pt, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `0 ${9 * pt}px`,
          opacity: clamp(compactIn) * (1 - seg(opened, 0, 0.25)) }}>
          <AppIcon s={23 * pt} />
          <span style={{ position: 'relative', width: 54 * pt, height: 22 * pt }}>
            {/* while it cooks: a ring that fills; when ready: the tick */}
            <svg width={22 * pt} height={22 * pt} viewBox="0 0 24 24" style={{ position: 'absolute', right: 0, top: 0, opacity: 1 - ready }}>
              <circle cx="12" cy="12" r="9" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="3" />
              <circle cx="12" cy="12" r="9" fill="none" stroke={ORANGE} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${56.5 * fill} 56.5`} transform="rotate(-90 12 12)" />
            </svg>
            <span style={{ position: 'absolute', right: 0, top: 0, height: 22 * pt, display: 'flex', alignItems: 'center', gap: 4 * pt, font: `600 ${14 * pt}px/1 ${SANS}`, color: GREEN, opacity: ready }}>
              <Check p={seg(t, 4.85, 5.2)} size={7.5} color={GREEN} width={3.4} />Klar</span>
          </span>
        </div>
        {/* expanded: the news */}
        <div style={{ position: 'absolute', left: 0, top: 0, width: 384 * pt, height: 172 * pt, padding: `${24 * pt}px ${24 * pt}px`, color: '#fff',
          opacity: seg(opened, 0.55, 1), transform: `scale(${mix(0.9, 1, seg(opened, 0.4, 1))})`, transformOrigin: '50% 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 * pt }}>
            <AppIcon s={48 * pt} />
            <span style={{ display: 'flex', flexDirection: 'column', gap: 5 * pt, flex: 1 }}>
              <span style={{ font: `500 ${13 * pt}px/1 ${SANS}`, color: 'rgba(255,255,255,.6)' }}>Jeres app · din bestilling</span>
              <span style={{ font: `600 ${21 * pt}px/1.1 ${SANS}`, color: GREEN }}>Klar til afhentning</span>
            </span>
            <span style={{ width: 46 * pt, height: 46 * pt, borderRadius: '50%', background: GREEN, display: 'grid', placeItems: 'center', flex: 'none',
              transform: `scale(${mix(0.4, 1, out5(seg(t, 3.75, 4.15)))})` }}><Check p={seg(t, 3.85, 4.25)} size={12} color="#fff" width={3.4} /></span>
          </div>
          <div style={{ marginTop: 22 * pt }}><Bar p={1} done={1} h={7 * pt} /></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 * pt, font: `500 ${12 * pt}px/1 ${SANS}`, color: 'rgba(255,255,255,.55)' }}>
            <span>Bestilt 17.02</span><span>Hent den nu</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
