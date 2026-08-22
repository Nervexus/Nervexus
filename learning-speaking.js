/* ============================================================================
   learning-speaking.js — Speaking practice engine for the Learning Centre.
   Curated Basic/Mid/High sentence tiers with a simplified stress-marked
   phonetic guide and delivery tips, plus lightweight text-similarity
   scoring used to check a spoken attempt (from the Web Speech API) against
   the target sentence. Consumed by the DC logic class via
   window.LearningSpeaking. Voice playback itself uses the app's existing
   VoiceEngine/voice-actor system — this file only supplies content.
   ============================================================================ */
(function (root) {
  'use strict';

  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(arr) { return arr[ri(0, arr.length - 1)]; }
  function shuffle(arr) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = ri(0, i); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  var TIERS = {
    Basic: [
      { text: 'Hello, how are you?', phonetic: 'heh-LOH, how ar YOO?', tip: 'Rising pitch on "you" — it\u2019s a genuine question, so let your voice lift at the end.' },
      { text: 'My name is Alex.', phonetic: 'my NAYM iz AL-ex.', tip: 'Stress your own name slightly — it\u2019s the new information in the sentence.' },
      { text: 'Can I have a coffee, please?', phonetic: 'kan eye hav a KOF-ee, pleez?', tip: 'Keep "please" soft and falling — it\u2019s polite, not a question in itself.' },
      { text: 'Where is the train station?', phonetic: 'WAIR iz thuh TRAYN stay-shun?', tip: 'Falling intonation at the end — this is a direct "wh-" question, not a yes/no one.' },
      { text: 'I would like to order this one.', phonetic: 'eye wood LIKE too OR-der this WUN.', tip: 'Slow down on "order this one" — point clearly with your voice, not just your hand.' },
      { text: 'What time is it, please?', phonetic: 'wot TIME iz it, pleez?', tip: 'Stress "time" — that\u2019s the key word you need an answer about.' },
      { text: 'Thank you very much.', phonetic: 'THANK yoo VER-ee much.', tip: 'Give equal weight to "thank you" and "very much" — don\u2019t rush the ending.' },
      { text: 'I don\u2019t understand.', phonetic: 'eye DOHNT un-der-STAND.', tip: 'Stress "don\u2019t" clearly so the negative isn\u2019t missed in fast speech.' },
      { text: 'Can you help me, please?', phonetic: 'kan yoo HELP mee, pleez?', tip: 'Rising tone on "help me" — a genuine request for assistance.' },
      { text: 'See you tomorrow!', phonetic: 'SEE yoo tuh-MOR-oh!', tip: 'Bright, upbeat tone — this is a friendly, casual goodbye.' }
    ],
    Mid: [
      { text: 'I\u2019ve been meaning to ask you something.', phonetic: 'eyev bin MEE-ning too ask yoo SUM-thing.', tip: 'Pause slightly before "something" — it builds anticipation for what follows.' },
      { text: 'Could you tell me how to get to the station?', phonetic: 'kood yoo TELL mee how too get too thuh STAY-shun?', tip: 'Softer, more formal tone than "where is" — this is a polite indirect question.' },
      { text: 'I\u2019m not entirely sure that\u2019s correct.', phonetic: 'eyem not en-TY-er-lee SHOOR thats kuh-REKT.', tip: 'Stress "entirely" to soften disagreement — a hedge that keeps the tone polite.' },
      { text: 'Would you mind if I opened the window?', phonetic: 'wood yoo MYND if eye OH-pend thuh WIN-doh?', tip: 'Gentle rising tone throughout — "would you mind" is a soft, polite request form.' },
      { text: 'On the other hand, there are some benefits.', phonetic: 'on thee UTH-er hand, thair ar sum BEN-ih-fits.', tip: 'Slight pause after "hand" — it signals you\u2019re introducing a contrasting point.' },
      { text: 'I was wondering if you could help me with this.', phonetic: 'eye wuz WUN-der-ing if yoo kood HELP mee with this.', tip: 'Keep the whole phrase smooth and unhurried — this is a longer, softer request.' },
      { text: 'That\u2019s a really good point, actually.', phonetic: 'thats a REE-lee good POYNT, AK-shoo-uh-lee.', tip: 'Stress "really" and "point" — "actually" trails off quietly at the end.' },
      { text: 'I appreciate you taking the time.', phonetic: 'eye uh-PREE-shee-ayt yoo TAY-king thuh TYME.', tip: 'Warm, sincere tone — slow down slightly on "appreciate".' },
      { text: 'Let me know if that works for you.', phonetic: 'let mee NOH if that WERKS for yoo.', tip: 'Falling tone at the end — a friendly statement, not really a question.' },
      { text: 'I think we should look at this differently.', phonetic: 'eye think wee shood LOOK at this DIF-er-ent-lee.', tip: 'Stress "differently" — it\u2019s the key new idea you\u2019re proposing.' }
    ],
    High: [
      { text: 'I would really appreciate it if you could clarify that point.', phonetic: 'eye wood REE-lee uh-PREE-shee-ayt it if yoo kood KLAIR-if-eye that POYNT.', tip: 'Formal register — keep pace measured and even; stress "appreciate" and "clarify".' },
      { text: 'Despite the setbacks, we managed to finish on time.', phonetic: 'dih-SPYTE thuh SET-baks, wee MAN-ijd too FIN-ish on TYME.', tip: 'Slight pause after "setbacks" — it sets up the contrast with the positive outcome.' },
      { text: 'Had I known earlier, I would have acted differently.', phonetic: 'had eye NOHN EER-lee-er, eye wood hav AK-ted DIF-er-ent-lee.', tip: 'This is a hypothetical (third conditional) — keep an even, slightly reflective tone throughout.' },
      { text: 'It\u2019s not so much the cost as the inconvenience.', phonetic: 'its not soh much thuh KOST az thee in-kun-VEEN-yens.', tip: 'Stress "cost" and "inconvenience" equally — the sentence is balancing two ideas.' },
      { text: 'I couldn\u2019t agree more with what you\u2019ve just said.', phonetic: 'eye KOOD-ent uh-GREE mor with wot yoove just SED.', tip: 'Strong stress on "couldn\u2019t" and "more" — this is an emphatic, enthusiastic agreement.' },
      { text: 'Notwithstanding the criticism, the plan proceeded.', phonetic: 'not-with-STAN-ding thuh KRIT-ih-siz-um, thuh PLAN pruh-SEE-ded.', tip: 'Formal connective "notwithstanding" — pause briefly after it before continuing.' },
      { text: 'I\u2019d rather you didn\u2019t mention this to anyone else.', phonetic: 'eyed RATH-er yoo DID-ent MEN-shun this too EN-ee-wun ELS.', tip: 'Stress "rather" and "anyone else" — a firm but polite preference.' },
      { text: 'Frankly speaking, the results speak for themselves.', phonetic: 'FRANK-lee SPEE-king, thuh ree-ZULTS speek for them-SELVZ.', tip: 'Confident, direct tone — "frankly" signals you\u2019re being candid.' },
      { text: 'Given the circumstances, I think we handled it well.', phonetic: 'GIV-en thuh SER-kum-stan-siz, eye think wee HAN-dld it WELL.', tip: 'Slight rise then fall — acknowledging difficulty, then a confident conclusion.' },
      { text: 'It goes without saying that preparation is essential.', phonetic: 'it gohz with-OUT SAY-ing that prep-uh-RAY-shun iz ih-SEN-shul.', tip: 'Stress "essential" strongly — it\u2019s the emphatic point of the whole sentence.' }
    ]
  };

  function getTier(tier) { return TIERS[tier] || TIERS.Basic; }
  function getSentence(tier, idx) { var list = getTier(tier); return list[Math.max(0, Math.min(list.length - 1, idx || 0))]; }
  function tierCount(tier) { return getTier(tier).length; }

  function normalize(s) { return (s || '').toLowerCase().replace(/[^a-z0-9' ]/g, '').replace(/\s+/g, ' ').trim(); }
  function wordOverlapScore(target, heard) {
    var t = normalize(target).split(' ').filter(Boolean);
    var h = normalize(heard).split(' ').filter(Boolean);
    if (!t.length) return 0;
    var hSet = {}; h.forEach(function (w) { hSet[w] = (hSet[w] || 0) + 1; });
    var hits = 0;
    t.forEach(function (w) { if (hSet[w] > 0) { hits++; hSet[w]--; } });
    return Math.round((hits / t.length) * 100);
  }
  function scoreAttempt(target, heard) {
    var pct = wordOverlapScore(target, heard);
    var verdict = pct >= 85 ? 'excellent' : pct >= 60 ? 'good' : pct >= 35 ? 'close' : 'retry';
    var label = { excellent: 'Excellent — spot on!', good: 'Good — very close!', close: 'Close — a few words were off.', retry: 'Not quite — give it another go.' }[verdict];
    return { pct: pct, verdict: verdict, label: label };
  }

  /* ---- LEVEL SYSTEM (1-60: Basic 1-20, Mid 21-40, High 41-60) -------------- */
  var BAND_OF = { Basic: [1, 20], Mid: [21, 40], High: [41, 60] };
  function pseudoLevels(tier) {
    var list = getTier(tier), band = BAND_OF[tier], span = band[1] - band[0];
    return list.map(function (e, i) { return { entry: e, level: Math.round(band[0] + (i / (list.length - 1)) * span) }; });
  }
  var ALL_LEVELED = [].concat(pseudoLevels('Basic'), pseudoLevels('Mid'), pseudoLevels('High'));
  function tierForLevel(level) { if (level <= 20) return 'Basic'; if (level <= 40) return 'Mid'; return 'High'; }
  function mcFromSentence(item, pool) {
    var distractors = shuffle(pool.filter(function (p) { return p !== item; })).slice(0, 3).map(function (p) { return p.entry.tip; });
    var options = shuffle([item.entry.tip].concat(distractors));
    return { type: 'mc', topic: tierForLevel(item.level) + ' Delivery', level: item.level, prompt: 'What is the best delivery tip for: \u201c' + item.entry.text + '\u201d?', options: options, answer: item.entry.tip, method: item.entry.phonetic };
  }
  var _rot = {};
  function rr(key, arr) {
    var st = _rot[key];
    if (!st || st.i >= st.order.length || st.order.length !== arr.length) { st = { order: shuffle(arr.map(function (_, i) { return i; })), i: 0 }; _rot[key] = st; }
    return arr[st.order[st.i++]];
  }
  function generateForLevel(level) {
    level = Math.max(1, Math.min(60, level || 1));
    var near = ALL_LEVELED.slice().sort(function (a, b) { return Math.abs(a.level - level) - Math.abs(b.level - level); });
    var item = rr('all', near);
    return mcFromSentence(item, ALL_LEVELED);
  }
  function generateLevelSet(n, level) { var out = []; for (var i = 0; i < n; i++) out.push(generateForLevel(level)); return out; }
  function levelLabel(level) { if (level >= 50) return 'Fluent'; if (level >= 40) return 'Advanced'; if (level >= 30) return 'Upper Intermediate'; if (level >= 20) return 'Intermediate'; if (level >= 10) return 'Elementary'; return 'Beginner'; }
  function gradeFromLevel(level) { if (level >= 56) return 9; if (level >= 51) return 8; if (level >= 46) return 7; if (level >= 40) return 6; if (level >= 33) return 5; if (level >= 26) return 4; if (level >= 18) return 3; if (level >= 10) return 2; return 1; }
  function generatePlacementSet(n) { n = n || 16; var out = []; for (var i = 0; i < n; i++) { var level = Math.round(1 + (i / (n - 1)) * 59); out.push(generateForLevel(level)); } return out; }
  function levelFromScore(pct) { return Math.max(1, Math.min(60, Math.round((pct / 100) * 59) + 1)); }
  function strongestWeakest(breakdown) {
    var scored = (breakdown || []).filter(function (b) { return b.total > 0; }).map(function (b) { return { topic: b.topic, acc: b.ok / b.total }; });
    if (!scored.length) return { strongest: '', weakest: '', focusAreas: [] };
    scored.sort(function (a, b) { return b.acc - a.acc; });
    var strongest = scored[0].topic, weakest = scored[scored.length - 1].topic;
    var focusAreas = scored.slice().sort(function (a, b) { return a.acc - b.acc; }).slice(0, 3).map(function (s) { return s.topic; });
    return { strongest: strongest, weakest: weakest, focusAreas: focusAreas };
  }

  /* ---- QUICK TEST ------------------------------------------------------------ */
  var QT_TYPES = [{ key: 'Basic', label: 'Basic Sentences' }, { key: 'Mid', label: 'Mid-Level Sentences' }, { key: 'High', label: 'High-Level Sentences' }, { key: 'mixed', label: 'Mixed Speaking Test' }];
  var QT_DIFFICULTIES = ['Beginner', 'Intermediate', 'GCSE Foundation', 'GCSE Higher', 'Auto'];
  var QT_LENGTHS = [5, 10, 20, 50];
  function qtDifficultyToTier(diff) { return { Beginner: 1, Intermediate: 2, 'GCSE Foundation': 3, 'GCSE Higher': 4 }[diff] || 2; }
  function qtLevelToTier(level) { level = level || 1; if (level <= 15) return 1; if (level <= 30) return 2; if (level <= 45) return 3; return 4; }
  function qtTierToLevel(tier) { return { 1: 8, 2: 23, 3: 38, 4: 52 }[tier] || 23; }
  function qtQuestionForType(typeKey, tier) {
    var level = qtTierToLevel(tier);
    if (typeKey === 'mixed' || typeKey === 'Basic' || typeKey === 'Mid' || typeKey === 'High') {
      if (typeKey !== 'mixed') { var pool = pseudoLevels(typeKey); var item = pick(pool); return mcFromSentence(item, ALL_LEVELED); }
      return generateForLevel(level);
    }
    return generateForLevel(level);
  }
  function buildQuickTest(typeKey, difficulty, length, userLevel) {
    var tier = difficulty === 'Auto' ? qtLevelToTier(userLevel || 1) : qtDifficultyToTier(difficulty);
    var out = []; for (var i = 0; i < (length || 10); i++) out.push(qtQuestionForType(typeKey, tier));
    return out;
  }
  function generateDailyChallenge(userLevel) {
    var tier = qtLevelToTier(userLevel || 1);
    var out = []; var mix = ['Basic', 'Mid', 'High']; for (var i = 0; i < 8; i++) out.push(qtQuestionForType(mix[i % mix.length], tier));
    return out;
  }
  function checkAnswer(q, input) {
    var norm = function (s) { return (s || '').toLowerCase().trim().replace(/[^a-z0-9 ]/g, ''); };
    return norm(input) === norm(q.answer);
  }

  var FORMULAS = [
    { topic: 'Intonation', name: 'Yes/No questions', formula: 'Rising pitch at the end', when: 'Direct yes/no questions (Can you..? Are you..?).', example: '"Can I have a coffee, please?" \u2014 voice rises on "please".', tip: 'Rising tone signals you genuinely expect an answer.' },
    { topic: 'Intonation', name: '"Wh-" questions', formula: 'Falling pitch at the end', when: 'Questions starting with what/where/when/why/how.', example: '"Where is the train station?" \u2014 falls on "station".', tip: 'Wh-questions sound more natural falling, unlike yes/no questions.' },
    { topic: 'Intonation', name: 'Statements & requests', formula: 'Falling pitch to sound confident and complete', when: 'Any declarative sentence or polite request.', example: '"Let me know if that works for you." falls at the end.', tip: 'A rise at the end of a statement can make it sound uncertain.' },
    { topic: 'Stress', name: 'Content vs function words', formula: 'Stress nouns/verbs/adjectives; keep articles/prepositions light', when: 'Any sentence \u2014 natural rhythm depends on this contrast.', example: '"I WANT to SEE the MOVIE" \u2014 "to" and "the" stay unstressed.', tip: 'This contrast is what gives English its natural rhythm.' },
    { topic: 'Stress', name: 'New information stress', formula: 'Stress the new or most important word', when: 'Answering a question or introducing new information.', example: '"My name is ALEX" \u2014 stress falls on the new information.', tip: 'Already-known information is said more quietly and quickly.' },
    { topic: 'Register', name: 'Formal vs informal tone', formula: 'Formal: slower, even pace | Informal: faster, more pitch variation', when: 'Matching your delivery to the situation.', example: '"I would appreciate it if..." (formal, measured) vs "Thanks so much!" (informal, upbeat).', tip: 'Match your pace and pitch range to how formal the words themselves are.' },
    { topic: 'Fluency', name: 'Linking sounds', formula: 'Consonant + vowel across words often blend together', when: 'Speaking at natural, connected speed.', example: '"turn_it_off" sounds like "tur-ni-toff".', tip: 'Native speed comes from linking, not speaking each word separately.' }
  ];

  root.LearningSpeaking = {
    TIERS: ['Basic', 'Mid', 'High'],
    getTier: getTier, getSentence: getSentence, tierCount: tierCount,
    scoreAttempt: scoreAttempt, normalize: normalize,
    generateForLevel: generateForLevel, generateLevelSet: generateLevelSet, generatePlacementSet: generatePlacementSet,
    levelLabel: levelLabel, gradeFromLevel: gradeFromLevel, levelFromScore: levelFromScore, strongestWeakest: strongestWeakest,
    QT_TYPES: QT_TYPES, QT_DIFFICULTIES: QT_DIFFICULTIES, QT_LENGTHS: QT_LENGTHS,
    buildQuickTest: buildQuickTest, generateDailyChallenge: generateDailyChallenge, levelToTier: qtLevelToTier,
    checkAnswer: checkAnswer, FORMULAS: FORMULAS
  };
})(window);
