/* Why Lesreg, the money. On the app: an order of DKK 500 through a
   platform, and the platform's commission torn off its end; the finger
   moves the lens to Lesreg, the business's own site, and the commission is
   0 %, the whole order theirs. */
import React from 'react';
import { seg, out3, io3 } from './common';
import { WhyFilm, Face, Now, P, FW, OBS, GRAPH, ASH, SWITCH, WHY_S } from './WhyKit';

export const PENGE_S = WHY_S;
const BT = 20, BH = 24, CUT = 0.24;

const them = (t: number): Face => {
  const fill = out3(seg(t, 0.2, 0.9));
  const tear = io3(seg(t, 1.5, 2.4));
  return {
    label: 'Via en platform', value: '500', unit: 'kr.', delta: 'En bestilling · minus platformens kommission', axis: ['0', '500 kr.'],
    field: <div style={{ position: 'absolute', left: 0, top: P(BT), width: P(FW), height: P(BH), clipPath: `inset(-200px ${(1 - fill) * 100}% -200px 0)` }}>
      <i style={{ position: 'absolute', left: 0, top: 0, width: P(FW * (1 - CUT) - 2), height: P(BH), borderRadius: `${P(6)}px ${P(2)}px ${P(2)}px ${P(6)}px`, background: GRAPH }} />
      <i style={{ position: 'absolute', left: P(FW * (1 - CUT)), top: 0, width: P(FW * CUT), height: P(BH), borderRadius: `${P(2)}px ${P(6)}px ${P(6)}px ${P(2)}px`,
        background: `repeating-linear-gradient(135deg, ${ASH} 0 ${P(3)}px, transparent ${P(3)}px ${P(6)}px)`, boxShadow: `inset 0 0 0 ${P(1)}px ${ASH}`,
        transformOrigin: '0 100%', opacity: 1 - tear, transform: `translate(${P(10) * tear}px, ${P(26) * tear}px) rotate(${14 * tear}deg)` }} />
      <span style={{ position: 'absolute', left: P(FW * (1 - CUT)), top: 0, width: P(FW * CUT), height: P(BH), display: 'grid', placeItems: 'center',
        font: `400 ${P(10)}px/1 'Fragment Mono', monospace`, color: GRAPH, opacity: seg(t, 2.2, 2.5) }}>kommission</span>
    </div>,
  };
};
const us = (t: number): Face => {
  const fill = out3(seg(t, SWITCH + 0.15, SWITCH + 0.85));
  return {
    label: 'Lesreg · jeres egen side', value: '0', unit: '% kommission', delta: 'Samme bestilling · 500 kr. til jer', axis: ['0', '500 kr.'],
    field: <>
      <div style={{ position: 'absolute', left: 0, top: P(BT), width: P(FW), height: P(BH), borderRadius: P(6), background: OBS, clipPath: `inset(0 ${(1 - fill) * 100}% 0 0 round ${P(6)}px)` }} />
      {fill > 0.95 && <Now x={FW - 12} y={BT + BH / 2} />}
    </>,
  };
};

export const WhyPenge: React.FC = () => (
  <WhyFilm ghost="0" context={'Omsætning  ·  eksempel'} them={them} us={us} plate={['Lesreg · omsætning', '0 % kommission', 'hele bestillingen går til jer']} />
);
