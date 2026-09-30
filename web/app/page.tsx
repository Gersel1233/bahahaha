'use client';
import { useEffect } from 'react';
import { MARKUP } from '../lib/markup';

/* The page as it stands, on Next. The markup goes into the document in
   one piece and the page's own script is called once it is there — the
   script finds everything by id, which is how it was already written, so
   nothing about the flight, the software house, the phone or the letter
   had to be touched.

   The three files that were loaded with script tags are still loaded
   with script tags: telefon-3d.js is an ES module that pulls three.js
   through an import map, and bundling it would mean rewriting how it
   finds three. */
export default function Page(){
  useEffect(() => {
    let dead = false;
    const added: HTMLScriptElement[] = [];

    (async () => {
      document.documentElement.classList.add('site-ready');
      const { initPage } = await import('../lib/page-script.js');
      if (dead) return;
      initPage();

      const add = (src: string, module = false) => {
        const s = document.createElement('script');
        s.src = src;
        if (module) s.type = 'module'; else s.defer = true;
        document.body.appendChild(s);
        added.push(s);
      };
      add('/telefon-3d.js?v=31', true);
      add('/site.js?v=48');
    })();

    return () => { dead = true; added.forEach(s => s.remove()); };
  }, []);

  return <div id="lesreg-page" dangerouslySetInnerHTML={{ __html: MARKUP }} />;
}
