// Store signage in the four languages the staff speak.
// Only the signs change language; the content stays in English.

export const SIGNS = {
  en: { greet: 'Welcome in.', live: 'Live', floor: 'Floor plan', locator: 'Store locator', register: 'Register', express: 'Express lane', window: 'Window', main: 'Main floor', fit: 'Fitting rooms', research: 'Research corner', notes: 'Notice board', back: 'Back of house', popup: 'Pop-up', drop: 'New drop', workshop: 'Workshop', door: 'Entrance', elevator: 'Elevator', floors: 'Floors' },
  tr: { greet: 'Hoş geldiniz.', live: 'Canlı', floor: 'Kat planı', locator: 'Mağazalar', register: 'Kasa', express: 'Hızlı kasa', window: 'Vitrin', main: 'Ana kat', fit: 'Deneme kabinleri', research: 'Araştırma köşesi', notes: 'İlan panosu', back: 'Depo', popup: 'Pop-up mağaza', drop: 'Yeni çıkış', workshop: 'Atölye', door: 'Giriş', elevator: 'Asansör', floors: 'Katlar' },
  fr: { greet: 'Bienvenue.', live: 'En direct', floor: 'Plan du magasin', locator: 'Nos adresses', register: 'Caisse', express: 'Caisse express', window: 'Vitrine', main: 'Espace principal', fit: "Cabines d'essayage", research: 'Coin recherche', notes: "Panneau d'affichage", back: 'Réserve', popup: 'Boutique éphémère', drop: 'Nouveauté', workshop: 'Atelier', door: 'Entrée', elevator: 'Ascenseur', floors: 'Étages' },
  zh: { greet: '欢迎光临。', live: '实时', floor: '楼层平面图', locator: '门店查询', register: '收银台', express: '快速通道', window: '橱窗', main: '主卖场', fit: '试衣间', research: '研究区', notes: '公告栏', back: '仓库', popup: '快闪店', drop: '新品', workshop: '工坊', door: '入口', elevator: '电梯', floors: '楼层' }
};

export const FLOOR_NAMES = {
  en: { G: 'Ground floor', 1: 'Level 1', 2: 'Level 2' },
  tr: { G: 'Zemin kat', 1: '1. kat', 2: '2. kat' },
  fr: { G: 'Rez-de-chaussée', 1: '1er étage', 2: '2e étage' },
  zh: { G: '首层', 1: '二层', 2: '三层' }
};

export const LANG_TAGS = { en: 'en', tr: 'tr', fr: 'fr', zh: 'zh-Hans' };
export const LANG_LABELS = { en: 'EN', tr: 'TR', fr: 'FR', zh: '中文' };
export const LANG_NAMES = { en: 'English', tr: 'Türkçe', fr: 'Français', zh: '中文' };
export const LANGS = ['en', 'tr', 'fr', 'zh'];

export function sign(lang, key) {
  return (SIGNS[lang] && SIGNS[lang][key]) || SIGNS.en[key] || '';
}

export function floorName(lang, key) {
  return (FLOOR_NAMES[lang] && FLOOR_NAMES[lang][key]) || FLOOR_NAMES.en[key] || key;
}

// A visitor whose browser speaks Turkish, French or Chinese sees those signs first.
export function detectLang() {
  try {
    const list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en'];
    const first = String(list[0] || 'en').toLowerCase();
    if (first.startsWith('tr')) return 'tr';
    if (first.startsWith('fr')) return 'fr';
    if (first.startsWith('zh')) return 'zh';
  } catch (e) {
    /* fall through */
  }
  return 'en';
}
