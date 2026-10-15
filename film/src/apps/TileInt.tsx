/* The Integrations tile: a film made with Higgsfield (Kling) — a navy glass
   core with the systems a business already uses floating round it as glass
   tiles, light running from the payment into the core and out to each —
   and over it, sharp, one line saying what has just happened. The tiles are
   kinds of system, not anyone's product. */
import React from 'react';
import { AbsoluteFill, OffthreadVideo, staticFile } from 'remotion';
import { useT, useFonts, seg, out5, Check, SANS, MONO } from './common';
import { TW } from './TileApps';

export const INT_S = 7;
// the plate is 9:16; scaled to cover the tile and set so its tiles sit
// under the tile's words
export const PLATE = { scale: 1.06, y: 40 };
// what has happened, and when the film shows it
export const SAID: [number, string][] = [
  [0.8, 'Betaling modtaget'], [2.7, 'Sendt ind i jeres system'], [4.1, 'Afhentning i kalenderen'],
  [5.1, 'Bogført i regnskabet'], [6.0, 'Registreret i kassen'], [6.55, 'Sms sendt · AI har svaret'],
];

export const TileInt: React.FC = () => {
  useFonts();
  const { t } = useT();
  const w = TW * PLATE.scale, h = w * 16 / 9;
  return (
    <AbsoluteFill style={{ background: '#EFE9DF', overflow: 'hidden', fontFamily: SANS }}>
      <OffthreadVideo src={staticFile('film/assets/int-plate.mp4')} muted style={{ position: 'absolute', width: w, height: h, left: (TW - w) / 2, top: PLATE.y }} />
      {/* the plate's top edge, melted into the tile */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: PLATE.y + 160, background: 'linear-gradient(#EFE9DF 0%, #EFE9DF 30%, rgba(239,233,223,0))' }} />
      {/* the line: each new one comes up as the last goes */}
      <div style={{ position: 'absolute', left: 40, right: 40, bottom: 36, height: 66 }}>
        {SAID.map(([a, s], i) => {
          const inn = out5(seg(t, a, a + 0.35)), go = i < SAID.length - 1 ? seg(t, SAID[i + 1][0] - 0.05, SAID[i + 1][0] + 0.25) : 0;
          if (inn <= 0 || go >= 1) return null;
          return (
            <div key={s} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 66, borderRadius: 33, display: 'flex', alignItems: 'center', gap: 14, padding: '0 22px 0 12px',
              background: 'rgba(255,255,255,.82)', boxShadow: '0 16px 36px rgba(20,33,61,.12), inset 0 1px 0 #fff, inset 0 0 0 1px rgba(20,21,23,.06)',
              opacity: inn * (1 - go), transform: `translateY(${22 * (1 - inn) - 22 * go}px)` }}>
              <span style={{ width: 42, height: 42, borderRadius: '50%', background: '#2F9E5B', display: 'grid', placeItems: 'center', flex: 'none' }}><Check p={seg(t, a + 0.1, a + 0.4)} size={11} color="#fff" width={3.4} /></span>
              <span style={{ font: `500 24px/1 ${SANS}`, color: '#141517' }}>{s}</span>
              <span style={{ marginLeft: 'auto', font: `400 18px/1 ${MONO}`, color: '#8A8780' }}>{i + 1}/{SAID.length}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
