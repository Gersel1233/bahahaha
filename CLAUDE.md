# Lesreg — læs det her først

Det her repo er **lesreg.com**: Mikkels eget udstillingsvindue. Det er ikke et
kundeprojekt. Siden viser, hvad Lesreg laver — først og fremmest Fyon — og
dens job er at se skarp ud og indlæse hurtigt.

Skriv på dansk til Mikkel. Han ejer siden og er ikke programmør.

## Sådan går det live

`main` går **direkte i luften** på lesreg.com. Der er ingen udviklingsgren og
ingen mellemstation: et push er en udgivelse.

Det er en udstillingsside, ikke en bestillingsside — ingen kunder mister en
bestilling, hvis noget knækker. Så små ændringer må gerne gå direkte op.
**Større ting — ny sektion, omlægning af forsiden, noget der ændrer hvad siden
siger om forretningen — skal have Mikkels ja først.**

Efter et push: bekræft at deployet er grønt, og sig ærligt hvad du ikke kunne
verificere.

## Sådan er den bygget

- Almindelig HTML/CSS/JavaScript. Intet byggetrin. GitHub Pages.
- Hele mappen **er** siden — `index.html` ligger i roden.
- Designet er sidens produkt. `liquid-glass.css`, `fyon.css`, `lesreg.css` og
  `loader.js` bærer udtrykket. Lav ikke om på dem uden grund.
- `.claude/skills/motion-framer/` er en skill til bevægelse og animation.

## Det der er værd at passe på

1. **Siden skal indlæse hurtigt.** Den er 87 MB i repoet, og det meste er
   medier. Lægger du billeder eller film til, så komprimér dem først — en
   langsom forside er det eneste, der for alvor kan skade en udstillingsside.
2. **Udviklingsfiler hører ikke på nettet.** Deployet lagde hele mappen op,
   så `.claude/` lå offentligt. Der er nu et trin i
   `.github/workflows/deploy.yml`, der hedder **"Fjern udviklingsfiler"**.
   Skal der flere med, er det ét ord pr. mappe — men linjen bruger `rm -rf`,
   som sletter uden at spørge. Simulér det først på en kopi, og tjek at
   `index.html` stadig er der. Skriv det aldrig direkte ind.
3. **Tjek det på en telefon.** Det meste trafik til sådan en side kommer fra
   et link på mobilen.

## gstack

Repoet henter [gstack](https://github.com/garrytan/gstack) automatisk, når en
session starter (`.claude/hooks/install-gstack.sh`, ca. 15 sekunder). Går
hentningen galt, kører sessionen videre uden — den må aldrig blokere arbejdet.

Til lige netop den her side er design-delen den interessante:
`/design-consultation` (helt designsystem), `/design-shotgun` (flere varianter
at vælge imellem), `/design-review` (finder skæve mellemrum, rodet hierarki og
AI-agtigt fyld) og `/design-html`. Dertil `/health` for overblik og `/review`
før noget større går op.

Browser-delen (`/qa`, `/browse`, `/design-review`, `/scrape`) virker ikke i
sky-sessioner: proxyen bryder krypteringen, og Chromium stoler ikke på den.
Slå aldrig krypteringstjek fra for at komme udenom. På en almindelig computer
virker de fint.
