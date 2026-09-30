export default function Foot({ lang }: { lang: 'da'|'en' }){
  const t = lang === 'da'
    ? { l:'Lesreg — softwarehus. Vi tegner det, bygger det og passer det bagefter.', r:'lesreg.com' }
    : { l:'Lesreg — software house. We draw it, build it and look after it afterwards.', r:'lesreg.com' };
  return (
    <div className="foot field">
      <span className="lab">{t.l}</span>
      <span className="lab">{t.r}</span>
    </div>
  );
}
