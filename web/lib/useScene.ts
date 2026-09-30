'use client';
import { useEffect, useRef } from 'react';
import { stage, type Scene } from './stage';

/* Register a section with the stage engine for as long as the component is
   mounted, and take it out again when it is not.

   The engine is the same one the hand-written page ran on: it keeps a list
   of scenes and paints each of them once a frame from one rAF loop. A
   component's only job is to hand it an element and three functions —
   build (cut the words apart), base (the state it falls back to) and paint
   (where everything is at progress s) — which is exactly the shape the
   sections were already written in. */
export function useScene(make: () => Scene, deps: unknown[] = []){
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const sc = stage();
    if (!sc) return;
    const o = make();
    if (!o?.el) return;
    ref.current = o.el;
    sc.add(o);
    return () => { sc.remove(o.el); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

/* The page reads its own text out of the DOM so the language switch can
   rewrite it in place. That has to happen before the scenes are built, or
   the words are cut apart in the wrong language. */
export function useLang(){
  useEffect(() => {
    const KEY = 'lesreg-lang';
    const nodes = () => Array.from(document.querySelectorAll<HTMLElement>('[data-da]'));
    function apply(l: string){
      nodes().forEach(n => {
        if (!n.dataset.en) n.dataset.en = n.innerHTML;
        n.innerHTML = (l === 'da' ? n.dataset.da : n.dataset.en) || '';
      });
      document.documentElement.lang = l;
      const sw = document.getElementById('langsw');
      if (sw) sw.dataset.lang = l;
      document.querySelectorAll<HTMLElement>('[data-lang-btn]').forEach(b => {
        const on = b.dataset.langBtn === l;
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', String(on));
      });
      try { localStorage.setItem(KEY, l); } catch { /* private window */ }
    }
    let saved: string | null = null;
    try { saved = localStorage.getItem(KEY); } catch { /* private window */ }
    const want = saved || (navigator.language?.toLowerCase().startsWith('da') ? 'da' : 'en');
    const sw = document.getElementById('langsw');
    sw?.classList.add('no-anim');
    apply(want);
    requestAnimationFrame(() => sw?.classList.remove('no-anim'));

    const onClick = (e: Event) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-lang-btn]');
      if (b?.dataset.langBtn) apply(b.dataset.langBtn);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);
}
