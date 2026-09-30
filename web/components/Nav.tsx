/* The bar. Markup moved across as it stood — the mark is inline SVG so the
   bar costs no extra request, and the language switch is two letters with a
   rule under the live one. The switching itself lives in useLang. */
export default function Nav(){
  return (
    <nav className="nav" data-screen-label="nav">
      <a className="brand-l" href="#top">
        <svg className="bmark" viewBox="0 0 128 128" aria-hidden="true" focusable="false">
          <path d="M0 0H94l34 34v94H0Z" fill="#1b1714" />
          <path d="M44 28h18v62h38v18H44Z" fill="#f1eade" />
        </svg>Lesreg
      </a>
      <div className="gn-links">
        <a href="#softwarehus" data-da="Softwarehus">Software house</a>
        <a href="#kunder" data-da="Kunder">Clients</a>
        <a href="#contact" data-da="Kontakt">Contact</a>
      </div>
      <div className="gn-right">
        <div className="langsw" id="langsw" data-lang="en" role="group" aria-label="Language">
          <span className="lang-thumb" aria-hidden="true" />
          <button type="button" data-lang-btn="da">DA</button>
          <button type="button" data-lang-btn="en">EN</button>
        </div>
        <a className="gn-cta" href="mailto:mgersel@lesreg.com">
          <span data-da="Skriv til os">Talk to us</span>
          <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7M7 7h10v10" /></svg>
        </a>
      </div>
    </nav>
  );
}
