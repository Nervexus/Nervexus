/* Hand-training exercise diagrams.
   =====================================================================================
   Drawn here rather than sourced, so there is no licence attached to anything shipped and
   nothing to fetch at runtime — these are inline SVG paths on a currentColor stroke, so
   they take the ink colour of whatever card they sit in and stay sharp at any size.

   The subject of every one of these is a hand, a forearm and a piece of equipment. Whole
   figures were tried first and are wrong for this: shrunk to chart size the hand — the only
   part that matters here — becomes four pixels.

   Style rules, so eighteen drawings look like one set:
     * viewBox 0 0 100 76, stroke 2, round caps and joins, no fill except solid weights.
     * A bar seen end-on is a circle. Fingers are four short strokes over it, the thumb one
       stroke under. That grip reads at 90px, which the realistic version did not.
     * Load is a filled shape. Anything filled is something heavy.
     * Motion is a single arrowed arc, never more than one per drawing. */
(function (root) {
  if (root.HandFigures) return;

  // --- shared pieces -------------------------------------------------------------------
  // Hand gripping a bar shown end-on at (x,y) with radius r.
  function grip(x, y, r) {
    var s = '<circle cx="' + x + '" cy="' + y + '" r="' + r + '"/>';
    for (var i = -1.5; i <= 1.5; i++) {
      var fx = x + i * 5.5;
      s += '<path d="M' + fx + ' ' + (y - r - 5) + ' q 2 ' + (r + 4) + ' 0 ' + (r * 2 + 8) + '"/>';
    }
    s += '<path d="M' + (x - r - 4) + ' ' + (y + 3) + ' q ' + (r + 2) + ' 7 ' + (r * 2 + 6) + ' 0"/>';
    return s;
  }
  // Forearm running up from a hand at (x,y).
  function armUp(x, y, len) {
    return '<path d="M' + (x - 7) + ' ' + y + ' L' + (x - 7) + ' ' + (y - len) + '"/>'
         + '<path d="M' + (x + 7) + ' ' + y + ' L' + (x + 7) + ' ' + (y - len) + '"/>';
  }
  function armDown(x, y, len) {
    return '<path d="M' + (x - 7) + ' ' + y + ' L' + (x - 7) + ' ' + (y + len) + '"/>'
         + '<path d="M' + (x + 7) + ' ' + y + ' L' + (x + 7) + ' ' + (y + len) + '"/>';
  }
  // A plate, seen edge-on.
  function plate(x, y, w, h) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="2" fill="currentColor" stroke="none"/>';
  }
  // Kettlebell with its handle top at (x,y).
  function kettlebell(x, y, s) {
    s = s || 1;
    return '<path d="M' + (x - 9 * s) + ' ' + (y + 10 * s) + ' q 0 -12 ' + (9 * s) + ' -12 q ' + (9 * s) + ' 0 ' + (9 * s) + ' 12" />'
         + '<path d="M' + (x - 12 * s) + ' ' + (y + 10 * s) + ' q -4 ' + (20 * s) + ' ' + (12 * s) + ' ' + (20 * s)
         + ' q ' + (16 * s) + ' 0 ' + (12 * s) + ' ' + (-20 * s) + ' z" fill="currentColor" stroke="none"/>';
  }
  function arc(d) { return '<path d="' + d + '" stroke-dasharray="3 3"/>'; }
  function head(d) { return '<path d="' + d + '" fill="currentColor" stroke="none"/>'; }

  var F = {};

  /* ---- hanging ---------------------------------------------------------------------- */
  F['hang'] =
    '<path d="M6 18 H94"/>' + grip(36, 18, 6) + grip(64, 18, 6) +
    armDown(36, 30, 30) + armDown(64, 30, 30);

  F['hang-one'] =
    '<path d="M6 18 H94"/>' + grip(50, 18, 6) + armDown(50, 30, 36);

  F['towel-hang'] =
    '<path d="M6 12 H94"/>' +
    '<path d="M42 12 q -3 24 -1 44 M58 12 q 3 24 1 44"/>' +
    '<path d="M41 56 l4 4 l4 -4 l4 4 l4 -4 l4 4"/>' +
    '<path d="M40 26 q 10 5 20 0 M40 33 q 10 5 20 0 M40 40 q 10 5 20 0"/>' +
    '<path d="M37 23 q 5 11 2 21"/>' +
    armDown(50, 46, 16);

  F['crimp'] =
    '<rect x="16" y="12" width="68" height="11" rx="2" fill="currentColor" stroke="none"/>' +
    '<path d="M36 23 v7 q0 5 5 5 M46 23 v8 q0 5 5 5 M56 23 v8 q0 5 5 5 M66 23 v7 q0 5 5 5"/>' +
    '<path d="M33 38 q 22 9 44 0"/>' +
    armDown(55, 42, 24);

  /* ---- holds ------------------------------------------------------------------------ */
  F['bar-hold'] =
    plate(10, 22, 8, 30) + plate(82, 22, 8, 30) + '<path d="M18 37 H82"/>' +
    grip(38, 37, 6) + grip(62, 37, 6) + armUp(38, 25, 18) + armUp(62, 25, 18);

  F['thickbar'] =
    '<circle cx="50" cy="40" r="17"/>' +
    '<path d="M35 26 q 4 16 1 26 M43 22 q 4 18 1 30 M51 21 q 4 19 1 31 M59 23 q 4 17 1 29"/>' +
    '<path d="M32 46 q 18 10 36 2"/>' + armUp(50, 18, 14);

  F['bottoms-up'] =
    kettlebell(50, 12, 1) +
    '<g transform="rotate(180 50 34)">' + kettlebell(50, 12, 1) + '</g>' +
    grip(50, 46, 6) + armDown(50, 58, 14);

  F['carry'] =
    '<circle cx="50" cy="12" r="6"/><path d="M50 18 V44"/>' +
    '<path d="M50 44 L42 68 M50 44 L58 68"/>' +
    '<path d="M40 22 V40 M60 22 V40"/>' +
    plate(31, 40, 18, 16) + plate(51, 40, 18, 16);

  /* ---- pinch & crush ---------------------------------------------------------------- */
  F['pinch'] =
    plate(38, 24, 10, 34) + plate(50, 24, 10, 34) +
    '<path d="M36 30 q -6 3 0 6 M36 40 q -6 3 0 6"/>' +
    '<path d="M62 28 q 7 3 0 6 M62 37 q 7 3 0 6 M62 46 q 7 3 0 6"/>' +
    armUp(49, 22, 14);

  F['gripper'] =
    '<path d="M26 12 L44 46 M74 12 L56 46"/>' +
    '<path d="M26 12 q 6 -4 12 0 M62 12 q 6 -4 12 0"/>' +
    '<circle cx="50" cy="54" r="9"/><circle cx="50" cy="54" r="4"/>' +
    '<path d="M6 16 H18 M94 16 H82"/>' +
    head('M18 12 l8 4 l-8 4 z') + head('M82 12 l-8 4 l8 4 z');

  F['ball'] =
    '<circle cx="50" cy="42" r="16"/>' +
    '<path d="M38 30 q 5 12 2 22 M46 27 q 5 13 2 24 M54 27 q 5 13 2 24 M62 30 q 4 12 1 22"/>' +
    armUp(50, 24, 14);

  /* ---- curls ------------------------------------------------------------------------ */
  F['kb-curl'] =
    '<path d="M2 16 H30"/><path d="M2 26 H30"/>' +
    '<path d="M30 16 q 10 0 10 9 q 0 9 -10 9"/>' +
    '<path d="M32 34 q 8 6 2 12 M42 33 q 9 6 3 13"/>' +
    '<path d="M40 44 q 0 -12 12 -12 q 12 0 12 12"/>' +
    '<path d="M36 44 q -6 26 16 26 q 22 0 16 -26 z" fill="currentColor" stroke="none"/>' +
    arc('M76 40 q 12 12 -2 22') + head('M70 62 l8 2 l-1 -9 z');

  F['bb-curl'] =
    '<path d="M2 16 H30"/><path d="M2 26 H30"/>' +
    '<path d="M30 16 q 10 0 10 9 q 0 9 -10 9"/>' +
    '<path d="M32 34 q 8 7 2 13 M42 33 q 9 7 3 14"/>' +
    '<circle cx="52" cy="54" r="13"/>' +
    plate(30, 46, 7, 17) + plate(67, 46, 7, 17) +
    '<path d="M37 54 H39 M65 54 H67"/>' +
    arc('M76 40 q 12 12 -2 22') + head('M70 62 l8 2 l-1 -9 z');

  F['wrist-curl'] =
    '<path d="M2 20 H32"/><path d="M2 30 H32"/>' +
    '<path d="M32 20 q 11 0 11 10 q 0 10 -11 10"/>' +
    '<path d="M34 40 q 8 7 2 13 M44 39 q 9 7 3 14"/>' +
    '<circle cx="54" cy="58" r="9"/>' +
    plate(36, 51, 7, 15) + plate(65, 51, 7, 15) +
    arc('M78 56 q 8 -16 -6 -20') + head('M74 32 l-2 9 l9 -3 z');

  F['roller'] =
    '<circle cx="50" cy="20" r="6"/><path d="M20 20 H44 M56 20 H80"/>' +
    grip(30, 20, 5) + grip(70, 20, 5) +
    '<path d="M50 26 q 3 12 0 22"/>' + plate(41, 48, 18, 14) +
    arc('M62 14 q 12 8 0 14');

  F['sledge'] =
    '<path d="M22 14 L78 50"/>' +
    '<rect x="8" y="4" width="26" height="16" rx="3" transform="rotate(32 21 12)" fill="currentColor" stroke="none"/>' +
    grip(76, 49, 6) + armDown(76, 60, 12) +
    arc('M12 30 q -4 16 10 22') + head('M18 54 l7 3 l-1 -9 z');

  /* ---- extension & recovery --------------------------------------------------------- */
  F['band-ext'] =
    '<path d="M30 46 q 20 8 40 0 q 2 -10 -2 -14 H32 q -4 4 -2 14 z"/>' +
    '<path d="M36 32 V16 M45 32 V12 M55 32 V12 M64 32 V16"/>' +
    '<ellipse cx="50" cy="16" rx="20" ry="6"/>' +
    arc('M22 14 H12 M78 14 H88') + head('M12 10 l-6 4 l6 4 z') + head('M88 10 l6 4 l-6 4 z');

  F['spread'] =
    '<path d="M32 52 q 18 8 36 0 q 2 -10 -2 -14 H34 q -4 4 -2 14 z"/>' +
    '<path d="M26 38 L14 26 M40 36 L34 16 M52 35 V12 M64 36 L70 16 M74 40 L86 28"/>' +
    '<path d="M14 26 q 36 -24 72 2"/>' +
    head('M10 22 l-5 6 l8 1 z') + head('M90 24 l5 6 l-8 1 z');

  F['rice'] =
    '<path d="M24 26 L30 68 H70 L76 26 Z"/>' +
    '<path d="M27 38 q 23 8 46 0"/>' +
    grip(50, 34, 6) + armUp(50, 22, 16);

  F['towel-wring'] =
    '<path d="M20 30 H80"/><path d="M20 48 H80"/>' +
    '<path d="M30 30 L44 48 M44 30 L58 48 M58 30 L72 48"/>' +
    grip(20, 39, 7) + grip(80, 39, 7) +
    arc('M12 24 q 12 -8 22 -1') + head('M32 19 l7 4 l-6 5 z') +
    arc('M88 54 q -12 8 -22 1') + head('M68 59 l-7 -4 l6 -5 z');

  root.HandFigures = F;
  if (typeof module !== 'undefined' && module.exports) module.exports = F;
})(typeof window !== 'undefined' ? window : this);
