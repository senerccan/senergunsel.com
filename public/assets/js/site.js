// Shared store fixtures for every page: the Open / After hours sign,
// the signage language, the phone menu and the door sensor.
import { LANGS, LANG_LABELS, LANG_NAMES, LANG_TAGS, sign, floorName, detectLang } from './signs.js';
import { startDoor } from './door.js';

const root = document.documentElement;

function store(key, value) {
  try {
    if (value === undefined) return localStorage.getItem(key);
    localStorage.setItem(key, value);
  } catch (e) {
    return null;
  }
  return value;
}

/* ---------- Theme: Open (light) / After hours (dark) ---------- */
function currentTheme() {
  return root.dataset.theme === 'after' ? 'after' : 'open';
}
function paintThemeButtons() {
  const t = currentTheme();
  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    const label = btn.querySelector('[data-theme-label]');
    if (label) label.textContent = t === 'open' ? 'Open' : 'After hours';
    btn.setAttribute('aria-label', t === 'open'
      ? 'Store sign reads Open. Switch to After hours, the dark theme'
      : 'Store sign reads After hours. Switch to Open, the light theme');
  });
}
function setTheme(t) {
  root.dataset.theme = t;
  store('scg.theme', t);
  paintThemeButtons();
  document.dispatchEvent(new CustomEvent('scg:theme', { detail: { theme: t } }));
}

/* ---------- Signage language ---------- */
let lang = 'en';
export function currentLang() {
  return lang;
}
function applySigns() {
  const tag = LANG_TAGS[lang] || 'en';
  document.querySelectorAll('[data-sign]').forEach((el) => {
    el.textContent = sign(lang, el.dataset.sign);
    el.setAttribute('lang', tag);
  });
  document.querySelectorAll('[data-floor-name]').forEach((el) => {
    el.textContent = floorName(lang, el.dataset.floorName);
    el.setAttribute('lang', tag);
  });
  document.querySelectorAll('[data-lang-pick]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.langPick === lang));
  });
  document.querySelectorAll('[data-lang-cycle]').forEach((btn) => {
    btn.textContent = LANG_LABELS[lang];
    btn.setAttribute('aria-label', 'Signage language, currently ' + LANG_NAMES[lang] + '. Switch language');
  });
}
function setLang(next, persist = true) {
  lang = LANGS.includes(next) ? next : 'en';
  if (persist) store('scg.lang', lang);
  applySigns();
  document.dispatchEvent(new CustomEvent('scg:lang', { detail: { lang } }));
}

/* ---------- Phone menu ---------- */
function wireMenu() {
  const btn = document.querySelector('[data-menu-toggle]');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;
  const close = () => {
    menu.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
  };
  btn.addEventListener('click', () => {
    const open = menu.hidden;
    menu.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    if (open) {
      const first = menu.querySelector('a, button');
      if (first) first.focus();
    }
  });
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) {
      close();
      btn.focus();
    }
  });
  window.matchMedia('(min-width: 761px)').addEventListener('change', (e) => {
    if (e.matches) close();
  });
}

/* ---------- Scroll reveals ----------
   Anything marked data-reveal fades up as it comes into view; a --rd delay in
   its style staggers it against its neighbours. Without JavaScript, or when a
   visitor asks for reduced motion, everything is simply there. */
function initReveal() {
  const els = Array.from(document.querySelectorAll('[data-reveal]'));
  if (!els.length || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.remove('reveal-on');
    return;
  }
  window.scgReveal = true;
  root.classList.add('reveal-on');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  els.forEach((el) => io.observe(el));
}

function init() {
  initReveal();
  paintThemeButtons();
  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => setTheme(currentTheme() === 'open' ? 'after' : 'open'));
  });

  setLang(store('scg.lang') || detectLang(), false);
  document.querySelectorAll('[data-lang-pick]').forEach((btn) => {
    btn.addEventListener('click', () => setLang(btn.dataset.langPick));
  });
  document.querySelectorAll('[data-lang-cycle]').forEach((btn) => {
    btn.addEventListener('click', () => setLang(LANGS[(LANGS.indexOf(lang) + 1) % LANGS.length]));
  });

  wireMenu();

  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });

  startDoor({ zone: document.body.dataset.zone || null });
}

init();
