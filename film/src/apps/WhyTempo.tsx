/* Why Lesreg, the speed. The same small change, asked of both. Above, the
   classic software house: an auto-reply, then a quote, a queue, a build and
   a test, and the working days are crossed off one by one, ten of them.
   Below, Lesreg: you write, we change it, and it is live the same day. An
   example. */
import React from 'react';
import { useT, useFonts, seg, out3 } from './common';
import { Stage, Plate, Chip, Foot, FIELD_W, PORC, OBS, LIME, ULTRA } from './WhyKit';

export const TEMPO_S = 6.8;
const N = 10, CG = 12, CW = (FIELD_W - (N - 1) * CG) / N, CH = 72, CT = 18;
const D0 = 0.5, D1 = 5.9; // the ten days go by

const Cells: React.FC<{ fill: (i: number) => number; on: string; off: string; mark?: number }> = ({ fill, on, off, mark = 0 }) => (
  <>
    {Array.from({ length: N }, (_, i) => {
      const q = fill(i);
      return (
        <span key={i} style={{ position: 'absolute', left: i * (CW + CG), top: CT, width: CW, height: CH, borderRadius: 16, background: off, overflow: 'hidden' }}>
          <i style={{ position: 'absolute', inset: 0, background: on, transformOrigin: '0 50%', transform: `scaleX(${q})` }} />
          {i === 0 && mark > 0 && (
            <svg style={{ position: 'absolute', left: (CW - 40) / 2, top: (CH - 40) / 2 }} width="40" height="40" viewBox="0 0 24 24">
              <path d="M5 12.5 10 17.5 19.5 7" fill="none" stroke={PORC} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="24" strokeDashoffset={24 * (1 - mark)} />
            </svg>
          )}
        </span>
      );
    })}
  </>
);

export const WhyTempo: React.FC = () => {
  useFonts();
  const { t } = useT();
  const c = seg(t, D0, D1) * N;
  const day = Math.min(N, Math.max(1, Math.ceil(c)));
  const step = ['Autosvar', 'Tilbud', 'Tilbud', 'I kø', 'I kø', 'I kø', 'Udvikling', 'Udvikling', 'Test', 'Live'][day - 1];
  // Lesreg's: done on the first day, the same morning
  const done = out3(seg(t, 0.55, 1.05));
  const live = out3(seg(t, 1.05, 1.4));

  return (
    <Stage>
      <Plate k="them" label="Klassisk softwarehus" chip={<Chip k="them" dot="run">{step}</Chip>}
        value={String(day)} unit={day === 1 ? 'hverdag' : 'hverdage'} line="Tilbud, kø, udvikling og test">
        <Cells fill={i => Math.max(0, Math.min(1, c - i))} on="rgba(246,244,239,.55)" off="rgba(246,244,239,.08)" />
        <Foot k="them" a="dag 1" b="dag 10" />
      </Plate>
      <Plate k="us" label="Lesreg" chip={<Chip k="us" dot={live > 0.5 ? 'now' : null}>{live > 0.5 ? 'live' : 'rettes'}</Chip>}
        value="I dag" unit="live" line="I skriver. Vi retter det. Det er live.">
        <Cells fill={i => (i === 0 ? done : 0)} on={OBS} off={LIME} mark={live} />
        <i style={{ position: 'absolute', left: CW + 6, top: CT + CH / 2 - 10, width: 20, height: 20, borderRadius: '50%', background: ULTRA, boxShadow: '0 0 0 7px rgba(36,54,232,.2)', opacity: live }} />
        <Foot k="us" a="dag 1" b="dag 10" />
      </Plate>
    </Stage>
  );
};
