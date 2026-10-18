/* Why Lesreg, the price. Above, the classic software house: the hours run
   at DKK 1,000 an hour, and its sum and its line climb and climb. Below,
   Lesreg: from DKK 50 an hour, one price agreed before the start, and its
   line stays flat. The same clock runs under both. An example. */
import React from 'react';
import { useT, useFonts, seg, clamp } from './common';
import { Stage, Plate, Chip, Foot, da, FIELD_W, PORC, OBS, ULTRA } from './WhyKit';
export { WHY_W, WHY_H } from './WhyKit';

export const PRIS_S = 6.6;
const T0 = 0.25, T1 = 6.1; // the clock under both fields
const FH = 106; // the field's drawing height, above its foot

// the classic line: up and up, a little uneven, as hours are
const PTS = (() => {
  const p: [number, number][] = [];
  for (let i = 0; i <= 40; i++) {
    const x = i / 40;
    const y = Math.pow(x, 1.15) + (i % 3 === 1 ? 0.035 : i % 5 === 2 ? -0.03 : 0);
    p.push([x, clamp(y, 0, 1)]);
  }
  return p;
})();

export const WhyPris: React.FC = () => {
  useFonts();
  const { t } = useT();
  const c = seg(t, T0, T1);
  const hours = 85 * Math.pow(c, 1.15);
  const run = 0.55 + 0.45 * Math.abs(Math.sin(t * 3.2));
  // the classic line up to now, and its head
  const i = Math.min(PTS.length - 2, Math.floor(c * 40)), f = c * 40 - i;
  const head: [number, number] = [PTS[i][0] + (PTS[i + 1][0] - PTS[i][0]) * f, PTS[i][1] + (PTS[i + 1][1] - PTS[i][1]) * f];
  const yOf = (y: number) => FH - 6 - y * (FH - 14);
  const pts = [...PTS.filter(([x]) => x <= c), head].map(([x, y]) => `${(x * FIELD_W).toFixed(1)},${yOf(y).toFixed(1)}`).join(' ');
  const flatY = FH - 40;

  return (
    <Stage>
      <Plate k="them" label="Klassisk softwarehus" chip={<Chip k="them" dot="run">timer løber</Chip>}
        value={da(hours * 1000)} unit="kr." line={<>1.000 kr./t · {Math.floor(hours)} timer</>}>
        <svg width={FIELD_W} height={FH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
          <polyline points={pts} fill="none" stroke={PORC} strokeOpacity=".85" strokeWidth="3" strokeLinejoin="round" />
          <circle cx={head[0] * FIELD_W} cy={yOf(head[1])} r="9" fill={PORC} opacity={run} />
        </svg>
        <Foot k="them" a="start" b="nu" />
      </Plate>
      <Plate k="us" label="Lesreg" chip={<Chip k="us" dot="now">fast pris</Chip>}
        value="50" unit="kr./t" line="Én pris, aftalt før vi starter">
        <svg width={FIELD_W} height={FH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
          <line x1="0" y1={flatY} x2={Math.max(1, c * FIELD_W)} y2={flatY} stroke={OBS} strokeWidth="3" strokeLinecap="round" />
          <circle cx={c * FIELD_W} cy={flatY} r="18" fill={ULTRA} opacity=".18" />
          <circle cx={c * FIELD_W} cy={flatY} r="10" fill={ULTRA} />
        </svg>
        <Foot k="us" a="start" b="nu" />
      </Plate>
    </Stage>
  );
};
