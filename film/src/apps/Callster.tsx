/* Callster: the owner, ill, types one text. Callster goes through
   tomorrow's five appointments, cancels each and texts each customer the
   owner's number, then answers. */
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { u, box, useT, useFonts, seg, out3, out5, io3, mix, clamp, StatusBar, Tap, Check, SANS, MONO, SH } from './common';

export const CALLSTER_S = 7.2;

const MSG = 'Jeg er syg. Aflys alle i morgen og skriv til dem, at de kan ringe til mig på 12345678';
const REPLY = 'God bedring 🙏 Dine 5 kunder i morgen er aflyst og har fået en sms med dit nummer. Der står ikke hvorfor.';
const TIMES = ['09.00', '10.30', '12.00', '13.30', '15.00'];
const GREEN = '#34C759', GREY = '#E9E9EB', BLUE = '#007AFF', RED = '#FF3B30';
const KB = 291; // the keyboard's height in points
const ROWS = ['qwertyuiopå', 'asdfghjklæø', 'zxcvbnm'];
const TYPE = [0.25, 1.75], SEND = 1.95;

const Bubble: React.FC<{ me?: boolean; children: React.ReactNode; p: number; w?: number }> = ({ me, children, p, w = 268 }) => (
  <div style={{ alignSelf: me ? 'flex-end' : 'flex-start', maxWidth: u(w), padding: `${u(9)}px ${u(13)}px`, borderRadius: u(19),
    [me ? 'borderBottomRightRadius' : 'borderBottomLeftRadius']: u(6), background: me ? GREEN : GREY, color: me ? '#fff' : '#000',
    font: `400 ${u(16.5)}px/1.32 ${SANS}`, transformOrigin: me ? '100% 100%' : '0 100%',
    transform: `scale(${mix(0.6, 1, p)}) translateY(${u(16 * (1 - p))}px)`, opacity: clamp(p * 2) } as React.CSSProperties}>{children}</div>
);

// grows into its place, so what is above moves up rather than jumps
const Grow: React.FC<{ p: number; h: number; children: React.ReactNode }> = ({ p, h, children }) => (
  <div style={{ maxHeight: u(h * out3(clamp(p))), overflow: p >= 1 ? 'visible' : 'hidden', display: 'flex', flexDirection: 'column' }}>{children}</div>
);

const Dots: React.FC<{ t: number }> = ({ t }) => (
  <span style={{ display: 'flex', gap: u(4), padding: `${u(4)}px ${u(2)}px` }}>
    {[0, 1, 2].map(i => <i key={i} style={{ width: u(8), height: u(8), borderRadius: '50%', background: '#8E8E93', opacity: 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 9 - i * 0.9)) }} />)}
  </span>
);

export const Callster: React.FC = () => {
  useFonts();
  const { t, sp } = useT();

  const typed = Math.round(MSG.length * seg(t, TYPE[0], TYPE[1]));
  const key = typed > 0 && t < TYPE[1] + 0.05 ? MSG[typed - 1].toLowerCase() : '';
  const sent = t >= SEND;
  const kb = io3(seg(t, 2.25, 2.7)); // the keyboard goes
  const barBottom = mix(KB, 34, kb);
  // the field grows a line at a time while it is typed into
  const lines = sent || typed === 0 ? 1 : Math.max(1, Math.ceil(typed / 31));
  const fieldH = 36 + (lines - 1) * 21.8;

  const b1 = sp(SEND, 16, 190);
  const del = out3(seg(t, 2.3, 2.5));
  const dots1 = seg(t, 2.8, 2.95) * (1 - seg(t, 3.25, 3.3));
  const card = sp(3.3, 18, 160);
  const strike = (i: number) => out3(seg(t, 3.75 + i * 0.27, 3.98 + i * 0.27));
  const doneN = TIMES.filter((_, i) => strike(i) >= 1).length;
  const dots2 = seg(t, 5.15, 5.3) * (1 - seg(t, 5.6, 5.65));
  const reply = sp(5.65, 16, 170);

  return (
    <AbsoluteFill style={{ background: '#fff', overflow: 'hidden', fontFamily: SANS, color: '#000' }}>
      {/* ---------- the conversation, held to the bottom ---------- */}
      <div style={{ position: 'absolute', left: u(14), right: u(14), top: u(150), bottom: u(barBottom + 18 + fieldH), display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: u(6) }}>
        <p style={{ margin: `0 0 ${u(8)}px`, textAlign: 'center', font: `400 ${u(12)}px/1.35 ${SANS}`, color: '#8E8E93' }}>Tekstbesked · SMS<br /><b style={{ fontWeight: 600 }}>I dag</b> 07.02</p>
        {sent && <Grow p={b1} h={120}><Bubble me p={b1}>{MSG}</Bubble></Grow>}
        {sent && <Grow p={del} h={20}><span style={{ alignSelf: 'flex-end', font: `500 ${u(12)}px/1.4 ${SANS}`, color: '#8E8E93', marginRight: u(4) }}>Leveret</span></Grow>}
        {dots1 > 0 && t < 3.3 && <Grow p={dots1} h={44}><Bubble p={dots1}><Dots t={t} /></Bubble></Grow>}
        {t >= 3.3 && (
          <Grow p={card} h={300}>
            <div style={{ alignSelf: 'flex-start', width: u(286), borderRadius: u(19), borderBottomLeftRadius: u(6), background: GREY, padding: `${u(13)}px ${u(14)}px`,
              transformOrigin: '0 100%', transform: `scale(${mix(0.7, 1, card)})`, opacity: clamp(card * 2) }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ font: `600 ${u(16)}px/1 ${SANS}` }}>I morgen</span>
                <span style={{ font: `400 ${u(13)}px/1 ${SANS}`, color: '#6C6C70' }}>5 aftaler</span>
              </div>
              <div style={{ marginTop: u(10), background: '#fff', borderRadius: u(12), overflow: 'hidden' }}>
                {TIMES.map((tm, i) => {
                  const s = strike(i);
                  return (
                    <div key={tm} style={{ display: 'flex', alignItems: 'center', gap: u(10), height: u(38), padding: `0 ${u(12)}px`, borderTop: i ? `${u(1)}px solid #EFEFF2` : 'none' }}>
                      <span style={{ position: 'relative', display: 'flex', gap: u(10), alignItems: 'center', color: s > 0.5 ? '#AEAEB2' : '#000' }}>
                        <span style={{ font: `400 ${u(14)}px/1 ${MONO}` }}>{tm}</span>
                        <span style={{ font: `400 ${u(14)}px/1 ${SANS}` }}>Kunde</span>
                        <i style={{ position: 'absolute', left: 0, top: '50%', height: u(1.5), width: `${100 * s}%`, background: '#AEAEB2' }} />
                      </span>
                      <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: u(8), opacity: s, transform: `translateX(${u(10 * (1 - s))}px)` }}>
                        <span style={{ font: `600 ${u(12)}px/1 ${SANS}`, color: RED }}>Aflyst</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: u(3), font: `500 ${u(12)}px/1 ${SANS}`, color: GREEN }}><Check p={seg(t, 3.9 + i * 0.27, 4.1 + i * 0.27)} size={13} color={GREEN} width={3} />sms</span>
                      </span>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: u(10), display: 'flex', alignItems: 'center', gap: u(10) }}>
                <span style={{ flex: 1, height: u(4), borderRadius: u(2), background: '#D1D1D6', overflow: 'hidden' }}>
                  <i style={{ display: 'block', height: '100%', width: `${(100 * TIMES.reduce((a, _, i) => a + strike(i), 0)) / 5}%`, background: GREEN }} />
                </span>
                <span style={{ font: `500 ${u(12)}px/1 ${SANS}`, color: '#6C6C70' }}>{doneN}/5 sms sendt</span>
              </div>
            </div>
          </Grow>
        )}
        {dots2 > 0 && t < 5.65 && <Grow p={dots2} h={44}><Bubble p={dots2}><Dots t={t} /></Bubble></Grow>}
        {t >= 5.65 && <Grow p={reply} h={130}><Bubble p={reply}>{REPLY}</Bubble></Grow>}
      </div>

      {/* ---------- who it is ---------- */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: u(142), background: 'rgba(246,246,246,.96)', borderBottom: `${u(0.5)}px solid #D8D8DC`, zIndex: 10 }}>
        <span style={{ ...box(10, 70), display: 'flex', alignItems: 'center', gap: u(4), color: BLUE }}>
          <svg width={u(12)} height={u(20)} viewBox="0 0 12 20"><path d="M10 2 2 10l8 8" fill="none" stroke={BLUE} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" /></svg>
          <b style={{ minWidth: u(24), height: u(22), padding: `0 ${u(7)}px`, borderRadius: u(11), background: BLUE, color: '#fff', font: `500 ${u(14)}px/${u(22)}px ${SANS}`, textAlign: 'center' }}>12</b>
        </span>
        <div style={{ ...box(0, 62, 402), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: u(5) }}>
          <Img src={staticFile('ny/media/ic/callster.png')} style={{ width: u(50), height: u(50), borderRadius: '50%' }} />
          <span style={{ font: `400 ${u(12)}px/1 ${SANS}` }}>Callster ›</span>
        </div>
        <svg style={{ ...box(354, 78) }} width={u(28)} height={u(18)} viewBox="0 0 26 16"><rect x="1" y="1" width="17" height="14" rx="3" fill="none" stroke={BLUE} strokeWidth="1.8" /><path d="m19 6 6-3v10l-6-3z" fill="none" stroke={BLUE} strokeWidth="1.8" strokeLinejoin="round" /></svg>
      </div>

      {/* ---------- where it is typed ---------- */}
      <div style={{ position: 'absolute', left: u(12), right: u(12), bottom: u(barBottom + 8), display: 'flex', alignItems: 'flex-end', gap: u(10), zIndex: 10 }}>
        <span style={{ width: u(36), height: u(36), borderRadius: '50%', background: GREY, display: 'grid', placeItems: 'center', color: '#3C3C43', font: `300 ${u(26)}px/1 ${SANS}`, flex: 'none' }}>+</span>
        <div style={{ flex: 1, minHeight: u(36), borderRadius: u(18), border: `${u(1)}px solid #C7C7CC`, padding: `${u(7)}px ${u(44)}px ${u(7)}px ${u(14)}px`, position: 'relative',
          font: `400 ${u(16.5)}px/1.32 ${SANS}`, color: sent || typed === 0 ? '#B5B5BA' : '#000' }}>
          {sent || typed === 0 ? 'Tekstbesked · SMS' : <>{MSG.slice(0, typed)}<i style={{ display: 'inline-block', width: u(2), height: u(20), background: BLUE, verticalAlign: 'text-bottom', opacity: Math.sin(t * 14) > 0 ? 1 : 0.2 }} /></>}
          {!sent && typed > 0 && (
            <span style={{ position: 'absolute', right: u(4), bottom: u(4), width: u(28), height: u(28), borderRadius: '50%', background: GREEN, display: 'grid', placeItems: 'center',
              transform: `scale(${t > SEND - 0.12 ? 0.85 : 1})` }}>
              <svg width={u(14)} height={u(14)} viewBox="0 0 14 14"><path d="M7 12V2M2.5 6.5 7 2l4.5 4.5" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
          )}
        </div>
      </div>
      <Tap x={372} y={SH - KB - 26} at={SEND - 0.05} t={t} />

      {/* ---------- the keyboard ---------- */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: u(KB), background: '#D1D4DA', transform: `translateY(${u(KB * kb)}px)`, zIndex: 20, padding: `${u(8)}px ${u(3)}px 0` }}>
        {ROWS.map((r, ri) => (
          <div key={r} style={{ display: 'flex', justifyContent: 'center', gap: u(6), marginBottom: u(11), padding: ri === 1 ? `0 ${u(2)}px` : 0 }}>
            {ri === 2 && <span style={{ width: u(44), height: u(44), borderRadius: u(8), background: '#ADB3BC' }} />}
            {ri === 2 && <span style={{ width: u(6) }} />}
            {[...r].map(k => (
              <span key={k} style={{ width: u(ri === 2 ? 30.5 : 30.5), height: u(44), borderRadius: u(8), display: 'grid', placeItems: 'center', font: `400 ${u(22)}px/1 ${SANS}`,
                background: k === key ? '#ADB3BC' : '#fff', boxShadow: `0 ${u(1)}px 0 rgba(0,0,0,.3)`, transform: k === key ? `translateY(${u(-1)}px)` : 'none' }}>{k}</span>
            ))}
            {ri === 2 && <span style={{ width: u(6) }} />}
            {ri === 2 && <span style={{ width: u(44), height: u(44), borderRadius: u(8), background: '#ADB3BC' }} />}
          </div>
        ))}
        <div style={{ display: 'flex', gap: u(6), padding: `0 ${u(3)}px` }}>
          <span style={{ width: u(88), height: u(44), borderRadius: u(8), background: '#ADB3BC', display: 'grid', placeItems: 'center', font: `400 ${u(16)}px/1 ${SANS}` }}>123</span>
          <span style={{ flex: 1, height: u(44), borderRadius: u(8), background: key === ' ' ? '#ADB3BC' : '#fff', boxShadow: `0 ${u(1)}px 0 rgba(0,0,0,.3)`, display: 'grid', placeItems: 'center', font: `400 ${u(16)}px/1 ${SANS}`, color: '#3C3C43' }}>mellemrum</span>
          <span style={{ width: u(88), height: u(44), borderRadius: u(8), background: '#ADB3BC', display: 'grid', placeItems: 'center', font: `400 ${u(16)}px/1 ${SANS}` }}>retur</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: `${u(14)}px ${u(26)}px 0` }}>
          <svg width={u(26)} height={u(26)} viewBox="0 0 26 26"><circle cx="13" cy="13" r="11" fill="none" stroke="#3C3C43" strokeWidth="1.8" /><circle cx="9.5" cy="10.5" r="1.4" fill="#3C3C43" /><circle cx="16.5" cy="10.5" r="1.4" fill="#3C3C43" /><path d="M8 15.5c1.3 2 3 3 5 3s3.7-1 5-3" fill="none" stroke="#3C3C43" strokeWidth="1.8" strokeLinecap="round" /></svg>
          <svg width={u(22)} height={u(26)} viewBox="0 0 22 26"><rect x="7" y="2" width="8" height="14" rx="4" fill="none" stroke="#3C3C43" strokeWidth="1.8" /><path d="M3 12a8 8 0 0 0 16 0M11 20v4" fill="none" stroke="#3C3C43" strokeWidth="1.8" strokeLinecap="round" /></svg>
        </div>
      </div>
      <StatusBar color="#000" />
    </AbsoluteFill>
  );
};
