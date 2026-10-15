/* The Systems tile, as it happens at Spiis: a real kitchen at evening
   service (photographed with Higgsfield), and on the iPad at the pass the
   kitchen screen of Spiis' own system, drawn from the app's design. A
   guest orders on the website; the order lands on the screen, and the
   day's counts go up. One screen, one moment. */
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { useT, useFonts, seg, out3, out5, mix, clamp, Check, SANS, SERIF } from './common';
import { TW, TH } from './TileApps';

export const SYS_S = 6.2;

// the photograph, and where the iPad's screen is in it (its four corners,
// in the photograph's own pixels: top left, top right, bottom right, bottom left)
export const PHOTO = { src: 'film/assets/kitchen.webp', w: 2160, h: 3857 };
export const SCREEN: [number, number][] = [[647, 2188], [1527, 2171], [1608, 2731], [691, 2777]];
// the camera: how close, and where the screen's middle sits in the tile
const CAM = { k: 0.82, x: TW / 2, y: 1010 };

// the kitchen screen is drawn at an iPad's size and then set into the photo
const UW = 900, UH = 625;
const CREAM = '#F4EFE8', CARD = '#FFFFFF', INK = '#1E1915', MUTE = '#8A7F74', ORANGE = '#C8642B', PEACH = '#FBEBDD', DARK = '#1F1A17', GREEN = '#2F9E5B';

// a CSS matrix3d that sets a w×h rectangle onto four points
function quad(w: number, h: number, q: [number, number][]) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / den, hh = (dx1 * dy3 - dx3 * dy1) / den;
  const a = x1 - x0 + g * x1, b = x3 - x0 + hh * x3, c = x0, d = y1 - y0 + g * y1, e = y3 - y0 + hh * y3, f = y0;
  // unit square to the quad, after scaling the rectangle to the unit square
  const m = [a / w, d / w, 0, g / w, b / h, e / h, 0, hh / h, 0, 0, 1, 0, c, f, 0, 1];
  return `matrix3d(${m.map(v => v.toFixed(8)).join(',')})`;
}

const Chip: React.FC<{ children: React.ReactNode; bg?: string; color?: string; glow?: number }> = ({ children, bg = '#FBF8F3', color = INK, glow = 0 }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderRadius: 30, background: bg, color, font: `600 22px/1 ${SANS}`,
    boxShadow: `inset 0 0 0 1.5px rgba(30,25,21,.08), 0 0 0 ${3 * glow}px rgba(200,100,43,${0.7 * glow})` }}>{children}</span>
);

const Order: React.FC<{ when: string; what: string; isNew?: boolean; glow?: number }> = ({ when, what, isNew, glow = 0 }) => (
  <div style={{ borderRadius: 22, background: PEACH, padding: '18px 22px', boxShadow: `inset 0 0 0 2px rgba(200,100,43,${0.35 + 0.6 * glow}), 0 0 ${30 * glow}px rgba(200,100,43,${0.45 * glow})` }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, font: `500 18px/1 ${SANS}`, color: MUTE }}>
      <span style={{ padding: '6px 10px', borderRadius: 8, background: '#fff', color: ORANGE, font: `600 15px/1 ${SANS}` }}>To-go</span>
      {isNew && <span style={{ padding: '6px 10px', borderRadius: 8, background: ORANGE, color: '#fff', font: `600 15px/1 ${SANS}` }}>Ny</span>}
      <span style={{ marginLeft: 'auto', font: `600 22px/1 ${SANS}`, color: INK }}>kl. {when}</span>
    </div>
    <div style={{ marginTop: 12, font: `500 24px/1.2 ${SANS}`, color: INK }}>{what} <span style={{ color: ORANGE, font: `600 17px/1 ${SANS}` }}>Dagens ret</span></div>
    <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
      <span style={{ flex: 1, padding: '12px 0', borderRadius: 14, background: '#E3F3E8', color: GREEN, textAlign: 'center', font: `600 19px/1 ${SANS}` }}>✓ Færdig</span>
      <span style={{ width: 54, borderRadius: 14, background: '#fff', display: 'grid', placeItems: 'center', color: MUTE, font: `600 20px/1 ${SANS}` }}>···</span>
    </div>
  </div>
);

// Spiis' kitchen screen, at an iPad's size
const Kitchen: React.FC<{ t: number; sp: (a: number, d?: number, s?: number) => number }> = ({ t, sp }) => {
  const bell = out3(seg(t, 1.0, 1.3)) * (1 - seg(t, 3.2, 3.6));
  const land = sp(1.5, 15, 140);
  const count = seg(t, 1.7, 2.3);
  const glow = 1 - seg(t, 3.2, 4.4);
  return (
    <div style={{ width: UW, height: UH, background: CREAM, fontFamily: SANS, overflow: 'hidden', position: 'relative' }}>
      <div style={{ height: 70, background: DARK, display: 'flex', alignItems: 'center', gap: 12, padding: '0 30px', color: '#F4EFE8' }}>
        <svg width="30" height="30" viewBox="0 0 24 24"><path d="M7 18h10v3H7zM6 14c-2.5 0-4-2-4-4s1.7-3.7 3.8-3.6C6.4 4.4 8.4 3 10.5 3c1.5 0 2.8.6 3.6 1.6A4 4 0 0 1 22 8c0 2.6-2 4.5-4.4 4.6L17 18H7z" fill="none" stroke="#F4EFE8" strokeWidth="1.6" strokeLinejoin="round" /></svg>
        <b style={{ font: `700 26px/1 ${SANS}` }}>Spiis</b><span style={{ font: `600 15px/1 ${SANS}`, color: '#E0703A' }}>Admin</span>
        <span style={{ marginLeft: 'auto', font: `400 18px/1 ${SANS}`, color: '#CFC5BA' }}>Køkkenet</span>
      </div>
      <div style={{ display: 'flex', gap: 24, padding: 26 }}>
        {/* the day */}
        <div style={{ width: 360, background: CARD, borderRadius: 26, padding: 24, boxShadow: '0 2px 10px rgba(30,25,21,.06)' }}>
          <div style={{ font: `700 34px/1 ${SERIF}`, fontStyle: 'normal', color: INK, fontFamily: "Georgia, 'Newsreader', serif" }}>Bestillinger</div>
          <div style={{ marginTop: 18, font: `400 19px/1.45 ${SANS}`, color: '#5A5149' }}>I dag · <b style={{ color: INK }}>{Math.round(mix(6, 7, out3(count)))} bestillinger</b></div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14, marginTop: 22 }}>
            <Chip glow={count > 0 ? glow : 0}><span style={{ font: `700 28px/1 Georgia, serif`, color: ORANGE }}>{Math.round(mix(14, 17, out3(count)))}</span>Mørbradgryde med ris</Chip>
            <Chip bg="#FBE3CF" color={ORANGE}>🔥 {Math.round(mix(6, 7, out3(count)))} mangler at blive kørt</Chip>
          </div>
        </div>
        {/* what is still to go out */}
        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, font: `700 24px/1 Georgia, serif`, color: INK }}>🔥 Mangler</div>
          <div style={{ position: 'relative', marginTop: 18 }}>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, opacity: clamp(land * 1.5), transform: `translateY(${-60 * (1 - land)}px) scale(${mix(0.94, 1, land)})`, zIndex: 2 }}>
              <Order when="17.30" what="3 × Mørbradgryde med ris" isNew glow={glow * clamp(land)} />
            </div>
            <div style={{ transform: `translateY(${206 * land}px)` }}>
              <Order when="17.00" what="2 × Mørbradgryde med ris" />
            </div>
          </div>
        </div>
      </div>
      {/* the new order arrives */}
      <div style={{ position: 'absolute', right: 26, top: 84, display: 'flex', alignItems: 'center', gap: 14, padding: '16px 22px', borderRadius: 22, background: DARK, color: '#F4EFE8',
        boxShadow: '0 16px 40px rgba(0,0,0,.3)', opacity: bell, transform: `translateY(${-30 * (1 - bell)}px)`, font: `600 21px/1 ${SANS}`, zIndex: 5 }}>
        <span style={{ width: 36, height: 36, borderRadius: '50%', background: ORANGE, display: 'grid', placeItems: 'center' }}>🔔</span>Ny bestilling · kl. 17.30
      </div>
    </div>
  );
};

export const TileSys: React.FC = () => {
  useFonts();
  const { t, sp } = useT();
  // the photograph covers the tile, lower part in view; a slow push-in
  const k = CAM.k, mx = (SCREEN[0][0] + SCREEN[2][0]) / 2, my = (SCREEN[0][1] + SCREEN[2][1]) / 2;
  const ox = CAM.x - mx * k, oy = CAM.y - my * k, pw = PHOTO.w * k, ph = PHOTO.h * k;
  const push = mix(1, 1.05, out5(seg(t, 0, SYS_S)));
  const q = SCREEN.map(([x, y]) => [x * k + ox, y * k + oy] as [number, number]);
  return (
    <AbsoluteFill style={{ background: '#0B0908', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, transformOrigin: `${(q[0][0] + q[2][0]) / 2}px ${(q[0][1] + q[2][1]) / 2}px`, transform: `scale(${push})` }}>
        <Img src={staticFile(PHOTO.src)} style={{ position: 'absolute', left: ox, top: oy, width: pw, height: ph }} />
        <div style={{ position: 'absolute', left: 0, top: 0, width: UW, height: UH, transformOrigin: '0 0', transform: quad(UW, UH, q) }}>
          <Kitchen t={t} sp={sp} />
          {/* the screen's own glass: a faint sheen, and a little of the room's warmth */}
          <i style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(255,255,255,.10), rgba(255,255,255,0) 40%), linear-gradient(rgba(255,170,90,.05), rgba(255,170,90,.05))' }} />
        </div>
      </div>
      {/* the top of the tile, quiet for its words */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 640, background: 'linear-gradient(rgba(11,9,8,.85), rgba(11,9,8,.55) 55%, rgba(11,9,8,0))' }} />
    </AbsoluteFill>
  );
};
