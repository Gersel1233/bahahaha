/* The opening of lesreg.com as a film. Not a recording of the page: the
   page's own intro.js and ny.css, mounted here and told which position to
   draw on each frame. The scroll is replaced by a hand on a wheel — eased
   moves between the places a reader would stop to read. */
import React, { useLayoutEffect, useRef, useState } from 'react';
import { useCurrentFrame, useVideoConfig, delayRender, continueRender } from 'remotion';
import '../../ny/ny.css';
// @ts-ignore — plain JS module from the site
import { createIntro } from '../../ny/intro.js';

export const DURATION = 19; // seconds

const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const out5 = (t: number) => 1 - Math.pow(1 - t, 5);
const smooth = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

// seconds -> scroll position; each pair is a place the hand stops
const KEYS: [number, number][] = [
  [2.6, 0], [4.1, 0.135], [5.7, 0.215], [7.2, 0.325], [8.7, 0.435],
  [10.2, 0.545], [11.6, 0.64], [13.2, 0.785], [13.8, 0.8], [15.6, 0.945], [17.4, 1],
];
function timeline(t: number) {
  const a = clamp(t / 2.3);
  if (t <= KEYS[0][0]) return { p: 0, a };
  for (let i = 1; i < KEYS.length; i++) {
    const [t1, p1] = KEYS[i], [t0, p0] = KEYS[i - 1];
    if (t <= t1) return { p: p0 + (p1 - p0) * smooth((t - t0) / (t1 - t0)), a };
  }
  return { p: 1, a };
}

const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="square"><path d="M7 17 17 7M8 7h9v9" /></svg>
);
const Mark = ({ l = '#f1eade' }: { l?: string }) => (
  <svg viewBox="0 0 128 128" aria-hidden="true"><path className="b-sq" d="M0 0H94l34 34v94H0Z" fill="currentColor" /><path className="b-l" d="M44 28h18v62h38v18H44Z" fill={l} /></svg>
);

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const stage = useRef<HTMLDivElement>(null);
  const api = useRef<any>(null);
  const [handle] = useState(() => delayRender('fonts and layout'));

  useLayoutEffect(() => {
    document.documentElement.classList.add('ix-on');
    // On the page, will-change keeps every moving part on its own layer —
    // that is what makes it run at 60. A film is screenshotted frame by
    // frame, and a layer that has just become visible may not be rastered
    // yet when the picture is taken, so here everything paints in place.
    const st = document.createElement('style');
    st.textContent = '*{will-change:auto !important; transition:none !important; animation:none !important}';
    document.head.appendChild(st);
    document.documentElement.lang = 'da';
    api.current = createIntro(stage.current, { lang: 'da', film: true });
    api.current.layout(width, height);
    Promise.all([
      document.fonts.load('600 40px Geist'), document.fonts.load('400 16px Geist'),
      document.fonts.load('500 16px Geist'), document.fonts.load('500 12px "Geist Mono"'),
    ]).then(() => document.fonts.ready).then(() => continueRender(handle));
  }, []);

  useLayoutEffect(() => {
    if (!api.current) return;
    const { p, a } = timeline(frame / fps);
    const st = api.current.render(p, a);
    const html = document.documentElement;
    const at = (sel: string) => { const r = document.querySelector(sel)!.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
    const [lx, ly] = at('.brand'), [rx, ry] = at('.nav-r');
    html.classList.toggle('nav-ink-l', st.onPaper(lx, ly));
    html.classList.toggle('nav-ink', st.onPaper(rx, ry));
    stage.current!.classList.toggle('on-paper', st.done);
    const els: [Element, number, boolean][] = [];
    els.push([document.querySelector('.h-k')!, 0.935, false]);
    document.querySelectorAll('.hl > span').forEach((e, i) => els.push([e, 0.94 + i * 0.012, true]));
    els.push([document.querySelector('.h-p')!, 0.962, false]);
    els.push([document.querySelector('.h-c')!, 0.968, false]);
    for (const [e, s, line] of els) {
      const t = out5(seg(p, s, s + 0.045));
      (e as HTMLElement).style.transform = line ? `translate(0,${(1 - t) * 108}%)` : `translate(0,${(1 - t) * 18}px)`;
      (e as HTMLElement).style.opacity = line ? '1' : String(t);
    }
  }, [frame]);

  return (
    <div style={{ width, height, position: 'relative', overflow: 'hidden', background: '#1b1714' }}>
      <nav className="nav" aria-label="Lesreg">
        <a className="brand"><Mark />Lesreg</a>
        <div className="nav-r">
          <div className="lang" style={{ ['--lw' as any]: '17px' }}><button aria-pressed="true">DA</button><button aria-pressed="false">EN</button><i /></div>
          <a className="cta"><span>Skriv til os</span><Arrow /></a>
        </div>
      </nav>
      <section className="ix-track" style={{ height }}>
        <div className="ix-stage" ref={stage} style={{ height }}>
          <header className="hero">
            <p className="h-k"><Mark l="#f1eade" /><span>Lesreg — softwarehus</span></p>
            <h1 className="h1">
              <span className="hl"><span>Vi bygger systemerne</span></span>
              <span className="hl"><span>der driver</span></span>
              <span className="hl"><span>forretningen.</span></span>
            </h1>
            <div className="h-row">
              <p className="h-p">Bestilling, booking, køkkenskærme og menuer på skærm — tegnet, bygget og drevet af os. <b>Spiis</b> og <b>Mosede Havnecafé</b> tager imod bestillinger på dem lige nu.</p>
              <div className="h-c"><a className="cta"><span>Skriv til os</span><Arrow /></a><span className="h-s">lesreg.com</span></div>
            </div>
          </header>
        </div>
      </section>
    </div>
  );
};
