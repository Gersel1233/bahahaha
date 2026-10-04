/* The opening of lesreg.com as a film. Not a recording of the page: the
   page's own intro.js and ny.css, mounted here and told which position to
   draw on each frame. The scroll is replaced by a hand on a wheel — eased
   moves between the places a reader would stop to read. */
import React, { useLayoutEffect, useRef, useState } from 'react';
import { useCurrentFrame, useVideoConfig, delayRender, continueRender, staticFile } from 'remotion';
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
  [3.2, 0], [4.6, 0.1], [6.0, 0.2], [7.5, 0.33], [9.0, 0.46], [10.5, 0.59],
  [11.8, 0.68], [13.2, 0.775], [13.8, 0.8], [15.6, 0.94], [17.4, 1],
];
function timeline(t: number) {
  const a = clamp(t / 2.6);
  if (t <= KEYS[0][0]) return { p: 0, a };
  for (let i = 1; i < KEYS.length; i++) {
    const [t1, p1] = KEYS[i], [t0, p0] = KEYS[i - 1];
    if (t <= t1) return { p: p0 + (p1 - p0) * smooth((t - t0) / (t1 - t0)), a };
  }
  return { p: 1, a };
}

const Arrow = () => (
  <svg viewBox="0 0 16 16"><path d="M3 8h9.4M9.1 4.4 12.6 8 9.1 11.6" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const Menu = () => (
  <svg viewBox="0 0 16 16"><path d="M3 6h10M7.5 10.5H13" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" /></svg>
);

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const stage = useRef<HTMLDivElement>(null);
  const api = useRef<any>(null);
  const [handle] = useState(() => delayRender('fonts, picture and layout'));
  const frameRef = useRef(frame);
  frameRef.current = frame;

  useLayoutEffect(() => {
    const html = document.documentElement;
    html.classList.add('ix-on');
    html.lang = 'da';
    // On the page, will-change keeps every moving part on its own layer —
    // that is what makes it run at 60. A film is screenshotted frame by
    // frame, and a layer that has just changed may not be painted yet when
    // the picture is taken, so here everything paints in place.
    const st = document.createElement('style');
    st.textContent = '*{will-change:auto !important; transition:none !important; animation:none !important}';
    document.head.appendChild(st);
    const probe = 'media/havn-16x9.webp';
    const base = staticFile(probe).slice(0, -probe.length);
    api.current = createIntro(stage.current, { lang: 'da', film: true, base });
    Promise.all([
      document.fonts.load('500 40px Chivo'), document.fonts.load('400 16px Chivo'), document.fonts.load('300 40px Chivo'),
      document.fonts.load('600 11px Chivo'), document.fonts.load('400 12px "Fragment Mono"'), document.fonts.load('italic 300 40px Newsreader'),
    ]).then(() => document.fonts.ready).then(() => {
      api.current.layout(width, height); // after the fonts: the windows are measured
      const pic = stage.current!.querySelector('img') as HTMLImageElement;
      return pic.decode().catch(() => {});
    }).then(() => { paint(frameRef.current); continueRender(handle); });
  }, []);

  // draws one frame; also called once the layout exists, because the
  // first frame of every tab is asked for before it does
  const paint = (f: number) => {
    if (!api.current || !api.current.geometry) return;
    const { p, a } = timeline(f / fps);
    const st = api.current.render(p, a);
    const html = document.documentElement;
    const nav = document.querySelector('.tb')!.getBoundingClientRect();
    const pg = st.page;
    html.classList.toggle('nav-light', st.done || (pg && p >= 0.8 && pg.top <= nav.top + 4 && pg.left <= nav.left + 8 && pg.right >= nav.right - 8));
    stage.current!.classList.toggle('on-paper', st.done);
    const hero = document.getElementById('hero')!;
    hero.style.visibility = p >= 0.92 ? 'visible' : 'hidden';
    (document.querySelector('.h-rule') as HTMLElement).style.transform = `scaleX(${Math.max(0.0001, out5(seg(p, 0.945, 0.995)))})`;
    const els: [HTMLElement, number, boolean][] = [];
    els.push([document.querySelector('.hero .label')!, 0.925, false]);
    document.querySelectorAll<HTMLElement>('.h1 .hl > span').forEach((e, i) => els.push([e, 0.93 + i * 0.014, true]));
    document.querySelectorAll<HTMLElement>('.h-row > :not(.h-rule)').forEach((e, i) => els.push([e, 0.952 + i * 0.008, false]));
    for (const [e, s, line] of els) {
      const t = out5(seg(p, s, s + 0.04));
      e.style.transform = line ? `translate(0,${(1 - t) * 130}%)` : `translate(0,${(1 - t) * 16}px)`;
      e.style.opacity = String(line ? Math.min(1, t * 2.5) : t);
    }
  };
  useLayoutEffect(() => { paint(frame); }, [frame]);

  return (
    <div style={{ width, height, position: 'relative', overflow: 'hidden', background: '#0E0F10' }}>
      <nav className="tb" aria-label="Lesreg">
        <a className="tb-brand"><b>Lesreg</b><span className="anno">Softwarehus</span></a>
        <div className="tb-r">
          <div className="seg"><button aria-pressed="true">DA</button><button aria-pressed="false">EN</button></div>
          <a className="btn light"><span>Skriv til os</span><span className="lens"><Arrow /></span></a>
          <button className="tb-menu"><span className="lens"><Menu /></span></button>
        </div>
      </nav>
      <section className="ix-track" style={{ height }}>
        <div className="ix-stage" ref={stage} style={{ height }}>
          <header className="hero" id="hero">
            <div className="h-top">
              <p className="label">
                <svg viewBox="0 0 128 128"><path d="M0 0H94l34 34v94H0Z" fill="#0E0F10" /><path d="M44 28h18v62h38v18H44Z" fill="#F6F4EF" /></svg>
                <span>Lesreg — softwarehus</span>
              </p>
              <h1 className="h1">
                <span className="hl"><span>Vi bygger systemerne</span></span>
                <span className="hl acc"><span>der driver forretningen.</span></span>
              </h1>
            </div>
            <div className="h-row">
              <i className="h-rule" />
              <p className="lead">Bestilling, booking, køkkenskærme og menuer på skærm — tegnet, bygget og drevet af <b>ét hus</b>.</p>
              <div className="fig-l"><span className="n">2</span><p><b>I drift lige nu</b>Spiis og Mosede Havnecafé tager imod bestillinger på vores systemer.</p></div>
              <a className="btn"><span>Skriv til os</span><span className="lens"><Arrow /></span></a>
            </div>
          </header>
        </div>
      </section>
    </div>
  );
};
