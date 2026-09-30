'use client';
import { useEffect, useRef } from 'react';

/* The two films are a megabyte and a half between them. Nothing is
   fetched until the frame is near the window, and it stops again when it
   leaves — a front page that downloads two videos nobody has scrolled to
   is a slow front page, and speed is the one thing that can actually
   hurt a site like this. */
export default function Shot({ src, poster }: { src: string; poster: string }){
  /* Two formats, not one. The films are H.264 in an .mp4, and a browser
     built without the patented decoder — Chromium on Linux, Firefox on a
     plain install — answers 200 to the file and then reports that it
     cannot play it. The .webm beside it is VP9, which every one of them
     can. The browser picks; we do not guess. */
  const webm = src.replace(/\.mp4$/, '.webm');
  const ref = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting){
        if (v.preload === 'none'){ v.preload = 'auto'; v.load(); }
        v.play().catch(() => { /* a browser that will not autoplay keeps the poster */ });
      } else {
        v.pause();
      }
    }, { rootMargin: '200px' });
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return (
    <div className="shot">
      <video ref={ref} poster={poster} preload="none"
        muted playsInline loop aria-hidden="true">
        <source src={webm} type="video/webm" />
        <source src={src} type="video/mp4" />
      </video>
    </div>
  );
}
