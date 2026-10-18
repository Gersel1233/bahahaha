/* Before the phone: five lines the scroll runs through. Each has its
   stretch of the track; it rises into the middle, holds there for most of
   its stretch, and goes up as the next one rises. The first is there when
   the page opens; the last stays until the phone comes up under it. Only
   opacity and transform are written, once a frame, while it is on screen. */

const html = document.documentElement;
const track = document.querySelector('.vk-track');

if (track && html.classList.contains('vk-on')) {
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const out = t => 1 - Math.pow(1 - t, 3);
  const beats = $$('.vk-b', track), cue = track.querySelector('.vk-cue'), glow = track.querySelector('.vk-glow');
  const chips = $$('.vk-chips li', track);
  const N = beats.length, IN = 0.3, OUT = 0.3;
  let raf = 0, on = true;

  function frame() {
    raf = 0;
    const r = track.getBoundingClientRect(), H = innerHeight;
    const p = clamp(-r.top / Math.max(1, r.height - H));
    const t = p * N; // which line, and how far into it
    beats.forEach((b, i) => {
      const local = t - i; // 0..1 while it is its turn
      const inn = i === 0 ? 1 : out(seg(local, -IN, 0));
      const go = i === N - 1 ? 0 : seg(local, 1 - OUT, 1);
      const o = inn * (1 - go);
      const y = (1 - inn) * 70 - go * 70;
      b.style.opacity = o.toFixed(3);
      b.style.transform = 'translate3d(0,calc(-50% + ' + y.toFixed(1) + 'px),0)';
      b.style.visibility = o > 0.001 ? 'visible' : 'hidden';
      b.setAttribute('aria-hidden', o > 0.5 ? 'false' : 'true');
    });
    // the chips come in one after another and drift a little, each its own way
    chips.forEach((c, i) => {
      const local = t - 2;
      const a = out(seg(local, -0.2 + i * 0.06, 0.15 + i * 0.06));
      const drift = (local - 0.5) * (i % 2 ? -18 : 14);
      c.style.opacity = a.toFixed(3);
      c.style.transform = 'translate3d(0,' + ((1 - a) * 24 + drift).toFixed(1) + 'px,0) scale(' + (0.92 + 0.08 * a).toFixed(4) + ')';
    });
    if (cue) cue.style.opacity = (1 - seg(p, 0.01, 0.06)).toFixed(3);
    if (glow) glow.style.transform = 'translate3d(' + (Math.sin(p * Math.PI * 2) * 6).toFixed(2) + 'vw,' + (p * -8).toFixed(2) + 'vh,0) scale(' + (1 + p * 0.25).toFixed(3) + ')';
  }
  const kick = () => { if (on && !raf) raf = requestAnimationFrame(frame); };
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { on = es[0].isIntersecting; kick(); }).observe(track);
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', kick);
  frame();
}
