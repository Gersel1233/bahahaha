---
name: lesreg-design
description: Lesregs signaturdesign — udtrykket fra lesreg.com, som alle Lesregs hjemmesider, systemer, admin-sider og apps skal have. Brug den, når du bygger eller retter UI, layout, knapper, ark (dialoger), kort, tekster, farver, animationer eller admin/dashboard-skærme for Lesreg eller en Lesreg-kunde, og når nogen beder om "Lesregs stil", "signaturen", "liquid glass" eller "samme udseende som lesreg.com".
---

# Lesreg signatur

Det her er udtrykket fra lesreg.com, skrevet ned så det kan bruges ens alle
steder: hjemmesider, systemer, admin, køkkenskærme og apps. Mikkel Gersel
ejer Lesreg og skal godkende større ændringer. Skriv til ham på dansk; han
er ikke programmør.

Udtrykket kort: **navy med liquid glass over farvet lys** på de mørke
flader, **stenfarver på papir** på de lyse, **Chivo** hele vejen, overskrifter
i **to toner**, **én blå accent** (ultramarin) og **én grøn** for det, der er
færdigt. Rigtige skærme, rigtige logoer, rigtige tal. Intet fyld.

## Filerne her

| Fil | Hvad |
|---|---|
| `signatur.css` | Alle tokens og komponenter. Link den, og byg med klasserne. |
| `signatur.js` | Ark (dialoger), kontakter, chips og fade-ind. Lille og uden afhængigheder. |
| `fonts/` | Chivo 300–600 og Fragment Mono, med licenser. Skal ligge ved siden af CSS'en. |
| `eksempel.html` | Alle komponenter på én side. Åbn den og sammenlign med det, du bygger. |
| `lesreg-mark.svg` | Lesregs mærke (kun til Lesreg selv, ikke kundernes sider). |

Brug i et nyt projekt: kopiér hele mappen ind (fx `assets/signatur/`), link
`signatur.css` og `signatur.js`, og byg med klasserne. Sæt kundens farve i
`--brand` — den bruges kun til kundens logo og ét call to action. Resten af
paletten røres ikke.

## Farver (tokens i `signatur.css`)

- **Sten (lyse flader):** porcelain `#F6F4EF` (baggrund), limestone `#E9E5DD`, travertine `#D8D1C5`, ash `#8C8880` (labels), graphite `#46443F` (brødtekst), obsidian `#0E0F10` (tekst og mørke knapper).
- **Navy (mørke flader):** `#05080F` → `#0A1020` → `#101A33` → `#18264A`, med en radial glød øverst (`.dark`).
- **Ultramarin `#2436E8`:** fokus, "nu", det valgte. Aldrig pynt, aldrig store flader.
- **Grøn `#34C759`:** færdig, koblet på, betalt, flueben.
- **Orange `#FF9F0A`:** i gang (statusbjælker, ringe). Varm orange `#F28A3E` kun som lys bag glas.
- Lyset bag glasset er altid blå `rgba(36,54,232,.7)` + orange `rgba(242,138,62,.45)` + himmelblå `rgba(110,170,255,.4)` (`.bloom`).

## Skrift

- **Chivo** til alt. 500 til overskrifter, 400 til tekst, 300 til store tal. **Fragment Mono** kun til ordrenumre, tider, koder og små tekniske mærker.
- **Overskrifter i to toner:** første linje i fuld farve, anden linje i samme skrift og vægt, bare dæmpet (`<span class="tone">`). **Aldrig kursiv, aldrig serif.** Mikkel har bedt om det fjernet overalt.
- Overskrifter: tæt bogstavafstand (-0,035 til -0,045 em), `text-wrap:balance`. Brødtekst: `text-wrap:pretty`, maks ca. 36 em bred.
- Over hver overskrift et **label**: 11 px, 600, store bogstaver, 0,06 em, ash-farvet.
- Store tal (pris, timer, antal): Chivo 300, `tabular-nums`, med enheden lille ved siden af.

## Komponenterne (se `eksempel.html`)

- **Knap** `.btn` (mørk), `.btn.light` (lys), `.btn.glass`: en pille med en **linse** (lille kugle med pil) i enden. 1 px lys langs toppen, hårfin kant, pilen på hele pixels. Hover: løfter 1 px, linsen bliver ultramarin, pilen glider 2 px. Tryk: skalerer til .97. Kun `transform` og `box-shadow` animeres.
- **Glas** `.glass` i en `.stage` med `.bloom` bag: frostet rude (`backdrop-filter: blur(28px) saturate(1.5)`), lys kant fra øverste venstre hjørne (maske-trick i `::after`), stor blød skygge. `.glass.frost` er den lyse udgave. På telefon slås blur fra (performance) — udseendet holder, fordi lyset bag allerede er blødt.
- **Bar** `.tb`: en kapsel af glas øverst, 60 px høj, kun mærke + navn, stille links, sprog som lille segment, én slank knap. Under 1100 px: menuknap i stedet for links.
- **Ark** `.sheet` (en rigtig `<dialog>`): navy, rejser sig fra bunden på telefon og i midten på computer, luk-knap sticky øverst til højre, mørk dim bag.
- **Chips** `.chip`, **segment** `.seg`, **status** `.badge.ok/.busy/.now/.idle`, flueben `.check`.
- **Indholdsblokke:** "Det får I" `.gets` (seks ruder med ikon), "Før og efter" `.ba` (i dag overstreget → med Lesreg med grønt flueben), pris `.price` (timer stort, Lesreg-pris i lys pille, bureau overstreget), spørgsmål `.faq`.
- **Flader:** `.dark` er navy (siden, ark, hero). `.paper` er en lys flade inde i en mørk side — den sætter tekst, labels og statusmærker tilbage til stenfarverne. Admin `.app` er altid lys.
- **Admin og systemer** (lyse): `.app` med `.side` (sidemenu, valgt punkt i obsidian), `.main`, `.stats`/`.stat` (tal med grøn `+1`), `.table`, `.board`/`.col`/`.ticket` (køkkenskærm: Nye i sort, I gang, Klar; den aktive med ultramarin ramme), `.toggle` (iOS-kontakt, grøn når til), `.field`/`.input` (fokus = ultramarin ring), `.toast`, `.live` (blå prik + "LIVE · …" i mono).

## Regler, Mikkel har sat — følg dem altid

1. **Ingen kursiv og ingen serif.** Heller ikke "for at give lidt varme".
2. **Ingen "01 02 03"-nummerering** af trin eller sektioner.
3. **Ingen opfundne tal eller påstande.** Brug kun rigtige priser, timer og kunder. Eksempeldata (ordre #1042, 389 kr.) må gerne stå i demoer, men aldrig som påstand om resultater.
4. **Intet generisk fyld.** Ingen orange klatter, stiplede pladsholder-bokse, tomme "wireframes", stock-ikoner på række, eller samme skabelon gentaget. Vis **rigtige skærme, rigtige logoer, rigtige data**. Hvert afsnit og hvert kort skal have sit eget udtryk — hvis to ting ligner hinanden, gør dem forskellige.
5. **Navne staves rigtigt:** Spiis (ikke SPIIS), Mosede Havnecafé, Callster (Mikkel er medejer), e-conomic, Dinero, Planway, Calendly, Flatpay, Stripe, Shopify, OnlinePOS. Brug kundernes rigtige app-ikoner, aldrig en tegnet erstatning.
6. **Logoer** som runde badges i høj opløsning (WebP 256 px fra simple-icons eller kundens egne), aldrig slørede eller små rasterbilleder.
7. **Skarphed:** ikoner og små UI-dele tegnes i kode (SVG/CSS) eller som billeder i 2–3× opløsning. SVG med `filter`/skygge bliver blødt i Safari — lav dem som WebP.
8. **Animationer skal leve, men roligt:** løkker på 4–9 s, `cubic-bezier(.2,.8,.2,1)`, kun `transform`/`opacity`, kører kun mens de er på skærmen, og respekterer `prefers-reduced-motion`. Noget skal ske (data der flytter sig, status der skifter, flueben der kommer) — ikke bare pynt der svæver.
9. **Ingen hvide striber i Safari:** `theme-color`, `html` og `body` skal have samme farve som fladen øverst/nederst fra første billede (ikke først når et script har kørt).
10. **Telefonen først.** Tjek altid 390 px og 1440 px (og gerne 1920). Ingen vandret scroll. Tekst må ikke løbe ind i andet.
11. **Hurtig:** komprimér alt (WebP, video i 30 fps, x264 crf ~25 / VP9), indlæs film først når de er tæt på, ingen tunge biblioteker.
12. **Tekst:** dansk, "I/jer" til kunden, korte sætninger, konkret og lidt følelsesmæssig ("Fredag aften, uden kaos."), aldrig sælger-sprog. Sig hvad kunden får, hvad det koster, og hvad de selv skal gøre.

## Sådan arbejder du

1. Start fra `signatur.css` og klasserne — opfind ikke nye farver, skygger eller radier.
2. Byg med rigtigt indhold fra start (kundens skærme, logoer, priser).
3. **Tag skærmbilleder** (Playwright/Chromium) på 390 og 1440 px af hver ændring og se på dem, før du siger, det er færdigt. Ret det, der ser skævt, generisk eller sløret ud.
4. Sig ærligt til Mikkel, hvad du ikke har kunnet tjekke (fx en rigtig iPhone i Safari).
