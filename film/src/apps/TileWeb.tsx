/* The Websites & motion tile: this very site, built in front of you. A
   window, the grid, the wireframe; then it fills in, a cursor finds the
   button, and the phone opens into the white the way the real page does. */
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

export const TileWeb: React.FC = () => {
  useFonts();
  const { t, sp } = useT();
  const all = seg(t, 0, 0.4) * (1 - seg(t, 7.4, 7.95));
  const win = out5(seg(t, 0.1, 0.7));
  const grid = io3(seg(t, 0.5, 1.3));
  const wire = seg(t, 1.1, 1.8);
  const fill = io3(seg(t, 1.9, 2.7));
  const l1 = out5(seg(t, 2.3, 3.0)), l2 = out5(seg(t, 2.45, 3.15));
  const cta = out5(seg(t, 2.8, 3.4));
  const phone = sp(2.5, 16, 120);
  // the cursor comes in and finds the button
  const cur = io3(seg(t, 3.4, 4.3));
  const hover = out3(seg(t, 4.2, 4.45)) * (1 - seg(t, 4.9, 5.1));
  const click = t > 4.55 && t < 4.7 ? 0.96 : 1;
  // then into the phone, as the page does
  const zoom = io3(seg(t, 5.15, 6.15));
  const white = seg(t, 4.95, 5.3), words = out5(seg(t, 5.9, 6.5));
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
        <div style={{ position: 'absolute', left: WX, top: WY, width: WW, height: WH, borderRadius: 22, overflow: 'hidden', background: '#0A0D16',
          boxShadow: '0 40px 90px rgba(0,0,0,.6), inset 0 0 0 1px rgba(255,255,255,.08)', opacity: win, transform: `translateY(${50 * (1 - win)}px) scale(${mix(0.95, 1, win)})` }}>
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
                transform: `scale(${(1 + 0.05 * hover) * click})`, boxShadow: `0 0 ${30 * hover}px rgba(246,244,239,${0.45 * hover})` }}>Se hvad vi bygger →</span>
              <span style={{ height: 50, padding: '0 22px', borderRadius: 25, display: 'flex', alignItems: 'center', color: PAPER, font: `500 16px/1 ${SANS}`,
                background: 'linear-gradient(160deg, rgba(255,255,255,.16), rgba(255,255,255,.05))', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.45), inset 0 0 0 1px rgba(255,255,255,.16)' }}>Skriv til os</span>
            </div>
            {/* the phone, and its screen that turns to paper */}
            <div style={{ position: 'absolute', left: SX, top: SY, width: SW, height: SH, borderRadius: '13% / 6.2%', overflow: 'hidden',
              background: `radial-gradient(130% 70% at 50% 0%, #3A55A8 0%, ${DEEP} 18%, ${NAVY8} 52%, ${NAVY9} 100%)`, opacity: clamp(phone * 1.5), transform: `translateY(${60 * (1 - phone)}px)` }}>
              <div style={{ position: 'absolute', top: '13%', left: 0, right: 0, textAlign: 'center', color: '#fff', font: `600 ${SW * 0.24}px/1 ${SANS}`, letterSpacing: -2 }}>9:41</div>
              <i style={{ position: 'absolute', inset: 0, background: PAPER, opacity: white }} />
            </div>
            <Img src={staticFile('ny/media/dev/iphone-17-pro-2x.webp')} style={{ position: 'absolute', left: FX, top: FY, width: FW, height: FH, opacity: clamp(phone * 1.5), transform: `translateY(${60 * (1 - phone)}px)` }} />
          </div>
          {/* inside: the white world and its sentence */}
          <div style={{ position: 'absolute', left: 0, top: BAR, width: PW, height: PH, background: PAPER, opacity: seg(zoom, 0.85, 1), display: 'grid', placeItems: 'center', textAlign: 'center' }}>
            <div style={{ font: `500 54px/1.1 ${SANS}`, letterSpacing: -2.2, color: '#0E0F10', opacity: words, transform: `translateY(${30 * (1 - words)}px)` }}>Vi bygger apps,<br />systemer og<br /><span style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 300 }}>integrationer.</span></div>
          </div>
        </div>
        {/* the cursor */}
        {cur > 0 && t < 5.1 && (
          <svg width="34" height="40" viewBox="0 0 17 20" style={{ position: 'absolute', left: mix(TW - 60, btnX + 150, cur), top: mix(1380, btnY + 30, cur), filter: 'drop-shadow(0 3px 6px rgba(0,0,0,.4))', transform: `scale(${click})` }}>
            <path d="M1 1v15l4-4 3 7 3-1.4-3-6.6h6z" fill="#fff" stroke="#000" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </AbsoluteFill>
  );
};
