/* Why Lesreg, the speed. On the app: the classic software house, where a
   small change goes through an auto-reply, a quote, a queue, a build and a
   test while the working days are crossed off; the finger moves the lens to
   Lesreg, and the change is live today. */
import React from 'react';
import { seg, out3 } from './common';
import { WhyFilm, Face, Now, P, FW, OBS, GRAPH, LIME, PORC, SWITCH, WHY_S } from './WhyKit';

export const TEMPO_S = WHY_S;
const N = 10, G = 4, CW = (FW - (N - 1) * G) / N, CT = 18, CHh = 30;
const STEP = ['autosvar', 'tilbud', 'tilbud', 'i kø', 'i kø', 'i kø', 'udvikling', 'udvikling', 'test', 'live'];

const Cells: React.FC<{ q: (i: number) => number; on: string; mark?: number }> = ({ q, on, mark = 0 }) => (
  <>
    {Array.from({ length: N }, (_, i) => (
      <span key={i} style={{ position: 'absolute', left: P(i * (CW + G)), top: P(CT), width: P(CW), height: P(CHh), borderRadius: P(6), background: LIME, overflow: 'hidden' }}>
        <i style={{ position: 'absolute', inset: 0, background: on, transformOrigin: '0 50%', transform: `scaleX(${q(i)})` }} />
        {i === 0 && mark > 0 && <svg style={{ position: 'absolute', left: P((CW - 14) / 2), top: P((CHh - 14) / 2) }} width={P(14)} height={P(14)} viewBox="0 0 24 24">
          <path d="M5 12.5 10 17.5 19.5 7" fill="none" stroke={PORC} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="24" strokeDashoffset={24 * (1 - mark)} /></svg>}
      </span>
    ))}
  </>
);

const them = (t: number): Face => {
  const c = seg(t, 0.2, SWITCH - 0.1) * N;
  const day = Math.min(N, Math.max(1, Math.ceil(c)));
  return {
    label: 'Klassisk softwarehus', value: String(day), unit: day === 1 ? 'hverdag' : 'hverdage', delta: `En lille rettelse · nu: ${STEP[day - 1]}`, axis: ['dag 1', 'dag 10'],
    field: <Cells q={i => Math.max(0, Math.min(1, c - i))} on={GRAPH} />,
  };
};
const us = (t: number): Face => {
  const done = out3(seg(t, SWITCH + 0.3, SWITCH + 0.75));
  const mark = out3(seg(t, SWITCH + 0.7, SWITCH + 1.0));
  return {
    label: 'Lesreg', value: 'I dag', unit: 'live', delta: 'Samme rettelse · I skriver, vi retter den', axis: ['dag 1', 'dag 10'],
    field: <>
      <Cells q={i => (i === 0 ? done : 0)} on={OBS} mark={mark} />
      {mark > 0.5 && <Now x={CW + G + 8} y={CT + CHh / 2} />}
    </>,
  };
};

export const WhyTempo: React.FC = () => (
  <WhyFilm ghost="1" context={'Tempo  ·  eksempel'} them={them} us={us} plate={['Lesreg · tempo', 'Rettet samme dag', 'ingen tilbud  ·  ingen kø']} />
);
