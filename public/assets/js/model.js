// G07 · The store rollout model, with the same rules as the Excel workbook (Retail Model Playground v17).
// run(settings) prices each store size line by line, rolls the plan out store by store, tests every
// Melbourne street, and adds the whole program up year by year. No page code lives here, so the same
// file runs in the browser and in Node, where it was checked against the workbook's results.
import * as D from './model-data.js';

export const T = D.TIERS;
export const COMMIT = 'Commit to the full plan';
export const PAY_AS_YOU_GO = 'Pay as you grow';
const DASH_CEILING = ['Destination Retail', 'Evening / Entertainment', 'CBD Core / All-Day'];
const OFFICE_OR_QUIET = ['Office / Weekday Core', 'Low Activity'];

const clone = (x) => JSON.parse(JSON.stringify(x));
const sumOf = (xs) => xs.reduce((a, b) => a + b, 0);

// Every lever at the workbook's defaults. Switches and typed amounts are keyed "<line id>|<size>",
// bucket switches "<bucket>|<size>".
export function defaults() {
  return {
    recipe: { SPLUS: 'Balanced', S: 'Balanced', D: 'Balanced' },
    call: {},
    amount: {},
    master: {},
    program_call: {},
    program_amount: {},
    outlook: 'Expected',
    ov: { lr: null, floor: null, share: null, lic_disc: null, disc: [null, null, null, null] },
    deal: PAY_AS_YOU_GO,
    openings: D.OPENINGS.slice(),
    flagship_first: true,
    mix_source: 'dash', // dash | pnl | all | own
    own_mix: { ...D.OWN_MIX },
    street_choice: 'best', // best | typical
    econ: { ...D.ECON },
    var: D.VARIABLE_COSTS.slice(),
    running: clone(D.RUNNING),
    program_running: { ...D.PROGRAM_RUNNING },
    area: { ...D.AREA },
    items: D.ITEMS,
    program_items: D.PROGRAM_ITEMS,
    price_break_at: D.PRICE_BREAK_AT.slice(),
    presets: D.SCALE_PRESETS,
    street_capture: { ...D.STREET_CAPTURE }
  };
}

// The dashboard's sizing rule: traffic sets the size, and the kind of street caps it.
export function liveTier(vol, arch, fb, sb) {
  if (vol >= fb) {
    if (DASH_CEILING.includes(arch)) return 'SPLUS';
    if (arch === 'Low Activity') return 'D';
    return 'S';
  }
  if (vol >= sb) return OFFICE_OR_QUIET.includes(arch) ? 'D' : 'S';
  return 'D';
}

function stepPrice(x, steps) {
  let p = steps[0][1];
  for (const [at, price] of steps) if (x >= at) p = price;
  return p;
}

function priceBreak(x, at, disc) {
  let d = 0;
  for (let i = 0; i < at.length; i++) if (x >= at[i]) d = disc[i];
  return d;
}

// Is a line in the build for this size? A bucket switched off wins, then your call, then the recipe.
export function lineState(s, it, t, recipe) {
  if (s.master[it.bucket + '|' + t] === 'OFF') return 'OFF';
  const c = s.call[it.id + '|' + t];
  if (c === 'ON' || c === 'OFF') return c;
  return it.codes[t].includes(D.RECIPE_LETTER[recipe || s.recipe[t]]) ? 'ON' : 'OFF';
}

// One store of a size, line by line: what each line costs and what's switched on.
export function switchboard(s, t, recipe) {
  const area = s.area[t];
  const live = {};
  const states = {};
  const base = {};
  for (const it of s.items) {
    if (it.driver === 'pct') continue;
    const v = it.vals[t];
    let b = it.driver === 'ft2' ? v * area : v;
    const amt = s.amount[it.id + '|' + t];
    if (amt != null) b = amt;
    base[it.id] = b;
    states[it.id] = lineState(s, it, t, recipe);
    live[it.id] = states[it.id] === 'ON' ? b : 0;
  }
  let sub = 0;
  for (const it of s.items) {
    if ((it.driver === 'ft2' || it.driver === 'store') && (it.bucket === 'Build' || it.bucket === 'Tech')) sub += live[it.id];
  }
  for (const it of s.items) {
    if (it.driver !== 'pct') continue;
    let b = it.vals[t] * sub;
    const amt = s.amount[it.id + '|' + t];
    if (amt != null) b = amt;
    base[it.id] = b;
    states[it.id] = lineState(s, it, t, recipe);
    live[it.id] = states[it.id] === 'ON' ? b : 0;
  }
  const perStore = s.items.filter((it) => it.driver === 'ft2' || it.driver === 'store' || it.driver === 'pct');
  const add = (list) => list.reduce((a, it) => a + live[it.id], 0);
  const out = { live, states, base, sub };
  out.pilot = add(perStore);
  out.format_once = add(s.items.filter((it) => it.driver === 'format'));
  for (const g of ['Learning', 'Price breaks', 'None']) out[g] = add(perStore.filter((it) => it.group === g));
  out.bucket = {};
  for (const b of D.BUCKETS) out.bucket[b] = add(perStore.filter((it) => it.bucket === b));
  out.hw = add(s.items.filter((it) => it.hw));
  out.kw = 0;
  out.zones = 0;
  for (const it of s.items) {
    if ((live[it.id] || 0) > 0) {
      out.kw += it.kw[t];
      out.zones += it.zones[t];
    }
  }
  return out;
}

// One store of size t on a street with f people walking past a year, at a street-kind factor qq:
// its sales (capped by what the store can serve), rent, running costs and payback in years.
function storeEcon(s, R, t, f, qq, build) {
  const econ = s.econ;
  const rn = s.running;
  const area = s.area;
  const sales = Math.min(f * econ.capture * qq * econ.conversion * econ.ticket, rn.capacity_psf[t] * area[t]);
  const rent = area[t] * rn.rent_psf * (f / R.Fref) ** rn.rent_elasticity;
  const fixedEx = rent + R.FX_other[t];
  const lic = R.LIC_plan[t];
  const mature = sales * R.cm - fixedEx - lic;
  const a1 = econ.ramp1 * sales * R.cm - fixedEx - lic;
  const a2 = econ.ramp2 * sales * R.cm - fixedEx - lic;
  let payback = null;
  if (a1 >= build && a1 > 0) payback = build / a1;
  else if (a1 + a2 >= build && a2 > 0) payback = 1 + (build - a1) / a2;
  else if (mature > 0) payback = 2 + (build - a1 - a2) / mature;
  const stock = (rn.stock_weeks / 52) * sales * (1 - econ.gross_margin);
  return { sales, rent, fixed_ex: fixedEx, mature, payback, stock };
}

// The full store P&L test for a store of size t, with a given build, on one street (a row of R.M):
// the sales it needs to repay the build in the payback period, the share of people walking past
// that means, and what that kind of street can give.
export function streetTest(s, R, t, m, build) {
  const econ = s.econ;
  const rn = s.running;
  const area = s.area;
  const Y = econ.payback_years;
  const rent = area[t] * rn.rent_psf * (m.F / R.Fref) ** rn.rent_elasticity;
  const fixed = rent + (R.FX_other[t] + R.LIC_plan[t]);
  const possible = Math.min(m.F * econ.capture * m.q * econ.conversion * econ.ticket, rn.capacity_psf[t] * area[t]);
  const need = (build + fixed * Y) / (R.cm * R.SR);
  const visit = m.F * econ.conversion * econ.ticket;
  return { rent, fixed, possible, need, req: need / visit, give: econ.capture * m.q, reach: possible / visit,
    capped: possible < m.F * econ.capture * m.q * econ.conversion * econ.ticket, pass: need <= possible,
    store: storeEcon(s, R, t, m.F, m.q, build) };
}

export function run(s) {
  const R = {};
  const econ = s.econ;
  const rn = s.running;
  const pr = s.program_running;
  const area = s.area;

  // ---------------- Switchboard ----------------
  const SW = {};
  for (const t of T) SW[t] = switchboard(s, t, s.recipe[t]);
  R.SW = SW;
  const progLive = {};
  for (const p of s.program_items) {
    const on = (s.program_call[p.id] || 'ON') !== 'OFF';
    const amt = s.program_amount[p.id];
    progLive[p.id] = on ? (amt != null ? amt : p.value) : 0;
  }
  R.prog_live = progLive;
  R.program_once = sumOf(s.program_items.map((p) => progLive[p.id]));
  R.pilot = {};
  for (const t of T) R.pilot[t] = SW[t].pilot;

  // ---------------- How fast costs fall ----------------
  const pre = s.presets[s.outlook];
  const ov = s.ov || {};
  const sc = {
    lr: ov.lr ?? pre.lr,
    floor: ov.floor ?? pre.floor,
    share: ov.share ?? pre.share,
    lic_disc: ov.lic_disc ?? pre.lic_disc,
    disc: pre.disc.slice()
  };
  const big = ov.disc ? ov.disc[3] : null;
  if (big != null) {
    const p4 = pre.disc[3];
    sc.disc = [0, 1, 2, 3].map((i) => (p4 ? (pre.disc[i] / p4) * big : big));
  }
  R.scale = sc;
  const exponent = Math.log(sc.lr) / Math.log(2);
  const LF = (n) => Math.max(sc.floor, n ** exponent);

  // ---------------- Opening plan ----------------
  const op = s.openings;
  const cum = [];
  let c = 0;
  for (const x of op) {
    c += x;
    cum.push(c);
  }
  const N = c;
  R.N = N;
  const planFleet = Math.max(N, 1);

  // ---------------- Melbourne: sizes and the four tests ----------------
  const fb = econ.flagship_bar;
  const sb = econ.standard_bar;
  const M = D.STREETS.map(([id, label, arch, vol, F]) => ({ id, label, arch, vol, F, tl: liveTier(vol, arch, fb, sb) }));
  const sortedF = M.map((m) => m.F).sort((a, b) => a - b);
  const mid = sortedF.length >> 1;
  const Fref = sortedF.length % 2 ? sortedF[mid] : (sortedF[mid - 1] + sortedF[mid]) / 2;
  R.Fref = Fref;
  const Y = econ.payback_years;
  const cap = econ.capture;
  const ppv = econ.ticket * econ.conversion * econ.dash_margin;
  const cm = econ.gross_margin - sumOf(s.var);
  R.cm = cm;
  const ramp = [econ.ramp1, econ.ramp2];
  for (let i = 0; i < 30; i++) ramp.push(1);
  const SR = sumOf(ramp.slice(0, Math.max(0, Math.trunc(Y))));
  R.SR = SR;

  const lic = (t, nOpen) => stepPrice(nOpen, rn.licence_steps) * rn.licence_factor[t] * (1 - sc.lic_disc);
  const FP = {};
  const FX_other = {};
  const LIC_plan = {};
  for (const t of T) {
    const sw = SW[t];
    FP[t] = {
      staff: rn.fte[t] * rn.fte_cost,
      occ: rn.other_occ_psf * area[t],
      energy: (rn.kwh_psf * area[t] + sw.kw * rn.hours * rn.days) * rn.kwh_price,
      support: rn.support_pct * sw.hw,
      refresh: (sw.hw * rn.refresh_share) / rn.refresh_life,
      content: sw.zones * rn.content_per_zone
    };
    FX_other[t] = sumOf(Object.values(FP[t]));
    LIC_plan[t] = lic(t, planFleet);
  }
  R.FP = FP;
  R.FX_other = FX_other;
  R.LIC_plan = LIC_plan;
  const q = s.street_capture;
  for (const m of M) {
    const t = m.tl;
    m.q = q[m.arch];
    m.reqA = SW[t].pilot / (Y * ppv) / m.F;
    m.passA = m.reqA <= cap;
    const c1 = streetTest(s, R, t, m, SW[t].pilot);
    m.rent = c1.rent;
    m.fixed = c1.fixed;
    m.possible = c1.possible;
    m.needC = c1.need;
    m.reqC = c1.req;
    m.passC = c1.pass;
  }
  const mixOf = (key) => {
    const cnt = {};
    for (const t of T) cnt[t] = M.filter((m) => m.tl === t && (key ? m[key] : true)).length;
    const tot = sumOf(T.map((t) => cnt[t]));
    const mix = {};
    for (const t of T) mix[t] = tot ? cnt[t] / tot : 0;
    return [cnt, mix];
  };
  [R.countA, R.mixA] = mixOf('passA');
  [R.countC, R.mixC] = mixOf('passC');
  [R.countAll, R.mixAll] = mixOf(null);

  // Rank the streets of each size: paying ones first, then the busiest, ties by sensor id.
  const src = s.mix_source;
  for (const m of M) {
    m.flag = (src === 'pnl' ? m.passC : m.passA) ? 1 : 0;
    m.score = m.flag * 1e9 + m.F;
  }
  const npay = {};
  const nall = {};
  const ncand = {};
  const ranked = {};
  for (const t of T) {
    ranked[t] = M.filter((m) => m.tl === t).sort((a, b) => b.score - a.score || a.id - b.id);
    ranked[t].forEach((m, i) => { m.rank = i + 1; });
    npay[t] = ranked[t].filter((m) => m.flag === 1).length;
    nall[t] = ranked[t].length;
    ncand[t] = npay[t] > 0 ? npay[t] : nall[t];
  }
  R.npay = npay;
  R.nall = nall;
  R.ncand = ncand;
  const byRank = (t, r) => ranked[t][r - 1];
  const Ftyp = {};
  const qtyp = {};
  for (const t of T) {
    const n = ncand[t];
    if (n === 0) {
      Ftyp[t] = Fref;
      qtyp[t] = 1;
      continue;
    }
    Ftyp[t] = n % 2 === 1 ? byRank(t, (n + 1) / 2).F : (byRank(t, n / 2).F + byRank(t, n / 2 + 1).F) / 2;
    qtyp[t] = sumOf(ranked[t].slice(0, n).map((m) => m.q)) / n;
  }
  R.Ftyp = Ftyp;
  R.qtyp = qtyp;

  // How many stores of each size: largest remainder on whole-number weights.
  const own = {};
  for (const t of T) own[t] = Math.round(Math.max(0, s.own_mix[t]) * 1000000);
  let W = { dash: R.countA, pnl: R.countC, all: R.countAll, own }[src] || R.countA;
  if (sumOf(T.map((t) => W[t])) === 0) W = R.countAll;
  const Wt = sumOf(T.map((t) => W[t]));
  R.share_used = {};
  for (const t of T) R.share_used[t] = W[t] / Wt;
  const base = {};
  const remd = {};
  for (const t of T) {
    base[t] = Math.floor((W[t] * N) / Wt);
    remd[t] = (W[t] * N) % Wt;
  }
  const rem = N - sumOf(T.map((t) => base[t]));
  const order = T.slice().sort((a, b) => remd[b] - remd[a] || T.indexOf(a) - T.indexOf(b));
  const target = { ...base };
  for (const t of order.slice(0, rem)) target[t] += 1;
  R.target = target;

  // The opening sequence: the flagship first, then whichever size is furthest behind its share.
  const seq = [];
  const cnt = { SPLUS: 0, S: 0, D: 0 };
  for (let k = 1; k <= N; k++) {
    let ch;
    if (k === 1 && s.flagship_first && target.SPLUS > 0) ch = 'SPLUS';
    else {
      const d = {};
      for (const t of T) d[t] = cnt[t] < target[t] ? target[t] * k - cnt[t] * N : -1e9;
      if (d.SPLUS >= d.S && d.SPLUS >= d.D) ch = 'SPLUS';
      else if (d.S >= d.D) ch = 'S';
      else ch = 'D';
    }
    cnt[ch] += 1;
    seq.push([ch, cnt[ch]]);
  }

  // ---------------- Every store ----------------
  const stores = [];
  seq.forEach(([t, u], i) => {
    const k = i + 1;
    const y = 1 + cum.filter((cv) => cv < k).length;
    const neff = u + sc.share * (k - u);
    const lf = LF(neff);
    const kk = s.deal === COMMIT ? N : k;
    const vf = 1 - priceBreak(kk, s.price_break_at, sc.disc);
    const sw = SW[t];
    const bToday = sw.Learning * lf + sw['Price breaks'] * vf + sw.None;
    const bNom = bToday * (1 + econ.build_inflation) ** (y - 1);
    let name;
    let arch;
    let f;
    let qq;
    let sid = null;
    if (s.street_choice === 'typical' || ncand[t] === 0) {
      name = ncand[t] ? 'Typical ' + D.TIER_NAME[t].toLowerCase() + ' street' : 'No street of this size';
      arch = '';
      f = Ftyp[t];
      qq = qtyp[t];
    } else {
      const row = byRank(t, ((u - 1) % ncand[t]) + 1);
      name = row.label;
      arch = row.arch;
      f = row.F;
      qq = row.q;
      sid = row.id;
    }
    const e = storeEcon(s, R, t, f, qq, bToday);
    stores.push({ k, tier: t, unit: u, year: y, neff, lf, vf, build_today: bToday, build_nom: bNom, street: name, sid, arch,
      F: f, q: qq, sales: e.sales, rent: e.rent, fixed_ex: e.fixed_ex, mature: e.mature, payback: e.payback, stock: e.stock });
  });
  R.stores = stores;
  const atscale = {};
  for (const t of T) {
    const b = stores.filter((x) => x.tier === t).map((x) => x.build_today);
    atscale[t] = b.length ? sumOf(b) / b.length : SW[t].pilot;
  }
  R.atscale = atscale;
  for (const m of M) {
    const t = m.tl;
    m.reqB = atscale[t] / (Y * ppv) / m.F;
    m.passB = m.reqB <= cap;
    const c2 = streetTest(s, R, t, m, atscale[t]);
    m.needD = c2.need;
    m.reqD = c2.req;
    m.passD = c2.pass;
  }
  [R.countB, R.mixB] = mixOf('passB');
  [R.countD, R.mixD] = mixOf('passD');
  R.M = M;

  // What to type into the Tableau dashboard: its build cost sliders move in $50,000 steps.
  R.tableau_build = {};
  for (const t of T) R.tableau_build[t] = Math.round(SW[t].pilot / 50000) * 50000;
  R.countA_rounded = M.filter((m) => m.F >= R.tableau_build[m.tl] / (Y * ppv * cap)).length;

  // ---------------- The program, year by year ----------------
  const YR = D.YEARS;
  const infl = econ.build_inflation;
  const yrs = [...Array(YR).keys()];
  const openEnd = yrs.map((y) => (y < cum.length ? cum[y] : N));
  const licY = {};
  for (const t of T) licY[t] = yrs.map((y) => (openEnd[y] > 0 ? lic(t, openEnd[y]) : 0));
  const contrib = yrs.map(() => 0);
  for (const st of stores) {
    for (let y = 1; y <= YR; y++) {
      let v = 0;
      if (y >= st.year) {
        const rp = y === st.year ? econ.ramp1 : y === st.year + 1 ? econ.ramp2 : 1;
        const sh = y === st.year ? econ.open_year_share : 1;
        v = sh * (st.sales * cm * rp - st.fixed_ex - licY[st.tier][y - 1]);
      }
      contrib[y - 1] += v;
    }
  }
  const firstYear = {};
  for (const t of T) {
    const x = stores.find((st) => st.tier === t);
    firstYear[t] = x ? x.year : 0;
  }
  const perYear = (fn) => yrs.map((y) => fn(y + 1));
  const capex = perYear((y) => sumOf(stores.filter((x) => x.year === y).map((x) => x.build_nom)));
  const fmt = perYear((y) => sumOf(T.filter((t) => firstYear[t] === y).map((t) => SW[t].format_once * (1 + infl) ** (y - 1))));
  const prog = perYear((y) => (y === 1 && N > 0 ? R.program_once : 0));
  const stock = perYear((y) => sumOf(stores.filter((x) => x.year === y).map((x) => x.stock)));
  const techs = yrs.map((y) => (openEnd[y] > 0 ? Math.ceil(openEnd[y] / pr.stores_per_tech) : 0));
  const central = yrs.map((y) => (openEnd[y] > 0 ? pr.central_team : 0));
  const platform = yrs.map((y) => (openEnd[y] > 0 ? pr.platform : 0));
  const techcost = yrs.map((y) => techs[y] * pr.tech_cost);
  const mgrs = yrs.map((y) => (openEnd[y] > 0 ? Math.ceil(openEnd[y] / pr.stores_per_manager) : 0));
  const mgrcost = yrs.map((y) => mgrs[y] * pr.manager_cost);
  const net = yrs.map((y) => contrib[y] - capex[y] - fmt[y] - prog[y] - stock[y] - central[y] - platform[y] - techcost[y] - mgrcost[y]);
  const cumc = [];
  let run_ = 0;
  for (const v of net) {
    run_ += v;
    cumc.push(run_);
  }
  Object.assign(R, { open_end: openEnd, lic_y: licY, contrib, capex, fmt, prog, stock, techs, central, platform, techcost,
    mgrs, mgrcost, net, cum: cumc, first_year: firstYear });
  const pbIdx = cumc.findIndex((v) => v >= 0);
  R.payback_year = pbIdx >= 0 ? pbIdx + 1 : null;
  R.peak_need = -Math.min(0, ...cumc) || 0;
  const r = econ.discount_rate;
  R.npv = sumOf(net.map((v, y) => v / (1 + r) ** (y + 1)));
  R.total_build = sumOf(capex);
  // The workbook's total investment: builds, one-time design, program setup and opening stock.
  R.total_invest = sumOf(capex) + sumOf(fmt) + sumOf(prog) + sumOf(stock);
  R.cum10 = cumc[cumc.length - 1];
  R.repay5 = stores.filter((x) => x.payback != null && x.payback <= 5).length;
  R.repayY = stores.filter((x) => x.payback != null && x.payback <= Y).length;
  return R;
}

// The headline line, worded as on the workbook's Program sheet.
export function paybackText(R) {
  if (!R.N) return 'No stores planned';
  return R.payback_year ? 'Year ' + R.payback_year : 'Not within 10 years';
}

// The six challenges on the workbook's Start sheet.
export function challenges(s, R) {
  const flagStreets = R.countAll.SPLUS;
  return [
    { key: 'lean', title: 'Lean flagship', goal: 'Get the first flagship under $1.2M and keep every flagship street paying back.',
      hint: 'Try the Lean recipe for the flagship, or switch off its big-ticket tech.',
      done: R.pilot.SPLUS < 1200000 && R.countA.SPLUS === flagStreets && flagStreets > 0 },
    { key: 'open', title: 'Open up Melbourne', goal: 'Make 65 of the 78 streets pay back on the dashboard test.',
      hint: 'Cheaper standard and small stores let quieter streets in.',
      done: sumOf(T.map((t) => R.countA[t])) >= 65, status: sumOf(T.map((t) => R.countA[t])) + ' of 78' },
    { key: 'passengers', title: 'No passengers', goal: 'Run 30 or more stores where every store repays its build within 5 years.',
      hint: 'Let the full store P&L pick the streets.',
      done: R.N >= 30 && R.repay5 === R.N, status: R.repay5 + ' of ' + R.N },
    { key: 'quick', title: 'Quick return', goal: 'Get the whole program back above zero cash by the end of Year 5.',
      hint: 'Leaner builds, faster learning and better streets all help.',
      done: R.N > 0 && R.payback_year != null && R.payback_year <= 5, status: paybackText(R) },
    { key: 'showcase', title: 'Showcase that sells', goal: 'Showcase for all three sizes and still a 10-year value (NPV) above $40M.',
      hint: 'Expensive stores need the best streets: choose them with the full P&L.',
      done: T.every((t) => s.recipe[t] === 'Showcase') && R.npv >= 40000000 },
    { key: 'big', title: 'Go big', goal: 'Open 60 or more stores while keeping the peak cash need under $12M.',
      hint: 'Leaner builds and the full P&L keep the weak streets out.',
      done: R.N >= 60 && R.peak_need < 12000000 }
  ];
}
