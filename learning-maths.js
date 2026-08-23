/* ============================================================================
   learning-maths.js — GCSE Maths question engine for the Learning Centre.
   Pure business logic (no UI): procedural question generators spanning
   Number, Fractions, Decimals, Negatives, Percentages, Algebra, Geometry,
   Ratio, Probability, Statistics, Problem Solving and Calculation Methods;
   a 60-level topic-banded ladder, a placement test, a formula library and
   a Mental Maths Trainer set. Consumed by the DC logic class via
   window.LearningMaths; all session/progress data lives in the app's own
   state and is persisted by the app.
   ============================================================================ */
(function (root) {
  'use strict';

  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(arr) { return arr[ri(0, arr.length - 1)]; }
  function round(v, d) { var p = Math.pow(10, d == null ? 0 : d); return Math.round(v * p) / p; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a || 1; }

  /* ---- ORIGINAL FOUR (kept for GCSE Test / Hard Test compatibility) ------ */
  function qTimesTable() {
    var a = ri(2, 12), b = ri(2, 12);
    return { topic: 'Times Tables', topicKey: 'times', prompt: a + ' \u00d7 ' + b, answer: a * b, method: a + ' \u00d7 ' + b + ' = ' + (a * b) };
  }
  function qDivision() {
    var b = ri(2, 12);
    if (Math.random() < 0.6) {
      var q = ri(2, 20), a1 = q * b;
      return { topic: 'Division', topicKey: 'division', prompt: a1 + ' \u00f7 ' + b, answer: q, method: a1 + ' \u00f7 ' + b + ' = ' + q };
    }
    var a2 = ri(10, 200), ans = round(a2 / b, 1);
    return { topic: 'Division', topicKey: 'division', prompt: a2 + ' \u00f7 ' + b + ' (to 1 d.p.)', answer: ans, method: a2 + ' \u00f7 ' + b + ' = ' + ans + ' (1 d.p.)' };
  }
  function qPercentage() {
    var kind = pick(['of', 'of', 'change', 'find']);
    if (kind === 'of') {
      var pct = pick([5, 10, 12, 15, 20, 25, 30, 40, 50, 60, 75]), base = ri(2, 40) * 10;
      var ans = round(base * pct / 100, 2);
      return { topic: 'Percentages', topicKey: 'percentages', prompt: 'What is ' + pct + '% of ' + base + '?', answer: ans, method: pct + '% of ' + base + ' = (' + pct + '\u00f7100) \u00d7 ' + base + ' = ' + ans };
    }
    if (kind === 'change') {
      var price = ri(4, 60) * 5, p2 = pick([10, 15, 20, 25, 30, 50]), up = Math.random() < 0.5;
      var mult = up ? (1 + p2 / 100) : (1 - p2 / 100);
      var newP = round(price * mult, 2);
      return { topic: 'Percentages', topicKey: 'percentages', prompt: 'A \u00a3' + price + ' item is ' + (up ? 'increased' : 'reduced') + ' by ' + p2 + '%. New price in \u00a3?', answer: newP, method: '\u00a3' + price + ' \u00d7 ' + mult.toFixed(2) + ' = \u00a3' + newP };
    }
    var total = pick([20, 25, 40, 50, 80, 100]), part = ri(Math.round(total * 0.1), Math.round(total * 0.9));
    var ans2 = round(part / total * 100, 0);
    return { topic: 'Percentages', topicKey: 'percentages', prompt: part + ' out of ' + total + ' as a percentage?', answer: ans2, method: '(' + part + '\u00f7' + total + ') \u00d7 100 = ' + ans2 + '%' };
  }
  function qCalc() {
    var kind = pick(['bidmas', 'neg', 'round', 'frac']);
    if (kind === 'bidmas') {
      var a = ri(2, 9), b = ri(2, 9), c = ri(2, 9);
      var ans = a + b * c;
      return { topic: 'Calculation Methods', topicKey: 'calc', prompt: a + ' + ' + b + ' \u00d7 ' + c, answer: ans, method: 'Multiply first: ' + b + '\u00d7' + c + ' = ' + (b * c) + ', then ' + a + ' + ' + (b * c) + ' = ' + ans };
    }
    if (kind === 'neg') {
      var x = ri(-12, 12), y = ri(1, 12);
      var ans2 = x - (-y);
      return { topic: 'Calculation Methods', topicKey: 'calc', prompt: x + ' \u2212 (\u2212' + y + ')', answer: ans2, method: 'Subtracting a negative = adding: ' + x + ' + ' + y + ' = ' + ans2 };
    }
    if (kind === 'round') {
      var v = round(ri(100, 9999) / 100 + Math.random(), 3);
      var dp = pick([1, 2]);
      var ans3 = round(v, dp);
      return { topic: 'Calculation Methods', topicKey: 'calc', prompt: 'Round ' + v.toFixed(3) + ' to ' + dp + ' d.p.', answer: ans3, method: 'Check the next digit to round \u2192 ' + ans3 };
    }
    var den = pick([2, 4, 5, 8, 10, 20, 25, 50]), num = ri(1, den - 1);
    var ans4 = round(num / den * 100, 0);
    return { topic: 'Calculation Methods', topicKey: 'calc', prompt: num + '/' + den + ' as a percentage?', answer: ans4, method: '(' + num + '\u00f7' + den + ') \u00d7 100 = ' + ans4 + '%' };
  }
  function qDivisionHard() {
    var b = ri(11, 29);
    if (Math.random() < 0.5) {
      var q = ri(12, 80), a1 = q * b;
      return { topic: 'Division', topicKey: 'division', prompt: a1 + ' \u00f7 ' + b, answer: q, method: a1 + ' \u00f7 ' + b + ' = ' + q };
    }
    var a2 = ri(200, 950), ans = round(a2 / b, 2);
    return { topic: 'Division', topicKey: 'division', prompt: a2 + ' \u00f7 ' + b + ' (to 2 d.p.)', answer: ans, method: a2 + ' \u00f7 ' + b + ' = ' + ans + ' (2 d.p.)' };
  }
  function qPercentageHard() {
    var kind = pick(['reverse', 'compound', 'of']);
    if (kind === 'reverse') {
      var pct = pick([10, 15, 20, 25, 30]), final = ri(20, 90) * 2;
      var orig = round(final / (1 - pct / 100), 2);
      return { topic: 'Percentages', topicKey: 'percentages', prompt: 'After a ' + pct + '% discount, an item costs \u00a3' + final + '. What was the original price? (\u00a3)', answer: orig, method: '\u00a3' + final + ' \u00f7 (1 \u2212 ' + (pct / 100) + ') = \u00a3' + orig };
    }
    if (kind === 'compound') {
      var p0 = ri(20, 80) * 10, rate = pick([2, 3, 5, 8, 10]);
      var after = round(p0 * Math.pow(1 + rate / 100, 2), 2);
      return { topic: 'Percentages', topicKey: 'percentages', prompt: '\u00a3' + p0 + ' grows by ' + rate + '% each year for 2 years (compound). Final amount? (\u00a3, 2 d.p.)', answer: after, method: '\u00a3' + p0 + ' \u00d7 (1.' + String(rate).padStart(2, '0') + ')\u00b2 = \u00a3' + after };
    }
    var pct2 = pick([17.5, 12.5, 32, 68]), base = ri(4, 90) * 5;
    var ans2 = round(base * pct2 / 100, 2);
    return { topic: 'Percentages', topicKey: 'percentages', prompt: 'What is ' + pct2 + '% of ' + base + '?', answer: ans2, method: pct2 + '% of ' + base + ' = (' + pct2 + '\u00f7100) \u00d7 ' + base + ' = ' + ans2 };
  }
  function qCalcHard() {
    var kind = pick(['bidmasBrackets', 'negFrac', 'multiStep']);
    if (kind === 'bidmasBrackets') {
      var a = ri(2, 9), b = ri(2, 9), c = ri(2, 9), d = ri(2, 9);
      var ans = (a + b) * c - d;
      return { topic: 'Calculation Methods', topicKey: 'calc', prompt: '(' + a + ' + ' + b + ') \u00d7 ' + c + ' \u2212 ' + d, answer: ans, method: 'Brackets first: (' + a + '+' + b + ')=' + (a + b) + ', then \u00d7' + c + '=' + ((a + b) * c) + ', then \u2212' + d + '=' + ans };
    }
    if (kind === 'negFrac') {
      var x = ri(-9, -2), y = ri(2, 9);
      var ans2 = x * (-y);
      return { topic: 'Calculation Methods', topicKey: 'calc', prompt: x + ' \u00d7 (\u2212' + y + ')', answer: ans2, method: 'Negative \u00d7 negative = positive: ' + Math.abs(x) + '\u00d7' + y + ' = ' + ans2 };
    }
    var den = pick([8, 20, 25, 40]), num = ri(1, den - 1), pctOf = ri(4, 40) * 5;
    var ans3 = round((num / den) * pctOf, 2);
    return { topic: 'Calculation Methods', topicKey: 'calc', prompt: num + '/' + den + ' of ' + pctOf, answer: ans3, method: '(' + num + '\u00f7' + den + ') \u00d7 ' + pctOf + ' = ' + ans3 };
  }
  function generateMixedHard() { return pick([qTimesTable, qDivisionHard, qPercentageHard, qCalcHard])(); }
  function generateSetHard(n) { var out = []; for (var i = 0; i < n; i++) out.push(generateMixedHard()); return out; }
  function gradeFromPctHard(pct) {
    if (pct >= 80) return 9; if (pct >= 70) return 8; if (pct >= 60) return 7;
    if (pct >= 50) return 6; if (pct >= 40) return 5; if (pct >= 30) return 4;
    if (pct >= 18) return 3; if (pct >= 8) return 2; return 1;
  }
  function gradeFromPct(pct) {
    if (pct >= 90) return 9; if (pct >= 80) return 8; if (pct >= 70) return 7;
    if (pct >= 60) return 6; if (pct >= 50) return 5; if (pct >= 40) return 4;
    if (pct >= 25) return 3; if (pct >= 12) return 2; return 1;
  }

  /* ---- NEW TOPICS (tier t in 0..1 scales difficulty) --------------------- */
  function qNumber(t) {
    var maxN = Math.round(lerp(10, 60, t));
    var kind = pick(['add', 'add', 'sub', 'mult', 'div']);
    if (kind === 'add') { var a = ri(1, maxN), b = ri(1, maxN); return { topic: 'Number', topicKey: 'number', prompt: a + ' + ' + b, answer: a + b, method: a + ' + ' + b + ' = ' + (a + b) }; }
    if (kind === 'sub') { var a2 = ri(1, maxN), b2 = ri(1, a2); return { topic: 'Number', topicKey: 'number', prompt: a2 + ' \u2212 ' + b2, answer: a2 - b2, method: a2 + ' \u2212 ' + b2 + ' = ' + (a2 - b2) }; }
    if (kind === 'mult') { var f = Math.round(lerp(5, 12, t)); var a3 = ri(2, f), b3 = ri(2, f); return { topic: 'Number', topicKey: 'number', prompt: a3 + ' \u00d7 ' + b3, answer: a3 * b3, method: a3 + ' \u00d7 ' + b3 + ' = ' + (a3 * b3) }; }
    var f2 = Math.round(lerp(5, 12, t)); var b4 = ri(2, f2), q = ri(2, f2), a4 = q * b4;
    return { topic: 'Number', topicKey: 'number', prompt: a4 + ' \u00f7 ' + b4, answer: q, method: a4 + ' \u00f7 ' + b4 + ' = ' + q };
  }

  function qFractions(t) {
    var kind = pick(['toPercent', 'toDecimal', 'addLike', 'ofAmount']);
    var dens = t < 0.5 ? [2, 4, 5, 8, 10] : [3, 8, 16, 20, 25, 40];
    if (kind === 'toPercent') { var den = pick(dens), num = ri(1, den - 1); return { topic: 'Fractions', topicKey: 'fractions', prompt: 'Write ' + num + '/' + den + ' as a percentage.', answer: round(num / den * 100, 1), method: '(' + num + '\u00f7' + den + ') \u00d7 100 = ' + round(num / den * 100, 1) + '%' }; }
    if (kind === 'toDecimal') { var den2 = pick(dens), num2 = ri(1, den2 - 1); return { topic: 'Fractions', topicKey: 'fractions', prompt: 'Write ' + num2 + '/' + den2 + ' as a decimal (3 d.p. if needed).', answer: round(num2 / den2, 3), method: num2 + '\u00f7' + den2 + ' = ' + round(num2 / den2, 3) }; }
    if (kind === 'addLike') { var d = pick(dens); var n1 = ri(1, d - 2), n2 = ri(1, d - n1 - 1) || 1; return { topic: 'Fractions', topicKey: 'fractions', prompt: n1 + '/' + d + ' + ' + n2 + '/' + d + ' — what is the numerator of the answer (before simplifying)?', answer: n1 + n2, method: 'Same denominator, add numerators: ' + n1 + ' + ' + n2 + ' = ' + (n1 + n2) }; }
    var den3 = pick(dens), num3 = ri(1, den3 - 1), amount = ri(2, 20) * (t < 0.5 ? 4 : 12);
    return { topic: 'Fractions', topicKey: 'fractions', prompt: 'What is ' + num3 + '/' + den3 + ' of ' + amount + '?', answer: round(num3 / den3 * amount, 2), method: '(' + num3 + '\u00f7' + den3 + ') \u00d7 ' + amount + ' = ' + round(num3 / den3 * amount, 2) };
  }

  function qDecimals(t) {
    var dp = t < 0.4 ? 1 : (t < 0.75 ? 2 : 3);
    var kind = pick(['addsub', 'scale10', 'roundTo']);
    if (kind === 'addsub') {
      var a = round(ri(10, Math.round(lerp(99, 9999, t))) / 100, dp), b = round(ri(10, Math.round(lerp(99, 9999, t))) / 100, dp);
      var op = Math.random() < 0.5 ? '+' : '\u2212'; var ans = op === '+' ? round(a + b, dp) : round(Math.max(a, b) - Math.min(a, b), dp);
      var hi = Math.max(a, b), lo = Math.min(a, b);
      return { topic: 'Decimals', topicKey: 'decimals', prompt: (op === '+' ? (a + ' + ' + b) : (hi + ' \u2212 ' + lo)), answer: ans, method: 'Line up the decimal points, then ' + (op === '+' ? 'add' : 'subtract') + ': ' + ans };
    }
    if (kind === 'scale10') {
      var v = round(ri(10, 9999) / 100, 2), factor = pick([10, 100, 1000]), up = Math.random() < 0.5;
      var ans2 = up ? v * factor : v / factor;
      return { topic: 'Decimals', topicKey: 'decimals', prompt: v + (up ? ' \u00d7 ' : ' \u00f7 ') + factor, answer: round(ans2, 4), method: 'Move the decimal point ' + Math.log10(factor) + ' places ' + (up ? 'right' : 'left') + ': ' + round(ans2, 4) };
    }
    var v2 = round(ri(1000, 99999) / 1000 + Math.random(), 4), dp2 = pick([1, 2]);
    return { topic: 'Decimals', topicKey: 'decimals', prompt: 'Round ' + v2.toFixed(4) + ' to ' + dp2 + ' d.p.', answer: round(v2, dp2), method: 'Look at the next digit to decide whether to round up: ' + round(v2, dp2) };
  }

  function qNegatives(t) {
    var maxN = Math.round(lerp(12, 30, t));
    var kind = pick(['add', 'sub', 'mult', 'div']);
    if (kind === 'add') { var a = ri(-maxN, maxN), b = ri(-maxN, maxN); return { topic: 'Negative Numbers', topicKey: 'negatives', prompt: a + ' + (' + b + ')', answer: a + b, method: a + ' + (' + b + ') = ' + (a + b) }; }
    if (kind === 'sub') { var a2 = ri(-maxN, maxN), b2 = ri(-maxN, maxN); return { topic: 'Negative Numbers', topicKey: 'negatives', prompt: a2 + ' \u2212 (' + b2 + ')', answer: a2 - b2, method: 'Subtracting a negative flips the sign: ' + a2 + ' + ' + (-b2) + ' = ' + (a2 - b2) }; }
    if (kind === 'mult') { var a3 = ri(-12, -2), b3 = ri(2, 12) * (Math.random() < 0.5 ? -1 : 1); return { topic: 'Negative Numbers', topicKey: 'negatives', prompt: a3 + ' \u00d7 (' + b3 + ')', answer: a3 * b3, method: 'Same signs \u2192 positive, different signs \u2192 negative: ' + (a3 * b3) }; }
    var b4 = ri(2, 12), q = ri(2, 12) * (Math.random() < 0.5 ? -1 : 1), a4 = q * b4 * (Math.random() < 0.5 ? -1 : 1);
    var q2 = a4 / b4;
    return { topic: 'Negative Numbers', topicKey: 'negatives', prompt: a4 + ' \u00f7 ' + b4, answer: q2, method: a4 + ' \u00f7 ' + b4 + ' = ' + q2 };
  }

  function qAlgebra(t) {
    var kind = pick(['solve', 'solve', 'substitute', 'nthterm', 'simplify']);
    var maxC = Math.round(lerp(5, 15, t));
    if (kind === 'solve') {
      var x = ri(-maxC, maxC) || 2, a = ri(2, maxC), b = ri(-maxC, maxC);
      var c = a * x + b;
      var lhs = a + 'x' + (b >= 0 ? ' + ' + b : ' \u2212 ' + Math.abs(b));
      return { topic: 'Algebra', topicKey: 'algebra', prompt: 'Solve for x: ' + lhs + ' = ' + c, answer: x, method: lhs + ' = ' + c + ' \u2192 ' + a + 'x = ' + (c - b) + ' \u2192 x = ' + x };
    }
    if (kind === 'substitute') {
      var xv = ri(2, maxC), a2 = ri(2, 9), b2 = ri(1, 15);
      return { topic: 'Algebra', topicKey: 'algebra', prompt: 'If x = ' + xv + ', what is ' + a2 + 'x + ' + b2 + '?', answer: a2 * xv + b2, method: a2 + '(' + xv + ') + ' + b2 + ' = ' + (a2 * xv + b2) };
    }
    if (kind === 'nthterm') {
      var m = ri(2, 9), c3 = ri(-10, 10), n = ri(4, 12);
      var term = c3 >= 0 ? (m + 'n + ' + c3) : (m + 'n \u2212 ' + Math.abs(c3));
      return { topic: 'Algebra', topicKey: 'algebra', prompt: 'The nth term of a sequence is ' + term + '. What is the ' + n + 'th term?', answer: m * n + c3, method: m + '(' + n + ') ' + (c3 >= 0 ? '+ ' + c3 : '\u2212 ' + Math.abs(c3)) + ' = ' + (m * n + c3) };
    }
    var a3 = ri(2, 12), b3 = ri(2, 12), c4 = ri(1, 10);
    return { topic: 'Algebra', topicKey: 'algebra', prompt: 'Simplify ' + a3 + 'a + ' + b3 + 'a \u2212 ' + c4 + 'a — what is the coefficient of a?', answer: a3 + b3 - c4, method: a3 + ' + ' + b3 + ' \u2212 ' + c4 + ' = ' + (a3 + b3 - c4) };
  }

  function qGeometry(t) {
    var pool = t < 0.35 ? ['angleLine', 'angleLine', 'areaRect', 'perimRect'] : (t < 0.7 ? ['areaTri', 'areaRect', 'volCuboid', 'angleAround'] : ['circleArea', 'pythagoras', 'volCuboid', 'trigForward']);
    var kind = pick(pool);
    if (kind === 'angleLine') { var a = ri(20, 160); return { topic: 'Geometry', topicKey: 'geometry', prompt: 'Two angles on a straight line: one is ' + a + '\u00b0. What is the other?', answer: 180 - a, method: '180\u00b0 \u2212 ' + a + '\u00b0 = ' + (180 - a) + '\u00b0' }; }
    if (kind === 'angleAround') { var a2 = ri(60, 300), b2 = ri(30, Math.max(31, 359 - a2)); return { topic: 'Geometry', topicKey: 'geometry', prompt: 'Three angles around a point are ' + a2 + '\u00b0, ' + b2 + '\u00b0 and x. What is x?', answer: 360 - a2 - b2, method: '360\u00b0 \u2212 ' + a2 + '\u00b0 \u2212 ' + b2 + '\u00b0 = ' + (360 - a2 - b2) + '\u00b0' }; }
    if (kind === 'areaRect') { var l = ri(3, 20), w = ri(3, 20); return { topic: 'Geometry', topicKey: 'geometry', prompt: 'Area of a rectangle ' + l + 'cm \u00d7 ' + w + 'cm?', answer: l * w, method: l + ' \u00d7 ' + w + ' = ' + (l * w) + ' cm\u00b2' }; }
    if (kind === 'perimRect') { var l2 = ri(3, 20), w2 = ri(3, 20); return { topic: 'Geometry', topicKey: 'geometry', prompt: 'Perimeter of a rectangle ' + l2 + 'cm \u00d7 ' + w2 + 'cm?', answer: 2 * (l2 + w2), method: '2 \u00d7 (' + l2 + ' + ' + w2 + ') = ' + (2 * (l2 + w2)) + ' cm' }; }
    if (kind === 'areaTri') { var b3 = ri(4, 24), h = ri(3, 20); return { topic: 'Geometry', topicKey: 'geometry', prompt: 'Area of a triangle with base ' + b3 + 'cm and height ' + h + 'cm?', answer: round(0.5 * b3 * h, 1), method: '\u00bd \u00d7 ' + b3 + ' \u00d7 ' + h + ' = ' + round(0.5 * b3 * h, 1) + ' cm\u00b2' }; }
    if (kind === 'volCuboid') { var l3 = ri(2, 12), w3 = ri(2, 12), h2 = ri(2, 12); return { topic: 'Geometry', topicKey: 'geometry', prompt: 'Volume of a cuboid ' + l3 + ' \u00d7 ' + w3 + ' \u00d7 ' + h2 + ' cm?', answer: l3 * w3 * h2, method: l3 + ' \u00d7 ' + w3 + ' \u00d7 ' + h2 + ' = ' + (l3 * w3 * h2) + ' cm\u00b3' }; }
    if (kind === 'circleArea') { var r = ri(2, 15); return { topic: 'Geometry', topicKey: 'geometry', prompt: 'Area of a circle with radius ' + r + 'cm? (2 d.p., use \u03c0=3.14159)', answer: round(Math.PI * r * r, 2), method: '\u03c0r\u00b2 = 3.14159 \u00d7 ' + r + '\u00b2 = ' + round(Math.PI * r * r, 2) + ' cm\u00b2' }; }
    if (kind === 'pythagoras') { var a3b = ri(3, 15), b4 = ri(3, 15); var c = round(Math.sqrt(a3b * a3b + b4 * b4), 1); return { topic: 'Geometry', topicKey: 'geometry', prompt: 'Right triangle with legs ' + a3b + 'cm and ' + b4 + 'cm. Hypotenuse? (1 d.p.)', answer: c, method: '\u221a(' + a3b + '\u00b2+' + b4 + '\u00b2) = \u221a' + (a3b * a3b + b4 * b4) + ' = ' + c + ' cm' }; }
    var hyp = ri(10, 30), ang = pick([20, 30, 40, 45, 50, 60]);
    return { topic: 'Geometry', topicKey: 'geometry', prompt: 'Hypotenuse = ' + hyp + 'cm, angle = ' + ang + '\u00b0. Opposite side? (1 d.p.)', answer: round(hyp * Math.sin(ang * Math.PI / 180), 1), method: hyp + ' \u00d7 sin(' + ang + '\u00b0) = ' + round(hyp * Math.sin(ang * Math.PI / 180), 1) + ' cm' };
  }

  function qRatio(t) {
    var kind = pick(['simplify', 'share']);
    if (kind === 'simplify') {
      var g = ri(2, t < 0.5 ? 6 : 12), x = ri(1, 8), y = ri(1, 8);
      var a = g * x, b = g * y, d = gcd(a, b);
      return { topic: 'Ratio', topicKey: 'ratio', prompt: 'Simplify the ratio ' + a + ' : ' + b + ' — what is the first number?', answer: a / d, method: 'Divide both sides by ' + d + ': ' + (a / d) + ' : ' + (b / d) };
    }
    var p1 = ri(1, 7), p2 = ri(1, 7), total = (p1 + p2) * ri(2, t < 0.5 ? 8 : 20);
    var share = total / (p1 + p2);
    return { topic: 'Ratio', topicKey: 'ratio', prompt: '\u00a3' + total + ' is shared in the ratio ' + p1 + ':' + p2 + '. What is the larger share (\u00a3)?', answer: Math.max(p1, p2) * share, method: 'One part = ' + total + '\u00f7' + (p1 + p2) + ' = \u00a3' + share + '; larger share = ' + Math.max(p1, p2) + ' \u00d7 \u00a3' + share };
  }

  function qProbability(t) {
    var kind = t < 0.6 ? pick(['simple', 'not']) : pick(['simple', 'not', 'combined']);
    var red = ri(2, 8), blue = ri(2, 8), total = red + blue;
    if (kind === 'simple') return { topic: 'Probability', topicKey: 'probability', prompt: 'A bag has ' + red + ' red and ' + blue + ' blue balls. P(red) as a percentage? (1 d.p.)', answer: round(red / total * 100, 1), method: red + '\u00f7' + total + ' \u00d7 100 = ' + round(red / total * 100, 1) + '%' };
    if (kind === 'not') return { topic: 'Probability', topicKey: 'probability', prompt: 'A bag has ' + red + ' red and ' + blue + ' blue balls. P(NOT red) as a percentage? (1 d.p.)', answer: round(blue / total * 100, 1), method: '100% \u2212 P(red) = ' + round(blue / total * 100, 1) + '%' };
    var p = pick([2, 4, 5, 10]);
    return { topic: 'Probability', topicKey: 'probability', prompt: 'A fair coin is flipped twice. P(two heads) as a percentage?', answer: 25, method: '\u00bd \u00d7 \u00bd = \u00bc = 25%' };
  }

  function qStatistics(t) {
    var n = t < 0.5 ? 5 : 7;
    var list = []; for (var i = 0; i < n; i++) list.push(ri(1, t < 0.5 ? 20 : 50));
    var kind = pick(['mean', 'range', 'median']);
    if (kind === 'mean') { var sum = list.reduce(function (a, b) { return a + b; }, 0); return { topic: 'Statistics', topicKey: 'statistics', prompt: 'Find the mean of: ' + list.join(', '), answer: round(sum / n, 2), method: 'Sum = ' + sum + ', \u00f7 ' + n + ' values = ' + round(sum / n, 2) }; }
    if (kind === 'range') { return { topic: 'Statistics', topicKey: 'statistics', prompt: 'Find the range of: ' + list.join(', '), answer: Math.max.apply(null, list) - Math.min.apply(null, list), method: 'Highest \u2212 lowest = ' + Math.max.apply(null, list) + ' \u2212 ' + Math.min.apply(null, list) + ' = ' + (Math.max.apply(null, list) - Math.min.apply(null, list)) }; }
    var sorted = list.slice().sort(function (a, b) { return a - b; }); var mid = sorted[Math.floor(n / 2)];
    return { topic: 'Statistics', topicKey: 'statistics', prompt: 'Find the median of: ' + list.join(', '), answer: mid, method: 'Sorted: ' + sorted.join(', ') + ' \u2014 middle value = ' + mid };
  }

  function qProblemSolving(t) {
    var kind = pick(['shopping', 'rate', 'multistep']);
    var scale = t < 0.5 ? 1 : 2;
    if (kind === 'shopping') {
      var qty = ri(2, 5), price = ri(1, 6) * scale, extra = ri(2, 8) * scale;
      return { topic: 'Problem Solving', topicKey: 'problemsolving', prompt: qty + ' items at \u00a3' + price + ' each, plus a \u00a3' + extra + ' delivery fee. Total cost (\u00a3)?', answer: qty * price + extra, method: qty + ' \u00d7 \u00a3' + price + ' + \u00a3' + extra + ' = \u00a3' + (qty * price + extra) };
    }
    if (kind === 'rate') {
      var speed = ri(20, 70), hours = ri(2, 6);
      return { topic: 'Problem Solving', topicKey: 'problemsolving', prompt: 'A car travels at ' + speed + ' mph for ' + hours + ' hours. Distance (miles)?', answer: speed * hours, method: 'distance = speed \u00d7 time = ' + speed + ' \u00d7 ' + hours + ' = ' + (speed * hours) };
    }
    var a = ri(2, 6) * scale, b = ri(2, 6) * scale, c = ri(2, 6) * scale;
    return { topic: 'Problem Solving', topicKey: 'problemsolving', prompt: 'A school buys ' + a + ' boxes of ' + b + ' pencils. ' + c + ' pencils are damaged. How many good pencils remain?', answer: a * b - c, method: a + ' \u00d7 ' + b + ' \u2212 ' + c + ' = ' + (a * b - c) };
  }

  /* ---- MENTAL MATHS TRAINER (fast, small-number arithmetic) --------------- */
  function qMental() {
    var kind = pick(['times', 'times', 'add', 'sub', 'square', 'cube', 'double']);
    if (kind === 'times') { var a = ri(2, 12), b = ri(2, 12); return { topic: 'Mental Maths', topicKey: 'mental', prompt: a + ' \u00d7 ' + b, answer: a * b, method: a + '\u00d7' + b + '=' + (a * b) }; }
    if (kind === 'add') { var a2 = ri(10, 50), b2 = ri(10, 50); return { topic: 'Mental Maths', topicKey: 'mental', prompt: a2 + ' + ' + b2, answer: a2 + b2, method: a2 + '+' + b2 + '=' + (a2 + b2) }; }
    if (kind === 'sub') { var a3 = ri(20, 80), b3 = ri(5, a3); return { topic: 'Mental Maths', topicKey: 'mental', prompt: a3 + ' \u2212 ' + b3, answer: a3 - b3, method: a3 + '\u2212' + b3 + '=' + (a3 - b3) }; }
    if (kind === 'square') { var n = ri(2, 15); return { topic: 'Mental Maths', topicKey: 'mental', prompt: n + '\u00b2', answer: n * n, method: n + '\u00d7' + n + '=' + (n * n) }; }
    if (kind === 'cube') { var n2 = ri(2, 10); return { topic: 'Mental Maths', topicKey: 'mental', prompt: n2 + '\u00b3', answer: n2 * n2 * n2, method: n2 + '\u00d7' + n2 + '\u00d7' + n2 + '=' + (n2 * n2 * n2) }; }
    var n3 = ri(5, 90); return { topic: 'Mental Maths', topicKey: 'mental', prompt: 'Double ' + n3, answer: n3 * 2, method: n3 + '\u00d72=' + (n3 * 2) };
  }
  function generateMentalSet(n) { var out = []; for (var i = 0; i < n; i++) out.push(qMental()); return out; }

  /* ---- TOPIC REGISTRY (standalone "Practice a skill" cards, mid-tier) ---- */
  var GENERATORS = {
    times: qTimesTable, division: qDivision, percentages: qPercentage, calc: qCalc,
    fractions: function () { return qFractions(0.5); }, decimals: function () { return qDecimals(0.5); },
    negatives: function () { return qNegatives(0.5); }, algebra: function () { return qAlgebra(0.5); },
    geometry: function () { return qGeometry(0.5); }, ratio: function () { return qRatio(0.5); },
    probability: function () { return qProbability(0.5); }, statistics: function () { return qStatistics(0.5); },
    problemsolving: function () { return qProblemSolving(0.5); }
  };
  var TOPICS = [
    { key: 'times', label: 'Times Tables', desc: 'Instant recall, 2\u00d7 to 12\u00d7' },
    { key: 'division', label: 'Division', desc: 'Exact division & decimals' },
    { key: 'fractions', label: 'Fractions', desc: 'Convert, add & find fractions of amounts' },
    { key: 'decimals', label: 'Decimals', desc: 'Add, scale by 10/100/1000, round' },
    { key: 'percentages', label: 'Percentages', desc: 'Of, change & find-the-%' },
    { key: 'negatives', label: 'Negative Numbers', desc: 'Add, subtract, multiply & divide' },
    { key: 'algebra', label: 'Algebra', desc: 'Solve, substitute, sequences' },
    { key: 'geometry', label: 'Geometry', desc: 'Angles, area, volume & Pythagoras' },
    { key: 'ratio', label: 'Ratio', desc: 'Simplify & share amounts' },
    { key: 'probability', label: 'Probability', desc: 'Simple & combined events' },
    { key: 'statistics', label: 'Statistics', desc: 'Mean, median, range' },
    { key: 'problemsolving', label: 'Problem Solving', desc: 'Multi-step word problems' },
    { key: 'calc', label: 'Calculation Methods', desc: 'BIDMAS, negatives, rounding, fractions' }
  ];
  var ALL_LEVEL_TOPICS = ['times', 'division', 'fractions', 'decimals', 'percentages', 'negatives', 'algebra', 'geometry', 'ratio', 'probability', 'statistics', 'problemsolving'];

  function generate(topicKey) { var f = GENERATORS[topicKey]; return f ? f() : generateMixed(); }
  function generateMixed() { return pick([qTimesTable, qDivision, qPercentage, qCalc])(); }
  function generateSet(n) { var out = []; for (var i = 0; i < n; i++) out.push(generateMixed()); return out; }

  function checkAnswer(input, answer) {
    var v = parseFloat(String(input == null ? '' : input).trim().replace(',', '.'));
    return isFinite(v) && Math.abs(v - answer) < 0.05;
  }

  /* ---- 60-LEVEL TOPIC-BANDED LADDER --------------------------------------- */
  var LEVEL_BANDS = [
    { min: 1, max: 10, topics: ['number'] },
    { min: 11, max: 20, topics: ['fractions', 'decimals', 'percentages', 'negatives'] },
    { min: 21, max: 35, topics: ['algebra'] },
    { min: 36, max: 45, topics: ['geometry'] },
    { min: 46, max: 60, topics: ['mixed'] }
  ];
  var TOPIC_FNS = { number: qNumber, fractions: qFractions, decimals: qDecimals, negatives: qNegatives, percentages: function (t) { return t < 0.5 ? qPercentage() : qPercentageHard(); }, algebra: qAlgebra, geometry: qGeometry, ratio: qRatio, probability: qProbability, statistics: qStatistics, problemsolving: qProblemSolving, times: qTimesTable, division: function (t) { return t < 0.5 ? qDivision() : qDivisionHard(); } };

  function bandFor(level) { for (var i = 0; i < LEVEL_BANDS.length; i++) { var b = LEVEL_BANDS[i]; if (level >= b.min && level <= b.max) return b; } return LEVEL_BANDS[LEVEL_BANDS.length - 1]; }

  function generateForLevel(level) {
    level = Math.max(1, Math.min(60, level || 1));
    var band = bandFor(level);
    var t = band.max > band.min ? (level - band.min) / (band.max - band.min) : 1;
    var topicKey = band.topics[0] === 'mixed' ? pick(ALL_LEVEL_TOPICS) : pick(band.topics);
    var fn = TOPIC_FNS[topicKey] || qNumber;
    var tier = band.topics[0] === 'mixed' ? 1 : t;
    var q = fn(tier);
    q.level = level;
    return q;
  }
  var generateLevel = generateForLevel; // backward-compat alias
  function generateLevelSet(n, level) { var out = []; for (var i = 0; i < n; i++) out.push(generateForLevel(level)); return out; }
  function levelDurationMs(level) { return Math.round(lerp(10, 6, (Math.max(1, Math.min(60, level || 1)) - 1) / 59) * 60000); }
  function levelLabel(level) {
    if (level >= 50) return 'GCSE Ready'; if (level >= 40) return 'Advanced'; if (level >= 30) return 'Upper Intermediate';
    if (level >= 20) return 'Intermediate'; if (level >= 10) return 'Elementary'; return 'Beginner';
  }
  function gradeFromLevel(level) {
    if (level >= 56) return 9; if (level >= 51) return 8; if (level >= 46) return 7; if (level >= 40) return 6;
    if (level >= 33) return 5; if (level >= 26) return 4; if (level >= 18) return 3; if (level >= 10) return 2; return 1;
  }

  /* ---- PLACEMENT TEST ------------------------------------------------------ */
  function generatePlacementSet(n) {
    n = n || 16;
    var out = [];
    for (var i = 0; i < n; i++) { var level = Math.round(1 + (i / (n - 1)) * 59); out.push(generateForLevel(level)); }
    return out;
  }
  function levelFromScore(pct) { return Math.max(1, Math.min(60, Math.round((pct / 100) * 59) + 1)); }
  function strongestWeakest(breakdown) {
    var scored = (breakdown || []).filter(function (b) { return b.total > 0; }).map(function (b) { return { topic: b.topic, acc: b.ok / b.total }; });
    if (!scored.length) return { strongest: '', weakest: '', focusAreas: [] };
    scored.sort(function (a, b) { return b.acc - a.acc; });
    var strongest = scored[0].topic, weakest = scored[scored.length - 1].topic;
    var focusAreas = scored.slice().sort(function (a, b) { return a.acc - b.acc; }).slice(0, 3).map(function (s) { return s.topic; });
    return { strongest: strongest, weakest: weakest, focusAreas: focusAreas };
  }

  /* ---- FORMULA LIBRARY ------------------------------------------------------ */
  var FORMULAS = [
    { topic: 'Percentages', name: 'Percentage of an amount', formula: '(%\u00f7100) \u00d7 amount', when: 'Finding a % of a value, e.g. discounts or tax.', example: '15% of \u00a360 = (15\u00f7100)\u00d760 = \u00a39', tip: 'Turn the % into a decimal first (\u00f7100), then multiply.' },
    { topic: 'Percentages', name: 'Percentage change (multiplier)', formula: 'new = original \u00d7 (1 \u00b1 rate)', when: 'Increasing or decreasing by a percentage.', example: 'Increase \u00a380 by 25%: 80 \u00d7 1.25 = \u00a3100', tip: 'Increase \u2192 add to 1. Decrease \u2192 subtract from 1.' },
    { topic: 'Percentages', name: 'Reverse percentage', formula: 'original = final \u00f7 (1 \u00b1 rate)', when: 'You know the result after a % change and need the start value.', example: 'Price after 20% off is \u00a340: 40 \u00f7 0.8 = \u00a350', tip: 'Never just add the % back on to the final value \u2014 divide instead.' },
    { topic: 'Finance', name: 'Simple interest', formula: 'I = (P \u00d7 r \u00d7 t) \u00f7 100', when: 'Interest that doesn\u2019t compound \u2014 same amount added each year.', example: '\u00a3500 at 4% for 3 years: (500\u00d74\u00d73)\u00f7100 = \u00a360', tip: 'Total owed/owned = P + I.' },
    { topic: 'Finance', name: 'Compound interest', formula: 'A = P \u00d7 (1 + r\u00f7100)\u1d57', when: 'Interest that grows on top of previous interest each period.', example: '\u00a3500 at 4% for 3yrs: 500\u00d71.04\u00b3 \u2248 \u00a3562.43', tip: 'The exponent t is the number of time periods, not the rate.' },
    { topic: 'Geometry', name: 'Area of a rectangle', formula: 'A = length \u00d7 width', when: 'Any rectangle or square (l = w).', example: '8cm \u00d7 5cm = 40cm\u00b2', tip: 'Always double-check your units are the same before multiplying.' },
    { topic: 'Geometry', name: 'Area of a triangle', formula: 'A = \u00bd \u00d7 base \u00d7 height', when: 'Height must be perpendicular (at 90\u00b0) to the base.', example: 'base 10cm, height 6cm: \u00bd\u00d710\u00d76 = 30cm\u00b2', tip: 'Use the perpendicular height, not a slanted side.' },
    { topic: 'Geometry', name: 'Area of a circle', formula: 'A = \u03c0r\u00b2', when: 'Given the radius (or diameter \u00f7 2).', example: 'r=5cm: \u03c0\u00d75\u00b2 \u2248 78.5cm\u00b2', tip: 'If given the diameter, halve it first to get the radius.' },
    { topic: 'Geometry', name: 'Circumference of a circle', formula: 'C = 2\u03c0r = \u03c0d', when: 'Distance around a circle.', example: 'r=4cm: 2\u00d7\u03c0\u00d74 \u2248 25.1cm', tip: 'Use \u03c0d if you\u2019re given the diameter directly.' },
    { topic: 'Geometry', name: 'Volume of a cuboid', formula: 'V = length \u00d7 width \u00d7 height', when: 'Any box shape.', example: '4\u00d73\u00d72 = 24cm\u00b3', tip: 'Units are cubed \u2014 always write cm\u00b3, m\u00b3 etc.' },
    { topic: 'Geometry', name: 'Volume of a cylinder', formula: 'V = \u03c0r\u00b2h', when: 'Circular cross-section extended by a height.', example: 'r=3, h=10: \u03c0\u00d79\u00d710 \u2248 282.7cm\u00b3', tip: 'Find the circular area first, then multiply by height.' },
    { topic: 'Geometry', name: 'Pythagoras\u2019 theorem', formula: 'a\u00b2 + b\u00b2 = c\u00b2', when: 'Right-angled triangles \u2014 finding a missing side.', example: 'legs 3,4: c=\u221a(9+16)=\u221a25=5', tip: 'c is always the hypotenuse \u2014 the longest side, opposite the right angle.' },
    { topic: 'Trigonometry', name: 'SOHCAHTOA \u2014 sine', formula: 'sin(\u03b8) = opposite \u00f7 hypotenuse', when: 'You know/want the angle, opposite side and hypotenuse.', example: '\u03b8=30\u00b0, hyp=10: opp = 10\u00d7sin(30\u00b0)=5', tip: 'Label the sides relative to the angle you\u2019re using first.' },
    { topic: 'Trigonometry', name: 'SOHCAHTOA \u2014 cosine', formula: 'cos(\u03b8) = adjacent \u00f7 hypotenuse', when: 'You know/want the angle, adjacent side and hypotenuse.', example: '\u03b8=60\u00b0, hyp=8: adj=8\u00d7cos(60\u00b0)=4', tip: 'Adjacent is the side next to the angle (not the hypotenuse).' },
    { topic: 'Trigonometry', name: 'SOHCAHTOA \u2014 tangent', formula: 'tan(\u03b8) = opposite \u00f7 adjacent', when: 'Right triangles without the hypotenuse.', example: 'opp=5, adj=5: tan(\u03b8)=1 \u2192 \u03b8=45\u00b0', tip: 'Useful when the hypotenuse isn\u2019t given.' },
    { topic: 'Number', name: 'Speed, distance, time', formula: 'speed = distance \u00f7 time', when: 'Any motion problem.', example: '120 miles in 2hrs: 120\u00f72 = 60mph', tip: 'Rearrange for distance = speed\u00d7time, or time = distance\u00f7speed.' },
    { topic: 'Statistics', name: 'Mean', formula: 'mean = (sum of values) \u00f7 (number of values)', when: 'Finding the average of a data set.', example: '2,4,6,8: (2+4+6+8)\u00f74 = 5', tip: 'Count how many numbers you\u2019re dividing by \u2014 easy to miscount.' },
    { topic: 'Probability', name: 'Probability of an event', formula: 'P(event) = favourable outcomes \u00f7 total outcomes', when: 'Any single-event probability question.', example: '3 red out of 8 balls: P=3/8 = 37.5%', tip: 'Probabilities always range from 0 to 1 (or 0% to 100%).' },
    { topic: 'Ratio', name: 'Sharing in a ratio', formula: '1 part = total \u00f7 (sum of ratio parts)', when: 'Splitting an amount according to a ratio.', example: '\u00a360 in ratio 2:3 \u2192 1 part=\u00a312 \u2192 shares \u00a324, \u00a336', tip: 'Always check your shares add back up to the original total.' },
    { topic: 'Algebra', name: 'nth term of a linear sequence', formula: 'nth term = a + (n\u22121)d', when: 'Sequences that go up (or down) by the same amount each time.', example: '3,7,11,15\u2026: nth term = 4n\u22121', tip: 'd is the common difference between consecutive terms.' },
    { topic: 'Algebra', name: 'Quadratic formula', formula: 'x = (\u2212b \u00b1 \u221a(b\u00b2\u22124ac)) \u00f7 2a', when: 'Solving ax\u00b2+bx+c=0 when it won\u2019t factorise easily.', example: 'x\u00b2+5x+6=0 \u2192 x=\u22122 or x=\u22123', tip: 'Always check b\u00b2\u22124ac isn\u2019t negative before taking the square root.' }
  ];

  /* ---- QUICK TEST MODE ---------------------------------------------------- */
  var QT_TYPES = [
    { key: 'times', label: 'Times Tables' }, { key: 'division', label: 'Division' },
    { key: 'fractions', label: 'Fractions' }, { key: 'decimals', label: 'Decimals' },
    { key: 'percentages', label: 'Percentages' }, { key: 'negatives', label: 'Negative Numbers' },
    { key: 'algebra', label: 'Algebra' }, { key: 'geometry', label: 'Geometry' },
    { key: 'ratio', label: 'Ratio' }, { key: 'probability', label: 'Probability' },
    { key: 'statistics', label: 'Statistics' }, { key: 'problemsolving', label: 'Problem Solving' },
    { key: 'calc', label: 'Calculation Methods' }, { key: 'mixed', label: 'Mixed Maths Test' }
  ];
  var QT_DIFFICULTIES = ['Beginner', 'Intermediate', 'GCSE Foundation', 'GCSE Higher', 'Auto'];
  var QT_LENGTHS = [5, 10, 20, 50];
  var QT_TOPIC_KEYS = ['times', 'division', 'fractions', 'decimals', 'percentages', 'negatives', 'algebra', 'geometry', 'ratio', 'probability', 'statistics', 'problemsolving', 'calc'];
  function qtDifficultyToTier(diff) { return { Beginner: 1, Intermediate: 2, 'GCSE Foundation': 3, 'GCSE Higher': 4 }[diff] || 2; }
  function qtLevelToTier(level) { level = level || 1; if (level <= 15) return 1; if (level <= 30) return 2; if (level <= 45) return 3; return 4; }
  function qtTierToT(tier) { return { 1: 0.15, 2: 0.4, 3: 0.65, 4: 0.9 }[tier] || 0.4; }
  function qtQuestionForType(typeKey, tier) {
    var key = typeKey === 'mixed' ? pick(QT_TOPIC_KEYS) : typeKey;
    if (key === 'calc') return tier >= 3 ? qCalcHard() : qCalc();
    var fn = TOPIC_FNS[key];
    return fn ? fn(qtTierToT(tier)) : qNumber(qtTierToT(tier));
  }
  function buildQuickTest(typeKey, difficulty, length, userLevel) {
    var tier = difficulty === 'Auto' ? qtLevelToTier(userLevel || 1) : qtDifficultyToTier(difficulty);
    var out = []; for (var i = 0; i < (length || 10); i++) out.push(qtQuestionForType(typeKey, tier));
    return out;
  }
  function generateDailyChallenge(userLevel) {
    var tier = qtLevelToTier(userLevel || 1);
    var mix = ['times', 'fractions', 'percentages', 'algebra', 'geometry', 'problemsolving', 'ratio', 'statistics'];
    var out = []; for (var i = 0; i < 8; i++) out.push(qtQuestionForType(mix[i % mix.length], tier));
    return out;
  }

  root.LearningMaths = {
    generate: generate, generateMixed: generateMixed, generateSet: generateSet,
    generateMixedHard: generateMixedHard, generateSetHard: generateSetHard,
    generateLevel: generateLevel, generateForLevel: generateForLevel, generateLevelSet: generateLevelSet,
    generatePlacementSet: generatePlacementSet, generateMentalSet: generateMentalSet,
    levelDurationMs: levelDurationMs, levelLabel: levelLabel, gradeFromLevel: gradeFromLevel, levelFromScore: levelFromScore,
    strongestWeakest: strongestWeakest,
    gradeFromPct: gradeFromPct, gradeFromPctHard: gradeFromPctHard, checkAnswer: checkAnswer,
    TOPICS: TOPICS, FORMULAS: FORMULAS,
    QT_TYPES: QT_TYPES, QT_DIFFICULTIES: QT_DIFFICULTIES, QT_LENGTHS: QT_LENGTHS,
    buildQuickTest: buildQuickTest, generateDailyChallenge: generateDailyChallenge, levelToTier: qtLevelToTier,
    LESSONS: {
      times: {
        title: 'Times Tables',
        intro: 'Instant recall of multiplication facts (2\u00d7 to 12\u00d7) is the foundation for almost every other GCSE topic \u2014 percentages, ratio, algebra and division all get much faster once these are automatic.',
        origin: 'Times tables as a memorised grid trace back to ancient Babylonian mathematics (base-60 multiplication tables on clay tablets nearly 4,000 years old) and were formalised for schoolchildren in something close to their modern 12\u00d712 form in Tudor England, when 12 was a practical everyday number (12 pennies to a shilling, 12 inches to a foot) — which is also why the "12 times table" specifically, rather than stopping at 10, became the traditional target.',
        sections: [
          { heading: 'Why Automaticity Matters More Than Method', body: 'Multiplication facts are deliberately drilled to automatic recall (not just "figure-out-able") because every more advanced topic — long division, fractions, algebra, percentages — silently assumes instant access to these facts; working them out each time consumes so much working memory that it becomes hard to follow the actual new method being taught.' },
          { heading: 'The Grid Is Smaller Than It Looks', body: 'Commutativity (7\u00d73 = 3\u00d77) cuts the 12\u00d712 grid\u2019s effective size roughly in half, and patterns (\u00d710 adds a zero, \u00d75 is half of \u00d710, \u00d79 = \u00d710 minus the number) shrink the genuinely new facts to memorise down to a small "hard core" — typically just 6\u00d77, 6\u00d78, 7\u00d77, 7\u00d78 and 8\u00d78 once every shortcut is applied.' },
          { heading: 'Skip-Counting Bridges Counting to Multiplication', body: 'Skip-counting — counting in 7s to reach 7×8 — isn’t a babyish shortcut to abandon, it’s the genuine conceptual bridge from repeated addition to true multiplication fact recall; even fluent adults implicitly fall back on it for less-automatic facts like 7×8, which is exactly why it’s worth practising deliberately rather than skipping straight to memorisation.' },
          { heading: 'One Gap Slows Down Three Other Topics at Once', body: 'Weak fact recall rarely shows up labelled as a “times tables error” — it surfaces as unexplained slowness in division’s multiply-back check, in simplifying fractions (finding common factors), and in factorising algebra, since all three silently lean on instant multiplication recall without ever naming it as the skill being tested.' }
        ],
        misconceptions: [
          { myth: 'You need to learn 144 separate facts (12\u00d712).', reality: 'Commutativity and simple tricks (\u00d710, \u00d75, \u00d79) shrink the genuinely new facts to just a handful.' },
          { myth: 'Times tables stop mattering once you have a calculator.', reality: 'Nearly every later maths topic (fractions, algebra, ratio) assumes instant recall to avoid overloading working memory on the new method being learned.' },
          { myth: 'Skip-counting is a “babyish” method that should be abandoned as soon as possible.', reality: 'It’s the genuine conceptual bridge from repeated addition to true fact recall — even fluent adults implicitly fall back on it for the handful of facts that never became fully automatic.' }
        ],
        expertNotes: [
          'Maths teachers specifically drill the "hard core" facts (6-8 times tables) separately, since the easy ones (1,2,5,10) resolve almost automatically via pattern.',
          'Cognitive scientists note that automatised facts free up working memory for the actual new problem-solving step, not just speed.',
          'Fact-fluency gaps rarely show up as “times tables errors” on their own — they surface as unexplained slowness in division, fraction-simplifying and factorising, since all three silently lean on instant multiplication recall.'
        ],
        examples: [{ q: '9 \u00d7 6', working: 'Use the 9\u00d7 trick: 10\u00d76 \u2212 6 = 60 \u2212 6', answer: '54' }, { q: '8 \u00d7 8', working: 'Core fact to memorise directly', answer: '64' }, { q: '7 \u00d7 12', working: '7\u00d710 + 7\u00d72 = 70 + 14', answer: '84' }]
      },
      division: {
        title: 'Division',
        intro: 'GCSE division questions ask you to divide exactly, or to a given number of decimal places. The key method is short division \u2014 and always check your answer by multiplying back up.',
        origin: 'Long/short division as taught today was standardised alongside Hindu-Arabic numerals spreading through Europe from the 12th-15th centuries — before this numeral system (and its place-value structure) arrived from India via the Islamic world, division was a genuinely difficult specialist skill performed with Roman numerals or physical counting boards, not something an ordinary literate person could do on paper.',
        sections: [
          { heading: 'Why Short Division Works Digit-by-Digit', body: 'Short division exploits place value: dividing the leftmost digit(s) first and carrying the remainder into the next digit works because each digit\u2019s place value is exactly 10× the one to its right — this is precisely why the method breaks down (or needs adapting) in number systems without positional place value, like Roman numerals.' },
          { heading: 'The Multiply-Back Check Is a Genuine Error Catch', body: 'Multiplying your division answer back by the divisor and checking it returns the original number isn\u2019t just "showing your work" — it directly catches the single most common division error (a misplaced decimal point or a dropped digit), since an arithmetic slip in division almost never accidentally produces a result that reverses cleanly.' },
          { heading: 'Estimating First Catches Wildly Wrong Answers', body: 'Roughly estimating the answer’s size before dividing precisely — 150÷4 should land “around 35-40” — catches decimal-point and magnitude errors that the digit-by-digit method alone won’t flag, since short division has no built-in sense of whether its final answer is a sensible size; the estimate is the only genuine check on that.' },
          { heading: 'Division Is Multiplication Run Backwards', body: 'Every division fact is a multiplication fact viewed in reverse — 91÷7=13 is true precisely because 13×7=91 — which is why weak multiplication recall makes division feel far harder than it needs to: you’re not learning a genuinely new operation, you’re learning to run a familiar one back to front.' }
        ],
        misconceptions: [
          { myth: 'A remainder is always the "wrong" or incomplete answer.', reality: 'Whether to express a result as a remainder, decimal, or fraction depends entirely on the question\u2019s context — none is inherently more "finished" than another.' },
          { myth: 'Long/short division is an old-fashioned method calculators have made obsolete.', reality: 'It\u2019s specifically taught because it builds the place-value reasoning that underlies estimation and error-checking, skills a calculator can\u2019t provide.' },
          { myth: 'Division and multiplication are two separate skills needing separate practice.', reality: 'Every division fact is simply a multiplication fact viewed in reverse — strengthening one directly strengthens the other, so multiplication drilling pays off in division speed too.' }
        ],
        expertNotes: [
          'Maths teachers specifically require the multiply-back check because it catches decimal-placement errors calculators can\u2019t flag for you.',
          'Historians of mathematics point to Hindu-Arabic place-value numerals as the single innovation that made pen-and-paper division practical for ordinary people.',
          'Teachers push a rough estimate before the precise calculation specifically because short division has no built-in sense check — an estimate is the only thing that flags an answer that’s the wrong order of magnitude.'
        ],
        examples: [{ q: '91 \u00f7 7', working: '7 into 9 goes 1 remainder 2; 7 into 21 goes 3 \u2192 13', answer: '13' }, { q: '150 \u00f7 4', working: '4 into 15 goes 3 r3; 4 into 30 goes 7 r2; 4 into 20 goes 5 \u2192 37.5', answer: '37.5' }, { q: 'Check: 13 \u00d7 7', working: 'Multiply back up to confirm 91 \u00f7 7 = 13 was correct', answer: '91' }]
      },
      percentages: {
        title: 'Percentages',
        intro: 'Three GCSE percentage skills come up constantly: finding a percentage of an amount, increasing/decreasing by a percentage, and expressing one number as a percentage of another.',
        origin: '"Percent" comes from the Latin "per centum" (per hundred), and percentages became widespread specifically alongside the growth of commercial interest, tax and trade calculations in Renaissance Italy — merchants needed a STANDARDISED way to compare rates (interest, tax, profit margins) across different base amounts, which raw fractions with varying denominators made cumbersome.',
        sections: [
          { heading: 'Why the Multiplier Method Beats "Find It Then Add It"', body: 'Calculating a percentage increase by finding the amount then adding it separately (find 20% of £80, then add to £80) works but is slower and more error-prone than the multiplier method (£80 × 1.20 directly) — the multiplier method also extends immediately to REPEATED percentage changes (compound interest, population growth), where the "find then add" method breaks down entirely.' },
          { heading: 'Reverse Percentages Are Where Most Errors Happen', body: 'If a price of £40 already reflects a 20% discount, the original price is NOT found by adding 20% back onto £40 (that gives £48, which is wrong) — it\u2019s found by dividing by the multiplier that created it (£40 ÷ 0.80 = £50), because the 20% discount was taken off the ORIGINAL price, not off £40.' },
          { heading: 'A Percentage Is Just a Fraction With Denominator 100', body: 'Nothing conceptually new is happening in a percentage question — “15%” simply means 15/100, exactly the same kind of object as any other fraction — which is why fluency converting between fractions, decimals and percentages (see Fractions) makes percentages feel far more like one familiar idea wearing three outfits, rather than an entirely separate topic to relearn.' },
          { heading: 'Repeated Percentage Changes Compound, They Don’t Add', body: 'Two successive 10% increases do NOT combine to a flat 20% increase — the second 10% is taken from the already-larger amount, so £100 → £110 → £121, a 21% overall rise, not 20% — this compounding effect is exactly why the multiplier method (×1.10 twice, or ×1.10²) is essential once a question involves more than one change.' }
        ],
        misconceptions: [
          { myth: 'To reverse a 20% discount, just add 20% back onto the discounted price.', reality: 'You must DIVIDE by the original multiplier (÷0.80), not add 20% to the discounted price — adding gives a different, smaller number than the true original.' },
          { myth: 'Percentages over 100% don\u2019t make sense.', reality: 'Percentages above 100% are common and valid — e.g. a value can grow to 150% of its original size.' },
          { myth: 'Two successive 10% increases add up to a flat 20% increase overall.', reality: 'The second 10% is taken from the already-larger amount, so two 10% rises compound to 21%, not 20% — this is exactly why compound interest grows faster than simple interest over time.' }
        ],
        expertNotes: [
          'Finance professionals default to the multiplier method specifically because it extends cleanly to compound/repeated percentage changes, unlike find-then-add.',
          'Exam markers watch specifically for the reverse-percentage error (adding back instead of dividing), since it\u2019s one of the most common GCSE percentage mistakes.',
          'Finance professionals treat repeated percentage changes as always compounding by default, since treating them as simply additive is one of the most common and costly percentage errors outside the classroom too.'
        ],
        examples: [{ q: 'What is 15% of 60?', working: '(15 \u00f7 100) \u00d7 60 = 0.15 \u00d7 60', answer: '9' }, { q: 'Increase \u00a380 by 25%', working: 'Multiplier = 1.25 \u2192 80 \u00d7 1.25', answer: '\u00a3100' }, { q: '18 out of 40 as a percentage', working: '(18 \u00f7 40) \u00d7 100', answer: '45%' }]
      },
      fractions: {
        title: 'Fractions',
        intro: 'Fractions describe parts of a whole. GCSE questions focus on converting between fractions/decimals/percentages, adding fractions, and finding a fraction of an amount.',
        origin: 'Ancient Egyptian mathematics (c. 1650 BCE, per the Rhind Papyrus) used ONLY unit fractions (1/2, 1/3, 1/4...) and expressed any other fraction as a sum of distinct unit fractions — a genuinely different and more cumbersome system than the numerator/denominator notation used today, which developed later via Indian and then Arabic mathematics before reaching Europe.',
        sections: [
          { heading: 'Why You Need a Common Denominator to Add', body: 'Fractions can only be added directly when they represent parts of the SAME-sized whole (the same denominator) — 1/4 + 1/3 can\u2019t just combine numerators, because quarters and thirds are different-sized pieces; finding a common denominator (converting both to twelfths) makes the pieces the same size again before combining.' },
          { heading: 'Fraction-Decimal-Percentage Are One Idea, Three Notations', body: 'A fraction, its decimal form, and its percentage form all represent the exact same value — 3/4 = 0.75 = 75% — and fluently converting between all three (rather than treating them as separate topics) is what lets you pick whichever form is easiest for a given calculation.' },
          { heading: 'Simplifying Is Finding the Largest Shared Factor', body: 'Reducing 12/18 to 2/3 works by dividing both numerator and denominator by their highest common factor (6) in one step — dividing by a smaller shared factor first (like 2, giving 6/9) still eventually reaches the same simplest form, just via an extra step, which is why finding the HIGHEST common factor first is a shortcut, not a different answer.' },
          { heading: 'Multiplying Fractions Doesn’t Need a Common Denominator', body: 'Unlike addition, multiplying fractions (2/3 × 3/4) works by multiplying numerators together and denominators together directly, with no need to match denominators first — this trips students up specifically because it breaks the “match the denominators first” habit built for addition, even though that rule genuinely doesn’t apply here.' }
        ],
        misconceptions: [
          { myth: 'You can add fractions by just adding the numerators and denominators separately.', reality: 'Fractions need a common denominator first — adding denominators directly (like 1/2 + 1/3 = 2/5) is a common but definitely wrong shortcut.' },
          { myth: 'A fraction, decimal and percentage of the same value are three different things.', reality: 'They\u2019re three notations for the exact same value — 3/4, 0.75 and 75% are identical in size.' },
          { myth: 'You need a common denominator before multiplying two fractions together, just like when adding them.', reality: 'Multiplying fractions works by multiplying numerators together and denominators together directly — no matching required; that rule only applies to addition and subtraction.' }
        ],
        expertNotes: [
          'Maths teachers specifically flag "adding denominators" as the single most common fraction-addition error to unlearn.',
          'Fluency across fraction/decimal/percentage forms is treated as a core numeracy skill precisely because real-world data appears in all three forms interchangeably.',
          'Maths teachers flag “applying the addition rule to multiplication” as a specific, predictable error — students who’ve just mastered common-denominator addition often over-apply it to multiplication questions immediately after.'
        ],
        examples: [{ q: '3/4 as a percentage', working: '3\u00f74 = 0.75, \u00d7100 = 75%', answer: '75%' }, { q: '1/5 + 2/5', working: 'Same denominator: add numerators, 1+2=3', answer: '3/5' }, { q: '\u00be of 20', working: '20\u00f74 = 5, \u00d73 = 15', answer: '15' }]
      },
      decimals: {
        title: 'Decimals',
        intro: 'Decimals are another way to write fractions with denominators of 10, 100, 1000 etc. GCSE questions test place value, scaling by powers of 10, and rounding.',
        origin: 'Decimal notation (using a point to separate whole numbers from fractional parts) was popularised in Europe by Flemish mathematician Simon Stevin\u2019s 1585 pamphlet "De Thiende" ("The Tenth"), which argued decimals should replace the messy mix of fractions then used in commerce, science and land measurement — a genuinely late standardisation compared to how fundamental decimals feel today.',
        sections: [
          { heading: 'Why ×10 Moves the Point (Not "Adds a Zero")', body: 'Multiplying by 10 doesn\u2019t literally "add a zero" — it shifts every digit one place-value column to the left, which happens to look like adding a zero for whole numbers, but for decimals (3.45 × 10 = 34.5) reveals what\u2019s actually happening: each digit\u2019s value scales up by a factor of 10, and the decimal point\u2019s apparent position shifts as a result.' },
          { heading: 'Rounding Requires Only the Very Next Digit', body: 'Correct rounding only ever needs to check the SINGLE digit immediately after the rounding place (5 or above rounds up, below 5 rounds down) — a common error is looking at multiple following digits and getting confused, when the rule is strictly local to just the one next digit.' },
          { heading: 'Place Value Is the Same Idea Left and Right of the Point', body: 'Just as whole-number columns step up by ×10 moving left (units, tens, hundreds…), decimal columns step DOWN by ×10 moving right of the point (tenths, hundredths, thousandths…) — it’s the exact same place-value logic extended in both directions from a fixed centre, not a separate rule invented specifically for decimals.' },
          { heading: 'Trailing Zeros Don’t Change the Value', body: '3.4 and 3.40 represent the exact same value — the extra zero adds precision of expression (useful when recording a measurement to a stated accuracy) but changes nothing about the actual size of the number, which is why it’s always safe to add or drop trailing zeros after the last meaningful digit when comparing or simplifying decimals.' }
        ],
        misconceptions: [
          { myth: 'Multiplying by 10 means literally adding a zero to the end of the number.', reality: 'It shifts every digit one place-value column left — this looks like adding a zero for whole numbers but works differently once decimals are involved.' },
          { myth: 'To round a number, you should look at several following digits.', reality: 'Correct rounding only requires checking the single next digit after the rounding place.' },
          { myth: '3.4 and 3.40 are different numbers because 3.40 has more digits.', reality: 'They represent the exact same value — trailing zeros after the decimal point add no size, only a stated level of precision, and can be added or dropped freely when comparing numbers.' }
        ],
        expertNotes: [
          'Teachers specifically frame ×10/÷10 as "digits shift, point stays conceptually fixed" rather than "add/remove a zero," since the zero-based framing breaks down for decimals.',
          'Simon Stevin\u2019s original pamphlet argued decimals\u2019 main benefit was making commercial and scientific calculation faster and less error-prone than mixed fraction systems — still the core justification taught today.',
          'Teachers frame decimal place value as “the same columns idea, just extended past the point” rather than a new topic, since treating it as genuinely separate is what causes otherwise-confident whole-number students to stumble.'
        ],
        examples: [{ q: '3.45 \u00d7 100', working: 'Move the decimal point 2 places right', answer: '345' }, { q: '62.5 \u00f7 10', working: 'Move the decimal point 1 place left', answer: '6.25' }, { q: 'Round 5.678 to 1 d.p.', working: 'Next digit is 7 \u2192 round up', answer: '5.7' }]
      },
      negatives: {
        title: 'Negative Numbers',
        intro: 'Negative numbers appear in temperature, money and algebra questions. The key rules are about what happens when signs combine.',
        origin: 'Negative numbers were treated with deep suspicion for centuries even by prominent mathematicians — many 17th-18th century European mathematicians called them "fictitious" or "absurd" numbers, since a QUANTITY less than nothing seemed nonsensical; it took the development of the number line and consistent algebraic rules (formalised progressively through the 17th-19th centuries) for negative numbers to be accepted as fully legitimate, not just a convenient bookkeeping trick.',
        sections: [
          { heading: 'The Number Line Makes the Sign Rules Visual', body: 'Every negative-number rule has a direct number-line interpretation: adding moves right, subtracting moves left, and a negative number is simply "how far left of zero" — subtracting a negative (5 − (−3)) becomes "move left by a leftward amount," which flips back to moving right, visually explaining why it equals addition.' },
          { heading: 'Why Same-Signs-Positive Isn\u2019t Arbitrary', body: 'The multiplication sign rule (same signs → positive, different signs → negative) isn\u2019t an arbitrary convention — it\u2019s the ONLY rule consistent with the distributive law already established for positive numbers (e.g. it\u2019s required for expressions like -1×(2 + -2) to correctly equal zero either way you expand them), which is why mathematicians eventually had to accept it despite their earlier discomfort with negative numbers generally.' },
          { heading: 'Temperature and Money Give Negatives Real Meaning', body: 'Negative numbers stop feeling abstract once tied to a real reference point — −5°C is 5 degrees below freezing, and a −£40 balance is a £40 debt — which is exactly the everyday intuition (a real zero point, with meaningful values on both sides of it) that eventually convinced mathematicians negative numbers were legitimate, not just a bookkeeping trick.' },
          { heading: 'Two Negatives Multiplying Is Provable, Not Just a Rule to Trust', body: 'That a negative times a negative gives a positive can be shown to follow necessarily from patterns already accepted for positives — continuing the pattern −3×2=−6, −3×1=−3, −3×0=0 one more step to −3×(−1) forces the next result to be +3, since each step up by 1 in the second factor adds 3 to the answer.' }
        ],
        misconceptions: [
          { myth: 'Negative numbers were always considered a normal, obvious part of mathematics.', reality: 'Prominent mathematicians called them "fictitious" or "absurd" for centuries — full acceptance took until relatively modern mathematical history.' },
          { myth: 'The sign rules for multiplying negatives are just an arbitrary convention to memorise.', reality: 'They\u2019re the only rule consistent with distributive law already established for positive numbers — not arbitrary at all.' },
          { myth: 'Negative × negative = positive is just an arbitrary rule to memorise, with no real justification.', reality: 'It follows necessarily from patterns already accepted for positive numbers — continuing a sequence like −3×2, −3×1, −3×0 one more step forces −3×(−1) to equal +3, not by convention but by consistency.' }
        ],
        expertNotes: [
          'Maths teachers use the number line specifically because it converts an abstract sign rule into a visual, checkable movement.',
          'Historians of mathematics point to negative numbers\u2019 slow acceptance as a striking example of how "obvious" modern maths concepts were once genuinely controversial.',
          'Teachers use the “continue the pattern” demonstration specifically because it shows the sign rule is forced by consistency with rules students already trust, not an arbitrary extra fact bolted on top.'
        ],
        examples: [{ q: '\u22124 + (\u22123)', working: 'Both negative: add and keep negative', answer: '\u22127' }, { q: '5 \u2212 (\u22126)', working: 'Subtracting a negative = adding', answer: '11' }, { q: '\u22123 \u00d7 (\u22124)', working: 'Same signs \u2192 positive', answer: '12' }]
      },
      algebra: {
        title: 'Algebra',
        intro: 'Algebra uses letters to represent unknown or varying numbers. GCSE algebra covers solving equations, substituting values, simplifying expressions, and sequences.',
        origin: 'The word "algebra" comes from "al-jabr," part of the title of a 9th-century treatise by the Persian mathematician Al-Khwarizmi, who systematised methods for solving equations by "restoring" (al-jabr) a balance between two sides — the modern letter-based symbolic notation (x, y, using letters instead of written-out words for unknowns) is much more recent, largely developed by French mathematician François Viète in the 16th century.',
        sections: [
          { heading: 'Why "Same Operation to Both Sides" Always Works', body: 'Solving an equation by doing the same operation to both sides works because an equation is a claim of BALANCE — like a physical set of scales — and doing identical operations to both sides preserves that balance regardless of what the operation is, which is the single underlying principle behind every equation-solving method taught at GCSE and beyond.' },
          { heading: 'Letters Represent Fixed-But-Unknown, or Varying, Values', body: 'In an equation like 3x+5=20, x represents one specific fixed (but currently unknown) number to be found; in an nth-term formula like 4n−1, n represents a VARYING input you choose (n=1, 2, 3…) to generate different terms — the same letter notation covers two subtly different jobs, and confusing them is a common source of algebra mistakes.' },
          { heading: 'Simplifying Collects Like Terms, It Doesn’t Solve Anything', body: 'Simplifying an expression like 5a+3a−2a (giving 6a) and solving an equation like 5a+3=18 (giving a=3) are genuinely different tasks that look superficially similar — simplifying just tidies an expression into fewer terms, while solving finds the specific value that makes an equation true, and confusing the two is a common source of algebra mistakes.' },
          { heading: 'Sequences and Equations Use the Same Letters Differently', body: 'In an nth-term formula like 4n−1, plugging in n=1,2,3… generates a whole sequence of different outputs, while in an equation like 4x−1=15, x is one single specific value to be found — both use letter notation, but one describes a rule for generating many values and the other pins down exactly one.' }
        ],
        misconceptions: [
          { myth: 'Algebra letters always represent one single fixed unknown number.', reality: 'Sometimes a letter is a fixed unknown to solve for (as in an equation); sometimes it\u2019s a varying input you choose (as in a formula or sequence) — these are different roles.' },
          { myth: 'Al-Khwarizmi\u2019s algebra looked like modern x/y notation.', reality: 'His methods were written out in words, not symbols — modern letter notation is a much later development, primarily from the 16th century.' },
          { myth: 'Simplifying an expression and solving an equation are basically the same process.', reality: 'Simplifying tidies an expression into fewer terms (5a+3a−2a becomes 6a); solving finds the one specific value that makes an equation true — they answer different kinds of questions entirely.' }
        ],
        expertNotes: [
          'Maths teachers frame equation-solving explicitly as "preserving balance" (the scales metaphor) since it generalises to every type of equation encountered later.',
          'Historians of mathematics credit Viète\u2019s 16th-century notation as the shift that made algebra a truly general, symbolic tool rather than word-based case-by-case reasoning.',
          'Exam markers specifically look for students conflating “simplify” and “solve” instructions, since the two verbs call for genuinely different final answers — an expression versus a value.'
        ],
        examples: [{ q: 'Solve 3x + 5 = 20', working: '3x = 15 \u2192 x = 5', answer: '5' }, { q: 'If x=4, find 2x+3', working: '2(4)+3 = 8+3', answer: '11' }, { q: 'nth term 4n\u22121, find the 5th term', working: '4(5)\u22121 = 20\u22121', answer: '19' }]
      },
      geometry: {
        title: 'Geometry',
        intro: 'Geometry covers angles, area, perimeter, volume and right-angled triangles. Most questions are formula-based \u2014 knowing which formula to use is half the battle (see the Formula Library).',
        origin: 'Formal geometry as a system of proven, logically-derived rules (rather than just practical measurement recipes) traces to Euclid\u2019s "Elements" (c. 300 BCE), which built an entire system of geometric facts from a small set of starting axioms — Pythagoras\u2019 theorem specifically is far older than Pythagoras himself, with evidence of the same right-triangle relationship known and used by Babylonian and Egyptian surveyors over a thousand years earlier, though Pythagoras\u2019 school is credited with an early general PROOF of why it works for every right triangle, not just specific measured cases.',
        sections: [
          { heading: 'Why Angle Facts Are Provable, Not Just Observed', body: '"Angles on a straight line sum to 180°" isn\u2019t just an empirically observed pattern — it follows logically from the definition of a straight line itself (a straight angle IS 180° by definition), which is why these angle facts can be combined and chained together in geometric proofs, not just used as isolated measurement facts.' },
          { heading: 'Why Height Must Be Perpendicular in Area Formulas', body: 'The triangle area formula (½ × base × height) specifically requires the PERPENDICULAR height (measured at 90° to the base), not a slanted side — using a slanted side instead systematically overestimates the area, because the perpendicular distance is always the shortest distance from the opposite vertex to the base line.' },
          { heading: 'Perimeter and Area Answer Different Questions', body: 'Perimeter (the distance around a shape’s edge) and area (the space it covers) are measured in different units — cm versus cm² — precisely because they’re fundamentally different kinds of measurement, one-dimensional length versus two-dimensional space, and mixing up which formula answers which question is one of the most common early geometry errors.' },
          { heading: 'Volume Extends Area Into a Third Dimension', body: 'A cuboid’s volume (length×width×height) can be understood as its base area (length×width) extended upward by the height — the same “find the flat area, then extend it” logic applies to a cylinder’s volume too (πr² base area × height), which is why area and volume formulas across different shapes follow a genuinely shared underlying pattern.' }
        ],
        misconceptions: [
          { myth: 'Pythagoras discovered the relationship a²+b²=c² himself, from scratch.', reality: 'Babylonian and Egyptian surveyors used the same right-triangle relationship over a thousand years earlier — Pythagoras\u2019 school is credited with an early general proof of why it always holds.' },
          { myth: 'Any side of a triangle can be used as the "height" in the area formula.', reality: 'The height must specifically be perpendicular (90°) to the chosen base — a slanted side gives a systematically wrong, larger area.' },
          { myth: 'Perimeter and area measure basically the same thing about a shape.', reality: 'Perimeter is a one-dimensional length (cm) around the edge; area is a two-dimensional measure (cm²) of the space covered — confusing which formula answers which question is a very common early error.' }
        ],
        expertNotes: [
          'Mathematicians distinguish "knowing a pattern works" from "proving it always works" — Euclid\u2019s system of proof is precisely what separates ancient practical geometry from formal mathematics.',
          'Exam markers specifically check that students use perpendicular height in triangle area calculations, since using a slanted side is a common, systematic error.',
          'Exam markers watch specifically for mismatched units (writing cm instead of cm², or vice versa) as a quick signal that a student has confused perimeter with area, or area with volume.'
        ],
        examples: [{ q: 'Angles on a line: one is 65\u00b0, find the other', working: '180\u00b0 \u2212 65\u00b0', answer: '115\u00b0' }, { q: 'Area of a 8cm \u00d7 5cm rectangle', working: '8 \u00d7 5', answer: '40cm\u00b2' }, { q: 'Right triangle, legs 3cm & 4cm, find the hypotenuse', working: '\u221a(3\u00b2+4\u00b2) = \u221a25', answer: '5cm' }]
      },
      ratio: {
        title: 'Ratio',
        intro: 'A ratio compares two or more quantities. GCSE ratio questions ask you to simplify ratios and to share an amount according to a ratio.',
        origin: 'Ratio and proportion were central to ancient Greek mathematics — Euclid\u2019s "Elements" devotes an entire book to ratio theory, developed partly because the Greeks needed a rigorous way to compare quantities (like lengths) that couldn\u2019t always be expressed as a simple whole-number fraction of each other, a discovery (irrational ratios) that reportedly unsettled some ancient mathematicians who expected all quantities to be comparable as whole-number ratios.',
        sections: [
          { heading: 'A Ratio Describes Relative Size, Not Absolute Amount', body: 'A ratio like 2:3 says nothing about the actual quantities involved — it could describe 2kg:3kg or 200kg:300kg equally validly, which is exactly why simplifying (dividing by the highest common factor) doesn\u2019t lose any real information — it just expresses the same relative relationship in its clearest form.' },
          { heading: 'Sharing in a Ratio Is Really Unit-Finding', body: 'Splitting an amount by a ratio works by first finding what ONE "part" is worth (total ÷ total number of parts), then scaling that single-part value up by each ratio number — this "find one unit, then scale" logic is the same underlying method used across many proportion problems, not a technique unique to ratio-sharing alone.' },
          { heading: 'Ratio and Fraction Are Two Views of the Same Split', body: 'A 2:3 ratio and the fraction 2/5 describe the exact same division of a whole — in a 2:3 split there are 5 total parts, and the first quantity is 2/5 of the total — recognising ratio problems as fraction-of-a-total problems in disguise often makes them feel far more familiar than treating ratio as an unrelated new topic.' },
          { heading: 'Equivalent Ratios Work Exactly Like Equivalent Fractions', body: 'Multiplying or dividing every number in a ratio by the same value (2:3 → 4:6 → 6:9) preserves the exact same relative relationship, precisely mirroring how multiplying a fraction’s numerator and denominator by the same value gives an equivalent fraction — it’s the identical underlying rule, just applied to two or more numbers instead of one.' }
        ],
        misconceptions: [
          { myth: 'A ratio like 2:3 tells you the actual size of the quantities.', reality: 'A ratio only describes RELATIVE size — 2:3 could mean 2kg:3kg or 200kg:300kg equally.' },
          { myth: 'Simplifying a ratio changes what it represents.', reality: 'Simplifying just expresses the exact same relationship in its clearest form — no information is lost.' },
          { myth: 'Ratio is a totally separate topic from fractions, with its own unrelated rules.', reality: 'A ratio and a fraction can describe the exact same split of a whole — 2:3 means the same underlying relationship as the fraction 2/5 — and equivalent ratios follow the identical scaling rule as equivalent fractions.' }
        ],
        expertNotes: [
          'The "find one part, then scale" method taught for ratio-sharing is the same core logic used in many other proportion and scaling problems.',
          'Historians of mathematics note the ancient Greek discovery of irrational ratios (quantities with no whole-number ratio) as a genuinely destabilising moment in early mathematical thinking.',
          'Recognising a ratio question as a “fraction of a total” question in disguise is a genuine problem-solving shortcut, not just a teaching analogy — it converts an unfamiliar-feeling topic into one already well understood.'
        ],
        examples: [{ q: 'Simplify 12:18', working: 'HCF is 6: 12\u00f76=2, 18\u00f76=3', answer: '2:3' }, { q: 'Share \u00a360 in the ratio 2:3', working: '1 part = 60\u00f75 = \u00a312; shares = \u00a324 and \u00a336', answer: '\u00a324, \u00a336' }]
      },
      probability: {
        title: 'Probability',
        intro: 'Probability measures how likely an event is, from 0 (impossible) to 1 (certain). GCSE questions often express this as a fraction, decimal or percentage.',
        origin: 'Formal probability theory traces to a 1654 exchange of letters between Blaise Pascal and Pierre de Fermat, prompted by a gambler\u2019s question about how to fairly split stakes in an interrupted game of chance — this practical gambling problem is what launched probability as a mathematical field, not an abstract academic exercise, which is why so much foundational probability terminology and many classic examples still reference dice, cards and coins.',
        sections: [
          { heading: 'Why Probabilities Must Sum to 1', body: 'The probabilities of ALL possible outcomes of an event must add up to exactly 1 (100%), because "1" represents absolute certainty that SOME outcome occurs — this is why P(not event) = 1 − P(event) always works: the event and its opposite together cover every possibility, so their probabilities must sum to total certainty.' },
          { heading: 'Independent Events Multiply, Not Add', body: 'For two INDEPENDENT events (one doesn\u2019t affect the other, like two separate coin flips) both happening, you multiply their individual probabilities — this is because each possible outcome of the second event can pair with each possible outcome of the first, and multiplication (not addition) correctly counts all these combined possibilities.' },
          { heading: 'A Probability Tree Makes Combined Events Visible', body: 'For problems involving more than one event in sequence (drawing two balls, flipping a coin twice), sketching a tree diagram — branching into each possible outcome at every stage — turns an abstract multiplication rule into something you can see and count directly, which is why it’s taught as the default tool once a probability question involves two or more stages.' },
          { heading: 'Mutually Exclusive Events Add, Independent Events Multiply', body: 'These two rules are easy to mix up but answer different questions: P(A or B) for mutually exclusive events (can’t both happen, like rolling a 2 or a 5) is found by ADDING their probabilities, while P(A and B) for independent events (both happen, like two separate coin flips) is found by MULTIPLYING — “or” tends to add, “and” tends to multiply.' }
        ],
        misconceptions: [
          { myth: 'If something hasn\u2019t happened in a while, it\u2019s "due" to happen soon (the gambler\u2019s fallacy).', reality: 'For independent events (like coin flips), past outcomes have zero effect on future probability — each flip is exactly 50/50 regardless of history.' },
          { myth: 'To find the probability of two events both happening, you add their probabilities.', reality: 'For independent events, you MULTIPLY their probabilities, not add them.' },
          { myth: '“Or” and “and” probability questions are solved the same way.', reality: 'P(A or B) for mutually exclusive events is found by ADDING probabilities; P(A and B) for independent events is found by MULTIPLYING them — the connecting word is a genuine signal for which operation to use.' }
        ],
        expertNotes: [
          'Statisticians specifically name the "gambler\u2019s fallacy" as one of the most common and persistent probability misconceptions, even among otherwise numerate people.',
          'Probability theory\u2019s origin in a real gambling dispute (Pascal and Fermat, 1654) is often cited to show how practical problems can launch entire fields of mathematics.',
          'Teachers introduce tree diagrams specifically once a question involves two or more stages, since they convert the abstract “multiply along the branches” rule into outcomes a student can see and count directly.'
        ],
        examples: [{ q: '3 red, 5 blue balls: P(red)', working: '3 \u00f7 8', answer: '37.5%' }, { q: 'Same bag: P(not red)', working: '100% \u2212 37.5%', answer: '62.5%' }, { q: 'Coin flipped twice: P(two heads)', working: '\u00bd \u00d7 \u00bd', answer: '25%' }]
      },
      statistics: {
        title: 'Statistics',
        intro: 'Statistics summarises a set of data using averages (mean, median, mode) and spread (range). Each average tells you something different about the "typical" value.',
        origin: 'Modern statistics developed substantially in the 19th century, driven by state administrative needs (the word "statistics" itself derives from "state") — governments needed to summarise census, health and economic data for large populations, which created demand for compact numerical summaries (averages, spread) that could describe an entire population without listing every individual value.',
        sections: [
          { heading: 'Why Three Different "Averages" Exist', body: 'Mean, median and mode aren\u2019t redundant alternatives — they answer genuinely different questions: mean captures the overall total shared equally (sensitive to extreme values), median captures the true middle position (resistant to extreme values), and mode captures the single most common value (works even for non-numeric categories) — choosing the RIGHT one depends on what you actually want to know about the data.' },
          { heading: 'Why the Mean Is Vulnerable to Outliers', body: 'A single extreme value can drag the mean far from what feels "typical" — average income statistics are a classic real-world example, where a small number of extremely high earners pull the mean well above what a typical person actually earns, which is exactly why median income (not mean) is usually reported as the more representative national figure.' },
          { heading: 'A Small Range Doesn’t Guarantee a Reliable Average', body: 'Range only measures the gap between the highest and lowest values — it says nothing about how the OTHER values are distributed in between, so two data sets can share an identical range while one is tightly clustered near the mean and the other is scattered unevenly, which is why range alone is a crude, easily-misleading measure of spread.' },
          { heading: 'Averages Need Enough Data to Mean Anything', body: 'A mean, median or mode calculated from just two or three values can be wildly unrepresentative, since there’s barely enough data for a genuine “typical” pattern to emerge — this is exactly why real surveys and studies specify a minimum sample size, and why a small classroom data set is treated as a teaching example, not a reliable real-world conclusion.' }
        ],
        misconceptions: [
          { myth: 'Mean, median and mode are basically interchangeable "the average."', reality: 'They measure genuinely different things and can give very different answers, especially when a data set has extreme values.' },
          { myth: 'The mean is always the best or most accurate measure of "typical."', reality: 'For data with extreme outliers, the median is usually more representative — this is why household income is typically reported as a median, not a mean.' },
          { myth: 'A small range between the highest and lowest values means the data is generally reliable or consistent.', reality: 'Range only measures the gap between the two extreme values — it says nothing about how the values in between are spread, so a small range doesn’t guarantee the data clusters tightly around the average.' }
        ],
        expertNotes: [
          'Economists and statisticians default to median (not mean) for income and wealth data specifically because a small number of extreme earners would otherwise distort the picture.',
          'The word "statistics" derives from "state," reflecting the field\u2019s origin in government administrative data collection.',
          'Statisticians treat range as the crudest available spread measure precisely because it’s calculated from only two values in the whole data set — more informative spread measures (like standard deviation) use every value.'
        ],
        examples: [{ q: 'Mean of 2, 4, 6, 8', working: '(2+4+6+8)\u00f74 = 20\u00f74', answer: '5' }, { q: 'Median of 7, 2, 9, 4, 5', working: 'Sorted: 2,4,5,7,9 \u2014 middle value', answer: '5' }, { q: 'Range of 3, 12, 7, 20, 5', working: '20 \u2212 3', answer: '17' }]
      },
      problemsolving: {
        title: 'Problem Solving',
        intro: 'GCSE problem-solving questions combine several steps and often hide the numbers inside a real-world story. The skill is translating words into the right sequence of calculations.',
        origin: 'Word problems as a teaching device are genuinely ancient — Babylonian, Egyptian and Chinese mathematical texts from thousands of years ago all use real-world scenarios (dividing grain, sharing inheritance, measuring fields) to teach abstract calculation methods, on the theory (still applied today) that embedding maths in a concrete story helps learners see WHY a method matters, not just how to execute it mechanically.',
        sections: [
          { heading: 'The Real Skill Is Translation, Not Calculation', body: 'Multi-step word problems rarely require any single calculation harder than what\u2019s covered in other topics — the genuine difficulty is translating a written scenario into the correct SEQUENCE of calculations, which is a distinct skill from executing each calculation once you know what it should be, and is exactly why "read twice, identify what\u2019s known and what\u2019s asked" is taught as a first step before any arithmetic begins.' },
          { heading: 'Breaking Problems Into Sub-Goals', body: 'Complex problems become tractable by identifying an intermediate sub-goal — a value you can calculate immediately from the given information, which then unlocks the next step toward the final answer — this "work out what you CAN find first" strategy transfers across virtually every multi-step problem, regardless of the specific maths topic involved.' },
          { heading: 'Underline the Numbers, Circle the Question', body: 'A simple but genuinely effective first step on any multi-step word problem is physically marking the given numbers and circling exactly what’s being asked — this forces the translation-from-words step to happen deliberately and visibly, rather than trying to hold the whole scenario in working memory while also planning the calculation sequence at the same time.' },
          { heading: 'Check the Answer Against the Story, Not Just the Arithmetic', body: 'A calculation can be arithmetically correct yet still answer the WRONG question — finding the total cost when the question asked for change from £50, for instance — which is why the final check on a word problem should re-read the original question and confirm the answer actually addresses what was asked, not just re-check the sums.' }
        ],
        misconceptions: [
          { myth: 'A hard word problem must require an advanced calculation method.', reality: 'The difficulty is usually in TRANSLATING the scenario into the right steps, not in the calculations themselves, which are often simple once identified.' },
          { myth: 'You should try to solve a multi-step problem in one single calculation.', reality: 'Breaking it into smaller sub-goals — computing what you can find first — is the standard, more reliable strategy.' },
          { myth: 'Checking your work on a word problem just means re-doing the arithmetic to confirm it’s correct.', reality: 'A calculation can be arithmetically flawless yet still answer the wrong question — the real check is re-reading the original question and confirming the final answer actually addresses what was asked.' }
        ],
        expertNotes: [
          'Maths educators specifically teach "identify what you can calculate first" as a domain-general problem-solving strategy, not one tied to any specific topic.',
          'The use of real-world scenarios in maths teaching is documented across ancient Babylonian, Egyptian and Chinese texts, showing it\u2019s a very old and well-tested pedagogical approach.',
          'Maths educators specifically teach “underline the numbers, circle the question” as a first physical step, since it forces the translation-from-words stage to happen deliberately rather than being rushed or skipped under time pressure.'
        ],
        examples: [{ q: '3 items at \u00a32 each plus \u00a34 delivery', working: '3\u00d72=6, then +4', answer: '\u00a310' }, { q: 'Car at 60mph for 3 hours: distance?', working: 'speed \u00d7 time = 60\u00d73', answer: '180 miles' }]
      },
      calc: {
        title: 'Calculation Methods',
        intro: 'BIDMAS/order of operations, working with negatives, rounding and converting fractions are the mechanical building blocks underneath every other maths topic.',
        origin: 'The order-of-operations convention (BIDMAS/PEMDAS) was never formally "decreed" by any single mathematician — it emerged gradually through the 16th-19th centuries as algebraic notation became standardised, since mathematicians needed everyone to interpret an expression like "2+3×4" identically, without writing out every step in words each time.',
        sections: [
          { heading: 'BIDMAS Exists to Remove Ambiguity, Not Add Rules', body: 'Without an agreed order of operations, "2 + 3 × 4" would be genuinely ambiguous — is it (2+3)×4=20 or 2+(3×4)=14? BIDMAS isn\u2019t an arbitrary extra rule to memorise; it\u2019s the single convention that makes written mathematical expressions unambiguous across every textbook, calculator and mathematician worldwide.' },
          { heading: 'Brackets Signal "Calculate Me First" Explicitly', body: 'Brackets exist specifically to override the default BIDMAS order when a calculation genuinely needs to happen in a different sequence — this is why (2+3)×4 and 2+3×4 give different, both mathematically "correct" answers: they are genuinely different expressions, not two ways of writing the same sum.' },
          { heading: 'Fraction-Percentage Conversion Is BIDMAS in Disguise', body: 'Converting num/den to a percentage (÷ then ×100) is itself just an ordered sequence of operations — divide first, then multiply — which is why fluency with BIDMAS underpins not just multi-operation sums but every conversion and multi-step calculation elsewhere in the syllabus, even when a question doesn’t look like a classic “BIDMAS question.”' },
          { heading: 'Rounding Errors Compound Across Multiple Steps', body: 'Rounding too early in a multi-step calculation — rounding an intermediate result before using it in the next step — can shift the final answer noticeably, especially across several steps, which is why the standard advice is to carry full precision through every intermediate step and only round the very final answer, not each step along the way.' }
        ],
        misconceptions: [
          { myth: 'BIDMAS means you always calculate strictly left to right.', reality: 'BIDMAS specifies an ORDER OF OPERATION TYPES (brackets, then indices, then multiplication/division, then addition/subtraction) — not simply left-to-right reading order.' },
          { myth: 'Multiplication always happens before division (and addition before subtraction).', reality: 'Multiplication/division have equal priority (done left to right amongst themselves), as do addition/subtraction — neither pair has one consistently before the other.' },
          { myth: 'It’s fine to round intermediate results as you go through a multi-step calculation, as long as the final rounding is correct.', reality: 'Rounding early can shift the final answer noticeably once errors compound across several steps — the safer approach is to carry full precision through every intermediate step and round only the final answer.' }
        ],
        expertNotes: [
          'Maths teachers stress that M and D (and A and S) are equal-priority PAIRS done left-to-right, not strict M-then-D and A-then-S, since this is a very common student misconception.',
          'The order-of-operations convention had no single "inventor" — it standardised gradually as algebraic notation spread, precisely to remove genuine ambiguity in written expressions.',
          'Exam mark schemes specifically penalise premature rounding in multi-step questions, since compounded rounding error across several steps can shift a final answer enough to fall outside the accepted range.'
        ],
        examples: [{ q: '2 + 3 \u00d7 4', working: 'Multiply first: 3\u00d74=12, then 2+12', answer: '14' }, { q: '(2 + 3) \u00d7 4', working: 'Brackets first: 2+3=5, then 5\u00d74', answer: '20' }, { q: '10 \u2212 (\u22125)', working: 'Subtracting a negative = adding', answer: '15' }]
      }
    }
  };
})(window);
