'use client';
import { useState } from 'react';

/* A rule under it, not a shadow. The mark is the one piece of signal
   colour in the whole header — the system allows one thing per view. */
export default function Bar({ lang, setLang }: { lang: 'da'|'en'; setLang: (l:'da'|'en')=>void }){
  const t = lang === 'da'
    ? { a:'Softwarehus', b:'Kunder', c:'Kontakt', cta:'Skriv til os' }
    : { a:'Software house', b:'Clients', c:'Contact', cta:'Talk to us' };
  return (
    <div className="bar field">
      <a className="brand" href="#top"><i aria-hidden="true" />Lesreg</a>
      <nav className="tabs">
        <a href="#hvad">{t.a}</a>
        <a href="#kunder">{t.b}</a>
        <a href="#kontakt">{t.c}</a>
      </nav>
      <div className="barright">
        <div className="lang" role="group" aria-label="Sprog">
          <button type="button" className={lang==='da'?'on':''} aria-pressed={lang==='da'}
            onClick={() => setLang('da')}>DA</button>
          <button type="button" className={lang==='en'?'on':''} aria-pressed={lang==='en'}
            onClick={() => setLang('en')}>EN</button>
        </div>
        <a className="btn" href="#kontakt">{t.cta}</a>
      </div>
    </div>
  );
}
