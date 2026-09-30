# Stilarkene

De ni der indlæses i `app/layout.tsx` er den håndskrevne sides egne,
kopieret uændret på nær én ting: relative stier til billeder og film er
gjort absolutte, fordi Next serverer stilarket fra et andet sted end
repoets rod.

Rækkefølgen er ikke til forhandling. En god del af designet er én fil der
retter en anden — `mork.css` gør siden mørk oven på den lyse, `dybde.css`
lægger rummet under det hele. Bytter man om, skifter siden udseende.

`precision.css` er væk igen. Den lå her som tokens fra det private
Figma-bibliotek, mens det var uafklaret om siden skulle skifte sprog. Det
skulle den ikke.
