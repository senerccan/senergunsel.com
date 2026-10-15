// Flagship · Store 001
// Static pages are served straight from /public. Only /api/* runs this Worker.
// Door sensor 01 counts visits anonymously: a random per-tab visit id, no
// cookies, no IP addresses stored, nothing that identifies a person.
import { DurableObject } from 'cloudflare:workers';

const TZ = 'America/New_York';
const DAY_FMT = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const dayOf = (ms) => DAY_FMT.format(new Date(ms));

const DAY_MS = 86400000;
const IN_STORE_MS = 75000;      // a visit counts as "in store" until 75s after its last heartbeat
const MAX_STEP_MS = 45000;      // longest gap between heartbeats that still counts as dwell
const HEAT_NEED = 50;           // visits in the last 30 days before the heat map switches to real dwell
const HEAT_MIN_MS = 60000;      // and at least a minute of zone dwell to draw from
const MAX_ENTERS_PER_MIN = 120; // a crude guard against scripted traffic

const BOT = /bot|crawl|spider|slurp|facebookexternalhit|embedly|preview|lighthouse|pingdom|uptime|monitor|curl|wget|python-requests/i;
const SID = /^[a-z0-9]{12,48}$/;
const CODE = /^[A-Z0-9]{2,5}$/;

export class DoorCounter extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.heatCache = null;
    ctx.blockConcurrencyWhile(async () => {
      this.sql.exec('CREATE TABLE IF NOT EXISTS sessions (sid TEXT PRIMARY KEY, day TEXT NOT NULL, start INTEGER NOT NULL, last INTEGER NOT NULL, gone INTEGER NOT NULL DEFAULT 0)');
      this.sql.exec('CREATE INDEX IF NOT EXISTS sessions_last ON sessions(last)');
      this.sql.exec('CREATE INDEX IF NOT EXISTS sessions_start ON sessions(start)');
      this.sql.exec('CREATE TABLE IF NOT EXISTS days (day TEXT PRIMARY KEY, footfall INTEGER NOT NULL DEFAULT 0, dwell_ms INTEGER NOT NULL DEFAULT 0)');
      this.sql.exec('CREATE TABLE IF NOT EXISTS zone_days (day TEXT NOT NULL, code TEXT NOT NULL, ms INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, code))');
    });
  }

  session(sid) {
    return this.sql.exec('SELECT sid, day, start, last FROM sessions WHERE sid = ?', sid).toArray()[0] || null;
  }

  enter(sid, counted = true) {
    const now = Date.now();
    const day = dayOf(now);
    const row = this.session(sid);
    let isNew = false;
    if (row && row.day === day) {
      this.step(row, now);
    } else if (counted) {
      const recent = this.sql.exec('SELECT COUNT(*) AS n FROM sessions WHERE start >= ?', now - 60000).one().n;
      if (recent < MAX_ENTERS_PER_MIN) {
        this.sql.exec('INSERT OR REPLACE INTO sessions (sid, day, start, last, gone) VALUES (?, ?, ?, ?, 0)', sid, day, now, now);
        this.sql.exec('INSERT INTO days (day, footfall, dwell_ms) VALUES (?, 1, 0) ON CONFLICT(day) DO UPDATE SET footfall = footfall + 1', day);
        isNew = true;
      }
    }
    if (Math.random() < 0.05) this.prune(now);
    return { ...this.stats(now), isNew };
  }

  ping(sid, zones) {
    const now = Date.now();
    const row = this.session(sid);
    if (!row || row.day !== dayOf(now)) return this.enter(sid, true);
    this.step(row, now);
    this.addZones(zones, now);
    return this.stats(now);
  }

  leave(sid, zones) {
    const now = Date.now();
    const row = this.session(sid);
    if (row && row.day === dayOf(now)) {
      this.step(row, now);
      this.sql.exec('UPDATE sessions SET gone = 1 WHERE sid = ?', sid);
    }
    this.addZones(zones, now);
    return { ok: true };
  }

  // Advance a visit to `now`. Short gaps are dwell; long gaps (a hidden tab) are not.
  step(row, now) {
    const delta = now - row.last;
    if (delta > 0 && delta <= MAX_STEP_MS) {
      this.sql.exec('UPDATE days SET dwell_ms = dwell_ms + ? WHERE day = ?', delta, row.day);
    }
    this.sql.exec('UPDATE sessions SET last = ?, gone = 0 WHERE sid = ?', now, row.sid);
  }

  addZones(zones, now) {
    if (!zones || typeof zones !== 'object') return;
    const day = dayOf(now);
    let n = 0;
    for (const [code, raw] of Object.entries(zones)) {
      if (++n > 24) break;
      if (!CODE.test(code)) continue;
      const ms = Math.min(120000, Math.max(0, Math.round(Number(raw) || 0)));
      if (!ms) continue;
      this.sql.exec('INSERT INTO zone_days (day, code, ms) VALUES (?, ?, ?) ON CONFLICT(day, code) DO UPDATE SET ms = ms + excluded.ms', day, code, ms);
    }
    if (n) this.heatCache = null;
  }

  heat(now) {
    if (this.heatCache && now - this.heatCache.at < 60000) return this.heatCache;
    const since = dayOf(now - 30 * DAY_MS);
    const visits = this.sql.exec('SELECT COALESCE(SUM(footfall), 0) AS n FROM days WHERE day >= ?', since).one().n;
    const rows = this.sql.exec('SELECT code, SUM(ms) AS ms FROM zone_days WHERE day >= ? GROUP BY code', since).toArray();
    const total = rows.reduce((s, r) => s + r.ms, 0);
    const max = rows.reduce((m, r) => Math.max(m, r.ms), 0);
    const map = {};
    rows.forEach((r) => { map[r.code] = max ? Math.round((r.ms / max) * 100) / 100 : 0; });
    const actual = visits >= HEAT_NEED && total >= HEAT_MIN_MS;
    this.heatCache = { at: now, visits, map: actual ? map : null, mode: actual ? 'actual' : 'forecast' };
    return this.heatCache;
  }

  stats(now = Date.now()) {
    const day = dayOf(now);
    const today = this.sql.exec('SELECT footfall, dwell_ms FROM days WHERE day = ?', day).toArray()[0] || { footfall: 0, dwell_ms: 0 };
    const inStore = this.sql.exec('SELECT COUNT(*) AS n FROM sessions WHERE last >= ? AND gone = 0', now - IN_STORE_MS).one().n;
    const h = this.heat(now);
    return {
      day,
      footfall: today.footfall,
      inStore,
      avgDwellSec: today.footfall ? Math.round(today.dwell_ms / today.footfall / 1000) : 0,
      heat: h.map,
      heatMode: h.mode,
      heatNeed: HEAT_NEED,
      heatHave: h.visits
    };
  }

  prune(now) {
    this.sql.exec('DELETE FROM sessions WHERE last < ?', now - 2 * DAY_MS);
    this.sql.exec('DELETE FROM zone_days WHERE day < ?', dayOf(now - 400 * DAY_MS));
  }
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      ...headers
    }
  });
}

function sameSite(request, url) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === url.host;
  } catch (e) {
    return false;
  }
}

async function door(request, env, url) {
  const route = url.pathname.replace(/\/+$/, '');
  const stub = env.DOOR.get(env.DOOR.idFromName('store-001'));

  if (route === '/api/door/stats') {
    if (request.method !== 'GET') return json({ error: 'Use GET for stats.' }, 405, { allow: 'GET' });
    return json(await stub.stats());
  }
  if (!['/api/door/enter', '/api/door/ping', '/api/door/leave'].includes(route)) {
    return json({ error: 'No such door. Try /api/door/stats.' }, 404);
  }
  if (request.method !== 'POST') return json({ error: 'Use POST.' }, 405, { allow: 'POST' });
  if (!sameSite(request, url)) return json({ error: 'Only visits to this site are counted.' }, 403);

  const text = await request.text();
  if (text.length > 4000) return json({ error: 'That request is too large to count.' }, 413);
  let body;
  try {
    body = JSON.parse(text || '{}');
  } catch (e) {
    return json({ error: 'Send the visit as JSON.' }, 400);
  }
  const sid = String(body.sid || '').toLowerCase();
  if (!SID.test(sid)) return json({ error: 'A visit id is required.' }, 400);
  const isBot = BOT.test(request.headers.get('user-agent') || '');

  if (route === '/api/door/enter') return json(await stub.enter(sid, !isBot));
  if (route === '/api/door/ping') return json(isBot ? await stub.stats() : await stub.ping(sid, body.zones));
  return json(isBot ? { ok: true } : await stub.leave(sid, body.zones));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/door')) {
      try {
        return await door(request, env, url);
      } catch (e) {
        return json({ error: 'The door sensor is resting. Try again in a minute.' }, 503);
      }
    }
    if (url.pathname.startsWith('/api/')) return json({ error: 'Nothing here.' }, 404);
    return env.ASSETS.fetch(request);
  }
};
