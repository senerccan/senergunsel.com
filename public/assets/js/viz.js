// G06 · Which streets earn a flagship?
// The dashboard lives on Tableau Public. Until a visitor asks for it, the page
// shows a picture of it exactly as it opens, and nothing talks to Tableau, so
// the store keeps its no-cookies promise. Wide screens load it in place at its
// real size (scaled down a touch on smaller laptops). Narrow screens follow the
// link to Tableau Public in a new tab, where the phone layout takes over.

const VIZ_W = 1200;
const VIZ_H = 827; // the 1200 x 800 dashboard plus Tableau's 27px toolbar
const MIN_INLINE = 880; // narrower than this and the dashboard's labels get too small to read in place

function initViz() {
  const fig = document.querySelector('[data-viz]');
  if (!fig) return;
  const stage = fig.querySelector('[data-viz-stage]');
  const triggers = Array.from(fig.querySelectorAll('[data-viz-load]'));
  const status = fig.querySelector('[data-viz-status]');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let box = null;
  let slow = null;

  const wide = () => stage.clientWidth >= MIN_INLINE;

  // Before loading: pick in-place or new tab. After: scale the frame to fit.
  const fit = () => {
    if (!box) {
      fig.dataset.mode = wide() ? 'inline' : 'tab';
      return;
    }
    const w = stage.clientWidth;
    const s = Math.min(1, w / VIZ_W);
    const frame = box.firstElementChild;
    box.style.height = Math.round(VIZ_H * s) + 'px';
    frame.style.transform = s < 1 ? 'scale(' + s.toFixed(4) + ')' : '';
    frame.style.left = Math.max(0, Math.round((w - VIZ_W * s) / 2)) + 'px';
  };

  const show = () => {
    clearTimeout(slow);
    fig.dataset.state = 'live';
    status.textContent = '';
    try { box.firstElementChild.focus({ preventScroll: true }); } catch (e) { /* not focusable yet */ }
  };

  const load = (e) => {
    // Modified clicks, a second click, or a narrow screen: let the link do its job.
    if (box || !wide() || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    fit();
    fig.dataset.state = 'loading';
    status.textContent = 'Loading the dashboard from Tableau Public…';

    box = document.createElement('div');
    box.className = 'viz-frame';
    const frame = document.createElement('iframe');
    frame.title = 'Which streets earn a flagship? Interactive Tableau dashboard';
    frame.width = String(VIZ_W);
    frame.height = String(VIZ_H);
    frame.setAttribute('allow', 'fullscreen');
    frame.setAttribute('allowfullscreen', '');
    frame.addEventListener('load', () => setTimeout(show, 700), { once: true });
    frame.src = fig.dataset.vizSrc;
    box.appendChild(frame);
    stage.appendChild(box);
    fit();

    // Bring the whole dashboard into view if the click came from its header.
    const r = fig.getBoundingClientRect();
    if (r.top < 0 || r.top > window.innerHeight * 0.25) {
      fig.scrollIntoView({ block: 'start', behavior: reduced.matches ? 'auto' : 'smooth' });
    }

    slow = setTimeout(() => {
      status.textContent = 'Tableau Public is taking a while. You can also open it in a new tab with the link below.';
    }, 15000);
  };

  triggers.forEach((t) => t.addEventListener('click', load));
  if ('ResizeObserver' in window) new ResizeObserver(fit).observe(stage);
  else window.addEventListener('resize', fit);
  fit();
}

initViz();
