/* Why Lesreg, the speed: a message on the phone. The owner asks for the
   Christmas hours to be changed; the classic way answers with an automatic
   mail, back in five to ten working days. Lesreg types, answers that it is
   done, and the link shows the page with the new hours. An example, under
   no client's name. */
import React from 'react';
import { Img, staticFile } from 'remotion';
import { useT, useFonts, seg, out3, out5, mix, clamp, IOS, StatusBar } from './common';
import { Stage, Mark, WHY_W, OBS, PORC, ULTRA, GRAPH, ASH, TRAV } from './WhyPris';

export const TEMPO_S = 7.6;

// the phone, low on the stage, and its screen
const PW = 840, PX = (WHY_W - PW) / 2, PY = 150, PH = PW * 2336 / 1120;
const SX = PX + PW * 0.0537, SY = PY + PH * 0.024, SW = PW * 0.8917, SHh = PH * 0.952;
const pt = SW / 402;
const P = (n: number) => n * pt;
const BLUE = '#0A84FF', GREY = '#E9E9EB', LABEL2 = 'rgba(60,60,67,.6)';

// a message bubble with iOS's tail
const Bubble: React.FC<{ me?: boolean; children: React.ReactNode; w?: number; pad?: boolean }> = ({ me, children, w, pad = true }) => (
  <div style={{ position: 'relative', alignSelf: me ? 'flex-end' : 'flex-start', maxWidth: P(268), width: w ? P(w) : undefined, padding: pad ? `${P(8)}px ${P(13)}px ${P(9)}px` : 0,
    borderRadius: P(19), background: me ? BLUE : GREY, color: me ? '#fff' : '#000', font: `400 ${P(17)}px/${P(22)}px ${IOS}`, letterSpacing: P(-0.35), overflow: pad ? undefined : 'hidden' }}>
    {children}
    <svg style={{ position: 'absolute', bottom: 0, [me ? 'right' : 'left']: P(-5) } as React.CSSProperties} width={P(17)} height={P(21)} viewBox="0 0 17 21">
      <path d={me ? 'M0 0v13c0 4 3 8 8 8 3 0 6-1 9-1-4-1-6-3-7-6-1-2-1-6-1-14z' : 'M17 0v13c0 4-3 8-8 8-3 0-6-1-9-1 4-1 6-3 7-6 1-2 1-6 1-14z'} fill={me ? BLUE : GREY} />
    </svg>
  </div>
);

// an item of the thread: it comes as iOS brings it, up and out of a small scale
const Item: React.FC<{ q: number; me?: boolean; children: React.ReactNode; gap?: number }> = ({ q, me, children, gap = 8 }) => {
  if (q <= 0) return null;
  return <div style={{ display: 'flex', flexDirection: 'column', marginTop: P(gap), opacity: clamp(q * 2), transformOrigin: me ? '100% 100%' : '0 100%',
    transform: `translateY(${(1 - q) * P(26)}px) scale(${mix(0.86, 1, q)})` }}>{children}</div>;
};
const Stamp: React.FC<{ q: number; children: React.ReactNode }> = ({ q, children }) => (
  <div style={{ textAlign: 'center', marginTop: P(14), marginBottom: P(2), font: `400 ${P(12)}px/1 ${IOS}`, color: LABEL2, opacity: q }}>{children}</div>
);

export const WhyTempo: React.FC = () => {
  useFonts();
  const { t, sp } = useT();
  const phone = out5(seg(t, 0, 0.6));
  const SEND = 0.55, MAIL = 1.45, MAIL_GO = 3.05, TYPE = 3.2, REPLY = 4.0, LINK = 4.55, THANKS = 5.75;
  const q = (at: number) => sp(at, 17, 210, 0.8);
  // the thread rises as it fills, the way it does on the phone
  const off = mix(0, 70, out3(seg(t, LINK - 0.05, LINK + 0.45))) + mix(0, 64, out3(seg(t, THANKS - 0.05, THANKS + 0.4)));
  // the automatic mail, a banner from the top
  const mIn = sp(MAIL, 20, 220, 0.9), mOut = out3(seg(t, MAIL_GO, MAIL_GO + 0.35));
  const dots = (i: number) => 0.35 + 0.65 * Math.max(0, Math.sin((t - TYPE) * 7 - i * 0.9));
  const typing = t >= TYPE && t < REPLY;

  return (
    <Stage>
      <div style={{ position: 'absolute', inset: 0, opacity: phone, transform: `translateY(${(1 - phone) * 90}px)` }}>
        <div style={{ position: 'absolute', left: SX, top: SY, width: SW, height: SHh, borderRadius: '13% / 6.2%', overflow: 'hidden', background: '#fff', fontFamily: IOS }}>
          {/* ---------- the thread ---------- */}
          <div style={{ position: 'absolute', left: P(12), right: P(12), top: P(150) - P(off), display: 'flex', flexDirection: 'column' }}>
            <Stamp q={1}><b style={{ fontWeight: 600 }}>I dag</b> 9.41</Stamp>
            <Item q={q(SEND)} me>
              <Bubble me>Kan I rette åbningstiderne til jul? Vi holder lukket 24.–26. december.</Bubble>
            </Item>
            <div style={{ alignSelf: 'flex-end', marginTop: P(4), marginRight: P(4), font: `600 ${P(11)}px/1 ${IOS}`, color: LABEL2, opacity: seg(t, SEND + 0.4, SEND + 0.6) * (1 - seg(t, THANKS, THANKS + 0.2)) }}>Leveret</div>
            <Stamp q={seg(t, TYPE - 0.1, TYPE + 0.2)}>9.52</Stamp>
            {typing && <Item q={q(TYPE)} gap={6}>
              <Bubble><span style={{ display: 'flex', gap: P(5), padding: `${P(6)}px ${P(2)}px` }}>{[0, 1, 2].map(i => <i key={i} style={{ width: P(8), height: P(8), borderRadius: '50%', background: `rgba(60,60,67,${0.25 + 0.35 * dots(i)})` }} />)}</span></Bubble>
            </Item>}
            <Item q={t >= REPLY ? q(REPLY) : 0} gap={6}>
              <Bubble>Det er rettet. Jeres side er opdateret nu.</Bubble>
            </Item>
            {/* the link, with the page it opens: the hours, the new line marked */}
            <Item q={q(LINK)} gap={4}>
              <Bubble pad={false} w={262}>
                <div style={{ height: P(150), background: PORC, padding: `${P(14)}px ${P(16)}px`, color: OBS, fontFamily: "'Chivo', sans-serif" }}>
                  <div style={{ font: `500 ${P(15)}px/1 'Chivo', sans-serif`, letterSpacing: P(-0.3) }}>Åbningstider</div>
                  {[['Man–fre', '11–21', 0], ['Lør–søn', '10–21', 0], ['24.–26. dec.', 'Lukket', 1]].map(([d, h, nw]) => (
                    <div key={d as string} style={{ display: 'flex', alignItems: 'center', height: P(30), marginTop: P(nw ? 8 : 4), padding: nw ? `0 ${P(8)}px` : 0, borderRadius: P(8),
                      background: nw ? `rgba(36,54,232,${0.1 * seg(t, LINK + 0.5, LINK + 0.9)})` : undefined, borderBottom: nw ? undefined : `1px solid ${TRAV}`,
                      font: `400 ${P(13)}px/1 'Chivo', sans-serif` }}>
                      <span style={{ flex: 1 }}>{d}</span>
                      {nw ? <i style={{ width: P(6), height: P(6), borderRadius: '50%', background: ULTRA, marginRight: P(8), opacity: seg(t, LINK + 0.5, LINK + 0.8) }} /> : null}
                      <span style={{ font: `400 ${P(12)}px/1 'Fragment Mono', monospace`, color: nw ? OBS : GRAPH }}>{h}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding: `${P(9)}px ${P(13)}px ${P(10)}px`, background: GREY }}>
                  <div style={{ font: `600 ${P(14)}px/1.2 ${IOS}`, color: '#000' }}>Åbningstider · Jeres café</div>
                  <div style={{ marginTop: P(3), font: `400 ${P(13)}px/1.2 ${IOS}`, color: LABEL2 }}>jeresside.dk</div>
                </div>
              </Bubble>
            </Item>
            <Item q={q(THANKS)} me gap={10}>
              <Bubble me>Tak, det var hurtigt!</Bubble>
            </Item>
            <div style={{ alignSelf: 'flex-end', marginTop: P(4), marginRight: P(4), font: `600 ${P(11)}px/1 ${IOS}`, color: LABEL2, opacity: seg(t, THANKS + 0.45, THANKS + 0.65) }}><span style={{ fontWeight: 600 }}>Læst</span> <span style={{ fontWeight: 400 }}>9.53</span></div>
          </div>

          {/* ---------- the header, over the thread ---------- */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: P(138), background: 'rgba(249,249,249,.82)', backdropFilter: `blur(${P(20)}px) saturate(1.8)`, borderBottom: `${P(0.5)}px solid rgba(0,0,0,.14)` }}>
            <StatusBar color="#000" />
            <svg style={{ position: 'absolute', left: P(14), top: P(78) }} width={P(13)} height={P(22)} viewBox="0 0 13 22"><path d="M11 2 2 11l9 9" fill="none" stroke={BLUE} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <div style={{ position: 'absolute', left: '50%', top: P(60), transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ width: P(50), height: P(50), borderRadius: '50%', background: OBS, display: 'grid', placeItems: 'center' }}><Mark s={P(22)} c={PORC} bg={OBS} /></span>
              <span style={{ marginTop: P(5), font: `400 ${P(12)}px/1 ${IOS}`, color: '#000' }}>Lesreg <span style={{ color: LABEL2 }}>›</span></span>
            </div>
          </div>

          {/* ---------- the classic way's answer: an automatic mail ---------- */}
          {t > MAIL - 0.05 && mOut < 1 && (
            <div style={{ position: 'absolute', left: P(10), right: P(10), top: P(56) + (1 - mIn) * P(-150) - mOut * P(170), borderRadius: P(24), padding: `${P(12)}px ${P(14)}px`,
              display: 'flex', gap: P(11), alignItems: 'center', background: 'rgba(245,245,247,.92)', boxShadow: `0 ${P(8)}px ${P(30)}px rgba(0,0,0,.18), inset 0 0 0 ${P(0.5)}px rgba(0,0,0,.06)`, zIndex: 70 }}>
              <span style={{ flex: 'none', width: P(38), height: P(38), borderRadius: P(9), background: 'linear-gradient(180deg, #1E9BFF, #0A6CF0)', display: 'grid', placeItems: 'center' }}>
                <svg width={P(24)} height={P(18)} viewBox="0 0 24 18"><rect x="1" y="1" width="22" height="16" rx="2.5" fill="#fff" /><path d="M2 2.5 12 10l10-7.5" fill="none" stroke="#0A6CF0" strokeWidth="1.6" /></svg>
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'flex', justifyContent: 'space-between', font: `600 ${P(15)}px/1.2 ${IOS}`, color: '#000' }}>Klassisk softwarehus<span style={{ font: `400 ${P(12)}px/1.6 ${IOS}`, color: LABEL2 }}>nu</span></span>
                <span style={{ display: 'block', font: `400 ${P(14)}px/1.3 ${IOS}`, color: '#000' }}>Autosvar: Tak for din henvendelse. Vi vender tilbage inden for 5–10 hverdage.</span>
              </span>
            </div>
          )}
        </div>
        <Img src={staticFile('ny/media/dev/iphone-17-pro-2x.webp')} style={{ position: 'absolute', left: PX, top: PY, width: PW, height: PH }} />
      </div>
    </Stage>
  );
};
