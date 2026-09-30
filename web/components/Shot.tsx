'use client';
import { useEffect, useRef } from 'react';

/* The two films are a megabyte and a half between them. Nothing is
   fetched until the frame is near the window, and it stops again when it
   leaves — a front page that downloads two videos nobody has scrolled to
   is a slow front page, and speed is the one thing that can actually
   hurt a site like this. */
export default function Shot({ src, poster }: { src: string; poster: string }){
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
      <video ref={ref} src={src} poster={poster} preload="none"
        muted playsInline loop aria-hidden="true" />
    </div>
  );
}
