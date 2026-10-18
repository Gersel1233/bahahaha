/* What the three app films share: the screen, iOS's status bar, a finger,
   and the timing helpers. Sized in iOS points: the screen is 402 pt wide,
   whatever the film's pixels are. */
import React, { useLayoutEffect, useState } from 'react';
import { continueRender, delayRender, staticFile, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const W = 828, H = 1844;
export const PT = W / 402;
export const u = (n: number) => n * PT;
export const SH = H / PT; // the screen's height in points

export const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const out3 = (t: number) => 1 - Math.pow(1 - t, 3);
export const out5 = (t: number) => 1 - Math.pow(1 - t, 5);
export const io3 = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export const SANS = "'Chivo', system-ui, sans-serif";
export const SERIF = "'Newsreader', Georgia, serif";
export const MONO = "'Fragment Mono', ui-monospace, monospace";
export const IOS = "'Inter', -apple-system, system-ui, sans-serif";

// seconds, and a spring that starts at a given second
export function useT() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const sp = (at: number, damping = 18, stiffness = 170, mass = 0.9) =>
    spring({ frame: f - Math.round(at * fps), fps, config: { damping, stiffness, mass } });
  return { t, sp };
}

export function useFonts() {
  const [h] = useState(() => delayRender('fonts'));
  useLayoutEffect(() => {
    const faces: [string, string, string, string?][] = [
      ['Chivo', 'fonts/chivo-300.woff2', '300'], ['Chivo', 'fonts/chivo-400.woff2', '400'], ['Chivo', 'fonts/chivo-500.woff2', '500'], ['Chivo', 'fonts/chivo-600.woff2', '600'],
      ['Newsreader', 'fonts/newsreader-300-italic.woff2', '300', 'italic'], ['Fragment Mono', 'fonts/fragmentmono-400.woff2', '400'],
      // the nearest open face to Apple's own, for what is drawn as iOS
      ['Inter', 'film/assets/fonts/inter-var.woff2', '100 900'],
    ];
    Promise.all(faces.map(([fam, src, weight, style]) => new FontFace(fam, `url(${staticFile(src)})`, { weight, style: style || 'normal' })
      .load().then(f => { (document.fonts as any).add(f); })))
      .then(() => continueRender(h)).catch(() => continueRender(h));
  }, []);
}

export const box = (x: number, y: number, w?: number, h?: number): React.CSSProperties => ({
  position: 'absolute', left: u(x), top: u(y), ...(w != null ? { width: u(w) } : {}), ...(h != null ? { height: u(h) } : {}),
});

// iOS's status bar at 402 pt: 58 pt tall, the time at 17 pt
export const StatusBar: React.FC<{ color: string }> = ({ color }) => (
  <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: u(58), padding: `${u(6)}px ${u(30)}px 0 ${u(44)}px`, display: 'flex',
    alignItems: 'center', justifyContent: 'space-between', color, font: `600 ${u(17)}px/1 ${SANS}`, letterSpacing: u(-0.3), zIndex: 50 }}>
    <span>9:41</span>
    <span style={{ display: 'flex', alignItems: 'center', gap: u(6) }}>
      <svg width={u(18)} height={u(12)} viewBox="0 0 18 12"><g fill={color}><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5.5" width="3" height="6.5" rx="1" /><rect x="10" y="3" width="3" height="9" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></g></svg>
      <svg width={u(16)} height={u(12)} viewBox="0 0 16 12"><path d="M8 11.5 5.6 9a3.4 3.4 0 0 1 4.8 0zM3.5 7a6.4 6.4 0 0 1 9 0l-1.4 1.4a4.4 4.4 0 0 0-6.2 0zM1.3 4.8a9.5 9.5 0 0 1 13.4 0l-1.4 1.4a7.5 7.5 0 0 0-10.6 0z" fill={color} /></svg>
      <svg width={u(26)} height={u(12)} viewBox="0 0 26 12"><rect x=".5" y=".5" width="22" height="11" rx="3.5" fill="none" stroke={color} strokeOpacity=".4" /><rect x="2" y="2" width="19" height="8" rx="2" fill={color} /><path d="M24 4v4a2 2 0 0 0 0-4z" fill={color} fillOpacity=".4" /></svg>
    </span>
  </div>
);

// a finger's touch: a soft disc that swells and goes
export const Tap: React.FC<{ x: number; y: number; at: number; t: number; dark?: boolean }> = ({ x, y, at, t, dark }) => {
  const q = seg(t, at - 0.08, at + 0.32);
  if (q <= 0 || q >= 1) return null;
  const r = mix(14, 30, out3(q));
  return <div style={{ position: 'absolute', left: u(x - r), top: u(y - r), width: u(r * 2), height: u(r * 2), borderRadius: '50%', zIndex: 60,
    background: dark ? 'rgba(255,255,255,.5)' : 'rgba(20,20,20,.22)', opacity: q < 0.25 ? q / 0.25 : 1 - (q - 0.25) / 0.75 }} />;
};

export const Check: React.FC<{ p: number; size: number; color: string; width?: number }> = ({ p, size, color, width = 2.4 }) => (
  <svg width={u(size)} height={u(size)} viewBox="0 0 24 24"><path d="M5 12.5 10 17.5 19.5 7" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round"
    strokeDasharray="24" strokeDashoffset={24 * (1 - clamp(p))} /></svg>
);
