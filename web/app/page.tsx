'use client';
import { useEffect, useState } from 'react';
import Bar from '../components/Bar';
import Foot from '../components/Foot';
import Shot from '../components/Shot';

/* Everything the page says is something the old one already stood by. No
   figure here is new, because none was given to me: the two customers,
   the fixed price, the one house — that is the whole of the claim. */

const COPY = {
  da: {
    eyebrow: 'Lesreg — softwarehus',
    h1a: 'Vi bygger systemerne', h1b: 'der driver forretningen.',
    meta: [
      ['Disciplin', 'Systemer i drift'],
      ['Model', 'Ét hus · én regning'],
      ['Pris', 'Fast, aftalt inden vi starter'],
      ['I drift', 'Spiis · Mosede Havnecafé'],
    ],
    s1l: '01 — Hvad et softwarehus er', s1r: 'Under samme tag',
    s1h: 'Et softwarehus tegner, bygger og passer software under samme tag.',
    s1p: 'Ikke et bureau der sender arbejdet videre. Ikke en udvikler der afleverer og forsvinder. Lesreg er sådan et hus — og huset er et team.',
    s2l: '02 — Hvorfor det betyder noget', s2r: 'Tre bliver til ét',
    s2h: 'Normalt skal I hyre tre.',
    cells: [
      ['01', 'Designbureau', 'tegner det'],
      ['02', 'Udvikler', 'bygger det'],
      ['03', 'Drift', 'holder det oppe'],
    ],
    answer: ['Lesreg', 'Ét hus', 'én regning · ét ansvar'],
    s2p: 'Tre aftaler, tre regninger, og ingen der har ansvaret når noget ikke virker. Et softwarehus er ét sted at gå hen.',
    s3l: '03 — Hvorfor Lesreg', s3r: 'Huset er et team',
    principles: [
      ['01', 'Ingen led imellem', 'I taler med dem, der bygger det. En rettelse tager timer, ikke uger.'],
      ['02', 'Ingen der forsvinder bagefter', 'Samme hænder passer det, når det er i drift.'],
      ['03', 'Fast pris, aftalt på forhånd', 'Aftalt inden vi starter — og ingen kommission af jeres omsætning.'],
    ],
    s4l: '04 — I drift lige nu', s4r: 'To systemer',
    th: ['Kunde', 'System', 'Status', 'Adresse'],
    rows: [
      ['Spiis', 'Bestilling · booking · køkkenskærm', 'I drift', 'spiis.dk'],
      ['Mosede Havnecafé', 'Menukort · skærme over disken', 'I drift', 'mosedehavnecafe.dk'],
    ],
    work: [
      ['Spiis', 'Gæsterne forudbestiller og booker bord på restaurantens egen side. Køkkenet får ét overblik — i stedet for opkald midt i madlavningen.'],
      ['Mosede Havnecafé', 'Is, smørrebrød og mad direkte ved havnen. Menukortet og skærmene over disken kører på ét sted, og prisen ændres ét sted og skifter alle vegne.'],
    ],
    s5l: '05 — Kontakt', s5r: 'Vi svarer samme dag',
    s5h: 'Har I noget på hjernen?',
    s5p: 'Skriv hvad I gerne vil have bygget, så vender vi tilbage med en plan og en fast pris.',
    f: { name: 'Navn og virksomhed', mail: 'E-mail', msg: 'Hvad skal bygges?',
         hint: 'Åbner jeres mailprogram med teksten. Vi gemmer ingenting her på siden.',
         send: 'Send', direct: 'Eller skriv direkte til' },
  },
  en: {
    eyebrow: 'Lesreg — software house',
    h1a: 'We build the systems', h1b: 'that run the business.',
    meta: [
      ['Discipline', 'Systems in production'],
      ['Model', 'One house · one invoice'],
      ['Price', 'Fixed, agreed before we start'],
      ['Live', 'Spiis · Mosede Havnecafé'],
    ],
    s1l: '01 — What a software house is', s1r: 'Under one roof',
    s1h: 'A software house draws, builds and looks after software under one roof.',
    s1p: 'Not an agency that passes the work on. Not a developer who hands it over and disappears. Lesreg is a house like that — and the house is a team.',
    s2l: '02 — Why it matters', s2r: 'Three become one',
    s2h: 'Normally you hire three.',
    cells: [
      ['01', 'Design agency', 'draws it'],
      ['02', 'Developer', 'builds it'],
      ['03', 'Hosting', 'keeps it up'],
    ],
    answer: ['Lesreg', 'One house', 'one invoice · one responsibility'],
    s2p: 'Three contracts, three invoices, and nobody who carries the responsibility when something stops working. A software house is one place to go.',
    s3l: '03 — Why Lesreg', s3r: 'The house is a team',
    principles: [
      ['01', 'Nothing sitting in between', 'You talk to the people building it. A change takes hours, not weeks.'],
      ['02', 'Nobody who disappears afterwards', 'The same hands look after it once it is running.'],
      ['03', 'One fixed price, agreed up front', 'Agreed before we start — and no commission on your revenue.'],
    ],
    s4l: '04 — Live right now', s4r: 'Two systems',
    th: ['Client', 'System', 'Status', 'Address'],
    rows: [
      ['Spiis', 'Ordering · booking · kitchen screen', 'Live', 'spiis.dk'],
      ['Mosede Havnecafé', 'Menus · screens above the counter', 'Live', 'mosedehavnecafe.dk'],
    ],
    work: [
      ['Spiis', 'Guests pre-order and book a table on the restaurant’s own site. The kitchen gets one overview — instead of phone calls in the middle of service.'],
      ['Mosede Havnecafé', 'Ice cream, smørrebrød and food right by the harbour. The menus and the screens above the counter run from one place, and a price is changed once and changes everywhere.'],
    ],
    s5l: '05 — Contact', s5r: 'We answer the same day',
    s5h: 'Got something on your mind?',
    s5p: 'Tell us what you want built, and we will come back with a plan and a fixed price.',
    f: { name: 'Name and company', mail: 'Email', msg: 'What should we build?',
         hint: 'Opens your mail program with the text. Nothing is stored on this page.',
         send: 'Send', direct: 'Or write directly to' },
  },
};

export default function Page(){
  const [lang, setLang] = useState<'da'|'en'>('da');
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lesreg-lang');
      if (saved === 'da' || saved === 'en') { setLang(saved); return; }
    } catch { /* private window */ }
    if (!navigator.language?.toLowerCase().startsWith('da')) setLang('en');
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    try { localStorage.setItem('lesreg-lang', lang); } catch { /* private window */ }
  }, [lang]);
  const t = COPY[lang];

  /* The form has no server behind it, so it does the honest thing and
     hands the text to the visitor's own mail program. A form that looks
     like it sends and does not is worse than no form. */
  function send(e: React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = `${f.get('msg') || ''}\n\n— ${f.get('name') || ''}\n${f.get('mail') || ''}`;
    window.location.href = 'mailto:mgersel@lesreg.com'
      + '?subject=' + encodeURIComponent(String(f.get('name') || 'Henvendelse via lesreg.com'))
      + '&body=' + encodeURIComponent(body);
  }

  return (
    <>
      <Bar lang={lang} setLang={setLang} />

      <header className="hero field" id="top">
        <div className="eyebrow"><i aria-hidden="true" /><span className="lab">{t.eyebrow}</span></div>
        <h1>{t.h1a} <em>{t.h1b}</em></h1>
        <div className="herometa">
          {t.meta.map(([k, v]) => (
            <div key={k}><span className="lab">{k}</span><span>{v}</span></div>
          ))}
        </div>
      </header>

      <section className="sec field" id="hvad">
        <div className="sech"><span className="lab">{t.s1l}</span><span className="lab">{t.s1r}</span></div>
        <h2>{t.s1h}</h2>
        <p className="lede" style={{ marginTop: 'var(--space-6)' }}>{t.s1p}</p>
      </section>

      <section className="sec field">
        <div className="sech"><span className="lab">{t.s2l}</span><span className="lab">{t.s2r}</span></div>
        <h2>{t.s2h}</h2>
        <div className="three" style={{ marginTop: 'var(--space-8)' }}>
          {t.cells.map(([no, b, s]) => (
            <div className="cell" key={no}>
              <span className="no">{no}</span><b>{b}</b><s>{s}</s>
            </div>
          ))}
          <div className="cell answer">
            <span className="no">{t.answer[0]}</span><b>{t.answer[1]}</b><s>{t.answer[2]}</s>
          </div>
        </div>
        <p className="lede" style={{ marginTop: 'var(--space-8)' }}>{t.s2p}</p>
      </section>

      <section className="sec field">
        <div className="sech"><span className="lab">{t.s3l}</span><span className="lab">{t.s3r}</span></div>
        <div className="principles">
          {t.principles.map(([no, b, p]) => (
            <div className="principle" key={no}>
              <span className="no">{no}</span>
              <div><b>{b}</b><p>{p}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="sec field" id="kunder">
        <div className="sech"><span className="lab">{t.s4l}</span><span className="lab">{t.s4r}</span></div>
        <table className="tbl">
          <thead><tr>{t.th.map(h => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {t.rows.map(r => (
              <tr key={r[0]}>
                <td data-th={t.th[0]}>{r[0]}</td>
                <td data-th={t.th[1]}>{r[1]}</td>
                <td data-th={t.th[2]}><span className="dot" aria-hidden="true" />{r[2]}</td>
                <td data-th={t.th[3]} className="data">{r[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="work">
          <div>
            <Shot src="/media/app-2.mp4" poster="/media/spiis-phone.jpg" />
            <h3>{t.work[0][0]}</h3><p>{t.work[0][1]}</p>
          </div>
          <div>
            <Shot src="/media/app-1.mp4" poster="/media/mosede-phone.jpg" />
            <h3>{t.work[1][0]}</h3><p>{t.work[1][1]}</p>
          </div>
        </div>
      </section>

      <section className="sec field" id="kontakt">
        <div className="sech"><span className="lab">{t.s5l}</span><span className="lab">{t.s5r}</span></div>
        <div className="contact">
          <div>
            <h2>{t.s5h}</h2>
            <p className="lede" style={{ marginTop: 'var(--space-6)' }}>{t.s5p}</p>
            <p className="direct lab">
              {t.f.direct} <a href="mailto:mgersel@lesreg.com">mgersel@lesreg.com</a>
            </p>
          </div>
          <form onSubmit={send}>
            <div className="field-row">
              <label className="lab" htmlFor="name">{t.f.name}</label>
              <input id="name" name="name" required autoComplete="organization" />
            </div>
            <div className="field-row">
              <label className="lab" htmlFor="mail">{t.f.mail}</label>
              <input id="mail" name="mail" type="email" required autoComplete="email" />
            </div>
            <div className="field-row">
              <label className="lab" htmlFor="msg">{t.f.msg}</label>
              <textarea id="msg" name="msg" required />
              <p className="hint">{t.f.hint}</p>
            </div>
            <button className="btn" type="submit" style={{ marginTop: 'var(--space-6)' }}>{t.f.send}</button>
          </form>
        </div>
      </section>

      <Foot lang={lang} />
    </>
  );
}
