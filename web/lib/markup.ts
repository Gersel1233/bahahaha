/* The page's markup, exactly as it stood in index.html. It is handed to
   the document in one piece rather than translated into JSX: four hundred
   lines of nested SVG, data-attributes and HTML entities converted by
   hand or by script is four hundred chances to change the page by
   accident, and the script below finds all of it by id regardless. */
export const MARKUP = `
  <!-- reading progress -->
  <div id="sprog" aria-hidden="true"><i></i></div>

  <!-- The old overlay intro is retired — the drone flight below is the opening
       now, so the page unlocks immediately. -->

  <!-- ===================== NAV — lockup · links · one CTA ===================== -->
  <nav class="nav" data-screen-label="nav">
    <a class="brand-l" href="#top">
      <!-- the mark: a leaf of paper with its corner turned, and an L in it.
           Inline rather than an <img>, so the bar costs no extra request —
           the file it was drawn from is in brand/, credentials and all. -->
      <svg class="bmark" viewBox="0 0 128 128" aria-hidden="true" focusable="false">
        <path d="M0 0H94l34 34v94H0Z" fill="#1b1714"/>
        <path d="M44 28h18v62h38v18H44Z" fill="#f1eade"/>
      </svg>Lesreg</a>
    <div class="gn-links">
      <a href="#softwarehus" data-da="Softwarehus">Software house</a>
      <a href="#kunder" data-da="Kunder">Clients</a>
      <a href="#contact" data-da="Kontakt">Contact</a>
    </div>
    <div class="gn-right">
      <div class="langsw" id="langsw" data-lang="en" role="group" aria-label="Language">
        <span class="lang-thumb" aria-hidden="true"></span>
        <button type="button" data-lang-btn="da">DA</button><button type="button" data-lang-btn="en">EN</button>
      </div>
      <a class="gn-cta" href="mailto:mgersel@lesreg.com"><span data-da="Skriv til os">Talk to us</span>
        <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M7 7h10v10"/></svg>
      </a>
    </div>
  </nav>

  <div class="site-reveal">

  <!-- The backdrop the middle of the page stands on. It used to be set on
       each pinned stage, and a stage is one screen tall — so every section
       started its own copy of the picture and the boundary between two of
       them was a hard line across the page. One layer, fixed to the window,
       and the sections scroll over it: nothing to line up, and nothing to
       see between them. The vignette and the lift that were also per-stage
       are on it too, for the same reason. -->
  <div class="bg-glass" aria-hidden="true"></div>

  <!-- ===================== DRONE INTRO — the flight into the studio =====================
       Scroll scrubs one continuous drone shot: over the house, in through the
       window, up to the desk, into the screen — and the site fades in. -->
  <div class="dro-track" id="droTrack" data-screen-label="drone-intro">
    <div class="dro-stick" id="droStick">
      <!-- src is chosen below: phones get the light cut, big screens the full
           one — a wide screen would show the light cut's softness -->
      <video class="dro-vid" id="droVid" poster="media/drone-intro-poster.jpg?v=15" muted playsinline preload="auto" disablepictureinpicture aria-hidden="true"></video>
      <div class="dro-brand" id="droBrand" aria-hidden="true">
        <span class="dro-word">Lesreg</span>
        <span class="dro-hint" data-da="Scroll for at flyve ind">Scroll to fly in</span>
      </div>
      <!-- a lower third, the way a film names the person it has just found -->
      <div class="dro-name" id="droName" aria-hidden="true">
        <span class="dn-rule"></span>
        <span class="dn-who">Mikkel Gersel</span>
        <span class="dn-role" data-da="Grundl&aelig;gger, Lesreg">Founder, Lesreg</span>
      </div>
      <div class="dro-fade" id="droFade" aria-hidden="true"></div>
      <!-- The glass, on a layer of its own so it can arrive with the words
           rather than with the paper. The film dissolves into black; the
           picture comes up line by line under the headline as it writes
           itself, and is whole on the frame the last line lands. Nothing
           in the flight had to change for it. -->
      <div class="dro-glass" id="droGlass" aria-hidden="true"></div>
      <!-- the headline, written into the film's own field of paper, so it
           arrives as the last beat of the flight and not after it -->
      <div class="dro-hero" id="droHero" aria-hidden="true"></div>
    </div>
  </div>

  <!-- ===================== HERO — the statement (Koto) ===================== -->
  <header id="top" class="khero" data-screen-label="hero">
    <!-- It said "Better. Cheaper. Faster." — three adjectives with no
         object, on the one screen everybody sees. Better than what. This
         says what the house does, and the line under it is the proof
         rather than another claim: two named places are running on it
         right now, and the reader can go and look at both of them a
         section further down. -->
    <h1 class="kh">
      <span class="khl"><i data-da="Vi bygger">We build</i></span>
      <span class="khl"><i data-da="systemerne der">the systems that</i></span>
      <span class="khl"><i data-da="driver forretningen<span class=&quot;em&quot;>.</span>">run the business<span class="em">.</span></i></span>
    </h1>
    <div class="kmeta">
      <span data-da="<b>Lesreg</b> &mdash; softwarehus"><b>Lesreg</b> — software house</span>
      <span data-da="Spiis og Mosede Havnecaf&eacute; tager imod bestillinger p&aring; vores systemer lige nu">Spiis and Mosede Havnecaf&eacute; are taking orders on our systems right now</span>
      <span class="kscroll" data-da="Scroll ned">Scroll</span>
    </div>
  </header>

  <!-- ===================== SOFTWAREHUS — the question before the rest =====================
       What a software house is, and why it matters to a business. Three
       acts on one pinned stage: the trade written out, three suppliers
       becoming one, and why this house in particular. It waits until it is
       asked — the button is the whole opening gesture — and then plays
       itself through on a clock. -->
  <section class="scene sw" id="softwarehus" data-screen-label="software-house">
    <div class="stage">
      <span class="sw-glow" id="swGlow" aria-hidden="true"></span>
      <span class="sw-plate" id="swPlate" aria-hidden="true"></span>
      <span class="sw-veil" id="swVeil" aria-hidden="true"></span>
      <span class="sw-vign" id="swVign" aria-hidden="true"></span>

      <!-- The film runs itself once. After that it belongs to the reader:
           this is the line it can be pulled back and forth on, so anything
           that went past too quickly can be gone back to and read. -->
      <div class="sw-rail" id="swRail" role="slider" tabindex="-1"
           aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"
           aria-label="Spol gennem afsnittet" title="Tr&aelig;k for at spole">
        <span class="sw-rail-fill" id="swRailFill"></span>
        <span class="sw-rail-knob" id="swRailKnob"></span>
      </div>

      <div class="sw-deck">

        <div class="sw-hook" id="swHook">
          <h2 data-da="Hvad er et softwarehus?">What is a software house?</h2>
          <p data-da="Og hvorfor Lesreg.">And why Lesreg.</p>
        </div>

        <!-- No picture here. A stock frame of somebody else's code said
             nothing about this house that the sentence does not say better,
             and it took half the act to say it. The answer writes itself
             out and stands on its own. -->
        <div class="sw-act sw-solo" data-sw-act="1">
          <div>
            <div class="sw-kicker" data-da="Hvad er et softwarehus">What a software house is</div>
            <p class="sw-bio"><span id="swTyped"></span><i class="sw-caret" id="swCaret" aria-hidden="true"></i></p>
          </div>
        </div>
        <!-- the text of act one lives here so the language switch can reach
             it; the act reads it a character at a time -->
        <p class="sw-bio-src" id="swBio" hidden data-da="Et softwarehus tegner, bygger og passer software under samme tag.&#10;&#10;Ikke et bureau der sender arbejdet videre. Ikke en udvikler der afleverer og forsvinder.&#10;&#10;Lesreg er s&aring;dan et hus &mdash; og huset er et team.">A software house draws, builds and looks after software under one roof.&#10;&#10;Not an agency that passes the work on. Not a developer who hands it over and disappears.&#10;&#10;Lesreg is a house like that &mdash; and the house is a team.</p>

        <div class="sw-act sw-mid" data-sw-act="2">
          <div class="sw-kicker" data-da="Hvorfor det betyder noget for jer">Why it matters to you</div>
          <h3 data-sw-split data-da="Normalt skal I hyre tre.">Normally you hire three.</h3>
          <div class="sw-merge">
            <span class="sw-cast" id="swCast" aria-hidden="true"></span>
            <div class="sw-sup"><b data-da="Designbureau">Design agency</b><s data-da="tegner det">draws it</s></div>
            <div class="sw-sup"><b data-da="Udvikler">Developer</b><s data-da="bygger det">builds it</s></div>
            <div class="sw-sup"><b data-da="Driftleverand&oslash;r">Hosting supplier</b><s data-da="holder det i luften">keeps it up</s></div>
            <div class="sw-house" id="swHouse"><b>Lesreg</b><s data-da="&eacute;t hus &middot; &eacute;n regning &middot; &eacute;t ansvar">one house &middot; one invoice &middot; one responsibility</s></div>
          </div>
          <p class="sw-lede" data-da="Tre aftaler, tre regninger, og <b>ingen der har ansvaret</b> n&aring;r noget ikke virker. Et softwarehus er &eacute;t sted at g&aring; hen.">Three contracts, three invoices, and <b>nobody who carries the responsibility</b> when something stops working. A software house is one place to go.</p>
        </div>

        <div class="sw-act sw-split" data-sw-act="3">
          <div>
            <div class="sw-kicker" data-da="Hvorfor Lesreg">Why Lesreg</div>
            <h3 data-sw-split data-da="Fordi huset er et team.">Because the house is a team.</h3>
            <ul class="sw-claims">
              <li data-da="Ingen overhead at betale for<s>&Eacute;n fast pris, aftalt inden vi starter &mdash; og ingen kommission af jeres oms&aelig;tning.</s>">No overhead to pay for<s>One fixed price, agreed before we start &mdash; and no commission on your revenue.</s></li>
              <li data-da="Ingen led imellem<s>I taler med dem, der bygger det. En rettelse tager timer, ikke uger.</s>">Nothing sitting in between<s>You talk to the people building it. A change takes hours, not weeks.</s></li>
              <li data-da="Ingen der forsvinder bagefter<s>Samme h&aelig;nder passer det, n&aring;r det er i drift.</s>">Nobody who disappears afterwards<s>The same hands look after it once it is running.</s></li>
            </ul>
            <!-- The section explained the trade and then stopped. It ends on
                 a way in now: one line that says what is actually on offer,
                 and the one button on the page that is worth pressing here. -->
            <p class="sw-offer" data-da="Fast pris, aftalt inden vi starter. Vi tegner det, bygger det og passer det bagefter.">One fixed price, agreed before we start. We draw it, build it and look after it afterwards.</p>
            <a class="sw-cta" href="#contact" data-da="Lad os tage en snak">Let's talk</a>
          </div>
          <div class="sw-shot wide">
            <img src="photos/lesreg-moede.jpg?v=1" alt="" loading="lazy" decoding="async" width="1400" height="785" />
          </div>
        </div>

      </div>
    </div>
  </section>

  <!-- ===================== CLIENTS =====================
       Not a portfolio of pictures: two systems that take real orders today.

       The line that opens it used to be a section of its own — its own
       stage, its own pin, its own release — so the reader met it, watched
       it go, and then met the first customer somewhere else. It is the
       same stage now. The sentence is the first quarter of this section's
       timeline and the customer is the rest of it, which is what makes
       them one thing rather than two that happen to be next to each
       other. -->
  <section class="scene case" id="kunder" data-screen-label="clients">
    <div class="stage">
      <div class="glow" aria-hidden="true"></div>
      <div class="kdoor">
        <div class="inner">
          <h1 data-split data-da="Her er to <i>live eksempler.</i>">Here are two <i>live examples.</i></h1>
          <p class="lede" data-da="Begge er tegnet, bygget og passet af os. De tager imod bestillinger lige nu.">Both were drawn, built and looked after by us. They are taking orders right now.</p>
        </div>
      </div>
      <div class="wrap" data-brand="spiis">
        <div class="col">
          <p class="kicker" data-da="Restaurant &middot; Bestilling &amp; booking">Restaurant &middot; Ordering &amp; booking</p>
          <h2 class="cname" data-split>Spiis</h2>
          <a class="curl" href="https://spiis.dk" target="_blank" rel="noopener">spiis.dk</a>
          <p class="blurb" data-da="G&aelig;sterne forudbestiller og booker bord p&aring; restaurantens egen side. K&oslash;kkenet f&aring;r <b>&eacute;t overblik</b> &mdash; i stedet for opkald midt i madlavningen.">Guests pre-order and book a table on the restaurant's own site. The kitchen gets <b>one overview</b> &mdash; instead of phone calls in the middle of service.</p>
          <ul class="facts">
            <li data-da="Bestilling og betaling p&aring; egen side">Ordering and payment on their own site</li>
            <li data-da="Bordbooking uden telefonen i h&aring;nden">Table booking without picking up the phone</li>
            <li data-da="K&oslash;kkensk&aelig;rm med dagens ordrer">A kitchen screen with the day's orders</li>
          </ul>
        </div>

        <div class="devices" aria-hidden="true">
          <div class="mac">
            <div class="lid">
              <div class="bez">
                <span class="notch"></span>
                <div class="screen">
                  <img src="media/spiis-mac.jpg?v=1" width="1500" height="970" loading="lazy" decoding="async" alt="" />
                  </div>
                </div>
              </div>
            <div class="foot"></div>
          </div>
          <div class="iphone">
            <span class="b act"></span><span class="b vu"></span><span class="b vd"></span><span class="b pw"></span>
            <div class="inn"><div class="in2">
              <div class="screen">
                <span class="isl"></span>
                <img src="media/spiis-phone.jpg?v=1" width="580" height="1257" loading="lazy" decoding="async" alt="" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="wrap" data-brand="mosede">
        <div class="col">
          <p class="kicker" data-da="Caf&eacute; &middot; Menukort &amp; sk&aelig;rme">Café &middot; Menus &amp; screens</p>
          <h2 class="cname" data-split>Mosede Havnecafe</h2>
          <a class="curl" href="https://mosedehavnecafe.dk" target="_blank" rel="noopener">mosedehavnecafe.dk</a>
          <p class="blurb" data-da="Hjemmeside, menukort og <b>sk&aelig;rmene over disken</b> k&oslash;rer p&aring; samme system. En pris rettes &eacute;t sted og skifter alle steder.">The site, the menus and <b>the screens above the counter</b> all run on one system. A price is changed in one place and changes everywhere.</p>
          <ul class="facts">
            <li data-da="Menukort der styres &eacute;t sted">Menus run from one place</li>
            <li data-da="Sk&aelig;rme i caf&eacute;en, opdateret automatisk">Screens in the café, updated by themselves</li>
            <li data-da="S&aelig;sonkort uden at r&oslash;re koden">Seasonal menus without touching the code</li>
          </ul>
        </div>

        <div class="devices" aria-hidden="true">
          <div class="mac">
            <div class="lid">
              <div class="bez">
                <span class="notch"></span>
                <div class="screen">
                  <img src="media/mosede-mac.jpg?v=1" width="1500" height="970" loading="lazy" decoding="async" alt="" />
                </div>
              </div>
            </div>
            <div class="foot"></div>
          </div>
          <div class="iphone">
            <span class="b act"></span><span class="b vu"></span><span class="b vd"></span><span class="b pw"></span>
            <div class="inn"><div class="in2">
              <div class="screen">
                <span class="isl"></span>
                <img src="media/mosede-phone.jpg?v=2" width="608" height="1317" loading="lazy" decoding="async" alt="" />
              </div>
            </div></div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ===================== THE APP AND THE ADMINISTRATION =====================
       One pinned stage with a real phone in it, in three acts: the guest
       app arrives and turns, the administration takes its place, and the
       screen changes from the inside while a notification lands on the
       glass. It follows the last customer with no pause between them. -->
  <section class="scene tel" id="telefoner" data-screen-label="app">
    <div class="stage">
      <div class="glow" aria-hidden="true"></div>
      <canvas class="tel-canvas" id="telCanvas" aria-hidden="true"></canvas>
      <div class="tel-text">
        <div class="tel-bottom">
          <div class="tel-act" data-act="1">
            <h2 data-split data-da="Ikke nok med at design og funktionalitet er i top.">Design and function at the top is not enough.</h2>
            <p data-da="Vi bygger til dem der skal bruge det &mdash; ikke til en portfolio.">We build for the people who have to use it &mdash; not for a portfolio.</p>
            <ul class="tel-tags">
              <li data-da="Tilg&aelig;ngelighed">Accessibility</li>
              <li data-da="Brugervenlighed">Usability</li>
            </ul>
          </div>
        </div>
        <div class="tel-side"><div class="tel-side-in">
          <div class="tel-act" data-act="2">
            <h2 data-split data-da="Komplet administration for jer.">Complete administration, for you.</h2>
            <p data-da="Alt det kunderne ikke ser: priser, menukort, bookinger og bestillinger &mdash; &eacute;t sted, uden en udvikler i r&oslash;ret.">Everything the customers never see: prices, menus, bookings and orders &mdash; in one place, with no developer on the phone.</p>
          </div>
          <div class="tel-act" data-act="3">
            <h2 data-split data-da="Admin-app med notifikationer.">An admin app that tells you.</h2>
            <p data-da="Nemt at navigere og administrere &mdash; ogs&aring; midt i en travl service, fra telefonen i forkl&aelig;det.">Easy to move around and run &mdash; also in the middle of a busy service, from the phone in your apron.</p>
            <ul class="tel-tags">
              <li data-da="Notifikationer">Notifications</li>
              <li data-da="&Eacute;t tryk til handling">One tap to act</li>
            </ul>
          </div>
        </div></div>
      </div>
    </div>
  </section>


  <!-- ===================== CONTACT — the letter =====================
       Not a form and not a card with a button in it: a letter that writes
       itself, is sent, is answered, and hands the question back. Four acts
       on one pinned stage, on the same engine as every other scene. -->
  <section class="scene kt" id="contact" data-screen-label="contact">
    <div class="stage">
      <span class="kt-aura a1" id="ktA1" aria-hidden="true"></span>
      <span class="kt-aura a2" id="ktA2" aria-hidden="true"></span>
      <span class="kt-vign" aria-hidden="true"></span>

      <div class="kt-rig" id="ktRig">

        <!-- ONE card. Not three.

             The letter, the receipt and the answer were three boxes taking
             turns on the same spot, and however carefully two of them are
             cross-faded at matching size, for a handful of frames there are
             two outlines on the glass — one shape a little bigger than the
             other, both lit. That is what was wrong with it: you could see
             the join, so it was never one thing changing, it was two things
             swapping.

             There is one box now, and it is the size of the largest of the
             three. Everything that happens to it is a change of shape:
             clipped down to the letter's height, then to the receipt's
             footprint, then opened out to the answer's. What is printed on
             it is three faces stacked on the same spot, and only the shape
             says which state it is in. There is never a second edge to see,
             because there is never a second object. -->
        <span class="kt-cast" id="ktCast" aria-hidden="true"></span>
        <article class="kt-card" id="ktCard">

          <div class="kt-face f-ask" id="ktFAsk">
            <div class="kt-meta"><b data-da="Til">To</b> mgersel@lesreg.com<em></em><span class="kt-tag" data-da="Ny besked">New message</span></div>
            <p class="kt-msg"><span id="ktTyped"></span><i class="kt-caret" id="ktCaret" aria-hidden="true"></i></p>
          </div>

          <div class="kt-face f-sent" id="ktFSent" aria-hidden="true">
            <svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5 9.5 18 20 6.5"/></svg>
            <span data-da="Sendt">Sent</span>
          </div>

          <!-- the answer is the one face that is in the flow, so the box is
               its size and the other two are clips of it -->
          <div class="kt-face f-reply" id="ktFReply">
            <div class="kt-meta"><b data-da="Svar">Reply</b> <span data-da="efter 14 minutter">after 14 minutes</span><em></em><span class="kt-tag">Mikkel</span></div>
            <p class="kt-msg"><span id="ktRTyped"></span><i class="kt-caret" id="ktRCaret" aria-hidden="true"></i><s id="ktRSub" data-da="Jeg ringer i morgen formiddag, s&aring; gennemg&aring;r vi det hele &mdash; og I f&aring;r en plan med fast pris inden weekenden.">I&rsquo;ll call tomorrow morning and we&rsquo;ll go through all of it &mdash; and you&rsquo;ll have a plan with a fixed price before the weekend.</s></p>
            <div class="kt-from">
              <svg viewBox="0 0 128 128" aria-hidden="true"><path d="M0 0H94l34 34v94H0Z" fill="#e8eef4"/><path d="M44 28h18v62h38v18H44Z" fill="#0c0e11"/></svg>
              <div><b>Mikkel Sten Gersel</b><s data-da="Lesreg &middot; softwarehus">Lesreg &middot; software house</s></div>
            </div>
          </div>
        </article>

        <!-- the two texts live here so the language switch can reach them;
             the act above reads them a character at a time -->
        <p class="kt-letter" id="ktLetter" data-da="Hej Lesreg. Vi har en caf&eacute; p&aring; havnen, og vi bruger for lang tid p&aring; telefonen. Kan I bygge noget, vi selv kan styre?">Hi Lesreg. We run a caf&eacute; down by the harbour, and we spend far too long on the phone. Could you build us something we can run ourselves?</p>
        <p class="kt-letter" id="ktRSrc" data-da="Ja. Det kan vi bygge.">Yes. We can build that.</p>

        <div class="kt-finale" id="ktFin">
          <h2 data-split data-da="Har I noget p&aring; hjernen?">Got something on your mind?</h2>
          <a class="kt-mail" href="mailto:mgersel@lesreg.com">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><path d="M3 6.5 12 13.5 21 6.5"/></svg>
            mgersel@lesreg.com
          </a>
          <span class="kt-note" data-da="Alt bliver besvaret.">Everything gets an answer.</span>
        </div>

      </div>
    </div>
  </section>

  <!-- ===================== FOOTER ===================== -->
  <footer class="footer">
    <div class="footer-inner">
      <a class="brand" href="#top">Lesreg</a>
      <div class="links">
        <a href="https://spiis.dk" target="_blank" rel="noopener">Spiis</a>
        <a href="https://mosedehavnecafe.dk" target="_blank" rel="noopener">Mosede Havnecafe</a>
        <a href="mailto:mgersel@lesreg.com" data-da="Kontakt">Contact</a>
      </div>
      <span class="copy">© 2026 Lesreg</span>
    </div>
  </footer>
  </div><!-- /.site-reveal -->
`;
