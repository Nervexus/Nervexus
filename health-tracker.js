/* ============================================================================
   health-tracker.js — data engine for the Fitness & Health tracker.

   Pure business logic (no UI): schema migration + seeding, unit conversion,
   body/sleep/hydration calculations, trend regression, ETA-to-goal, and
   week/month/year aggregation. The DC logic class calls into window.HealthKit;
   all persisted data lives inside state.health and is saved by the app.
   ============================================================================ */
(function (root) {
  // Runs once: the <helmet> relocation re-executes every script. See engine-guards.test.mjs.
  if (root.HealthKit) return;

  'use strict';

  var DAY = 86400000;
  function dstr(d) { try { return d.toLocaleDateString('en-CA'); } catch (e) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); } }
  function shift(days) { var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + days); return dstr(d); }
  function today() { return shift(0); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function round(v, d) { var p = Math.pow(10, d == null ? 1 : d); return Math.round(v * p) / p; }

  /* ---- unit conversion ------------------------------------------------ */
  var CONV = {
    mass: { kg: 1, lb: 2.2046226 },
    length: { cm: 1, in: 1 / 2.54 },
    volume: { ml: 1, L: 1 / 1000, oz: 1 / 29.5735 }
  };
  // stored canonical units: mass=kg, length=cm, volume=ml.
  function toDisplay(kind, canonical, unit) { if (canonical == null || isNaN(canonical)) return null; return canonical * CONV[kind][unit]; }
  function toCanonical(kind, shown, unit) { if (shown == null || shown === '' || isNaN(+shown)) return null; return (+shown) / CONV[kind][unit]; }
  function fmtMass(kg, u, d) { var v = toDisplay('mass', kg, u); return v == null ? '—' : round(v, d == null ? 1 : d) + ' ' + u; }
  function fmtLen(cm, u, d) { var v = toDisplay('length', cm, u); return v == null ? '—' : round(v, d == null ? 1 : d) + ' ' + u; }
  function fmtVol(ml, u) { if (ml == null) return '—'; if (u === 'L') return round(ml / 1000, 2) + ' L'; if (u === 'oz') return round(ml / 29.5735, 0) + ' oz'; return Math.round(ml) + ' ml'; }

  // The 18 girth measurements (cm), grouped, in display order.
  var MEASURES = [
    { key: 'neck', label: 'Neck', group: 'Upper' },
    { key: 'shoulders', label: 'Shoulders', group: 'Upper' },
    { key: 'chest', label: 'Chest', group: 'Upper' },
    { key: 'armL', label: 'Left Arm', group: 'Upper' },
    { key: 'armR', label: 'Right Arm', group: 'Upper' },
    { key: 'forearmL', label: 'Left Forearm', group: 'Upper' },
    { key: 'forearmR', label: 'Right Forearm', group: 'Upper' },
    { key: 'waist', label: 'Waist', group: 'Core' },
    { key: 'hips', label: 'Hips', group: 'Core' },
    { key: 'thighL', label: 'Left Thigh', group: 'Lower' },
    { key: 'thighR', label: 'Right Thigh', group: 'Lower' },
    { key: 'calfL', label: 'Left Calf', group: 'Lower' },
    { key: 'calfR', label: 'Right Calf', group: 'Lower' },
    { key: 'ankleL', label: 'Left Ankle', group: 'Lower' },
    { key: 'ankleR', label: 'Right Ankle', group: 'Lower' }
  ];

  // Large categorized food list for the Diet Checklist.
  var DIET_FOODS = [
    ['Protein', ['Chicken Breast', 'Salmon', 'Eggs', 'Turkey', 'Tuna', 'Lean Beef', 'Shrimp', 'Tofu', 'Lentils', 'Black Beans']],
    ['Dairy & Eggs', ['Greek Yogurt', 'Cottage Cheese', 'Milk', 'Cheese', 'Whey Protein']],
    ['Carbs & Grains', ['Brown Rice', 'Oats', 'Quinoa', 'Sweet Potato', 'Whole Wheat Bread', 'Whole Grain Pasta', 'White Rice', 'Potatoes', 'Barley', 'Couscous']],
    ['Vegetables', ['Broccoli', 'Spinach', 'Kale', 'Bell Peppers', 'Carrots', 'Asparagus', 'Zucchini', 'Brussels Sprouts', 'Cauliflower', 'Green Beans', 'Cucumber', 'Tomatoes']],
    ['Fruits', ['Banana', 'Apple', 'Blueberries', 'Strawberries', 'Orange', 'Avocado', 'Grapes', 'Pineapple', 'Mango', 'Watermelon']],
    ['Fats & Nuts', ['Olive Oil', 'Almonds', 'Walnuts', 'Chia Seeds', 'Flaxseed', 'Peanut Butter', 'Cashews']],
    ['Snacks & Treats', ['Dark Chocolate', 'Popcorn', 'Rice Cakes', 'Protein Bar', 'Hummus', 'Trail Mix']]
  ];
  function defaultDiet() {
    var out = [];
    DIET_FOODS.forEach(function (grp) {
      grp[1].forEach(function (name) {
        out.push({ id: (grp[0] + '_' + name).replace(/\s+/g, '_').toLowerCase(), name: name, cat: grp[0], checked: false, locked: false });
      });
    });
    return out;
  }

  // Master list of Today's Stats (customisable).
  var STATS = [
    { key: 'calories', label: 'Calories', unit: 'kcal', color: '#e8e8ec' },
    { key: 'protein', label: 'Protein', unit: 'g', color: '#ff5563' },
    { key: 'carbs', label: 'Carbs', unit: 'g', color: '#5bb8e8' },
    { key: 'fat', label: 'Fat', unit: 'g', color: '#e8b45a' },
    { key: 'fibre', label: 'Fibre', unit: 'g', color: '#7fe6b0' },
    { key: 'sugar', label: 'Sugar', unit: 'g', color: '#c98fe0' },
    { key: 'water', label: 'Hydration', unit: 'ml', color: '#5aa0dc' },
    { key: 'steps', label: 'Steps', unit: '', color: '#eef0f2' },
    { key: 'activeKcal', label: 'Active Cal', unit: 'kcal', color: '#ff8a5b' },
    { key: 'workoutMin', label: 'Workout', unit: 'min', color: '#ff6b76' }
  ];

  /* ---- schema migration + seeding ------------------------------------- */
  function ensure(H, opts) {
    H = H || {};
    opts = opts || {};
    if (H._v2) { // already migrated — still backfill newer fields
      if (!H.diet || !H.diet.length) H.diet = defaultDiet();
      if (!H.energyLog || !H.energyLog.length) seedEnergyOnly(H);
      return H;
    }
    // preserve legacy fields the rest of the app still reads
    H.units = H.units || { mass: 'kg', length: 'cm', volume: 'ml' };
    H.heightCm = H.heightCm || 181;
    if (!H.hydrationGoalMl) H.hydrationGoalMl = (H.waterGoal || 8) * 250;
    H.statsPrefs = H.statsPrefs || ['calories', 'protein', 'carbs', 'fat', 'water', 'steps', 'activeKcal', 'workoutMin'];
    H.sleepLog = H.sleepLog || [];
    H.hydrationLog = H.hydrationLog || [];
    H.bodyLog = H.bodyLog || [];
    H.photos = H.photos || [];
    H.goals = H.goals || {};
    H.todayExtra = H.todayExtra || {};
    H.diet = H.diet || defaultDiet();
    H.energyLog = H.energyLog || [];

    if (opts.seed && !H.sleepLog.length && !H.bodyLog.length) seed(H);
    H._v2 = true;
    return H;
  }

  function seed(H) {
    var N = 78; // ~11 weeks of history
    // Body composition — realistic slow recomposition: weight & fat down, muscle up.
    var w0 = 84.6, bf0 = 17.8, mm0 = 60.4;
    var base = { neck: 39.5, shoulders: 122, chest: 104, armL: 37.6, armR: 38.1, forearmL: 29.4, forearmR: 29.8, waist: 87, hips: 100, thighL: 60.5, thighR: 61, calfL: 39.2, calfR: 39.4, ankleL: 23, ankleR: 23 };
    var bodyLog = [];
    // body snapshots roughly every 4–5 days
    for (var d = N; d >= 0; d -= (Math.random() < 0.5 ? 4 : 5)) {
      var t = (N - d) / N; // 0..1 progress
      var wob = Math.sin(d * 0.7) * 0.25;
      var snap = {
        date: shift(-d),
        weightKg: round(w0 - t * 3.9 + wob, 1),
        bodyFatPct: round(bf0 - t * 4.1 + Math.sin(d * 0.5) * 0.2, 1),
        muscleKg: round(mm0 + t * 2.7 + Math.sin(d * 0.9) * 0.15, 1)
      };
      MEASURES.forEach(function (m) {
        var dir = /waist|hips/.test(m.key) ? -1 : 1;      // waist/hips shrink; limbs grow
        var span = /waist/.test(m.key) ? 5.5 : /hips/.test(m.key) ? 2.5 : /chest|shoulders/.test(m.key) ? 3.2 : /thigh/.test(m.key) ? 2.4 : /arm|forearm|calf/.test(m.key) ? 1.7 : 0.6;
        snap[m.key] = round(base[m.key] + dir * t * span + Math.sin(d + m.key.length) * 0.15, 1);
      });
      bodyLog.push(snap);
    }
    H.bodyLog = bodyLog;
    // keep legacy quick-read fields in sync with the latest snapshot
    var last = bodyLog[bodyLog.length - 1];
    H.bodyFat = last.bodyFatPct; H.muscleMass = last.muscleKg; H.waist = last.waist;
    H.weights = bodyLog.slice(-14).map(function (b) { return b.weightKg; });
    H.bmi = round(last.weightKg / Math.pow(H.heightCm / 100, 2), 1);

    // Sleep — nightly log with weekend drift & quality/energy correlation.
    var sleepLog = [];
    for (var s = N; s >= 0; s--) {
      var date = shift(-s);
      var dow = new Date(date + 'T12:00:00').getDay();
      var weekend = (dow === 5 || dow === 6);
      var dur = clamp(rnd(6.2, 8.4) + (weekend ? 0.5 : 0), 5, 9.3);
      var hours = Math.floor(dur), minutes = Math.round((dur - hours) * 60);
      var bh = weekend ? 0 : 23, bm = Math.floor(rnd(0, 55));
      var bed = String((bh + (Math.random() < 0.35 ? 1 : 0)) % 24).padStart(2, '0') + ':' + String(bm).padStart(2, '0');
      var wkMin = Math.round((bh * 60 + bm + dur * 60)) % (24 * 60);
      var wake = String(Math.floor(wkMin / 60)).padStart(2, '0') + ':' + String(wkMin % 60).padStart(2, '0');
      var quality = Math.round(clamp(dur * 1.05 + rnd(-1.3, 1.3), 3, 10));
      var energy = Math.round(clamp(quality + rnd(-1.5, 1.2), 2, 10));
      sleepLog.push({ id: uid(), date: date, hours: hours, minutes: minutes, bedtime: bed, wake: wake, quality: quality, energy: energy, notes: '' });
    }
    H.sleepLog = sleepLog;
    H.sleepH = sleepLog.slice(-7).map(function (x) { return round(x.hours + x.minutes / 60, 1); });

    // Hydration — 4–8 entries/day around the goal.
    var hyd = [];
    var goal = H.hydrationGoalMl;
    for (var q = N; q >= 0; q--) {
      var day = shift(-q);
      var target = goal * rnd(0.72, 1.12);
      var pored = 0, n = 0;
      while (pored < target && n < 9) {
        var amt = [250, 300, 350, 500, 500, 750][Math.floor(Math.random() * 6)];
        var hh = 7 + Math.floor(n * rnd(1.4, 2.2));
        if (hh > 23) break;
        hyd.push({ id: uid(), date: day, ml: amt, time: String(hh).padStart(2, '0') + ':' + String(Math.floor(rnd(0, 59))).padStart(2, '0') });
        pored += amt; n++;
      }
    }
    H.hydrationLog = hyd;
    H.water = Math.round(dayHydration(H, today()) / 250);

    // Goals seeded from a sensible target relative to current.
    H.goals = {
      weightKg: 79, bodyFatPct: 11, muscleKg: 65, hydrationMl: goal, sleepH: 8,
      chest: 108, waist: 80, arm: 40, leg: 63, calf: 41
    };
    // Today's manual extras
    H.todayExtra = { date: today(), steps: 8420, activeKcal: 620, workoutMin: 52, carbs: 210, fat: 62, fibre: 28, sugar: 44 };

    // Energy — three slots/day, loosely correlated with sleep quality that night.
    seedEnergyOnly(H, sleepLog);
  }

  function seedEnergyOnly(H, sleepLogArg) {
    var N = 78;
    var sleepLog = sleepLogArg || H.sleepLog || [];
    var sleepByDate = {}; sleepLog.forEach(function (s) { sleepByDate[s.date] = s; });
    var energyLog = [];
    for (var e = N; e >= 0; e--) {
      var eDate = shift(-e);
      var sEntry = sleepByDate[eDate];
      var base = sEntry ? clamp(sEntry.quality * 0.8 + 1.5, 3, 9.5) : rnd(4.5, 8);
      var mkSlot = function (drift) { var v = Math.round(clamp(base + drift + rnd(-1.1, 1.1), 1, 10)); return { val: v, note: '' }; };
      energyLog.push({ date: eDate, morning: mkSlot(0.6), midday: mkSlot(-1.8), evening: mkSlot(-0.3) });
    }
    H.energyLog = energyLog;
  }

  /* ---- derived series ------------------------------------------------- */
  function bySorted(arr) { return (arr || []).slice().sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; }); }
  function dayHydration(H, date) { return (H.hydrationLog || []).filter(function (e) { return e.date === date; }).reduce(function (a, e) { return a + (+e.ml || 0); }, 0); }
  function sleepDur(x) { return round((+x.hours || 0) + (+x.minutes || 0) / 60, 2); }

  function dailyHydrationSeries(H, days) {
    var out = [];
    for (var i = days - 1; i >= 0; i--) { var d = shift(-i); out.push({ date: d, ml: dayHydration(H, d) }); }
    return out;
  }
  function sleepSeries(H, days) {
    var map = {}; bySorted(H.sleepLog).forEach(function (x) { map[x.date] = x; });
    var out = [];
    for (var i = days - 1; i >= 0; i--) { var d = shift(-i); out.push({ date: d, hours: map[d] ? sleepDur(map[d]) : null, entry: map[d] || null }); }
    return out;
  }
  function bodySeries(H, key) { return bySorted(H.bodyLog).map(function (b) { return { date: b.date, v: b[key] }; }).filter(function (p) { return p.v != null; }); }

  function avg(nums) { var a = nums.filter(function (n) { return n != null && !isNaN(n); }); return a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : null; }

  // ---- Energy log helpers ----
  // Each entry: { date, morning:{val,note}, midday:{val,note}, evening:{val,note} }
  // Structured per-slot so it can later be correlated with sleep/diet/hydration/training/recovery by date.
  function energyEntry(H, date) { return (H.energyLog || []).filter(function (e) { return e.date === date; })[0] || null; }
  function energyAvgOf(e) { if (!e) return null; var vals = ['morning', 'midday', 'evening'].map(function (k) { return e[k] && e[k].val; }).filter(function (v) { return v != null; }); return avg(vals); }
  function energyHistory(H, limit) { var log = bySorted(H.energyLog).slice().reverse(); return limit ? log.slice(0, limit) : log; }
  function energyStats(H, days) {
    var log = bySorted(H.energyLog);
    if (days) { var cutoff = shift(-(days - 1)); log = log.filter(function (e) { return e.date >= cutoff; }); }
    var slot = function (k) { return avg(log.map(function (e) { return e[k] && e[k].val; }).filter(function (v) { return v != null; })); };
    var dayAvgs = log.map(function (e) { return { date: e.date, avg: energyAvgOf(e) }; }).filter(function (d) { return d.avg != null; });
    var best = dayAvgs.reduce(function (a, b) { return (!a || b.avg > a.avg) ? b : a; }, null);
    var worst = dayAvgs.reduce(function (a, b) { return (!a || b.avg < a.avg) ? b : a; }, null);
    return { morning: slot('morning'), midday: slot('midday'), evening: slot('evening'), overall: avg(dayAvgs.map(function (d) { return d.avg; })), best: best, worst: worst, count: log.length };
  }

  // linear regression slope (per day) + projection helpers over {date,v} points
  function regression(points) {
    var pts = points.filter(function (p) { return p.v != null; });
    if (pts.length < 2) return null;
    var t0 = new Date(pts[0].date + 'T12:00:00').getTime();
    var xs = pts.map(function (p) { return (new Date(p.date + 'T12:00:00').getTime() - t0) / DAY; });
    var ys = pts.map(function (p) { return p.v; });
    var n = xs.length, sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (var i = 0; i < n; i++) { sx += xs[i]; sy += ys[i]; sxx += xs[i] * xs[i]; sxy += xs[i] * ys[i]; }
    var denom = (n * sxx - sx * sx); if (!denom) return null;
    var slope = (n * sxy - sx * sy) / denom;      // units per day
    var intercept = (sy - slope * sx) / n;
    return { slope: slope, intercept: intercept, first: ys[0], last: ys[ys.length - 1], lastX: xs[xs.length - 1] };
  }

  // ETA (days) for a series to reach target given its recent slope.
  function etaDays(points, target) {
    var r = regression(points); if (!r || !r.slope) return null;
    var need = target - r.last;
    if ((need > 0 && r.slope <= 0) || (need < 0 && r.slope >= 0)) return null; // moving wrong way
    if (Math.abs(need) < 1e-6) return 0;
    var d = need / r.slope;
    return d > 0 && d < 3650 ? Math.round(d) : null;
  }

  // Sleep consistency 0..100: penalise variance in duration and bedtime minute-of-day.
  function sleepConsistency(H, days) {
    var s = sleepSeries(H, days || 14).map(function (x) { return x.entry; }).filter(Boolean);
    if (s.length < 3) return null;
    var durs = s.map(sleepDur);
    var mean = avg(durs);
    var varr = avg(durs.map(function (d) { return (d - mean) * (d - mean); }));
    var durStd = Math.sqrt(varr || 0);
    // bedtime minutes (wrap around midnight to a continuous scale)
    var beds = s.map(function (x) { var p = (x.bedtime || '23:00').split(':'); var m = (+p[0]) * 60 + (+p[1]); if (m < 12 * 60) m += 24 * 60; return m; });
    var bMean = avg(beds); var bStd = Math.sqrt(avg(beds.map(function (m) { return (m - bMean) * (m - bMean); })) || 0);
    var score = 100 - (durStd * 26) - (bStd * 0.32);
    return Math.round(clamp(score, 0, 100));
  }
  function consistencyLabel(v) { return v == null ? '—' : v >= 85 ? 'Excellent' : v >= 70 ? 'Good' : v >= 50 ? 'Fair' : 'Erratic'; }

  function bmi(H, weightKg) { var w = weightKg != null ? weightKg : latestBody(H, 'weightKg'); if (w == null) return null; return round(w / Math.pow((H.heightCm || 181) / 100, 2), 1); }
  function leanMass(weightKg, bodyFatPct) { if (weightKg == null || bodyFatPct == null) return null; return round(weightKg * (1 - bodyFatPct / 100), 1); }
  function latestBody(H, key) { var s = bySorted(H.bodyLog); for (var i = s.length - 1; i >= 0; i--) if (s[i][key] != null) return s[i][key]; return null; }
  function latestSnap(H) { var s = bySorted(H.bodyLog); return s[s.length - 1] || null; }

  // change between first-in-window and latest for a body key
  function change(H, key, windowDays) {
    var pts = bodySeries(H, key); if (pts.length < 2) return null;
    var last = pts[pts.length - 1];
    var cutoff = windowDays ? shift(-windowDays) : pts[0].date;
    var baseP = null;
    for (var i = 0; i < pts.length; i++) { if (pts[i].date >= cutoff) { baseP = pts[i]; break; } }
    if (!baseP) baseP = pts[0];
    return round(last.v - baseP.v, 1);
  }

  var api = {
    DAY: DAY, dstr: dstr, shift: shift, today: today, uid: uid, round: round, clamp: clamp, avg: avg,
    CONV: CONV, MEASURES: MEASURES, STATS: STATS,
    toDisplay: toDisplay, toCanonical: toCanonical, fmtMass: fmtMass, fmtLen: fmtLen, fmtVol: fmtVol,
    DIET_FOODS: DIET_FOODS, defaultDiet: defaultDiet,
    ensure: ensure, seed: seed,
    bySorted: bySorted, dayHydration: dayHydration, sleepDur: sleepDur,
    dailyHydrationSeries: dailyHydrationSeries, sleepSeries: sleepSeries, bodySeries: bodySeries,
    regression: regression, etaDays: etaDays, sleepConsistency: sleepConsistency, consistencyLabel: consistencyLabel,
    bmi: bmi, leanMass: leanMass, latestBody: latestBody, latestSnap: latestSnap, change: change,
    energyEntry: energyEntry, energyAvgOf: energyAvgOf, energyHistory: energyHistory, energyStats: energyStats
  };
  root.HealthKit = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : this);
