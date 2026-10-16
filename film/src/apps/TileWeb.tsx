/* The Websites & motion tile: this very site, built in front of you. A
   window, the grid, the wireframe; then it fills in, a cursor presses "See
   what we build", the window steps back, and behind it the sites we have
   built fan out like a blade drawn: Spiis, Mosede Havnecafé, Callster. */
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { useT, useFonts, seg, out3, out5, io3, mix, clamp, SANS, SERIF, MONO } from './common';
import { TW } from './TileApps';

const NAVY9 = '#05080F', NAVY8 = '#101A33', DEEP = '#2B3F7C', PAPER = '#F6F4EF', GUIDE = 'rgba(110,150,255,.4)';
// the window, and the page inside it
const WX = 36, WY = 540, WW = TW - 72, WH = 800, BAR = 46;
const PX = WX, PY = WY + BAR, PW = WW, PH = WH - BAR;
// the phone on the page
const FW = 250, FX = PX + PW - FW - 46, FY = PY + 150, FH = FW * 2336 / 1120;
const SX = FX + FW * 0.0537, SY = FY + FH * 0.024, SW = FW * 0.8917, SH = FH * 0.952;

export const WEB_S = 7;
// callster.dk's first screen, from its own source: its logo, its colours,
// its words (the live site opens on an animation a screenshot cannot pass)
const CallsterSite: React.FC<{ h: number }> = ({ h }) => (
  <div style={{ position: 'relative', height: h, overflow: 'hidden', background: '#f5f5f7', color: '#14213d', fontFamily: SANS }}>
    <div style={{ position: 'absolute', inset: '-20% -10% auto', height: '120%', background: 'radial-gradient(38% 34% at 72% 30%, rgba(200,162,122,.34), transparent 70%), radial-gradient(30% 32% at 86% 62%, rgba(242,92,60,.2), transparent 70%)' }} />
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px' }}>
      <Img src={staticFile('film/assets/logos/callster-logo.svg')} style={{ height: 22 }} />
      <span style={{ padding: '9px 16px', borderRadius: 20, background: '#14213d', color: '#fff', font: `500 13px/1 ${SANS}` }}>Kom i gang</span>
    </div>
    <div style={{ position: 'relative', padding: '40px 28px 0' }}>
      <div style={{ font: `600 58px/1 ${SANS}`, letterSpacing: -2.4 }}>Din AI-<br />medarbejder.</div>
      <div style={{ marginTop: 18, maxWidth: 380, font: `400 16px/1.45 ${SANS}`, color: '#3d4a66' }}>Callster besvarer jeres opkald, booker tider og hjælper med det administrative. Du styrer det hele med en besked.</div>
      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <span style={{ padding: '12px 18px', borderRadius: 22, background: '#14213d', color: '#fff', font: `500 14px/1 ${SANS}` }}>Hør et eksempel</span>
        <span style={{ padding: '12px 18px', borderRadius: 22, background: 'rgba(255,255,255,.7)', boxShadow: 'inset 0 0 0 1px rgba(20,33,61,.12)', font: `500 14px/1 ${SANS}` }}>Kom i gang nu</span>
      </div>
    </div>
  </div>
);
// the fan: each site's window, how far it swings, and how far it rises
const FW2 = 600, FH2 = 430, FT = 600, PIVOT = 1480;
const FAN = [
  { url: 'spiis.dk', img: 'ny/media/pg/spiis-web.webp', pos: '50% 30%', a: -32, y: 60, z: 1 },
  { url: 'callster.dk', img: '', pos: '', a: 0, y: -20, z: 3 },
  { url: 'mosedehavnecafe.dk', img: 'ny/media/pg/mosede-web.webp', pos: '50% 40%', a: 32, y: 60, z: 2 },
];
export const TileWeb: React.FC = () => {
  useFonts();
  const { t, sp } = useT();
  const all = 1;
  const win = out5(seg(t, 0.1, 0.7));
  const grid = io3(seg(t, 0.5, 1.3));
  const wire = seg(t, 1.1, 1.8);
  const fill = io3(seg(t, 1.9, 2.7));
  const l1 = out5(seg(t, 2.3, 3.0)), l2 = out5(seg(t, 2.45, 3.15));
  const cta = out5(seg(t, 2.8, 3.4));
  const phone = sp(2.5, 16, 120);
  // the cursor comes in from the window's edge on a curve, slows onto the
  // button, which lights up under it; it presses, and the page answers
  const CLICK = 4.5;
  // a hand on a trackpad: a minimum-jerk path, gentle out and gentle in
  const cq = seg(t, 3.25, 4.3), cur = cq * cq * cq * (10 - 15 * cq + 6 * cq * cq);
  const hover = out3(seg(t, 4.05, 4.3));
  const press = Math.sin(Math.PI * seg(t, CLICK - 0.08, CLICK + 0.16));
  const click = 1 - 0.05 * press;
  const curFade = 1 - seg(t, CLICK + 0.2, CLICK + 0.5);
  // then into the phone, as the page does
  const zoom = 0, white = 0;
  // after the press: the window steps back and the others fan out behind it
  const back = io3(seg(t, CLICK + 0.1, CLICK + 0.8));
  const k = 1 + (Math.max(PW / SW, PH / SH) * 1.12 - 1) * zoom;
  const cx = SX + SW / 2, cy = SY + SH / 2, tcx = PX + PW / 2, tcy = PY + PH / 2;
  const tx = (cx + (tcx - cx) * zoom) - k * cx, ty = (cy + (tcy - cy) * zoom) - k * cy;

  const block = (x: number, y: number, w: number, h: number, r = 8) => (
    <i style={{ position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: r, border: `2px dashed ${GUIDE}`, opacity: wire * (1 - fill) }} />
  );
  const btnX = PX + 40, btnY = PY + 470;

  return (
    <AbsoluteFill style={{ background: `radial-gradient(110% 70% at 50% 100%, #0F1730, ${NAVY9} 70%)`, fontFamily: SANS, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: all }}>
        {/* ---------- the sites we have built, fanning out behind ---------- */}
        {/* a light behind the fan, as it opens */}
        <div style={{ position: 'absolute', left: TW / 2 - 520, top: 380, width: 1040, height: 760, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(70,100,200,.42), rgba(43,63,124,.12) 60%, transparent)', opacity: back }} />
        {FAN.map((f, i) => {
          // they open on springs that settle without swinging back and forth
          const o = sp(CLICK + 0.3 + i * 0.08, 24, 120);
          if (t < CLICK + 0.25) return null;
          const life = 0;
          return (
            <div key={f.url} style={{ position: 'absolute', left: TW / 2 - FW2 / 2, top: FT, width: FW2, height: FH2, borderRadius: 22, overflow: 'hidden', background: '#0A0D16',
              transformOrigin: `${FW2 / 2}px ${PIVOT - FT}px`, transform: `perspective(1600px) rotate(${f.a * o + life}deg) rotateY(${-f.a * 0.25 * o}deg) translateY(${f.y * o}px) translateZ(${-Math.abs(f.a) * 2 * o}px)`, opacity: clamp(o * 2),
              boxShadow: '0 40px 90px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.1), inset 0 1px 0 rgba(255,255,255,.18)', zIndex: f.z }}>
              <div style={{ height: 40, display: 'flex', alignItems: 'center', gap: 7, padding: '0 16px', background: '#151A26' }}>
                {['#FF5F57', '#FEBC2E', '#28C840'].map(c => <i key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
                <span style={{ margin: '0 auto', padding: '6px 34px', borderRadius: 8, background: 'rgba(255,255,255,.06)', font: `400 14px/1 ${SANS}`, color: '#A7AFC2' }}>{f.url}</span>
              </div>
              {f.img ? <Img src={staticFile(f.img)} style={{ width: '100%', height: FH2 - 40, objectFit: 'cover', objectPosition: f.pos }} /> : <CallsterSite h={FH2 - 40} />}
              {/* the glass of the screen: light along its top, a sheen across it */}
              <i style={{ position: 'absolute', inset: 0, background: 'linear-gradient(155deg, rgba(255,255,255,.14), rgba(255,255,255,0) 32%)', pointerEvents: 'none' }} />
            </div>
          );
        })}
        <div style={{ position: 'absolute', left: WX, top: WY, width: WW, height: WH, borderRadius: 22, overflow: 'hidden', background: '#0A0D16',
          boxShadow: '0 40px 90px rgba(0,0,0,.6), inset 0 0 0 1px rgba(255,255,255,.08)', opacity: win, transformOrigin: '50% 100%', zIndex: 5, transform: `translateY(${50 * (1 - win) + 64 * back}px) scale(${mix(0.95, 1, win) * mix(1, 0.6, back)})` }}>
          {/* the browser's bar */}
          <div style={{ height: BAR, display: 'flex', alignItems: 'center', gap: 8, padding: '0 18px', background: '#151A26', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
            {['#FF5F57', '#FEBC2E', '#28C840'].map(c => <i key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />)}
            <span style={{ margin: '0 auto', padding: '7px 60px', borderRadius: 9, background: 'rgba(255,255,255,.06)', font: `400 15px/1 ${SANS}`, color: '#A7AFC2' }}>lesreg.com</span>
          </div>
          {/* the page */}
          <div style={{ position: 'absolute', left: 0, top: BAR, width: PW, height: PH, overflow: 'hidden', background: `radial-gradient(70% 60% at 72% 46%, ${NAVY8}, ${NAVY9} 72%)` }}>
            <div style={{ position: 'absolute', inset: 0, background: '#0A0D16', opacity: 1 - fill }} />
            {/* the grid */}
            {[0, 1, 2, 3, 4, 5, 6].map(i => <i key={i} style={{ position: 'absolute', left: 40 + i * ((PW - 80) / 6), top: 0, width: 1.5, height: PH * grid, background: GUIDE, opacity: 1 - fill }} />)}
            {[0.22, 0.5, 0.78].map(y => <i key={y} style={{ position: 'absolute', top: PH * y, left: 0, height: 1.5, width: PW * grid, background: GUIDE, opacity: 0.6 * (1 - fill) }} />)}
            {/* the wireframe */}
            {block(24, 20, PW - 48, 52, 26)}
            {block(40, 190, 330, 64)}{block(40, 266, 300, 64)}
            {block(40, 380, 330, 18, 4)}{block(40, 408, 260, 18, 4)}
            {block(40, 470, 200, 50, 25)}{block(252, 470, 140, 50, 25)}
            {block(FX - PX, FY - PY, FW, FH, 40)}
          </div>
          {/* the page, filled in: moved and scaled together as the phone opens */}
          <div style={{ position: 'absolute', left: -WX, top: -WY, width: TW, height: 1400, transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${k})` }}>
            <div style={{ position: 'absolute', left: PX + 24, top: PY + 20, width: PW - 48, height: 52, borderRadius: 26, display: 'flex', alignItems: 'center', padding: '0 22px',
              background: 'rgba(255,255,255,.06)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.14)', opacity: fill, color: PAPER, font: `500 20px/1 ${SANS}` }}>
              Lesreg<span style={{ marginLeft: 10, font: `400 12px/1 ${MONO}`, color: '#8D96AC' }}>Softwarehus</span>
              <span style={{ marginLeft: 'auto', padding: '9px 16px', borderRadius: 18, background: PAPER, color: '#0E0F10', font: `500 14px/1 ${SANS}` }}>Skriv til os</span>
            </div>
            <div style={{ position: 'absolute', left: PX + 40, top: PY + 150, color: PAPER }}>
              <div style={{ font: `600 12px/1 ${SANS}`, letterSpacing: 1.2, color: '#D8D1C5', opacity: fill, marginBottom: 18 }}>LESREG · SOFTWAREHUS</div>
              <div style={{ overflow: 'hidden', paddingBottom: 8 }}><div style={{ font: `500 76px/.95 ${SANS}`, letterSpacing: -3.6, transform: `translateY(${140 * (1 - l1)}%)`, opacity: l1 > 0 ? 1 : 0 }}>Nutidens</div></div>
              <div style={{ overflow: 'hidden', paddingBottom: 12 }}><div style={{ font: `300 76px/.95 ${SERIF}`, fontStyle: 'italic', letterSpacing: -2, transform: `translateY(${140 * (1 - l2)}%)`, opacity: l2 > 0 ? 1 : 0 }}>softwarehus.</div></div>
              <div style={{ marginTop: 30, maxWidth: 330, font: `400 17px/1.5 ${SANS}`, color: '#D8D1C5', opacity: cta }}>Apps, systemer og integrationer — tegnet, bygget og drevet af ét hus.</div>
            </div>
            <div style={{ position: 'absolute', left: btnX, top: btnY, display: 'flex', gap: 12, opacity: cta, transform: `translateY(${14 * (1 - cta)}px)` }}>
              <span style={{ height: 50, padding: '0 22px', borderRadius: 25, display: 'flex', alignItems: 'center', background: PAPER, color: '#0E0F10', font: `500 16px/1 ${SANS}`,
                transform: `scale(${(1 + 0.02 * hover) * click})`, boxShadow: `0 0 ${30 * hover}px rgba(246,244,239,${0.45 * hover})` }}>Se hvad vi bygger →</span>
              <span style={{ height: 50, padding: '0 22px', borderRadius: 25, display: 'flex', alignItems: 'center', color: PAPER, font: `500 16px/1 ${SANS}`,
                background: 'linear-gradient(160deg, rgba(255,255,255,.16), rgba(255,255,255,.05))', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.45), inset 0 0 0 1px rgba(255,255,255,.16)' }}>Skriv til os</span>
            </div>
            {/* the cursor: inside the window, so it moves with it */}
            {cq > 0 && curFade > 0 && (() => {
              // from low on the right, on a soft curve, to the button's arrow
              const ax = btnX + PW - 150, ay = btnY + 300, bx = btnX + 168, by = btnY + 28, cx2 = btnX + 420, cy2 = btnY + 40;
              const x = (1 - cur) * (1 - cur) * ax + 2 * (1 - cur) * cur * cx2 + cur * cur * bx, y = (1 - cur) * (1 - cur) * ay + 2 * (1 - cur) * cur * cy2 + cur * cur * by;
              // macOS's arrow, at the page's own scale
              return <svg width="19" height="29" viewBox="0 0 12.6 19" style={{ position: 'absolute', left: x, top: y, zIndex: 9, opacity: curFade * clamp(cq / 0.12),
                filter: 'drop-shadow(0 1px 1.5px rgba(0,0,0,.4))' }}><path d="M1 1v14.6l3.6-3.4 2.4 5.5 2.4-1-2.4-5.4h4.8z" fill="#000" stroke="#fff" strokeWidth="1.1" strokeLinejoin="round" /></svg>;
            })()}
            {/* the phone, and its screen that turns to paper */}
            <div style={{ position: 'absolute', left: SX, top: SY, width: SW, height: SH, borderRadius: '13% / 6.2%', overflow: 'hidden',
              background: `radial-gradient(130% 70% at 50% 0%, #3A55A8 0%, ${DEEP} 18%, ${NAVY8} 52%, ${NAVY9} 100%)`, opacity: clamp(phone * 1.5), transform: `translateY(${60 * (1 - phone)}px)` }}>
              <div style={{ position: 'absolute', top: '13%', left: 0, right: 0, textAlign: 'center', color: '#fff', font: `600 ${SW * 0.24}px/1 ${SANS}`, letterSpacing: -2 }}>9:41</div>
              <i style={{ position: 'absolute', inset: 0, background: PAPER, opacity: white }} />
            </div>
            <Img src={staticFile('ny/media/dev/iphone-17-pro-2x.webp')} style={{ position: 'absolute', left: FX, top: FY, width: FW, height: FH, opacity: clamp(phone * 1.5), transform: `translateY(${60 * (1 - phone)}px)` }} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
