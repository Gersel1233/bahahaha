/* The Integrations tile, with the real apps: the ones Lesreg has connected —
   Shopify, Flatpay, e-conomic, Dinero, Planway, OnlinePOS — in a row, Lesreg
   in the middle, and what happens between them landing as notifications,
   one after another, each from its own app. The logos are the providers'
   own marks, used to name the integration. */
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { useT, useFonts, seg, out5, io3, mix, clamp, SANS, MONO } from './common';
import { TW } from './TileApps';

export const INT_S = 6.2;

const NAVY9 = '#05080F', NAVY8 = '#101A33', DEEP = '#2B3F7C', PAPER = '#F6F4EF';
type App = { k: string; n: string; logo: string; bg: string; pad: number };
const APPS: App[] = [
  { k: 'shopify', n: 'Shopify', logo: '', bg: '#fff', pad: 16 },
  { k: 'flatpay', n: 'Flatpay', logo: 'film/assets/logos/flatpay.png', bg: '#000', pad: 0 },
  { k: 'economic', n: 'e-conomic', logo: 'film/assets/logos/economic.svg', bg: '#fff', pad: 16 },
  { k: 'dinero', n: 'Dinero', logo: 'film/assets/logos/dinero.svg', bg: '#fff', pad: 18 },
  { k: 'planway', n: 'Planway', logo: 'film/assets/logos/planway.png', bg: '#fff', pad: 14 },
  { k: 'onlinepos', n: 'OnlinePOS', logo: 'film/assets/logos/onlinepos.png', bg: '#E2001A', pad: 0 },
];
// what happens, and from which app
const EVENTS = [
  { at: 0.7, app: 0, title: 'Ny ordre #1042', body: 'Betalt online · afhentes kl. 17.30' },
  { at: 1.75, app: 2, title: 'Faktura bogført', body: '#1042 er sendt til regnskabet' },
  { at: 2.8, app: 1, title: 'Kortbetaling registreret', body: 'Bon #2207 · i butikken' },
  { at: 3.85, app: 4, title: 'Ny booking', body: 'Torsdag kl. 17.30 · 4 personer' },
];
const IW = 92, IG = 24, IX = (TW - (APPS.length * IW + (APPS.length - 1) * IG)) / 2, IY = 584;
const CORE_Y = 760, STACK_Y = 836, CH = 124, CG = 12;
const SHOPIFY = 'M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.114-.192-.211-.192s-1.929-.136-1.929-.136-1.275-1.274-1.439-1.411c-.045-.037-.075-.057-.121-.074l-.914 21.104h.023zM11.71 11.305s-.81-.424-1.774-.424c-1.447 0-1.504.906-1.504 1.141 0 1.232 3.24 1.715 3.24 4.629 0 2.295-1.44 3.76-3.406 3.76-2.354 0-3.54-1.465-3.54-1.465l.646-2.086s1.245 1.066 2.28 1.066c.675 0 .975-.545.975-.932 0-1.619-2.654-1.694-2.654-4.359-.034-2.237 1.571-4.416 4.827-4.416 1.257 0 1.875.361 1.875.361l-.945 2.715-.02.01zM11.17.83c.136 0 .271.038.405.135-.984.465-2.064 1.639-2.508 3.992-.656.213-1.293.405-1.889.578C7.697 3.75 8.951.84 11.17.84V.83zm1.235 2.949v.135c-.754.232-1.583.484-2.394.736.466-1.777 1.333-2.645 2.085-2.971.193.501.309 1.176.309 2.1zm.539-2.234c.694.074 1.141.867 1.429 1.755-.349.114-.735.231-1.158.366v-.252c0-.752-.096-1.371-.271-1.871v.002zm2.992 1.289c-.02 0-.06.021-.078.021s-.289.075-.714.21c-.423-1.233-1.176-2.37-2.508-2.37h-.115C12.135.209 11.669 0 11.265 0 8.159 0 6.675 3.877 6.21 5.846c-1.194.365-2.063.636-2.16.674-.675.213-.694.232-.772.87-.075.462-1.83 14.063-1.83 14.063L15.009 24l.927-21.166z';

const Icon: React.FC<{ a: App; size: number; style?: React.CSSProperties }> = ({ a, size, style }) => {
  const inner = a.pad ? size - (a.pad * 2 * size) / IW : size;
  return (
    <span style={{ width: size, height: size, borderRadius: size * 0.235, background: a.bg, overflow: 'hidden', display: 'grid', placeItems: 'center', flex: 'none',
      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.06)', ...style }}>
      {a.k === 'shopify'
        ? <svg width={inner} height={inner} viewBox="0 0 24 24"><path fill="#95BF47" d={SHOPIFY} /></svg>
        : <Img src={staticFile(a.logo)} style={{ width: inner, height: inner, objectFit: 'contain' }} />}
    </span>
  );
};

export const TileInt: React.FC = () => {
  useFonts();
  const { t, sp } = useT();
  const cx = (i: number) => IX + i * (IW + IG) + IW / 2;
  // which app is speaking now
  const live = (i: number) => EVENTS.reduce((m, e) => (e.app === i ? Math.max(m, Math.sin(Math.PI * clamp(seg(t, e.at - 0.45, e.at + 0.35)))) : m), 0);
  const corePulse = EVENTS.reduce((m, e) => Math.max(m, Math.sin(Math.PI * clamp(seg(t, e.at - 0.15, e.at + 0.25)))), 0);
  const done = out5(seg(t, 4.85, 5.25));
  const y0 = IY + IW + 34, y1 = CORE_Y - 26;
  const curve = (x0: number, u: number) => {
    const iu = 1 - u, x1 = TW / 2;
    return {
      x: iu * iu * iu * x0 + 3 * iu * iu * u * x0 + 3 * iu * u * u * x1 + u * u * u * x1,
      y: iu * iu * iu * y0 + 3 * iu * iu * u * (CORE_Y - 20) + 3 * iu * u * u * (IY + IW + 30) + u * u * u * y1,
    };
  };

  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 70% at 50% 100%, ${DEEP}, ${NAVY8} 48%, ${NAVY9})`, fontFamily: SANS, overflow: 'hidden', color: PAPER }}>
      {/* ---------- the lines from each app into Lesreg ---------- */}
      <svg width={TW} height={1400} style={{ position: 'absolute', inset: 0 }}>
        {APPS.map((a, i) => {
          const x = cx(i), l = live(i);
          return <path key={a.k} d={`M${x},${y0} C${x},${CORE_Y - 20} ${TW / 2},${IY + IW + 30} ${TW / 2},${y1}`} fill="none"
            stroke={l > 0 ? `rgba(140,170,255,${0.25 + 0.6 * l})` : 'rgba(255,255,255,.12)'} strokeWidth={2 + 2 * l} />;
        })}
      </svg>
      {/* the light, from the app that speaks into the middle */}
      {EVENTS.map((e, k) => {
        const q = io3(seg(t, e.at - 0.45, e.at - 0.05));
        if (q <= 0 || q >= 1) return null;
        const p = curve(cx(e.app), q);
        return <i key={k} style={{ position: 'absolute', left: p.x - 9, top: p.y - 9, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 0 24px 8px rgba(120,160,255,.7)' }} />;
      })}

      {/* ---------- the apps ---------- */}
      {APPS.map((a, i) => {
        const l = live(i), e = out5(seg(t, i * 0.05, 0.45 + i * 0.05));
        return (
          <div key={a.k} style={{ position: 'absolute', left: IX + i * (IW + IG), top: IY, width: IW, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            opacity: mix(0.55, 1, Math.max(l, e * 0.7)), transform: `translateY(${-8 * l}px) scale(${1 + 0.1 * l})` }}>
            <Icon a={a} size={IW} style={{ boxShadow: `0 ${10 + 14 * l}px ${24 + 20 * l}px rgba(0,0,0,.45), 0 0 0 ${3 * l}px rgba(140,170,255,${0.8 * l})` }} />
            <span style={{ font: `500 16px/1 ${SANS}`, color: 'rgba(246,244,239,.75)', whiteSpace: 'nowrap' }}>{a.n}</span>
          </div>
        );
      })}

      {/* ---------- Lesreg, in the middle ---------- */}
      <div style={{ position: 'absolute', left: TW / 2 - 160, top: CORE_Y - 30, width: 320, height: 60, borderRadius: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        background: 'linear-gradient(160deg, rgba(255,255,255,.18), rgba(255,255,255,.06))', boxShadow: `inset 0 1px 0 rgba(255,255,255,.4), inset 0 0 0 1px rgba(255,255,255,.14), 0 0 ${40 * corePulse}px ${10 * corePulse}px rgba(110,150,255,.45)`,
        transform: `scale(${1 + 0.05 * corePulse})` }}>
        <svg width="26" height="26" viewBox="0 0 128 128"><path d="M0 0H94l34 34v94H0Z" fill={PAPER} /><path d="M44 28h18v62h38v18H44Z" fill={NAVY9} /></svg>
        <span style={{ position: 'relative', height: 26, width: 230 }}>
          <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', font: `600 22px/1 ${SANS}`, opacity: 1 - done, whiteSpace: 'nowrap' }}>Lesreg <span style={{ marginLeft: 10, font: `400 15px/1 ${MONO}`, color: '#A7B3D6' }}>forbinder</span></span>
          <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', font: `600 21px/1 ${SANS}`, opacity: done, whiteSpace: 'nowrap', color: '#8FE3A8' }}>Ét system. Alle apps.</span>
        </span>
      </div>

      {/* ---------- what happened, as notifications ---------- */}
      {EVENTS.map((e, k) => {
        if (t < e.at) return null;
        const inn = sp(e.at, 15, 170);
        // the later ones push it down
        const below = EVENTS.filter((_, j) => j > k).reduce((m, f) => m + sp(f.at, 15, 170), 0);
        const a = APPS[e.app];
        return (
          <div key={k} style={{ position: 'absolute', left: 32, right: 32, top: STACK_Y + below * (CH + CG), height: CH, borderRadius: 30, display: 'flex', alignItems: 'center', gap: 18, padding: '0 24px',
            background: 'rgba(250,250,252,.95)', color: '#111', boxShadow: '0 20px 40px rgba(0,0,0,.35), inset 0 1px 0 #fff',
            opacity: clamp(inn * 1.6) * mix(1, 0.85, clamp(below)), transform: `translateY(${-50 * (1 - inn)}px) scale(${mix(0.9, 1, inn) * mix(1, 0.97, clamp(below))})`, zIndex: 10 + k }}>
            <Icon a={a} size={68} />
            <span style={{ display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0, flex: 1 }}>
              <span style={{ display: 'flex', justifyContent: 'space-between', font: `500 17px/1 ${SANS}`, color: '#6C6C70' }}><span>{a.n.toUpperCase()}</span><span>nu</span></span>
              <b style={{ font: `600 25px/1.1 ${SANS}` }}>{e.title}</b>
              <span style={{ font: `400 21px/1.2 ${SANS}`, color: '#3C3C43', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.body}</span>
            </span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
