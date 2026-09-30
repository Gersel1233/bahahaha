/* The statement. Three lines that rise out of their own clip, and a strip
   under them that is the proof rather than another claim. */
export default function Hero(){
  return (
    /* go + no-rise: on the hand-written page the flight put these on when
       it landed. Until the flight is ported, the headline simply stands. */
    <header id="top" className="khero go no-rise" data-screen-label="hero">
      <h1 className="kh">
        <span className="khl"><i data-da="Vi bygger">We build</i></span>
        <span className="khl"><i data-da="systemerne der">the systems that</i></span>
        <span className="khl"><i data-da={'driver forretningen<span class="em">.</span>'}>run the business<span className="em">.</span></i></span>
      </h1>
      <div className="kmeta">
        <span data-da="<b>Lesreg</b> &mdash; softwarehus"><b>Lesreg</b> — software house</span>
        <span data-da="Spiis og Mosede Havnecaf&eacute; tager imod bestillinger p&aring; vores systemer lige nu">Spiis and Mosede Havnecafé are taking orders on our systems right now</span>
        <span className="kscroll" data-da="Scroll ned">Scroll</span>
      </div>
    </header>
  );
}
