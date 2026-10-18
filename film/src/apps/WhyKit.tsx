/* What the three "why Lesreg" films share. Each is the same comparison,
   told the same way, readable from its first picture: two plates on the
   stage, the classic software house above, Lesreg below. A plate is the
   library's Figure (LA31 Data / Figure) at film size: a label, a value in
   Chivo Light with its unit in mono, a line under it, and a field at the
   foot. The film is shown about a third of its size on a phone, so nothing
   in it is drawn smaller than 34 px. */
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { SANS, MONO } from './common';

export const WHY_W = 1080, WHY_H = 1350;
export const NAVY9 = '#05080F', NAVY8 = '#101A33', DEEP = '#2B3F7C';
export const OBS = '#0E0F10', GRAPH = '#46443F', ASH = '#8C8880', TRAV = '#D8D1C5', LIME = '#E9E5DD', PORC = '#F6F4EF', ULTRA = '#2436E8';

// the plates' frames on the stage
export const M = 56, GAP = 28;
export const TOP = { x: M, y: M, w: WHY_W - 2 * M, h: 590 };
export const BOT = { x: M, y: M + 590 + GAP, w: WHY_W - 2 * M, h: WHY_H - 2 * M - 590 - GAP };
export const PAD = 52;
export const FIELD_W = TOP.w - 2 * PAD;

export const Stage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ background: `radial-gradient(120% 70% at 50% 100%, ${DEEP}, ${NAVY8} 48%, ${NAVY9})`, overflow: 'hidden', fontFamily: SANS }}>
    {children}
  </AbsoluteFill>
);

export const Mark: React.FC<{ s: number; c?: string; bg?: string }> = ({ s, c = OBS, bg = PORC }) => (
  <svg width={s} height={s} viewBox="0 0 128 128" style={{ display: 'block', flex: 'none' }}><path d="M0 0H94l34 34v94H0Z" fill={c} /><path d="M44 28h18v62h38v18H44Z" fill={bg} /></svg>
);

// the classic way is the dim plate, Lesreg the lit one
export type Kind = 'them' | 'us';
const ink = (k: Kind) => (k === 'us' ? OBS : PORC);
const ink2 = (k: Kind) => (k === 'us' ? GRAPH : 'rgba(246,244,239,.62)');
export const rule = (k: Kind) => (k === 'us' ? TRAV : 'rgba(246,244,239,.16)');

export const Plate: React.FC<{ k: Kind; label: string; chip: React.ReactNode; value: React.ReactNode; unit: string; line: React.ReactNode; children?: React.ReactNode }> =
  ({ k, label, chip, value, unit, line, children }) => {
    const f = k === 'us' ? BOT : TOP;
    return (
      <div style={{ position: 'absolute', left: f.x, top: f.y, width: f.w, height: f.h, borderRadius: 48, padding: `${PAD - 6}px ${PAD}px 0`, color: ink(k),
        background: k === 'us' ? PORC : 'rgba(246,244,239,.06)',
        boxShadow: k === 'us' ? '12px 24px 56px rgba(0,0,0,.4)' : 'inset 0 0 0 1.5px rgba(246,244,239,.14)' }}>
        <div style={{ display: 'flex', alignItems: 'center', height: 64 }}>
          {k === 'us' && <span style={{ marginRight: 16 }}><Mark s={42} /></span>}
          <span style={{ font: `600 34px/1 ${SANS}`, letterSpacing: '.06em', textTransform: 'uppercase', color: k === 'us' ? OBS : 'rgba(246,244,239,.72)' }}>{label}</span>
          <span style={{ marginLeft: 'auto' }}>{chip}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', marginTop: 26 }}>
          <span style={{ font: `300 196px/170px ${SANS}`, letterSpacing: '-0.05em', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{value}</span>
          <span style={{ margin: '22px 0 0 20px', font: `400 34px/1 ${MONO}`, color: ink2(k), whiteSpace: 'nowrap' }}>{unit}</span>
        </div>
        <div style={{ marginTop: 18, font: `400 38px/1.2 ${SANS}`, color: ink2(k) }}>{line}</div>
        <div style={{ position: 'absolute', left: PAD, right: PAD, bottom: PAD - 4, height: 150 }}>{children}</div>
      </div>
    );
  };

// a capsule at the plate's top right: what is going on
export const Chip: React.FC<{ k: Kind; dot?: 'now' | 'run' | null; children: React.ReactNode; o?: number }> = ({ k, dot, children, o = 1 }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 14, height: 64, padding: '0 28px 0 24px', borderRadius: 32, opacity: o,
    background: k === 'us' ? LIME : 'rgba(246,244,239,.1)', font: `400 32px/1 ${MONO}`, color: k === 'us' ? OBS : 'rgba(246,244,239,.85)', whiteSpace: 'nowrap' }}>
    {dot && <i style={{ width: 16, height: 16, borderRadius: '50%', background: dot === 'now' ? ULTRA : 'rgba(246,244,239,.85)', boxShadow: dot === 'now' ? '0 0 0 6px rgba(36,54,232,.22)' : undefined }} />}
    {children}
  </span>
);

// the field's foot: a rule and its two ends in mono
export const Foot: React.FC<{ k: Kind; a: string; b: string }> = ({ k, a, b }) => (
  <>
    <i style={{ position: 'absolute', left: 0, right: 0, bottom: 44, height: 2, background: rule(k) }} />
    <span style={{ position: 'absolute', left: 0, bottom: 0, font: `400 30px/1 ${MONO}`, color: k === 'us' ? ASH : 'rgba(246,244,239,.45)' }}>{a}</span>
    <span style={{ position: 'absolute', right: 0, bottom: 0, font: `400 30px/1 ${MONO}`, color: k === 'us' ? ASH : 'rgba(246,244,239,.45)' }}>{b}</span>
  </>
);
export const da = (n: number, d = 0) => n.toLocaleString('da-DK', { minimumFractionDigits: d, maximumFractionDigits: d });
