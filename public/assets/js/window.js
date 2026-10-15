// G02 · Same store, two streets.
// One store, built and run the same way on two streets. Same conversion, same
// basket; only the people walking past change. Break-even sales $1.2M a year,
// $80 average spend, one visitor in five buys. Illustrative figures.

const STREETS = {
  busy: { traffic: 12800000, trafficVal: '12.8M' },
  quiet: { traffic: 1100000, trafficVal: '1.1M' }
};
const BREAK_EVEN = 1200000;
const BASKET = 80;
const BUY_RATE = 0.2;

const $ = (sel, root = document) => root.querySelector(sel);

function initWindow() {
  const buttons = Array.from(document.querySelectorAll('[data-street]'));
  if (!buttons.length) return;
  const visitsNeeded = BREAK_EVEN / BASKET / BUY_RATE;
  const pick = (key) => {
    const st = STREETS[key];
    const cap = (visitsNeeded / st.traffic) * 100;
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.street === key)));
    $('#capture').textContent = cap.toFixed(1) + '%';
    $('#one-in').textContent = '1 in ' + Math.round(100 / cap);
    $('#traffic-val').textContent = st.trafficVal;
    const left = Math.min(100, cap * 10).toFixed(1) + '%';
    $('#track-fill').style.width = left;
    $('#track-knob').style.left = left;
  };
  buttons.forEach((b) => b.addEventListener('click', () => pick(b.dataset.street)));
  pick('busy');
}

initWindow();
