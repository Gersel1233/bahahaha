/* Why Lesreg, the price. On the app: the classic software house, where the
   hours run at DKK 1,000 and the sum and its line climb; the finger moves
   the lens to Lesreg, and the figure says 50 a hour, its line flat. */
import React from 'react';
import { seg, clamp } from './common';
import { WhyFilm, Face, Now, da, P, FW, FH, OBS, SWITCH, WHY_S } from './WhyKit';
export { WHY_W, WHY_H } from './WhyKit';

export const PRIS_S = WHY_S;
const PTS: [number, number][] = Array.from({ length: 31 }, (_, i) => {
  const x = i / 30;
  return [x, clamp(Math.pow(x, 1.2) + (i % 3 === 1 ? 0.04 : i % 4 === 2 ? -0.035 : 0), 0, 1)];
});
const Y = (y: number) => FH - 4 - y * (FH - 8);

const them = (t: number): Face => {
  const c = seg(t, 0.15, SWITCH - 0.05);
  const hours = 85 * Math.pow(c, 1.15);
  const i = Math.min(29, Math.floor(c * 30)), f = c * 30 - i;
  const hx = PTS[i][0] + (PTS[i + 1][0] - PTS[i][0]) * f, hy = PTS[i][1] + (PTS[i + 1][1] - PTS[i][1]) * f;
  const pts = [...PTS.filter(([x]) => x <= c), [hx, hy]].map(([x, y]) => `${P(x * FW).toFixed(1)},${P(Y(y)).toFixed(1)}`).join(' ');
  return {
    label: 'Klassisk softwarehus', value: da(hours * 1000), unit: 'kr.', delta: `1.000 kr./t · ${Math.floor(hours)} timer, og de løber`, axis: ['start', 'nu'],
    field: <svg width={P(FW)} height={P(FH)} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={OBS} strokeWidth={P(1)} strokeLinejoin="round" />
      <circle cx={P(hx * FW)} cy={P(Y(hy))} r={P(4)} fill={OBS} />
    </svg>,
  };
};
const us = (t: number): Face => {
  const c = seg(t, SWITCH + 0.15, SWITCH + 1.2);
  const y = FH * 0.62;
  return {
    label: 'Lesreg', value: '50', unit: 'kr./t', delta: 'Én fast pris, aftalt før vi starter', axis: ['start', 'nu'],
    field: <>
      <svg width={P(FW)} height={P(FH)} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <line x1="0" y1={P(y)} x2={P(Math.max(0.5, c * FW))} y2={P(y)} stroke={OBS} strokeWidth={P(1)} />
      </svg>
      <Now x={c * FW} y={y} />
    </>,
  };
};

export const WhyPris: React.FC = () => (
  <WhyFilm ghost="50" context={'Pris  ·  eksempel'} them={them} us={us} plate={['Lesreg · pris', 'Fra 50 kr. i timen', 'fast pris  ·  ikke 600–1.200']} />
);
