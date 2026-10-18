/* Why Lesreg, the money. The same order of DKK 500 comes in twice. Above,
   through a platform: the order fills its bar, and then the platform's
   commission is torn off its end. Below, on the business's own site, built
   by Lesreg: the bar fills, and it all stays. An example. */
import React from 'react';
import { useT, useFonts, seg, out3, io3, mix } from './common';
import { Stage, Plate, Chip, Foot, FIELD_W, PORC, OBS, ULTRA, ASH } from './WhyKit';
import { MONO } from './common';

export const PENGE_S = 6.4;
const BT = 14, BH = 76, CUT = 0.24;

export const WhyPenge: React.FC = () => {
  useFonts();
  const { t } = useT();
  const fill = out3(seg(t, 0.3, 1.2));
  // the commission: it shakes loose, and goes
  const tear = io3(seg(t, 1.9, 2.9));
  const shake = t > 1.6 && t < 1.95 ? Math.sin((t - 1.6) * 60) * 3 : 0;
  const lbl = seg(t, 2.6, 3.0);
  const cutW = FIELD_W * CUT;

  return (
    <Stage>
      <Plate k="them" label="Via en platform" chip={<Chip k="them" dot="run">kommission</Chip>}
        value="500" unit="kr." line="Platformen tager sin procent af hver bestilling">
        <div style={{ position: 'absolute', left: 0, top: BT, width: FIELD_W, height: BH, clipPath: `inset(-200px ${(1 - fill) * 100}% -200px 0)` }}>
          <i style={{ position: 'absolute', left: 0, top: 0, width: FIELD_W - cutW - 4, height: BH, borderRadius: '18px 6px 6px 18px', background: 'rgba(246,244,239,.8)' }} />
          <i style={{ position: 'absolute', left: FIELD_W - cutW, top: 0, width: cutW, height: BH, borderRadius: '6px 18px 18px 6px',
            background: 'repeating-linear-gradient(135deg, rgba(246,244,239,.55) 0 9px, rgba(246,244,239,.18) 9px 18px)',
            transformOrigin: '0 100%', opacity: 1 - tear,
            transform: `translate(${tear * 30 + shake}px, ${tear * 110}px) rotate(${tear * 16}deg)` }} />
        </div>
        <span style={{ position: 'absolute', left: FIELD_W - cutW, top: BT, width: cutW, height: BH, display: 'grid', placeItems: 'center', borderRadius: '6px 18px 18px 6px',
          boxShadow: 'inset 0 0 0 2px rgba(246,244,239,.28)', font: `400 30px/1 ${MONO}`, color: 'rgba(246,244,239,.75)', opacity: lbl }}>kommission</span>
        <Foot k="them" a="0" b="500 kr." />
      </Plate>
      <Plate k="us" label="Lesreg" chip={<Chip k="us" dot="now">0 % kommission</Chip>}
        value="500" unit="kr. til jer" line="Bestillingen kommer ind på jeres egen side">
        <div style={{ position: 'absolute', left: 0, top: BT, width: FIELD_W, height: BH, clipPath: `inset(0 ${(1 - fill) * 100}% 0 0 round 18px)` }}>
          <i style={{ position: 'absolute', inset: 0, borderRadius: 18, background: OBS }} />
          <i style={{ position: 'absolute', right: 28, top: BH / 2 - 10, width: 20, height: 20, borderRadius: '50%', background: ULTRA, boxShadow: '0 0 0 7px rgba(36,54,232,.35)', opacity: seg(t, 1.1, 1.3) }} />
        </div>
        <Foot k="us" a="0" b="500 kr." />
      </Plate>
    </Stage>
  );
};
