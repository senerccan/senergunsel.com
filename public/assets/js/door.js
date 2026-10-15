// Door sensor 01: anonymous footfall, in-store count, dwell.
// No cookies and no personal data. A random visit id lives in sessionStorage
// for this tab only, so one visit is counted once however many pages it opens.

const API = '/api/door';
const PING_MS = 30000;

let sid = null;
let started = false;
let stats = null;
let offline = false;
let pingTimer = null;
let pageZone = null;
let pageVisibleSince = 0;
const pending = {};
const listeners = new Set();
const collectors = new Set();

// Pages that time things themselves (the floor plan) register a collector,
// which runs right before every send so no dwell is left behind.
export function onCollect(fn) {
  collectors.add(fn);
  return () => collectors.delete(fn);
}

function makeId() {
  try {
    if (crypto && crypto.randomUUID) return crypto.randomUUID().replace(/-/g, '');
  } catch (e) { /* fall back below */ }
  return Array.from({ length: 24 }, () => Math.floor(Math.random() * 36).toString(36)).join('');
}

function visitId() {
  if (sid) return sid;
  try {
    sid = sessionStorage.getItem('scg.visit');
    if (!sid) {
      sid = makeId();
      sessionStorage.setItem('scg.visit', sid);
    }
  } catch (e) {
    sid = makeId();
  }
  return sid;
}

function emit(extra) {
  listeners.forEach((fn) => {
    try { fn(stats, { offline, ...extra }); } catch (e) { /* a broken listener must not stop the sensor */ }
  });
}

export function onDoor(fn) {
  listeners.add(fn);
  if (stats || offline) fn(stats, { offline, replay: true });
  return () => listeners.delete(fn);
}

// Your own dwell per zone for this visit (this tab only): the total time and
// the number of stops, so the floor plan can tell a first stop from a return
// and pick up where you left off after a reload.
const MINE_KEY = 'scg.dwell';
let mine = {};
try {
  mine = JSON.parse(sessionStorage.getItem(MINE_KEY) || '{}') || {};
} catch (e) {
  mine = {};
}
function saveMine() {
  try { sessionStorage.setItem(MINE_KEY, JSON.stringify(mine)); } catch (e) { /* the trail is a nicety */ }
}
function record(code) {
  let r = mine[code];
  if (typeof r === 'number') r = { t: r, n: r > 0 ? 1 : 0 }; // earlier format kept the total only
  if (!r || typeof r !== 'object') r = { t: 0, n: 0 };
  r.t = r.t > 0 ? r.t : 0;
  r.n = r.n > 0 ? r.n : 0;
  mine[code] = r;
  return r;
}

export function myDwellMs(code) {
  return mine[code] ? record(code).t : 0;
}

export function myStops(code) {
  return mine[code] ? record(code).n : 0;
}

export function addZoneStop(code) {
  if (!code) return;
  record(code).n += 1;
  saveMine();
}

export function addZoneDwell(code, ms) {
  if (!code || !(ms > 0)) return;
  const add = Math.round(ms);
  pending[code] = (pending[code] || 0) + add;
  record(code).t += add;
  saveMine();
}

function flushPageZone() {
  if (pageZone && pageVisibleSince) {
    const now = Date.now();
    addZoneDwell(pageZone, now - pageVisibleSince);
    pageVisibleSince = document.visibilityState === 'visible' ? now : 0;
  }
}

function takePending() {
  collectors.forEach((fn) => {
    try { fn(); } catch (e) { /* a broken collector must not block the send */ }
  });
  flushPageZone();
  const out = {};
  Object.keys(pending).forEach((k) => {
    out[k] = Math.min(pending[k], 120000);
    delete pending[k];
  });
  return out;
}

async function post(path, body) {
  const res = await fetch(API + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
    credentials: 'omit'
  });
  if (!res.ok) throw new Error('door ' + res.status);
  return res.json();
}

async function ping() {
  if (document.visibilityState !== 'visible') return;
  try {
    stats = await post('/ping', { sid: visitId(), zones: takePending() });
    offline = false;
    emit({});
  } catch (e) {
    /* keep the last reading; the next ping retries */
  }
}

function leave() {
  const body = JSON.stringify({ sid: visitId(), zones: takePending() });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(API + '/leave', new Blob([body], { type: 'application/json' }));
      return;
    }
  } catch (e) { /* fall through to fetch */ }
  try {
    fetch(API + '/leave', { method: 'POST', body, keepalive: true, headers: { 'content-type': 'application/json' }, credentials: 'omit' });
  } catch (e) { /* nothing else to try */ }
}

export async function startDoor(options = {}) {
  if (started) return;
  started = true;
  pageZone = options.zone || null;
  // Opening a project's own page counts as a stop at its zone, so the floor
  // plan greets you as a return when you come back to it.
  if (pageZone) addZoneStop(pageZone);
  if (pageZone && document.visibilityState === 'visible') pageVisibleSince = Date.now();

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      leave();
      pageVisibleSince = 0;
    } else {
      if (pageZone) pageVisibleSince = Date.now();
      ping();
    }
  });
  window.addEventListener('pagehide', leave);

  try {
    const res = await post('/enter', { sid: visitId(), path: location.pathname });
    stats = res;
    offline = false;
    emit({ entered: true, isNew: !!res.isNew });
  } catch (e) {
    offline = true;
    emit({ entered: false });
  }
  pingTimer = setInterval(ping, PING_MS);
}

export function lastStats() {
  return stats;
}

export function formatDwell(sec) {
  if (!(sec >= 0)) return '–:––';
  const s = Math.round(sec);
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

export function pad4(n) {
  return String(Math.max(0, n | 0)).padStart(4, '0');
}
