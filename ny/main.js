/* The page's own frame: the language, the menu, the bar, and the first
   screen (hero.js). The sections below are page.js. */
import { startHero } from './hero.js?v=24';

const html = document.documentElement;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

/* ---------- language ----------
   Danish for anyone whose browser asks for it, English otherwise; a
   choice made on the page sticks. */
let lang = 'da';
try {
  const saved = localStorage.getItem('lesreg-lang');
  if (saved === 'da' || saved === 'en') lang = saved;
  else lang = (navigator.languages || [navigator.language]).some(l => /^da\b/i.test(l || '')) ? 'da' : 'en';
} catch (e) {}

function applyLang(l) {
  lang = l;
  html.lang = l;
  $$('[data-da]').forEach(e => { const v = e.dataset[l]; if (v != null && e.innerHTML !== v) e.innerHTML = v; });
  $$('.seg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === l)));
  dispatchEvent(new Event('lesreg:lang'));
}
$$('.seg button').forEach(b => b.addEventListener('click', () => {
  try { localStorage.setItem('lesreg-lang', b.dataset.lang); } catch (e) {}
  applyLang(b.dataset.lang);
  closeMenu();
}));

/* ---------- LA31 Nav / Mobile bar: the lens opens the menu ---------- */
const menuBtn = $('.tb-menu');
function closeMenu() { html.classList.remove('mm-open'); menuBtn.setAttribute('aria-expanded', 'false'); }
menuBtn.addEventListener('click', () => {
  const open = !html.classList.contains('mm-open');
  html.classList.toggle('mm-open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
});
addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
// a link in the menu takes you there and puts the menu away
$$('.mm a[href^="#"]').forEach(a => a.addEventListener('click', closeMenu));

/* ---------- the bar: Smoke over dark, Smoke dense over paper ---------- */
const light = $$('[data-paper]');
let lraf = 0;
function barTone() {
  lraf = 0;
  const y = 40;
  const onPaper = light.some(s => { const r = s.getBoundingClientRect(); return r.top <= y && r.bottom > y; });
  html.classList.toggle('nav-light', onPaper);
}
addEventListener('scroll', () => { if (!lraf) lraf = requestAnimationFrame(barTone); }, { passive: true });

applyLang(lang);
barTone();
startHero();
